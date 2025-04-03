import React from "react";
import {Flex, Form, FormInstance, Input, InputNumber, Radio, Select, Tooltip} from "antd";
import {QuestionCircleOutlined} from "@ant-design/icons";
import {useTranslation} from "react-i18next";


/**
 * 用于渲染单个 Collider 的表单区域，根据 typeName 动态切换要展示的字段
 */
const DynamicColliderFormItem: React.FC<{ name: number; restField: any; form: FormInstance; }> = ({
                                                                                                      name,
                                                                                                      restField,
                                                                                                      form
                                                                                                  }) => {
    const {t} = useTranslation();
    // 其中 position/rotation/scale/center 都是 array
    const typeName = Form.useWatch(["colliders", name, "TypeName"], form);

    return (
        <div
            style={{
                textAlign: 'left',
            }}
        >
            <Form.Item initialValue='dbc'
                       {...restField}
                       label={t('ColEditor.collider_type')}
                       name={[name, 'TypeName']}
            >
                <Select
                    dropdownStyle={{textAlign: 'left'}}
                    options={[
                        {label: t('ColEditor.dbc'), value: 'dbc'},
                        {label: t('ColEditor.dpc'), value: 'dpc'},
                        {label: t('ColEditor.dbm'), value: 'dbm'},
                        {label: t('ColEditor.missing'), value: 'missing'},
                    ]}
                />
            </Form.Item>


            {/* 当类型不是 missing 时才渲染公共字段 */}
            {typeName !== 'missing' && (
                <>
                    {/* base 公共字段 */}
                    <Form.Item label={t('ColEditor.ParentName')} name={[name, "parentName"]}>
                        <Input
                            suffix={
                                <Tooltip title={t('ColEditor.ParentName_tip')}>
                                    <QuestionCircleOutlined/>
                                </Tooltip>
                            }
                        />
                    </Form.Item>
                    <Form.Item label={t('ColEditor.SelfName')} name={[name, "selfName"]}>
                        <Input
                            suffix={
                                <Tooltip title={t('ColEditor.SelfName_tip')}>
                                    <QuestionCircleOutlined/>
                                </Tooltip>
                            }
                        />
                    </Form.Item>

                    {/* LocalPosition (3个数) */}
                    <Form.Item label={t('ColEditor.LocalPosition')}>
                        <Flex gap="middle">
                            <Form.Item name={[name, "localPosition", 0]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="X"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localPosition", 1]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="Y"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localPosition", 2]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="Z"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item noStyle>
                                <Tooltip title={t('ColEditor.LocalPosition_tip')}>
                                    <QuestionCircleOutlined/>
                                </Tooltip>
                            </Form.Item>
                        </Flex>
                    </Form.Item>

                    {/* LocalRotation (4个数) */}
                    <Form.Item label={t('ColEditor.LocalRotation')}>
                        <Flex gap="middle">
                            <Form.Item name={[name, "localRotation", 0]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="X"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localRotation", 1]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="Y"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localRotation", 2]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="Z"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localRotation", 3]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="W"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item noStyle>
                                <Tooltip title={t('ColEditor.LocalRotation_tip')}>
                                    <QuestionCircleOutlined/>
                                </Tooltip>
                            </Form.Item>
                        </Flex>
                    </Form.Item>

                    {/* LocalScale (3个数) */}
                    <Form.Item label={t('ColEditor.LocalScale')}>
                        <Flex gap="middle">
                            <Form.Item name={[name, "localScale", 0]} noStyle initialValue={1}>
                                <InputNumber
                                    addonBefore="SX"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localScale", 1]} noStyle initialValue={1}>
                                <InputNumber
                                    addonBefore="SY"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localScale", 2]} noStyle initialValue={1}>
                                <InputNumber
                                    addonBefore="SZ"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item noStyle>
                                <Tooltip title={t('ColEditor.LocalScale_tip')}>
                                    <QuestionCircleOutlined/>
                                </Tooltip>
                            </Form.Item>
                        </Flex>
                    </Form.Item>

                    <Flex gap="small">
                        <Form.Item label={t('ColEditor.Direction')} name={[name, "direction"]} initialValue={1}>
                            {/*<InputNumber style={{width: "93.5%"}} max={2} min={0} step={1}/>*/}
                            <Radio.Group
                                options={[
                                    {value: 0, label: t('ColEditor.Direction_X')},
                                    {value: 1, label: t('ColEditor.Direction_Y')},
                                    {value: 2, label: t('ColEditor.Direction_Z')},
                                ]}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('ColEditor.Direction_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>

                    <Form.Item label={t('ColEditor.Center')}>
                        <Flex gap="middle">
                            <Form.Item name={[name, "center", 0]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="CX"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "center", 1]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="CY"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "center", 2]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="CZ"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item noStyle>
                                <Tooltip title={t('ColEditor.Center_tip')}>
                                    <QuestionCircleOutlined/>
                                </Tooltip>
                            </Form.Item>
                        </Flex>
                    </Form.Item>

                    <Flex gap="small">
                        <Form.Item label={t('ColEditor.Bound')} name={[name, "bound"]} initialValue={0}>
                            {/*<InputNumber style={{width: "93.5%"}} max={1} min={0} step={1}/>*/}
                            <Radio.Group
                                options={[
                                    {value: 0, label: t('ColEditor.Bound_Outside')},
                                    {value: 1, label: t('ColEditor.Bound_Inside')},
                                ]}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('ColEditor.Bound_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>
                </>
            )}

            {/* 只有 dbc/dbm 才显示 radius/height */}
            {(typeName === "dbc" || typeName === "dbm") && (
                <>
                    <Flex gap="small">
                        <Form.Item label={t('ColEditor.Radius')} name={[name, "radius"]} initialValue={0.5}>
                            <InputNumber style={{width: "93.5%"}}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('ColEditor.Radius_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>

                    <Flex gap="small">
                        <Form.Item label={t('ColEditor.Height')} name={[name, "height"]}  initialValue={0}>
                            <InputNumber style={{width: "93.5%"}}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('ColEditor.Height_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>
                </>
            )}

            {/* dbm 独有的字段 */}
            {typeName === "dbm" && (
                <>
                    <Flex gap="small">
                        <Form.Item label={t('ColEditor.ScaleRateMulMax')} name={[name, "scaleRateMulMax"]}
                                   initialValue={1}>
                            <InputNumber style={{width: "93.5%"}}/>
                        </Form.Item>
                        <Form.Item>
                            <Tooltip title={t('ColEditor.ScaleRateMulMax_tip')}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </Form.Item>
                    </Flex>

                    <Form.Item label={t('ColEditor.CenterRateMax')}>
                        <Flex gap="middle">
                            <Form.Item name={[name, "centerRateMax", 0]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="CRX"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "centerRateMax", 1]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="CRY"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "centerRateMax", 2]} noStyle initialValue={0}>
                                <InputNumber
                                    addonBefore="CRZ"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item noStyle>
                                <Tooltip title={t('ColEditor.CenterRateMax_tip')}>
                                    <QuestionCircleOutlined/>
                                </Tooltip>
                            </Form.Item>
                            <Form.Item noStyle>
                                <Tooltip title={t('ColEditor.dbm_tip')}>
                                    <QuestionCircleOutlined/>
                                </Tooltip>
                            </Form.Item>
                        </Flex>
                    </Form.Item>
                </>
            )}

            {/* missingCollider 无字段，不需要额外内容 */}
        </div>
    );
};

export default DynamicColliderFormItem