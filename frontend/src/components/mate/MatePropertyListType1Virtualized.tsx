// MatePropertyListType1Virtualized.tsx
import React, {FC, useMemo, useRef} from "react";
import {useVirtualizer} from "@tanstack/react-virtual";
import {Button, Divider, FormInstance} from "antd";
import {DeleteOutlined} from "@ant-design/icons";
import MatePropertyItemType1 from "./MatePropertyItemType1";
import {useTranslation} from "react-i18next";

// 分组后扁平化出来的列表项类型
type MyListItem =
    | {
    type: "group";          // 分组头
    TypeName: string;       // 分组名称
}
    | {
    type: "property";       // 具体属性条目
    field: any;            // 原 FormList 的 field
};

interface VirtualizedPropertyListProps {
    fields: any[];
    remove: (index: number) => void;
    form: FormInstance;
}

/**
 * 带分组 + 虚拟滚动的 Property 列表
 */
const MatePropertyListType1Virtualized: FC<VirtualizedPropertyListProps> = ({
                                                                                fields,
                                                                                remove,
                                                                                form,
                                                                            }) => {
    const {t} = useTranslation();

    const parentRef = useRef<HTMLDivElement>(null);

    // -------------------------
    // 1) 先按 TypeName 分组
    // -------------------------
    const grouped = useMemo(() => {
        const result: Record<string, any[]> = {};
        fields.forEach((field) => {
            const TypeName = form.getFieldValue(["properties", field.name, "TypeName"]) || "unknown";
            if (!result[TypeName]) {
                result[TypeName] = [];
            }
            result[TypeName].push(field);
        });
        return result;
    }, [fields, form]);

    // ----------------------------------------------------
    // 2) 把“分组头”与“分组内属性项”扁平化到一个数组 renderList
    // ----------------------------------------------------
    const renderList: MyListItem[] = useMemo(() => {
        const items: MyListItem[] = [];
        Object.entries(grouped).forEach(([TypeName, groupFields]) => {
            // 先插入一个“分组头”
            items.push({
                type: "group",
                TypeName
            });
            // 再插入若干“property”项
            groupFields.forEach((field) => {
                items.push({
                    type: "property",
                    field: {
                        ...field,
                        key: undefined // 避免 key 冲突
                    }
                });
            });
        });
        return items;
    }, [grouped]);

    const virtualizer = useVirtualizer({
        count: renderList.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 100,
        overscan: 5,
        getItemKey: (index) => {
            const item = renderList[index];
            if (item.type === "group") {
                return `group-${item.TypeName}-${index}`;
            }
            return `property-${item.field.name}-${index}`;
        },
    });

    return (
        <div
            ref={parentRef}
            style={{height: "570px", overflow: "auto"}}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    const item = renderList[virtualItem.index];
                    return (
                        <div
                            key={virtualItem.key}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            {item.type === "group" ? (
                                <div>
                                    <Divider style={{margin: "8px 0"}}>{t(`MateEditor.${item.TypeName}`)}</Divider>
                                    <br/>
                                </div>
                            ) : (
                                <div style={{padding: 2}}>
                                    <MatePropertyItemType1
                                        name={item.field.name}
                                        restField={item.field}
                                        form={form}
                                    />
                                    <Button
                                        onClick={() => remove(item.field.name)}
                                        style={{position: "absolute", bottom: 9, right: 1}}
                                        icon={<DeleteOutlined/>}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MatePropertyListType1Virtualized;