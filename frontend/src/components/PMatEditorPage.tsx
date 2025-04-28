// frontend/src/components/PMatEditorPage.tsx
import React, {useRef} from "react";
import {useLocation} from "react-router-dom";
import {Layout} from "antd";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import PMatEditor, {PMatEditorRef} from "./PMatEditor";
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

    // 用 ref 获取 pmatEditorRef 实例
    const pmatEditorRef = useRef<PMatEditorRef>(null);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile("*.pmat;*.pmat.json", t('Infos.com3d2_pmat_file'))}
                onSaveFile={() => handleSaveFile(pmatEditorRef)}
                onSaveAsFile={() => handleSaveAsFile(pmatEditorRef)}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <PMatEditor fileInfo={fileInfo} ref={pmatEditorRef}/>
            </Content>
        </Layout>
    );
};

export default PMatEditorPage;
