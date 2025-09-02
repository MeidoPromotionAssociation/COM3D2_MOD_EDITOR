// frontend/src/components/NeiEditorPage.tsx
import React, {useRef} from "react";
import {useLocation} from "react-router-dom";
import {Layout} from "antd";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import useFileHandlers from "../hooks/fileHanlder";
import {COM3D2} from "../../wailsjs/go/models";
import NeiEditor, {NeiEditorRef} from "./NeiEditor";
import FileInfo = COM3D2.FileInfo;

const {Content} = Layout;

const NeiEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const {handleSelectFile, handleSaveFile, handleSaveAsFile} = useFileHandlers();

    // 从路由 state 中获取 fileInfo
    const state = location.state as { fileInfo: FileInfo } | undefined;
    const fileInfo = state?.fileInfo;

    // 用 ref 获取 neiEditorRef 实例
    const neiEditorRef = useRef<NeiEditorRef>(null);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile("*.nei;*.csv", t('Infos.com3d2_nei_file'))}
                onSaveFile={() => handleSaveFile(neiEditorRef)}
                onSaveAsFile={() => handleSaveAsFile(neiEditorRef)}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <NeiEditor fileInfo={fileInfo} ref={neiEditorRef}/>
            </Content>
        </Layout>
    );
};

export default NeiEditorPage;
