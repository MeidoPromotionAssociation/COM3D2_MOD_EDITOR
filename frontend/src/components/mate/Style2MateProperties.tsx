import React, {useEffect, useRef, useState} from 'react';
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

    // 按筛选规则和搜索过滤
    const filteredFields = fields.filter((f: FormListFieldData) => {
        const pType = form.getFieldValue(['properties', f.name, 'TypeName']);
        const pName = form.getFieldValue(['properties', f.name, 'propName']) || '';

        // 组合过滤条件
        const typeMatch = filterTypeName === 'all' || pType === filterTypeName;
        const nameMatch = pName.toLowerCase().includes(searchKeyword.toLowerCase());

        return typeMatch && nameMatch;
    });


    // 再按 TypeName 分组
    const grouped: Record<string, { field: FormListFieldData; index: number; propName: string }[]> = {};
    filteredFields.forEach((f: FormListFieldData) => {
        const pType = form.getFieldValue(['properties', f.name, 'TypeName']);
        const pName = form.getFieldValue(['properties', f.name, 'propName']) || t('MateEditor.no_name');
        if (!grouped[pType]) {
            grouped[pType] = [];
        }
        grouped[pType].push({
            field: f,
            index: f.name,
            propName: pName,
        });
    });

    const groupKeys = Object.keys(grouped);

    useEffect(() => {
        leftSidebarRef.current?.focus();  // 组件挂载后自动聚焦左侧列表
    }, []);


    // 键盘事件处理函数，用于根据方向键更新选中项
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        // 扁平化所有选项的索引数组
        const flatIndices = groupKeys.reduce((acc: number[], TypeName) => {
            const indices = grouped[TypeName].map(item => item.index);
            return acc.concat(indices);
        }, []);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (flatIndices.length === 0) return;
            if (selectedField === null) {
                setSelectedField(flatIndices[0]);
            } else {
                const currentIndex = flatIndices.findIndex(val => val === selectedField);
                const nextIndex = currentIndex < flatIndices.length - 1 ? flatIndices[currentIndex + 1] : flatIndices[currentIndex];
                setSelectedField(nextIndex);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (flatIndices.length === 0) return;
            if (selectedField === null) {
                setSelectedField(flatIndices[flatIndices.length - 1]);
            } else {
                const currentIndex = flatIndices.findIndex(val => val === selectedField);
                const prevIndex = currentIndex > 0 ? flatIndices[currentIndex - 1] : flatIndices[currentIndex];
                setSelectedField(prevIndex);
            }
        }
    };

    // 自动滚动选中项进入视图
    useEffect(() => {
        if (selectedField !== null) {
            const el = document.getElementById(`sidebar-item-${selectedField}`);
            el?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
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
                    <div style={{textAlign: 'left', marginBottom: 16}}>
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