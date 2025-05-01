import React, {useState} from 'react';
import {Button, Empty, Tabs, Tooltip} from 'antd';
import {COM3D2} from '../../../wailsjs/go/models';
import {useTranslation} from "react-i18next";
import {DeleteOutlined, PlusOutlined} from "@ant-design/icons";
import MaterialEditor from './MaterialEditor';
import type {DragEndEvent} from '@dnd-kit/core';
import {
    closestCenter,
    DndContext,
    MeasuringStrategy,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {arrayMove, horizontalListSortingStrategy, SortableContext, useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import Material = COM3D2.Material;

export interface MaterialListEditorProps {
    materials: Material[];
    onMaterialsChange: (materials: Material[]) => void;
}

interface DraggableTabPaneProps extends React.HTMLAttributes<HTMLDivElement> {
    'data-node-key': string;
}

const DraggableTabNode: React.FC<Readonly<DraggableTabPaneProps>> = ({className, ...props}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: props['data-node-key'],
    });

    // 简化样式处理，仅保留必要的变换
    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Transform.toString(transform),
        transition: transition || 'none', // 使用更快地过渡或无过渡
        cursor: 'move',
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 9999 : 'auto', // 使用更高的 z-index
        pointerEvents: isDragging ? 'none' : 'auto', // 拖拽时禁用鼠标事件，减少干扰
    };

    return React.cloneElement(props.children as React.ReactElement<any>, {
        ref: setNodeRef,
        style,
        ...attributes,
        ...listeners,
    });
};

/**
 * MaterialListEditor 组件
 *
 * 用于编辑 Material 对象列表，支持添加、删除和编辑操作
 */
const MaterialListEditor: React.FC<MaterialListEditorProps> = ({
                                                                   materials,
                                                                   onMaterialsChange
                                                               }) => {
    const {t} = useTranslation();
    const [activeKey, setActiveKey] = useState<string | null>(null);

    // 使用分离的鼠标和触摸传感器，提供更轻量级的拖拽体验
    const mouseSensor = useSensor(MouseSensor, {
        // 鼠标传感器配置 - 最小距离和延迟
        activationConstraint: {
            distance: 2,
            delay: 0,
        }
    });

    const touchSensor = useSensor(TouchSensor, {
        // 触摸传感器配置 - 最小距离和延迟
        activationConstraint: {
            distance: 2,
            delay: 0,
        }
    });

    // 组合传感器
    const sensors = useSensors(mouseSensor, touchSensor);

    // 添加新的 Material
    const handleAddMaterial = () => {
        const newMaterial = Material.createFrom({
            Name: `Material_${materials.length}`,
            ShaderName: "",
            ShaderFilename: "",
            Properties: []
        });

        const updatedMaterials = [...materials, newMaterial];
        onMaterialsChange(updatedMaterials);

        // 设置新添加的 Material 为当前活动项
        setActiveKey(`material-${updatedMaterials.length - 1}`);
    };

    // 删除 Material
    const handleDeleteMaterial = (index: number) => {
        const updatedMaterials = [...materials];
        updatedMaterials.splice(index, 1);
        onMaterialsChange(updatedMaterials);

        // 如果删除的是当前活动项，则清除活动项
        if (activeKey === `material-${index}`) {
            setActiveKey(null);
        }
    };

    // 更新 Material
    const handleMaterialChange = (index: number, updatedMaterial: Material) => {
        const updatedMaterials = [...materials];
        updatedMaterials[index] = updatedMaterial;
        onMaterialsChange(updatedMaterials);
    };

    // 处理拖拽结束事件
    const onDragEnd = ({active, over}: DragEndEvent) => {
        if (active.id !== over?.id && over?.id) {
            // 找到拖拽的标签和目标标签的索引
            const activeId = active.id.toString();
            const overId = over.id.toString();

            const activeIndex = parseInt(activeId.split('-')[1]);
            const overIndex = parseInt(overId.split('-')[1]);

            if (!isNaN(activeIndex) && !isNaN(overIndex) && activeIndex !== overIndex) {
                // 重新排序材质列表
                const updatedMaterials = arrayMove([...materials], activeIndex, overIndex);
                onMaterialsChange(updatedMaterials);

                // 更新活动标签
                setActiveKey(`material-${overIndex}`);
            }
        }
    };

    // 生成 Tabs 项
    const items = materials.map((material, index) => ({
        key: `material-${index}`,
        label: (
            <span>
                {index + ': ' + material.Name || `Material_${index}`}
                <Tooltip title={t('ModelEditor.delete_material')}>
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined/>}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMaterial(index);
                        }}
                        style={{marginLeft: 8}}
                    />
                </Tooltip>
            </span>
        ),
        children: (
            <MaterialEditor
                material={material}
                onMaterialChange={(updatedMaterial) => handleMaterialChange(index, updatedMaterial)}
            />
        )
    }));

    return (
        <div>
            {materials.length === 0 ? (
                <Empty description={t('ModelEditor.no_materials')}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined/>}
                        onClick={handleAddMaterial}
                    >
                        {t('ModelEditor.add_material')}
                    </Button>
                </Empty>
            ) : (
                <>
                    <Tabs
                        type="card"
                        activeKey={activeKey || undefined}
                        onChange={setActiveKey}
                        items={items}
                        tabBarExtraContent={
                            <Button
                                type="primary"
                                icon={<PlusOutlined/>}
                                onClick={handleAddMaterial}
                            >
                                {t('ModelEditor.add_material')}
                            </Button>
                        }
                        renderTabBar={(tabBarProps, DefaultTabBar) => (
                            <DndContext
                                sensors={sensors}
                                onDragEnd={onDragEnd}
                                collisionDetection={closestCenter}
                                modifiers={[]}
                                measuring={{
                                    droppable: {
                                        strategy: MeasuringStrategy.Always // 始终测量可放置区域，提高响应速度
                                    }
                                }}
                            >
                                <SortableContext
                                    items={items.map((i) => i.key)}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    <DefaultTabBar {...tabBarProps}>
                                        {(node) => (
                                            <DraggableTabNode
                                                {...(node as React.ReactElement<DraggableTabPaneProps>).props}
                                                key={node.key}
                                            >
                                                {node}
                                            </DraggableTabNode>
                                        )}
                                    </DefaultTabBar>
                                </SortableContext>
                            </DndContext>
                        )}
                    />
                </>
            )}
        </div>
    );
};

export default MaterialListEditor;
