import React from 'react';
import {Button, Divider, Form, FormListFieldData} from 'antd';
import type {FormListOperation} from 'antd/es/form';
import {useTranslation} from "react-i18next";
import {DeleteOutlined, PlusOutlined} from "@ant-design/icons";
import MatePropertyItemType1 from "./MatePropertyItemType1";

// ------------------- 样式1：上下排列每个属性 -------------------
const Style1MateProperties: React.FC<{
    fields: FormListFieldData[];
    add: FormListOperation['add'];
    remove: FormListOperation['remove'];
    form: any;
}> = ({fields, add, remove, form}) => {
    const {t} = useTranslation();

    // 1. 先按 TypeName 进行分组
    const groupedFields = fields.reduce((acc, field) => {
        const typeName = form.getFieldValue(['properties', field.name, 'TypeName']) || "unknown"; // 获取 TypeName
        if (!acc[typeName]) acc[typeName] = [];
        acc[typeName].push(field);
        return acc;
    }, {} as Record<string, FormListFieldData[]>);

    return (
        <>
            {/* 2. 遍历分组后的数据进行渲染 */}
            {Object.entries(groupedFields).map(([typeName, groupFields], id) => (
                <div key={`groupedFields-${id}`}>
                    {/* 3. 在每个 typeName 组的开头加一个分割线 */}
                    <Divider>{t(`MateEditor.${typeName}`)}</Divider>

                    {/* 4. 渲染该 typeName 组内的所有属性 */}
                    {groupFields.map(({key, name, ...restField}, id) => (
                        <div key={`groupFields-item-${groupFields}-${id}-${typeName}-${name}`}
                             style={{position: "relative", marginBottom: 16}}>
                            <MatePropertyItemType1 name={name} restField={restField} form={form}/>
                            <Button
                                onClick={() => remove(name)}
                                style={{position: "absolute", bottom: 0, right: 0}}
                                icon={<DeleteOutlined/>}
                            />
                        </div>
                    ))}
                </div>
            ))}

            {/* 5. 添加新属性按钮 */}
            <Form.Item>
                <Button type="primary" onClick={() => add()} block icon={<PlusOutlined/>}>
                    {t("MateEditor.add_new_property")}
                </Button>
            </Form.Item>
        </>
    );
};


export default Style1MateProperties