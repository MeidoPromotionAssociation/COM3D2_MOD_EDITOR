import React, {useEffect, useRef, useState} from "react";
import {Editor} from "@monaco-editor/react";
import {useDarkMode} from "../../hooks/themeSwitch";
import {COM3D2} from "../../../wailsjs/go/models";
import {useTranslation} from "react-i18next";
import Model = COM3D2.Model;

/** 直接用 Monaco Editor 展示/编辑整个 JSON */
const ModelMonacoEditor: React.FC<{
    modelData: Model | null;
    setModelData: (a: Model | null) => void;
}> = ({modelData, setModelData}) => {/**/
    const {t} = useTranslation();
    const isDarkMode = useDarkMode();
    const [jsonValue, setJsonValue] = useState("");
    const editorRef = useRef<any>(null);
    const isInternalUpdate = useRef(false);
    const prevModelDataRef = useRef<string | null>(null);
    const initializedMonacoInstances = new WeakMap()

    // Define JSON schema for Model type
    const defineModelSchema = (monacoInstance: any) => {
        // if (initializedMonacoInstances.has(monacoInstance)) {
        //     return;
        // }

        monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: []
        });

        initializedMonacoInstances.set(monacoInstance, true);
    };

    // 处理 ModelData 的外部更新（如文件加载）
    useEffect(() => {
        if (modelData) {
            const modelDataJson = JSON.stringify(modelData);
            // Only update if this is an external change, not from our editor
            if (!isInternalUpdate.current && modelDataJson !== prevModelDataRef.current) {
                setJsonValue(JSON.stringify(modelData, null, 2));
                prevModelDataRef.current = modelDataJson;
            }
        } else {
            setJsonValue("");
            prevModelDataRef.current = null;
        }
    }, [modelData]);

    // 初始化第一次渲染
    useEffect(() => {
        if (modelData) {
            setJsonValue(JSON.stringify(modelData, null, 2));
            prevModelDataRef.current = JSON.stringify(modelData);
        }
    }, []);

    // Handle the editor being mounted
    const handleEditorDidMount = (editor: any, monacoInstance: any) => {
        editorRef.current = editor;
        defineModelSchema(monacoInstance);
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
            if (JSON.stringify(parsed) !== JSON.stringify(modelData)) {
                isInternalUpdate.current = true;
                setModelData(parsed);
                prevModelDataRef.current = JSON.stringify(parsed);

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
            height: "calc(100vh - 90px)",
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


export default ModelMonacoEditor;