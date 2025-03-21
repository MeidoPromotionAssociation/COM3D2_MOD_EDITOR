import React from 'react';
import {Button, FormListFieldData} from 'antd';
import type {FormListOperation} from 'antd/es/form';
import {useTranslation} from "react-i18next";
import {PlusOutlined} from "@ant-design/icons";
import MatePropertyListType1Virtualized from "./MatePropertyListType1Virtualized";


// ------------------- 样式1.5：上下排列每个属性，为大文件准备的虚拟渲染 -------------------
const Style1MatePropertiesVirtualized: React.FC<{
    fields: FormListFieldData[];
    add: FormListOperation["add"];
    remove: FormListOperation["remove"];
    form: any;
}> = ({fields, add, remove, form}) => {
    const {t} = useTranslation();

    return (
        <>
            <MatePropertyListType1Virtualized
                fields={fields}
                remove={remove}
                form={form}
            />

            <Button
                type="primary"
                onClick={() => add()}
                block
                icon={<PlusOutlined/>}
                style={{marginTop: 8}}
            >
                {t("MateEditor.add_new_property")}
            </Button>
        </>
    );
};


export default Style1MatePropertiesVirtualized