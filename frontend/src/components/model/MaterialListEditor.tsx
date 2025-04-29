import React, {useState} from 'react';
import {Button, Empty, Tabs, Tooltip} from 'antd';
import {COM3D2} from '../../../wailsjs/go/models';
import {useTranslation} from "react-i18next";
import {DeleteOutlined, PlusOutlined} from "@ant-design/icons";
import MaterialEditor from './MaterialEditor';
import Material = COM3D2.Material;

export interface MaterialListEditorProps {
    materials: Material[];
    onMaterialsChange: (materials: Material[]) => void;
}

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
                    />
                </>
            )}
        </div>
    );
};

export default MaterialListEditor;
