// frontend/src/components/PhyEditorPage.tsx
import React, {useRef} from "react";
import {useLocation} from "react-router-dom";
import {Layout} from "antd";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import PhyEditor, {PhyEditorRef} from "./PhyEditor";
import useFileHandlers from "../hooks/fileHanlder";
import {COM3D2} from "../../wailsjs/go/models";
import FileInfo = COM3D2.FileInfo;

const {Content} = Layout;

const PMatEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const {handleSelectFile, handleSaveFile, handleSaveAsFile} = useFileHandlers();

    // 从路由 state 中获取 fileInfo
    const state = location.state as { fileInfo: FileInfo } | undefined;
    const fileInfo = state?.fileInfo;

    // 用 ref 获取 phyEditorRef 实例
    const phyEditorRef = useRef<PhyEditorRef>(null);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile("*.phy;*.phy.json", t('Infos.com3d2_phy_file'))}
                onSaveFile={() => handleSaveFile(phyEditorRef)}
                onSaveAsFile={() => handleSaveAsFile(phyEditorRef)}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <PhyEditor fileInfo={fileInfo} ref={phyEditorRef}/>
            </Content>
        </Layout>
    );
};

export default PMatEditorPage;
