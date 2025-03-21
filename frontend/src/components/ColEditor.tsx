import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {Checkbox, Collapse, ConfigProvider, Form, Input, message, Radio, Space} from "antd";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {SaveFile} from "../../wailsjs/go/main/App";
import {ReadColFile, WriteColFile} from "../../wailsjs/go/COM3D2/ColService";
import {useTranslation} from "react-i18next";
import {COM3D2HeaderConstants} from "../utils/ConstCOM3D2";
import Style1Colliders from "./col/Style1Colliders";
import Style2Properties from "./col/Style2Properties";
import DynamicBoneColliderBase = COM3D2.DynamicBoneColliderBase;
import DynamicBoneCollider = COM3D2.DynamicBoneCollider;
import DynamicBonePlaneCollider = COM3D2.DynamicBonePlaneCollider;
import DynamicBoneMuneCollider = COM3D2.DynamicBoneMuneCollider;
import MissingCollider = COM3D2.MissingCollider;
import ColModel = COM3D2.Col;


/** ColEditorProps:
 *  filePath: 传入要打开的 .col 文件路径
 */
interface ColEditorProps {
    filePath?: string;
}

/** ColEditorRef:
 *  提供给父组件或外部的操作方法，例如读取、保存、另存为
 */
export interface ColEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

/**
 * ColEditor 组件：
 *  - 读取/编辑/保存 .col 文件
 *  - 类似 MateEditor 的用法
 */
const ColEditor = forwardRef<ColEditorRef, ColEditorProps>((props, ref) => {
    const {t} = useTranslation();
    const {filePath} = props;

    // Col 数据对象
    const [colData, setColData] = useState<ColModel | null>(null);

    // 是否允许编辑 Signature、Version 等字段
    const [headerEditable, setHeaderEditable] = useState(false);

    // antd form
    const [form] = Form.useForm();

    // 用来切换视图模式
    const [viewMode, setViewMode] = useState<1 | 2>(() => {
        const saved = localStorage.getItem("colEditorViewMode");
        return saved ? Number(saved) as 1 | 2 : 1;
    });

    /** 组件挂载或 filePath 改变时，如果传入了 filePath 就自动读取一次 */
    useEffect(() => {
        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

            handleReadColFile();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            // 没有 filePath 时，可初始化一个新的 Col 对象
            const empty = new ColModel();
            empty.Signature = COM3D2HeaderConstants.ColSignature;
            empty.Version = COM3D2HeaderConstants.ColVersion;
            empty.Colliders = [];
            setColData(empty);
            form.resetFields();
        }
    }, [filePath]);


    /** 读取 Col 文件 */
    async function handleReadColFile() {
        if (!filePath) {
            message.error(t('Infos.pls_open_file_first'));
            return;
        }
        try {
            const data = await ReadColFile(filePath);
            setColData(data);
            // 映射到 Form
            form.setFieldsValue(transformColToForm(data));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_col_file_failed_colon') + error);
        }
    }

    /** 保存 Col 文件（覆盖写回） */
    async function handleSaveColFile() {
        if (!filePath) {
            message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
            return;
        }
        if (!colData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }
        try {
            // 模式 2 JSON 编辑，直接保存
            if (viewMode === 2) {
                await WriteColFile(filePath, colData);
                message.success(t('Infos.success_save_file'));
                return;
            }
            // 其他模式使用表单数据
            // 拿到表单最新数据并组装回 Col 对象
            const values = form.getFieldsValue(true);
            const newCol = transformFormToCol(values, colData);

            await WriteColFile(filePath, newCol);
            message.success(t('Infos.success_save_file'));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.save_file_failed_colon') + error);
        }
    }

    /** 另存为 Col 文件 */
    async function handleSaveAsColFile() {
        if (!colData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }

        try {
            // 模式 2 JSON 编辑，直接保存
            if (viewMode === 2) {

                const newPath = await SaveFile("*.col", t('Infos.com3d2_col_file'));
                if (!newPath) {
                    // 用户取消
                    return;
                }
                await WriteColFile(newPath, colData);
                message.success(t('Infos.success_save_as_file_colon') + newPath);
            }


            const values = form.getFieldsValue(true);
            const newCol = transformFormToCol(values, colData);

            // 让用户选择一个保存路径
            const newPath = await SaveFile("*.col", t('Infos.com3d2_col_file'));
            if (!newPath) {
                // 用户取消
                return;
            }
            await WriteColFile(newPath, newCol);
            message.success(t('Infos.success_save_as_file_colon') + newPath);
        } catch (error: any) {
            message.error(t('Errors.save_as_file_failed_colon') + error.message);
            console.error(error);
        }
    }

    /** 监听 Ctrl+S，进行保存 */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSaveColFile();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSaveColFile]);


    /** 暴露给父组件的 Ref 方法：读取、保存、另存为 */
    useImperativeHandle(ref, () => ({
        handleReadFile: handleReadColFile,
        handleSaveFile: handleSaveColFile,
        handleSaveAsFile: handleSaveAsColFile
    }));

    /**
     * 将后端的 Col 对象 -> 前端表单字段
     */
// 要在 transformColToForm 函数内进行的修改
    function transformColToForm(col: ColModel) {
        // 返回顶层字段 + 一个统一的“properties”
        return {
            signature: col.Signature,
            version: col.Version,

            colliders: col.Colliders?.map((collider) => {
                const base = (collider.Base as DynamicBoneColliderBase);

                const item: any = {
                    TypeName: collider.TypeName,
                    parentName: base.ParentName,
                    selfName: base.SelfName,
                    localPosition: base.LocalPosition || [0, 0, 0],
                    localRotation: base.LocalRotation || [0, 0, 0, 0],
                    localScale: base.LocalScale || [1, 1, 1],
                    direction: base.Direction,
                    center: base.Center || [0, 0, 0],
                    bound: base.Bound
                };

                switch (collider.TypeName) {
                    case "dbc":
                        item.radius = collider.Radius;
                        item.height = collider.Height;
                        break;
                    case "dbm":
                        item.radius = collider.Radius;
                        item.height = collider.Height;
                        item.scaleRateMulMax = collider.ScaleRateMulMax;
                        item.centerRateMax = collider.CenterRateMax || [0, 0, 0];
                        break;
                    case "dpc":
                        // DynamicBonePlaneCollider 没有额外字段
                        break;
                    case "missing":
                        // missingCollider 无额外字段
                        break;
                    default:
                        break;
                }
                return item;
            })
        };
    }


    /**
     * 前端表单字段 -> Col 对象
     */
    function transformFormToCol(values: any, oldCol: ColModel): ColModel {
        // 复制一份
        const newCol = COM3D2.Col.createFrom(oldCol);

        if (headerEditable) {
            newCol.Signature = values.signature;
            newCol.Version = parseInt(values.version, 10);
        }

        // 处理 colliders
        const newColliders: any[] = [];
        if (Array.isArray(values.colliders)) {
            for (const item of values.colliders) {
                const typeName = item.TypeName || 'missing'; // Default to 'dbc' if empty

                const baseData = new DynamicBoneColliderBase({
                    ParentName: item.parentName || "",
                    SelfName: item.selfName || "",
                    LocalPosition: item.localPosition || [0, 0, 0],
                    LocalRotation: item.localRotation || [0, 0, 0, 0],
                    LocalScale: item.localScale || [1, 1, 1],
                    Direction: Number(item.direction),
                    Center: item.center || [0, 0, 0],
                    Bound: Number(item.bound)
                });

                let collider: any;
                switch (typeName) {
                    case "dbc": {
                        collider = new DynamicBoneCollider({
                            Base: baseData,
                            Radius: parseFloat(item.radius) || 0,
                            Height: parseFloat(item.height) || 0
                        });
                        break;
                    }
                    case "dbm": {
                        collider = new DynamicBoneMuneCollider({
                            Base: baseData,
                            Radius: parseFloat(item.radius) || 0,
                            Height: parseFloat(item.height) || 0,
                            ScaleRateMulMax: parseFloat(item.scaleRateMulMax) || 0,
                            CenterRateMax: item.centerRateMax || [0, 0, 0]
                        });
                        break;
                    }
                    case "dpc": {
                        collider = new DynamicBonePlaneCollider({
                            Base: baseData
                        });
                        break;
                    }
                    case "missing": {
                        collider = new MissingCollider({});
                        break;
                    }
                    default: {
                        console.error("Unknown col type " + typeName);
                    }
                }
                // Explicitly set the TypeName property
                collider.TypeName = typeName;

                newColliders.push(collider);
            }
        }
        newCol.Colliders = newColliders;
        return newCol;
    }

    // 当 colData 变化时同步到表单
    useEffect(() => {
        if (colData) {
            const formValues = transformColToForm(colData);
            form.setFieldsValue(formValues);
        }
    }, [colData, form]);


    return (
        <div style={{padding: 10}}>
            <ConfigProvider
                theme={{
                    components: {
                        Form: {
                            itemMarginBottom: 10
                        }
                    }
                }}
            >
                <Form
                    form={form}
                    layout="horizontal"
                    labelAlign="left"
                    size="small"
                    labelCol={{style: {width: '10vw'}}}
                >
                    <Collapse>
                        <Collapse.Panel header={t('ColEditor.file_header.file_head')} key="basic">
                            <Space>
                                <Form.Item name="signature"
                                           initialValue={COM3D2HeaderConstants.ColSignature.toString()}>
                                    <Input
                                        disabled={!headerEditable}
                                        addonBefore={t('ColEditor.file_header.Signature')}
                                    />
                                </Form.Item>
                                <Form.Item name="version" initialValue={COM3D2HeaderConstants.ColVersion.toString()}>
                                    <Input
                                        disabled={!headerEditable}
                                        addonBefore={t('ColEditor.file_header.Version')}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Checkbox
                                        checked={headerEditable}
                                        onChange={(e) => setHeaderEditable(e.target.checked)}
                                    >
                                        {t('ColEditor.file_header.enable_edit_do_not_edit')}
                                    </Checkbox>
                                </Form.Item>
                            </Space>
                        </Collapse.Panel>
                    </Collapse>

                    <div style={{marginBottom: 8, marginTop: 8}}>
                        <Radio.Group
                            block
                            value={viewMode}
                            onChange={(e) => {
                                // 在切换显示模式之前获取当前表单值并更新 colData
                                const currentFormValues = form.getFieldsValue(true);
                                if (colData && (viewMode != 2)) { // 非模式 2 时从表单拿数据，因为模式 2 是 JSON
                                    const updatedCol = transformFormToCol(currentFormValues, colData);
                                    setColData(updatedCol);
                                }

                                setViewMode(e.target.value);
                                localStorage.setItem('colEditorViewMode', e.target.value.toString());
                            }}
                            options={[
                                {label: t('ColEditor.style1'), value: 1},
                                {label: t('ColEditor.style2'), value: 2},
                            ]}
                            optionType="button"
                            buttonStyle="solid"
                        />
                    </div>

                    {viewMode === 1 && (
                        <Collapse defaultActiveKey={["colliders"]}>
                            <Collapse.Panel header={t('ColEditor.Colliders')} key="colliders">
                                <Form.List name="colliders">
                                    {(fields, {add, remove}) =>
                                        <Style1Colliders
                                            fields={fields}
                                            add={add}
                                            remove={remove}
                                            form={form}
                                        />
                                    }
                                </Form.List>
                            </Collapse.Panel>
                        </Collapse>
                    )}

                    {viewMode === 2 && (
                        <Style2Properties
                            colData={colData}
                            setColData={(newVal) => setColData(newVal)}
                        />
                    )}
                </Form>
            </ConfigProvider>
        </div>
    );
});

export default ColEditor;