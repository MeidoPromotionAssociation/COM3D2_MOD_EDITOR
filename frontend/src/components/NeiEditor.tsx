import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {Button, Form, message, Modal, Radio} from "antd";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {SelectPathToSave} from "../../wailsjs/go/main/App";
import {
    CSVFileToNei,
    CSVFileToNeiFile,
    NeiFileToCSVFile,
    NeiToCSVFile,
    ReadNeiFile,
    WriteNeiFile
} from "../../wailsjs/go/COM3D2/NeiService";
import {useTranslation} from "react-i18next";
import {NeiEditorViewModeKey} from "../utils/LocalStorageKeys";
import NeiTableEditor from "./nei/NeiTableEditor";
import NeiMonacoEditor from "./nei/NeiMonacoEditor";
import {toLower} from "lodash";
import NeiModel = COM3D2.Nei;
import FileInfo = COM3D2.FileInfo;


/** NeiEditorProps:
 *  fileInfo: 传入要打开的文件信息
 */
interface NeiEditorProps {
    fileInfo?: FileInfo;
}

/** NeiEditorRef:
 *  提供给父组件或外部的操作方法，例如读取、保存、另存为
 */
export interface NeiEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

/**
 * NeiEditor 组件：
 *  - 读取/编辑/保存 .nei 文件
 */
const NeiEditor = forwardRef<NeiEditorRef, NeiEditorProps>((props, ref) => {
    const {t} = useTranslation();

    const [fileInfo, setFileInfo] = useState<FileInfo | null>(props.fileInfo || null);
    const [filePath, setFilePath] = useState<string | null>(props.fileInfo?.Path || null);

    // Nei 数据对象
    const [neiData, setNeiData] = useState<NeiModel | null>(null);

    // antd form
    const [form] = Form.useForm();

    // 用来切换视图模式
    const [viewMode, setViewMode] = useState<1 | 2>(() => {
        const saved = localStorage.getItem(NeiEditorViewModeKey);
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
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

            (async () => {
                try {
                    if (!isMounted) return;
                    await handleReadNeiFile();
                } catch {
                }
            })();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            if (!isMounted) return;
            // 没有 filePath 时，初始化一个新的 Nei 对象
            const newNei = new NeiModel();
            setNeiData(newNei);
            form.resetFields();
        }

        return () => {
            isMounted = false;
        };
    }, [filePath]);


    /** 读取 Nei 文件 */
    const handleReadNeiFile = async () => {
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
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.nei'}) + error);
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
                if (fileInfo.StorageFormat == "csv") {
                    const path = filePath.replace(/\.nei$/, '.csv');
                    await CSVFileToNeiFile(filePath, path);
                    message.success(t('Infos.directly_convert_success') + path, 5);
                } else {
                    const path = filePath.replace(/\.csv$/, '.nei');
                    await NeiFileToCSVFile(filePath, path);
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
            console.log(filePath)
            if (toLower(filePath).endsWith(".nei")) {
                const data = await ReadNeiFile(filePath);
                setNeiData(data);
            } else if (toLower(filePath).endsWith(".csv")) {
                const data = await CSVFileToNei(filePath)
                setNeiData(data);
            } else {
                message.warning(t('Errors.file_type_not_supported') + filePath)
            }
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.nei'}) + error);
        } finally {
            hide();
        }
    };

    /** 保存 Nei 文件（覆盖写回） */
    const handleSaveNeiFile = async () => {
        if (!filePath) {
            message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
            return;
        }
        if (!neiData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }
        try {
            neiData.Rows = neiData.Data.length
            neiData.Cols = neiData.Data[0].length

            await WriteNeiFile(neiData, filePath);
            message.success(t('Infos.success_save_file'));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.save_file_failed_colon') + error);
        }
    }

    /** 另存为 Nei 文件 */
    const handleSaveAsNeiFile = async () => {
        if (!neiData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }

        try {
            // 让用户选择一个保存路径
            const newPath = await SelectPathToSave("*.nei;*.csv", t('Infos.com3d2_nei_file'));
            if (!newPath) {
                // 用户取消
                return;
            }

            if (newPath.endsWith(".nei")) {
                await WriteNeiFile(neiData, newPath)
            } else if (newPath.endsWith(".csv")) {
                await NeiToCSVFile(neiData, newPath)
            } else {
                message.warning(t('Errors.file_type_not_supported') + newPath)
            }

            message.success(t('Infos.success_save_as_file_colon') + newPath);
        } catch (error: any) {
            message.error(t('Errors.save_as_file_failed_colon') + error.message);
            console.error(error);
        }
    }

    /** 暴露给父组件的 Ref 方法：读取、保存、另存为 */
    useImperativeHandle(ref, () => ({
        handleReadFile: handleReadNeiFile,
        handleSaveFile: handleSaveNeiFile,
        handleSaveAsFile: handleSaveAsNeiFile
    }));

    /** CSV 数据转换为字符串（带 UTF-8-BOM） */
    const csvDataToString = (csvData: string[][]): string => {
        const csvString = csvData.map(row =>
            row.map(cell => {
                // 如果单元格包含逗号、引号或换行符，需要用引号包围
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',')
        ).join('\n');

        // 添加 UTF-8-BOM
        return '\ufeff' + csvString;
    };

    /** 字符串转换为 CSV 数据 */
    const stringToCSVData = (csvString: string): string[][] => {
        // 移除 UTF-8-BOM 如果存在
        const cleanString = csvString.replace(/^\ufeff/, '');

        if (!cleanString.trim()) {
            return [];
        }

        const lines = cleanString.split('\n');
        const result: string[][] = [];

        for (const line of lines) {
            if (line.trim() === '') continue;

            const row: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];

                if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        // 转义的引号
                        current += '"';
                        i++; // 跳过下一个引号
                    } else {
                        // 切换引号状态
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    // 字段分隔符
                    row.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }

            // 添加最后一个字段
            row.push(current);
            result.push(row);
        }

        return result;
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
                        localStorage.setItem(NeiEditorViewModeKey, e.target.value.toString());
                    }}
                    options={[
                        {label: t('NeiEditor.table_mode'), value: 1},
                        {label: t('NeiEditor.csv_editor_mode'), value: 2},
                    ]}
                    optionType="button"
                    buttonStyle="solid"
                    size="small"
                />
            </div>

            {/* 根据视图模式显示不同的编辑器 */}
            {viewMode === 1 ? (
                <NeiTableEditor
                    neiData={neiData}
                    onDataChange={(newData) => setNeiData(newData)}
                />
            ) : (
                <NeiMonacoEditor
                    neiData={neiData}
                    onDataChange={(newData) => setNeiData(newData)}
                    csvDataToString={csvDataToString}
                    stringToCSVData={stringToCSVData}
                />
            )}
        </div>
    );
});

export default NeiEditor;