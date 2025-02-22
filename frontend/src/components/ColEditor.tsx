import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {Checkbox, Collapse, Input, message, Space, Tooltip} from "antd";
import {QuestionCircleOutlined} from "@ant-design/icons";
import {SaveFile} from "../../wailsjs/go/main/App";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {useTranslation} from "react-i18next";
import {OpenModFile} from "../../wailsjs/go/COM3D2/CommonService";


export interface ColEditorProps {
    filePath?: string;
}

export interface ColEditorRef {
    handleReadMenuFile: () => Promise<void>;
    handleSaveMenuFile: () => Promise<void>;
    handleSaveAsMenuFile: () => Promise<void>;
}

const ColEditor = forwardRef<ColEditorRef, ColEditorProps>(({filePath}, ref) => {
    const {t} = useTranslation();

    // 当 filePath 变化时自动读取
    useEffect(() => {
        if (!filePath) {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            // 如果没有文件，则初始化为新文件
            return;
        }

        const fileName = filePath.split(/[\\/]/).pop();
        WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") +  fileName + "  (" + filePath + ")");

        async function loadCol() {
            try {
                if (filePath) {
                    const result = await OpenModFile(filePath);
                    console.log(result);
                }
            } catch (err: any) {
                console.error(err);
                message.error(t("Errors.read_pmate_file_failed_colon") + err.message);
            }
        }

        loadCol();
    }, [filePath, t]);




    /**
     * 监听 Ctrl+S 快捷键，触发保存
     */
    // useEffect(() => {
    //     const handleKeyDown = (e: globalThis.KeyboardEvent) => {
    //         // Windows/Linux: Ctrl+S, macOS: Cmd+S => e.metaKey
    //         if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    //             e.preventDefault();
    //             handleSavePMatFile();
    //         }
    //     };
    //     window.addEventListener("keydown", handleKeyDown as EventListener);
    //     return () => window.removeEventListener("keydown", handleKeyDown as EventListener);
    // }, [handleSavePMatFile]);

    /**
     * 将文件操作方法暴露给父组件
     */
    // useImperativeHandle(ref, () => ({
    //     handleReadMenuFile: handleReadPMatFile,
    //     handleSaveMenuFile: handleSavePMatFile,
    //     handleSaveAsMenuFile: handleSaveAsPMatFile,
    // }));


    return (
        <div style={{padding: 20}}>
        </div>
    );
});

export default ColEditor;
