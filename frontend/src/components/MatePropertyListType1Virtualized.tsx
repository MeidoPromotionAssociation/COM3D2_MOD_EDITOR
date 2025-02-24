// MatePropertyListType1Virtualized.tsx
import React, {FC, useEffect, useLayoutEffect, useMemo, useRef} from "react";
import {ListChildComponentProps, VariableSizeList} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import {Button, Divider} from "antd";
import {DeleteOutlined} from "@ant-design/icons";

import MatePropertyItemType1 from "./MatePropertyItemType1";
import {t} from "i18next";

interface FieldItem {
    key: number;       // field.key
    name: number;      // field.name
}

// 分组后扁平化出来的列表项类型
type MyListItem =
    | {
    type: "group";          // 分组头
    propType: string;       // 分组名称
}
    | {
    type: "property";       // 具体属性条目
    field: any;            // 原 FormList 的 field
};

interface VirtualizedPropertyListProps {
    fields: any[];
    remove: (index: number) => void;
    form: any;
}

/**
 * 带分组 + 虚拟滚动的 Property 列表
 */
const MatePropertyListType1Virtualized: FC<VirtualizedPropertyListProps> = ({
                                                                                fields,
                                                                                remove,
                                                                                form,
                                                                            }) => {

    // 用来缓存各行的实际高度
    const listRef = useRef<VariableSizeList>(null);
    const rowHeights = useRef<Record<number, number>>({});

    // -------------------------
    // 1) 先按 propType 分组
    // -------------------------
    const grouped = useMemo(() => {
        const result: Record<string, any[]> = {};
        fields.forEach((field) => {
            const propType = form.getFieldValue(["properties", field.name, "propType"]) || "unknown";
            if (!result[propType]) {
                result[propType] = [];
            }
            result[propType].push(field);
        });
        return result;
    }, [fields, form]);

    // ----------------------------------------------------
    // 2) 把“分组头”与“分组内属性项”扁平化到一个数组 renderList
    // ----------------------------------------------------
    const renderList: MyListItem[] = useMemo(() => {
        const items: MyListItem[] = [];
        Object.entries(grouped).forEach(([propType, groupFields]) => {
            // 先插入一个“分组头”
            items.push({
                type: "group",
                propType
            });
            // 再插入若干“property”项
            groupFields.forEach((field) => {
                items.push({
                    type: "property",
                    field
                });
            });
        });
        return items;
    }, [grouped]);


    // 添加组件挂载时的初始化
    useEffect(() => {
        resetHeights();
        // 确保在下次动画帧时更新布局
        requestAnimationFrame(() => {
            listRef.current?.resetAfterIndex(0);
        });
    }, []);


    // 动态获取行高
    const getItemSize = (index: number): number => {
        return rowHeights.current[index] || 100;
    };

    // 测量行高并更新缓存
    const measureRowHeight = (index: number, height: number) => {
        if (rowHeights.current[index] !== height) {
            rowHeights.current[index] = height;
            // 通知列表重新计算滚动位置
            listRef.current?.resetAfterIndex(index);
        }
    };

    // 使用 useLayoutEffect 来处理渲染完后计算行高
    useLayoutEffect(() => {
        // listRef.current?.resetAfterIndex(0);  // 确保初始渲染后重新计算
        requestAnimationFrame(() => {
            listRef.current?.resetAfterIndex(0);
        });
    }, [renderList]);

    //重置缓存
    const resetHeights = () => {
        rowHeights.current = {};
        listRef.current?.resetAfterIndex(0);
    };

    // 监听窗口可见性变化
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                resetHeights();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);


    // 当分组变化时重置高度
    useEffect(() => {
        resetHeights();
    }, [grouped]);


    // rowRenderer
    const Row = ({index, style}: ListChildComponentProps) => {
        const item = renderList[index];

        if (item.type === "group") {
            // 分组头
            const {propType} = item;
            return (
                <div style={style}>
                    <div
                        ref={(node) => {
                            if (node) {
                                measureRowHeight(index, node.getBoundingClientRect().height);
                            }
                        }}
                        style={{willChange: 'scroll-position'}}
                    >
                        <Divider style={{margin: "8px 0"}}>{t(`MateEditor.${propType}`)}</Divider>
                        <br></br>
                    </div>
                </div>
            );
        } else {
            // property
            const {field} = item;
            return (
                <div style={{...style, willChange: 'scroll-position'}}>
                    <div
                        ref={(node) => {
                            if (node) {
                                measureRowHeight(index, node.getBoundingClientRect().height);
                            }
                        }}
                        style={{
                            padding: 2,
                        }}
                    >
                        <MatePropertyItemType1
                            name={field.name}
                            restField={field}
                            form={form}
                        />
                        <Button
                            onClick={() => remove(field.name)}
                            style={{position: "absolute", bottom: 9, right: 1}}
                            icon={<DeleteOutlined/>}
                        />
                    </div>
                </div>
            );
        }
    };

    return (
        <div style={{height: "570px"}}>
            <AutoSizer>
                {({height, width}) => (
                    <VariableSizeList
                        ref={listRef}
                        height={height}
                        width={width}
                        itemCount={renderList.length}
                        itemSize={getItemSize}
                    >
                        {Row}
                    </VariableSizeList>
                )}
            </AutoSizer>
        </div>
    );
};

export default MatePropertyListType1Virtualized;
