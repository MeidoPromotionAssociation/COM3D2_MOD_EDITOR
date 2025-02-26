// frontend/src/components/PhyEditorPage.tsx
import React, {useRef} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {Layout} from "antd";
import NavBar from "./NavBar";
import {SelectFile} from "../../wailsjs/go/main/App";
import {useTranslation} from "react-i18next";
import PhyEditor, {PhyEditorRef} from "./PhyEditor";

const {Content} = Layout;

const PMatEditorPage: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    // 从路由 state 中获取 filePath
    const state = location.state as { filePath: string } | undefined;
    const filePath = state?.filePath;

    // 用 ref 获取 pmatEditorRef 实例
    const phyEditorRef = useRef<PhyEditorRef>(null);

    // 导航栏按钮回调
    const handleOpenFile = async () => {
        try {
            const result = await SelectFile("*.phy", t('Infos.com3d2_pmat_file'));
            if (result) {
                navigate("/phy-editor", {state: {filePath: result}});
            }
        } catch (err) {
            console.error(err);
            alert(t('Errors.file_selection_error_colon') + err);
        }
    };

    const handleSaveFile = () => {
        phyEditorRef.current?.handleSavePhyFile();
    };

    const handleSaveAsFile = () => {
        phyEditorRef.current?.handleSaveAsPhyFile();
    };

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onOpenFile={handleOpenFile}
                onSaveFile={handleSaveFile}
                onSaveAsFile={handleSaveAsFile}
            />
            <Content style={{padding: 0, overflow: "auto"}}>
                <PhyEditor filePath={filePath} ref={phyEditorRef}/>
            </Content>
        </Layout>
    );
};

export default PMatEditorPage;
