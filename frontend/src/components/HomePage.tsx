// frontend/src/components/HomePage.tsx
import React from "react";
import {useNavigate} from "react-router-dom";
import {Button, Dropdown, Layout, MenuProps, message} from "antd";
import {SelectFile} from "../../wailsjs/go/main/App";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import {DownOutlined, TranslationOutlined} from "@ant-design/icons";

const {Content} = Layout;

const HomePage: React.FC = () => {
    const {t, i18n} = useTranslation();
    const navigate = useNavigate();

    /**
     * 触发 Wails 的文件选择对话框，并跳转到 MenuEditor 页面
     */
    const handleSelectFile = async () => {
        try {
            const result = await SelectFile("*.menu", t('Infos.com3d2_menu_file'));
            // 用户选择了文件后，跳转到 MenuEditor 页面
            if (result) {
                navigate("/menu-editor", {state: {filePath: result}});
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
                <Button type="primary" onClick={handleSelectFile}>{t('HomePage.choose_file')}</Button>
                <p style={{marginTop: 20, color: "#666"}}>
                    {t('HomePage.pls_select_menu_file_to_edit')}
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
