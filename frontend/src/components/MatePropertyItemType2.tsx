import {Form, Input, InputNumber, Select, Space} from "antd";

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

    return (
        <div
            style={{
                marginBottom: 8,
                padding: 8,
                border: '1px solid #000',
                borderRadius: 4,
                height: '100%',
            }}
        >
            <Form.Item
                {...restField}
                label="Property Type"
                name={[name, 'propType']}
                labelCol={{style: {width: '100px'}}}
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
                labelCol={{style: {width: '100px'}}}
            >
                <Input/>
            </Form.Item>
            {currentPropType === 'tex' && (
                <>
                    <Form.Item
                        {...restField}
                        label="subTag"
                        name={[name, 'subTag']}
                        labelCol={{style: {width: '100px'}}}
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
                    {(currentSubTag === 'tex2d' || currentSubTag === 'cube') && (
                        <>
                            <Form.Item
                                {...restField}
                                label="tex2dName"
                                name={[name, 'tex2dName']}
                                labelCol={{style: {width: '100px'}}}
                            >
                                <Input/>
                            </Form.Item>
                            <Form.Item
                                {...restField}
                                label="tex2dPath"
                                name={[name, 'tex2dPath']}
                                labelCol={{style: {width: '100px'}}}
                            >
                                <Input/>
                            </Form.Item>
                            <Space>
                                <Form.Item
                                    {...restField}
                                    label="offsetX"
                                    name={[name, 'offsetX']}
                                    labelCol={{style: {width: '60px'}}}
                                >
                                    <InputNumber/>
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    label="offsetY"
                                    name={[name, 'offsetY']}
                                    labelCol={{style: {width: '60px'}}}
                                >
                                    <InputNumber/>
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    label="scaleX"
                                    name={[name, 'scaleX']}
                                    labelCol={{style: {width: '60px'}}}
                                >
                                    <InputNumber/>
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    label="scaleY"
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
                                label="discardedStr1"
                                name={[name, 'discardedStr1']}
                                labelCol={{style: {width: '100px'}}}
                            >
                                <Input/>
                            </Form.Item>
                            <Form.Item
                                {...restField}
                                label="discardedStr2"
                                name={[name, 'discardedStr2']}
                                labelCol={{style: {width: '100px'}}}
                            >
                                <Input/>
                            </Form.Item>
                        </>
                    )}
                </>
            )}
            {currentPropType === 'col' && (
                <Space>
                    <Form.Item
                        {...restField}
                        label="R"
                        name={[name, 'colorR']}
                        labelCol={{style: {width: '25px'}}}
                    >
                        <InputNumber/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label="G"
                        name={[name, 'colorG']}
                        labelCol={{style: {width: '25px'}}}
                    >
                        <InputNumber/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label="B"
                        name={[name, 'colorB']}
                        labelCol={{style: {width: '25px'}}}
                    >
                        <InputNumber/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label="A"
                        name={[name, 'colorA']}
                        labelCol={{style: {width: '25px'}}}
                    >
                        <InputNumber/>
                    </Form.Item>
                </Space>
            )}
            {currentPropType === 'vec' && (
                <Space align="baseline">
                    <Form.Item
                        {...restField}
                        label="vec0"
                        name={[name, 'vec0']}
                        labelCol={{style: {width: '100px'}}}
                    >
                        <InputNumber/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label="vec1"
                        name={[name, 'vec1']}
                        labelCol={{style: {width: '100px'}}}
                    >
                        <InputNumber/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label="vec2"
                        name={[name, 'vec2']}
                        labelCol={{style: {width: '100px'}}}
                    >
                        <InputNumber/>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        label="vec3"
                        name={[name, 'vec3']}
                        labelCol={{style: {width: '100px'}}}
                    >
                        <InputNumber/>
                    </Form.Item>
                </Space>
            )}
            {currentPropType === 'f' && (
                <Form.Item
                    {...restField}
                    label="Number"
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