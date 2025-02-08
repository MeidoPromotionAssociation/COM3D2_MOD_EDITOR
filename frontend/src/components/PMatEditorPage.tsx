// frontend/src/components/MenuEditorPage.tsx
import React, {useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {Layout} from "antd";
import NavBar from "./NavBar";
import { SelectFile } from "../../wailsjs/go/main/App";
import {useTranslation} from "react-i18next";
import PMatEditor, {PMatEditorRef} from "./PMatEditor";

const { Content } = Layout;

const PMatEditorPage: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    // 从路由 state 中获取 filePath
    const state = location.state as { filePath: string } | undefined;
    const filePath = state?.filePath;

    // 用 ref 获取 MenuEditor 实例
    const pmatEditorRef = useRef<PMatEditorRef>(null);

    // 导航栏按钮回调
    const handleOpenFile = async () => {
        try {
            const result = await SelectFile("*.pmat", t('Infos.com3d2_mate_file'));
            if (result) {
                navigate("/pmat-editor", { state: { filePath: result } });
            }
        } catch (err) {
            console.error(err);
            alert(t('Errors.file_selection_error_colon') + err);
        }
    };

    const handleSaveFile = () => {
        pmatEditorRef.current?.handleSaveMenuFile();
    };

    const handleSaveAsFile = () => {
        pmatEditorRef.current?.handleSaveAsMenuFile();
    };

    return (
        <Layout style={{ height: "100vh" }}>
            <NavBar
                onOpenFile={handleOpenFile}
                onSaveFile={handleSaveFile}
                onSaveAsFile={handleSaveAsFile}
            />
            <Content style={{ padding: 0, overflow: "auto" }}>
                <PMatEditor filePath={filePath} ref={pmatEditorRef} />
            </Content>
        </Layout>
    );
};

export default PMatEditorPage;
