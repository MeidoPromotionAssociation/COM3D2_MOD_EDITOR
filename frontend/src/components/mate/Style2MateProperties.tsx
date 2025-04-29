import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Button, Col, Divider, FormInstance, FormListFieldData, Input, Radio, Row} from 'antd';
import type {FormListOperation} from 'antd/es/form';
import {useTranslation} from "react-i18next";
import {DeleteOutlined, PlusOutlined} from "@ant-design/icons";
import MatePropertyItemType2 from "./MatePropertyItemType2";


// ======================= 样式2：按 typeName 分栏 + 左列表/右编辑区  =======================
const Style2MateProperties: React.FC<{
    fields: FormListFieldData[];
    add: FormListOperation['add'];
    remove: FormListOperation['remove'];
    form: FormInstance;
}> = ({fields, add, remove, form}) => {
    const {t} = useTranslation();
    // 引用左侧列表容器
    const leftSidebarRef = useRef<HTMLDivElement>(null);

    // 当前选中的属性下标（在 fields 数组里的 name）
    const [selectedField, setSelectedField] = useState<number | null>(null);

    // 用来筛选 typeName
    const [filterTypeName, setFilterTypeName] = useState<string>('all');

    // 搜索关键词状态
    const [searchKeyword, setSearchKeyword] = useState('');

    // 按筛选规则和搜索过滤 - 使用 useMemo 缓存计算结果
    const filteredFields = useMemo(() => {
        return fields.filter((f: FormListFieldData) => {
            const pType = form.getFieldValue(['properties', f.name, 'TypeName']);
            const pName = form.getFieldValue(['properties', f.name, 'propName']) || '';

            // 组合过滤条件
            const typeMatch = filterTypeName === 'all' || pType === filterTypeName;
            const nameMatch = pName.toLowerCase().includes(searchKeyword.toLowerCase());

            return typeMatch && nameMatch;
        });
    }, [fields, form, filterTypeName, searchKeyword]);


    // 再按 TypeName 分组 - 使用 useMemo 缓存计算结果
    const grouped = useMemo(() => {
        const result: Record<string, { field: FormListFieldData; index: number; propName: string }[]> = {};
        filteredFields.forEach((f: FormListFieldData) => {
            const pType = form.getFieldValue(['properties', f.name, 'TypeName']);
            const pName = form.getFieldValue(['properties', f.name, 'propName']) || t('MateEditor.no_name');
            if (!result[pType]) {
                result[pType] = [];
            }
            result[pType].push({
                field: f,
                index: f.name,
                propName: pName,
            });
        });
        return result;
    }, [filteredFields, form, t]);

    const groupKeys = useMemo(() => Object.keys(grouped), [grouped]);

    useEffect(() => {
        leftSidebarRef.current?.focus();  // 组件挂载后自动聚焦左侧列表
    }, []);


    // 扁平化所有选项的索引数组 - 使用 useMemo 缓存计算结果
    const flatIndices = useMemo(() => {
        return groupKeys.reduce((acc: number[], TypeName) => {
            const indices = grouped[TypeName].map(item => item.index);
            return acc.concat(indices);
        }, []);
    }, [groupKeys, grouped]);

    // 记录上次按键时间，用于节流
    const lastKeyPressTime = useRef<number>(0);
    const keyPressThrottleMs = 30; // 节流时间间隔（毫秒） - 减少以提高响应速度

    // 键盘事件处理函数，用于根据方向键更新选中项
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        // 节流处理，防止按住方向键时触发太多更新
        const now = Date.now();
        if (now - lastKeyPressTime.current < keyPressThrottleMs) {
            e.preventDefault();
            return;
        }
        lastKeyPressTime.current = now;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (flatIndices.length === 0) return;
            if (selectedField === null) {
                setSelectedField(flatIndices[0]);
            } else {
                const currentIndex = flatIndices.findIndex(val => val === selectedField);
                const nextIndex = currentIndex < flatIndices.length - 1 ? flatIndices[currentIndex + 1] : flatIndices[currentIndex];

                // 如果选中项发生变化，立即更新
                if (nextIndex !== selectedField) {
                    setSelectedField(nextIndex);

                    // 立即滚动到可视区域，不等待 useEffect
                    setTimeout(() => {
                        const el = document.getElementById(`sidebar-item-${nextIndex}`);
                        if (el) el.scrollIntoView({behavior: 'auto', block: 'nearest'});
                    }, 0);
                }
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (flatIndices.length === 0) return;
            if (selectedField === null) {
                setSelectedField(flatIndices[flatIndices.length - 1]);
            } else {
                const currentIndex = flatIndices.findIndex(val => val === selectedField);
                const prevIndex = currentIndex > 0 ? flatIndices[currentIndex - 1] : flatIndices[currentIndex];

                // 如果选中项发生变化，立即更新
                if (prevIndex !== selectedField) {
                    setSelectedField(prevIndex);

                    // 立即滚动到可视区域，不等待 useEffect
                    setTimeout(() => {
                        const el = document.getElementById(`sidebar-item-${prevIndex}`);
                        if (el) el.scrollIntoView({behavior: 'auto', block: 'nearest'});
                    }, 0);
                }
            }
        }
    }, [flatIndices, selectedField]);

    // 自动滚动选中项进入视图 - 使用即时滚动而非平滑滚动
    useEffect(() => {
        if (selectedField !== null) {
            const el = document.getElementById(`sidebar-item-${selectedField}`);
            if (el) {
                // 使用即时滚动，而不是平滑滚动，以避免滚动滞后
                el.scrollIntoView({behavior: 'auto', block: 'nearest'});

                // 检查元素是否在可视区域内
                const container = leftSidebarRef.current;
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const elRect = el.getBoundingClientRect();

                    // 如果元素不在可视区域内，立即滚动到可视区域
                    const isInView = (
                        elRect.top >= containerRect.top &&
                        elRect.bottom <= containerRect.bottom
                    );

                    if (!isInView) {
                        // 强制立即滚动，不使用动画
                        el.scrollIntoView({behavior: 'auto', block: 'nearest'});
                    }
                }
            }
        }
    }, [selectedField]);


    // 找到当前选中的 field
    const selectedFieldData = fields.find((f) => f.name === selectedField);

    return (
        <Row gutter={16}>
            {/* 左侧列表：按分组 -> 组内列出可点击 */}
            <Col span={8}
                 ref={leftSidebarRef}        /* 引用左侧列表容器 */
                 tabIndex={0}                /* 使 div 可聚焦 */
                 onKeyDown={handleKeyDown}   /* 键盘事件监听 */
                 style={{
                     borderRight: '1px solid #ddd',
                     height: 'calc(100vh - 230px)',
                     overflowY: 'auto',
                     display: 'flex',
                     flexDirection: 'column',
                 }}>
                {/* TypeName 选择器 靠左 */}
                <div style={{textAlign: 'left', marginBottom: 8}}>
                    <Radio.Group
                        value={filterTypeName}
                        onChange={(e) => setFilterTypeName(e.target.value)}
                        optionType="button"
                    >
                        <Radio.Button value="all">{t('MateEditor.all')}</Radio.Button>
                        <Radio.Button value="tex">{t('MateEditor.tex_no_brackets')}</Radio.Button>
                        <Radio.Button value="col">{t('MateEditor.col_no_brackets')}</Radio.Button>
                        <Radio.Button value="vec">{t('MateEditor.vec_no_brackets')}</Radio.Button>
                        <Radio.Button value="f">{t('MateEditor.f_no_brackets')}</Radio.Button>
                        <Radio.Button value="range">{t('MateEditor.range_no_brackets')}</Radio.Button>
                        <Radio.Button value="tex_offset">{t('MateEditor.tex_offset_no_brackets')}</Radio.Button>
                        <Radio.Button value="tex_scale">{t('MateEditor.tex_scale_no_brackets')}</Radio.Button>
                        <Radio.Button value="keyword">{t('MateEditor.keyword_no_brackets')}</Radio.Button>
                        <Radio.Button value="unknown">{t('MateEditor.unknown')}</Radio.Button>
                    </Radio.Group>
                    <Input.Search
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        style={{marginTop: 8}}
                    />
                </div>

                {/* 左边栏，按 TypeName 分组 */}
                {groupKeys.map((TypeName) => (
                    <div key={`group-${TypeName}`} style={{textAlign: 'left', marginBottom: 16}}>
                        <Divider plain><b>{t(`MateEditor.${TypeName}`)}</b></Divider>
                        {grouped[TypeName].map(({field, index, propName}) => (
                            <div
                                id={`sidebar-item-${index}`}
                                key={`sidebar-item-${TypeName}-${field.key}`}
                                onClick={() => setSelectedField(index)}
                                style={{
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    borderRadius: 4,
                                    backgroundColor: selectedField === index ? '#e6f7ff' : undefined,
                                    marginBottom: 4,
                                    position: 'relative',
                                }}
                            >
                                {propName}
                                {/* 添加删除按钮 */}
                                <Button
                                    type="text"
                                    icon={<DeleteOutlined/>}
                                    onClick={(e) => {
                                        e.stopPropagation(); // 阻止点击事件冒泡
                                        remove(index);       // 删除当前属性
                                        if (selectedField === index) {
                                            setSelectedField(null); // 如果删除的是当前选中项，清除选中状态
                                        }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        right: 4,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        padding: '0 4px'
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                ))}
                <Button
                    type="primary"
                    onClick={() => {
                        const initialValue = filterTypeName !== 'all'
                            ? {TypeName: filterTypeName}
                            : {TypeName: 'unknown'}; // 当选择"全部"时默认 unknown 类型
                        add(initialValue);
                        setSelectedField(null);
                    }}
                    icon={<PlusOutlined/>}
                    block
                >
                    {t('MateEditor.add_new_property')}
                </Button>
            </Col>

            {/* 右侧编辑区：仅渲染选中的那一个 */}
            <Col span={16}>
                {selectedField !== null && selectedFieldData && (
                    <div style={{
                        height: 'calc(100vh - 270px)',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <MatePropertyItemType2
                            key={'property-item-' + selectedFieldData.key}
                            name={selectedFieldData.name}
                            restField={selectedFieldData}
                            form={form}
                        />
                        <Button
                            onClick={() => {
                                remove(selectedFieldData.name);
                                setSelectedField(null);
                            }}
                            danger
                            style={{position: 'absolute', bottom: 0, right: 0}}
                            icon={<DeleteOutlined/>}
                        />
                    </div>
                )}
            </Col>
        </Row>
    );
};

export default Style2MateProperties