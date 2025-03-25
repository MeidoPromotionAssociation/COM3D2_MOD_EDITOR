import React, {useEffect, useRef, useState} from "react";
import {Editor} from "@monaco-editor/react";
import {useDarkMode} from "../../hooks/themeSwitch";
import {COM3D2} from "../../../wailsjs/go/models";
import ColModel = COM3D2.Col;

/** 样式2：直接用 Monaco Editor 展示/编辑整个 JSON */
const Style2Colliders: React.FC<{
    colData: ColModel | null;
    setColData: (m: ColModel | null) => void;
}> = ({colData, setColData}) => {
    const isDarkMode = useDarkMode();
    const [jsonValue, setJsonValue] = useState("");
    const editorRef = useRef<any>(null);
    const isInternalUpdate = useRef(false);
    const prevColDataRef = useRef<string | null>(null);

    // 处理 ColData 的外部更新（如文件加载）
    useEffect(() => {
        if (colData) {
            const colDataJson = JSON.stringify(colData);
            // Only update if this is an external change, not from our editor
            if (!isInternalUpdate.current && colDataJson !== prevColDataRef.current) {
                setJsonValue(JSON.stringify(colData, null, 2));
                prevColDataRef.current = colDataJson;
            }
        } else {
            setJsonValue("");
            prevColDataRef.current = null;
        }
    }, [colData]);

    // 初始化第一次渲染
    useEffect(() => {
        if (colData) {
            setJsonValue(JSON.stringify(colData, null, 2));
            prevColDataRef.current = JSON.stringify(colData);
        }
    }, []);

    // Handle the editor being mounted
    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
    };

    // When user edits in the editor
    const handleEditorChange = (value?: string) => {
        const newVal = value ?? "";

        // Update local state without full re-render
        if (newVal !== jsonValue) {
            setJsonValue(newVal);
        }

        try {
            const parsed = JSON.parse(newVal);

            // Only update parent if actual content changed
            if (JSON.stringify(parsed) !== JSON.stringify(colData)) {
                isInternalUpdate.current = true;
                setColData(parsed);
                prevColDataRef.current = JSON.stringify(parsed);

                // Reset the flag after a delay to allow React to process
                setTimeout(() => {
                    isInternalUpdate.current = false;
                }, 0);
            }
        } catch (err) {
            // JSON is not valid, don't update parent
        }
    };

    return (
        <div style={{
            height: "calc(100vh - 165px)",
            borderRadius: '8px',   // 添加圆角
            overflow: 'hidden'     // 隐藏超出圆角范围的部分
        }}>
            <Editor
                language="json"
                theme={isDarkMode ? "vs-dark" : "vs"}
                value={jsonValue}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: {enabled: true},
                    tabSize: 2,
                }}
            />
        </div>
    );
};


export default Style2Colliders;