// frontend/src/components/HomePage.tsx
import React, {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {Button, Dropdown, Layout, MenuProps, message} from "antd";
import {SelectFile} from "../../wailsjs/go/main/App";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import {DownOutlined, GithubOutlined, TranslationOutlined} from "@ant-design/icons";
import {getFileExtension} from "../utils/utils";
import {BrowserOpenURL, WindowSetTitle} from "../../wailsjs/runtime";
import {AppVersion, ChineseMODGuideUrl, GitHubReleaseUrl, GitHubUrl} from "../utils/consts";
import {useVersionCheck} from "../utils/CheckUpdate";

const {Content} = Layout;

const HomePage: React.FC = () => {
    const {t, i18n} = useTranslation();
    const navigate = useNavigate();
    const [language, setLanguage] = React.useState('zh-CN');
    const hasUpdate = useVersionCheck();

    // 设置窗口标题
    useEffect(() => {
        const setTitle = async () => {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + AppVersion);
        }
        setTitle();
    });

    /**
     * 触发 Wails 的文件选择对话框，并跳转到对应页面
     */
    const handleSelectFile = async () => {
        try {
            const filePath = await SelectFile("*.menu;*.mate;*.pmat;*.col;*.phy", t('Infos.com3d2_mod_files'));
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
                    case "col":
                        navigate("/col-editor", {state: {filePath}});
                        break;
                    case "phy":
                        navigate("/phy-editor", {state: {filePath}});
                        break;
                    default:
                        message.error(t('Errors.file_type_not_supported'));
                }
            }
        } catch (err) {
            console.error(err);
            message.error(t('Errors.file_selection_error_colon') + err);
        }
    };


    const onSaveFile = async () => {
        message.warning(t('Errors.no_file_to_save'));
    }

    const handleLanguageChange: MenuProps['onClick'] = (e) => {
        i18n.changeLanguage(e.key);
        setLanguage(e.key);
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
            {/* 统一的导航栏；首页只传入打开文件回调 */}
            <NavBar onOpenFile={handleSelectFile} onSaveFile={onSaveFile} onSaveAsFile={onSaveFile}/>

            <Content
                style={{
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                }}
            >

                {/* 页面顶部 */}
                {hasUpdate && (
                    <div style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        padding: "5px 0",
                    }}>
                        <Button
                            type="primary"
                            danger
                            style={{width: "20%"}}
                            onClick={() => BrowserOpenURL(GitHubReleaseUrl)}
                        >
                            {t('HomePage.new_version_button')}
                        </Button>
                    </div>
                )}


                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <Button type="primary" onClick={handleSelectFile}>{t('HomePage.choose_file')}</Button>
                    <p style={{marginTop: 20, color: "#666"}}>
                        {t('HomePage.pls_select_a_file_to_edit')}
                    </p>

                    <Dropdown menu={languageMenu} placement="bottomRight">
                        <Button>
                            <TranslationOutlined/><DownOutlined/>
                        </Button>
                    </Dropdown>
                </div>


                {/* 页面底部 */}
                <div style={{
                    marginTop: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0px 0'
                }}>
                    <Button type="text" size="large" style={{color: "#666"}}
                            onClick={() => BrowserOpenURL(GitHubUrl)}>
                        <GithubOutlined/>
                    </Button>

                    {language === "zh-CN" && (
                        <Button type='text'
                                onClick={() => BrowserOpenURL(ChineseMODGuideUrl)}>
                            简明 MOD 教程
                        </Button>
                    )}
                </div>

            </Content>
        </Layout>
    );
};

export default HomePage;
