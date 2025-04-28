import React, {useEffect, useRef, useState} from 'react';
import {Button, Form, FormInstance, InputNumber, Space, Table, Tooltip} from 'antd';
import {DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import {useTranslation} from "react-i18next";
import {KeyframeEditorCanvasSizeKey} from "../../utils/LocalStorageKeys";

// 定义关键帧类型
type Keyframe = {
    time: number;
    value: number;
    inTangent: number;
    outTangent: number;
};

// 主组件
const KeyframeEditorWithTable = ({
                                     keyframesFieldName,
                                     form
                                 }: {
    keyframesFieldName: string;
    form: FormInstance;
}) => {
    const {t} = useTranslation();
    const [showVisualEditor, setShowVisualEditor] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // 本地关键帧状态 - 用于视觉编辑器的流畅拖拽
    const [keyframes, setKeyframes] = useState<Keyframe[]>([]);

    // 画布大小
    const [dimensions, setDimensions] = useState(() => {
        const saved = localStorage.getItem(KeyframeEditorCanvasSizeKey);
        return saved ? JSON.parse(saved) : {width: 600, height: 300};
    });

    const svgRef = useRef<SVGSVGElement>(null);
    const resizeRef = useRef<SVGRectElement>(null);

    // 拖拽状态追踪
    const [dragState, setDragState] = useState<{
        isDragging: boolean;
        mode: 'point' | 'inTangent' | 'outTangent' | null;
        index: number | null;
    }>({
        isDragging: false,
        mode: null,
        index: null
    });

    // 常量
    const {width, height} = dimensions; // 画布尺寸
    const pointRadius = 6; // 关键帧点半径
    const handleLength = width * 0.1; // 控制点手柄长度

    // 从表单同步到本地状态
    const syncFromForm = () => {
        const formKeyframes = form.getFieldValue(keyframesFieldName) || [];
        setKeyframes([...formKeyframes]);
    };

    // 更新表单数据
    const updateFormKeyframes = (updatedKeyframes: Keyframe[]) => {
        const sortedKeyframes = [...updatedKeyframes].sort((a, b) => a.time - b.time);
        form.setFieldValue(keyframesFieldName, sortedKeyframes);
        setKeyframes(sortedKeyframes);
    };

    // 初始化并监听表单变化
    useEffect(() => {
        // 初始加载表单数据到本地状态
        syncFromForm();

        // 监听表单字段变化
        const unsubscribe = form.getFieldInstance(keyframesFieldName)?.props?.onChange?.subscribe(() => {
            // 只有当不在拖拽状态时，才从表单同步数据
            if (!dragState.isDragging) {
                syncFromForm();
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [keyframesFieldName, dragState.isDragging]);

    // 当表单值变化时，重新同步数据
    useEffect(() => {
        // 确保表单中有数据时同步一次
        const formValue = form.getFieldValue(keyframesFieldName);
        if (formValue && formValue.length > 0) {
            syncFromForm();
        }
    }, [form, keyframesFieldName]);

    // 当显示可视化编辑器时，确保数据已同步
    useEffect(() => {
        if (showVisualEditor) {
            // 添加小延迟确保表单数据已完全加载
            setTimeout(() => {
                syncFromForm();
            }, 50);
        }
    }, [showVisualEditor]);

    // 处理画布大小调整
    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!svgRef.current) return;

            const svgRect = svgRef.current.getBoundingClientRect();
            const minSize = 100;
            const maxSize = 5000;

            const newWidth = Math.max(minSize, Math.min(moveEvent.clientX - svgRect.left + 12, maxSize));
            const newHeight = Math.max(minSize, Math.min(moveEvent.clientY - svgRect.top + 12, maxSize));

            setDimensions({
                width: newWidth,
                height: newHeight
            });

            localStorage.setItem(KeyframeEditorCanvasSizeKey, JSON.stringify({
                width: newWidth,
                height: newHeight
            }))
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // 处理关键帧点开始拖拽
    const handlePointMouseDown = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setSelectedIndex(index);
        setDragState({
            isDragging: true,
            mode: 'point',
            index
        });

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!svgRef.current) return;

            const rect = svgRef.current.getBoundingClientRect();
            const rawX = (moveEvent.clientX - rect.left) / dimensions.width;
            const rawY = 1 - (moveEvent.clientY - rect.top) / dimensions.height;
            const x = Math.max(0, Math.min(1, rawX));
            const y = Math.max(0, Math.min(1, rawY));

            // 更新本地状态而不是表单
            const updatedKeyframes = [...keyframes];

            // 确保时间值在合理范围内且不会超过相邻关键帧
            if (index > 0 && index < updatedKeyframes.length - 1) {
                const minTime = updatedKeyframes[index - 1].time;
                const maxTime = updatedKeyframes[index + 1].time;
                updatedKeyframes[index].time = Math.max(minTime, Math.min(maxTime, x));
            } else if (index === 0 && updatedKeyframes.length > 1) {
                updatedKeyframes[index].time = Math.min(updatedKeyframes[1].time, x);
            } else if (index === updatedKeyframes.length - 1 && index > 0) {
                updatedKeyframes[index].time = Math.max(updatedKeyframes[index - 1].time, x);
            } else {
                updatedKeyframes[index].time = x;
            }

            // 更新值
            updatedKeyframes[index].value = y;

            // 只更新本地状态，不更新表单
            setKeyframes(updatedKeyframes);
        };

        const handleMouseUp = () => {
            // 拖拽结束时，将本地状态同步到表单
            updateFormKeyframes(keyframes);

            setDragState({
                isDragging: false,
                mode: null,
                index: null
            });

            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // 处理切线控制点开始拖拽
    const handleTangentMouseDown = (e: React.MouseEvent, index: number, isOutTangent: boolean) => {
        e.stopPropagation();
        setSelectedIndex(index);
        setDragState({
            isDragging: true,
            mode: isOutTangent ? 'outTangent' : 'inTangent',
            index
        });

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!svgRef.current) return;

            const rect = svgRef.current.getBoundingClientRect();
            const updatedKeyframes = [...keyframes];
            const keyframe = updatedKeyframes[index];

            const x = keyframe.time * width;
            const y = height - keyframe.value * height;

            const mouseX = moveEvent.clientX - rect.left;
            const mouseY = moveEvent.clientY - rect.top;

            // 计算切线角度
            const dx = mouseX - x;
            const dy = mouseY - y;

            // 避免除以零的情况
            if (Math.abs(dx) < 0.001) return;

            const tangentValue = -dy / dx; // 注意Y轴是反的

            // 更新切线值
            if (isOutTangent) {
                updatedKeyframes[index].outTangent = tangentValue;
            } else {
                updatedKeyframes[index].inTangent = tangentValue;
            }

            // 只更新本地状态，不更新表单
            setKeyframes(updatedKeyframes);
        };

        const handleMouseUp = () => {
            // 拖拽结束时，将本地状态同步到表单
            updateFormKeyframes(keyframes);

            setDragState({
                isDragging: false,
                mode: null,
                index: null
            });

            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // 添加新关键帧
    const addKeyframe = (e: React.MouseEvent) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / width;
        const y = 1 - (e.clientY - rect.top) / height;

        // 创建新的关键帧
        const newKeyframe = {
            time: x,
            value: y,
            inTangent: 0,
            outTangent: 0
        };

        // 获取所有关键帧并按时间排序
        const allKeyframes = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);

        // 更新表单数据和本地状态
        updateFormKeyframes(allKeyframes);

        // 选中新添加的关键帧
        setSelectedIndex(allKeyframes.findIndex(kf => kf === newKeyframe));
    };

    // 渲染关键帧曲线
    const renderCurve = () => {
        if (keyframes.length < 2) return null;

        const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);
        const paths = [];

        for (let i = 0; i < sortedKeyframes.length - 1; i++) {
            const kf1 = sortedKeyframes[i];
            const kf2 = sortedKeyframes[i + 1];

            const x1 = kf1.time * width;
            const y1 = height - kf1.value * height;
            const x2 = kf2.time * width;
            const y2 = height - kf2.value * height;

            const [cp1x, cp1y, cp2x, cp2y] = calculateControlPoints(kf1, kf2, width, height);

            paths.push(
                <path
                    key={i}
                    d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`}
                    fill="none"
                    stroke="#1890ff"
                    strokeWidth="2"
                />
            );
        }

        return paths;
    };

    // 渲染关键帧点和控制点
    const renderKeyframePoints = () => {
        return keyframes.map((kf: Keyframe, index: number) => {
            const x = kf.time * width;
            const y = height - kf.value * height;
            const isSelected = index === selectedIndex;

            // 计算控制点位置，使用单位向量来保持恒定距离
            const calculateControlPoint = (tangent: number, isOut: boolean) => {
                const magnitude = Math.sqrt(1 + tangent * tangent);
                const dirX = 1 / magnitude * (isOut ? 1 : -1);
                const dirY = tangent / magnitude * (isOut ? -1 : 1);
                return {
                    x: x + dirX * handleLength,
                    y: y + dirY * handleLength
                };
            };

            const outControl = calculateControlPoint(kf.outTangent, true);
            const inControl = calculateControlPoint(kf.inTangent, false);

            return (
                <g key={index}>
                    {/* 当关键帧被选中时，显示切线控制线 */}
                    {isSelected && (
                        <>
                            {/* 入切线控制线 */}
                            <line
                                x1={x}
                                y1={y}
                                x2={inControl.x}
                                y2={inControl.y}
                                stroke="#aaa"
                                strokeWidth="1"
                                strokeDasharray="3,3"
                            />
                            {/* 出切线控制线 */}
                            <line
                                x1={x}
                                y1={y}
                                x2={outControl.x}
                                y2={outControl.y}
                                stroke="#aaa"
                                strokeWidth="1"
                                strokeDasharray="3,3"
                            />
                            {/* 入切线控制点 */}
                            <circle
                                cx={inControl.x}
                                cy={inControl.y}
                                r={4}
                                fill="#ff7875"
                                stroke="#333"
                                strokeWidth="1"
                                onMouseDown={(e) => handleTangentMouseDown(e, index, false)}
                                style={{cursor: 'pointer'}}
                            />
                            {/* 出切线控制点 */}
                            <circle
                                cx={outControl.x}
                                cy={outControl.y}
                                r={4}
                                fill="#ff7875"
                                stroke="#333"
                                strokeWidth="1"
                                onMouseDown={(e) => handleTangentMouseDown(e, index, true)}
                                style={{cursor: 'pointer'}}
                            />
                        </>
                    )}

                    {/* 关键帧点 */}
                    <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? pointRadius + 2 : pointRadius}
                        fill={isSelected ? "#52c41a" : "#1890ff"}
                        stroke="#333"
                        strokeWidth="1"
                        onMouseDown={(e) => handlePointMouseDown(e, index)}
                        style={{cursor: 'pointer'}}
                    />
                </g>
            );
        });
    };

    // 处理表单字段值变化
    const handleFormItemChange = () => {
        // 当不在拖拽时，同步表单数据到本地状态
        if (!dragState.isDragging) {
            syncFromForm();
        }
    };

    return (
        <>
            <div style={{marginBottom: 16, textAlign: 'left'}}>
                <Space>
                    <Button
                        icon={showVisualEditor ? <EyeInvisibleOutlined/> : <EyeOutlined/>}
                        onClick={() => {
                            // 切换显示状态
                            const newState = !showVisualEditor;
                            setShowVisualEditor(newState);

                            // 如果是显示可视化编辑器，确保数据同步
                            if (newState) {
                                syncFromForm();
                            }
                        }}
                    >
                        {showVisualEditor ? t('Common.KeyFrameEditor.hide_visual_editor') : t('Common.KeyFrameEditor.show_visual_editor')}
                    </Button>
                    <Tooltip title={t('Common.KeyFrameEditor.keyframe_tip')}>
                        <QuestionCircleOutlined/>
                    </Tooltip>
                </Space>
            </div>

            {showVisualEditor && (
                <div className="border border-gray-200 rounded bg-white mb-4" style={{textAlign: 'center'}}>
                    <svg
                        ref={svgRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                        onDoubleClick={addKeyframe}
                        style={{cursor: 'crosshair'}}
                    >
                        {/* 绘制网格 */}
                        <g>
                            {Array.from({length: 11}).map((_, i) => (
                                <line
                                    key={`h-${i}`}
                                    x1="0"
                                    y1={i * height / 10}
                                    x2={width}
                                    y2={i * height / 10}
                                    stroke="#f0f0f0"
                                    strokeWidth="1"
                                />
                            ))}
                            {Array.from({length: 11}).map((_, i) => (
                                <line
                                    key={`v-${i}`}
                                    x1={i * width / 10}
                                    y1="0"
                                    x2={i * width / 10}
                                    y2={height}
                                    stroke="#f0f0f0"
                                    strokeWidth="1"
                                />
                            ))}
                        </g>

                        {/* 绘制坐标轴刻度 */}
                        <g className="axis-labels" style={{
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none',
                            pointerEvents: 'none'
                        }}>
                            {/* 横向时间轴刻度 */}
                            {Array.from({length: 11}).map((_, i) => {
                                const xPos = width * i / 10;
                                return (
                                    <text
                                        key={`time-label-${i}`}
                                        x={i === 0 ? xPos + 2 : i === 10 ? xPos - 12 : xPos}
                                        y={height - 4}
                                        fill="#666"
                                        fontSize="10"
                                        textAnchor={i === 0 ? 'start' : i === 10 ? 'end' : 'middle'}
                                    >
                                        {i / 10}
                                    </text>
                                );
                            })}

                            {/* 纵向数值轴刻度 */}
                            {Array.from({length: 11}).map((_, i) => {
                                const yPos = height - height * i / 10;
                                return (
                                    <text
                                        key={`value-label-${i}`}
                                        x={8}
                                        y={i === 0 ? yPos - 2 : i === 10 ? yPos + 2 : yPos + 3}
                                        fill="#666"
                                        fontSize="10"
                                        textAnchor="start"
                                        dominantBaseline={i === 10 ? 'text-before-edge' : 'auto'}
                                    >
                                        {i / 10}
                                    </text>
                                );
                            })}
                        </g>

                        {/* 绘制曲线 */}
                        {renderCurve()}

                        {/* 绘制关键帧点 */}
                        {renderKeyframePoints()}

                        {/* 调整画布大小手柄 */}
                        <rect
                            ref={resizeRef}
                            x={dimensions.width - 10}
                            y={dimensions.height - 10}
                            width={8}
                            height={8}
                            fill="#fff"
                            stroke="#333"
                            strokeWidth="1"
                            onMouseDown={handleResizeMouseDown}
                            style={{cursor: 'se-resize'}}
                        />
                    </svg>

                    <div style={{
                        padding: 8,
                        borderTop: '1px solid #f0f0f0',
                        fontSize: 12,
                        color: '#888',
                        display: 'flex',
                        position: 'relative',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <span style={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)'
                        }}>
                            {t('Common.KeyFrameEditor.visual_editor_tip')}
                        </span>
                        <div style={{
                            display: 'flex',
                            gap: 8,
                            marginLeft: 'auto' // 输入框容器右对齐
                        }}>
                            <InputNumber
                                size='small'
                                style={{width: '100px'}}
                                value={dimensions.width}
                                onChange={(value) => {
                                    const newWidth = Number(value) || 600;
                                    setDimensions((prev: any) => ({...prev, width: newWidth}));
                                    localStorage.setItem(KeyframeEditorCanvasSizeKey, JSON.stringify({
                                        ...dimensions,
                                        width: newWidth
                                    }));
                                }}
                                addonBefore={t('Common.width')}
                            />
                            <InputNumber
                                size='small'
                                style={{width: '100px'}}
                                value={dimensions.height}
                                onChange={(value) => {
                                    const newHeight = Number(value) || 300;
                                    setDimensions((prev: any) => ({...prev, height: newHeight}));
                                    localStorage.setItem(KeyframeEditorCanvasSizeKey, JSON.stringify({
                                        ...dimensions,
                                        height: newHeight
                                    }));
                                }}
                                addonBefore={t('Common.height')}
                            />
                        </div>
                    </div>

                </div>
            )}

            {/* Table 编辑器 */}
            <Form form={form}>{/* 必须，否则 Form.List 无法找到动态数据列 */}
                <Form.List name={keyframesFieldName}>
                    {(fields, {add, remove}) => (
                        <>
                            <Table
                                dataSource={fields}
                                rowKey="name"
                                size="small"
                                bordered
                                pagination={false}
                                footer={() => (
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            const currentKeyframes = form.getFieldValue(keyframesFieldName) || [];
                                            // 计算当前最大时间和对应的值
                                            const maxTime = currentKeyframes.length > 0
                                                ? Math.max(...currentKeyframes.map((kf: {
                                                    time: number;
                                                }) => kf.time)) : 0;

                                            add({
                                                time: Math.min(maxTime + 0.1, 1),
                                                value: 0,
                                                inTangent: 0,
                                                outTangent: 0
                                            });
                                            // 添加完后同步一次表单数据
                                            setTimeout(syncFromForm, 0);
                                        }}
                                        style={{width: '100%'}}
                                    >
                                        {t('Common.KeyFrameEditor.add_keyframe')}
                                    </Button>
                                )}
                                columns={[
                                    {
                                        title: t('Common.KeyFrameEditor.keyframe'),
                                        children: [
                                            {
                                                title: t('Common.KeyFrameEditor.Time'),
                                                width: 100,
                                                render: (_, field) => {
                                                    const {key, ...restField} = field;
                                                    return (
                                                        <Form.Item
                                                            key={key}
                                                            {...restField}
                                                            name={[field.name, 'time']}
                                                            style={{margin: 0}}
                                                        >
                                                            <InputNumber
                                                                style={{width: '100%'}}
                                                                min={0}
                                                                max={1}
                                                                step={0.01}
                                                                onChange={handleFormItemChange}
                                                            />
                                                        </Form.Item>
                                                    );
                                                }
                                            },
                                            {
                                                title: t('Common.KeyFrameEditor.Value'),
                                                width: 100,
                                                render: (_, field) => {
                                                    const {key, ...restField} = field;
                                                    return (
                                                        <Form.Item
                                                            key={key}
                                                            {...restField}
                                                            name={[field.name, 'value']}
                                                            style={{margin: 0}}
                                                        >
                                                            <InputNumber
                                                                style={{width: '100%'}}
                                                                step={0.01}
                                                                onChange={handleFormItemChange}
                                                            />
                                                        </Form.Item>
                                                    );
                                                }
                                            },
                                            {
                                                title: t('Common.KeyFrameEditor.InTangent'),
                                                width: 100,
                                                render: (_, field) => {
                                                    const {key, ...restField} = field;
                                                    return (
                                                        <Form.Item
                                                            key={key}
                                                            {...restField}
                                                            name={[field.name, 'inTangent']}
                                                            style={{margin: 0}}
                                                        >
                                                            <InputNumber
                                                                style={{width: '100%'}}
                                                                step={0.01}
                                                                onChange={handleFormItemChange}
                                                            />
                                                        </Form.Item>
                                                    );
                                                }
                                            },
                                            {
                                                title: t('Common.KeyFrameEditor.OutTangent'),
                                                width: 100,
                                                render: (_, field) => {
                                                    const {key, ...restField} = field;
                                                    return (
                                                        <Form.Item
                                                            key={key}
                                                            {...restField}
                                                            name={[field.name, 'outTangent']}
                                                            style={{margin: 0}}
                                                        >
                                                            <InputNumber
                                                                style={{width: '100%'}}
                                                                step={0.01}
                                                                onChange={handleFormItemChange}
                                                            />
                                                        </Form.Item>
                                                    );
                                                }
                                            },
                                            {
                                                title: t('Common.KeyFrameEditor.operate'),
                                                width: 80,
                                                render: (_, field) => (
                                                    <Button
                                                        icon={<DeleteOutlined/>}
                                                        onClick={() => {
                                                            remove(field.name);
                                                            // 删除后同步一次表单数据
                                                            setTimeout(syncFromForm, 0);
                                                        }}
                                                        size="small"
                                                    />
                                                )
                                            }
                                        ]
                                    }
                                ]}
                            />
                        </>
                    )}
                </Form.List>
            </Form>
        </>
    );
};

// 辅助函数：计算贝塞尔曲线控制点
const calculateControlPoints = (kf1: Keyframe, kf2: Keyframe, width: number, height: number): [number, number, number, number] => {
    // 时间范围映射到宽度
    const x1 = kf1.time * width;
    const x2 = kf2.time * width;

    // 值范围映射到高度（反转Y轴）
    const y1 = height - kf1.value * height;
    const y2 = height - kf2.value * height;

    // 计算控制点距离
    const dx = x2 - x1;

    // 控制点1：基于第一个关键帧的出切线
    const cp1x = x1 + dx / 3;
    const cp1y = y1 - kf1.outTangent * dx / 3;

    // 控制点2：基于第二个关键帧的入切线
    const cp2x = x2 - dx / 3;
    const cp2y = y2 + kf2.inTangent * dx / 3;

    return [cp1x, cp1y, cp2x, cp2y];
};

export default KeyframeEditorWithTable;