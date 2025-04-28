import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {Button, Checkbox, Collapse, Input, message, Modal, Space, Tooltip} from "antd";
import {QuestionCircleOutlined} from "@ant-design/icons";
import {SelectPathToSave} from "../../wailsjs/go/main/App";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {useTranslation} from "react-i18next";
import {ConvertJsonToPMat, ConvertPMatToJson, ReadPMatFile, WritePMatFile} from "../../wailsjs/go/COM3D2/PMatService";
import {COM3D2HeaderConstants} from "../utils/ConstCOM3D2";
import PMat = COM3D2.PMat;
import FileInfo = COM3D2.FileInfo;


export interface PMatEditorProps {
    fileInfo?: FileInfo;
}

export interface PMatEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

const PMatEditor = forwardRef<PMatEditorRef, PMatEditorProps>((props, ref) => {
    const {t} = useTranslation();

    const [fileInfo, setFileInfo] = useState<FileInfo | null>(props.fileInfo || null);
    const [filePath, setFilePath] = useState<string | null>(props.fileInfo?.Path || null);

    // 用于存储当前编辑的 PMat 数据
    const [pmatData, setPMatData] = useState<PMat | null>(null);

    // 只读区（通常不建议修改）的字段
    const [signature, setSignature] = useState(String(COM3D2HeaderConstants.PMatSignature));
    const [version, setVersion] = useState(Number(COM3D2HeaderConstants.PMatVersion));
    const [hash, setHash] = useState(0);

    // 可编辑区
    const [materialName, setMaterialName] = useState("");
    const [renderQueue, setRenderQueue] = useState(2000);
    const [shader, setShader] = useState("");

    // 只读区是否允许编辑
    const [isInputDisabled, setIsInputDisabled] = useState(true);

    // 大文件警告模态框
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingFileContent, setPendingFileContent] = useState<{ size: number }>({size: 0});

    useEffect(() => {
        if (props.fileInfo) {
            setFileInfo(props.fileInfo);
            setFilePath(props.fileInfo.Path);
        }
    }, [props.fileInfo]);

    // 当 filePath 变化时自动读取
    useEffect(() => {
        let isMounted = true;

        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

            (async () => {
                try {
                    if (!isMounted) return;
                    await handleReadPMatFile();
                } catch {
                }
            })();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            // 如果没有文件，则初始化为新文件
            const pmat = new (PMat);
            pmat.Signature = COM3D2HeaderConstants.PMatSignature;
            pmat.Version = COM3D2HeaderConstants.PMatVersion;
            pmat.RenderQueue = 2000;
            setPMatData(pmat);
        }

        return () => {
            isMounted = false;
        };
    }, [filePath]);


    /**
     * 读取 .pmat 文件
     */
    const handleReadPMatFile = async () => {
        if (!filePath || !fileInfo) {
            message.error(t("Errors.pls_open_file_first_new_file_use_save_as"));
            return;
        }
        try {
            const size = fileInfo?.Size;
            if (size > 1024 * 1024 * 20) {
                setPendingFileContent({size});
                setIsConfirmModalOpen(true);
                return;
            }
            await handleConfirmRead(false);
        } catch (err: any) {
            console.error(err);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.pmate'}) + err);
        }
    };

    // 确认读取文件
    const handleConfirmRead = async (DirectlyConvert: boolean) => {
        setIsConfirmModalOpen(false);
        if (!filePath || !fileInfo) {
            message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
            return;
        }
        if (DirectlyConvert) {
            const hide = message.loading(t('Infos.converting_please_wait'), 0);
            try {
                if (fileInfo.StorageFormat == "json") {
                    const path = filePath.replace(/\.pmat\.json$/, '.pmat');
                    await ConvertJsonToPMat(filePath, path);
                    message.success(t('Infos.directly_convert_success') + path, 5);
                } else {
                    const path = filePath.replace(/\.pmat$/, '.pmat.json');
                    await ConvertPMatToJson(filePath, path);
                    message.success(t('Infos.directly_convert_success') + path, 5);
                }
            } catch (error: any) {
                console.error(error);
                message.error(t('Errors.directly_convert_failed_colon') + error);
            } finally {
                setFilePath(null)
                hide();
            }
            return;
        }
        const hide = message.loading(t('Infos.loading_please_wait'));
        try {
            const result = await ReadPMatFile(filePath);
            setPMatData(result);

            setSignature(result.Signature);
            setVersion(result.Version);
            setHash(result.Hash);
            setMaterialName(result.MaterialName);
            setRenderQueue(result.RenderQueue);
            setShader(result.Shader);
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.pmate'}) + error);
        } finally {
            hide();
        }
    };

    /**
     * 保存当前编辑内容到文件
     */
    const handleSavePMatFile = async () => {
        if (!filePath) {
            message.error(t("Errors.pls_open_file_first_new_file_use_save_as"));
            return;
        }
        if (!pmatData) {
            message.error(t("Errors.pls_load_file_first"));
            return;
        }

        try {
            // 根据当前输入框的值更新 PMat 对象
            const newPMatData: PMat = {
                Signature: signature,
                Version: version,
                Hash: hash,
                MaterialName: materialName,
                RenderQueue: renderQueue,
                Shader: shader,
            };
            await WritePMatFile(filePath, newPMatData);
            message.success(t("Infos.success_save_file"));
        } catch (err: any) {
            console.error(err);
            message.error(t("Errors.save_file_failed_colon") + err.message);
        }
    };

    /**
     * 另存为 .pmat 文件
     */
    const handleSaveAsPMatFile = async () => {
        if (!pmatData) {
            message.error(t("Errors.pls_load_file_first"));
            return;
        }
        try {
            const newPMatData: PMat = {
                Signature: signature,
                Version: version,
                Hash: hash,
                MaterialName: materialName,
                RenderQueue: renderQueue,
                Shader: shader,
            };

            // 让用户选择要保存的位置
            const path = await SelectPathToSave("*.pmat;*.pmat.json", t("Infos.com3d2_pmat_file"));
            if (!path) {
                // 用户取消了保存
                return;
            }

            await WritePMatFile(path, newPMatData);
            message.success(t("Infos.success_save_as_file_colon") + path);
        } catch (err: any) {
            console.error(err);
            message.error(t("Errors.save_as_file_failed_colon") + err.message);
        }
    };

    /**
     * 将文件操作方法暴露给父组件
     */
    useImperativeHandle(ref, () => ({
        handleReadFile: handleReadPMatFile,
        handleSaveFile: handleSavePMatFile,
        handleSaveAsFile: handleSaveAsPMatFile,
    }));

    // 控制只读字段是否可编辑
    const onEnableReadonlyFieldsChange = (e: any) => {
        setIsInputDisabled(!e.target.checked);
    };

    return (
        <div style={{padding: 10}}>
            <Modal
                title={t('Infos.large_file_waring')}
                open={isConfirmModalOpen}
                onCancel={() => setIsConfirmModalOpen(false)}
                footer={[
                    <Button key="convert" type="primary" onClick={() => handleConfirmRead(true)}>
                        {t('Common.convert_directly')}
                    </Button>,
                    <Button key="cancel" onClick={() => {
                        setIsConfirmModalOpen(false);
                        setFilePath(null);
                    }}>
                        {t('Common.cancel')}
                    </Button>,
                    <Button key="confirm" onClick={() => handleConfirmRead(false)}>
                        {t('Common.continue')}
                    </Button>
                ]}
            >
                <p>{t('Infos.file_too_large_tip', {size: (pendingFileContent?.size / 1024 / 1024).toFixed(2)})}</p>
                <p>{t('Infos.file_too_large_convert_to_json_directly')}</p>
            </Modal>
            {pmatData && (
                <div style={{height: "100%"}}>
                    <Collapse
                        size="small"
                        items={[
                            {
                                key: "1",
                                label: t("PMatEditor.file_header.file_head"),
                                children: (
                                    <Space direction="vertical" style={{width: "100%"}}>
                                        <Space style={{width: "100%"}}>
                                            <Input
                                                addonBefore={t("PMatEditor.file_header.Signature")}
                                                value={signature}
                                                disabled={isInputDisabled}
                                                onChange={(e) => setSignature(e.target.value)}
                                                style={{width: 220}}
                                            />
                                            <Input
                                                addonBefore={t("PMatEditor.file_header.Version")}
                                                value={version}
                                                disabled={isInputDisabled}
                                                type="number"
                                                onChange={(e) => setVersion(parseInt(e.target.value, 10))}
                                                style={{width: 220}}
                                            />
                                            <Input
                                                addonBefore={t("PMatEditor.file_header.Hash")}
                                                value={hash}
                                                disabled={isInputDisabled}
                                                type="number"
                                                onChange={(e) => setHash(parseInt(e.target.value, 10))}
                                                style={{width: 220}}
                                                suffix={
                                                    <Tooltip title={t("PMatEditor.file_header.Hash_tip")}>
                                                        <QuestionCircleOutlined/>
                                                    </Tooltip>
                                                }
                                            />

                                            <Checkbox
                                                checked={!isInputDisabled}
                                                onChange={onEnableReadonlyFieldsChange}
                                            >
                                                {t("PMatEditor.file_header.enable_edit_do_not_edit")}
                                            </Checkbox>
                                        </Space>
                                    </Space>
                                ),
                            },
                        ]}
                    />

                    <br/>

                    <Collapse size="small" defaultActiveKey='editor'>
                        <Collapse.Panel key='editor' header={t('PMatEditor.file_body')}>
                            {/* 其他可编辑字段 */}
                            <div style={{marginTop: 10}}>
                                <Space direction="vertical" style={{width: "100%"}}>
                                    <Input
                                        addonBefore={
                                            <span
                                                style={{
                                                    width: "15vw",
                                                    display: "inline-block",
                                                    textAlign: "left",
                                                }}
                                            >
                                        {t("PMatEditor.materialName")}
                                    </span>
                                        }
                                        value={materialName}
                                        onChange={(e) => setMaterialName(e.target.value)}
                                        suffix={
                                            <Tooltip title={t("PMatEditor.materialName_tip")}>
                                                <QuestionCircleOutlined/>
                                            </Tooltip>
                                        }
                                    />
                                    <Input
                                        addonBefore={
                                            <span
                                                style={{
                                                    width: "15vw",
                                                    display: "inline-block",
                                                    textAlign: "left",
                                                }}
                                            >
                                        {t("PMatEditor.renderQueue")}
                                    </span>
                                        }
                                        type="number"
                                        min={0}
                                        value={renderQueue}
                                        onChange={(e) => setRenderQueue(parseFloat(e.target.value))}
                                        suffix={
                                            <Tooltip title={t("PMatEditor.renderQueue_tip")}>
                                                <QuestionCircleOutlined/>
                                            </Tooltip>
                                        }
                                    />
                                    <Input
                                        addonBefore={
                                            <span
                                                style={{
                                                    width: "15vw",
                                                    display: "inline-block",
                                                    textAlign: "left",
                                                }}
                                            >
                                        {t("PMatEditor.shaderName")}
                                    </span>
                                        }
                                        value={shader}
                                        onChange={(e) => setShader(e.target.value)}
                                        suffix={
                                            <Tooltip title={t("PMatEditor.shaderName_tip")}>
                                                <QuestionCircleOutlined/>
                                            </Tooltip>
                                        }
                                    />
                                </Space>
                            </div>
                        </Collapse.Panel>
                    </Collapse>
                </div>
            )}
        </div>
    );
});

export default PMatEditor;
