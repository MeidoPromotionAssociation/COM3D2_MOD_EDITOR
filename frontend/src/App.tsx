// App.tsx
import React, {useEffect} from "react";
import {Route, Routes, useNavigate} from "react-router-dom";
import HomePage from "./components/HomePage";
import {EventsEmit, EventsOnce, OnFileDrop} from "../wailsjs/runtime";
import MenuEditorPage from "./components/MenuEditorPage";
import MateEditorPage from "./components/MateEditorPage";
import PMatEditorPage from "./components/PMatEditorPage";
import {getFileExtension} from "./utils/utils";
import {useTranslation} from "react-i18next";
import {ConfigProvider, message, theme} from "antd";
import {useDarkMode} from "./hooks/themeSwitch";
import ColEditorPage from "./components/ColEditorPage";
import PhyEditorPage from "./components/PhyEditorPage";
import {LastUpdateCheckTimeKey, NewVersionAvailableKey, UpdateCheckInterval} from "./utils/consts";
import {CheckLatestVersion} from "../wailsjs/go/main/App";


const App: React.FC = () => {
    const navigate = useNavigate();
    const {t} = useTranslation();
    const isDarkMode = useDarkMode();
    const [isNewVersionAvailable, setIsNewVersionAvailable] = React.useState(
        localStorage.getItem(NewVersionAvailableKey) === 'true'
    );
    const [checkUpdateFailed, setCheckUpdateFailed] = React.useState(false);

    // 检查本地存储的上次检查更新时间
    const shouldCheckUpdate = () => {
        // 还是每 24 小时检查一次，这样就不需要比较复杂的更新后清除缓存的逻辑了
        console.debug("checkIfShouldCheckUpdate")
        const lastCheckTime = localStorage.getItem(LastUpdateCheckTimeKey);
        if (!lastCheckTime) return true; // 第一次检查
        const lastCheck = new Date(parseInt(lastCheckTime, 10));

        // 如果上次检查更新失败了，就 1 小时后再试一次
        const interval = checkUpdateFailed ? 3600000 : UpdateCheckInterval;
        return Date.now() - lastCheck.getTime() > interval;
    };

    // 触发检查更新
    const checkUpdate = async () => {
        if (!shouldCheckUpdate()) return; // 没到 24 小时，不检查
        localStorage.setItem(LastUpdateCheckTimeKey, Date.now().toString()); //不管成功失败都记录时间

        console.debug("checkingUpdate")
        try {
            const result = await CheckLatestVersion();
            localStorage.setItem(NewVersionAvailableKey, result.IsNewer.toString());
            setIsNewVersionAvailable(result.IsNewer);
            setCheckUpdateFailed(false);
        } catch (error) {
            setCheckUpdateFailed(true);  // 失败时设置失败状态
            console.error(t('Errors.fail_to_check_update'), error);
        }
    };

    useEffect(() => {
        checkUpdate(); // 组件加载时自动检查更新
    }, []);


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
                case "phy":
                    navigate("/phy-editor", {state: {filePath}})
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
                case "phy":
                    navigate("/phy-editor", {state: {filePath}})
                    break
                default:
                    message.error(t('Errors.file_type_not_supported'))
            }
        }, false)
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
                <Route path="/col-editor" element={<ColEditorPage/>}/>
                <Route path="/phy-editor" element={<PhyEditorPage/>}/>
            </Routes>
        </ConfigProvider>
    );
};

export default App;
