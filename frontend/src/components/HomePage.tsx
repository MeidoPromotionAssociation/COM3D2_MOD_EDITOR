// frontend/src/components/HomePage.tsx
import React, {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {Button, Dropdown, Layout, MenuProps, message, notification} from "antd";
import {CheckLatestVersion, GetAppVersion, SelectFile} from "../../wailsjs/go/main/App";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import {DownOutlined, TranslationOutlined} from "@ant-design/icons";
import {getFileExtension} from "../utils/utils";
import {BrowserOpenURL, WindowSetTitle} from "../../wailsjs/runtime";

const {Content} = Layout;
const STORAGE_KEY = "lastCheckTime"; // 存储上次检查时间的键
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 小时（毫秒）
const GITHUB_RELEASE_URL = "https://github.com/90135/COM3D2_MOD_EDITOR/releases";


const HomePage: React.FC = () => {
    const {t, i18n} = useTranslation();
    const navigate = useNavigate();
    const [api, contextHolder] = notification.useNotification();

    // 设置窗口标题
    useEffect(() => {
        const setTitle = async () => {
            const appVersion = await GetAppVersion();
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + appVersion);
        }
        setTitle();
    });

    // 检查本地存储的上次检查更新时间
    const shouldCheckUpdate = () => {
        console.debug("shouldCheckUpdate")
        const lastCheckTime = localStorage.getItem(STORAGE_KEY);
        if (!lastCheckTime) return true; // 第一次检查
        const lastCheck = new Date(parseInt(lastCheckTime, 10));
        return Date.now() - lastCheck.getTime() > CHECK_INTERVAL;
    };

    // 触发检查更新
    const checkUpdate = async () => {
        if (!shouldCheckUpdate()) return; // 没到 24 小时，不检查
        localStorage.setItem(STORAGE_KEY, Date.now().toString()); //不管成功失败都记录时间

        console.debug("checkingUpdate")
        try {
            const result = await CheckLatestVersion();

            if (result.IsNewer) {
                api.open({
                    message: t('HomePage.new_version_available'),
                    description:
                        <div>
                            <p>{t("HomePage.current_version", {currentVersion: result.CurrentVersion})}</p>
                            <p>{t("HomePage.latest_version", {latestVersion: result.LatestVersion})}</p>
                            <p>{t("HomePage.pls_get_update_form_github")}</p>
                        </div>,
                    btn: (
                        <Button type="primary" size="small" onClick={() => BrowserOpenURL(GITHUB_RELEASE_URL)}>
                            {t('HomePage.go_github')}
                        </Button>
                    ),
                    showProgress: true,
                    pauseOnHover: true,
                });
            }
        } catch (error) {
            console.error(t('Errors.fail_to_check_update'), error);
        }
    };

    useEffect(() => {
        checkUpdate(); // 组件加载时自动检查更新
    }, []);


    /**
     * 触发 Wails 的文件选择对话框，并跳转到对应页面
     */
    const handleSelectFile = async () => {
        try {
            const filePath = await SelectFile("*.menu;*.mate;*.pmat", t('Infos.com3d2_mod_files'));
            if (filePath) {
                const extension = getFileExtension(filePath);
                switch (extension) {
                    case "menu":
                        navigate("/menu-editor", {state: {filePath}});
                        break;
                    case "mate":
                        navigate("/mate-editor", {state: {filePath}});
                        break;
                    case "pmat":
                        navigate("/pmat-editor", {state: {filePath}});
                        break;
                    default:
                        alert(t('Errors.file_type_not_supported'));
                }
            }
        } catch (err) {
            console.error(err);
            alert(t('Errors.file_selection_error_colon') + err);
        }
    };


    const onSaveFile = async () => {
        message.warning(t('Errors.no_file_to_save'));
    }

    const handleLanguageChange: MenuProps['onClick'] = (e) => {
        i18n.changeLanguage(e.key);
    };

    const languageMenu: MenuProps = {
        items: [
            {label: '简体中文 (Simplified Chinese)', key: "zh-CN"},
            {label: 'English (American English)', key: "en-US"},
            {label: '日本語 (Japanese)', key: "ja-JP"},
            {label: '韓國語 (Korean)', key: "ko-KR"},
        ],
        onClick: handleLanguageChange,
    };


    return (
        <Layout style={{height: "100vh"}}>
            {/* 统一的导航栏；首页暂时只传入打开文件回调 */}
            <NavBar onOpenFile={handleSelectFile} onSaveFile={onSaveFile} onSaveAsFile={onSaveFile}/>
            <Content
                style={{
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                {contextHolder} {/* 确保 contextHolder 被渲染 */}
                <Button type="primary" onClick={handleSelectFile}>{t('HomePage.choose_file')}</Button>
                <p style={{marginTop: 20, color: "#666"}}>
                    {t('HomePage.pls_select_a_file_to_edit')}
                </p>

                <Dropdown menu={languageMenu} placement="bottomRight">
                    <Button>
                        <TranslationOutlined/><DownOutlined/>
                    </Button>
                </Dropdown>

            </Content>
        </Layout>
    );
};

export default HomePage;
