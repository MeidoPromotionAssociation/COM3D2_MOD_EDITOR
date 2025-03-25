import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {useTranslation} from "react-i18next";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2HeaderConstants} from "../utils/ConstCOM3D2";
import {message} from "antd";
import {COM3D2} from "../../wailsjs/go/models";
import {ReadAnmFile, WriteAnmFile} from "../../wailsjs/go/COM3D2/AnmService";
import AnmMonacoEditor from "./anm/AnmMonacoEditor";
import {SelectPathToSave} from "../../wailsjs/go/main/App";
import Anm = COM3D2.Anm;
import BoneCurveData = COM3D2.BoneCurveData;

export interface AnmEditorProps {
    filePath?: string;
}

export interface AnmEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

const AnmEditor = forwardRef<AnmEditorRef, AnmEditorProps>((props, ref) => {
    const {t} = useTranslation();
    const {filePath} = props;

    const [anmData, setAnmData] = useState<Anm | null>(null);


    /** 组件挂载或 filePath 改变时，如果传入了 filePath 就自动读取一次 */
    useEffect(() => {
        let isMounted = true;

        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

            (async () => {
                try {
                    if (!isMounted) return;
                    await handleReadAnmFile();
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            })();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            if (!isMounted) return;
            // 没有 filePath 时，可初始化一个新的 anm 对象
            const newanm = new Anm();
            newanm.Signature = COM3D2HeaderConstants.AnmSignature;
            newanm.Version = COM3D2HeaderConstants.AnmVersion;
            newanm.BoneCurves = [
                {
                    BonePath: "Bip01",
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
                            ],
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
                            ],
                        }
                    ],
                } as unknown as BoneCurveData
            ];
            newanm.BustKeyLeft = false
            newanm.BustKeyRight = false
            setAnmData(newanm);
        }

        return () => {
            isMounted = false;
        };
    }, [filePath]);


    /** 读取 Anm 文件 */
    const handleReadAnmFile = async () => {
        if (!filePath) {
            message.error(t('Infos.pls_open_file_first'));
            return;
        }
        try {
            const data = await ReadAnmFile(filePath);
            setAnmData(data);
            console.log(data);
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_col_file_failed_colon') + error);
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
            const newPath = await SelectPathToSave("*.anm", t('Infos.com3d2_anm_file'));
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


    return (
        <div style={{padding: 10}}>
            <AnmMonacoEditor
                anmData={anmData}
                setAnmData={(newVal) => setAnmData(newVal)}
            >
            </AnmMonacoEditor>

        </div>
    );
})

export default AnmEditor;