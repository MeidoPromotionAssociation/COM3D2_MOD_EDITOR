import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {useTranslation} from "react-i18next";
import {Button, message, Modal, Radio} from "antd";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {
    ConvertJsonToModel,
    ConvertModelToJson,
    ReadModelFile,
    ReadModelMetadata,
    WriteModelFile,
    WriteModelMetadata
} from "../../wailsjs/go/COM3D2/ModelService";
import {SelectPathToSave} from "../../wailsjs/go/main/App";
import {ModelEditorViewModeKey} from "../utils/LocalStorageKeys";
import ModelMonacoEditor from "./model/ModelMonacoEditor";
import ModelMetadataEditor from "./model/ModelMetadataEditor";
import Model = COM3D2.Model;
import ModelMetadata = COM3D2.ModelMetadata;
import FileInfo = COM3D2.FileInfo;

export interface ModelEditorProps {
    fileInfo?: FileInfo;
}

export interface ModelEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

const ModelEditor = forwardRef<ModelEditorRef, ModelEditorProps>((props, ref) => {
    const {t} = useTranslation();

    const [fileInfo, setFileInfo] = useState<FileInfo | null>(props.fileInfo || null);
    const [filePath, setFilePath] = useState<string | null>(props.fileInfo?.Path || null);

    // Model 数据对象
    const [modelData, setModelData] = useState<Model | null>(null);

    // ModelMetadata 数据对象
    const [modelMetadata, setModelMetadata] = useState<ModelMetadata | null>(null);

    // 用来切换视图模式: 1=完整JSON编辑, 2=元数据编辑
    const [viewMode, setViewMode] = useState<1 | 2>(() => {
        const saved = localStorage.getItem(ModelEditorViewModeKey);
        return saved ? Number(saved) as 1 | 2 : 1;
    });

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
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

            (async () => {
                try {
                    if (!isMounted) return;
                    await handleReadModelFile();
                } catch {
                }
            })();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            if (!isMounted) return;
            // 没有 filePath 时，可初始化一个新的 model 对象
            const newModel = COM3D2.Model.createFrom({});
            setModelData(newModel);

            // 同时初始化一个新的 ModelMetadata 对象
            const newModelMetadata = COM3D2.ModelMetadata.createFrom({
                Materials: []
            });
            setModelMetadata(newModelMetadata);
        }

        return () => {
            isMounted = false;
        };
    }, [filePath]);


    /** 读取 Model 文件 */
    const handleReadModelFile = async () => {
        if (!filePath || !fileInfo) {
            message.error(t('Infos.pls_open_file_first'));
            return;
        }
        try {
            const size = fileInfo?.Size;
            // 仅完整编辑模式检查
            if (viewMode === 1 && size > 1024 * 1024 * 20) {
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

        // 根据当前视图模式决定保存方式
        if (viewMode === 1) {
            // 完整模式 - 保存整个 Model
            if (!modelData) {
                message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
                return;
            }
            const hide = message.loading(t('Infos.saving_please_wait'), 0);
            try {
                await WriteModelFile(filePath, modelData);
                message.success(t('Infos.success_save_file'));
            } catch (error: any) {
                console.error(error);
                message.error(t('Errors.save_file_failed_colon') + error);
            } finally {
                hide();
            }
        } else {
            // 元数据模式 - 只保存 ModelMetadata
            if (!modelMetadata) {
                message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
                return;
            }
            const hide = message.loading(t('Infos.saving_please_wait'), 0);
            try {
                await WriteModelMetadata(filePath, filePath, modelMetadata);
                message.success(t('Infos.success_save_file'));
            } catch (error: any) {
                console.error(error);
                message.error(t('Errors.save_file_failed_colon') + error);
            } finally {
                hide();
            }
        }
    }

    /** 另存为 Model 文件 */
    const handleSaveAsModelFile = async () => {
        // 根据当前视图模式决定保存方式
        if (viewMode === 1) {
            // 完整模式 - 保存整个 Model
            if (!modelData) {
                message.error(t('Errors.pls_load_file_first'));
                return;
            }

            try {
                const newPath = await SelectPathToSave("*.model;*.model.json", t('Infos.com3d2_model_file'));
                if (!newPath) {
                    // 用户取消
                    return;
                }

                const hide = message.loading(t('Infos.saving_please_wait'), 0);
                try {
                    await WriteModelFile(newPath, modelData);
                    message.success(t('Infos.success_save_as_file_colon') + newPath);
                } catch (error: any) {
                    console.error(error);
                    message.error(t('Errors.save_as_file_failed_colon') + error);
                } finally {
                    hide();
                }

            } catch (error: any) {
                message.error(t('Errors.save_as_file_failed_colon') + error.message);
                console.error(error);
            }
        } else {
            // 元数据模式 - 只保存 ModelMetadata
            if (!modelMetadata) {
                message.error(t('Errors.pls_load_file_first'));
                return;
            }

            try {
                const newPath = await SelectPathToSave("*.model;*.model.json", t('Infos.com3d2_model_file'));
                if (!newPath) {
                    // 用户取消
                    return;
                }

                const hide = message.loading(t('Infos.saving_please_wait'), 0);
                try {
                    if (!filePath) {
                        // 如果没有原始文件路径，则创建一个新的 Model 对象并保存
                        const newModel = COM3D2.Model.createFrom({
                            Signature: modelMetadata.Signature,
                            Version: modelMetadata.Version,
                            Name: modelMetadata.Name,
                            RootBoneName: modelMetadata.RootBoneName,
                            ShadowCastingMode: modelMetadata.ShadowCastingMode,
                            Materials: modelMetadata.Materials,
                            Bones: [],
                            VertCount: 0,
                            SubMeshCount: 0,
                            BoneCount: 0,
                            BoneNames: [],
                            BindPoses: [],
                            Vertices: [],
                            BoneWeights: [],
                            SubMeshes: []
                        });
                        await WriteModelFile(newPath, newModel);
                    } else {
                        // 如果有原始文件路径，则使用 WriteModelMetadata
                        await WriteModelMetadata(filePath, newPath, modelMetadata);
                    }
                    message.success(t('Infos.success_save_as_file_colon') + newPath);
                } catch (error: any) {
                    console.error(error);
                    message.error(t('Errors.save_as_file_failed_colon') + error);
                } finally {
                    hide();
                }

            } catch (error: any) {
                message.error(t('Errors.save_as_file_failed_colon') + error.message);
                console.error(error);
            }
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
        if (!filePath || !fileInfo) {
            message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
            return;
        }
        if (DirectlyConvert) {
            const hide = message.loading(t('Infos.converting_please_wait'), 0);
            try {
                if (fileInfo.StorageFormat == "json") {
                    const path = filePath.replace(/\.model\.json$/, '.model');
                    await ConvertJsonToModel(filePath, path);
                    message.success(t('Infos.directly_convert_success') + path, 5);
                } else {
                    const path = filePath.replace(/\.model$/, '.model.json');
                    await ConvertModelToJson(filePath, path);
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

        const hide = message.loading(t('Infos.loading_please_wait'), 0);
        try {
            if (viewMode === 1) {
                // 完整模式，读取完整 Model 数据
                const data = await ReadModelFile(filePath);
                setModelData(data);
            } else {
                // 元数据模式，读取 ModelMetadata 数据
                const metadata = await ReadModelMetadata(filePath);
                setModelMetadata(metadata);
            }
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

            {/* 视图模式切换 */}
            <div style={{marginBottom: 8}}>
                <Radio.Group
                    block
                    value={viewMode}
                    onChange={(e) => {
                        setViewMode(e.target.value);
                        localStorage.setItem(ModelEditorViewModeKey, e.target.value.toString());
                    }}
                    options={[
                        {label: t('ModelEditor.full_model'), value: 1},
                        {label: t('ModelEditor.metadata_only'), value: 2},
                    ]}
                    optionType="button"
                    buttonStyle="solid"
                    size="small"
                />
            </div>

            {/* 根据视图模式显示不同的编辑器 */}
            {viewMode === 1 ? (
                <ModelMonacoEditor
                    modelData={modelData}
                    setModelData={(newVal) => setModelData(newVal)}
                />
            ) : (
                <ModelMetadataEditor
                    modelMetadata={modelMetadata}
                    onModelMetadataChange={(newVal) => setModelMetadata(newVal)}
                />
            )}
        </div>
    );
})

export default ModelEditor;