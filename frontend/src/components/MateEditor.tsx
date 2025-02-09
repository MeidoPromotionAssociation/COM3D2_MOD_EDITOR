import React, {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import {
    Button,
    Checkbox,
    Col,
    Collapse,
    ConfigProvider,
    Form,
    FormListFieldData,
    Input,
    InputNumber,
    message,
    Radio,
    Row,
    Space,
    Tooltip
} from 'antd';
import type {FormListOperation} from 'antd/es/form';
import {WindowSetTitle} from '../../wailsjs/runtime';
import {ReadMateFile, SaveMateFile} from '../../wailsjs/go/COM3D2/MateService';
import {COM3D2} from '../../wailsjs/go/models';
import {SaveFile} from '../../wailsjs/go/main/App';
import {ColProperty, FProperty, TexProperty, VecProperty} from "../utils/manualModel";
import {useTranslation} from "react-i18next";
import {DeleteOutlined, PlusOutlined, QuestionCircleOutlined} from "@ant-design/icons";
import MatePropertyItemType1 from "./MatePropertyItemType1";
import MatePropertyItemType2 from "./MatePropertyItemType2";
import Mate = COM3D2.Mate;
import Material = COM3D2.Material;

interface MateEditorProps {
    filePath?: string; // 传入要打开的 .mate 文件路径
}

export interface MateEditorRef {
    handleReadMateFile: () => Promise<void>;
    handleSaveMateFile: () => Promise<void>;
    handleSaveAsMateFile: () => Promise<void>;
}


// ------------------- 样式1：简单的上下排列 -------------------
const Style1Properties: React.FC<{
    fields: FormListFieldData[];
    add: FormListOperation['add'];
    remove: FormListOperation['remove'];
    form: any;
}> = ({fields, add, remove, form}) => {
    return (
        <>
            {fields.map(({key, name, ...restField}) => (
                <div key={key} style={{position: 'relative', marginBottom: 16}}>
                    <MatePropertyItemType1 name={name} restField={restField} form={form}/>
                    <Button
                        onClick={() => remove(name)}
                        style={{position: 'absolute', bottom: 0, right: 0}}
                        icon={<DeleteOutlined/>}
                    />
                </div>
            ))}
            <Form.Item>
                <Button type="primary" onClick={() => add()} block icon={<PlusOutlined/>}>
                    添加 Properties 条目
                </Button>
            </Form.Item>
        </>
    );
};


// ======================= 样式2：按 propType 分栏 + 左列表/右编辑区  =======================
const Style2Properties: React.FC<{
    fields: FormListFieldData[];
    add: FormListOperation['add'];
    remove: FormListOperation['remove'];
    form: any;
}> = ({fields, add, remove, form}) => {
    // 当前选中的属性下标（在 fields 数组里的 name）
    const [selectedField, setSelectedField] = useState<number | null>(null);

    // 新增：用来筛选 propType
    const [filterPropType, setFilterPropType] = useState<string>('all');

    // 先按筛选规则过滤 fields
    const filteredFields = fields.filter((f: FormListFieldData) => {
        const pType = form.getFieldValue(['properties', f.name, 'propType']);
        if (filterPropType === 'all') return true;
        return pType === filterPropType;
    });

    // 再按 propType 分组
    const grouped: Record<string, { field: FormListFieldData; index: number; propName: string }[]> = {};
    filteredFields.forEach((f: FormListFieldData) => {
        const pType = form.getFieldValue(['properties', f.name, 'propType']);
        const pName = form.getFieldValue(['properties', f.name, 'propName']) || '(未命名)';
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

    // 找到当前选中的 field
    const selectedFieldData = fields.find((f) => f.name === selectedField);

    return (
        <Row gutter={16}>
            {/* 左侧列表：按分组 -> 组内列出可点击 */}
            <Col span={8}
                 style={{
                     borderRight: '1px solid #ddd',
                     height: 'calc(100vh - 230px)',
                     overflowY: 'auto',
                     display: 'flex',
                     flexDirection: 'column',
                 }}>
                {/* PropType 选择器 靠左 */}
                <div style={{textAlign: 'left', marginBottom: 8}}>
                    <Radio.Group
                        value={filterPropType}
                        onChange={(e) => setFilterPropType(e.target.value)}
                        optionType="button"
                    >
                        <Radio.Button value="all">All</Radio.Button>
                        <Radio.Button value="tex">tex</Radio.Button>
                        <Radio.Button value="col">col</Radio.Button>
                        <Radio.Button value="vec">vec</Radio.Button>
                        <Radio.Button value="f">f</Radio.Button>
                        <Radio.Button value="unknown">unknown</Radio.Button>
                    </Radio.Group>
                </div>


                {groupKeys.map((PropType) => (
                    <div key={PropType} style={{textAlign: 'left', marginBottom: 16}}>
                        <h4>{PropType}</h4>
                        {grouped[PropType].map(({field, index, propName}) => (
                            <div
                                key={field.key}
                                onClick={() => setSelectedField(index)}
                                style={{
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    borderRadius: 4,
                                    backgroundColor: selectedField === index ? '#e6f7ff' : undefined,
                                    marginBottom: 4,
                                }}
                            >
                                {propName}
                            </div>
                        ))}
                    </div>
                ))}
                <Button
                    type="dashed"
                    onClick={() => {
                        add();
                        setSelectedField(null);
                    }}
                    icon={<PlusOutlined/>}
                    block
                >
                    添加 Property
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
                            key={'property-item-' + selectedFieldData.key} // 确保每个属性都有独立的 key
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


/**
 * MateEditor 组件
 *
 * - 读取 .mate 文件 -> 填充 form
 * - 在前端编辑 -> 组装回 Mate 对象
 * - 保存/另存为
 */
const MateEditor = forwardRef<MateEditorRef, MateEditorProps>((props, ref) => {
    const {t} = useTranslation();
    const {filePath} = props;

    // 整体 .mate 数据
    const [mateData, setMateData] = useState<Mate | null>(null);

    // 是否允许编辑 Signature, Version 等字段（默认禁用）
    const [isHeaderEditable, setIsHeaderEditable] = useState(false);

    // 用于 antd 的表单来管理字段
    const [form] = Form.useForm();

    // 用来切换样式模式：1 or 2
    const [viewMode, setViewMode] = useState<1 | 2>(1);

    // 当组件挂载或 filePath 改变时，自动读取
    useEffect(() => {
        if (filePath) {
            WindowSetTitle("编辑 .mate 文件：" + filePath);
            handleReadMateFile();
        } else {
            // 如果没有文件，则清空
            setMateData(null);
            form.resetFields();
        }
    }, [filePath]);

    /**
     * 读取 .mate 文件
     */
    const handleReadMateFile = async () => {
        if (!filePath) {
            message.error("请先提供 .mate 文件路径");
            return;
        }
        try {
            const data = await ReadMateFile(filePath);
            console.log(data);
            setMateData(data);
            // 同步到 form
            form.setFieldsValue(transformMateToForm(data));
        } catch (error: any) {
            console.error(error);
            message.error("读取 .mate 文件失败: " + error);
        }
    };

    /**
     * 保存 .mate 文件（覆盖写回原路径）
     */
    const handleSaveMateFile = async () => {
        if (!filePath || !mateData) {
            message.error("无效文件路径或 Mate 数据");
            return;
        }
        try {
            // 先获取最新的表单数据
            const values = form.getFieldsValue(true);
            // form -> Mate
            const newMate = transformFormToMate(values, mateData);

            // 调用后端保存
            await SaveMateFile(filePath, newMate);
            message.success("保存成功");
        } catch (error: any) {
            console.error(error);
            message.error("保存失败: " + error);
        }
    };

    /**
     * 另存为 .mate 文件
     */
    const handleSaveAsMateFile = async () => {
        if (!mateData) {
            message.error("Mate 数据为空，无法另存为");
            return;
        }
        try {
            // 获取最新表单数据
            const values = form.getFieldsValue(true);
            const newMate = transformFormToMate(values, mateData);

            // 询问保存路径
            const newPath = await SaveFile("*.mate", "选择另存为 .mate 文件");
            if (!newPath) {
                // 用户取消
                return;
            }

            await SaveMateFile(newPath, newMate);
            message.success("另存为成功: " + newPath);
        } catch (error: any) {
            console.error(error);
            message.error("另存为失败: " + error.message);
        }
    };

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
        handleReadMateFile,
        handleSaveMateFile,
        handleSaveAsMateFile,
    }));

    /**
     * 把 Mate 对象映射到表单字段
     * 便于 antd 的 Form 做统一管理
     */
    const transformMateToForm = (mate: Mate) => {
        // 尝试推断出 typeName
        mate.Material?.Properties?.forEach((prop: any) => {
            if (!('typeName' in prop)) {
                if ('Tex2D' in prop || 'TexRT' in prop) {
                    prop.typeName = 'tex';
                } else if ('Color' in prop) {
                    prop.typeName = 'col';
                } else if ('Vector' in prop) {
                    prop.typeName = 'vec';
                } else if ('Number' in prop) {
                    prop.typeName = 'f';
                } else {
                    prop.typeName = 'unknown';
                }
            }
        });

        return {
            signature: mate.Signature,
            version: mate.Version,
            name: mate.Name,
            materialName: mate.Material?.Name,
            shaderName: mate.Material?.ShaderName,
            shaderFilename: mate.Material?.ShaderFilename,
            properties: mate.Material?.Properties?.map((prop) => {
                // 不同类型的 property
                switch (prop.typeName) {
                    case 'tex':
                        // TS: prop as TexProperty
                        const texProp = prop as TexProperty;
                        return {
                            propType: 'tex',
                            propName: texProp.PropName,
                            subTag: texProp.SubTag,
                            // 针对 tex2d / cube
                            tex2dName: texProp.Tex2D?.Name,
                            tex2dPath: texProp.Tex2D?.Path,
                            offsetX: texProp.Tex2D?.Offset?.[0],
                            offsetY: texProp.Tex2D?.Offset?.[1],
                            scaleX: texProp.Tex2D?.Scale?.[0],
                            scaleY: texProp.Tex2D?.Scale?.[1],
                            // 针对 texRT
                            discardedStr1: texProp.TexRT?.DiscardedStr1,
                            discardedStr2: texProp.TexRT?.DiscardedStr2,
                        };
                    case 'col':
                        const colProp = prop as ColProperty;
                        return {
                            propType: 'col',
                            propName: colProp.PropName,
                            colorR: colProp.Color[0],
                            colorG: colProp.Color[1],
                            colorB: colProp.Color[2],
                            colorA: colProp.Color[3],
                        };
                    case 'vec':
                        const vecProp = prop as VecProperty;
                        return {
                            propType: 'vec',
                            propName: vecProp.PropName,
                            vec0: vecProp.Vector[0],
                            vec1: vecProp.Vector[1],
                            vec2: vecProp.Vector[2],
                            vec3: vecProp.Vector[3],
                        };
                    case 'f':
                        const fProp = prop as FProperty;
                        return {
                            propType: 'f',
                            propName: fProp.PropName,
                            number: fProp.Number,
                        };
                    default:
                        return {
                            propType: 'unknown',
                            propName: 'unknown',
                        };
                }
            }) || [],
        };
    };

    /**
     * 将 form 上的数据组装回 Mate 对象
     */
    const transformFormToMate = (values: any, oldMate: Mate): Mate => {
        const newMate = COM3D2.Mate.createFrom(oldMate);

        // 基本字段
        if (isHeaderEditable) {
            newMate.Signature = values.signature;
            newMate.Version = parseInt(values.version, 10);
        }
        newMate.Name = values.name;

        // Material
        if (!newMate.Material) {
            newMate.Material = {} as Material;
        }
        newMate.Material.Name = values.materialName;
        newMate.Material.ShaderName = values.shaderName;
        newMate.Material.ShaderFilename = values.shaderFilename;

        // Properties
        const newProps: any[] = [];
        if (Array.isArray(values.properties)) {
            values.properties.forEach((item: any) => {
                switch (item.propType) {
                    case 'tex':
                        // 根据 subTag 判断
                        if (item.subTag === 'tex2d' || item.subTag === 'cube') {
                            newProps.push({
                                typeName: 'tex',
                                PropName: item.propName,
                                SubTag: item.subTag,
                                Tex2D: {
                                    Name: item.tex2dName,
                                    Path: item.tex2dPath,
                                    Offset: [parseFloat(item.offsetX) || 0, parseFloat(item.offsetY) || 0],
                                    Scale: [parseFloat(item.scaleX) || 1, parseFloat(item.scaleY) || 1]
                                },
                            });
                        } else if (item.subTag === 'texRT') {
                            newProps.push({
                                    typeName: 'tex',
                                    PropName: item.propName,
                                    SubTag: 'texRT',
                                    TexRT: {
                                        DiscardedStr1: item.discardedStr1,
                                        DiscardedStr2: item.discardedStr2,
                                    }
                                }
                            );
                        } else if (item.subTag === 'null') {
                            // 生成一个空的 tex 属性
                            newProps.push({
                                typeName: 'tex',
                                PropName: item.propName,
                                SubTag: 'null',
                            });
                        }
                        break;
                    case 'col':
                        newProps.push({
                            typeName: 'col',
                            PropName: item.propName,
                            Color: [
                                parseFloat(item.colorR) || 0,
                                parseFloat(item.colorG) || 0,
                                parseFloat(item.colorB) || 0,
                                parseFloat(item.colorA) || 0,
                            ],
                        });
                        break;
                    case 'vec':
                        newProps.push({
                            typeName: 'vec',
                            PropName: item.propName,
                            Vector: [
                                parseFloat(item.vec0) || 0,
                                parseFloat(item.vec1) || 0,
                                parseFloat(item.vec2) || 0,
                                parseFloat(item.vec3) || 0,
                            ],
                        });
                        break;
                    case 'f':
                        newProps.push({
                            typeName: 'f',
                            PropName: item.propName,
                            Number: parseFloat(item.number) || 0,
                        });
                        break;
                    default:
                        // unknown, do nothing
                        break;
                }
            });
        }
        newMate.Material.Properties = newProps as any;
        return newMate;
    };

    return (
        <div style={{padding: 10}}>
            <ConfigProvider
                theme={{
                    components: {
                        Form: {
                            itemMarginBottom: 10, // 调整 item 的间距
                        },
                    },
                }}
            >
                <Form
                    form={form}
                    layout="horizontal"
                    style={{marginTop: 10}}
                    size="small"
                    labelAlign="left"
                    // Form 级别统一设置 labelCol（可根据需要调整）
                    labelCol={{style: {width: '15vw'}}}
                >
                    <Collapse defaultActiveKey={['basic', 'properties']}>
                        <Collapse.Panel key="basic" header={t('MateEditor.file_header.file_head')}>
                            <Space>
                                <Form.Item name="signature">
                                    <Input
                                        disabled={!isHeaderEditable}
                                        addonBefore={t('MateEditor.file_header.Signature')}
                                        defaultValue="CM3D2_MATERIAL"
                                    />
                                </Form.Item>
                                <Form.Item name="version">
                                    <InputNumber
                                        disabled={!isHeaderEditable}
                                        addonBefore={t('MateEditor.file_header.Version')}
                                        defaultValue="2001"
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Checkbox
                                        checked={isHeaderEditable}
                                        onChange={(e) => setIsHeaderEditable(e.target.checked)}
                                    >
                                        {t('MateEditor.file_header.enable_edit_do_not_edit')}
                                    </Checkbox>
                                </Form.Item>
                            </Space>

                            <Form.Item name="name">
                                <Input
                                    addonBefore={
                                        <span style={{width: '15vw', display: 'inline-block', textAlign: 'left'}}>
                      {t('MateEditor.file_header.Name')}
                    </span>
                                    }
                                    suffix={
                                        <Tooltip title={t('MateEditor.file_header.Name_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                            <Form.Item name="materialName">
                                <Input
                                    addonBefore={
                                        <span style={{width: '15vw', display: 'inline-block', textAlign: 'left'}}>
                      {t('MateEditor.file_header.Material_Name')}
                    </span>
                                    }
                                    suffix={
                                        <Tooltip title={t('MateEditor.file_header.Material_Name_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                            <Form.Item name="shaderName">
                                <Input
                                    addonBefore={
                                        <span style={{width: '15vw', display: 'inline-block', textAlign: 'left'}}>
                      {t('MateEditor.file_header.Material_ShaderName')}
                    </span>
                                    }
                                    suffix={
                                        <Tooltip title={t('MateEditor.file_header.Material_ShaderName_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                            <Form.Item name="shaderFilename">
                                <Input
                                    addonBefore={
                                        <span style={{width: '15vw', display: 'inline-block', textAlign: 'left'}}>
                      {t('MateEditor.file_header.Material_ShaderFilename')}
                    </span>
                                    }
                                    suffix={
                                        <Tooltip title={t('MateEditor.file_header.Material_ShaderFilename_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                        </Collapse.Panel>

                        <Collapse.Panel key="properties" header="Properties">
                            {/* 用 Radio 切换样式 */}
                            <div style={{marginBottom: 8}}>
                                <Radio.Group
                                    block
                                    value={viewMode}
                                    onChange={(e) => setViewMode(e.target.value)}
                                    options={[
                                        {label: '样式1', value: 1},
                                        {label: '样式2', value: 2},
                                    ]}
                                    optionType="button"
                                    buttonStyle="solid"
                                />
                            </div>

                            {/* 这里统一用一个 Form.List，根据 viewMode 分别渲染 */}
                            <Form.List name="properties">
                                {(fields, {add, remove}) =>
                                    viewMode === 1 ? (
                                        <Style1Properties fields={fields} add={add} remove={remove} form={form}/>
                                    ) : (
                                        <Style2Properties fields={fields} add={add} remove={remove} form={form}/>
                                    )
                                }
                            </Form.List>
                        </Collapse.Panel>
                    </Collapse>
                </Form>
            </ConfigProvider>
        </div>
    );
});

export default MateEditor;
