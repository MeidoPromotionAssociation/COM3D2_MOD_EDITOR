// frontend/src/components/NavBar.tsx
import React from "react";
import {Button, Layout, Menu} from "antd";
import {useLocation, useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {HomeOutlined} from "@ant-design/icons";
import {GitHubReleaseUrl} from "../utils/consts";
import {BrowserOpenURL} from "../../wailsjs/runtime";
import {useVersionCheck} from "../utils/CheckUpdate";

const {Header} = Layout;

interface EditorNavBarProps {
    onSelectFile?: () => void;
    onSaveFile?: () => void;
    onSaveAsFile?: () => void;
}

const NavBar: React.FC<EditorNavBarProps> = ({
                                                 onSelectFile,
                                                 onSaveFile,
                                                 onSaveAsFile,
                                             }) => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // 根据当前路径确定选中菜单项（假设路由名称与菜单 key 一致）
    const selectedKey = location.pathname.substring(1);

    const hasUpdate = useVersionCheck();

    const handleMenuClick = (e: any) => {
        navigate(`/${e.key}`);
    };

    return (
        <Header
            style={{
                display: "flex",
                alignItems: "center",
                padding: "0 20px",
            }}>
            {hasUpdate && (
                <Button
                    type="primary"
                    danger
                    size="small"
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        padding: '0 0px',
                        fontSize: 10,
                        lineHeight: 1,
                        zIndex: 1,
                        borderRadius: '0 0 0 4px',
                        minWidth: 20,
                        height: 17
                    }}
                    onClick={() => BrowserOpenURL(GitHubReleaseUrl)}
                >
                    NEW
                </Button>
            )}
            <div style={{
                flex: 1,
            }}>
                <Menu
                    theme="dark"
                    mode="horizontal"
                    selectedKeys={[selectedKey]}
                    onClick={handleMenuClick}
                    overflowedIndicator={null}
                    items={[
                        {key: "", icon: <HomeOutlined/>,},
                        {key: "menu-editor", label: t('EditorNavBar.MenuEditor')},
                        {key: "mate-editor", label: t('EditorNavBar.MateEditor')},
                        {key: "pmat-editor", label: t('EditorNavBar.PMateEditor')},
                        {key: "col-editor", label: t('EditorNavBar.ColEditor')},
                        {key: "phy-editor", label: t('EditorNavBar.PhyEditor')},
                        {key: "psk-editor", label: t('EditorNavBar.PskEditor')},
                        {key: "tex-editor", label: t('EditorNavBar.TexEditor')},
                        {key: "anm-editor", label: t('EditorNavBar.AnmEditor')},
                    ]}
                />
            </div>
            <div
                style={{
                    flexShrink: 0, // 禁止按钮区域收缩
                    whiteSpace: "nowrap", // 防止按钮换行
                    marginLeft: 16 // 添加左侧间距
                }}>
                <Button type="primary" onClick={onSelectFile}
                        style={{marginRight: 8}}>{t('EditorNavBar.open_file')}</Button>
                <Button onClick={onSaveFile} style={{marginRight: 8}}>{t('EditorNavBar.save_file')}</Button>
                <Button onClick={onSaveAsFile}>{t('EditorNavBar.save_as_file')}</Button>
            </div>
        </Header>
    );
};

export default NavBar;