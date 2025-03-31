import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2HeaderConstants} from "../utils/ConstCOM3D2";
import {message} from "antd";
import {COM3D2} from "../../wailsjs/go/models";
import {ReadPskFile, WritePskFile} from "../../wailsjs/go/COM3D2/PskService";
import {SelectPathToSave} from "../../wailsjs/go/main/App";
import PskMonacoEditor from "./psk/PskMonacoEditor";
import Psk = COM3D2.Psk;

export interface PskEditorProps {
    filePath?: string;
}

export interface PskEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

const PskEditor = forwardRef<PskEditorRef, PskEditorProps>((props, ref) => {
    const {t} = useTranslation();
    const {filePath} = props;

    const [pskData, setPskData] = useState<Psk | null>(null);


    /** 组件挂载或 filePath 改变时，如果传入了 filePath 就自动读取一次 */
    useEffect(() => {
        let isMounted = true;

        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

            (async () => {
                try {
                    if (!isMounted) return;
                    await handleReadPskFile();
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            })();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            if (!isMounted) return;
            // 没有 filePath 时，可初始化一个新的 anm 对象
            const newPsk = new Psk();
            newPsk.Signature = COM3D2HeaderConstants.PskSignature;
            newPsk.Version = COM3D2HeaderConstants.PskVersion;
            setPskData(newPsk);
        }

        return () => {
            isMounted = false;
        };
    }, [filePath]);


    /** 读取 Psk 文件 */
    const handleReadPskFile = async () => {
        if (!filePath) {
            message.error(t('Infos.pls_open_file_first'));
            return;
        }
        try {
            const data = await ReadPskFile(filePath);
            setPskData(data);
            console.log(data);
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.psk'}) + error);
        }
    }

    /** 保存 Psk 文件（覆盖写回） */
    const handleSavePskFile = async () => {
        if (!filePath) {
            message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
            return;
        }
        if (!pskData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }
        try {
            await WritePskFile(filePath, pskData);
            message.success(t('Infos.success_save_file'));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.save_file_failed_colon') + error);
        }
    }

    /** 另存为 Psk 文件 */
    const handleSaveAsPskFile = async () => {
        if (!pskData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }

        try {
            const newPath = await SelectPathToSave("*.psk", t('Infos.com3d2_psk_file'));
            if (!newPath) {
                // 用户取消
                return;
            }
            await WritePskFile(newPath, pskData);
            message.success(t('Infos.success_save_as_file_colon') + newPath);
        } catch (error: any) {
            message.error(t('Errors.save_as_file_failed_colon') + error.message);
            console.error(error);
        }
    }

    /**
     * 监听 Ctrl+S 快捷键，触发保存
     */
    const saveHandlerRef = useRef(handleSavePskFile);

    // 如果改变，更新 saveHandlerRef
    useEffect(() => {
        saveHandlerRef.current = handleSavePskFile;
    }, [filePath, pskData]); // 包含所有可能影响保存行为的状态

    // 设置 keydown 事件监听器
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Windows/Linux: Ctrl+S, macOS: Cmd+S => e.metaKey
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveHandlerRef.current();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);


    /** 暴露给父组件的 Ref 方法：读取、保存、另存为 */
    useImperativeHandle(ref, () => ({
        handleReadFile: handleReadPskFile,
        handleSaveFile: handleSavePskFile,
        handleSaveAsFile: handleSaveAsPskFile
    }));


    return (
        <div style={{padding: 10}}>
            <PskMonacoEditor
                pskData={pskData}
                setPskData={(newVal) => setPskData(newVal)}
            >
            </PskMonacoEditor>

        </div>
    );
})

export default PskEditor;