// frontend/src/components/MenuEditorPage.tsx
import React, {useRef} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {Layout} from "antd";
import MenuEditor, {MenuEditorRef} from "./MenuEditor";
import NavBar from "./NavBar";
import {SelectFile} from "../../wailsjs/go/main/App";
import {useTranslation} from "react-i18next";

const {Content} = Layout;

const MenuEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    // 从路由 state 中获取 filePath
    const state = location.state as { filePath: string } | undefined;
    const filePath = state?.filePath;

    // 用 ref 获取 MenuEditor 实例
    const menuEditorRef = useRef<MenuEditorRef>(null);

    // 导航栏按钮回调
    const handleOpenFile = async () => {
        try {
            const result = await SelectFile("*.menu", t('Infos.com3d2_menu_file'));
            if (result) {
                navigate("/menu-editor", {state: {filePath: result}});
            }
        } catch (err) {
            console.error(err);
            alert(t('Errors.file_selection_error_colon') + err);
        }
    };

    const handleSaveFile = () => {
        menuEditorRef.current?.handleSaveMenuFile();
    };

    const handleSaveAsFile = () => {
        menuEditorRef.current?.handleSaveAsMenuFile();
    };

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onOpenFile={handleOpenFile}
                onSaveFile={handleSaveFile}
                onSaveAsFile={handleSaveAsFile}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <MenuEditor filePath={filePath} ref={menuEditorRef}/>
            </Content>
        </Layout>
    );
};

export default MenuEditorPage;
