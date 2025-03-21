// frontend/src/components/PhyEditorPage.tsx
import React, {useRef} from "react";
import {useLocation} from "react-router-dom";
import {Layout} from "antd";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import PhyEditor, {PhyEditorRef} from "./PhyEditor";
import useFileHandlers from "../hooks/fileHanlder";

const {Content} = Layout;

const PMatEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const {handleSelectFile, handleSaveFile, handleSaveAsFile} = useFileHandlers();

    // 从路由 state 中获取 filePath
    const state = location.state as { filePath: string } | undefined;
    const filePath = state?.filePath;

    // 用 ref 获取 pmatEditorRef 实例
    const phyEditorRef = useRef<PhyEditorRef>(null);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile("*.phy", t('Infos.com3d2_pmat_file'))}
                onSaveFile={() => handleSaveFile(phyEditorRef)}
                onSaveAsFile={() => handleSaveAsFile(phyEditorRef)}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <PhyEditor filePath={filePath} ref={phyEditorRef}/>
            </Content>
        </Layout>
    );
};

export default PMatEditorPage;
