import React, {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import {Checkbox, Collapse, ConfigProvider, Form, Input, InputNumber, message, Select, Space, Tooltip} from 'antd';
import {WindowSetTitle} from '../../wailsjs/runtime';
import {ReadMateFile, SaveMateFile} from '../../wailsjs/go/COM3D2/MateService';
import {COM3D2} from '../../wailsjs/go/models';
import {SaveFile} from '../../wailsjs/go/main/App';
import {ColProperty, FProperty, TexProperty, VecProperty} from "../utils/manualModel";
import {useTranslation} from "react-i18next";
import {QuestionCircleOutlined} from "@ant-design/icons";
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

/**
 * MateEditor
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
     * 此时也可以创建一个全新的 Mate，或者用原对象做一定复用
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
                                typeName: () => 'tex',
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
                                typeName: () => 'tex',
                                PropName: item.propName,
                                SubTag: 'texRT',
                                TexRT: {
                                    DiscardedStr1: item.discardedStr1,
                                    DiscardedStr2: item.discardedStr2,
                                }
                            });
                        }
                        break;
                    case 'col':
                        newProps.push({
                            typeName: () => 'col',
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
                            typeName: () => 'vec',
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
                            typeName: () => 'f',
                            PropName: item.propName,
                            Number: parseFloat(item.number) || 0,
                        });
                        break;
                    default:
                        // unknown
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
                    size='small'
                    labelAlign='left'
                >
                    <Collapse defaultActiveKey={['basic', 'material', 'properties']}>
                        <Collapse.Panel key="basic" header={t('MateEditor.file_header.file_head')}>
                            <Space>
                                <Form.Item name="signature">
                                    <Input disabled={!isHeaderEditable}
                                           addonBefore={t('MateEditor.file_header.Signature')}/>
                                </Form.Item>
                                <Form.Item name="version">
                                    <InputNumber disabled={!isHeaderEditable}
                                                 addonBefore={t('MateEditor.file_header.Version')}/>
                                </Form.Item>
                                <Form.Item>
                                    <Checkbox checked={isHeaderEditable}
                                              onChange={(e) => setIsHeaderEditable(e.target.checked)}>
                                        {t('MateEditor.file_header.enable_edit_do_not_edit')}
                                    </Checkbox>
                                </Form.Item>
                            </Space>

                            <Form.Item name="name">
                                <Input addonBefore={t('MateEditor.file_header.Name')} suffix={
                                    <Tooltip title={t('MateEditor.file_header.Name_tip')}>
                                        <QuestionCircleOutlined/>
                                    </Tooltip>
                                }/>
                            </Form.Item>
                            <Form.Item name="materialName">
                                <Input addonBefore={t('MateEditor.file_header.Material_Name')} suffix={
                                    <Tooltip title={t('MateEditor.file_header.Material_Name_tip')}>
                                        <QuestionCircleOutlined/>
                                    </Tooltip>
                                }/>
                            </Form.Item>
                            <Form.Item name="shaderName">
                                <Input addonBefore={t('MateEditor.file_header.Material_ShaderName')} suffix={
                                    <Tooltip title={t('MateEditor.file_header.Material_ShaderName_tip')}>
                                        <QuestionCircleOutlined/>
                                    </Tooltip>
                                }/>
                            </Form.Item>
                            <Form.Item name="shaderFilename">
                                <Input addonBefore={t('MateEditor.file_header.Material_ShaderFilename')} suffix={
                                    <Tooltip title={t('MateEditor.file_header.Material_ShaderFilename_tip')}>
                                        <QuestionCircleOutlined/>
                                    </Tooltip>
                                }/>
                            </Form.Item>
                        </Collapse.Panel>


                        <Collapse.Panel key="properties" header="Properties">
                            <Form.List name="properties">
                                {(fields) => (
                                    <>
                                        {fields.map(({key, name, ...restField}) => (
                                            <div
                                                key={key}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between', // 水平均匀分布
                                                    marginBottom: 16,
                                                    padding: 10,
                                                    border: '1px dashed #ccc',
                                                    borderRadius: 4,
                                                    height: "auto",
                                                    overflow: 'auto',
                                                }}
                                            >
                                                <Form.Item
                                                    {...restField}
                                                    label="Property Type"
                                                    name={[name, 'propType']}
                                                >
                                                    <Select
                                                        options={[
                                                            {label: 'tex', value: 'tex'},
                                                            {label: 'col', value: 'col'},
                                                            {label: 'vec', value: 'vec'},
                                                            {label: 'f', value: 'f'},
                                                            {label: '未知', value: 'unknown'},
                                                        ]}
                                                    />
                                                </Form.Item>

                                                <Form.Item
                                                    {...restField}
                                                    label="PropName"
                                                    name={[name, 'propName']}
                                                >
                                                    <Input/>
                                                </Form.Item>

                                                {/* 根据不同 propType 显示不同字段 */}
                                                {/* tex property */}
                                                <Form.Item shouldUpdate>
                                                    {() => {
                                                        const propType = form.getFieldValue(['properties', name, 'propType']);
                                                        if (propType === 'tex') {
                                                            return (
                                                                <>
                                                                    <Form.Item
                                                                        {...restField}
                                                                        label="subTag"
                                                                        name={[name, 'subTag']}
                                                                    >
                                                                        <Select
                                                                            options={[
                                                                                {label: 'tex2d', value: 'tex2d'},
                                                                                {label: 'cube', value: 'cube'},
                                                                                {label: 'texRT', value: 'texRT'},
                                                                                {label: 'null', value: 'null'},
                                                                            ]}
                                                                        />
                                                                    </Form.Item>
                                                                    {(() => {
                                                                        const subTag = form.getFieldValue(['properties', name, 'subTag']);
                                                                        if (subTag === 'tex2d' || subTag === 'cube') {
                                                                            return (
                                                                                <>
                                                                                    <Form.Item
                                                                                        {...restField}
                                                                                        label="tex2dName"
                                                                                        name={[name, 'tex2dName']}
                                                                                    >
                                                                                        <Input/>
                                                                                    </Form.Item>
                                                                                    <Form.Item
                                                                                        {...restField}
                                                                                        label="tex2dPath"
                                                                                        name={[name, 'tex2dPath']}
                                                                                    >
                                                                                        <Input/>
                                                                                    </Form.Item>
                                                                                    <Form.Item
                                                                                        {...restField}
                                                                                        label="offsetX"
                                                                                        name={[name, 'offsetX']}
                                                                                    >
                                                                                        <InputNumber/>
                                                                                    </Form.Item>
                                                                                    <Form.Item
                                                                                        {...restField}
                                                                                        label="offsetY"
                                                                                        name={[name, 'offsetY']}
                                                                                    >
                                                                                        <InputNumber/>
                                                                                    </Form.Item>
                                                                                    <Form.Item
                                                                                        {...restField}
                                                                                        label="scaleX"
                                                                                        name={[name, 'scaleX']}
                                                                                    >
                                                                                        <InputNumber/>
                                                                                    </Form.Item>
                                                                                    <Form.Item
                                                                                        {...restField}
                                                                                        label="scaleY"
                                                                                        name={[name, 'scaleY']}
                                                                                    >
                                                                                        <InputNumber/>
                                                                                    </Form.Item>
                                                                                </>
                                                                            );
                                                                        } else if (subTag === 'texRT') {
                                                                            return (
                                                                                <>
                                                                                    <Form.Item
                                                                                        {...restField}
                                                                                        label="discardedStr1"
                                                                                        name={[name, 'discardedStr1']}
                                                                                    >
                                                                                        <Input/>
                                                                                    </Form.Item>
                                                                                    <Form.Item
                                                                                        {...restField}
                                                                                        label="discardedStr2"
                                                                                        name={[name, 'discardedStr2']}
                                                                                    >
                                                                                        <Input/>
                                                                                    </Form.Item>
                                                                                </>
                                                                            );
                                                                        } else {
                                                                            return null;
                                                                        }
                                                                    })()}
                                                                </>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                </Form.Item>

                                                {/* col property */}
                                                <Form.Item shouldUpdate>
                                                    {() => {
                                                        const propType = form.getFieldValue(['properties', name, 'propType']);
                                                        if (propType === 'col') {
                                                            return (
                                                                <Space align="baseline">
                                                                    <Form.Item
                                                                        {...restField}
                                                                        label="R"
                                                                        name={[name, 'colorR']}
                                                                    >
                                                                        <InputNumber/>
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        {...restField}
                                                                        label="G"
                                                                        name={[name, 'colorG']}
                                                                    >
                                                                        <InputNumber/>
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        {...restField}
                                                                        label="B"
                                                                        name={[name, 'colorB']}
                                                                    >
                                                                        <InputNumber/>
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        {...restField}
                                                                        label="A"
                                                                        name={[name, 'colorA']}
                                                                    >
                                                                        <InputNumber/>
                                                                    </Form.Item>
                                                                </Space>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                </Form.Item>

                                                {/* vec property */}
                                                <Form.Item shouldUpdate>
                                                    {() => {
                                                        const propType = form.getFieldValue(['properties', name, 'propType']);
                                                        if (propType === 'vec') {
                                                            return (
                                                                <Space align="baseline">
                                                                    <Form.Item
                                                                        {...restField}
                                                                        label="vec0"
                                                                        name={[name, 'vec0']}
                                                                    >
                                                                        <InputNumber/>
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        {...restField}
                                                                        label="vec1"
                                                                        name={[name, 'vec1']}
                                                                    >
                                                                        <InputNumber/>
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        {...restField}
                                                                        label="vec2"
                                                                        name={[name, 'vec2']}
                                                                    >
                                                                        <InputNumber/>
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        {...restField}
                                                                        label="vec3"
                                                                        name={[name, 'vec3']}
                                                                    >
                                                                        <InputNumber/>
                                                                    </Form.Item>
                                                                </Space>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                </Form.Item>

                                                {/* f property */}
                                                <Form.Item shouldUpdate>
                                                    {() => {
                                                        const propType = form.getFieldValue(['properties', name, 'propType']);
                                                        if (propType === 'f') {
                                                            return (
                                                                <Form.Item
                                                                    {...restField}
                                                                    label="Number"
                                                                    name={[name, 'number']}
                                                                >
                                                                    <InputNumber/>
                                                                </Form.Item>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                </Form.Item>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </Form.List>
                        </Collapse.Panel>
                    </Collapse>
                </Form>
            </ConfigProvider>
        </div>
    );
});

export default MateEditor;
