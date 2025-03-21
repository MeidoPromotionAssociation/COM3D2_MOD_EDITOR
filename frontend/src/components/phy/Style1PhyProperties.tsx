// 新建文件
import React from "react";
import {Button, Collapse, Flex, Form, Input, InputNumber, Radio, Select, Table, Tooltip} from "antd";
import {DeleteOutlined, QuestionCircleOutlined} from "@ant-design/icons";
import KeyframeEditorWithTable from "./KeyframeEditorWithTable";
import {COM3D2} from "../../../wailsjs/go/models";
import {
    FreezeAxis_None,
    FreezeAxis_X, FreezeAxis_Y, FreezeAxis_Z,
    PartialMode_FromBoneName,
    PartialMode_Partial,
    PartialMode_StaticOrCurve
} from "../PhyEditor";

interface Style1PhyPropertiesProps {
    phyData: COM3D2.Phy | null;
    form: any;
    t: (key: string) => string;
    handleAutoCalculateColliders: () => void;
    enablePartialDamping: number;
    enablePartialElasticity: number;
    enablePartialStiffness: number;
    enablePartialInert: number;
    enablePartialRadius: number;
}


const Style1PhyProperties: React.FC<Style1PhyPropertiesProps> = ({
                                                                     form,
                                                                     t,
                                                                     handleAutoCalculateColliders,
                                                                     enablePartialDamping,
                                                                     enablePartialElasticity,
                                                                     enablePartialStiffness,
                                                                     enablePartialInert,
                                                                     enablePartialRadius,
                                                                 }) => {
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
    );
};

export default Style1PhyProperties;