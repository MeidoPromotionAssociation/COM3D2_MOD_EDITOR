// frontend/src/components/ColEditorPage.tsx
import React, {useRef} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {Layout} from "antd";
import NavBar from "./NavBar";
import {SelectFile} from "../../wailsjs/go/main/App";
import {useTranslation} from "react-i18next";
import ColEditor, {ColEditorRef} from "./ColEditor";

const {Content} = Layout;

const ColEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    // 从路由 state 中获取 filePath
    const state = location.state as { filePath: string } | undefined;
    const filePath = state?.filePath;

    // 用 ref 获取 colEditorRef 实例
    const colEditorRef = useRef<ColEditorRef>(null);

    // 导航栏按钮回调
    const handleOpenFile = async () => {
        try {
            const result = await SelectFile("*.col", t('Infos.com3d2_pmat_file'));
            if (result) {
                navigate("/col-editor", {state: {filePath: result}});
            }
        } catch (err) {
            console.error(err);
            alert(t('Errors.file_selection_error_colon') + err);
        }
    };

    const handleSaveFile = () => {
        colEditorRef.current?.handleSaveColFile();
    };

    const handleSaveAsFile = () => {
        colEditorRef.current?.handleSaveAsColFile();
    };

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onOpenFile={handleOpenFile}
                onSaveFile={handleSaveFile}
                onSaveAsFile={handleSaveAsFile}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <ColEditor filePath={filePath} ref={colEditorRef}/>
            </Content>
        </Layout>
    );
};

export default ColEditorPage;
