import React, {useEffect, useRef, useState} from "react";
import {Editor} from "@monaco-editor/react";
import {useDarkMode} from "../../hooks/themeSwitch";
import {COM3D2} from "../../../wailsjs/go/models";
import NeiModel = COM3D2.Nei;

interface NeiMonacoEditorProps {
    neiData: NeiModel | null;
    onDataChange: (data: NeiModel) => void;
    csvDataToString: (csvData: string[][]) => string;
    stringToCSVData: (csvString: string) => string[][];
}

const NeiMonacoEditor: React.FC<NeiMonacoEditorProps> = ({
                                                             neiData,
                                                             onDataChange,
                                                             csvDataToString,
                                                             stringToCSVData
                                                         }) => {
    const isDarkMode = useDarkMode();
    const [csvValue, setCsvValue] = useState("");
    const editorRef = useRef<any>(null);
    const isInternalUpdate = useRef(false);
    const prevNeiDataRef = useRef<string | null>(null);

    // 处理 NeiData 的外部更新（如文件加载）
    useEffect(() => {
        if (neiData && neiData.Data) {
            const neiDataJson = JSON.stringify(neiData.Data);
            // Only update if this is an external change, not from our editor
            if (!isInternalUpdate.current && neiDataJson !== prevNeiDataRef.current) {
                // 显示时不添加 BOM 头
                const csvString = csvDataToString(neiData.Data);
                setCsvValue(csvString);
                prevNeiDataRef.current = neiDataJson;
            }
        } else {
            setCsvValue("");
            prevNeiDataRef.current = null;
        }
    }, [neiData, csvDataToString]);

    // 初始化第一次渲染
    useEffect(() => {
        if (neiData && neiData.Data) {
            // 显示时不添加 BOM 头
            const csvString = csvDataToString(neiData.Data);
            setCsvValue(csvString);
            prevNeiDataRef.current = JSON.stringify(neiData.Data);
        }
    }, []);

    // Handle the editor being mounted
    const handleEditorDidMount = (editor: any, monacoInstance: any) => {
        editorRef.current = editor;

        // 设置 CSV 语言支持
        monacoInstance.languages.register({id: 'csv'});
        monacoInstance.languages.setMonarchTokensProvider('csv', {
            tokenizer: {
                root: [
                    [/[^,\n\r"]+/, 'string'],
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/"/, 'string', '@string'],
                    [/,/, 'delimiter'],
                    [/\n|\r\n?/, 'delimiter.newline']
                ],
                string: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape'],
                    [/"/, 'string', '@pop']
                ]
            }
        });
    };

    // When user edits in the editor
    const handleEditorChange = (value?: string) => {
        const newVal = value ?? "";

        // Update local state without full re-render
        if (newVal !== csvValue) {
            setCsvValue(newVal);
        }

        try {
            const csvData = stringToCSVData(newVal);

            // Only update parent if actual content changed
            if (JSON.stringify(csvData) !== JSON.stringify(neiData?.Data)) {
                isInternalUpdate.current = true;

                const newNei = new NeiModel();
                newNei.Data = csvData;
                newNei.Rows = csvData.length;
                newNei.Cols = csvData.length > 0 ? Math.max(...csvData.map(row => row.length)) : 0;

                onDataChange(newNei);
                prevNeiDataRef.current = JSON.stringify(csvData);

                // Reset the flag after a delay to allow React to process
                setTimeout(() => {
                    isInternalUpdate.current = false;
                }, 0);
            }
        } catch (err) {
            // CSV parsing failed, don't update parent
            console.warn('CSV parsing failed:', err);
        }
    };

    return (
        <div style={{
            height: "calc(100vh - 120px)",
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            <Editor
                language="csv"
                theme={isDarkMode ? "vs-dark" : "vs"}
                value={csvValue}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: {enabled: true},
                    tabSize: 2,
                    wordWrap: 'on',
                    automaticLayout: true,
                }}
            />
        </div>
    );
};

export default NeiMonacoEditor;
