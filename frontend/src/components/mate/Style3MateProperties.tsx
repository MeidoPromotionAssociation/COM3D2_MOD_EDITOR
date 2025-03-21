import React, {useEffect, useRef, useState} from 'react';
import {Editor} from "@monaco-editor/react";
import {COM3D2} from "../../../wailsjs/go/models";
import {useDarkMode} from "../../hooks/themeSwitch";
import Mate = COM3D2.Mate;


// ======================= 样式3：直接用 Monaco Editor 展示/编辑整个 mateData JSON =======================
const Style3MateProperties: React.FC<{
    mateData: Mate | null;
    setMateData: (m: Mate | null) => void;
}> = ({mateData, setMateData}) => {
    const isDarkMode = useDarkMode();
    const [jsonValue, setJsonValue] = useState("");
    const editorRef = useRef<any>(null);
    const isInternalUpdate = useRef(false);
    const prevColDataRef = useRef<string | null>(null);

    // 处理 ColData 的外部更新（如文件加载）
    useEffect(() => {
        if (mateData) {
            const mateDataJson = JSON.stringify(mateData);
            // Only update if this is an external change, not from our editor
            if (!isInternalUpdate.current && mateDataJson !== prevColDataRef.current) {
                setJsonValue(JSON.stringify(mateData, null, 2));
                prevColDataRef.current = mateDataJson;
            }
        } else {
            setJsonValue("");
            prevColDataRef.current = null;
        }
    }, [mateData]);

    // 初始化第一次渲染
    useEffect(() => {
        if (mateData) {
            setJsonValue(JSON.stringify(mateData, null, 2));
            prevColDataRef.current = JSON.stringify(mateData);
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
            if (JSON.stringify(parsed) !== JSON.stringify(mateData)) {
                isInternalUpdate.current = true;
                setMateData(parsed);
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

export default Style3MateProperties