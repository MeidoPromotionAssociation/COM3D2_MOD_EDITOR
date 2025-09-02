import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {GetFileSize, IsSupportedImageType, SelectFile} from "../../wailsjs/go/main/App";
import {getFileExtension} from "../utils/utils";
import {message} from "antd";
import React, {useState} from "react";
import {ConvertAnyToAnyAndWrite} from "../../wailsjs/go/COM3D2/TexService";
import {Quit} from "../../wailsjs/runtime";
import {
    FileTypeStrictModeKey,
    TexEditorCompressKey,
    TexEditorDefaultFormatKey,
    TexEditorDirectConvertKey,
    TexEditorForcePngKey
} from "../utils/LocalStorageKeys";
import {FileTypeDetermine} from "../../wailsjs/go/COM3D2/CommonService";
import {AllSupportedFileTypesSet} from "../utils/consts";
import {COM3D2} from "../../wailsjs/go/models";
import FileInfo = COM3D2.FileInfo;

const useFileHandlers = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();

    // 文件类型判断的严格模式设置
    const [strictMode, setStrictMode] = useState<boolean>(() => {
        const saved = localStorage.getItem(FileTypeStrictModeKey);
        return saved ? JSON.parse(saved) : false;
    });

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

    // 更新严格模式设置
    const updateStrictMode = (newStrictMode: boolean) => {
        setStrictMode(newStrictMode);
        localStorage.setItem(FileTypeStrictModeKey, JSON.stringify(newStrictMode));
    }


    // handleSelectFile 选择文件，并转跳到对应页面
    // fileTypes: 要选择的文件类型，例如 "*.menu;*.mate;*.pmat;*.col;*.phy"
    // description: 选择文件对话框的描述
    const handleSelectFile = async (fileTypes: string, description: string) => {
        try {
            const filePath = await SelectFile(fileTypes, description);
            if (!filePath) return;
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
                message.error(t('Errors.save_file_failed_colon') + err).then(() => {
                });
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
                message.error(t('Errors.save_as_file_failed_colon') + err).then(() => {
                });
            }
            return;
        }
        message.warning(t('Errors.no_file_to_save'));
    }

    const fileNavigateHandler = async (filePath: string) => {
        if (!filePath) return;
        try {
            // 判断文件类型
            const fileInfo = await FileTypeDetermine(filePath, strictMode);

            // 如果是图片类型
            if (fileInfo.FileType === "image") {
                if (directConvert) {
                    await exportTexOrImageAsAny(filePath, filePath.replace(/\.[^.]+$/, ".tex"));
                    Quit(); // 退出程序
                } else {
                    navigate("/tex-editor", {state: {fileInfo}});
                }
                return;
            }

            // 如果是支持的文件类型
            if (fileInfo.FileType && AllSupportedFileTypesSet.has(fileInfo.FileType)) {
                // 如果是 tex 文件且设置了直接转换
                if (fileInfo.FileType === "tex" && directConvert) {
                    await exportTexOrImageAsAny(filePath, filePath.replace(".tex", defaultFormat));
                    Quit(); // 退出程序
                    return;
                }

                // 否则跳转到相应编辑器，传递 fileInfo 而不是仅仅传递 filePath
                navigate(`/${fileInfo.FileType}-editor`, {state: {fileInfo}});
                return;
            }

            // 如果无法识别文件类型
            message.error(t('Errors.file_type_not_supported'));
        } catch (err) {
            console.error("Error determining file type:", err);

            // 如果是严格模式，不继续处理错误
            if (strictMode) {
                message.error(t('Errors.read_file_failed_colon') + ' ' + err);
                return;
            }

            let fileInfo = new FileInfo();
            fileInfo.Path = filePath;
            fileInfo.Game = "COM3D2";
            if (filePath.endsWith(".json")) {
                fileInfo.StorageFormat = "json";
            } else {
                fileInfo.StorageFormat = "binary";
            }

            try {
                fileInfo.Size = await GetFileSize(filePath);
            } catch (sizeErr: any) {
                console.warn('GetFileSize failed: ', sizeErr)
                message.error(t('Errors.file_type_not_supported') + '' + sizeErr);
            }

            // 如果文件类型判断失败，尝试使用扩展名判断
            const extension = getFileExtension(filePath);
            if (AllSupportedFileTypesSet.has(extension)) {
                fileInfo.FileType = extension;
                navigate(`/${extension}-editor`, {state: {fileInfo}});
                return;
            }

            // 判断是否为图片
            let isSupportedImage = false;
            try {
                isSupportedImage = await IsSupportedImageType(filePath);
            } catch (imgErr: any) {
                message.error(t('Errors.file_type_not_supported') + ' ' + imgErr);
                console.warn('IsSupportedImageType failed:', imgErr);
            }

            if (isSupportedImage) {
                fileInfo.FileType = "image";
                if (directConvert) {
                    await exportTexOrImageAsAny(filePath, filePath.replace(/\.[^.]+$/, ".tex"));
                    Quit(); // 退出程序
                } else {
                    navigate("/tex-editor", {state: {fileInfo}});
                }
            } else {
                message.error(t('Errors.file_type_not_supported') + ' ' + err);
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


    return {
        handleSelectFile,
        handleOpenedFile,
        handleSaveFile,
        handleSaveAsFile,
        exportTexOrImageAsAny,
        strictMode,
        updateStrictMode
    };
};


export default useFileHandlers;
