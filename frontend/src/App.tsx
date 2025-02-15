// App.tsx
import React, {useEffect} from "react";
import {Route, Routes, useNavigate} from "react-router-dom";
import HomePage from "./components/HomePage";
import {EventsEmit, EventsOnce, WindowSetTitle} from "../wailsjs/runtime";
import MenuEditorPage from "./components/MenuEditorPage";
import MateEditorPage from "./components/MateEditorPage";
import PMatEditorPage from "./components/PMatEditorPage";
import {getFileExtension} from "./utils/utils";
import {useTranslation} from "react-i18next";


WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");

const App: React.FC = () => {
    const navigate = useNavigate();
    const {t, i18n} = useTranslation();

    useEffect(() => {
        // 监听 Wails 事件 "file-opened" (即用户可以通过双击某种类型的文件，然后让应用打开该文件)
        EventsOnce('file-opened', (filePath: string) => {
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
                    alert(t('Errors.file_type_not_supported'))
            }
        })

        return () => {
        }
    }, [navigate, t])


    // 通知后端前端已就绪
    EventsEmit('app-ready')

    return (
        <Routes>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/menu-editor" element={<MenuEditorPage/>}/>
            <Route path="/mate-editor" element={<MateEditorPage/>}/>
            <Route path="/pmat-editor" element={<PMatEditorPage/>}/>
        </Routes>
    );
};

export default App;
