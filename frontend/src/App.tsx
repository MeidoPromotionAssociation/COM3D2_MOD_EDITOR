// App.tsx
import React, {useEffect} from "react";
import {Route, Routes, useNavigate} from "react-router-dom";
import HomePage from "./components/HomePage";
import {EventsEmit, EventsOnce, OnFileDrop, WindowSetTitle} from "../wailsjs/runtime";
import MenuEditorPage from "./components/MenuEditorPage";
import MateEditorPage from "./components/MateEditorPage";
import PMatEditorPage from "./components/PMatEditorPage";
import {getFileExtension} from "./utils/utils";
import {useTranslation} from "react-i18next";
import {ConfigProvider, message, theme} from "antd";
import {useDarkMode} from "./hooks/themeSwitch";
import {GetAppVersion} from "../wailsjs/go/main/App";


const App: React.FC = () => {
    const navigate = useNavigate();
    const {t, i18n} = useTranslation();
    const isDarkMode = useDarkMode();

    useEffect(() => {
        // 监听 Wails 事件 "file-opened" (即用户可以通过双击某种类型的文件，然后让应用打开该文件)
        EventsOnce('file-opened', (filePath: string) => {
            console.log('file-opened', filePath)
            const extension = getFileExtension(filePath)
            switch (extension) {
                case "menu":
                    navigate("/menu-editor", {state: {filePath}})
                    break
                case "mate":
                    navigate("/mate-editor", {state: {filePath}})
                    break
                case "pmat":
                    navigate("/pmat-editor", {state: {filePath}})
                    break
                default:
                   message.error(t('Errors.file_type_not_supported'))
            }
        })
        return () => {
        }
    }, [navigate, t])


    useEffect(() => {
        // 用户拖放文件
        OnFileDrop((x, y, paths) => {
            const filePath = paths[0]
            const extension = getFileExtension(filePath)
            switch (extension) {
                case "menu":
                    navigate("/menu-editor", {state: {filePath}})
                    break
                case "mate":
                    navigate("/mate-editor", {state: {filePath}})
                    break
                case "pmat":
                    navigate("/pmat-editor", {state: {filePath}})
                    break
                default:
                    message.error(t('Errors.file_type_not_supported'))
            }
        },false)
    }, []);

    useEffect(() => {
        // 通知后端前端已就绪
        EventsEmit('app-ready')
    }, []); // 空依赖数组确保只执行一次


    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
            }}>
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/menu-editor" element={<MenuEditorPage/>}/>
                <Route path="/mate-editor" element={<MateEditorPage/>}/>
                <Route path="/pmat-editor" element={<PMatEditorPage/>}/>
            </Routes>
        </ConfigProvider>
    );
};

export default App;
