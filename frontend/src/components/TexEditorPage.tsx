// frontend/src/components/TexEditorPage.tsx
import React, {useRef} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {Layout, message} from "antd";
import NavBar from "./NavBar";
import {SelectFile} from "../../wailsjs/go/main/App";
import {useTranslation} from "react-i18next";
import TexEditor, {TexEditorRef} from "./TexEditor";

const {Content} = Layout;

const TexEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    // 从路由 state 中获取 filePath
    const state = location.state as { filePath: string } | undefined;
    const filePath = state?.filePath;

    // 用 ref 获取 texEditorRef 实例
    const texEditorRef = useRef<TexEditorRef>(null);

    // 导航栏按钮回调
    const handleOpenFile = async () => {
        try {
            const result = await SelectFile("*.tex", t('Infos.com3d2_tex_file'));
            if (result) {
                navigate("/tex-editor", {state: {filePath: result}});
            }
        } catch (err) {
            console.error(err);
            message.error(t('Errors.file_selection_error_colon') + err);
        }
    };

    const handleSaveFile = () => {
        texEditorRef.current?.handleSaveTexFile();
    };

    const handleSaveAsFile = () => {
        texEditorRef.current?.handleSaveAsTexFile();
    };

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onOpenFile={handleOpenFile}
                onSaveFile={handleSaveFile}
                onSaveAsFile={handleSaveAsFile}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <TexEditor filePath={filePath} ref={texEditorRef}/>
            </Content>
        </Layout>
    );
};

export default TexEditorPage;
