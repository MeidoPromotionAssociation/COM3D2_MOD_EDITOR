import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {Button, Checkbox, Collapse, ConfigProvider, Form, Input, message, Modal, Radio, Space, Tooltip} from "antd";
import {QuestionCircleOutlined} from "@ant-design/icons";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {ConvertJsonToPhy, ConvertPhyToJson, ReadPhyFile, WritePhyFile} from "../../wailsjs/go/COM3D2/PhyService";
import {SelectPathToSave} from "../../wailsjs/go/main/App";
import {COM3D2HeaderConstants} from "../utils/ConstCOM3D2";
import {useTranslation} from "react-i18next";
import {ReadColFile} from "../../wailsjs/go/COM3D2/ColService";
import Style2PhyProperties from "./phy/Style2PhyProperties";
import Style1PhyProperties from "./phy/Style1PhyProperties";
import {PhyEditorViewModeKey} from "../utils/LocalStorageKeys";
import {AppTitle, AppTitleNoAuthor} from "../utils/consts";
import Phy = COM3D2.Phy;
import BoneValue = COM3D2.BoneValue;
import AnimationCurve = COM3D2.AnimationCurve;
import Keyframe = COM3D2.Keyframe;
import FileInfo = COM3D2.FileInfo;

export interface PhyEditorProps {
    fileInfo?: FileInfo;
}

export interface PhyEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

// PartialMode 常量
export const PartialMode_StaticOrCurve = 0;
export const PartialMode_Partial = 1;
export const PartialMode_FromBoneName = 2;

// FreezeAxis 常量
export const FreezeAxis_None = 0;
export const FreezeAxis_X = 1;
export const FreezeAxis_Y = 2;
export const FreezeAxis_Z = 3;


/**
 * 将后端的 Phy 对象转换为 antd Form 可以直接使用的表单数据
 */
function transformPhyToForm(phy: Phy): any {
    return {
        signature: phy.Signature,
        version: phy.Version,
        rootName: phy.RootName,

        // Damping
        enablePartialDamping: phy.EnablePartialDamping ?? PartialMode_StaticOrCurve,
        partialDamping: (phy.PartialDamping || []).map(bv => ({
            boneName: bv.BoneName,
            value: bv.Value
        })),
        damping: phy.Damping ?? 0.5,
        dampingDistribKeyframes: phy.DampingDistrib?.Keyframes?.map(kf => ({
            time: kf.Time,
            value: kf.Value,
            inTangent: kf.InTangent,
            outTangent: kf.OutTangent
        })) || [],

        // Elasticity
        enablePartialElasticity: phy.EnablePartialElasticity ?? PartialMode_StaticOrCurve,
        partialElasticity: (phy.PartialElasticity || []).map(bv => ({
            boneName: bv.BoneName,
            value: bv.Value
        })),
        elasticity: phy.Elasticity ?? 0.1,
        elasticityDistribKeyframes: phy.ElasticityDistrib?.Keyframes?.map(kf => ({
            time: kf.Time,
            value: kf.Value,
            inTangent: kf.InTangent,
            outTangent: kf.OutTangent
        })) || [],

        // Stiffness
        enablePartialStiffness: phy.EnablePartialStiffness ?? PartialMode_StaticOrCurve,
        partialStiffness: (phy.PartialStiffness || []).map(bv => ({
            boneName: bv.BoneName,
            value: bv.Value
        })),
        stiffness: phy.Stiffness ?? 0.1,
        stiffnessDistribKeyframes: phy.StiffnessDistrib?.Keyframes?.map(kf => ({
            time: kf.Time,
            value: kf.Value,
            inTangent: kf.InTangent,
            outTangent: kf.OutTangent
        })) || [],

        // Inert
        enablePartialInert: phy.EnablePartialInert ?? PartialMode_StaticOrCurve,
        partialInert: (phy.PartialInert || []).map(bv => ({
            boneName: bv.BoneName,
            value: bv.Value
        })),
        inert: phy.Inert ?? 0,
        inertDistribKeyframes: phy.InertDistrib?.Keyframes?.map(kf => ({
            time: kf.Time,
            value: kf.Value,
            inTangent: kf.InTangent,
            outTangent: kf.OutTangent
        })) || [],

        // Radius
        enablePartialRadius: phy.EnablePartialRadius ?? PartialMode_StaticOrCurve,
        partialRadius: (phy.PartialRadius || []).map(bv => ({
            boneName: bv.BoneName,
            value: bv.Value
        })),
        radius: phy.Radius ?? 0,
        radiusDistribKeyframes: phy.RadiusDistrib?.Keyframes?.map(kf => ({
            time: kf.Time,
            value: kf.Value,
            inTangent: kf.InTangent,
            outTangent: kf.OutTangent
        })) || [],

        // 其他 float
        endLength: phy.EndLength ?? 0,
        endOffsetX: phy.EndOffset?.[0] ?? 0,
        endOffsetY: phy.EndOffset?.[1] ?? 0,
        endOffsetZ: phy.EndOffset?.[2] ?? 0,

        gravityX: phy.Gravity?.[0] ?? 0,
        gravityY: phy.Gravity?.[1] ?? 0,
        gravityZ: phy.Gravity?.[2] ?? 0,

        forceX: phy.Force?.[0] ?? 0,
        forceY: phy.Force?.[1] ?? -0.01,
        forceZ: phy.Force?.[2] ?? 0,

        colliderFileName: phy.ColliderFileName ?? "",
        collidersCount: phy.CollidersCount ?? 0,
        exclusionsCount: phy.ExclusionsCount ?? 0,
        freezeAxis: phy.FreezeAxis ?? 0
    };
}

/**
 * 将表单数据合并回 Phy 对象
 * - oldPhy 用于保持一些不在表单中编辑的字段
 */
function transformFormToPhy(values: any, oldPhy: Phy): Phy {
    const newPhy = COM3D2.Phy.createFrom(oldPhy); // 拷贝一下旧对象，以保留不在表单里编辑的可能字段

    newPhy.Signature = values.signature;
    newPhy.Version = parseInt(values.version, 10) || 0;
    newPhy.RootName = values.rootName || "";

    // Damping
    newPhy.EnablePartialDamping = values.enablePartialDamping;
    newPhy.PartialDamping = [];
    if (values.enablePartialDamping === PartialMode_Partial && Array.isArray(values.partialDamping)) {
        newPhy.PartialDamping = values.partialDamping.map((item: any) => {
            return BoneValue.createFrom({
                BoneName: item.boneName || "",
                Value: parseFloat(item.value) || 0
            });
        });
    }
    newPhy.Damping = parseFloat(values.damping) || 0;
    newPhy.DampingDistrib = AnimationCurve.createFrom({
        Keyframes: (values.dampingDistribKeyframes || []).map((kf: any) =>
            Keyframe.createFrom({
                Time: parseFloat(kf.time) || 0,
                Value: parseFloat(kf.value) || 0,
                InTangent: parseFloat(kf.inTangent) || 0,
                OutTangent: parseFloat(kf.outTangent) || 0
            })
        )
    });

    // Elasticity
    newPhy.EnablePartialElasticity = values.enablePartialElasticity;
    newPhy.PartialElasticity = [];
    if (values.enablePartialElasticity === PartialMode_Partial && Array.isArray(values.partialElasticity)) {
        newPhy.PartialElasticity = values.partialElasticity.map((item: any) => {
            return BoneValue.createFrom({
                BoneName: item.boneName || "",
                Value: parseFloat(item.value) || 0
            });
        });
    }
    newPhy.Elasticity = parseFloat(values.elasticity) || 0;
    newPhy.ElasticityDistrib = AnimationCurve.createFrom({
        Keyframes: (values.elasticityDistribKeyframes || []).map((kf: any) =>
            Keyframe.createFrom({
                Time: parseFloat(kf.time) || 0,
                Value: parseFloat(kf.value) || 0,
                InTangent: parseFloat(kf.inTangent) || 0,
                OutTangent: parseFloat(kf.outTangent) || 0
            })
        )
    });

    // Stiffness
    newPhy.EnablePartialStiffness = values.enablePartialStiffness;
    newPhy.PartialStiffness = [];
    if (values.enablePartialStiffness === PartialMode_Partial && Array.isArray(values.partialStiffness)) {
        newPhy.PartialStiffness = values.partialStiffness.map((item: any) => {
            return BoneValue.createFrom({
                BoneName: item.boneName || "",
                Value: parseFloat(item.value) || 0
            });
        });
    }
    newPhy.Stiffness = parseFloat(values.stiffness) || 0;
    newPhy.StiffnessDistrib = AnimationCurve.createFrom({
        Keyframes: (values.stiffnessDistribKeyframes || []).map((kf: any) =>
            Keyframe.createFrom({
                Time: parseFloat(kf.time) || 0,
                Value: parseFloat(kf.value) || 0,
                InTangent: parseFloat(kf.inTangent) || 0,
                OutTangent: parseFloat(kf.outTangent) || 0
            })
        )
    });

    // Inert
    newPhy.EnablePartialInert = values.enablePartialInert;
    newPhy.PartialInert = [];
    if (values.enablePartialInert === PartialMode_Partial && Array.isArray(values.partialInert)) {
        newPhy.PartialInert = values.partialInert.map((item: any) => {
            return BoneValue.createFrom({
                BoneName: item.boneName || "",
                Value: parseFloat(item.value) || 0
            });
        });
    }
    newPhy.Inert = parseFloat(values.inert) || 0;
    newPhy.InertDistrib = AnimationCurve.createFrom({
        Keyframes: (values.inertDistribKeyframes || []).map((kf: any) =>
            Keyframe.createFrom({
                Time: parseFloat(kf.time) || 0,
                Value: parseFloat(kf.value) || 0,
                InTangent: parseFloat(kf.inTangent) || 0,
                OutTangent: parseFloat(kf.outTangent) || 0
            })
        )
    });

    // Radius
    newPhy.EnablePartialRadius = values.enablePartialRadius;
    newPhy.PartialRadius = [];
    if (values.enablePartialRadius === PartialMode_Partial && Array.isArray(values.partialRadius)) {
        newPhy.PartialRadius = values.partialRadius.map((item: any) => {
            return BoneValue.createFrom({
                BoneName: item.boneName || "",
                Value: parseFloat(item.value) || 0
            });
        });
    }
    newPhy.Radius = parseFloat(values.radius) || 0;
    newPhy.RadiusDistrib = AnimationCurve.createFrom({
        Keyframes: (values.radiusDistribKeyframes || []).map((kf: any) =>
            Keyframe.createFrom({
                Time: parseFloat(kf.time) || 0,
                Value: parseFloat(kf.value) || 0,
                InTangent: parseFloat(kf.inTangent) || 0,
                OutTangent: parseFloat(kf.outTangent) || 0
            })
        )
    });

    // 其他 float
    newPhy.EndLength = parseFloat(values.endLength) ?? 0;
    newPhy.EndOffset = [
        parseFloat(values.endOffsetX) ?? 0,
        parseFloat(values.endOffsetY) ?? 0,
        parseFloat(values.endOffsetZ) ?? 0
    ];
    newPhy.Gravity = [
        parseFloat(values.gravityX) ?? 0,
        parseFloat(values.gravityY) ?? 0,
        parseFloat(values.gravityZ) ?? 0
    ];
    newPhy.Force = [
        parseFloat(values.forceX) ?? 0,
        parseFloat(values.forceY) ?? 0,
        parseFloat(values.forceZ) ?? 0
    ];

    newPhy.ColliderFileName = values.colliderFileName ?? "";
    newPhy.CollidersCount = parseInt(values.collidersCount, 10) ?? 0;
    newPhy.ExclusionsCount = parseInt(values.exclusionsCount, 10) ?? 0;
    newPhy.FreezeAxis = parseInt(values.freezeAxis, 10) ?? 0;

    return newPhy;
}

/**
 * 使用一个 antd Form 来编辑 COM3D2.Phy 的所有字段
 */
const PhyEditor = forwardRef<PhyEditorRef, PhyEditorProps>((props, ref) => {
    const {t} = useTranslation();

    const [fileInfo, setFileInfo] = useState<FileInfo | null>(props.fileInfo || null);
    const [filePath, setFilePath] = useState<string | null>(props.fileInfo?.Path || null);

    // 从后端读取到的 phy 数据
    const [phyData, setPhyData] = useState<Phy | null>(null);

    // 是否允许编辑 Signature/Version 等头部信息
    const [isHeaderEditable, setIsHeaderEditable] = useState(false);

    // antd 的表单
    const [form] = Form.useForm();

    // 监听表单值
    const enablePartialDamping = Form.useWatch('enablePartialDamping', form);
    const enablePartialElasticity = Form.useWatch('enablePartialElasticity', form);
    const enablePartialStiffness = Form.useWatch('enablePartialStiffness', form);
    const enablePartialInert = Form.useWatch('enablePartialInert', form);
    const enablePartialRadius = Form.useWatch('enablePartialRadius', form);
    const colliderFileName = Form.useWatch('colliderFileName', form);

    //  viewMode，1=表单模式，2=JSON模式
    const [viewMode, setViewMode] = useState<1 | 2>(() => {
        const saved = localStorage.getItem(PhyEditorViewModeKey);
        return saved ? (Number(saved) as 1 | 2) : 1;
    });

    // 大文件警告模态框
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingFileContent, setPendingFileContent] = useState<{ size: number }>({size: 0});

    useEffect(() => {
        if (props.fileInfo) {
            setFileInfo(props.fileInfo);
            setFilePath(props.fileInfo.Path);
        }
    }, [props.fileInfo]);

    // 当 phyData / viewMode 变化时，如果处于表单模式，就把 phyData => form
    useEffect(() => {
        if (phyData && viewMode === 1) {
            form.setFieldsValue(transformPhyToForm(phyData));
        }
    }, [phyData, viewMode, form]);

    // 当 filePath 变化或初始化时读取
    useEffect(() => {
        let isMounted = true;

        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle(AppTitleNoAuthor + ` —— ${t("Infos.editing_colon")}${fileName}  (${filePath})`);

            (async () => {
                try {
                    if (!isMounted) return;
                    await handleReadPhyFile();
                } catch {
                }
            })();
        } else {
            WindowSetTitle(AppTitle);
            if (!isMounted) return;
            // 如果没有 filePath，就新建一个空的
            const newPhy = COM3D2.Phy.createFrom({});
            newPhy.Signature = COM3D2HeaderConstants.PhySignature;
            newPhy.Version = COM3D2HeaderConstants.PhyVersion;
            setPhyData(newPhy);
            form.resetFields();
        }

        return () => {
            isMounted = false;
        };
    }, [filePath]);


    /**
     * 读取 phy 文件
     */
    const handleReadPhyFile = async () => {
        if (!filePath || !fileInfo) {
            message.error(t('Infos.pls_open_file_first'));
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
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.phy'}) + error);
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
                    const path = filePath.replace(/\.phy\.json$/, '.phy');
                    await ConvertJsonToPhy(filePath, path);
                    message.success(t('Infos.directly_convert_success') + path, 5);
                } else {
                    const path = filePath.replace(/\.phy$/, '.phy.json');
                    await ConvertPhyToJson(filePath, path);
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
            const data = await ReadPhyFile(filePath);
            setPhyData(data);

            // 同步到表单
            form.setFieldsValue(transformPhyToForm(data));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.phy'}) + error);
        } finally {
            hide();
        }
    };

    /**
     * 保存（覆盖原文件）
     */
    const handleSavePhyFile = async () => {
        if (!filePath) {
            message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
            return;
        }
        if (!phyData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }
        try {
            // 从表单获取最新值，组装新的 phy
            const values = form.getFieldsValue(true);
            const newPhy = transformFormToPhy(values, phyData);

            await WritePhyFile(filePath, newPhy);
            message.success(t('Infos.success_save_file'));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.save_file_failed_colon') + error);
        }
    };

    /**
     * 另存为
     */
    const handleSaveAsPhyFile = async () => {
        if (!phyData) {
            message.error(t('Errors.save_as_file_failed_colon') + t('Errors.pls_load_file_first'));
            return;
        }
        try {
            // 询问保存路径
            const newPath = await SelectPathToSave("*.phy;*.phy.json", t('Infos.com3d2_phy_file'));
            if (!newPath) {
                return; // 用户取消
            }
            // 组装新的 phy
            const values = form.getFieldsValue(true);
            const newPhy = transformFormToPhy(values, phyData);

            await WritePhyFile(newPath, newPhy);
            message.success(t('Infos.success_save_as_file_colon') + newPath);
        } catch (error: any) {
            message.error(t('Errors.save_as_file_failed_colon') + error.message);
            console.error(error);
        }
    };


    // 向外暴露的方法
    useImperativeHandle(ref, () => ({
        handleReadFile: handleReadPhyFile,
        handleSaveFile: handleSavePhyFile,
        handleSaveAsFile: handleSaveAsPhyFile
    }));

    // 自动计算 col 文件中的碰撞器数量
    const handleAutoCalculateColliders = async () => {
        if (!filePath) {
            message.error(t('Infos.pls_open_file_first'));
            return;
        }

        if (!colliderFileName) {
            message.error(t('Errors.autoCalcColliderError.pls_fill_file_name_first'));
            return;
        }

        try {
            // 获取 phy 文件所在目录
            const dirPath = filePath.split(/[\\/]/).slice(0, -1).join('/');
            const colFilePath = `${dirPath}/${colliderFileName}.col`;

            // 调用后端读取 col 文件
            const col = await ReadColFile(colFilePath);
            form.setFieldsValue({collidersCount: col.Colliders.length});

            message.success(t('Infos.auto_count_success'));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.autoCalcColliderError.read_file_filed') + "  " + error);
        }
    };


    return (
        <div style={{
            padding: 10,
        }}>
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
            <ConfigProvider
                theme={{
                    components: {
                        Form: {
                            itemMarginBottom: 10
                        }
                    }
                }}
            >
                <Form
                    form={form}
                    layout="horizontal"
                    labelAlign="left"
                    size="small"
                    labelCol={{style: {width: '15vw'}}}
                >
                    <Collapse>
                        {/* 基础信息 */}
                        <Collapse.Panel key="base" header={t('PhyEditor.file_header.file_head')}>
                            <Space>
                                <Form.Item name="signature"
                                           initialValue={COM3D2HeaderConstants.PhySignature.toString()}>
                                    <Input
                                        disabled={!isHeaderEditable}
                                        addonBefore={t('PhyEditor.file_header.Signature')}
                                    />
                                </Form.Item>
                                <Form.Item name="version" initialValue={COM3D2HeaderConstants.PhyVersion.toString()}>
                                    <Input
                                        disabled={!isHeaderEditable}
                                        addonBefore={t('PhyEditor.file_header.Version')}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Checkbox
                                        checked={isHeaderEditable}
                                        disabled={viewMode === 2}
                                        onChange={(e) => setIsHeaderEditable(e.target.checked)}
                                    >
                                        {t('PhyEditor.file_header.enable_edit_do_not_edit')}
                                    </Checkbox>
                                </Form.Item>
                            </Space>
                            <Form.Item name="rootName">
                                <Input
                                    disabled={viewMode === 2}
                                    addonBefore={t('PhyEditor.file_header.RootName')}
                                    suffix={
                                        <Tooltip title={t('PhyEditor.file_header.RootName_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                        </Collapse.Panel>
                    </Collapse>

                    <div style={{marginBottom: 8, marginTop: 8}}>
                        <Radio.Group
                            block
                            value={viewMode}
                            onChange={(e) => {
                                // 在切换显示模式之前获取当前表单值并更新 phyData
                                const currentFormValues = form.getFieldsValue(true);
                                if ((viewMode != 2) && phyData) { // 非模式 2 时从表单拿数据，因为模式 2 是 JSON
                                    const updatedPhy = transformFormToPhy(currentFormValues, phyData);
                                    setPhyData(updatedPhy);
                                }
                                setViewMode(e.target.value);
                                localStorage.setItem(PhyEditorViewModeKey, e.target.value.toString());
                            }}
                            options={[
                                {label: t('PhyEditor.style1'), value: 1},
                                {label: t('PhyEditor.style2'), value: 2},
                            ]}
                            optionType="button"
                            buttonStyle="solid"
                        />
                    </div>

                    {viewMode === 1 && (
                        <Style1PhyProperties
                            form={form}
                            t={t}
                            phyData={phyData}
                            handleAutoCalculateColliders={handleAutoCalculateColliders}
                            enablePartialDamping={enablePartialDamping}
                            enablePartialElasticity={enablePartialElasticity}
                            enablePartialStiffness={enablePartialStiffness}
                            enablePartialInert={enablePartialInert}
                            enablePartialRadius={enablePartialRadius}
                        />
                    )}

                    {viewMode === 2 && (
                        <Style2PhyProperties phyData={phyData} setPhyData={setPhyData}/>
                    )}

                </Form>
            </ConfigProvider>
        </div>
    );
});

export default PhyEditor;