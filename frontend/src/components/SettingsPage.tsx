// frontend/src/components/SettingsPage.tsx
import {Button, Card, Col, Dropdown, Layout, List, MenuProps, Row, Space, Switch, Tooltip, Typography} from "antd";
import {useTranslation} from "react-i18next";
import NavBar from "./NavBar";
import {Content} from "antd/es/layout/layout";
import useFileHandlers from "../hooks/fileHanlder";
import React, {useState} from "react";
import {
    CloseCircleOutlined,
    DownOutlined,
    QuestionCircleOutlined,
    SyncOutlined,
    TranslationOutlined
} from "@ant-design/icons";
import {checkForUpdatesWithMessage} from "../utils/CheckUpdate";
import {AllSupportedFileTypes, SettingCheckUpdateKey} from "../utils/consts";
import {NewVersionAvailableKey} from "../utils/LocalStorageKeys";

const SettingsPage: React.FC = () => {
    const {t, i18n} = useTranslation();
    const {handleSelectFile, handleSaveFile, strictMode, updateStrictMode} = useFileHandlers();
    const [language, setLanguage] = useState(i18n.language);

    const [checkUpdates, setCheckUpdates] = useState(() => {
        const saved = localStorage.getItem(SettingCheckUpdateKey);
        return saved ? JSON.parse(saved) : true;
    });

    const handleUpdateCheck = (checked: boolean) => {
        setCheckUpdates(checked);
        localStorage.setItem(SettingCheckUpdateKey, JSON.stringify(checked));
    };

    const handleDismissUpdate = () => {
        localStorage.setItem(NewVersionAvailableKey, 'false');
    };

    const handleLanguageChange: MenuProps['onClick'] = (e) => {
        i18n.changeLanguage(e.key).then(() => {
        });
        setLanguage(e.key);
    };

    const languageMenu: MenuProps = {
        items: [
            {label: '简体中文 (Simplified Chinese)', key: "zh-CN"},
            {label: 'English (American English)', key: "en-US"},
            {label: '日本語 (Japanese)', key: "ja-JP"},
            {label: '韓國語 (Korean)', key: "ko-KR"},
        ],
        onClick: handleLanguageChange,
    };

    return (
        <Layout style={{height: "100vh", background: "#f5f5f5"}}>
            <NavBar
                onSelectFile={() => handleSelectFile(AllSupportedFileTypes, t('Infos.com3d2_mod_files'))}
                onSaveFile={() => handleSaveFile(undefined)}
                onSaveAsFile={() => handleSaveFile(undefined)}
            />
            <Content style={{padding: 24, height: "100%"}}>
                <Row gutter={[16, 16]}>
                    <Col span={24} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Typography.Title level={4}
                                          style={{margin: 0}}>{t('EditorNavBar.SettingsPage')}</Typography.Title>
                    </Col>

                    {/* 通用设置区域 */}
                    <Col xs={24} lg={12}>
                        <Card
                            title={<Typography.Title level={5}>{t('SettingsPage.general_settings')}</Typography.Title>}
                            style={{borderRadius: 8}}
                        >
                            <List
                                split={false}
                                dataSource={[
                                    {
                                        title: t('SettingsPage.file_type_strict_mode'),
                                        tooltip: t('SettingsPage.file_type_strict_mode_tip'),
                                        checked: strictMode,
                                        onChange: updateStrictMode,
                                        type: 'switch'
                                    },
                                    {
                                        title: t('Common.choose_language'),
                                        type: 'language',
                                        value: language
                                    }
                                ]}
                                renderItem={(item) => (
                                    <List.Item
                                        style={{padding: '16px 0'}}
                                        actions={[
                                            item.type === 'switch' ? (
                                                <Switch
                                                    key="switch"
                                                    checked={item.checked}
                                                    onChange={item.onChange}
                                                />
                                            ) : item.type === 'language' ? (
                                                <Dropdown menu={languageMenu} placement="bottomRight">
                                                    <Button>
                                                        {(() => {
                                                            switch (item.value) {
                                                                case 'zh-CN':
                                                                    return '简体中文';
                                                                case 'en-US':
                                                                    return 'English';
                                                                case 'ja-JP':
                                                                    return '日本語';
                                                                case 'ko-KR':
                                                                    return '韓國語';
                                                                default:
                                                                    return '简体中文';
                                                            }
                                                        })()} <TranslationOutlined/>
                                                        <DownOutlined style={{marginLeft: 8}}/>
                                                    </Button>
                                                </Dropdown>
                                            ) : (
                                                <Button
                                                    key="button"
                                                    style={{borderRadius: 4}}
                                                >
                                                    {item.title}
                                                </Button>
                                            )
                                        ]}
                                    >
                                        <Space>
                                            <span>{item.title}</span>
                                            {item.tooltip ? (
                                                <Tooltip title={item.tooltip}>
                                                    <QuestionCircleOutlined style={{color: '#aaa'}}/>
                                                </Tooltip>
                                            ) : null}
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>

                    {/* 更新设置区域 */}
                    <Col xs={24} lg={12}>
                        <Card
                            title={<Typography.Title level={5}>{t('SettingsPage.update_settings')}</Typography.Title>}
                            style={{borderRadius: 8}}
                        >
                            <List
                                split={false}
                                dataSource={[
                                    {
                                        title: t('SettingsPage.is_check_update'),
                                        tooltip: t('SettingsPage.is_check_update_tip'),
                                        checked: checkUpdates,
                                        onChange: handleUpdateCheck,
                                        type: 'switch'
                                    },
                                    {
                                        title: t('SettingsPage.dismiss_update_note'),
                                        tooltip: t('SettingsPage.dismiss_update_note_tip'),
                                        type: 'button',
                                        icon: <CloseCircleOutlined/>,
                                        onClick: handleDismissUpdate
                                    },
                                    {
                                        title: t('SettingsPage.check_update_now'),
                                        tooltip: '',
                                        type: 'button',
                                        icon: <SyncOutlined/>,
                                        onClick: () => checkForUpdatesWithMessage()
                                    },
                                ]}
                                renderItem={(item) => (
                                    <List.Item
                                        style={{padding: '16px 0'}}
                                        actions={[
                                            item.type === 'switch' ? (
                                                <Switch
                                                    key="switch"
                                                    checked={item.checked}
                                                    onChange={item.onChange}
                                                />
                                            ) : (
                                                <Button
                                                    key="button"
                                                    icon={item.icon}
                                                    onClick={item.onClick}
                                                    style={{borderRadius: 4}}
                                                >
                                                    {item.title}
                                                </Button>
                                            )
                                        ]}
                                    >
                                        <Space>
                                            <span>{item.title}</span>
                                            {item.tooltip ? (
                                                <Tooltip title={item.tooltip}>
                                                    <QuestionCircleOutlined style={{color: '#aaa'}}/>
                                                </Tooltip>
                                            ) : null}
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
};

export default SettingsPage;