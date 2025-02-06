// App.tsx
import React, {useEffect} from "react";
import {Routes, Route, HashRouter} from "react-router-dom";
import HomePage from "./components/HomePage";
import {EventsOff, EventsOn, WindowSetTitle} from "../wailsjs/runtime";
import MenuEditorPage from "./components/MenuEditorPage";
import MateEditorPage from "./components/MateEditorPage";
import PMatEditorPage from "./components/PMatEditorPage";


WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");

const App: React.FC = () => {
    useEffect(() => {
        // 监听 Wails 事件 "file-opened" (即用户可以通过双击某种类型的文件，然后让应用打开该文件)
        EventsOn("file-opened", (path: string) => {
            console.log("打开的文件路径:", path);
            //TODO: 打开文件
        });

        return () => {
            EventsOff("file-opened");
        };
    }, []);



    return (
        <HashRouter basename={"/"}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/menu-editor" element={<MenuEditorPage />} />
                <Route path="/mate-editor" element={<MateEditorPage />} />
                <Route path="/pmat-editor" element={<PMatEditorPage />} />
            </Routes>
        </HashRouter>
    );
};

export default App;
