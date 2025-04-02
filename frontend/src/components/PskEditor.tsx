import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2HeaderConstants} from "../utils/ConstCOM3D2";
import {Checkbox, Collapse, ConfigProvider, Form, Input, message, Radio, Space} from "antd";
import {COM3D2} from "../../wailsjs/go/models";
import {ReadPskFile, WritePskFile} from "../../wailsjs/go/COM3D2/PskService";
import {SelectPathToSave} from "../../wailsjs/go/main/App";
import Style2PskProperties from "./psk/Style2PskProperties";
import {PskEditorViewModeKey} from "../utils/LocalStorageKeys";
import Style1PskProperties from "./psk/Style1PskProperties";
import Psk = COM3D2.Psk;

export interface PskEditorProps {
    filePath?: string;
}

export interface PskEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

const PskEditor = forwardRef<PskEditorRef, PskEditorProps>((props, ref) => {
    const {t} = useTranslation();
    const {filePath} = props;

    // Psk 数据对象
    const [pskData, setPskData] = useState<Psk | null>(null);

    // 是否允许编辑 Signature、Version 等字段
    const [headerEditable, setHeaderEditable] = useState(false);

    // antd form
    const [form] = Form.useForm();

    // 用来切换视图模式
    const [viewMode, setViewMode] = useState<1 | 2>(() => {
        const saved = localStorage.getItem(PskEditorViewModeKey);
        return saved ? Number(saved) as 1 | 2 : 1;
    });


    /** 组件挂载或 filePath 改变时，如果传入了 filePath 就自动读取一次 */
    useEffect(() => {
        let isMounted = true;

        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

            (async () => {
                try {
                    if (!isMounted) return;
                    await handleReadPskFile();
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            })();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            if (!isMounted) return;
            // 没有 filePath 时，可初始化一个新的 anm 对象
            const newPsk = new Psk();
            newPsk.Signature = COM3D2HeaderConstants.PskSignature;
            newPsk.Version = COM3D2HeaderConstants.PskVersion;
            newPsk.PanierRadius = 1.0;
            newPsk.PanierForce = 1.0;
            newPsk.PanierStressForce = 1.0;
            newPsk.StressDegreeMin = 0.0;
            newPsk.StressDegreeMax = 1.0;
            newPsk.StressMinScale = 1.0;
            newPsk.ScaleEaseSpeed = 1.0;
            newPsk.PanierForceDistanceThreshold = 0.1;
            newPsk.CalcTime = 60;
            newPsk.VelocityForceRate = 1.0;
            newPsk.Gravity = {X: 0, Y: -0.1, Z: 0};
            newPsk.HardValues = [0, 0, 0, 0];
            newPsk.PanierRadiusDistrib = new COM3D2.AnimationCurve({Keyframes: []});
            newPsk.PanierForceDistrib = new COM3D2.AnimationCurve({Keyframes: []});
            newPsk.VelocityForceRateDistrib = new COM3D2.AnimationCurve({Keyframes: []});
            newPsk.GravityDistrib = new COM3D2.AnimationCurve({Keyframes: []});
            newPsk.PanierRadiusDistribGroups = [];
            setPskData(newPsk);
        }

        return () => {
            isMounted = false;
        };
    }, [filePath]);


    /** 读取 Psk 文件 */
    const handleReadPskFile = async () => {
        if (!filePath) {
            message.error(t('Infos.pls_open_file_first'));
            return;
        }
        try {
            const data = await ReadPskFile(filePath);
            setPskData(data);
            console.log(data);
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.psk'}) + error);
        }
    }

    /** 保存 Psk 文件（覆盖写回） */
    const handleSavePskFile = async () => {
        if (!filePath) {
            message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
            return;
        }
        if (!pskData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }
        try {
            await WritePskFile(filePath, pskData);
            message.success(t('Infos.success_save_file'));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.save_file_failed_colon') + error);
        }
    }

    /** 另存为 Psk 文件 */
    const handleSaveAsPskFile = async () => {
        if (!pskData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }

        try {
            const newPath = await SelectPathToSave("*.psk", t('Infos.com3d2_psk_file'));
            if (!newPath) {
                // 用户取消
                return;
            }
            await WritePskFile(newPath, pskData);
            message.success(t('Infos.success_save_as_file_colon') + newPath);
        } catch (error: any) {
            message.error(t('Errors.save_as_file_failed_colon') + error.message);
            console.error(error);
        }
    }

    /**
     * 监听 Ctrl+S 快捷键，触发保存
     */
    const saveHandlerRef = useRef(handleSavePskFile);

    // 如果改变，更新 saveHandlerRef
    useEffect(() => {
        saveHandlerRef.current = handleSavePskFile;
    }, [filePath, pskData, viewMode, form]); // 包含所有可能影响保存行为的状态

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


    /** 暴露给父组件的 Ref 方法：读取、保存、另存为 */
    useImperativeHandle(ref, () => ({
        handleReadFile: handleReadPskFile,
        handleSaveFile: handleSavePskFile,
        handleSaveAsFile: handleSaveAsPskFile
    }));

    /**
     * 将后端的 Psk 对象 -> 前端表单字段
     */
    function transformPskToForm(psk: Psk) {
        return {
            signature: psk.Signature,
            version: psk.Version,
            panierRadius: psk.PanierRadius,
            panierForce: psk.PanierForce,
            panierStressForce: psk.PanierStressForce,
            stressDegreeMin: psk.StressDegreeMin,
            stressDegreeMax: psk.StressDegreeMax,
            stressMinScale: psk.StressMinScale,
            scaleEaseSpeed: psk.ScaleEaseSpeed,
            panierForceDistanceThreshold: psk.PanierForceDistanceThreshold,
            calcTime: psk.CalcTime,
            velocityForceRate: psk.VelocityForceRate,
            gravity: [
                psk.Gravity?.X || 0,
                psk.Gravity?.Y || 0,
                psk.Gravity?.Z || 0
            ],
            hardValues: psk.HardValues || [0, 0, 0, 0],

            // 曲线数据
            // 注意：为了 keyframe 编辑器编辑方便，这里取消嵌套 keyframe 数组，直接展开
            panierRadiusDistribKeyframes: psk.PanierRadiusDistrib?.Keyframes?.map(kf => ({
                time: kf.Time,
                value: kf.Value,
                inTangent: kf.InTangent,
                outTangent: kf.OutTangent
            })) || [],

            panierForceDistribKeyframes: psk.PanierForceDistrib?.Keyframes?.map(kf => ({
                time: kf.Time,
                value: kf.Value,
                inTangent: kf.InTangent,
                outTangent: kf.OutTangent
            })) || [],

            velocityForceRateDistribKeyframes: psk.VelocityForceRateDistrib?.Keyframes?.map(kf => ({
                time: kf.Time,
                value: kf.Value,
                inTangent: kf.InTangent,
                outTangent: kf.OutTangent
            })) || [],

            gravityDistribKeyframes: psk.GravityDistrib?.Keyframes?.map(kf => ({
                time: kf.Time,
                value: kf.Value,
                inTangent: kf.InTangent,
                outTangent: kf.OutTangent
            })) || [],

            // 裙撑半径分布组
            panierRadiusDistribGroups: psk.PanierRadiusDistribGroups?.map(group => ({
                boneName: group.BoneName,
                radius: group.Radius,
                curveKeyframes: group.Curve?.Keyframes?.map(kf => ({
                    time: kf.Time,
                    value: kf.Value,
                    inTangent: kf.InTangent,
                    outTangent: kf.OutTangent
                })) || []
            })) || []
        };
    }

    /**
     * 前端表单字段 -> Psk 对象
     */
    function transformFormToPsk(values: any, oldPsk: Psk): Psk {
        // 复制一份
        const newPsk = COM3D2.Psk.createFrom(oldPsk);

        if (headerEditable) {
            newPsk.Signature = values.signature;
            newPsk.Version = parseInt(values.version, 10);
        }

        // 基本属性
        newPsk.PanierRadius = parseFloat(values.panierRadius);
        newPsk.PanierForce = parseFloat(values.panierForce);
        newPsk.PanierStressForce = parseFloat(values.panierStressForce);
        newPsk.StressDegreeMin = parseFloat(values.stressDegreeMin);
        newPsk.StressDegreeMax = parseFloat(values.stressDegreeMax);
        newPsk.StressMinScale = parseFloat(values.stressMinScale);
        newPsk.ScaleEaseSpeed = parseFloat(values.scaleEaseSpeed);
        newPsk.PanierForceDistanceThreshold = parseFloat(values.panierForceDistanceThreshold);
        newPsk.CalcTime = parseInt(values.calcTime, 10);
        newPsk.VelocityForceRate = parseFloat(values.velocityForceRate);

        // 向量类型
        newPsk.Gravity = {
            X: parseFloat(values.gravity[0]),
            Y: parseFloat(values.gravity[1]),
            Z: parseFloat(values.gravity[2])
        };

        // 硬度值数组
        newPsk.HardValues = values.hardValues.map((val: any) => parseFloat(val));

        // 处理曲线数据
        // 注意：之前转换时，直接转换成了 keyframes 数组，没有嵌套
        if (values.panierRadiusDistribKeyframes) {
            newPsk.PanierRadiusDistrib = new COM3D2.AnimationCurve({
                Keyframes: values.panierRadiusDistribKeyframes.map((kf: any) => ({
                    Time: parseFloat(kf.time),
                    Value: parseFloat(kf.value),
                    InTangent: parseFloat(kf.inTangent),
                    OutTangent: parseFloat(kf.outTangent)
                }))
            });
        }

        if (values.panierForceDistribKeyframes) {
            newPsk.PanierForceDistrib = new COM3D2.AnimationCurve({
                Keyframes: values.panierForceDistribKeyframes.map((kf: any) => ({
                    Time: parseFloat(kf.time),
                    Value: parseFloat(kf.value),
                    InTangent: parseFloat(kf.inTangent),
                    OutTangent: parseFloat(kf.outTangent)
                }))
            });
        }

        if (values.velocityForceRateDistribKeyframes) {
            newPsk.VelocityForceRateDistrib = new COM3D2.AnimationCurve({
                Keyframes: values.velocityForceRateDistribKeyframes.map((kf: any) => ({
                    Time: parseFloat(kf.time),
                    Value: parseFloat(kf.value),
                    InTangent: parseFloat(kf.inTangent),
                    OutTangent: parseFloat(kf.outTangent)
                }))
            });
        }

        if (values.gravityDistribKeyframes) {
            newPsk.GravityDistrib = new COM3D2.AnimationCurve({
                Keyframes: values.gravityDistribKeyframes.map((kf: any) => ({
                    Time: parseFloat(kf.time),
                    Value: parseFloat(kf.value),
                    InTangent: parseFloat(kf.inTangent),
                    OutTangent: parseFloat(kf.outTangent)
                }))
            });
        }

        // 处理裙撑半径分布组
        if (Array.isArray(values.panierRadiusDistribGroups)) {
            newPsk.PanierRadiusDistribGroups = values.panierRadiusDistribGroups.map((group: any) => ({
                BoneName: group.boneName,
                Radius: parseFloat(group.radius),
                Curve: {
                    Keyframes: (group.curveKeyframes || []).map((kf: any) => ({
                        Time: parseFloat(kf.time),
                        Value: parseFloat(kf.value),
                        InTangent: parseFloat(kf.inTangent),
                        OutTangent: parseFloat(kf.outTangent)
                    }))
                }
            }));
        }

        return newPsk;
    }

    // 当 pskData 变化时同步到表单
    useEffect(() => {
        if (pskData) {
            const formValues = transformPskToForm(pskData);
            form.setFieldsValue(formValues);
        }
    }, [pskData, form]);

    // return (
    //     <div style={{padding: 10}}>
    //         <Style2PskProperties
    //             pskData={pskData}
    //             setPskData={(newVal) => setPskData(newVal)}
    //         >
    //         </Style2PskProperties>
    //
    //     </div>
    // );

    return (
        <div style={{padding: 10}}>
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
                        <Collapse.Panel header={t('PskEditor.file_header.file_head')} key="basic">
                            <Space>
                                <Form.Item name="signature"
                                           initialValue={COM3D2HeaderConstants.PskSignature}>
                                    <Input
                                        disabled={!headerEditable}
                                        addonBefore={t('PskEditor.file_header.Signature')}
                                    />
                                </Form.Item>
                                <Form.Item name="version" initialValue={COM3D2HeaderConstants.PskVersion}>
                                    <Input
                                        disabled={!headerEditable}
                                        addonBefore={t('PskEditor.file_header.Version')}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Checkbox
                                        checked={headerEditable}
                                        onChange={(e) => setHeaderEditable(e.target.checked)}
                                    >
                                        {t('PskEditor.file_header.enable_edit_do_not_edit')}
                                    </Checkbox>
                                </Form.Item>
                            </Space>
                        </Collapse.Panel>
                    </Collapse>

                    <div style={{marginBottom: 8, marginTop: 8}}>
                        <Radio.Group
                            block
                            value={viewMode}
                            onChange={(e) => {
                                // 在切换显示模式之前获取当前表单值并更新 pskData
                                const currentFormValues = form.getFieldsValue(true);
                                if (pskData && (viewMode != 2)) { // 非模式 2 时从表单拿数据，因为模式 2 是 JSON
                                    const updatedPsk = transformFormToPsk(currentFormValues, pskData);
                                    setPskData(updatedPsk);
                                }

                                setViewMode(e.target.value);
                                localStorage.setItem(PskEditorViewModeKey, e.target.value.toString());
                            }}
                            options={[
                                {label: t('PskEditor.style1'), value: 1},
                                {label: t('PskEditor.style2'), value: 2},
                            ]}
                            optionType="button"
                            buttonStyle="solid"
                        />
                    </div>

                    {viewMode === 1 && (
                        <Style1PskProperties
                            form={form}
                        />
                    )}

                    {viewMode === 2 && (
                        <Style2PskProperties
                            pskData={pskData}
                            setPskData={(newVal) => setPskData(newVal)}
                        />
                    )}
                </Form>
            </ConfigProvider>
        </div>
    );
});

export default PskEditor;