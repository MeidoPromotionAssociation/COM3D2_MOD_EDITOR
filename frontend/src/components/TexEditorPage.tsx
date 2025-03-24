// frontend/src/components/TexEditorPage.tsx
import React, {useRef} from "react";
import {useLocation} from "react-router-dom";
import {Layout} from "antd";
import NavBar from "./NavBar";
import {useTranslation} from "react-i18next";
import TexEditor, {TexEditorRef} from "./TexEditor";
import useFileHandlers from "../hooks/fileHanlder";

const {Content} = Layout;

const TexEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const {handleSelectFile, handleSaveFile, handleSaveAsFile} = useFileHandlers();

    // 从路由 state 中获取 filePath
    const state = location.state as { filePath: string } | undefined;
    const filePath = state?.filePath;

    // 用 ref 获取 texEditorRef 实例
    const texEditorRef = useRef<TexEditorRef>(null);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile("*.tex;*.*", t('Infos.com3d2_tex_file'))}
                onSaveFile={() => handleSaveFile(texEditorRef)}
                onSaveAsFile={() => handleSaveAsFile(texEditorRef)}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <TexEditor filePath={filePath} ref={texEditorRef}/>
            </Content>
        </Layout>
    );
};

export default TexEditorPage;
