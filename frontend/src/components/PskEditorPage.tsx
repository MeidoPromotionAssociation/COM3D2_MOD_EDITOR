// frontend/src/components/PskEditorPage.tsx
import React, {useRef} from "react";
import {useLocation} from "react-router-dom";
import {Layout} from "antd";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import useFileHandlers from "../hooks/fileHanlder";
import PskEditor, {PskEditorRef} from "./PskEditor";
import {COM3D2} from "../../wailsjs/go/models";
import FileInfo = COM3D2.FileInfo;

const {Content} = Layout;

const PskEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const {handleSelectFile, handleSaveFile, handleSaveAsFile} = useFileHandlers();

    // 从路由 state 中获取 fileInfo
    const state = location.state as { fileInfo: FileInfo } | undefined;
    const fileInfo = state?.fileInfo;

    // 用 ref 获取 pskEditorRef 实例
    const pskEditorRef = useRef<PskEditorRef>(null);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile("*.psk;*.psk.json", t('Infos.com3d2_psk_file'))}
                onSaveFile={() => handleSaveFile(pskEditorRef)}
                onSaveAsFile={() => handleSaveAsFile(pskEditorRef)}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <PskEditor fileInfo={fileInfo} ref={pskEditorRef}/>
            </Content>
        </Layout>
    );
};

export default PskEditorPage;
