import React, {useEffect, useState} from 'react';
import {Card, Checkbox, Collapse, ConfigProvider, Form, Input, InputNumber, Space, Tooltip} from 'antd';
import {COM3D2} from '../../../wailsjs/go/models';
import {useTranslation} from "react-i18next";
import MaterialListEditor from './MaterialListEditor';
import {COM3D2HeaderConstants} from "../../utils/ConstCOM3D2";
import {QuestionCircleOutlined} from "@ant-design/icons";
import ModelMetadata = COM3D2.ModelMetadata;
import Material = COM3D2.Material;

export interface ModelMetadataEditorProps {
    modelMetadata: ModelMetadata | null;
    onModelMetadataChange?: (modelMetadata: ModelMetadata) => void;
}

/**
 * ModelMetadataEditor 组件
 *
 * 用于编辑 ModelMetadata 对象，包括基本信息和 Materials 列表
 */
const ModelMetadataEditor: React.FC<ModelMetadataEditorProps> = ({
                                                                     modelMetadata,
                                                                     onModelMetadataChange,
                                                                 }) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();

    // 临时存储当前编辑的 ModelMetadata 对象
    const [tempModelMetadata, setTempModelMetadata] = useState<ModelMetadata | null>(modelMetadata);

    // 是否允许编辑 Signature、Version 等字段
    const [headerEditable, setHeaderEditable] = useState(false);

    // 当外部 modelMetadata 变化时，更新表单
    useEffect(() => {
        if (modelMetadata) {
            setTempModelMetadata(modelMetadata);
            form.setFieldsValue(transformModelMetadataToForm(modelMetadata));
        } else {
            // 如果没有传入 modelMetadata，则创建一个新的
            const newModelMetadata = new COM3D2.ModelMetadata({
                Signature: COM3D2HeaderConstants.ModelSignature,
                Version: COM3D2HeaderConstants.ModelVersion,
                Name: "",
                RootBoneName: "",
                Materials: []
            });
            setTempModelMetadata(newModelMetadata);
            form.setFieldsValue(transformModelMetadataToForm(newModelMetadata));
        }
    }, [modelMetadata]);

    // 表单值变化时，更新 ModelMetadata 对象
    const handleFormValuesChange = (changedValues: any, allValues: any) => {
        if (!tempModelMetadata) return;

        const updatedModelMetadata = transformFormToModelMetadata(allValues, tempModelMetadata);
        setTempModelMetadata(updatedModelMetadata);

        if (onModelMetadataChange) {
            onModelMetadataChange(updatedModelMetadata);
        }
    };

    // 处理 Materials 列表变化
    const handleMaterialsChange = (materials: Material[]) => {
        if (!tempModelMetadata) return;

        const updatedModelMetadata = new COM3D2.ModelMetadata({
            ...tempModelMetadata,
            Materials: materials
        });
        setTempModelMetadata(updatedModelMetadata);

        if (onModelMetadataChange) {
            onModelMetadataChange(updatedModelMetadata);
        }
    };

    /**
     * 把 ModelMetadata 对象映射到表单字段
     */
    const transformModelMetadataToForm = (metadata: ModelMetadata) => {
        return {
            signature: metadata.Signature,
            version: metadata.Version,
            modelName: metadata.Name,
            rootBoneName: metadata.RootBoneName,
            shadowCastingMode: metadata.ShadowCastingMode
        };
    };

    /**
     * 把表单字段映射回 ModelMetadata 对象
     */
    const transformFormToModelMetadata = (formValues: any, originalMetadata: ModelMetadata): ModelMetadata => {
        return new COM3D2.ModelMetadata({
            ...originalMetadata,
            Signature: formValues.signature,
            Version: formValues.version,
            Name: formValues.modelName,
            RootBoneName: formValues.rootBoneName,
            ShadowCastingMode: formValues.shadowCastingMode,
        });
    };

    return (
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
                size="small"
                labelAlign="left"
                // Form 级别统一设置 labelCol
                labelCol={{style: {width: '15vw'}}}
                requiredMark={false}
            >
                <div style={{marginBottom: '8px'}}>
                    <Collapse defaultActiveKey={['header']}>
                        <Collapse.Panel key="header" header={t('ModelEditor.file_header.file_head')}>
                            <Space>
                                <Form.Item name="signature" initialValue={COM3D2HeaderConstants.ModelSignature}>
                                    <Input
                                        disabled={!headerEditable}
                                        addonBefore={t('ModelEditor.file_header.Signature')}
                                    />
                                </Form.Item>
                                <Form.Item name="version" initialValue={COM3D2HeaderConstants.ModelVersion.toString()}>
                                    <InputNumber
                                        disabled={!headerEditable}
                                        addonBefore={t('ModelEditor.file_header.Version')}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Checkbox
                                        checked={headerEditable}
                                        onChange={(e) => setHeaderEditable(e.target.checked)}
                                    >
                                        {t('ModelEditor.file_header.enable_edit_do_not_edit')}
                                    </Checkbox>
                                </Form.Item>
                            </Space>

                            <Form.Item name="modelName">
                                <Input
                                    addonBefore={
                                        <span style={{width: '15vw', display: 'inline-block', textAlign: 'left'}}>
                                          {t('ModelEditor.model_name')}
                                        </span>
                                    }
                                    suffix={
                                        <Tooltip title={t('ModelEditor.model_name_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>

                            <Form.Item name="rootBoneName">
                                <Input
                                    addonBefore={
                                        <span style={{width: '15vw', display: 'inline-block', textAlign: 'left'}}>
                                          {t('ModelEditor.root_bone_name')}
                                        </span>
                                    }
                                    suffix={
                                        <Tooltip title={t('ModelEditor.root_bone_name_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>

                            <Form.Item name="rootBoneName">
                                <Input
                                    addonBefore={
                                        <span style={{width: '15vw', display: 'inline-block', textAlign: 'left'}}>
                                          {t('ModelEditor.root_bone_name')}
                                        </span>
                                    }
                                    suffix={
                                        <Tooltip title={t('ModelEditor.root_bone_name_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>

                            <Form.Item name="shadowCastingMode">
                                <Input
                                    addonBefore={
                                        <span style={{width: '15vw', display: 'inline-block', textAlign: 'left'}}>
                                          {t('ModelEditor.shadow_casting_mode')}
                                        </span>
                                    }
                                    suffix={
                                        <Tooltip title={t('ModelEditor.shadow_casting_mode_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                        </Collapse.Panel>
                    </Collapse>
                </div>


                <Card>
                    {tempModelMetadata && (
                        <MaterialListEditor
                            materials={tempModelMetadata.Materials || []}
                            onMaterialsChange={handleMaterialsChange}
                        />
                    )}
                </Card>
            </Form>
        </ConfigProvider>
    );
};

export default ModelMetadataEditor;
