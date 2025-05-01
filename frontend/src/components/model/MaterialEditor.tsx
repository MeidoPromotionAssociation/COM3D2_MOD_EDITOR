import React, {forwardRef, useEffect, useImperativeHandle, useMemo, useState} from 'react';
import debounce from 'lodash/debounce';
import {Collapse, ConfigProvider, Form, Input, Radio, Tooltip,} from 'antd';
import {COM3D2} from '../../../wailsjs/go/models';
import {useTranslation} from "react-i18next";
import Style3MateProperties from "../mate/Style3MateProperties";
import Style2MateProperties from "../mate/Style2MateProperties";
import Style1MateProperties from "../mate/Style1MateProperties";
import Style1MatePropertiesVirtualized from "../mate/Style1MatePropertiesVirtualized";
import {MateEditorViewModeKey} from "../../utils/LocalStorageKeys";
import {QuestionCircleOutlined} from "@ant-design/icons";
import Mate = COM3D2.Mate;
import Material = COM3D2.Material;
import TexProperty = COM3D2.TexProperty;
import ColProperty = COM3D2.ColProperty;
import VecProperty = COM3D2.VecProperty;
import FProperty = COM3D2.FProperty;
import RangeProperty = COM3D2.RangeProperty;
import TexOffsetProperty = COM3D2.TexOffsetProperty;
import TexScaleProperty = COM3D2.TexScaleProperty;
import KeywordProperty = COM3D2.KeywordProperty;

export interface MaterialEditorProps {
    material: Material | null;
    onMaterialChange?: (material: Material) => void;
}

export interface MaterialEditorRef {
    getMaterial: () => Material | null;
}

/**
 * MaterialEditor 组件
 *
 * 复用 MateEditor 中的表单组件，专门用于编辑 Material 对象
 * 可以嵌入到其他编辑器中，例如 ModelEditor
 */
const MaterialEditor = forwardRef<MaterialEditorRef, MaterialEditorProps>((props, ref) => {
    const {t} = useTranslation();

    // Material 数据
    const [material, setMaterial] = useState<Material | null>(props.material || null);

    // 为了复用 MateEditor 的组件，我们需要创建一个临时的 Mate 对象
    const [tempMateData, setTempMateData] = useState<Mate | null>(null);

    // 用于 antd 的表单来管理字段
    const [form] = Form.useForm();

    // 用来切换视图模式
    const [viewMode, setViewMode] = useState<1 | 2 | 3>(() => {
        const saved = localStorage.getItem(MateEditorViewModeKey);
        return saved ? Number(saved) as 1 | 2 | 3 : 1;
    });

    // 当外部 material 变化时，更新表单
    useEffect(() => {
        if (props.material) {
            setMaterial(props.material);

            // 创建一个临时的 Mate 对象，用于复用 MateEditor 的组件
            const tempMate = new Mate();
            tempMate.Material = props.material;
            setTempMateData(tempMate);

            // 设置表单值
            form.setFieldsValue(transformMaterialToForm(props.material));
        }
    }, [props.material]);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
        getMaterial: () => material
    }));

    /**
     * 把 Material 对象映射到表单字段
     */
    const transformMaterialToForm = (material: Material) => {
        return {
            materialName: material.Name,
            shaderName: material.ShaderName,
            shaderFilename: material.ShaderFilename,
            properties: material.Properties?.map((prop) => {
                // 不同类型的 property
                switch (prop.TypeName) {
                    case 'tex':
                        // TS: prop as TexProperty
                        const texProp = prop as TexProperty;
                        return {
                            TypeName: texProp.TypeName,
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
                            TypeName: colProp.TypeName,
                            propName: colProp.PropName,
                            colorR: colProp.Color[0],
                            colorG: colProp.Color[1],
                            colorB: colProp.Color[2],
                            colorA: colProp.Color[3],
                        };
                    case 'vec':
                        const vecProp = prop as VecProperty;
                        return {
                            TypeName: vecProp.TypeName,
                            propName: vecProp.PropName,
                            vec0: vecProp.Vector[0],
                            vec1: vecProp.Vector[1],
                            vec2: vecProp.Vector[2],
                            vec3: vecProp.Vector[3],
                        };
                    case 'f':
                        const fProp = prop as FProperty;
                        return {
                            TypeName: fProp.TypeName,
                            propName: fProp.PropName,
                            number: fProp.Number,
                        };
                    case 'range':
                        const rangeProp = prop as RangeProperty;
                        return {
                            TypeName: rangeProp.TypeName,
                            propName: rangeProp.PropName,
                            number: rangeProp.Number,
                        };
                    case 'tex_offset':
                        const texOffsetProp = prop as TexOffsetProperty;
                        return {
                            TypeName: texOffsetProp.TypeName,
                            propName: texOffsetProp.PropName,
                            offsetX: texOffsetProp.OffsetX,
                            offsetY: texOffsetProp.OffsetY,
                        };
                    case 'tex_scale':
                        const texScaleProp = prop as TexScaleProperty;
                        return {
                            TypeName: texScaleProp.TypeName,
                            propName: texScaleProp.PropName,
                            scaleX: texScaleProp.ScaleX,
                            scaleY: texScaleProp.ScaleY,
                        };
                    case 'keyword':
                        const keywordProp = prop as KeywordProperty;
                        return {
                            TypeName: keywordProp.TypeName,
                            propName: keywordProp.PropName,
                            // count: keywordProp.Count, // 自动计算
                            keywords: keywordProp.Keywords.map(k => ({
                                key: k.Key,
                                value: k.Value
                            })),
                        };
                    default:
                        return {
                            TypeName: 'unknown',
                            propName: 'unknown',
                        };
                }
            }) || [],
        };
    };

    /**
     * 把表单字段映射回 Material 对象
     */
    const transformFormToMaterial = (formValues: any, originalMaterial: Material): Material => {
        const updatedMaterial = Material.createFrom(originalMaterial);
        updatedMaterial.Name = formValues.materialName;
        updatedMaterial.ShaderName = formValues.shaderName;
        updatedMaterial.ShaderFilename = formValues.shaderFilename;

        // 处理 properties
        const newProps: any[] = [];
        if (Array.isArray(formValues.properties)) {
            formValues.properties.forEach((item: any) => {
                switch (item.TypeName) {
                    case 'tex':
                        // 根据 subTag 判断
                        if (item.subTag === 'tex2d' || item.subTag === 'cube') {
                            newProps.push({
                                TypeName: item.TypeName,
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
                                    TypeName: item.TypeName,
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
                                TypeName: item.TypeName,
                                PropName: item.propName,
                                SubTag: 'null',
                            });
                        }
                        break;
                    case 'col':
                        newProps.push({
                            TypeName: item.TypeName,
                            PropName: item.propName,
                            Color: [
                                parseFloat(item.colorR) ?? 0,
                                parseFloat(item.colorG) ?? 0,
                                parseFloat(item.colorB) ?? 0,
                                parseFloat(item.colorA) ?? 0,
                            ],
                        });
                        break;
                    case 'vec':
                        newProps.push({
                            TypeName: item.TypeName,
                            PropName: item.propName,
                            Vector: [
                                parseFloat(item.vec0) ?? 0,
                                parseFloat(item.vec1) ?? 0,
                                parseFloat(item.vec2) ?? 0,
                                parseFloat(item.vec3) ?? 0,
                            ],
                        });
                        break;
                    case 'f':
                        newProps.push({
                            TypeName: item.TypeName,
                            PropName: item.propName,
                            Number: parseFloat(item.number) ?? 0,
                        });
                        break;
                    case 'range':
                        newProps.push({
                            TypeName: item.TypeName,
                            PropName: item.propName,
                            Number: parseFloat(item.number) ?? 0,
                        });
                        break;
                    case 'tex_offset':
                        newProps.push({
                            TypeName: item.TypeName,
                            PropName: item.propName,
                            OffsetX: parseFloat(item.offsetX) ?? 0,
                            OffsetY: parseFloat(item.offsetY) ?? 0,
                        });
                        break;
                    case 'tex_scale':
                        newProps.push({
                            TypeName: item.TypeName,
                            PropName: item.propName,
                            ScaleX: parseFloat(item.scaleX) ?? 0,
                            ScaleY: parseFloat(item.scaleY) ?? 0,
                        });
                        break;
                    case 'keyword':
                        const keywords = item.keywords?.map((k: any) => ({
                            Key: k?.key ?? '',
                            Value: typeof k?.value === 'boolean' ? k.value : false
                        })) || [];

                        newProps.push({
                            TypeName: item.TypeName,
                            PropName: item.propName,
                            Count: keywords.length,  // 自动计算数量
                            Keywords: keywords
                        });
                        break;
                    default:
                        // unknown, do nothing
                        break;
                }
            });
        }

        // Set the properties array to the material
        updatedMaterial.Properties = newProps as any;
        return updatedMaterial;
    };

    // 手动更新 Material 对象
    const updateMaterialFromForm = () => {
        if (!material) return;

        // 获取当前表单值
        const currentFormValues = form.getFieldsValue(true);
        const updatedMaterial = transformFormToMaterial(currentFormValues, material);
        setMaterial(updatedMaterial);

        if (props.onMaterialChange) {
            props.onMaterialChange(updatedMaterial);
        }

        return updatedMaterial;
    };

    // 使用防抖函数延迟更新 Material 对象
    const debouncedUpdateMaterial = useMemo(
        () => debounce((allValues: any) => {
            if (!material) return;

            const updatedMaterial = transformFormToMaterial(allValues, material);
            setMaterial(updatedMaterial);

            if (props.onMaterialChange) {
                props.onMaterialChange(updatedMaterial);
            }
        }, 500), // 500ms 的防抖时间
        [material, props.onMaterialChange]
    );

    // 表单值变化时，使用防抖函数延迟更新 Material 对象
    const handleFormValuesChange = (changedValues: any, allValues: any) => {
        // 如果是添加新属性或修改属性类型，不立即更新
        // 只有当用户完成属性的配置后才更新

        // 检查是否有属性类型变化
        let shouldSkipUpdate = false;

        if (changedValues.properties) {
            // 检查是否有属性类型变化
            const hasTypeNameChange = Object.keys(changedValues.properties).some(key => {
                const prop = changedValues.properties[key];
                return prop?.TypeName !== undefined;
            });

            // 检查是否有属性名变化
            const hasPropNameChange = Object.keys(changedValues.properties).some(key => {
                const prop = changedValues.properties[key];
                return prop?.propName !== undefined;
            });

            // 检查是否有 tex 类型但没有 subTag 的属性
            const hasTexWithoutSubTag = Object.keys(allValues.properties || {}).some(key => {
                const fullProp = allValues.properties?.[key];
                return fullProp?.TypeName === 'tex' && !fullProp?.subTag;
            });

            // 检查是否是新添加的属性
            const isNewProperty = Object.keys(changedValues.properties).length === 1 &&
                Object.values(changedValues.properties)[0] === undefined;

            // 检查是否有 subTag 变化
            const hasSubTagChange = Object.keys(changedValues.properties).some(key =>
                changedValues.properties[key]?.subTag !== undefined);

            // 如果是以下情况，则跳过更新：
            // 1. 属性类型变化
            // 2. 新添加的属性
            // 3. TEX 类型但没有 subTag
            // 但如果是 subTag 变化，则允许更新
            shouldSkipUpdate = (hasTypeNameChange || isNewProperty || hasTexWithoutSubTag) && !hasSubTagChange;

            // 如果只是属性名变化，且不是 TEX 类型没有 subTag，则允许更新
            if (hasPropNameChange && !hasTypeNameChange && !hasTexWithoutSubTag) {
                shouldSkipUpdate = false;
            }
        }

        // 如果不需要跳过更新，则执行防抖更新
        if (!shouldSkipUpdate) {
            debouncedUpdateMaterial(allValues);
        }
    };

    // 处理 Mate 对象变化（用于 Style3MateProperties）
    const handleMateDataChange = (newMateData: Mate | null) => {
        if (!newMateData || !newMateData.Material) return;

        setTempMateData(newMateData);
        setMaterial(newMateData.Material);

        if (props.onMaterialChange) {
            props.onMaterialChange(newMateData.Material);
        }
    };

    return (
        <div style={{padding: '16px'}}>
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
                    labelCol={{style: {width: '15vw'}}}
                    requiredMark={false}
                    onValuesChange={handleFormValuesChange}
                    initialValues={material ? transformMaterialToForm(material) : {}}
                >
                    <Collapse defaultActiveKey={['basic']}>
                        <Collapse.Panel key="basic" header={t('MateEditor.file_header.basic_info')}>
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
                    </Collapse>

                    <div style={{marginBottom: 8, marginTop: 8}}>
                        <Radio.Group
                            block
                            value={viewMode}
                            onChange={(e) => {
                                // 在切换显示模式之前更新 material
                                if (material && (viewMode !== 3)) { // 非模式 3 时从表单拿数据，因为模式 3 是 JSON
                                    // 强制立即更新，不使用防抖
                                    const updatedMaterial = updateMaterialFromForm();

                                    // 更新临时 Mate 对象
                                    if (tempMateData && updatedMaterial) {
                                        const updatedTempMate = Mate.createFrom(tempMateData);
                                        updatedTempMate.Material = updatedMaterial;
                                        setTempMateData(updatedTempMate);
                                    }
                                }

                                setViewMode(e.target.value);
                                localStorage.setItem(MateEditorViewModeKey, e.target.value.toString());
                            }}
                            options={[
                                {label: t('MateEditor.style1'), value: 1},
                                {label: t('MateEditor.style2'), value: 2},
                                {label: t('MateEditor.style3'), value: 3},
                            ]}
                            optionType="button"
                            buttonStyle="solid"
                        />
                    </div>

                    {viewMode !== 3 && (
                        <Collapse defaultActiveKey={['properties']}>
                            <Collapse.Panel key="properties" header={t('MateEditor.property')}>
                                {viewMode === 1 && (
                                    <Form.List name="properties">
                                        {(fields, {add, remove}) =>
                                            fields.length > 70 ? (
                                                <Style1MatePropertiesVirtualized
                                                    fields={fields}
                                                    add={add}
                                                    remove={remove}
                                                    form={form}
                                                />
                                            ) : (
                                                <Style1MateProperties
                                                    fields={fields}
                                                    add={add}
                                                    remove={remove}
                                                    form={form}
                                                />
                                            )
                                        }
                                    </Form.List>
                                )}

                                {viewMode === 2 && (
                                    <Form.List name="properties">
                                        {(fields, {add, remove}) => (
                                            <Style2MateProperties
                                                fields={fields}
                                                add={add}
                                                remove={remove}
                                                form={form}
                                            />
                                        )}
                                    </Form.List>
                                )}
                            </Collapse.Panel>
                        </Collapse>
                    )}

                    {viewMode === 3 && (
                        <Style3MateProperties
                            mateData={tempMateData}
                            setMateData={handleMateDataChange}
                        />
                    )}
                </Form>
            </ConfigProvider>
        </div>
    );
});

export default MaterialEditor;
