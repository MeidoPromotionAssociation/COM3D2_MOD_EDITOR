// frontend/src/components/PskEditorPage.tsx
import React, {useRef} from "react";
import {useLocation} from "react-router-dom";
import {Layout} from "antd";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import useFileHandlers from "../hooks/fileHanlder";
import PskEditor, {PskEditorRef} from "./PskEditor";

const {Content} = Layout;

const PskEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const {handleSelectFile, handleSaveFile, handleSaveAsFile} = useFileHandlers();

    // 从路由 state 中获取 filePath
    const state = location.state as { filePath: string } | undefined;
    const filePath = state?.filePath;

    // 用 ref 获取 pskEditorRef 实例
    const pskEditorRef = useRef<PskEditorRef>(null);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile("*.psk", t('Infos.com3d2_psk_file'))}
                onSaveFile={() => handleSaveFile(pskEditorRef)}
                onSaveAsFile={() => handleSaveAsFile(pskEditorRef)}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <PskEditor filePath={filePath} ref={pskEditorRef}/>
            </Content>
        </Layout>
    );
};

export default PskEditorPage;
