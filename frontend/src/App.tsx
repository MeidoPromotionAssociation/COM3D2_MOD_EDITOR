// App.tsx
import React, {useEffect, useState} from "react";
import {Route, Routes} from "react-router-dom";
import HomePage from "./components/HomePage";
import {EventsEmit, EventsOnce, OnFileDrop} from "../wailsjs/runtime";
import MenuEditorPage from "./components/MenuEditorPage";
import MateEditorPage from "./components/MateEditorPage";
import PMatEditorPage from "./components/PMatEditorPage";
import {ConfigProvider, theme} from "antd";
import {useDarkMode} from "./hooks/themeSwitch";
import ColEditorPage from "./components/ColEditorPage";
import PhyEditorPage from "./components/PhyEditorPage";
import SettingsPage from "./components/SettingsPage";
import TexEditorPage from "./components/TexEditorPage";
import useFileHandlers from "./hooks/fileHanlder";
import AnmEditorPage from "./components/AnmEditorPage";
import PskEditorPage from "./components/PskEditorPage";
import ModelEditorPage from "./components/ModelEditorPage";
import DisclaimerDialog from "./components/DisclaimerDialog";
import {DisclaimerAgreedKey} from "./utils/LocalStorageKeys";
import '@ant-design/v5-patch-for-react-19';
import NeiEditorPage from "./components/NeiEditorPage";

const App: React.FC = () => {
    const isDarkMode = useDarkMode();
    const {handleOpenedFile} = useFileHandlers();
    const [showDisclaimer, setShowDisclaimer] = useState(() => {
        return localStorage.getItem(DisclaimerAgreedKey) !== 'true';
    });

    // 用户同意免责声明
    const handleAgreeDisclaimer = () => {
        setShowDisclaimer(false);
        localStorage.setItem(DisclaimerAgreedKey, 'true');
    };

    // 监听 Wails 事件 "file-opened" (即用户可以通过双击某种类型的文件，然后让应用打开该文件)
    useEffect(() => {
        const handleFileOpened = async (filePath: string) => {
            await handleOpenedFile(filePath);
        };

        EventsOnce('file-opened', handleFileOpened);
        return () => {
        }
    }, [handleOpenedFile])


    // 用户拖放文件
    useEffect(() => {
        const handleDrop = async (x: number, y: number, paths: string[]) => {
            await handleOpenedFile(paths[0]);
        };

        OnFileDrop(handleDrop, false);
    }, [handleOpenedFile]);

    // 通知后端前端已就绪
    useEffect(() => {
        EventsEmit('app-ready')
    }, []);

    // 为了让 monaco 从本地而不是 CDN 加载
    const monacoInit = async () => {
        const loader = await import("@monaco-editor/loader");
        const monaco = await import("monaco-editor")
        const editorWorker = await import("monaco-editor/esm/vs/editor/editor.worker?worker")
        const jsonWorker = await import("monaco-editor/esm/vs/language/json/json.worker?worker")

        MonacoEnvironment = {
            getWorker(_, label) {
                if (label === "json") {
                    return new jsonWorker.default()
                }
                return new editorWorker.default()
            }
        }
        loader.default.config({
            monaco,
        });
    }

    monacoInit().then(() => {
    })


    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
            }}>
            <DisclaimerDialog visible={showDisclaimer} onAgree={handleAgreeDisclaimer}/>
            {!showDisclaimer && (
                <Routes>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/menu-editor" element={<MenuEditorPage/>}/>
                    <Route path="/mate-editor" element={<MateEditorPage/>}/>
                    <Route path="/pmat-editor" element={<PMatEditorPage/>}/>
                    <Route path="/col-editor" element={<ColEditorPage/>}/>
                    <Route path="/phy-editor" element={<PhyEditorPage/>}/>
                    <Route path="/psk-editor" element={<PskEditorPage/>}/>
                    <Route path="/tex-editor" element={<TexEditorPage/>}/>
                    <Route path="/anm-editor" element={<AnmEditorPage/>}/>
                    <Route path="/model-editor" element={<ModelEditorPage/>}/>
                    <Route path="/nei-editor" element={<NeiEditorPage/>}/>
                    <Route path="/settings" element={<SettingsPage/>}/>
                </Routes>
            )}
        </ConfigProvider>
    );
};

export default App;
