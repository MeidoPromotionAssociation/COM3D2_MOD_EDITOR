import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {
    Button,
    Checkbox,
    Collapse,
    ConfigProvider,
    Flex,
    Form,
    Input,
    InputNumber,
    message,
    Radio,
    Select,
    Space,
    Table,
    Tooltip
} from "antd";
import {DeleteOutlined, QuestionCircleOutlined} from "@ant-design/icons";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {ReadPhyFile, WritePhyFile} from "../../wailsjs/go/COM3D2/PhyService";
import {SaveFile} from "../../wailsjs/go/main/App";
import {COM3D2HeaderConstants} from "../utils/ConstCOM3D2";
import {useTranslation} from "react-i18next";
import {Editor} from "@monaco-editor/react";
import {useDarkMode} from "../hooks/themeSwitch";
import {ReadColFile} from "../../wailsjs/go/COM3D2/ColService";
import KeyframeEditorWithTable from "./KeyframeEditorWithTable";
import Phy = COM3D2.Phy;
import BoneValue = COM3D2.BoneValue;
import AnimationCurve = COM3D2.AnimationCurve;
import Keyframe = COM3D2.Keyframe;

export interface PhyEditorProps {
    filePath?: string;
}

export interface PhyEditorRef {
    handleReadPhyFile: () => Promise<void>;
    handleSavePhyFile: () => Promise<void>;
    handleSaveAsPhyFile: () => Promise<void>;
}

// PartialMode 常量
const PartialMode_StaticOrCurve = 0;
const PartialMode_Partial = 1;
const PartialMode_FromBoneName = 2;

// FreezeAxis 常量
const FreezeAxis_None = 0;
const FreezeAxis_X = 1;
const FreezeAxis_Y = 2;
const FreezeAxis_Z = 3;


interface Style2PhyProps {
    phyData: Phy | null;
    setPhyData: (newData: Phy | null) => void;
}

const Style2PhyProperties: React.FC<Style2PhyProps> = ({phyData, setPhyData}) => {
    const isDarkMode = useDarkMode();
    const [jsonValue, setJsonValue] = useState("");
    const editorRef = useRef<any>(null);
    // 避免自身更新时触发的 useEffect 重复
    const isInternalUpdate = useRef(false);
    const prevPhyRef = useRef<string | null>(null);

    // 当 phyData 外部发生变化时，如果不是我们自己内部触发的，就同步到编辑器
    useEffect(() => {
        if (phyData) {
            const phyDataJson = JSON.stringify(phyData);
            // 如果不是内部更新 & 内容有变化，就更新编辑器
            if (!isInternalUpdate.current && phyDataJson !== prevPhyRef.current) {
                setJsonValue(JSON.stringify(phyData, null, 2));
                prevPhyRef.current = phyDataJson;
            }
        } else {
            setJsonValue("");
            prevPhyRef.current = null;
        }
    }, [phyData]);

    // 用户在编辑器里修改时
    const handleEditorChange = (value?: string) => {
        const newVal = value ?? "";
        if (newVal !== jsonValue) {
            setJsonValue(newVal);
        }

        try {
            const parsed = JSON.parse(newVal);
            // JSON 合法，且与当前 phyData 不相同时，更新到外部
            if (JSON.stringify(parsed) !== JSON.stringify(phyData)) {
                isInternalUpdate.current = true;
                setPhyData(parsed);
                prevPhyRef.current = JSON.stringify(parsed);
                // 一点小延时，避免 useEffect 再次判断时还在内部更新中
                setTimeout(() => {
                    isInternalUpdate.current = false;
                }, 0);
            }
        } catch (err) {
            // JSON 不合法时，不更新外部
        }
    };

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
    };

    return (
        <div style={{
            height: "calc(100vh - 165px)",
            borderRadius: '8px',   // 添加圆角
            overflow: 'hidden'     // 隐藏超出圆角范围的部分
        }}>
            <Editor
                language="json"
                theme={isDarkMode ? "vs-dark" : "vs"}
                value={jsonValue}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: {enabled: true},
                    tabSize: 2,
                }}
            />
        </div>
    );
};


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
        endOffsetX: phy.EndOffset?.[0] || 0,
        endOffsetY: phy.EndOffset?.[1] || 0,
        endOffsetZ: phy.EndOffset?.[2] || 0,

        gravityX: phy.Gravity?.[0] || 0,
        gravityY: phy.Gravity?.[1] || 0,
        gravityZ: phy.Gravity?.[2] || 0,

        forceX: phy.Force?.[0] || 0,
        forceY: phy.Force?.[1] || -0.01,
        forceZ: phy.Force?.[2] || 0,

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
    newPhy.EndLength = parseFloat(values.endLength) || 0;
    newPhy.EndOffset = [
        parseFloat(values.endOffsetX) || 0,
        parseFloat(values.endOffsetY) || 0,
        parseFloat(values.endOffsetZ) || 0
    ];
    newPhy.Gravity = [
        parseFloat(values.gravityX) || 0,
        parseFloat(values.gravityY) || 0,
        parseFloat(values.gravityZ) || 0
    ];
    newPhy.Force = [
        parseFloat(values.forceX) || 0,
        parseFloat(values.forceY) || 0,
        parseFloat(values.forceZ) || 0
    ];

    newPhy.ColliderFileName = values.colliderFileName || "";
    newPhy.CollidersCount = parseInt(values.collidersCount, 10) || 0;
    newPhy.ExclusionsCount = parseInt(values.exclusionsCount, 10) || 0;
    newPhy.FreezeAxis = parseInt(values.freezeAxis, 10) || 0;

    return newPhy;
}

/**
 * 使用一个 antd Form 来编辑 COM3D2.Phy 的所有字段
 */
const PhyEditor = forwardRef<PhyEditorRef, PhyEditorProps>((props, ref) => {
    const {filePath} = props;
    const {t} = useTranslation();

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
        const saved = localStorage.getItem("phyEditorViewMode");
        return saved ? (Number(saved) as 1 | 2) : 1;
    });

    // 当 phyData / viewMode 变化时，如果处于表单模式，就把 phyData => form
    useEffect(() => {
        if (phyData && viewMode === 1) {
            form.setFieldsValue(transformPhyToForm(phyData));
        }
    }, [phyData, viewMode, form]);


    // 当传入的 filePath 改变时，自动执行读取
    useEffect(() => {
        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

            handleReadPhyFile();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            // 如果没有 filePath，就新建一个空的
            const empty = COM3D2.Phy.createFrom({});
            empty.Signature = COM3D2HeaderConstants.PhySignature;
            empty.Version = COM3D2HeaderConstants.PhyVersion;
            setPhyData(empty);
            form.resetFields();
        }
    }, [filePath]);

    /**
     * 读取 phy 文件
     */
    const handleReadPhyFile = async () => {
        if (!filePath) {
            message.error(t('Infos.pls_open_file_first'));
            return;
        }
        try {
            const data = await ReadPhyFile(filePath);
            setPhyData(data);

            // 同步到表单
            form.setFieldsValue(transformPhyToForm(data));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_phy_file_failed_colon') + error);
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
            const newPath = await SaveFile("*.phy", t('Infos.com3d2_phy_file'));
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

    // 监听 ctrl+s
    useEffect(() => {
        const keydownHandler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSavePhyFile();
            }
        };
        window.addEventListener("keydown", keydownHandler);
        return () => window.removeEventListener("keydown", keydownHandler);
    }, [handleSavePhyFile]);

    // 向外暴露的方法
    useImperativeHandle(ref, () => ({
        handleReadPhyFile,
        handleSavePhyFile,
        handleSaveAsPhyFile
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


    // 渲染某个 partial 块: (enablePartialXxx, partialXxx, Xxx, XxxDistrib)
    const renderPartialSection = (
        label: string,
        partialMode: number,                // 当前模式
        enablePartialName: string,           // enablePartialDamping
        partialListName: string,            // partialDamping
        floatFieldName: string,             // damping
        keyframesFieldName: string          // dampingDistribKeyframes
    ) => {
        return (
            <>
                <div
                    style={{
                        textAlign: 'left',
                    }}
                >
                    <Flex gap="small">
                        <Form.Item label={t('PhyEditor.PartialMode')} name={enablePartialName}>
                            <Select
                                dropdownStyle={{textAlign: 'left'}}
                                options={[
                                    {label: t('PhyEditor.PartialMode_StaticOrCurve'), value: PartialMode_StaticOrCurve},
                                    {label: t('PhyEditor.PartialMode_Partial'), value: PartialMode_Partial},
                                    {label: t('PhyEditor.PartialMode_FromBoneName'), value: PartialMode_FromBoneName},
                                ]}
                                style={{width: '100vh'}}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('PhyEditor.PartialMode_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>
                </div>


                <Flex gap="small">
                    <Form.Item label={t('PhyEditor.default_value')} name={floatFieldName} initialValue={0}>
                        <InputNumber style={{width: '100vh'}} max={1} min={0} step={0.01}/>
                    </Form.Item>
                    <Form.Item>
                        <Tooltip title={t('PhyEditor.default_value_tip')}>
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    </Form.Item>
                </Flex>

                {/* 只有当 mode === PartialMode_Partial 时，才显示骨骼列表 */}
                {partialMode === PartialMode_Partial && (
                    <Form.List name={partialListName}>
                        {(fields, {add, remove}) => {
                            return (
                                <Table
                                    dataSource={fields}
                                    rowKey="name"
                                    size="small"
                                    bordered
                                    pagination={false}
                                    footer={() =>
                                        <Button
                                            size="small"
                                            onClick={() => add({boneName: "", value: 0})}
                                            style={{width: '100%'}}
                                        >
                                            {t('PhyEditor.add_BoneValue')}
                                        </Button>
                                    }
                                    columns={[
                                        {
                                            title: t('PhyEditor.BoneValue'),
                                            children: [
                                                {
                                                    title: t('PhyEditor.BoneName'),
                                                    render: (_, field) => (
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'boneName']}
                                                            style={{margin: 0}}
                                                        >
                                                            <Input style={{width: '100%'}}/>
                                                        </Form.Item>
                                                    )
                                                },
                                                {
                                                    title: t('PhyEditor.Value'),
                                                    render: (_, field) => (
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'value']}
                                                            style={{margin: 0}}
                                                        >
                                                            <InputNumber style={{width: '100%'}} step={0.01}/>
                                                        </Form.Item>
                                                    )
                                                },
                                                {
                                                    title: t('PhyEditor.operate'),
                                                    width: 80,
                                                    render: (_, field) => (
                                                        <Button
                                                            icon={<DeleteOutlined/>}
                                                            onClick={() => remove(field.name)}
                                                            size="small"
                                                        />
                                                    )
                                                }
                                            ]
                                        }
                                    ]}
                                />
                            );
                        }}
                    </Form.List>
                )}

                {/*// 只有当 mode === PartialMode_StaticOrCurve 时，才显示曲线*/}
                {partialMode === PartialMode_StaticOrCurve && (
                    <>
                        {/* 曲线 keyframes */}
                        <KeyframeEditorWithTable
                            keyframesFieldName={keyframesFieldName}
                            t={t}
                            form={form}
                        />
                    </>
                )}
            </>
        );
    };

    return (
        <div style={{
            padding: 10,
        }}>
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
                                        onChange={(e) => setIsHeaderEditable(e.target.checked)}
                                    >
                                        {t('PhyEditor.file_header.enable_edit_do_not_edit')}
                                    </Checkbox>
                                </Form.Item>
                            </Space>
                            <Form.Item name="rootName">
                                <Input
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
                                localStorage.setItem("phyEditorViewMode", e.target.value.toString());
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

                        <Collapse
                            defaultActiveKey={['damping', 'elasticity', 'stiffness', 'inert', 'radius', 'others']}>
                            {/* damping */}
                            <Collapse.Panel key="damping" header={
                                <>
                                    {t('PhyEditor.Damping')}
                                    <Tooltip title={t('PhyEditor.Damping_tip')}>
                                        <QuestionCircleOutlined/>
                                    </Tooltip>
                                </>
                            }>
                                {renderPartialSection(
                                    "Damping",
                                    enablePartialDamping,
                                    "enablePartialDamping",
                                    "partialDamping",
                                    "damping",
                                    "dampingDistribKeyframes"
                                )}
                            </Collapse.Panel>

                            {/* elasticity */}
                            <Collapse.Panel key="elasticity" header={
                                <>
                                    {t('PhyEditor.Elasticity')}
                                    <Tooltip title={t('PhyEditor.Elasticity_tip')}>
                                        <QuestionCircleOutlined/>
                                    </Tooltip>
                                </>
                            }>
                                {renderPartialSection(
                                    "Elasticity",
                                    enablePartialElasticity,
                                    "enablePartialElasticity",
                                    "partialElasticity",
                                    "elasticity",
                                    "elasticityDistribKeyframes"
                                )}
                            </Collapse.Panel>

                            {/* stiffness */}
                            <Collapse.Panel key="stiffness" header={
                                <>
                                    {t('PhyEditor.Stiffness')}
                                    <Tooltip title={t('PhyEditor.Stiffness_tip')}>
                                        <QuestionCircleOutlined/>
                                    </Tooltip>
                                </>
                            }>
                                {renderPartialSection(
                                    "Stiffness",
                                    enablePartialStiffness,
                                    "enablePartialStiffness",
                                    "partialStiffness",
                                    "stiffness",
                                    "stiffnessDistribKeyframes"
                                )}
                            </Collapse.Panel>

                            {/* inert */}
                            <Collapse.Panel key="inert" header={
                                <>
                                    {t('PhyEditor.Inert')}
                                    <Tooltip title={t('PhyEditor.Inert_tip')}>
                                        <QuestionCircleOutlined/>
                                    </Tooltip>
                                </>
                            }>
                                {renderPartialSection(
                                    "Inert",
                                    enablePartialInert,
                                    "enablePartialInert",
                                    "partialInert",
                                    "inert",
                                    "inertDistribKeyframes"
                                )}
                            </Collapse.Panel>

                            {/* radius */}
                            <Collapse.Panel key="radius" header={
                                <>
                                    {t('PhyEditor.Radius')}
                                    <Tooltip title={t('PhyEditor.Radius_tip')}>
                                        <QuestionCircleOutlined/>
                                    </Tooltip>
                                </>
                            }>
                                {renderPartialSection(
                                    "Radius",
                                    enablePartialRadius,
                                    "enablePartialRadius",
                                    "partialRadius",
                                    "radius",
                                    "radiusDistribKeyframes"
                                )}
                            </Collapse.Panel>

                            <Collapse.Panel key="others" header={t('PhyEditor.other')}>

                                <Flex gap="small">
                                    <Form.Item label={t('PhyEditor.EndLength')} name="endLength" initialValue={0}>
                                        <InputNumber style={{width: 205}}/>
                                    </Form.Item>
                                    <Form.Item>
                                        <Tooltip title={t('PhyEditor.EndLength_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    </Form.Item>
                                </Flex>

                                <Form.Item label={t('PhyEditor.EndOffset')}>
                                    <Flex gap="middle">
                                        <Form.Item name="endOffsetX" initialValue={0}>
                                            <InputNumber
                                                addonBefore="X"
                                                style={{width: "100%"}} step={0.01}/>
                                        </Form.Item>
                                        <Form.Item name="endOffsetY" initialValue={0}>
                                            <InputNumber
                                                addonBefore="Y"
                                                style={{width: "100%"}} step={0.01}/>
                                        </Form.Item>
                                        <Form.Item name="endOffsetZ" initialValue={0}>
                                            <InputNumber
                                                addonBefore="Z"
                                                style={{width: "100%"}} step={0.01}/>
                                        </Form.Item>
                                        <Form.Item>
                                            <Tooltip title={t('PhyEditor.EndOffset_tip')}>
                                                <QuestionCircleOutlined/>
                                            </Tooltip>
                                        </Form.Item>
                                    </Flex>
                                </Form.Item>


                                <Form.Item label={t('PhyEditor.Gravity')}>
                                    <Flex gap="middle">
                                        <Form.Item name="gravityX" initialValue={0}>
                                            <InputNumber
                                                addonBefore="X"
                                                style={{width: "100%"}} step={0.01}/>
                                        </Form.Item>
                                        <Form.Item name="gravityY" initialValue={0}>
                                            <InputNumber
                                                addonBefore="Y"
                                                style={{width: "100%"}} step={0.01}/>
                                        </Form.Item>
                                        <Form.Item name="gravityZ" initialValue={0}>
                                            <InputNumber
                                                addonBefore="Z"
                                                style={{width: "100%"}} step={0.01}/>
                                        </Form.Item>
                                        <Form.Item>
                                            <Tooltip title={t('PhyEditor.Gravity_tip')}>
                                                <QuestionCircleOutlined/>
                                            </Tooltip>
                                        </Form.Item>
                                    </Flex>
                                </Form.Item>


                                <Form.Item label={t('PhyEditor.Force')}>
                                    <Flex gap="middle">
                                        <Form.Item name="forceX" initialValue={0}>
                                            <InputNumber
                                                addonBefore="X"
                                                style={{width: "100%"}} step={0.01}/>
                                        </Form.Item>
                                        <Form.Item name="forceY" initialValue={-0.01}>
                                            <InputNumber
                                                addonBefore="Y"
                                                style={{width: "100%"}} step={0.01}/>
                                        </Form.Item>
                                        <Form.Item name="forceZ" initialValue={0}>
                                            <InputNumber
                                                addonBefore="Z"
                                                style={{width: "100%"}} step={0.01}/>
                                        </Form.Item>
                                        <Form.Item>
                                            <Tooltip title={t('PhyEditor.Force_tip')}>
                                                <QuestionCircleOutlined/>
                                            </Tooltip>
                                        </Form.Item>
                                    </Flex>
                                </Form.Item>


                                <Flex gap="small">
                                    <Form.Item label={t('PhyEditor.ColliderFileName')} name="colliderFileName">
                                        <Input style={{width: 205}}/>
                                    </Form.Item>
                                    <Form.Item>
                                        <Tooltip title={t('PhyEditor.ColliderFileName_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    </Form.Item>
                                </Flex>

                                <Flex gap="small">
                                    <Form.Item label={t('PhyEditor.ColliderCount')} name="collidersCount">
                                        <InputNumber style={{width: 205}}/>
                                    </Form.Item>
                                    <Button
                                        onClick={handleAutoCalculateColliders}
                                    >
                                        {t('PhyEditor.auto_count')}
                                    </Button>
                                    <Form.Item>
                                        <Tooltip title={t('PhyEditor.ColliderCount_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    </Form.Item>
                                </Flex>


                                <Flex gap="small">
                                    <Form.Item label={t('PhyEditor.ExclusionsCount')} name="exclusionsCount"
                                               initialValue={0}>
                                        <InputNumber style={{width: 205}}/>
                                    </Form.Item>
                                    <Form.Item>
                                        <Tooltip title={t('PhyEditor.ExclusionsCount_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    </Form.Item>
                                </Flex>

                                <Flex gap="small">
                                    <Form.Item label={t('PhyEditor.FreezeAxis')} name="freezeAxis">
                                        <Radio.Group
                                            options={[
                                                {value: FreezeAxis_None, label: t('PhyEditor.FreezeAxis_None')},
                                                {value: FreezeAxis_X, label: 'X(1)'},
                                                {value: FreezeAxis_Y, label: 'Y(2)'},
                                                {value: FreezeAxis_Z, label: 'Z(3)'},
                                            ]}
                                        />
                                    </Form.Item>
                                    <Form.Item>
                                        <Tooltip title={t('PhyEditor.FreezeAxis_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    </Form.Item>
                                </Flex>
                            </Collapse.Panel>
                        </Collapse>
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