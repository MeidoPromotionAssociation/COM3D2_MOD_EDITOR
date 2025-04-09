import React, {useEffect, useRef, useState} from "react";
import {Editor} from "@monaco-editor/react";
import {useDarkMode} from "../../hooks/themeSwitch";
import {COM3D2} from "../../../wailsjs/go/models";
import Phy = COM3D2.Phy;
import {cancelJsonSchemaValidation} from "../../utils/utils";


interface Style2PhyProps {
    phyData: Phy | null;
    setPhyData: (newData: Phy | null) => void;
}


// Style2PhyProperties 使用 monaco 编辑器
const Style2PhyProperties: React.FC<Style2PhyProps> = ({phyData, setPhyData}) => {
    const isDarkMode = useDarkMode();
    const [jsonValue, setJsonValue] = useState("");
    const editorRef = useRef<any>(null);
    // 避免自身更新时触发的 useEffect 重复
    const isInternalUpdate = useRef(false);
    const prevPhyRef = useRef<string | null>(null);

    // 当 phyData 外部发生变化时，如果不是我们自己内部触发的，就同步到编辑器
    useEffect(() => {
        if (phyData) {
            const phyDataJson = JSON.stringify(phyData);
            // 如果不是内部更新 & 内容有变化，就更新编辑器
            if (!isInternalUpdate.current && phyDataJson !== prevPhyRef.current) {
                setJsonValue(JSON.stringify(phyData, null, 2));
                prevPhyRef.current = phyDataJson;
            }
        } else {
            setJsonValue("");
            prevPhyRef.current = null;
        }
    }, [phyData]);

    // 用户在编辑器里修改时
    const handleEditorChange = (value?: string) => {
        const newVal = value ?? "";
        if (newVal !== jsonValue) {
            setJsonValue(newVal);
        }

        try {
            const parsed = JSON.parse(newVal);
            // JSON 合法，且与当前 phyData 不相同时，更新到外部
            if (JSON.stringify(parsed) !== JSON.stringify(phyData)) {
                isInternalUpdate.current = true;
                setPhyData(parsed);
                prevPhyRef.current = JSON.stringify(parsed);
                // 一点小延时，避免 useEffect 再次判断时还在内部更新中
                setTimeout(() => {
                    isInternalUpdate.current = false;
                }, 0);
            }
        } catch (err) {
            // JSON 不合法时，不更新外部
        }
    };

    const handleEditorDidMount = (editor: any, monacoInstance: any) => {
        editorRef.current = editor;
        cancelJsonSchemaValidation(monacoInstance);
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


export default Style2PhyProperties;