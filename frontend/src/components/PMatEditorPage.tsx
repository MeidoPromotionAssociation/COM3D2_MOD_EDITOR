// frontend/src/components/PMatEditorPage.tsx
import React, {useRef} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {Layout, message} from "antd";
import NavBar from "./NavBar";
import {SelectFile} from "../../wailsjs/go/main/App";
import {useTranslation} from "react-i18next";
import PMatEditor, {PMatEditorRef} from "./PMatEditor";
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
    const pmatEditorRef = useRef<PMatEditorRef>(null);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile("*.pmat", t('Infos.com3d2_pmat_file'))}
                onSaveFile={() => handleSaveFile(pmatEditorRef)}
                onSaveAsFile={() => handleSaveAsFile(pmatEditorRef)}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <PMatEditor filePath={filePath} ref={pmatEditorRef}/>
            </Content>
        </Layout>
    );
};

export default PMatEditorPage;
