import React, {useEffect} from "react";
import {FormInstance} from "antd";
import KeyframeEditorWithTable from "../common/KeyframeEditorWithTable";
import {useWatch} from "antd/es/form/Form";

interface KeyframeEditorWrapper {
    form: FormInstance;
    nestedPath: (string | number)[]; // The nested path like [field.name, 'curveKeyframes']
    tempFieldName?: string; // Optional custom temporary field name
}

const KeyframeEditorWrapper: React.FC<KeyframeEditorWrapper> = ({
                                                                    form,
                                                                    nestedPath,
                                                                    tempFieldName,
                                                                }) => {
    // Create a unique temporary field name if not provided
    const actualTempField = tempFieldName || `temp_keyframes_${nestedPath.join('_')}`;
    const tempData = useWatch(actualTempField, form);

    // 当临时字段变化时同步到嵌套路径
    useEffect(() => {
        if (tempData) {
            form.setFields([{
                name: nestedPath,
                value: tempData
            }]);
        }
    }, [tempData, form, nestedPath]);

    // 初始化逻辑简化
    useEffect(() => {
        const nestedData = form.getFieldValue(nestedPath) || [];
        form.setFieldsValue({[actualTempField]: nestedData});

        return () => {
            // 清理时直接使用最新值同步
            const finalData = form.getFieldValue(actualTempField);
            if (finalData) {
                form.setFields([{
                    name: nestedPath,
                    value: finalData
                }]);
            }
            form.setFields([{
                name: [actualTempField],
                value: undefined
            }]);
        };
    }, [form, nestedPath, actualTempField]);

    return (
        <KeyframeEditorWithTable
            keyframesFieldName={actualTempField}
            form={form}
        />
    );
};

export default KeyframeEditorWrapper;
