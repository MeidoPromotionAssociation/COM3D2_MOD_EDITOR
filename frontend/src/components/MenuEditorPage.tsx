// frontend/src/components/MenuEditorPage.tsx
import React, {useRef} from "react";
import {useLocation} from "react-router-dom";
import {Layout} from "antd";
import MenuEditor, {MenuEditorRef} from "./MenuEditor";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import useFileHandlers from "../hooks/fileHanlder";
import {COM3D2} from "../../wailsjs/go/models";
import FileInfo = COM3D2.FileInfo;

const {Content} = Layout;

const MenuEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const {handleSelectFile, handleSaveFile, handleSaveAsFile} = useFileHandlers();

    // 从路由 state 中获取 fileInfo
    const state = location.state as { fileInfo: FileInfo } | undefined;
    const fileInfo = state?.fileInfo;

    // 用 ref 获取 menuEditorRef 实例
    const menuEditorRef = useRef<MenuEditorRef>(null);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile("*.menu", t('Infos.com3d2_menu_file'))}
                onSaveFile={() => handleSaveFile(menuEditorRef)}
                onSaveAsFile={() => handleSaveAsFile(menuEditorRef)}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <MenuEditor fileInfo={fileInfo} ref={menuEditorRef}/>
            </Content>
        </Layout>
    );
};

export default MenuEditorPage;
