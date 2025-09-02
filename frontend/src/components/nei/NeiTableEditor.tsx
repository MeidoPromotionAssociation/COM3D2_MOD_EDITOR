import React, {useEffect, useState} from "react";
import {Button, Input, Table} from "antd";
import {DeleteOutlined, HolderOutlined, PlusOutlined} from "@ant-design/icons";
import {useTranslation} from "react-i18next";
import {COM3D2} from "../../../wailsjs/go/models";
import type {DragEndEvent} from '@dnd-kit/core';
import {closestCenter, DndContext, MouseSensor, TouchSensor, useSensor, useSensors} from '@dnd-kit/core';
import {arrayMove, SortableContext, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import NeiModel = COM3D2.Nei;

interface NeiTableEditorProps {
    neiData: NeiModel | null;
    onDataChange: (data: NeiModel) => void;
}

// 可拖拽的行组件
interface DraggableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    'data-row-key': string;
}

const DraggableRow: React.FC<DraggableRowProps> = ({children, ...props}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: props['data-row-key'],
    });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Transform.toString(transform && {...transform, scaleY: 1}),
        transition,
        ...(isDragging ? {position: 'relative', zIndex: 9999} : {}),
    };

    return (
        <tr {...props} ref={setNodeRef} style={style} {...attributes}>
            {React.Children.map(children, (child) => {
                if ((child as React.ReactElement).key === 'sort') {
                    return React.cloneElement(child as React.ReactElement, {}, (
                        <div {...listeners} style={{cursor: 'move', padding: '4px'}}>
                            <HolderOutlined/>
                        </div>
                    ));
                }
                return child;
            })}
        </tr>
    );
};

const NeiTableEditor: React.FC<NeiTableEditorProps> = ({neiData, onDataChange}) => {
    const {t} = useTranslation();
    const [csvData, setCsvData] = useState<string[][]>([]);
    const [columns, setColumns] = useState<any[]>([]);

    // 配置拖拽传感器
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
    );

    // 同步 neiData 到本地 csvData
    useEffect(() => {
        if (neiData && neiData.Data) {
            setCsvData([...neiData.Data]);
        } else {
            setCsvData([]);
        }
    }, [neiData]);

    // 根据 csvData 生成表格列
    useEffect(() => {
        if (csvData.length === 0) {
            setColumns([]);
            return;
        }

        const maxCols = Math.max(...csvData.map(row => row.length));
        const newColumns = [];

        // 添加拖拽手柄列
        newColumns.push({
            title: '',
            key: 'sort',
            width: 10,
            fixed: 'left',
            render: () => <HolderOutlined style={{cursor: 'grab'}}/>,
        });

        for (let i = 0; i < maxCols; i++) {
            newColumns.push({
                title: `${t('NeiEditor.column')} ${i + 1}`,
                dataIndex: i,
                key: i,
                render: (text: string, record: string[], rowIndex: number) => (
                    <Input
                        value={record[i] || ''}
                        onChange={(e) => handleCellChange(rowIndex, i, e.target.value)}
                        size="small"
                    />
                )
            });
        }

        // 添加操作列
        newColumns.push({
            title: t('Common.operate'),
            key: 'action',
            width: 10,
            fixed: 'right',
            render: (_: any, record: string[], index: number) => (
                <Button
                    icon={<DeleteOutlined/>}
                    size="small"
                    onClick={() => handleDeleteRow(index)}
                    danger
                />
            )
        });

        setColumns(newColumns);
    }, [csvData, t]);

    // 处理单元格值变化
    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...csvData];

        // 确保行存在
        if (!newData[rowIndex]) {
            newData[rowIndex] = [];
        }

        // 确保列存在
        while (newData[rowIndex].length <= colIndex) {
            newData[rowIndex].push('');
        }

        newData[rowIndex][colIndex] = value;
        setCsvData(newData);

        // 更新 neiData
        const newNei = new NeiModel();
        newNei.Data = newData;
        newNei.Rows = newData.length;
        newNei.Cols = newData.length > 0 ? Math.max(...newData.map(row => row.length)) : 0;
        onDataChange(newNei);
    };

    // 添加新行
    const handleAddRow = () => {
        const maxCols = csvData.length > 0 ? Math.max(...csvData.map(row => row.length)) : 1;
        const newRow = new Array(maxCols).fill('');
        const newData = [...csvData, newRow];
        setCsvData(newData);

        const newNei = new NeiModel();
        newNei.Data = newData;
        newNei.Rows = newData.length;
        newNei.Cols = maxCols;
        onDataChange(newNei);
    };

    // 删除行
    const handleDeleteRow = (index: number) => {
        const newData = csvData.filter((_, i) => i !== index);
        setCsvData(newData);

        const newNei = new NeiModel();
        newNei.Data = newData;
        newNei.Rows = newData.length;
        newNei.Cols = newData.length > 0 ? Math.max(...newData.map(row => row.length)) : 0;
        onDataChange(newNei);
    };

    // 添加新列
    const handleAddColumn = () => {
        const newData = csvData.map(row => [...row, '']);
        setCsvData(newData);

        const newNei = new NeiModel();
        newNei.Data = newData;
        newNei.Rows = newData.length;
        newNei.Cols = newData.length > 0 ? newData[0].length : 0;
        onDataChange(newNei);
    };

    // 处理行拖拽结束
    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;

        if (active.id !== over?.id) {
            const oldIndex = csvData.findIndex((_, index) => index.toString() === active.id);
            const newIndex = csvData.findIndex((_, index) => index.toString() === over?.id);

            const newData = arrayMove(csvData, oldIndex, newIndex);
            setCsvData(newData);

            const newNei = new NeiModel();
            newNei.Data = newData;
            newNei.Rows = newData.length;
            newNei.Cols = newData.length > 0 ? Math.max(...newData.map(row => row.length)) : 0;
            onDataChange(newNei);
        }
    };

    // 处理数据源，为每行添加 key
    const dataSource = csvData.map((row, index) => ({
        key: index.toString(),
        ...row
    }));

    return (
        <div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={dataSource.map(item => item.key)}
                    strategy={verticalListSortingStrategy}
                >
                    <Table
                        dataSource={dataSource}
                        columns={columns}
                        pagination={false}
                        scroll={{x: 'max-content', y: 'calc(100vh - 230px)'}}
                        size="small"
                        bordered
                        components={{
                            body: {
                                row: DraggableRow,
                            },
                        }}
                        footer={() =>
                            <>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined/>}
                                    onClick={handleAddRow}
                                    style={{marginRight: 8}}
                                >
                                    {t('NeiEditor.add_row')}
                                </Button>
                                <Button
                                    icon={<PlusOutlined/>}
                                    onClick={handleAddColumn}
                                >
                                    {t('NeiEditor.add_column')}
                                </Button>
                            </>
                        }
                    />
                </SortableContext>
            </DndContext>

        </div>
    );
};

export default NeiTableEditor;