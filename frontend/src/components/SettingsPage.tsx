// frontend/src/components/SettingsPage.tsx

import {Button, Layout, Switch, Tooltip} from "antd";
import {useTranslation} from "react-i18next";
import NavBar from "./NavBar";
import {Content} from "antd/es/layout/layout";
import useFileHandlers from "../hooks/fileHanlder";
import React, {useState} from "react";
import {InfoCircleOutlined} from "@ant-design/icons";

const SettingsPage: React.FC = () => {
    const {t} = useTranslation();
    const {handleSelectFile, handleSaveFile} = useFileHandlers();


    const [checkUpdates, setCheckUpdates] = useState(() => {
        const saved = localStorage.getItem('SettingCheckUpdateKey');
        return saved ? JSON.parse(saved) : true;
    });

    const handleUpdateCheck = (checked: boolean) => {
        setCheckUpdates(checked);
        localStorage.setItem('SettingCheckUpdateKey', JSON.stringify(checked));
    };

    const handleDismissUpdate = () => {
        localStorage.setItem('NewVersionAvailableKey', 'false');
    };

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar onOpenFile={() => handleSelectFile("*.menu;*.mate;*.pmat;*.col;*.phy", t('Infos.com3d2_mod_files'))}
                    onSaveFile={handleSaveFile}
                    onSaveAsFile={handleSaveFile}/>
            <Content
                style={{
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                }}
            >

                {/* 页面中部 */}
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center"
                }}>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <span>{t('SettingsPage.is_check_update')}</span>
                        <Switch
                            checked={checkUpdates}
                            onChange={handleUpdateCheck}
                        />
                        <Tooltip title={t('SettingsPage.is_check_update_tip')}>
                            <InfoCircleOutlined/>
                        </Tooltip>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <Button
                            type="primary"
                            style={{marginTop: 16}}
                            onClick={handleDismissUpdate}
                        >
                            {t('SettingsPage.dismiss_update_note')}
                        </Button>
                        <Tooltip title={t('SettingsPage.dismiss_update_note_tip')}>
                            <InfoCircleOutlined/>
                        </Tooltip>
                    </div>
                </div>


            </Content>
        </Layout>
    );
};

export default SettingsPage;
