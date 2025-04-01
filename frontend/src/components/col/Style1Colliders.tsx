import React from "react";
import {Button, FormInstance, FormListFieldData} from "antd";
import {DeleteOutlined} from "@ant-design/icons";
import type {FormListOperation} from "antd/es/form";
import {useTranslation} from "react-i18next";
import DynamicColliderFormItem from "./DynamicColliderFormItem";

/** 样式1：所有 Collider 顺序排布 */
const Style1Colliders: React.FC<{
    fields: FormListFieldData[];
    add: FormListOperation["add"];
    remove: FormListOperation["remove"];
    form: FormInstance;
}> = ({fields, add, remove, form}) => {
    const {t} = useTranslation();

    return (
        <>
            {fields.map(({key, name, ...restField}) => {
                return (
                    <div
                        key={key}
                        style={{
                            position: "relative",
                            padding: 8,
                            marginBottom: 10,
                            border: "1px solid #ccc",
                            borderRadius: 4
                        }}
                    >
                        <DynamicColliderFormItem name={name} restField={restField} form={form}/>
                        <Button
                            onClick={() => remove(name)}
                            style={{position: "absolute", bottom: 0, right: 0}}
                            icon={<DeleteOutlined/>}
                        >
                        </Button>
                    </div>
                );
            })}
            <Button block type="primary" onClick={() => add()}>
                {t('ColEditor.add_collider')}
            </Button>
        </>
    );
};

export default Style1Colliders;