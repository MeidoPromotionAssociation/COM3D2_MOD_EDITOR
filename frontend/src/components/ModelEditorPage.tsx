// frontend/src/components/ModelEditorPage.tsx
import React, {useRef} from "react";
import {useLocation} from "react-router-dom";
import {Layout} from "antd";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import useFileHandlers from "../hooks/fileHanlder";
import ModelEditor, {ModelEditorRef} from "./ModelEditor";
import {COM3D2} from "../../wailsjs/go/models";
import FileInfo = COM3D2.FileInfo;

const {Content} = Layout;

const ModelEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const {handleSelectFile, handleSaveFile, handleSaveAsFile} = useFileHandlers();

    // 从路由 state 中获取 fileInfo
    const state = location.state as { fileInfo: FileInfo } | undefined;
    const fileInfo = state?.fileInfo;

    // 用 ref 获取 modelEditorRef 实例
    const modelEditorRef = useRef<ModelEditorRef>(null);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile("*.model;*.model.json", t('Infos.com3d2_model_file'))}
                onSaveFile={() => handleSaveFile(modelEditorRef)}
                onSaveAsFile={() => handleSaveAsFile(modelEditorRef)}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <ModelEditor fileInfo={fileInfo} ref={modelEditorRef}/>
            </Content>
        </Layout>
    );
};

export default ModelEditorPage;
