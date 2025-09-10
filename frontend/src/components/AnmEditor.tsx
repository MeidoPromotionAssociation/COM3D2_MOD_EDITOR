import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {useTranslation} from "react-i18next";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2HeaderConstants} from "../utils/ConstCOM3D2";
import {Button, message, Modal} from "antd";
import {COM3D2} from "../../wailsjs/go/models";
import {ConvertAnmToJson, ConvertJsonToAnm, ReadAnmFile, WriteAnmFile} from "../../wailsjs/go/COM3D2/AnmService";
import AnmMonacoEditor from "./anm/AnmMonacoEditor";
import {SelectPathToSave} from "../../wailsjs/go/main/App";
import {AppTitle, AppTitleNoAuthor} from "../utils/consts";
import Anm = COM3D2.Anm;
import BoneCurveData = COM3D2.BoneCurveData;
import FileInfo = COM3D2.FileInfo;

export interface AnmEditorProps {
    fileInfo?: any;
}

export interface AnmEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

const AnmEditor = forwardRef<AnmEditorRef, AnmEditorProps>((props, ref) => {
    const {t} = useTranslation();

    const [fileInfo, setFileInfo] = useState<FileInfo | null>(props.fileInfo || null);
    const [filePath, setFilePath] = useState<string | null>(props.fileInfo?.Path || null);

    const [anmData, setAnmData] = useState<Anm | null>(null);

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
                    await handleReadAnmFile();
                } catch {
                }
            })();
        } else {
            WindowSetTitle(AppTitle);
            if (!isMounted) return;
            // 没有 filePath 时，可初始化一个新的 anm 对象示例
            const newAnm = new Anm();
            newAnm.Signature = COM3D2HeaderConstants.AnmSignature;
            newAnm.Version = COM3D2HeaderConstants.AnmVersion;
            newAnm.BoneCurves = [
                new BoneCurveData({
                    BonePath: "Bip01/Bip01 Pelvis/Bip01 R Thigh",
                    PropertyCurves: [
                        {
                            PropertyIndex: 0,
                            Keyframes: [
                                {
                                    Time: 0,
                                    Value: 0,
                                    InTangent: 0,
                                    OutTangent: 0,
                                },
                                {
                                    Time: 1,
                                    Value: 0,
                                    InTangent: 0,
                                    OutTangent: 0,
                                }
                            ] as COM3D2.Keyframe[],
                        },
                        {
                            PropertyIndex: 1,
                            Keyframes: [
                                {
                                    Time: 0,
                                    Value: 0,
                                    InTangent: 0,
                                    OutTangent: 0,
                                },
                                {
                                    Time: 1,
                                    Value: 0,
                                    InTangent: 0,
                                    OutTangent: 0,
                                }
                            ] as COM3D2.Keyframe[],
                        }
                    ],
                })
            ];
            newAnm.BustKeyLeft = false
            newAnm.BustKeyRight = false
            setAnmData(newAnm);
        }

        return () => {
            isMounted = false;
        };
    }, [filePath]);


    /** 读取 Anm 文件 */
    const handleReadAnmFile = async () => {
        if (!filePath || !fileInfo) {
            message.error(t('Infos.pls_open_file_first'));
            return;
        }
        const size = fileInfo?.Size;
        if (size > 1024 * 1024 * 20) {
            setPendingFileContent({size});
            setIsConfirmModalOpen(true);
            return;
        }
        try {
            await handleConfirmRead(false);
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.anm'}) + error);
        }
    }

    /** 保存 Anm 文件（覆盖写回） */
    const handleSaveAnmFile = async () => {
        if (!filePath) {
            message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
            return;
        }
        if (!anmData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }
        try {
            await WriteAnmFile(filePath, anmData);
            message.success(t('Infos.success_save_file'));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.save_file_failed_colon') + error);
        }
    }

    /** 另存为 Anm 文件 */
    const handleSaveAsAnmFile = async () => {
        if (!anmData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }

        try {
            const newPath = await SelectPathToSave("*.anm;*.anm.json", t('Infos.com3d2_anm_file'));
            if (!newPath) {
                // 用户取消
                return;
            }
            await WriteAnmFile(newPath, anmData);
            message.success(t('Infos.success_save_as_file_colon') + newPath);
        } catch (error: any) {
            message.error(t('Errors.save_as_file_failed_colon') + error.message);
            console.error(error);
        }
    }

    /** 暴露给父组件的 Ref 方法：读取、保存、另存为 */
    useImperativeHandle(ref, () => ({
        handleReadFile: handleReadAnmFile,
        handleSaveFile: handleSaveAnmFile,
        handleSaveAsFile: handleSaveAsAnmFile
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
                    const path = filePath.replace(/\.anm\.json$/, '.anm');
                    await ConvertJsonToAnm(filePath, path);
                    message.success(t('Infos.directly_convert_success') + path, 5);
                } else {
                    const path = filePath.replace(/\.anm$/, '.anm.json');
                    await ConvertAnmToJson(filePath, path);
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
            const data = await ReadAnmFile(filePath);
            setAnmData(data);
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.anm'}) + error);
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
            <AnmMonacoEditor
                anmData={anmData}
                setAnmData={(newVal) => setAnmData(newVal)}
            >
            </AnmMonacoEditor>

        </div>
    );
})

export default AnmEditor;