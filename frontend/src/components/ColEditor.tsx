import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {Button, Checkbox, Collapse, ConfigProvider, Form, Input, message, Modal, Radio, Space} from "antd";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {SelectPathToSave} from "../../wailsjs/go/main/App";
import {ConvertColToJson, ConvertJsonToCol, ReadColFile, WriteColFile} from "../../wailsjs/go/COM3D2/ColService";
import {useTranslation} from "react-i18next";
import {COM3D2HeaderConstants} from "../utils/ConstCOM3D2";
import Style1ColProperties from "./col/Style1ColProperties";
import Style2ColProperties from "./col/Style2ColProperties";
import {colEditorViewModeKey} from "../utils/LocalStorageKeys";
import {AppTitle, AppTitleNoAuthor} from "../utils/consts";
import DynamicBoneColliderBase = COM3D2.DynamicBoneColliderBase;
import DynamicBoneCollider = COM3D2.DynamicBoneCollider;
import DynamicBonePlaneCollider = COM3D2.DynamicBonePlaneCollider;
import DynamicBoneMuneCollider = COM3D2.DynamicBoneMuneCollider;
import MissingCollider = COM3D2.MissingCollider;
import ColModel = COM3D2.Col;
import FileInfo = COM3D2.FileInfo;


/** ColEditorProps:
 *  fileInfo: 传入要打开的文件信息
 */
interface ColEditorProps {
    fileInfo?: FileInfo;
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

    const [fileInfo, setFileInfo] = useState<FileInfo | null>(props.fileInfo || null);
    const [filePath, setFilePath] = useState<string | null>(props.fileInfo?.Path || null);

    // Col 数据对象
    const [colData, setColData] = useState<ColModel | null>(null);

    // 是否允许编辑 Signature、Version 等字段
    const [headerEditable, setHeaderEditable] = useState(false);

    // antd form
    const [form] = Form.useForm();

    // 用来切换视图模式
    const [viewMode, setViewMode] = useState<1 | 2>(() => {
        const saved = localStorage.getItem(colEditorViewModeKey);
        return saved ? Number(saved) as 1 | 2 : 1;
    });

    // 大文件警告模态框
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingFileContent, setPendingFileContent] = useState<{ size: number }>({size: 0});

    useEffect(() => {
        if (props.fileInfo) {
            setFileInfo(props.fileInfo);
            setFilePath(props.fileInfo.Path);
        }
    }, [props.fileInfo]);

    /** 组件挂载或 filePath 改变时，如果传入了 filePath 就自动读取一次 */
    useEffect(() => {
        let isMounted = true;

        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle(AppTitleNoAuthor + ` —— ${t("Infos.editing_colon")}${fileName}  (${filePath})`);

            (async () => {
                try {
                    if (!isMounted) return;
                    await handleReadColFile();
                } catch {
                }
            })();
        } else {
            WindowSetTitle(AppTitle);
            if (!isMounted) return;
            // 没有 filePath 时，可初始化一个新的 Col 对象
            const newCol = new ColModel();
            newCol.Signature = COM3D2HeaderConstants.ColSignature;
            newCol.Version = COM3D2HeaderConstants.ColVersion;
            newCol.Colliders = [];
            setColData(newCol);
            form.resetFields();
        }

        return () => {
            isMounted = false;
        };
    }, [filePath]);


    /** 读取 Col 文件 */
    const handleReadColFile = async () => {
        if (!filePath || !fileInfo) {
            message.error(t('Infos.pls_open_file_first'));
            return;
        }
        try {
            const size = fileInfo?.Size;
            if (size > 1024 * 1024 * 20) {
                setPendingFileContent({size});
                setIsConfirmModalOpen(true);
                return;
            }
            await handleConfirmRead(false);
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.col'}) + error);
        }
    }

    // 确认读取文件
    const handleConfirmRead = async (DirectlyConvert: boolean) => {
        setIsConfirmModalOpen(false);
        if (!filePath || !fileInfo) {
            message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
            return;
        }
        if (DirectlyConvert) {
            const hide = message.loading(t('Infos.converting_please_wait'), 0);
            try {
                if (fileInfo.StorageFormat == "json") {
                    const path = filePath.replace(/\.col\.json$/, '.col');
                    await ConvertJsonToCol(filePath, path);
                    message.success(t('Infos.directly_convert_success') + path, 5);
                } else {
                    const path = filePath.replace(/\.col$/, '.col.json');
                    await ConvertColToJson(filePath, path);
                    message.success(t('Infos.directly_convert_success') + path, 5);
                }
            } catch (error: any) {
                console.error(error);
                message.error(t('Errors.directly_convert_failed_colon') + error);
            } finally {
                setFilePath(null)
                hide();
            }
            return;
        }
        const hide = message.loading(t('Infos.loading_please_wait'));
        try {
            const data = await ReadColFile(filePath);
            setColData(data);
            // 映射到 Form
            form.setFieldsValue(transformColToForm(data));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.col'}) + error);
        } finally {
            hide();
        }
    };

    /** 保存 Col 文件（覆盖写回） */
    const handleSaveColFile = async () => {
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
    const handleSaveAsColFile = async () => {
        if (!colData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }

        try {
            // 模式 2 JSON 编辑，直接保存
            if (viewMode === 2) {

                const newPath = await SelectPathToSave("*.col;*.col.json", t('Infos.com3d2_col_file'));
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
            const newPath = await SelectPathToSave("*.col;*.col.json", t('Infos.com3d2_col_file'));
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
                    localPosition: base.LocalPosition ?? [0, 0, 0],
                    localRotation: base.LocalRotation ?? [0, 0, 0, 0],
                    localScale: base.LocalScale ?? [1, 1, 1],
                    direction: base.Direction,
                    center: base.Center ?? [0, 0, 0],
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
                        item.centerRateMax = collider.CenterRateMax ?? [0, 0, 0];
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

        newCol.Signature = values.signature;
        newCol.Version = parseInt(values.version, 10);

        // 处理 colliders
        const newColliders: any[] = [];
        if (Array.isArray(values.colliders)) {
            for (const item of values.colliders) {
                const typeName = item.TypeName || 'missing'; // Default to 'dbc' if empty

                const baseData = new DynamicBoneColliderBase({
                    ParentName: item.parentName || "",
                    SelfName: item.selfName || "",
                    LocalPosition: item.localPosition ?? [0, 0, 0],
                    LocalRotation: item.localRotation ?? [0, 0, 0, 0],
                    LocalScale: item.localScale ?? [1, 1, 1],
                    Direction: Number(item.direction),
                    Center: item.center ?? [0, 0, 0],
                    Bound: Number(item.bound)
                });

                let collider: any;
                switch (typeName) {
                    case "dbc": {
                        collider = new DynamicBoneCollider({
                            Base: baseData,
                            Radius: parseFloat(item.radius) ?? 0,
                            Height: parseFloat(item.height) ?? 0
                        });
                        break;
                    }
                    case "dbm": {
                        collider = new DynamicBoneMuneCollider({
                            Base: baseData,
                            Radius: parseFloat(item.radius) ?? 0,
                            Height: parseFloat(item.height) ?? 0,
                            ScaleRateMulMax: parseFloat(item.scaleRateMulMax) ?? 0,
                            CenterRateMax: item.centerRateMax ?? [0, 0, 0]
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
            <Modal
                title={t('Infos.large_file_waring')}
                open={isConfirmModalOpen}
                onCancel={() => setIsConfirmModalOpen(false)}
                footer={[
                    <Button key="convert" type="primary" onClick={() => handleConfirmRead(true)}>
                        {t('Common.convert_directly')}
                    </Button>,
                    <Button key="cancel" onClick={() => {
                        setIsConfirmModalOpen(false);
                        setFilePath(null);
                    }}>
                        {t('Common.cancel')}
                    </Button>,
                    <Button key="confirm" onClick={() => handleConfirmRead(false)}>
                        {t('Common.continue')}
                    </Button>
                ]}
            >
                <p>{t('Infos.file_too_large_tip', {size: (pendingFileContent?.size / 1024 / 1024).toFixed(2)})}</p>
                <p>{t('Infos.file_too_large_convert_to_json_directly')}</p>
            </Modal>
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
                                        disabled={viewMode === 2}
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
                                localStorage.setItem(colEditorViewModeKey, e.target.value.toString());
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
                                        <Style1ColProperties
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
                        <Style2ColProperties
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