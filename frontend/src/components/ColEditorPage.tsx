// frontend/src/components/ColEditorPage.tsx
import React, {useRef} from "react";
import {useLocation} from "react-router-dom";
import {Layout} from "antd";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import ColEditor, {ColEditorRef} from "./ColEditor";
import useFileHandlers from "../hooks/fileHanlder";
import {COM3D2} from "../../wailsjs/go/models";
import FileInfo = COM3D2.FileInfo;

const {Content} = Layout;

const ColEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const {handleSelectFile, handleSaveFile, handleSaveAsFile} = useFileHandlers();

    // 从路由 state 中获取 fileInfo
    const state = location.state as { fileInfo: FileInfo } | undefined;
    const fileInfo = state?.fileInfo;

    // 用 ref 获取 colEditorRef 实例
    const colEditorRef = useRef<ColEditorRef>(null);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile("*.col", t('Infos.com3d2_col_file'))}
                onSaveFile={() => handleSaveFile(colEditorRef)}
                onSaveAsFile={() => handleSaveAsFile(colEditorRef)}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <ColEditor fileInfo={fileInfo} ref={colEditorRef}/>
            </Content>
        </Layout>
    );
};

export default ColEditorPage;
