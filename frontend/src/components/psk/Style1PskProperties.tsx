import React from "react";
import {useTranslation} from "react-i18next";
import {Button, Collapse, Divider, Flex, Form, FormInstance, Input, InputNumber, Tooltip} from "antd";
import {DeleteOutlined, PlusOutlined, QuestionCircleOutlined} from "@ant-design/icons";
import KeyframeEditorWithTable from "../common/KeyframeEditorWithTable";
import KeyframeEditorWrapper from "../common/KeyframeEditorWrapper";

/** 样式1：所有 Properties 顺序排布 */
const Style1PskProperties: React.FC<{
    form: FormInstance;
}> = ({form}) => {
    const {t} = useTranslation();

    return (
        <div
            style={{
                textAlign: 'left',
            }}
        >
            <Collapse defaultActiveKey={["basic", "panier"]}>
                <Collapse.Panel header={
                    <>
                        {t('PskEditor.panier_parameters') + ' '}
                        <Tooltip title={t('PskEditor.panier_parameters_tip')}>
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    </>
                } key="panier">
                    <Flex gap="small">
                        <Form.Item label={t('PskEditor.panierStressForce')} name="panierStressForce"
                                   style={{flex: 1, maxWidth: '40%'}} initialValue={0.4}>
                            <InputNumber style={{width: '100%'}} step={0.1} max={1} min={0}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('PskEditor.panierStressForce_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>

                    <Flex gap="small">
                        <Form.Item label={t('PskEditor.stressDegreeMin')} name="stressDegreeMin"
                                   style={{flex: 1, maxWidth: '40%'}} initialValue={45}>
                            <InputNumber style={{width: '100%'}} step={0.1}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('PskEditor.stressDegreeMin_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>

                    <Flex gap="small">
                        <Form.Item label={t('PskEditor.stressDegreeMax')} name="stressDegreeMax"
                                   style={{flex: 1, maxWidth: '40%'}} initialValue={90}>
                            <InputNumber style={{width: '100%'}} step={0.1}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('PskEditor.stressDegreeMax_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>

                    <Flex gap="small">
                        <Form.Item label={t('PskEditor.stressMinScale')} name="stressMinScale"
                                   style={{flex: 1, maxWidth: '40%'}} initialValue={0.75}>
                            <InputNumber style={{width: '100%'}} step={0.1}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('PskEditor.stressMinScale_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>

                    <Flex gap="small">
                        <Form.Item label={t('PskEditor.scaleEaseSpeed')} name="scaleEaseSpeed"
                                   style={{flex: 1, maxWidth: '40%'}} initialValue={5}>
                            <InputNumber style={{width: '100%'}} step={0.1}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('PskEditor.scaleEaseSpeed_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>

                    <Flex gap="small">
                        <Form.Item label={t('PskEditor.panierForceDistanceThreshold')}
                                   name="panierForceDistanceThreshold"
                                   style={{flex: 1, maxWidth: '40%'}}>
                            <InputNumber style={{width: '100%'}} step={0.01}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('PskEditor.panierForceDistanceThreshold_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>

                    <Divider/>


                    <Flex gap="small">
                        <Form.Item label={t('PskEditor.panierRadius')} name="panierRadius"
                                   style={{flex: 1, maxWidth: '40%'}} initialValue={0.025}>
                            <InputNumber style={{width: '100%'}} step={0.1}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('PskEditor.panierRadius_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('PskEditor.panierRadius_order_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>


                    <Collapse>
                        <Collapse.Panel header={t('PskEditor.panierRadiusDistrib')} key="panierRadiusDistrib">
                            <div style={{marginBottom: 16}}>
                                <KeyframeEditorWithTable
                                    keyframesFieldName="panierRadiusDistribKeyframes"
                                    form={form}
                                />
                            </div>
                        </Collapse.Panel>


                        <Collapse.Panel header={t('PskEditor.panierRadiusDistribGroups')}
                                        key="panierRadiusDistribGroups">
                            <Form.List name="panierRadiusDistribGroups">
                                {(fields, {add, remove}) => (
                                    <>
                                        {fields.map(field => (
                                            <div key={field.key} style={{
                                                border: '1px solid #f0f0f0',
                                                padding: 16,
                                                marginBottom: 16,
                                                borderRadius: 4
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginBottom: 16
                                                }}>
                                                    <h4>{t('PskEditor.panier_radius_group', {index: field.name + 1})}</h4>
                                                    <Button
                                                        danger
                                                        icon={<DeleteOutlined/>}
                                                        onClick={() => remove(field.name)}
                                                        size="small"
                                                    />
                                                </div>

                                                <Form.Item
                                                    label={t('PskEditor.panierRadiusDistribGroups_boneName')}
                                                    name={[field.name, 'boneName']}
                                                >
                                                    <Input/>
                                                </Form.Item>

                                                <Form.Item
                                                    label={t('PskEditor.panierRadiusDistribGroups_radius')}
                                                    name={[field.name, 'radius']}
                                                >
                                                    <InputNumber style={{width: '100%'}} step={0.1}/>
                                                </Form.Item>

                                                <div style={{marginBottom: 16}}>
                                                    {/*TODO THIS NOT WORKING*/}
                                                    <KeyframeEditorWrapper
                                                        form={form}
                                                        nestedPath={[field.name, 'curveKeyframes']}
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <Form.Item>
                                            <Button
                                                onClick={() => add()}
                                                block
                                                icon={<PlusOutlined/>}
                                            >
                                                {t('PskEditor.add_panier_radius_group')}
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Collapse.Panel>
                    </Collapse>

                    <Divider/>

                    <Flex gap="small">
                        <Form.Item label={t('PskEditor.panierForce')} name="panierForce"
                                   style={{flex: 1, maxWidth: '40%'}} initialValue={0.134}>
                            <InputNumber style={{width: '100%'}} step={0.1} max={1} min={0}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('PskEditor.panierForce_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>

                    <Collapse>
                        <Collapse.Panel header={t('PskEditor.panierForceDistrib')} key="panierForceDistrib">

                            <div style={{marginBottom: 16}}>
                                <KeyframeEditorWithTable
                                    keyframesFieldName="panierForceDistribKeyframes"
                                    form={form}
                                />
                            </div>
                        </Collapse.Panel>
                    </Collapse>

                </Collapse.Panel>


                {/* 基本参数区块 */}
                <Collapse.Panel header={t('PskEditor.basic_parameters')} key="basic">
                    <Flex gap="small">
                        <Form.Item label={t('PskEditor.calcTime')} name="calcTime"
                                   style={{flex: 1, maxWidth: '40%'}} initialValue={16}>
                            <InputNumber style={{width: '100%'}} step={1}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('PskEditor.calcTime_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>

                    {/* 硬度值数组 */}
                    <Form.Item label={t('PskEditor.hardValues')}>
                        <Flex gap="middle">
                            <Form.Item name={['hardValues', 0]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore={t('PskEditor.horizontal_contraction')}
                                    step={0.01}
                                    style={{width: "22%"}}/>
                            </Form.Item>
                            <Form.Item name={['hardValues', 1]} noStyle initialValue={0.01}>
                                <InputNumber
                                    addonBefore={t('PskEditor.horizontal_extension')}
                                    step={0.01}
                                    style={{width: "22%"}}/>
                            </Form.Item>
                            <Form.Item name={['hardValues', 2]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore={t('PskEditor.vertical_contraction')}
                                    step={0.01}
                                    style={{width: "22%"}}/>
                            </Form.Item>
                            <Form.Item name={['hardValues', 3]} noStyle initialValue={0.7}>
                                <InputNumber
                                    addonBefore={t('PskEditor.vertical_extension')}
                                    step={0.01}
                                    style={{width: "22%"}}/>
                            </Form.Item>
                            <Form.Item noStyle>
                                <Tooltip title={t('PskEditor.hardValues_tip')}>
                                    <QuestionCircleOutlined/>
                                </Tooltip>
                            </Form.Item>
                        </Flex>
                    </Form.Item>

                    <Divider/>

                    <Flex gap="small">
                        <Form.Item label={t('PskEditor.velocityForceRate')} name="velocityForceRate"
                                   style={{flex: 1, maxWidth: '40%'}} initialValue={0.8}>
                            <InputNumber style={{width: '100%'}} step={0.1}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('PskEditor.velocityForceRate_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>


                    <Collapse>
                        <Collapse.Panel header={t('PskEditor.velocityForceRateDistrib')} key="velocityForceRateDistrib">
                            <div style={{marginBottom: 16}}>
                                <KeyframeEditorWithTable
                                    keyframesFieldName="velocityForceRateDistribKeyframes"
                                    form={form}
                                />
                            </div>
                        </Collapse.Panel>
                    </Collapse>


                    <Divider/>


                    <Form.Item label={t('PskEditor.gravity')}>
                        <Flex gap="middle">
                            <Form.Item name={['gravity', 0]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="X"
                                    step={0.1}
                                    style={{width: "22%"}}/>
                            </Form.Item>
                            <Form.Item name={['gravity', 1]} noStyle initialValue={-0.05}>
                                <InputNumber
                                    addonBefore="Y"
                                    step={0.1}
                                    style={{width: "22%"}}/>
                            </Form.Item>
                            <Form.Item name={['gravity', 2]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="Z"
                                    step={0.1}
                                    style={{width: "22%"}}/>
                            </Form.Item>
                            <Form.Item noStyle>
                                <Tooltip title={t('PskEditor.gravity_tip')}>
                                    <QuestionCircleOutlined/>
                                </Tooltip>
                            </Form.Item>
                        </Flex>
                    </Form.Item>

                    <Collapse>
                        <Collapse.Panel header={t('PskEditor.gravityDistrib')} key="gravityDistrib">
                            <div style={{marginBottom: 16}}>
                                <KeyframeEditorWithTable
                                    keyframesFieldName="gravityDistribKeyframes"
                                    form={form}
                                />
                            </div>
                        </Collapse.Panel>
                    </Collapse>

                </Collapse.Panel>
            </Collapse>
        </div>
    );
};


export default Style1PskProperties;