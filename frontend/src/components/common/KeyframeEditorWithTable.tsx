import React, {useEffect, useRef, useState} from 'react';
import {Button, Form, FormInstance, InputNumber, Space, Table, Tooltip} from 'antd';
import {DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import {useTranslation} from "react-i18next";

// 定义关键帧类型
type Keyframe = {
    time: number;
    value: number;
    inTangent: number;
    outTangent: number;
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
    const [editMode, setEditMode] = useState<'time' | 'value' | 'inTangent' | 'outTangent' | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // 添加一个本地状态用于拖拽过程中
    const [localKeyframes, setLocalKeyframes] = useState<Keyframe[]>([]);
    const isDraggingRef = useRef(false);
    const formKeyframesRef = useRef<Keyframe[]>([]);

    // 画布大小
    const [dimensions, setDimensions] = useState({width: 600, height: 300});
    const resizeRef = useRef<SVGRectElement>(null);
    const isResizing = useRef(false);

    // 常量
    const width = dimensions.width;
    const height = dimensions.height;
    const pointRadius = 6;
    const handleLength = 50;


    // 处理画布大小调整
    const handleResizeMouseDown = () => {
        isResizing.current = true;
        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp);
    };

    const handleResizeMouseMove = (e: MouseEvent) => {
        if (!isResizing.current || !svgRef.current) return;

        const minSize = 100;
        const maxSize = 5000;
        // 计算相对于 SVG 画布的实际边界
        const svgRect = svgRef.current.getBoundingClientRect();
        const newWidth = Math.max(minSize, Math.min(e.clientX - svgRect.left + 12, maxSize)); // +12 补偿手柄宽度
        const newHeight = Math.max(minSize, Math.min(e.clientY - svgRect.top + 12, maxSize));

        setDimensions({
            width: newWidth,
            height: newHeight
        });
    };

    const handleResizeMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);
    };


    // 监听画布大小调整
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleResizeMouseMove);
            document.removeEventListener('mouseup', handleResizeMouseUp);
        };
    }, []);

    // 获取当前表单中的关键帧数据
    const getKeyframesFormData = () => {
        const formValues = form.getFieldValue(keyframesFieldName) || [];
        return formValues.map((kf: Keyframe) => ({
            time: kf.time,
            value: kf.value,
            inTangent: kf.inTangent,
            outTangent: kf.outTangent
        }));
    };

    // 监听表单值变化
    useEffect(() => {
        // 添加表单值变化监听器
        const unsubscribe = form.getFieldInstance(keyframesFieldName)?.props?.onChange?.subscribe(() => {
            if (!isDraggingRef.current) {
                const currentFormData = getKeyframesFormData();
                formKeyframesRef.current = currentFormData;
                setLocalKeyframes(currentFormData);
            }
        });

        // 初始化本地状态
        const initialData = getKeyframesFormData();
        formKeyframesRef.current = initialData;
        setLocalKeyframes(initialData);

        return () => {
            // 清理监听器
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // 添加对表单数据的监听
    useEffect(() => {
        const valueChangeHandler = () => {
            if (!isDraggingRef.current) {
                const newFormData = getKeyframesFormData();
                // 判断数据是否真的变化了
                const formDataString = JSON.stringify(newFormData);
                const localDataString = JSON.stringify(formKeyframesRef.current);

                if (formDataString !== localDataString) {
                    formKeyframesRef.current = newFormData;
                    setLocalKeyframes(newFormData);
                }
            }
        };

        // 监听表单变化
        const interval = setInterval(valueChangeHandler, 100);

        return () => {
            clearInterval(interval);
        };
    }, [form, keyframesFieldName]);

    // 处理拖动关键帧点
    const handlePointDrag = (e: React.MouseEvent | MouseEvent, index: number) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const rawX = (e.clientX - rect.left) / dimensions.width;
        const rawY = 1 - (e.clientY - rect.top) / dimensions.height;
        const x = Math.max(0, Math.min(1, rawX));
        const y = Math.max(0, Math.min(1, rawY));

        // 更新本地状态而不是直接更新表单
        const updatedKeyframes = [...localKeyframes];

        // 确保时间值在合理范围内且不会超过相邻关键帧
        if (index > 0 && index < updatedKeyframes.length - 1) {
            const minTime = updatedKeyframes[index - 1].time;
            const maxTime = updatedKeyframes[index + 1].time;
            updatedKeyframes[index].time = Math.max(minTime, Math.min(maxTime, x));
        } else if (index === 0) {
            updatedKeyframes[index].time = Math.min(updatedKeyframes[1]?.time || 1, x);
        } else if (index === updatedKeyframes.length - 1) {
            updatedKeyframes[index].time = Math.max(updatedKeyframes[updatedKeyframes.length - 2]?.time || 0, x);
        }

        // 设置值
        updatedKeyframes[index].value = Math.max(0, Math.min(1, y));

        // 更新本地状态
        setLocalKeyframes(updatedKeyframes);
    };

    // 处理拖动切线控制点
    const handleTangentDrag = (e: React.MouseEvent | MouseEvent, index: number, isOutTangent: boolean) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const keyframe = localKeyframes[index];
        const x = keyframe.time * width;
        const y = height - keyframe.value * height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 计算切线角度
        const dx = mouseX - x;
        const dy = mouseY - y;

        // 避免除以零的情况
        if (Math.abs(dx) < 0.001) return;

        const tangentValue = -dy / dx; // 注意Y轴是反的

        // 更新本地状态
        const updatedKeyframes = [...localKeyframes];

        // 更新切线值
        if (isOutTangent) {
            updatedKeyframes[index].outTangent = tangentValue;
        } else {
            updatedKeyframes[index].inTangent = tangentValue;
        }

        // 更新本地状态
        setLocalKeyframes(updatedKeyframes);
    };

    // 添加新关键帧
    const addKeyframe = (e: React.MouseEvent) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / width;
        const y = 1 - (e.clientY - rect.top) / height;

        // 获取当前表单数据
        const formData = form.getFieldValue(keyframesFieldName) || [];

        // 创建新的关键帧
        const newKeyframe = {
            time: x,
            value: y,
            inTangent: 0,
            outTangent: 0
        };

        // 获取所有关键帧并按时间排序
        const allKeyframes = [...formData, newKeyframe].sort((a, b) => a.time - b.time);

        // 更新表单数据
        form.setFieldsValue({
            [keyframesFieldName]: allKeyframes
        });

        // 手动更新本地状态
        formKeyframesRef.current = allKeyframes;
        setLocalKeyframes(allKeyframes);

        // 选中新添加的关键帧
        setSelectedIndex(allKeyframes.findIndex(kf => kf === newKeyframe));
    };

    // 提交拖拽结果到表单
    const commitChangesToForm = () => {
        // 保存当前表单状态以便比较
        const beforeFormData = form.getFieldValue(keyframesFieldName);
        const beforeFormJSON = JSON.stringify(beforeFormData);
        const localKeyframesJSON = JSON.stringify(localKeyframes);

        // 只有当数据确实发生变化时才更新表单
        if (beforeFormJSON !== localKeyframesJSON) {
            form.setFieldsValue({
                [keyframesFieldName]: localKeyframes
            });
            formKeyframesRef.current = [...localKeyframes];
        }
    };

    // 渲染关键帧曲线
    const renderCurve = () => {
        if (localKeyframes.length < 2) return null;

        const sortedKeyframes = [...localKeyframes].sort((a, b) => a.time - b.time);
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
        return localKeyframes.map((kf: Keyframe, index: number) => {
            const x = kf.time * width;
            const y = height - kf.value * height;
            const isSelected = index === selectedIndex;

            // 计算控制点位置
            const outControlX = x + handleLength;
            const outControlY = y - kf.outTangent * handleLength;
            const inControlX = x - handleLength;
            const inControlY = y + kf.inTangent * handleLength;

            return (
                <g key={index}>
                    {/* 当关键帧被选中时，显示切线控制线 */}
                    {isSelected && (
                        <>
                            {/* 入切线控制线 */}
                            <line
                                x1={x}
                                y1={y}
                                x2={inControlX}
                                y2={inControlY}
                                stroke="#aaa"
                                strokeWidth="1"
                                strokeDasharray="3,3"
                            />
                            {/* 出切线控制线 */}
                            <line
                                x1={x}
                                y1={y}
                                x2={outControlX}
                                y2={outControlY}
                                stroke="#aaa"
                                strokeWidth="1"
                                strokeDasharray="3,3"
                            />
                            {/* 入切线控制点 */}
                            <circle
                                cx={inControlX}
                                cy={inControlY}
                                r={4}
                                fill="#ff7875"
                                stroke="#333"
                                strokeWidth="1"
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    setSelectedIndex(index);
                                    setEditMode('inTangent');
                                    isDraggingRef.current = true;
                                }}
                                style={{cursor: 'pointer'}}
                            />
                            {/* 出切线控制点 */}
                            <circle
                                cx={outControlX}
                                cy={outControlY}
                                r={4}
                                fill="#ff7875"
                                stroke="#333"
                                strokeWidth="1"
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    setSelectedIndex(index);
                                    setEditMode('outTangent');
                                    isDraggingRef.current = true;
                                }}
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
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedIndex(index);
                            setEditMode('value');
                            isDraggingRef.current = true;
                        }}
                        style={{cursor: 'pointer'}}
                    />
                </g>
            );
        });
    };

    // 使用 requestAnimationFrame 来优化拖动性能
    useEffect(() => {
        let animationFrameId: number;

        const updateDrag = () => {
            if (editMode !== null && selectedIndex !== null) {
                animationFrameId = requestAnimationFrame(updateDrag);
            }
        };

        if (editMode !== null && selectedIndex !== null) {
            animationFrameId = requestAnimationFrame(updateDrag);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [editMode, selectedIndex]);

    // 处理鼠标移动
    useEffect(() => {
        if (editMode === null || selectedIndex === null) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (editMode === 'value' || editMode === 'time') {
                handlePointDrag(e, selectedIndex);
            } else if (editMode === 'inTangent') {
                handleTangentDrag(e, selectedIndex, false);
            } else if (editMode === 'outTangent') {
                handleTangentDrag(e, selectedIndex, true);
            }
        };

        const handleMouseUp = () => {
            setEditMode(null);
            isDraggingRef.current = false;
            // 在鼠标释放时提交更改到表单
            commitChangesToForm();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [editMode, selectedIndex, localKeyframes]);

    return (
        <>
            <div style={{marginBottom: 16, textAlign: 'left'}}>
                <Space>
                    <Button
                        icon={showVisualEditor ? <EyeInvisibleOutlined/> : <EyeOutlined/>}
                        onClick={() => setShowVisualEditor(!showVisualEditor)}
                    >
                        {showVisualEditor ? t('PhyEditor.hide_visual_editor') : t('PhyEditor.show_visual_editor')}
                    </Button>
                    <Tooltip title={t('PhyEditor.keyframe_tip')}>
                        <QuestionCircleOutlined/>
                    </Tooltip>
                </Space>
            </div>

            {showVisualEditor && (
                <div className="border border-gray-200 rounded bg-white mb-4" style={{textAlign:'center'}}>
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

                    <div style={{padding: 8, borderTop: '1px solid #f0f0f0', fontSize: 12, color: '#888'}}>
                        {t('PhyEditor.visual_editor_tip')}
                    </div>
                </div>
            )}

            {/* 原有的 Table 编辑器 */}
            <Form.List name={keyframesFieldName}>
                {(fields, {add, remove}) => (
                    <>
                        <Table
                            dataSource={fields}
                            rowKey="name"
                            size="small"
                            bordered
                            pagination={false}
                            footer={() =>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        add({time: 0, value: 0, inTangent: 0, outTangent: 0});
                                        // 强制更新本地状态
                                        setTimeout(() => {
                                            const newData = getKeyframesFormData();
                                            formKeyframesRef.current = newData;
                                            setLocalKeyframes(newData);
                                        }, 0);
                                    }}
                                    style={{width: '100%'}}
                                >
                                    {t('PhyEditor.add_keyframe')}
                                </Button>}
                            columns={[
                                {
                                    title: t('PhyEditor.keyframe'),
                                    children: [
                                        {
                                            title: t('PhyEditor.Time'),
                                            width: 100,
                                            render: (_, field) => (
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'time']}
                                                    style={{margin: 0}}
                                                >
                                                    <InputNumber
                                                        style={{width: '100%'}}
                                                        min={0}
                                                        max={1}
                                                        step={0.01}
                                                        onChange={() => {
                                                            // 输入框值变化后更新本地状态
                                                            setTimeout(() => {
                                                                const newData = getKeyframesFormData();
                                                                formKeyframesRef.current = newData;
                                                                setLocalKeyframes(newData);
                                                            }, 0);
                                                        }}
                                                    />
                                                </Form.Item>
                                            )
                                        },
                                        {
                                            title: t('PhyEditor.Value'),
                                            width: 100,
                                            render: (_, field) => (
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'value']}
                                                    style={{margin: 0}}
                                                >
                                                    <InputNumber
                                                        style={{width: '100%'}}
                                                        step={0.01}
                                                        onChange={() => {
                                                            setTimeout(() => {
                                                                const newData = getKeyframesFormData();
                                                                formKeyframesRef.current = newData;
                                                                setLocalKeyframes(newData);
                                                            }, 0);
                                                        }}
                                                    />
                                                </Form.Item>
                                            )
                                        },
                                        {
                                            title: t('PhyEditor.InTangent'),
                                            width: 100,
                                            render: (_, field) => (
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'inTangent']}
                                                    style={{margin: 0}}
                                                >
                                                    <InputNumber
                                                        style={{width: '100%'}}
                                                        step={0.01}
                                                        onChange={() => {
                                                            setTimeout(() => {
                                                                const newData = getKeyframesFormData();
                                                                formKeyframesRef.current = newData;
                                                                setLocalKeyframes(newData);
                                                            }, 0);
                                                        }}
                                                    />
                                                </Form.Item>
                                            )
                                        },
                                        {
                                            title: t('PhyEditor.OutTangent'),
                                            width: 100,
                                            render: (_, field) => (
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'outTangent']}
                                                    style={{margin: 0}}
                                                >
                                                    <InputNumber
                                                        style={{width: '100%'}}
                                                        step={0.01}
                                                        onChange={() => {
                                                            setTimeout(() => {
                                                                const newData = getKeyframesFormData();
                                                                formKeyframesRef.current = newData;
                                                                setLocalKeyframes(newData);
                                                            }, 0);
                                                        }}
                                                    />
                                                </Form.Item>
                                            )
                                        },
                                        {
                                            title: t('PhyEditor.operate'),
                                            width: 80,
                                            render: (_, field) => (
                                                <Button
                                                    icon={<DeleteOutlined/>}
                                                    onClick={() => {
                                                        remove(field.name);
                                                        // 删除后更新本地状态
                                                        setTimeout(() => {
                                                            const newData = getKeyframesFormData();
                                                            formKeyframesRef.current = newData;
                                                            setLocalKeyframes(newData);
                                                        }, 0);
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
        </>
    );
};

export default KeyframeEditorWithTable;