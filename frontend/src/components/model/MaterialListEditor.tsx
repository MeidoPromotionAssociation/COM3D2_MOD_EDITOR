import React, {lazy, Suspense, useCallback, useMemo, useState} from 'react';
import {Button, Empty, Tabs, Tooltip} from 'antd';
import {COM3D2} from '../../../wailsjs/go/models';
import {useTranslation} from "react-i18next";
import {DeleteOutlined, PlusOutlined} from "@ant-design/icons";
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
// Lazy load MaterialEditor component
const MaterialEditor = lazy(() => import('./MaterialEditor'));
import Material = COM3D2.Material;

export interface MaterialListEditorProps {
    materials: Material[];
    onMaterialsChange: (materials: Material[]) => void;
}

interface DraggableTabPaneProps extends React.HTMLAttributes<HTMLDivElement> {
    'data-node-key': string;
}

const DraggableTabNode = React.memo<Readonly<DraggableTabPaneProps>>(({className, ...props}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: props['data-node-key'],
    });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Transform.toString(transform),
        transition: 'none',
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 9999 : 'auto',
    };

    const child = props.children as React.ReactElement;
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            {child}
        </div>
    );
});

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
    const [isTabSwitching, setIsTabSwitching] = useState(false);

    // 使用鼠标传感器
    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: {
            distance: 10,
            delay: 100,
        }
    });

    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: {
            distance: 10,
            delay: 100,
        }
    });

    // 添加点击事件处理函数
    const handleTabClick = useCallback((key: string) => {
        // 如果点击的是当前标签，不做任何处理
        if (key === activeKey) return;

        // 设置正在切换标签状态
        setIsTabSwitching(true);

        // 立即更新标签选中状态，使 UI 响应更快
        setActiveKey(key);

        // 在微小延迟后重置切换状态，允许内容渲染
        requestAnimationFrame(() => {
            setIsTabSwitching(false);
        });
    }, [activeKey]);

    // 组合传感器
    const sensors = useSensors(mouseSensor, touchSensor);

    // 添加新的 Material
    const handleAddMaterial = useCallback(() => {
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
    }, [materials, onMaterialsChange]);

    // 删除 Material
    const handleDeleteMaterial = useCallback((index: number) => {
        const updatedMaterials = [...materials];
        updatedMaterials.splice(index, 1);
        onMaterialsChange(updatedMaterials);

        // 如果删除的是当前活动项，则清除活动项
        if (activeKey === `material-${index}`) {
            setActiveKey(null);
        }
    }, [activeKey, materials, onMaterialsChange]);

    // 更新 Material
    const handleMaterialChange = useCallback((index: number, updatedMaterial: Material) => {
        const updatedMaterials = [...materials];
        updatedMaterials[index] = updatedMaterial;
        onMaterialsChange(updatedMaterials);
    }, [materials, onMaterialsChange]);

    // 处理拖拽结束事件
    const onDragEnd = useCallback(({active, over}: DragEndEvent) => {
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
            }
        }
    }, [materials, onMaterialsChange]);

    // 生成 Tabs 项 - 使用 useMemo 缓存以避免不必要的重新渲染
    const items = useMemo(() => materials.map((material, index) => ({
        key: `material-${index}`,
        label: (
            <span style={{cursor: 'pointer'}}>
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
            <Suspense fallback={<div style={{padding: '20px', textAlign: 'center'}}>Loading editor...</div>}>
                {/* 仅当标签切换完成后渲染内容，或者当前标签就是活动标签 */}
                {(!isTabSwitching || `material-${index}` === activeKey) && (
                    <MaterialEditor
                        material={material}
                        onMaterialChange={(updatedMaterial) => handleMaterialChange(index, updatedMaterial)}
                    />
                )}
            </Suspense>
        )
    })), [materials, t, handleDeleteMaterial, handleMaterialChange, isTabSwitching, activeKey]);

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
                        onChange={handleTabClick}
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
                                        strategy: MeasuringStrategy.Always,
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
