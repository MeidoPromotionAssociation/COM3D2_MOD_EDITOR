import {Form, Input, InputNumber, Select, Space, Tooltip} from "antd";
import {useTranslation} from "react-i18next";
import {QuestionCircleOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import {AggregationColor} from "antd/es/color-picker/color";
import ColorPickerSync from "./ColorPickerSync";

/**
 * 单独的 PropertyItem 组件，用于渲染每个 properties 项目，
 * 并使用 Form.useWatch 监听当前项目的 propType 和 subTag 字段变化
 */
const MatePropertyItemType2 = ({
                                   name,
                                   restField,
                                   form,
                               }: {
    name: number;
    restField: any;
    form: any;
}) => {
    const currentPropType = Form.useWatch(['properties', name, 'propType'], form);
    const currentSubTag = Form.useWatch(['properties', name, 'subTag'], form);
    const {t} = useTranslation();

    // 监听 Form 里的颜色值
    const colorR = Form.useWatch([`properties`, name, 'colorR'], form) || 255;
    const colorG = Form.useWatch([`properties`, name, 'colorG'], form) || 255;
    const colorB = Form.useWatch([`properties`, name, 'colorB'], form) || 255;
    const colorA = Form.useWatch([`properties`, name, 'colorA'], form) ?? 1;

    // 颜色状态 (用于 ColorPicker)
    const [color, setColor] = useState<string>(`rgba(${colorR},${colorG},${colorB},${colorA})`);

    // **监听 Form 颜色值变化，更新 ColorPicker 颜色**
    useEffect(() => {
        setColor(`rgba(${colorR},${colorG},${colorB},${colorA})`);
    }, [colorR, colorG, colorB, colorA]);

    // **处理 ColorPicker 颜色变化**
    const handleColorChange = (colorObj: AggregationColor) => {
        const {r, g, b, a} = colorObj.toRgb();
        setColor(`rgba(${r},${g},${b},${a})`); // 更新 ColorPicker 状态
        form.setFieldsValue({
            [`properties[${name}].colorR`]: r,
            [`properties[${name}].colorG`]: g,
            [`properties[${name}].colorB`]: b,
            [`properties[${name}].colorA`]: a,
        });
    };

    return (
        <div
            style={{
                marginBottom: 8,
                padding: 8,
                border: '1px solid #000',
                borderRadius: 4,
                height: '100%',
                textAlign: 'left',
            }}
        >
            <Form.Item
                {...restField}
                label={t('MateEditor.property_type')}
                name={[name, 'propType']}
                labelCol={{style: {width: '100px'}}}
            >
                <Select
                    dropdownStyle={{textAlign: 'left'}}
                    options={[
                        {label: t('MateEditor.tex'), value: 'tex'},
                        {label: t('MateEditor.col'), value: 'col'},
                        {label: t('MateEditor.vec'), value: 'vec'},
                        {label: t('MateEditor.f'), value: 'f'},
                        {label: t('MateEditor.unknown'), value: 'unknown'},
                    ]}
                />
            </Form.Item>
            <Form.Item
                {...restField}
                label={t('MateEditor.property_name')}
                name={[name, 'propName']}
                labelCol={{style: {width: '100px'}}}
            >
                <Input/>
            </Form.Item>
            {currentPropType === 'tex' && (
                <>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.subTag')}
                        name={[name, 'subTag']}
                        labelCol={{style: {width: '100px'}}}
                    >
                        <Select
                            dropdownStyle={{textAlign: 'left'}}
                            options={[
                                {label: t('MateEditor.tex2d'), value: 'tex2d'},
                                {label: t('MateEditor.tex_cube'), value: 'cube'},
                                {label: t('MateEditor.texRT'), value: 'texRT'},
                                {label: t('MateEditor.tex_null'), value: 'null'},
                            ]}
                        />
                    </Form.Item>
                    {(currentSubTag === 'tex2d' || currentSubTag === 'cube') && (
                        <>
                            <Form.Item
                                {...restField}
                                label={t('MateEditor.tex2dName')}
                                name={[name, 'tex2dName']}
                                labelCol={{style: {width: '100px'}}}
                            >
                                <Input
                                    suffix={
                                        <Tooltip title={t('MateEditor.tex2dName_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                            <Form.Item
                                {...restField}
                                label={t('MateEditor.tex2dPath')}
                                name={[name, 'tex2dPath']}
                                labelCol={{style: {width: '100px'}}}
                            >
                                <Input
                                    suffix={
                                        <Tooltip title={t('MateEditor.tex2dPath_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                            <Space>
                                <Form.Item
                                    {...restField}
                                    label={t('MateEditor.offsetX')}
                                    name={[name, 'offsetX']}
                                    labelCol={{style: {width: '60px'}}}
                                >
                                    <InputNumber/>
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    label={t('MateEditor.offsetY')}
                                    name={[name, 'offsetY']}
                                    labelCol={{style: {width: '60px'}}}
                                >
                                    <InputNumber/>
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    label={t('MateEditor.scaleX')}
                                    name={[name, 'scaleX']}
                                    labelCol={{style: {width: '60px'}}}
                                >
                                    <InputNumber/>
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    label={t('MateEditor.scaleY')}
                                    name={[name, 'scaleY']}
                                    labelCol={{style: {width: '60px'}}}
                                >
                                    <InputNumber/>
                                </Form.Item>
                            </Space>
                        </>
                    )}
                    {currentSubTag === 'texRT' && (
                        <>
                            <Form.Item
                                {...restField}
                                label={t('MateEditor.unknown_text_1')}
                                name={[name, 'discardedStr1']}
                                labelCol={{style: {width: '100px'}}}
                            >
                                <Input
                                    suffix={
                                        <Tooltip title={t('MateEditor.unknown_text_1_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                            <Form.Item
                                {...restField}
                                label={t('MateEditor.unknown_text_2')}
                                name={[name, 'discardedStr2']}
                                labelCol={{style: {width: '100px'}}}
                            >
                                <Input
                                    suffix={
                                        <Tooltip title={t('MateEditor.unknown_text_2_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                        </>
                    )}
                </>
            )}
            {currentPropType === 'col' && (
                <>
                    <Space>
                        <Form.Item
                            {...restField}
                            label={t('MateEditor.R')}
                            name={[name, 'colorR']}
                            labelCol={{style: {width: '60px'}}}
                        >
                            <InputNumber min={0} max={255}/>
                        </Form.Item>
                        <Form.Item
                            {...restField}
                            label={t('MateEditor.G')}
                            name={[name, 'colorG']}
                            labelCol={{style: {width: '60px'}}}
                        >
                            <InputNumber min={0} max={255}/>
                        </Form.Item>
                        <Form.Item
                            {...restField}
                            label={t('MateEditor.B')}
                            name={[name, 'colorB']}
                            labelCol={{style: {width: '60px'}}}
                        >
                            <InputNumber min={0} max={255}/>
                        </Form.Item>
                        <Form.Item
                            {...restField}
                            label={t('MateEditor.A')}
                            name={[name, 'colorA']}
                            labelCol={{style: {width: '60px'}}}
                        >
                            <InputNumber min={0} max={1} step={0.01}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('MateEditor.col_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Space>
                    <Form.Item
                        label={t('MateEditor.color_picker')}
                        labelCol={{style: {width: '60px'}}}
                    >
                        <ColorPickerSync form={form} name={name}/>
                    </Form.Item>
                </>
            )}
            {currentPropType === 'vec' && (
                <Space align="baseline">
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.vec_x')}
                        name={[name, 'vec0']}
                        labelCol={{style: {width: '60px'}}}
                    >
                        <InputNumber/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.vec_y')}
                        name={[name, 'vec1']}
                        labelCol={{style: {width: '60px'}}}
                    >
                        <InputNumber/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.vec_z')}
                        name={[name, 'vec2']}
                        labelCol={{style: {width: '60px'}}}
                    >
                        <InputNumber/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.vec_w')}
                        name={[name, 'vec3']}
                        labelCol={{style: {width: '60px'}}}
                    >
                        <InputNumber/>
                    </Form.Item>
                    <Form.Item>
                        <Tooltip title={t('MateEditor.vec_tip')}>
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    </Form.Item>
                </Space>
            )}
            {currentPropType === 'f' && (
                <Form.Item
                    {...restField}
                    label={t('MateEditor.number')}
                    name={[name, 'number']}
                    labelCol={{style: {width: '100px'}}}
                >
                    <InputNumber style={{width: '100%'}}/>
                </Form.Item>
            )}
        </div>
    );
};

export default MatePropertyItemType2;