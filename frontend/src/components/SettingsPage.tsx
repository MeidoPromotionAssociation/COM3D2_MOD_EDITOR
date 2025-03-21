// frontend/src/components/SettingsPage.tsx

import {Button, Card, Col, Layout, Row, Space, Switch, Tooltip, Typography} from "antd";
import {useTranslation} from "react-i18next";
import NavBar from "./NavBar";
import {Content} from "antd/es/layout/layout";
import useFileHandlers, {AllSupportedFileTypes} from "../hooks/fileHanlder";
import React, {useState} from "react";
import {CloseCircleOutlined, InfoCircleOutlined, SyncOutlined} from "@ant-design/icons";
import {checkForUpdatesWithMessage} from "../utils/CheckUpdate";

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
            <NavBar
                onSelectFile={() => handleSelectFile(AllSupportedFileTypes, t('Infos.com3d2_mod_files'))}
                onSaveFile={() => handleSaveFile(undefined)}
                onSaveAsFile={() => handleSaveFile(undefined)}
            />
            <Content style={{padding: 24, height: "100%"}}>
                <Card
                    style={{maxWidth: 600, margin: "0 auto"}}
                >
                    <Space direction="vertical" size="large" style={{width: "50%"}}>
                        <Button
                            type="primary"
                            icon={<SyncOutlined/>}
                            onClick={() => checkForUpdatesWithMessage()}
                            block
                        >
                            {t('SettingsPage.check_update_now')}
                        </Button>

                        <Row align="middle">
                            <Col span={16}>
                                <Space>
                                    <span>{t('SettingsPage.is_check_update')}</span>
                                    <Tooltip title={t('SettingsPage.is_check_update_tip')}>
                                        <InfoCircleOutlined/>
                                    </Tooltip>
                                </Space>
                            </Col>
                            <Col span={8} style={{textAlign: "right"}}>
                                <Switch
                                    checked={checkUpdates}
                                    onChange={handleUpdateCheck}
                                />
                            </Col>
                        </Row>

                        <Row>
                            <Col span={24}>
                                <Button
                                    type="default"
                                    onClick={handleDismissUpdate}
                                    icon={<CloseCircleOutlined/>}
                                    block
                                >
                                    {t('SettingsPage.dismiss_update_note')}
                                </Button>
                                <div style={{marginTop: 8}}>
                                    <Typography.Text type="secondary">
                                        <InfoCircleOutlined style={{marginRight: 8}}/>
                                        {t('SettingsPage.dismiss_update_note_tip')}
                                    </Typography.Text>
                                </div>
                            </Col>
                        </Row>
                    </Space>
                </Card>
            </Content>
        </Layout>
    );
};

export default SettingsPage;
