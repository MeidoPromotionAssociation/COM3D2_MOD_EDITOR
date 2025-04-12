import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {IsSupportedImageType, SelectFile} from "../../wailsjs/go/main/App";
import {getFileExtension} from "../utils/utils";
import {message} from "antd";
import React, {useState} from "react";
import {ConvertAnyToAnyAndWrite} from "../../wailsjs/go/COM3D2/TexService";
import {Quit} from "../../wailsjs/runtime";
import {
    TexEditorCompressKey,
    TexEditorDefaultFormatKey,
    TexEditorDirectConvertKey,
    TexEditorForcePngKey
} from "../utils/LocalStorageKeys";

// 支持的所有文件类型，用分号分隔，不包含图片类型
export const AllSupportedFileTypes = "*.menu;*.mate;*.pmat;*.col;*.phy;*.tex;*.anm"

const useFileHandlers = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();

    // TexEditor 相关持久化选项
    const [forcePng] = useState<boolean>(() => {
        const saved = localStorage.getItem(TexEditorForcePngKey);
        return saved ? JSON.parse(saved) : true;
    });
    const [directConvert] = useState<boolean>(() => {
        const saved = localStorage.getItem(TexEditorDirectConvertKey);
        return saved ? JSON.parse(saved) : false;
    });
    const [compress] = useState<boolean>(() => {
        const saved = localStorage.getItem(TexEditorCompressKey);
        return saved ? JSON.parse(saved) : false;
    });
    const [defaultFormat] = useState<string>(() => {
        const saved = localStorage.getItem(TexEditorDefaultFormatKey);
        return saved ? JSON.parse(saved) : ".png";
    })


    // handleSelectFile 选择文件，并转跳到对应页面
    // fileTypes: 要选择的文件类型，例如 "*.menu;*.mate;*.pmat;*.col;*.phy"
    // description: 选择文件对话框的描述
    const handleSelectFile = async (fileTypes: string, description: string) => {
        try {
            const filePath = await SelectFile(fileTypes, description);
            await fileNavigateHandler(filePath)
        } catch (err) {
            message.error(t('Errors.file_selection_error_colon') + err);
        }
    };

    // handleOpenedFile 处理已打开的文件，转跳到对应页面
    const handleOpenedFile = async (filePath: string) => {
        await fileNavigateHandler(filePath)
    }


    // handleSaveFile 保存文件，如果有 ref，则调用 ref.current.handleSaveFile()，否则提示没有文件要保存
    const handleSaveFile = (ref: React.RefObject<any> | undefined) => {
        if (ref) {
            try {
                ref.current.handleSaveFile();
            } catch (err) {
                message.error(t('Errors.save_file_failed_colon') + err).then(() => {});
            }
            return;
        }
        message.warning(t('Errors.no_file_to_save'));
    };

    // handleSaveAsFile 另存为文件，如果有 ref，则调用 ref.current.handleSaveAsFile()，否则提示没有文件要保存
    const handleSaveAsFile = (ref: React.RefObject<any> | undefined) => {
        if (ref) {
            try {
                ref.current.handleSaveAsFile();
            } catch (err) {
                message.error(t('Errors.save_as_file_failed_colon') + err).then(() => {});
            }
            return;
        }
        message.warning(t('Errors.no_file_to_save'));
    }

    const fileNavigateHandler = async (filePath: string) => {
        const extension = getFileExtension(filePath);
        switch (extension) {
            case "menu":
                navigate("/menu-editor", {state: {filePath}});
                break;
            case "mate":
                navigate("/mate-editor", {state: {filePath}});
                break;
            case "pmat":
                navigate("/pmat-editor", {state: {filePath}});
                break;
            case "col":
                navigate("/col-editor", {state: {filePath}});
                break;
            case "phy":
                navigate("/phy-editor", {state: {filePath}});
                break;
            case "psk":
                navigate("/psk-editor", {state: {filePath}});
                break;
            case "anm":
                navigate("/anm-editor", {state: {filePath}});
                break;
            case "tex":
                // 直接转换
                if (directConvert) {
                    await exportTexOrImageAsAny(filePath, filePath.replace(".tex", defaultFormat));
                    Quit(); // 退出程序
                    break;
                } else {
                    navigate("/tex-editor", {state: {filePath}});
                    break;
                }
            default:
                let isSupportedImage = false;
                try {
                    isSupportedImage = await IsSupportedImageType(filePath)
                } catch (err: any) {
                    message.error(t('Errors.file_type_not_supported') + ' ' + err);
                }

                if (isSupportedImage) {
                    if (directConvert) {
                        await exportTexOrImageAsAny(filePath, filePath.replace(/\.[^.]+$/, ".tex"));
                        Quit(); // 退出程序
                    } else {
                        navigate("/tex-editor", {state: {filePath}});
                    }
                } else {
                    message.error(t('Errors.file_type_not_supported'));
                }
        }
    }

    // exportTexOrImageAsAny 导出 tex 或图片为任意格式
    const exportTexOrImageAsAny = async (filePath: string, outputPath: string) => {
        if (!outputPath) return;

        try {
            await ConvertAnyToAnyAndWrite(filePath, "", compress, forcePng, outputPath)
            message.success(t('Infos.success_export_file_colon') + outputPath);
        } catch (error) {
            console.error("Error exporting file:", error);
            message.error(t('Errors.save_file_failed_colon') + error);
        }
    }


    return {handleSelectFile, handleOpenedFile, handleSaveFile, handleSaveAsFile, exportTexOrImageAsAny};
};


export default useFileHandlers;
