import React, {useEffect, useRef, useState} from "react";
import {Editor} from "@monaco-editor/react";
import {useDarkMode} from "../../hooks/themeSwitch";
import {COM3D2} from "../../../wailsjs/go/models";
import {useTranslation} from "react-i18next";
import Anm = COM3D2.Anm;

/** 直接用 Monaco Editor 展示/编辑整个 JSON */
const AnmMonacoEditor: React.FC<{
    anmData: Anm | null;
    setAnmData: (a: Anm | null) => void;
}> = ({anmData, setAnmData}) => {
    const {t} = useTranslation();
    const isDarkMode = useDarkMode();
    const [jsonValue, setJsonValue] = useState("");
    const editorRef = useRef<any>(null);
    const isInternalUpdate = useRef(false);
    const prevAnmDataRef = useRef<string | null>(null);
    const initializedMonacoInstances = new WeakMap()

    // Define JSON schema for Anm type
    const defineAnmSchema = (monacoInstance: any) => {
        if (initializedMonacoInstances.has(monacoInstance)) {
            return;
        }

        monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [{
                fileMatch: ["*"],
                schema: {
                    type: "object",
                    properties: {
                        Signature: {
                            type: "string",
                            description: t('AnmEditor.file_header.Signature')
                        },
                        Version: {
                            type: "number",
                            description: t('AnmEditor.file_header.Version')
                        },
                        BoneCurves: {
                            type: "array",
                            description: t('AnmEditor.BoneCurves'),
                            items: {
                                type: "object",
                                properties: {
                                    BonePath: {
                                        type: "string",
                                        description: t('AnmEditor.BonePath')
                                    },
                                    PropertyCurves: {
                                        type: "array",
                                        description: t('AnmEditor.PropertyCurves'),
                                        items: {
                                            type: "object",
                                            properties: {
                                                PropertyIndex: {
                                                    type: "number",
                                                    description: t('AnmEditor.PropertyIndex')
                                                },
                                                Keyframes: {
                                                    type: "array",
                                                    description: t('AnmEditor.Keyframes'),
                                                    items: {
                                                        type: "object",
                                                        properties: {
                                                            Time: {
                                                                type: "number",
                                                                description: t('AnmEditor.Time')
                                                            },
                                                            Value: {
                                                                type: "number",
                                                                description: t('AnmEditor.Value')
                                                            },
                                                            InTangent: {
                                                                type: "number",
                                                                description: t('AnmEditor.InTangent')
                                                            },
                                                            OutTangent: {
                                                                type: "number",
                                                                description: t('AnmEditor.OutTangent')
                                                            }
                                                        },
                                                        required: ["Time", "Value", "InTangent", "OutTangent"]
                                                    }
                                                }
                                            },
                                            required: ["PropertyIndex", "Keyframes"]
                                        }
                                    }
                                },
                                required: ["BonePath", "PropertyCurves"]
                            }
                        },
                        BustKeyLeft: {
                            type: "boolean",
                            description: t('AnmEditor.BustKeyLeft')
                        },
                        BustKeyRight: {
                            type: "boolean",
                            description: t('AnmEditor.BustKeyRight')
                        }
                    },
                    additionalProperties: true, // Allow additional properties
                    required: ["Signature", "Version", "BustKeyLeft", "BustKeyRight"] // Specify required fields
                }
            }]
        });

        initializedMonacoInstances.set(monacoInstance, true);
    };

    // 处理 AnmData 的外部更新（如文件加载）
    useEffect(() => {
        if (anmData) {
            const anmDataJson = JSON.stringify(anmData);
            // Only update if this is an external change, not from our editor
            if (!isInternalUpdate.current && anmDataJson !== prevAnmDataRef.current) {
                setJsonValue(JSON.stringify(anmData, null, 2));
                prevAnmDataRef.current = anmDataJson;
            }
        } else {
            setJsonValue("");
            prevAnmDataRef.current = null;
        }
    }, [anmData]);

    // 初始化第一次渲染
    useEffect(() => {
        if (anmData) {
            setJsonValue(JSON.stringify(anmData, null, 2));
            prevAnmDataRef.current = JSON.stringify(anmData);
        }
    }, []);

    // Handle the editor being mounted
    const handleEditorDidMount = (editor: any, monacoInstance: any) => {
        editorRef.current = editor;
        defineAnmSchema(monacoInstance);
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
            if (JSON.stringify(parsed) !== JSON.stringify(anmData)) {
                isInternalUpdate.current = true;
                setAnmData(parsed);
                prevAnmDataRef.current = JSON.stringify(parsed);

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


export default AnmMonacoEditor;