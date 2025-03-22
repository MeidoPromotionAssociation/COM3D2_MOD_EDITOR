import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {Checkbox, Collapse, Input, message, Space, Tooltip} from "antd";
import {QuestionCircleOutlined} from "@ant-design/icons";
import {SaveFile} from "../../wailsjs/go/main/App";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {useTranslation} from "react-i18next";
import {ReadPMatFile, WritePMatFile} from "../../wailsjs/go/COM3D2/PMatService";
import {COM3D2HeaderConstants} from "../utils/ConstCOM3D2";
import PMat = COM3D2.PMat;


export interface PMatEditorProps {
    filePath?: string;
}

export interface PMatEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

const PMatEditor = forwardRef<PMatEditorRef, PMatEditorProps>(({filePath}, ref) => {
    const {t} = useTranslation();

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

    // 当 filePath 变化时自动读取
    useEffect(() => {
        let isMounted = true;

        if (filePath) {
            const loadPMat = async () => {
                try {
                    if (filePath) {
                        const result = await ReadPMatFile(filePath);
                        setPMatData(result);

                        setSignature(result.Signature);
                        setVersion(result.Version);
                        setHash(result.Hash);
                        setMaterialName(result.MaterialName);
                        setRenderQueue(result.RenderQueue);
                        setShader(result.Shader);
                    }
                } catch (err: any) {
                    console.error(err);
                    message.error(t("Errors.read_pmate_file_failed_colon") + err.message);
                }
            }

            if (!isMounted) return;
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");
            loadPMat().then(() => {
            });
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            // 如果没有文件，则初始化为新文件
            const pmat = new (PMat);
            pmat.Signature = COM3D2HeaderConstants.PMatSignature;
            pmat.Version = COM3D2HeaderConstants.PMatVersion;
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
        if (!filePath) {
            message.error(t("Errors.pls_open_file_first_new_file_use_save_as"));
            return;
        }
        try {
            const result = await ReadPMatFile(filePath);
            setPMatData(result);

            setSignature(result.Signature);
            setVersion(result.Version);
            setHash(result.Hash);
            setMaterialName(result.MaterialName);
            setRenderQueue(result.RenderQueue);
            setShader(result.Shader);

        } catch (err: any) {
            console.error(err);
            message.error(t("Errors.read_pmate_file_failed_colon") + err.message);
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
            const path = await SaveFile("*.pmat", t("Infos.com3d2_pmat_file"));
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
     * 监听 Ctrl+S 快捷键，触发保存
     */
    const saveHandlerRef = useRef(handleSavePMatFile);

    // 如果改变，更新 saveHandlerRef
    useEffect(() => {
        saveHandlerRef.current = handleSavePMatFile;
    }, [filePath, pmatData]); // 包含所有可能影响保存行为的状态

    // 设置 keydown 事件监听器
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Windows/Linux: Ctrl+S, macOS: Cmd+S => e.metaKey
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveHandlerRef.current();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);


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
