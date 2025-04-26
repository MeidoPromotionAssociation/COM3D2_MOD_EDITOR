import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {useTranslation} from "react-i18next";
import {Button, Form, message, Modal} from "antd";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {ConvertModelToJson, ReadModelFile, WriteModelFile} from "../../wailsjs/go/COM3D2/ModelService";
import {GetFileSize, SelectPathToSave} from "../../wailsjs/go/main/App";
import {ModelEditorViewModeKey} from "../utils/LocalStorageKeys";
import ModelMonacoEditor from "./model/ModelMonacoEditor";
import Model = COM3D2.Model;

export interface ModelEditorProps {
    filePath?: string;
}

export interface ModelEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

const ModelEditor = forwardRef<ModelEditorRef, ModelEditorProps>((props, ref) => {
    const {t} = useTranslation();

    const [filePath , setFilePath] = useState<string | null>(props.filePath || null);

    // Model 数据对象
    const [modelData, setModelData] = useState<Model | null>(null);

    // 是否允许编辑 Signature、Version 等字段
    const [headerEditable, setHeaderEditable] = useState(false);

    // antd form
    const [form] = Form.useForm();

    // 用来切换视图模式
    const [viewMode, setViewMode] = useState<1 | 2>(() => {
        const saved = localStorage.getItem(ModelEditorViewModeKey);
        return saved ? Number(saved) as 1 | 2 : 1;
    });

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingFileContent, setPendingFileContent] = useState<{ size: number }>({size: 0});

    useEffect(() => {
        setFilePath(props.filePath || null);
    }, [props]);

    /** 组件挂载或 filePath 改变时，如果传入了 filePath 就自动读取一次 */
    useEffect(() => {
        let isMounted = true;

        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

            (async () => {
                try {
                    if (!isMounted) return;
                    await handleReadModelFile();
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            })();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            if (!isMounted) return;
            // 没有 filePath 时，可初始化一个新的 model 对象
            const newModel = COM3D2.Model.createFrom({});
            setModelData(newModel);
        }

        return () => {
            isMounted = false;
        };
    }, [filePath]);


    /** 读取 Model 文件 */
    const handleReadModelFile = async () => {
        if (!filePath) {
            message.error(t('Infos.pls_open_file_first'));
            return;
        }
        try {
            const size = await GetFileSize(filePath);
            if (size > 1024 * 1024 * 20) {
                setPendingFileContent({size});
                setIsConfirmModalOpen(true);
                return;
            }
            await handleConfirmRead(false);
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.model'}) + error);
        }
    }

    /** 保存 Model 文件（覆盖写回） */
    const handleSaveModelFile = async () => {
        if (!filePath) {
            message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
            return;
        }
        if (!modelData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }
        try {
            await WriteModelFile(filePath, modelData);
            message.success(t('Infos.success_save_file'));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.save_file_failed_colon') + error);
        }
    }

    /** 另存为 Model 文件 */
    const handleSaveAsModelFile = async () => {
        if (!modelData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }

        try {
            const newPath = await SelectPathToSave("*.model", t('Infos.com3d2_model_file'));
            if (!newPath) {
                // 用户取消
                return;
            }
            await WriteModelFile(newPath, modelData);
            message.success(t('Infos.success_save_as_file_colon') + newPath);
        } catch (error: any) {
            message.error(t('Errors.save_as_file_failed_colon') + error.message);
            console.error(error);
        }
    }

    /** 暴露给父组件的 Ref 方法：读取、保存、另存为 */
    useImperativeHandle(ref, () => ({
        handleReadFile: handleReadModelFile,
        handleSaveFile: handleSaveModelFile,
        handleSaveAsFile: handleSaveAsModelFile
    }));


    // 确认读取文件
    const handleConfirmRead = async (DirectlyConvert: boolean) => {
        setIsConfirmModalOpen(false);
        if (!filePath) {
            message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
            return;
        }
        if (DirectlyConvert) {
            const hide = message.loading(t('Infos.converting_please_wait'), 0);
            try {
                await ConvertModelToJson(filePath, filePath);
                message.success(t('Infos.success_convert_to_json') + filePath?.replace(/\.model$/, '.json'), 5);
                setFilePath(null)
            } finally {
                hide();
            }
            return;
        }
        const hide = message.loading(t('Infos.loading_please_wait'));
        try {
            const data = await ReadModelFile(filePath);
            setModelData(data);
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.model'}) + error);
        } finally {
            hide();
        }
    };


    return (
        <div style={{padding: 10}}>
            <Modal
                title={t('Infos.large_file_waring')}
                open={isConfirmModalOpen}
                onCancel={() => setIsConfirmModalOpen(false)}
                footer={[
                    <Button key="convert" type="primary" onClick={() => handleConfirmRead(true)}>
                        {t('Common.convert_to_json_directly')}
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
            <ModelMonacoEditor
                modelData={modelData}
                setModelData={(newVal) => setModelData(newVal)}
            >
            </ModelMonacoEditor>

        </div>
    );
})

export default ModelEditor;