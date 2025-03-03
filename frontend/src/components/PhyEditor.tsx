import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {
    Button,
    Checkbox,
    Collapse,
    ConfigProvider,
    Divider,
    Form,
    Input,
    InputNumber,
    message,
    Radio,
    Space
} from "antd";
import {DeleteOutlined, PlusOutlined} from "@ant-design/icons";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {ReadPhyFile, WritePhyFile} from "../../wailsjs/go/COM3D2/PhyService";
import {SaveFile} from "../../wailsjs/go/main/App";
import {COM3D2HeaderConstants} from "../utils/consts";
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

/**
 * 将后端的 Phy 对象转换为 antd Form 可以直接使用的表单数据
 */
function transformPhyToForm(phy: Phy): any {
    return {
        signature: phy.Signature,
        version: phy.Version,
        rootName: phy.RootName,

        // Damping
        enablePartialDamping: phy.EnablePartialDamping,
        partialDamping: (phy.PartialDamping || []).map(bv => ({
            boneName: bv.BoneName,
            value: bv.Value
        })),
        damping: phy.Damping,
        dampingDistribKeyframes: phy.DampingDistrib?.Keyframes?.map(kf => ({
            time: kf.Time,
            value: kf.Value,
            inTangent: kf.InTangent,
            outTangent: kf.OutTangent
        })) || [],

        // Elasticity
        enablePartialElasticity: phy.EnablePartialElasticity,
        partialElasticity: (phy.PartialElasticity || []).map(bv => ({
            boneName: bv.BoneName,
            value: bv.Value
        })),
        elasticity: phy.Elasticity,
        elasticityDistribKeyframes: phy.ElasticityDistrib?.Keyframes?.map(kf => ({
            time: kf.Time,
            value: kf.Value,
            inTangent: kf.InTangent,
            outTangent: kf.OutTangent
        })) || [],

        // Stiffness
        enablePartialStiffness: phy.EnablePartialStiffness,
        partialStiffness: (phy.PartialStiffness || []).map(bv => ({
            boneName: bv.BoneName,
            value: bv.Value
        })),
        stiffness: phy.Stiffness,
        stiffnessDistribKeyframes: phy.StiffnessDistrib?.Keyframes?.map(kf => ({
            time: kf.Time,
            value: kf.Value,
            inTangent: kf.InTangent,
            outTangent: kf.OutTangent
        })) || [],

        // Inert
        enablePartialInert: phy.EnablePartialInert,
        partialInert: (phy.PartialInert || []).map(bv => ({
            boneName: bv.BoneName,
            value: bv.Value
        })),
        inert: phy.Inert,
        inertDistribKeyframes: phy.InertDistrib?.Keyframes?.map(kf => ({
            time: kf.Time,
            value: kf.Value,
            inTangent: kf.InTangent,
            outTangent: kf.OutTangent
        })) || [],

        // Radius
        enablePartialRadius: phy.EnablePartialRadius,
        partialRadius: (phy.PartialRadius || []).map(bv => ({
            boneName: bv.BoneName,
            value: bv.Value
        })),
        radius: phy.Radius,
        radiusDistribKeyframes: phy.RadiusDistrib?.Keyframes?.map(kf => ({
            time: kf.Time,
            value: kf.Value,
            inTangent: kf.InTangent,
            outTangent: kf.OutTangent
        })) || [],

        // 其他 float
        endLength: phy.EndLength,
        endOffsetX: phy.EndOffset?.[0] || 0,
        endOffsetY: phy.EndOffset?.[1] || 0,
        endOffsetZ: phy.EndOffset?.[2] || 0,

        gravityX: phy.Gravity?.[0] || 0,
        gravityY: phy.Gravity?.[1] || 0,
        gravityZ: phy.Gravity?.[2] || 0,

        forceX: phy.Force?.[0] || 0,
        forceY: phy.Force?.[1] || 0,
        forceZ: phy.Force?.[2] || 0,

        colliderFileName: phy.ColliderFileName,
        collidersCount: phy.CollidersCount,
        exclusionsCount: phy.ExclusionsCount,
        freezeAxis: phy.FreezeAxis
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

    // 从后端读取到的 phy 数据
    const [phyData, setPhyData] = useState<Phy | null>(null);

    // 是否允许编辑 Signature/Version 等头部信息
    const [isHeaderEditable, setIsHeaderEditable] = useState(false);

    // antd 的表单
    const [form] = Form.useForm();

    // 当传入的 filePath 改变时，自动执行读取
    useEffect(() => {
        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle("Editing: " + fileName + "  (" + filePath + ")");
            handleReadPhyFile();
        } else {
            WindowSetTitle("Phy Editor");
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
            message.error("请先选择文件！");
            return;
        }
        try {
            const data = await ReadPhyFile(filePath);
            console.log("读取到 phy 数据:", data);
            setPhyData(data);

            // 同步到表单
            form.setFieldsValue(transformPhyToForm(data));
        } catch (error: any) {
            console.error(error);
            message.error("读取 .phy 文件失败：" + error);
        }
    };

    /**
     * 保存（覆盖原文件）
     */
    const handleSavePhyFile = async () => {
        if (!filePath) {
            message.error("当前没有打开的文件，无法保存");
            return;
        }
        if (!phyData) {
            message.error("请先加载文件！");
            return;
        }
        try {
            // 从表单获取最新值，组装新的 phy
            const values = form.getFieldsValue(true);
            const newPhy = transformFormToPhy(values, phyData);

            await WritePhyFile(filePath, newPhy);
            message.success("保存成功！");
        } catch (error: any) {
            console.error(error);
            message.error("保存失败：" + error);
        }
    };

    /**
     * 另存为
     */
    const handleSaveAsPhyFile = async () => {
        if (!phyData) {
            message.error("请先加载文件！");
            return;
        }
        try {
            // 询问保存路径
            const newPath = await SaveFile("*.phy", "COM3D2 phy file");
            if (!newPath) {
                return; // 用户取消
            }
            // 组装新的 phy
            const values = form.getFieldsValue(true);
            const newPhy = transformFormToPhy(values, phyData);

            await WritePhyFile(newPath, newPhy);
            message.success("另存为成功：" + newPath);
        } catch (error: any) {
            console.error(error);
            message.error("另存为失败：" + error);
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

    // 渲染某个 partial 块: (enablePartialXxx, partialXxx, Xxx, XxxDistrib)
    const renderPartialSection = (
        label: string,
        enablePartialName: string,           // enablePartialDamping
        partialListName: string,            // partialDamping
        floatFieldName: string,             // damping
        keyframesFieldName: string          // dampingDistribKeyframes
    ) => {
        return (
            <>
                <Divider>{label}</Divider>
                <Form.Item label="PartialMode" name={enablePartialName}>
                    <Radio.Group>
                        <Radio value={PartialMode_StaticOrCurve}>Static/Curve(0)</Radio>
                        <Radio value={PartialMode_Partial}>Partial(1)</Radio>
                        <Radio value={PartialMode_FromBoneName}>FromBoneName(2)</Radio>
                    </Radio.Group>
                </Form.Item>
                {/* 只有当 mode==1 时，才显示骨骼列表 */}
                <Form.List name={partialListName}>
                    {(fields, {add, remove}) => {
                        // 根据 enablePartialName 的值动态控制显示
                        const partialMode = form.getFieldValue(enablePartialName);
                        if (partialMode !== PartialMode_Partial) {
                            return null;
                        }
                        return (
                            <div style={{marginLeft: 24, marginBottom: 8}}>
                                <Button
                                    size="small"
                                    type="dashed"
                                    onClick={() => add({boneName: "", value: 0})}
                                    icon={<PlusOutlined/>}
                                >
                                    添加 BoneValue
                                </Button>
                                {fields.map(({key, name, ...restField}) => (
                                    <Space key={key} style={{display: "flex", marginTop: 8}} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, "boneName"]}
                                            label="BoneName"
                                        >
                                            <Input style={{width: 180}}/>
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "value"]}
                                            label="Value"
                                        >
                                            <InputNumber/>
                                        </Form.Item>
                                        <Button
                                            danger
                                            icon={<DeleteOutlined/>}
                                            onClick={() => remove(name)}
                                        />
                                    </Space>
                                ))}
                            </div>
                        );
                    }}
                </Form.List>

                <Form.Item label={`${label} 默认值`} name={floatFieldName}>
                    <InputNumber/>
                </Form.Item>
                {/* 曲线 keyframes */}
                <Form.List name={keyframesFieldName}>
                    {(fields, {add, remove}) => (
                        <>
                            <div>Keyframes</div>
                            <Button
                                size="small"
                                type="dashed"
                                onClick={() => add({time: 0, value: 0, inTangent: 0, outTangent: 0})}
                                icon={<PlusOutlined/>}
                                style={{marginBottom: 8}}
                            >
                                添加Keyframe
                            </Button>
                            {fields.map(({key, name, ...restField}) => (
                                <Space key={key} style={{display: "flex", marginBottom: 8}} align="baseline">
                                    <Form.Item
                                        {...restField}
                                        name={[name, "time"]}
                                        label="Time"
                                    >
                                        <InputNumber style={{width: 70}}/>
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, "value"]}
                                        label="Value"
                                    >
                                        <InputNumber style={{width: 70}}/>
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, "inTangent"]}
                                        label="InT"
                                    >
                                        <InputNumber style={{width: 70}}/>
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, "outTangent"]}
                                        label="OutT"
                                    >
                                        <InputNumber style={{width: 70}}/>
                                    </Form.Item>
                                    <Button danger icon={<DeleteOutlined/>} onClick={() => remove(name)}/>
                                </Space>
                            ))}
                        </>
                    )}
                </Form.List>
            </>
        );
    };

    return (
        <ConfigProvider>
            <div style={{padding: 10}}>
                <Form
                    form={form}
                    layout="vertical"
                    labelAlign="left"
                    style={{marginTop: 10}}
                >
                    <Collapse defaultActiveKey={["base", "damping", "elasticity"]}>
                        {/* 基础信息 */}
                        <Collapse.Panel key="base" header="基础信息">
                            <Form.Item label="Signature" name="signature">
                                <Input disabled={!isHeaderEditable}/>
                            </Form.Item>
                            <Form.Item label="Version" name="version">
                                <InputNumber disabled={!isHeaderEditable}/>
                            </Form.Item>
                            <Form.Item>
                                <Checkbox
                                    checked={isHeaderEditable}
                                    onChange={(e) => setIsHeaderEditable(e.target.checked)}
                                >
                                    解锁编辑 Signature/Version（谨慎修改）
                                </Checkbox>
                            </Form.Item>
                            <Form.Item label="RootName" name="rootName">
                                <Input/>
                            </Form.Item>
                        </Collapse.Panel>

                        {/* damping */}
                        <Collapse.Panel key="damping" header="Damping">
                            {renderPartialSection(
                                "Damping",
                                "enablePartialDamping",
                                "partialDamping",
                                "damping",
                                "dampingDistribKeyframes"
                            )}
                        </Collapse.Panel>

                        {/* elasticity */}
                        <Collapse.Panel key="elasticity" header="Elasticity">
                            {renderPartialSection(
                                "Elasticity",
                                "enablePartialElasticity",
                                "partialElasticity",
                                "elasticity",
                                "elasticityDistribKeyframes"
                            )}
                        </Collapse.Panel>

                        {/* stiffness */}
                        <Collapse.Panel key="stiffness" header="Stiffness">
                            {renderPartialSection(
                                "Stiffness",
                                "enablePartialStiffness",
                                "partialStiffness",
                                "stiffness",
                                "stiffnessDistribKeyframes"
                            )}
                        </Collapse.Panel>

                        {/* inert */}
                        <Collapse.Panel key="inert" header="Inert">
                            {renderPartialSection(
                                "Inert",
                                "enablePartialInert",
                                "partialInert",
                                "inert",
                                "inertDistribKeyframes"
                            )}
                        </Collapse.Panel>

                        {/* radius */}
                        <Collapse.Panel key="radius" header="Radius">
                            {renderPartialSection(
                                "Radius",
                                "enablePartialRadius",
                                "partialRadius",
                                "radius",
                                "radiusDistribKeyframes"
                            )}
                        </Collapse.Panel>

                        <Collapse.Panel key="others" header="其它参数">
                            <Divider>End</Divider>
                            <Form.Item label="EndLength" name="endLength">
                                <InputNumber/>
                            </Form.Item>
                            <Form.Item label="EndOffsetX" name="endOffsetX">
                                <InputNumber/>
                            </Form.Item>
                            <Form.Item label="EndOffsetY" name="endOffsetY">
                                <InputNumber/>
                            </Form.Item>
                            <Form.Item label="EndOffsetZ" name="endOffsetZ">
                                <InputNumber/>
                            </Form.Item>

                            <Divider>Gravity</Divider>
                            <Form.Item label="gravityX" name="gravityX">
                                <InputNumber/>
                            </Form.Item>
                            <Form.Item label="gravityY" name="gravityY">
                                <InputNumber/>
                            </Form.Item>
                            <Form.Item label="gravityZ" name="gravityZ">
                                <InputNumber/>
                            </Form.Item>

                            <Divider>Force</Divider>
                            <Form.Item label="forceX" name="forceX">
                                <InputNumber/>
                            </Form.Item>
                            <Form.Item label="forceY" name="forceY">
                                <InputNumber/>
                            </Form.Item>
                            <Form.Item label="forceZ" name="forceZ">
                                <InputNumber/>
                            </Form.Item>

                            <Divider>Collider</Divider>
                            <Form.Item label="ColliderFileName" name="colliderFileName">
                                <Input/>
                            </Form.Item>
                            <Form.Item label="CollidersCount" name="collidersCount">
                                <InputNumber/>
                            </Form.Item>
                            <Form.Item label="ExclusionsCount" name="exclusionsCount">
                                <InputNumber/>
                            </Form.Item>
                            <Form.Item label="FreezeAxis" name="freezeAxis">
                                <Radio.Group>
                                    <Radio value={FreezeAxis_None}>None(0)</Radio>
                                    <Radio value={FreezeAxis_X}>X(1)</Radio>
                                    <Radio value={FreezeAxis_Y}>Y(2)</Radio>
                                    <Radio value={FreezeAxis_Z}>Z(3)</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Collapse.Panel>
                    </Collapse>
                </Form>
            </div>
        </ConfigProvider>
    );
});

export default PhyEditor;
