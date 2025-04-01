import {Button, Flex, Form, FormInstance, Input, InputNumber, Select, Space, Switch, Table, Tooltip} from "antd";
import {useTranslation} from "react-i18next";
import {DeleteOutlined, PlusOutlined, QuestionCircleOutlined} from "@ant-design/icons";
import React from "react";
import ColorPickerSync from "./ColorPickerSync";

/**
 * 单独的 PropertyItem 组件，用于渲染每个 properties 项目，
 * 并使用 Form.useWatch 监听当前项目的 TypeName 和 subTag 字段变化
 */
const MatePropertyItemType1 = ({
                                   name,
                                   restField,
                                   form,
                               }: {
    name: number;
    restField: any;
    form: FormInstance;
}) => {
    const currentTypeName = Form.useWatch(['properties', name, 'TypeName'], form);
    const currentSubTag = Form.useWatch(['properties', name, 'subTag'], form);
    const {t} = useTranslation();

    return (
        <div
            style={{
                marginBottom: 8,
                padding: 8,
                border: '1px solid #000',
                borderRadius: 4,
                textAlign: 'left',
            }}
        >
            <Form.Item initialValue='tex'
                       {...restField}
                       label={t('MateEditor.property_type')}
                       name={[name, 'TypeName']}
                       labelCol={{style: {width: '100px'}}}
            >
                <Select
                    dropdownStyle={{textAlign: 'left'}}
                    options={[
                        {label: t('MateEditor.tex'), value: 'tex'},
                        {label: t('MateEditor.col'), value: 'col'},
                        {label: t('MateEditor.vec'), value: 'vec'},
                        {label: t('MateEditor.f'), value: 'f'},
                        {label: t('MateEditor.range'), value: 'range'},
                        {label: t('MateEditor.tex_offset'), value: 'tex_offset'},
                        {label: t('MateEditor.tex_scale'), value: 'tex_scale'},
                        {label: t('MateEditor.keyword'), value: 'keyword'},
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
                <Input
                    suffix={
                        <Tooltip title={t('MateEditor.property_name_tip')}>
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    }
                />
            </Form.Item>
            {currentTypeName === 'tex' && (
                <>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.subTag')}
                        name={[name, 'subTag']}
                        labelCol={{style: {width: '100px'}}}
                        //style={{ display: 'flex', alignItems: 'center' }} // 让内容水平排列
                    >
                        <Select
                            //style={{ width: '20vw', flexShrink: 0 }}
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
                                    labelCol={{style: {width: '100px'}}}
                                >
                                    <InputNumber/>
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    label={t('MateEditor.offsetY')}
                                    name={[name, 'offsetY']}
                                    labelCol={{style: {width: '100px'}}}
                                >
                                    <InputNumber/>
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    label={t('MateEditor.scaleX')}
                                    name={[name, 'scaleX']}
                                    labelCol={{style: {width: '100px'}}}
                                >
                                    <InputNumber/>
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    label={t('MateEditor.scaleY')}
                                    name={[name, 'scaleY']}
                                    labelCol={{style: {width: '100px'}}}
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
            {currentTypeName === 'col' && (
                <>
                    <Space>
                        <Form.Item
                            {...restField}
                            label={t('MateEditor.R')}
                            name={[name, 'colorR']}
                            labelCol={{style: {width: '100px'}}}
                        >
                            <InputNumber min={0} max={1} step={0.01}/>
                        </Form.Item>
                        <Form.Item
                            {...restField}
                            label={t('MateEditor.G')}
                            name={[name, 'colorG']}
                            labelCol={{style: {width: '100px'}}}
                        >
                            <InputNumber min={0} max={1} step={0.01}/>
                        </Form.Item>
                        <Form.Item
                            {...restField}
                            label={t('MateEditor.B')}
                            name={[name, 'colorB']}
                            labelCol={{style: {width: '100px'}}}
                        >
                            <InputNumber min={0} max={1} step={0.01}/>
                        </Form.Item>
                        <Form.Item
                            {...restField}
                            label={t('MateEditor.A')}
                            name={[name, 'colorA']}
                            labelCol={{style: {width: '100px'}}}
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
                        labelCol={{style: {width: '100px'}}}
                    >
                        <ColorPickerSync form={form} name={name}/>
                    </Form.Item>
                </>
            )}
            {currentTypeName === 'vec' && (
                <Space align="baseline">
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.vec_x')}
                        name={[name, 'vec0']}
                        labelCol={{style: {width: '100px'}}}
                    >
                        <InputNumber step={0.01}/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.vec_y')}
                        name={[name, 'vec1']}
                        labelCol={{style: {width: '100px'}}}
                    >
                        <InputNumber step={0.01}/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.vec_z')}
                        name={[name, 'vec2']}
                        labelCol={{style: {width: '100px'}}}
                    >
                        <InputNumber step={0.01}/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.vec_w')}
                        name={[name, 'vec3']}
                        labelCol={{style: {width: '100px'}}}
                    >
                        <InputNumber step={0.01}/>
                    </Form.Item>
                    <Form.Item>
                        <Tooltip title={t('MateEditor.vec_tip')}>
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    </Form.Item>
                </Space>
            )}
            {currentTypeName === 'f' && (
                <Flex gap="small" style={{width: '100%'}}>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.number')}
                        name={[name, 'number']}
                        labelCol={{style: {width: '100px'}}}
                        style={{flex: 1}}
                    >
                        <InputNumber style={{width: '100%'}} step={0.01}/>
                    </Form.Item>
                    <Form.Item>
                        <Tooltip title={t('MateEditor.f_tip')}>
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    </Form.Item>
                </Flex>
            )}
            {currentTypeName === 'range' && (
                <Flex gap="small" style={{width: '100%'}}>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.number')}
                        name={[name, 'number']}
                        labelCol={{style: {width: '100px'}}}
                        style={{flex: 1}}
                    >
                        <InputNumber style={{width: '100%'}} step={0.01}/>
                    </Form.Item>
                    <Form.Item>
                        <Tooltip title={t('MateEditor.range_tip')}>
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    </Form.Item>
                </Flex>
            )}
            {currentTypeName === 'tex_offset' && (
                <Flex gap="small" style={{width: '100%'}}>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.offsetX')}
                        name={[name, 'offsetX']}
                        labelCol={{style: {width: '100px'}}}
                        style={{flex: 1}}
                    >
                        <InputNumber style={{width: '100%'}} step={0.01}/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.offsetY')}
                        name={[name, 'offsetY']}
                        labelCol={{style: {width: '100px'}}}
                        style={{flex: 1}}
                    >
                        <InputNumber style={{width: '100%'}} step={0.01}/>
                    </Form.Item>
                    <Form.Item>
                        <Tooltip title={t('MateEditor.tex_offset_tip')}>
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    </Form.Item>
                </Flex>
            )}
            {currentTypeName === 'tex_scale' && (
                <Flex gap="small" style={{width: '100%'}}>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.scaleX')}
                        name={[name, 'scaleX']}
                        labelCol={{style: {width: '100px'}}}
                        style={{flex: 1}}
                    >
                        <InputNumber style={{width: '100%'}} step={0.01}/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label={t('MateEditor.scaleY')}
                        name={[name, 'scaleY']}
                        labelCol={{style: {width: '100px'}}}
                        style={{flex: 1}}
                    >
                        <InputNumber style={{width: '100%'}} step={0.01}/>
                    </Form.Item>
                    <Form.Item>
                        <Tooltip title={t('MateEditor.tex_scale_tip')}>
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    </Form.Item>
                </Flex>
            )}
            {currentTypeName === 'keyword' && (
                <Form.List name={[name, 'keywords']}>
                    {(fields, {add, remove}) => (
                        <Table
                            dataSource={fields}
                            rowKey="key"
                            size="small"
                            bordered
                            pagination={false}
                            columns={[
                                {
                                    title: t('MateEditor.keyword_no_brackets'),
                                    render: (_, field) => (
                                        <Form.Item
                                            {...restField}
                                            name={[field.name, 'key']}
                                            style={{margin: 0}}
                                        >
                                            <Input suffix={
                                                <Tooltip title={t('MateEditor.keyword_tip')}>
                                                    <QuestionCircleOutlined/>
                                                </Tooltip>
                                            }/>
                                        </Form.Item>
                                    )
                                },
                                {
                                    title: t('MateEditor.keyword_valve'),
                                    width: 120,
                                    render: (_, field) => (
                                        <Form.Item
                                            {...restField}
                                            name={[field.name, 'value']}
                                            valuePropName="checked"
                                            style={{margin: 0}}
                                        >
                                            <Switch
                                                checkedChildren="true"
                                                unCheckedChildren="false"
                                                size="small"
                                            />
                                        </Form.Item>
                                    )
                                },
                                {
                                    title: t('MateEditor.operate'),
                                    width: 80,
                                    render: (_, field) => (
                                        <Button
                                            danger
                                            icon={<DeleteOutlined/>}
                                            onClick={() => remove(field.name)}
                                            size="small"
                                        />
                                    )
                                }
                            ]}
                            footer={() => (
                                <Button
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined/>}
                                >
                                    {t('MateEditor.add_key_value')}
                                </Button>
                            )}
                        />
                    )}
                </Form.List>
            )}
        </div>
    );
};

export default MatePropertyItemType1;