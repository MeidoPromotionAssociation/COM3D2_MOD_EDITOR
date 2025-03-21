// frontend/src/components/MenuEditorPage.tsx
import React, {useRef} from "react";
import {useLocation} from "react-router-dom";
import {Layout} from "antd";
import MenuEditor, {MenuEditorRef} from "./MenuEditor";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import useFileHandlers from "../hooks/fileHanlder";

const {Content} = Layout;

const MenuEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const {handleSelectFile, handleSaveFile, handleSaveAsFile} = useFileHandlers();

    // 从路由 state 中获取 filePath
    const state = location.state as { filePath: string } | undefined;
    const filePath = state?.filePath;

    // 用 ref 获取 MenuEditor 实例
    const menuEditorRef = useRef<MenuEditorRef>(null);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile("*.menu", t('Infos.com3d2_menu_file'))}
                onSaveFile={() => handleSaveFile(menuEditorRef)}
                onSaveAsFile={() => handleSaveAsFile(menuEditorRef)}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <MenuEditor filePath={filePath} ref={menuEditorRef}/>
            </Content>
        </Layout>
    );
};

export default MenuEditorPage;
