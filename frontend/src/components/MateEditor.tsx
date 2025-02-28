import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {
    Button,
    Checkbox,
    Col,
    Collapse,
    ConfigProvider,
    Divider,
    Form,
    FormListFieldData,
    Input,
    InputNumber,
    message,
    Radio,
    Row,
    Space,
    Tooltip
} from 'antd';
import type {FormListOperation} from 'antd/es/form';
import {WindowSetTitle} from '../../wailsjs/runtime';
import {COM3D2} from '../../wailsjs/go/models';
import {SaveFile} from '../../wailsjs/go/main/App';
import {useTranslation} from "react-i18next";
import {DeleteOutlined, PlusOutlined, QuestionCircleOutlined} from "@ant-design/icons";
import MatePropertyItemType1 from "./MatePropertyItemType1";
import MatePropertyItemType2 from "./MatePropertyItemType2";
import {t} from "i18next";
import {ReadMateFile, WriteMateFile} from "../../wailsjs/go/COM3D2/MateService";
import MatePropertyListType1Virtualized from "./MatePropertyListType1Virtualized";
import Mate = COM3D2.Mate;
import Material = COM3D2.Material;
import TexProperty = COM3D2.TexProperty;
import ColProperty = COM3D2.ColProperty;
import VecProperty = COM3D2.VecProperty;
import FProperty = COM3D2.FProperty;
import {Editor} from "@monaco-editor/react";
import {useDarkMode} from "../hooks/themeSwitch";

interface MateEditorProps {
    filePath?: string; // 传入要打开的 .mate 文件路径
}

export interface MateEditorRef {
    handleReadMateFile: () => Promise<void>;
    handleSaveMateFile: () => Promise<void>;
    handleSaveAsMateFile: () => Promise<void>;
}


// ------------------- 样式1：简单的上下排列 -------------------
const Style1Properties: React.FC<{
    fields: FormListFieldData[];
    add: FormListOperation['add'];
    remove: FormListOperation['remove'];
    form: any;
}> = ({fields, add, remove, form}) => {
    const {t} = useTranslation();

    // 1. 先按 propType 进行分组
    const groupedFields = fields.reduce((acc, field) => {
        const propType = form.getFieldValue(['properties', field.name, 'propType']) || "unknown"; // 获取 propType
        if (!acc[propType]) acc[propType] = [];
        acc[propType].push(field);
        return acc;
    }, {} as Record<string, FormListFieldData[]>);

    return (
        <>
            {/* 2. 遍历分组后的数据进行渲染 */}
            {Object.entries(groupedFields).map(([propType, groupFields]) => (
                <div key={propType}>
                    {/* 3. 在每个 propType 组的开头加一个分割线 */}
                    <Divider>{t(`MateEditor.${propType}`)}</Divider>

                    {/* 4. 渲染该 propType 组内的所有属性 */}
                    {groupFields.map(({key, name, ...restField}) => (
                        <div key={key} style={{position: "relative", marginBottom: 16}}>
                            <MatePropertyItemType1 name={name} restField={restField} form={form}/>
                            <Button
                                onClick={() => remove(name)}
                                style={{position: "absolute", bottom: 0, right: 0}}
                                icon={<DeleteOutlined/>}
                            />
                        </div>
                    ))}
                </div>
            ))}

            {/* 5. 添加新属性按钮 */}
            <Form.Item>
                <Button type="primary" onClick={() => add()} block icon={<PlusOutlined/>}>
                    {t("MateEditor.add_new_property")}
                </Button>
            </Form.Item>
        </>
    );
};

// 为大文件准备的虚拟渲染
const Style1PropertiesVirtualized: React.FC<{
    fields: FormListFieldData[];
    add: FormListOperation["add"];
    remove: FormListOperation["remove"];
    form: any;
}> = ({fields, add, remove, form}) => {
    const {t} = useTranslation();

    return (
        <>
            <MatePropertyListType1Virtualized
                fields={fields}
                remove={remove}
                form={form}
            />

            <Button
                type="primary"
                onClick={() => add()}
                block
                icon={<PlusOutlined/>}
                style={{marginTop: 8}}
            >
                {t("MateEditor.add_new_property")}
            </Button>
        </>
    );
};


// ======================= 样式2：按 propType 分栏 + 左列表/右编辑区  =======================
const Style2Properties: React.FC<{
    fields: FormListFieldData[];
    add: FormListOperation['add'];
    remove: FormListOperation['remove'];
    form: any;
}> = ({fields, add, remove, form}) => {
    // 引用左侧列表容器
    const leftSidebarRef = useRef<HTMLDivElement>(null);

    // 当前选中的属性下标（在 fields 数组里的 name）
    const [selectedField, setSelectedField] = useState<number | null>(null);

    // 用来筛选 propType
    const [filterPropType, setFilterPropType] = useState<string>('all');

    // 搜索关键词状态
    const [searchKeyword, setSearchKeyword] = useState('');

    // 按筛选规则和搜索过滤
    const filteredFields = fields.filter((f: FormListFieldData) => {
        const pType = form.getFieldValue(['properties', f.name, 'propType']);
        const pName = form.getFieldValue(['properties', f.name, 'propName']) || '';

        // 组合过滤条件
        const typeMatch = filterPropType === 'all' || pType === filterPropType;
        const nameMatch = pName.toLowerCase().includes(searchKeyword.toLowerCase());

        return typeMatch && nameMatch;
    });


    // 再按 propType 分组
    const grouped: Record<string, { field: FormListFieldData; index: number; propName: string }[]> = {};
    filteredFields.forEach((f: FormListFieldData) => {
        const pType = form.getFieldValue(['properties', f.name, 'propType']);
        const pName = form.getFieldValue(['properties', f.name, 'propName']) || t('MateEditor.no_name');
        if (!grouped[pType]) {
            grouped[pType] = [];
        }
        grouped[pType].push({
            field: f,
            index: f.name,
            propName: pName,
        });
    });

    const groupKeys = Object.keys(grouped);

    useEffect(() => {
        leftSidebarRef.current?.focus();  // 组件挂载后自动聚焦左侧列表
    }, []);


    // 键盘事件处理函数，用于根据方向键更新选中项
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        // 扁平化所有选项的索引数组
        const flatIndices = groupKeys.reduce((acc: number[], propType) => {
            const indices = grouped[propType].map(item => item.index);
            return acc.concat(indices);
        }, []);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (flatIndices.length === 0) return;
            if (selectedField === null) {
                setSelectedField(flatIndices[0]);
            } else {
                const currentIndex = flatIndices.findIndex(val => val === selectedField);
                const nextIndex = currentIndex < flatIndices.length - 1 ? flatIndices[currentIndex + 1] : flatIndices[currentIndex];
                setSelectedField(nextIndex);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (flatIndices.length === 0) return;
            if (selectedField === null) {
                setSelectedField(flatIndices[flatIndices.length - 1]);
            } else {
                const currentIndex = flatIndices.findIndex(val => val === selectedField);
                const prevIndex = currentIndex > 0 ? flatIndices[currentIndex - 1] : flatIndices[currentIndex];
                setSelectedField(prevIndex);
            }
        }
    };

    // 自动滚动选中项进入视图
    useEffect(() => {
        if (selectedField !== null) {
            const el = document.getElementById(`sidebar-item-${selectedField}`);
            el?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
        }
    }, [selectedField]);


    // 找到当前选中的 field
    const selectedFieldData = fields.find((f) => f.name === selectedField);

    return (
        <Row gutter={16}>
            {/* 左侧列表：按分组 -> 组内列出可点击 */}
            <Col span={8}
                 ref={leftSidebarRef}        /* 引用左侧列表容器 */
                 tabIndex={0}                /* 使 div 可聚焦 */
                 onKeyDown={handleKeyDown}   /* 键盘事件监听 */
                 style={{
                     borderRight: '1px solid #ddd',
                     height: 'calc(100vh - 230px)',
                     overflowY: 'auto',
                     display: 'flex',
                     flexDirection: 'column',
                 }}>
                {/* PropType 选择器 靠左 */}
                <div style={{textAlign: 'left', marginBottom: 8}}>
                    <Radio.Group
                        value={filterPropType}
                        onChange={(e) => setFilterPropType(e.target.value)}
                        optionType="button"
                    >
                        <Radio.Button value="all">{t('MateEditor.all')}</Radio.Button>
                        <Radio.Button value="tex">{t('MateEditor.tex')}</Radio.Button>
                        <Radio.Button value="col">{t('MateEditor.col')}</Radio.Button>
                        <Radio.Button value="vec">{t('MateEditor.vec')}</Radio.Button>
                        <Radio.Button value="f">{t('MateEditor.f')}</Radio.Button>
                        <Radio.Button value="unknown">{t('MateEditor.unknown')}</Radio.Button>
                    </Radio.Group>
                    <Input.Search
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        style={{marginTop: 8}}
                    />
                </div>

                {/* 左边栏，按 PropType 分组 */}
                {groupKeys.map((PropType) => (
                    <div key={PropType} style={{textAlign: 'left', marginBottom: 16}}>
                        <Divider plain><b>{t(`MateEditor.${PropType}`)}</b></Divider>
                        {grouped[PropType].map(({field, index, propName}) => (
                            <div
                                id={`sidebar-item-${index}`}
                                key={field.key}
                                onClick={() => setSelectedField(index)}
                                style={{
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    borderRadius: 4,
                                    backgroundColor: selectedField === index ? '#e6f7ff' : undefined,
                                    marginBottom: 4,
                                }}
                            >
                                {propName}
                            </div>
                        ))}
                    </div>
                ))}
                <Button
                    type="primary"
                    onClick={() => {
                        add();
                        setSelectedField(null);
                    }}
                    icon={<PlusOutlined/>}
                    block
                >
                    {t('MateEditor.add_new_property')}
                </Button>
            </Col>

            {/* 右侧编辑区：仅渲染选中的那一个 */}
            <Col span={16}>
                {selectedField !== null && selectedFieldData && (
                    <div style={{
                        height: 'calc(100vh - 270px)',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <MatePropertyItemType2
                            key={'property-item-' + selectedFieldData.key} // 确保每个属性都有独立的 key
                            name={selectedFieldData.name}
                            restField={selectedFieldData}
                            form={form}
                        />
                        <Button
                            onClick={() => {
                                remove(selectedFieldData.name);
                                setSelectedField(null);
                            }}
                            danger
                            style={{position: 'absolute', bottom: 0, right: 0}}
                            icon={<DeleteOutlined/>}
                        />
                    </div>
                )}
            </Col>
        </Row>
    );
};


// ======================= 样式3：直接用 Monaco Editor 展示/编辑整个 mateData JSON =======================
const Style3Properties: React.FC<{
    mateData: Mate | null;
    setMateData: (m: Mate | null) => void;
    form: any;
    transformMateToForm: (mate: Mate) => any;
}> = ({ mateData, setMateData,form, transformMateToForm }) => {
    const isDarkMode = useDarkMode();
    const [jsonValue, setJsonValue] = useState("");

    useEffect(() => {
        if (mateData) {
            // 初次/每次切换时，把 Mate 对象序列化为 JSON
            setJsonValue(JSON.stringify(mateData, null, 2));
            // 当 JSON 变化时同步到 form
            const formValues = transformMateToForm(mateData);
            form.setFieldsValue(formValues);
        } else {
            setJsonValue("");
        }
    }, [mateData, form, transformMateToForm]);

    // 当用户编辑 Monaco 里的 JSON
    const handleEditorChange = (value?: string) => {
        if (value == null) value = "";
        setJsonValue(value);

        try {
            const parsed = JSON.parse(value);
            // 只要 JSON 格式正常，实时更新父组件的 mateData
            setMateData(parsed);
            const formValues = transformMateToForm(parsed);
            form.setFieldsValue(formValues);
        } catch (err) {
            // console.log("Invalid JSON:", err);
        }
    };

    return (
        <div style={{height: "calc(100vh - 230px)"}}>
            <Editor
                language="json"
                theme={isDarkMode ? "vs-dark" : "vs"}
                value={jsonValue}
                onChange={handleEditorChange}
                options={{
                    minimap: {enabled: true},
                    tabSize: 2,
                }}
            />
        </div>
    );
};




/**
 * MateEditor 组件
 *
 * - 读取 .mate 文件 -> 填充 form
 * - 在前端编辑 -> 组装回 Mate 对象
 * - 保存/另存为
 */
const MateEditor = forwardRef<MateEditorRef, MateEditorProps>((props, ref) => {
    const {t} = useTranslation();
    const {filePath} = props;

    // 整体 .mate 数据
    const [mateData, setMateData] = useState<Mate | null>(null);

    // 是否允许编辑 Signature, Version 等字段（默认禁用）
    const [isHeaderEditable, setIsHeaderEditable] = useState(false);

    // 用于 antd 的表单来管理字段
    const [form] = Form.useForm();

    // 用来切换样式模式：1 or 2 or 3
    const [viewMode, setViewMode] = useState<1 | 2 | 3>(() => {
        const saved = localStorage.getItem('mateEditorViewMode');
        return saved ? Number(saved) as 1 | 2 | 3 : 1;
    });

    // 当组件挂载或 filePath 改变时，自动读取
    useEffect(() => {
        if (filePath) {

            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

            handleReadMateFile();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            // 如果没有文件，则初始化为新文件
            const mate = new Mate();
            mate.Signature = "CM3D2_MATERIAL";
            mate.Version = 2001;
            setMateData(mate);
            form.resetFields();
        }
    }, [filePath]);

    // 当 mateData 变化时同步到表单
    useEffect(() => {
        if (mateData) {
            const formValues = transformMateToForm(mateData);
            form.setFieldsValue(formValues);
        }
    }, [mateData, form]);


    /**
     * 读取 .mate 文件
     */
    const handleReadMateFile = async () => {
        if (!filePath) {
            message.error(t('Infos.pls_open_file_first'));
            return;
        }
        try {
            const data = await ReadMateFile(filePath);
            console.log(data);
            setMateData(data);
            // 同步到 form
            form.setFieldsValue(transformMateToForm(data));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_mate_file_failed_colon') + error);
        }
    };

    /**
     * 保存 .mate 文件（覆盖写回原路径）
     */
    const handleSaveMateFile = async () => {
        if (!filePath) {
            message.error(t('Errors.pls_input_file_path_first'));
            return;
        }
        if (!mateData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }
        try {
            // 先获取最新的表单数据
            const values = form.getFieldsValue(true);
            // form -> Mate
            const newMate = transformFormToMate(values, mateData);

            // 调用后端保存
            await WriteMateFile(filePath, newMate);
            message.success(t('Infos.success_save_file'));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.save_file_failed_colon') + error);
        }
    };

    /**
     * 另存为 .mate 文件
     */
    const handleSaveAsMateFile = async () => {
        if (!mateData) {
            message.error(t('Errors.save_as_file_failed_colon') + t('Errors.pls_load_file_first'));
            return;
        }
        try {
            // 获取最新表单数据
            const values = form.getFieldsValue(true);
            const newMate = transformFormToMate(values, mateData);

            // 询问保存路径
            const newPath = await SaveFile("*.mate", t('Infos.com3d2_mate_file'));
            if (!newPath) {
                // 用户取消
                return;
            }


            await WriteMateFile(newPath, newMate);
            message.success(t('Infos.success_save_as_file_colon') + newPath);
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.save_as_file_failed_colon') + error.message);
        }
    };


    /**
     * 监听 Ctrl+S 快捷键，触发保存
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Windows/Linux: Ctrl+S, macOS: Cmd+S => e.metaKey
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSaveMateFile();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSaveMateFile]);


    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
        handleReadMateFile,
        handleSaveMateFile,
        handleSaveAsMateFile,
    }));

    /**
     * 把 Mate 对象映射到表单字段
     * 便于 antd 的 Form 做统一管理
     */
    const transformMateToForm = (mate: Mate) => {
        // 尝试推断出 TypeName
        mate.Material?.Properties?.forEach((prop: any) => {
            if (!('TypeName' in prop)) {
                if ('Tex2D' in prop || 'TexRT' in prop) {
                    prop.TypeName = 'tex';
                } else if ('Color' in prop) {
                    prop.TypeName = 'col';
                } else if ('Vector' in prop) {
                    prop.TypeName = 'vec';
                } else if ('Number' in prop) {
                    prop.TypeName = 'f';
                } else {
                    prop.TypeName = 'unknown';
                }
            }
        });

        return {
            signature: mate.Signature,
            version: mate.Version,
            name: mate.Name,
            materialName: mate.Material?.Name,
            shaderName: mate.Material?.ShaderName,
            shaderFilename: mate.Material?.ShaderFilename,
            properties: mate.Material?.Properties?.map((prop) => {
                // 不同类型的 property
                switch (prop.TypeName) {
                    case 'tex':
                        // TS: prop as TexProperty
                        const texProp = prop as TexProperty;
                        return {
                            propType: 'tex',
                            propName: texProp.PropName,
                            subTag: texProp.SubTag,
                            // 针对 tex2d / cube
                            tex2dName: texProp.Tex2D?.Name,
                            tex2dPath: texProp.Tex2D?.Path,
                            offsetX: texProp.Tex2D?.Offset?.[0],
                            offsetY: texProp.Tex2D?.Offset?.[1],
                            scaleX: texProp.Tex2D?.Scale?.[0],
                            scaleY: texProp.Tex2D?.Scale?.[1],
                            // 针对 texRT
                            discardedStr1: texProp.TexRT?.DiscardedStr1,
                            discardedStr2: texProp.TexRT?.DiscardedStr2,
                        };
                    case 'col':
                        const colProp = prop as ColProperty;
                        return {
                            propType: 'col',
                            propName: colProp.PropName,
                            colorR: colProp.Color[0],
                            colorG: colProp.Color[1],
                            colorB: colProp.Color[2],
                            colorA: colProp.Color[3],
                        };
                    case 'vec':
                        const vecProp = prop as VecProperty;
                        return {
                            propType: 'vec',
                            propName: vecProp.PropName,
                            vec0: vecProp.Vector[0],
                            vec1: vecProp.Vector[1],
                            vec2: vecProp.Vector[2],
                            vec3: vecProp.Vector[3],
                        };
                    case 'f':
                        const fProp = prop as FProperty;
                        return {
                            propType: 'f',
                            propName: fProp.PropName,
                            number: fProp.Number,
                        };
                    default:
                        return {
                            propType: 'unknown',
                            propName: 'unknown',
                        };
                }
            }) || [],
        };
    };

    /**
     * 将 form 上的数据组装回 Mate 对象
     */
    const transformFormToMate = (values: any, oldMate: Mate): Mate => {
        const newMate = COM3D2.Mate.createFrom(oldMate);

        // 基本字段
        if (isHeaderEditable) {
            newMate.Signature = values.signature;
            newMate.Version = parseInt(values.version, 10);
        }
        newMate.Name = values.name;

        // Material
        if (!newMate.Material) {
            newMate.Material = {} as Material;
        }
        newMate.Material.Name = values.materialName;
        newMate.Material.ShaderName = values.shaderName;
        newMate.Material.ShaderFilename = values.shaderFilename;

        // Properties
        const newProps: any[] = [];
        if (Array.isArray(values.properties)) {
            values.properties.forEach((item: any) => {
                switch (item.propType) {
                    case 'tex':
                        // 根据 subTag 判断
                        if (item.subTag === 'tex2d' || item.subTag === 'cube') {
                            newProps.push({
                                TypeName: 'tex',
                                PropName: item.propName,
                                SubTag: item.subTag,
                                Tex2D: {
                                    Name: item.tex2dName,
                                    Path: item.tex2dPath,
                                    Offset: [parseFloat(item.offsetX) || 0, parseFloat(item.offsetY) || 0],
                                    Scale: [parseFloat(item.scaleX) || 1, parseFloat(item.scaleY) || 1]
                                },
                            });
                        } else if (item.subTag === 'texRT') {
                            newProps.push({
                                TypeName: 'tex',
                                    PropName: item.propName,
                                    SubTag: 'texRT',
                                    TexRT: {
                                        DiscardedStr1: item.discardedStr1,
                                        DiscardedStr2: item.discardedStr2,
                                    }
                                }
                            );
                        } else if (item.subTag === 'null') {
                            // 生成一个空的 tex 属性
                            newProps.push({
                                TypeName: 'tex',
                                PropName: item.propName,
                                SubTag: 'null',
                            });
                        }
                        break;
                    case 'col':
                        newProps.push({
                            TypeName: 'col',
                            PropName: item.propName,
                            Color: [
                                parseFloat(item.colorR) || 0,
                                parseFloat(item.colorG) || 0,
                                parseFloat(item.colorB) || 0,
                                parseFloat(item.colorA) || 0,
                            ],
                        });
                        break;
                    case 'vec':
                        newProps.push({
                            TypeName: 'vec',
                            PropName: item.propName,
                            Vector: [
                                parseFloat(item.vec0) || 0,
                                parseFloat(item.vec1) || 0,
                                parseFloat(item.vec2) || 0,
                                parseFloat(item.vec3) || 0,
                            ],
                        });
                        break;
                    case 'f':
                        newProps.push({
                            TypeName: 'f',
                            PropName: item.propName,
                            Number: parseFloat(item.number) || 0,
                        });
                        break;
                    default:
                        // unknown, do nothing
                        break;
                }
            });
        }
        newMate.Material.Properties = newProps as any;
        return newMate;
    };

    return (
        <div style={{padding: 10}}>
            <ConfigProvider
                theme={{
                    components: {
                        Form: {
                            itemMarginBottom: 10, // 调整 item 的间距
                        },
                    },
                }}
            >
                <Form
                    form={form}
                    layout="horizontal"
                    style={{marginTop: 10}}
                    size="small"
                    labelAlign="left"
                    // Form 级别统一设置 labelCol
                    labelCol={{style: {width: '15vw'}}}
                >
                    <Collapse defaultActiveKey={['basic', 'properties']}>
                        <Collapse.Panel key="basic" header={t('MateEditor.file_header.file_head')}>
                            <Space>
                                <Form.Item name="signature" initialValue="CM3D2_MATERIAL">
                                    <Input
                                        disabled={!isHeaderEditable}
                                        addonBefore={t('MateEditor.file_header.Signature')}
                                    />
                                </Form.Item>
                                <Form.Item name="version" initialValue="2001">
                                    <InputNumber
                                        disabled={!isHeaderEditable}
                                        addonBefore={t('MateEditor.file_header.Version')}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Checkbox
                                        checked={isHeaderEditable}
                                        onChange={(e) => setIsHeaderEditable(e.target.checked)}
                                    >
                                        {t('MateEditor.file_header.enable_edit_do_not_edit')}
                                    </Checkbox>
                                </Form.Item>
                            </Space>

                            <Form.Item name="name">
                                <Input
                                    addonBefore={
                                        <span style={{width: '15vw', display: 'inline-block', textAlign: 'left'}}>
                      {t('MateEditor.file_header.Name')}
                    </span>
                                    }
                                    suffix={
                                        <Tooltip title={t('MateEditor.file_header.Name_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                            <Form.Item name="materialName">
                                <Input
                                    addonBefore={
                                        <span style={{width: '15vw', display: 'inline-block', textAlign: 'left'}}>
                      {t('MateEditor.file_header.Material_Name')}
                    </span>
                                    }
                                    suffix={
                                        <Tooltip title={t('MateEditor.file_header.Material_Name_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                            <Form.Item name="shaderName">
                                <Input
                                    addonBefore={
                                        <span style={{width: '15vw', display: 'inline-block', textAlign: 'left'}}>
                      {t('MateEditor.file_header.Material_ShaderName')}
                    </span>
                                    }
                                    suffix={
                                        <Tooltip title={t('MateEditor.file_header.Material_ShaderName_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                            <Form.Item name="shaderFilename">
                                <Input
                                    addonBefore={
                                        <span style={{width: '15vw', display: 'inline-block', textAlign: 'left'}}>
                      {t('MateEditor.file_header.Material_ShaderFilename')}
                    </span>
                                    }
                                    suffix={
                                        <Tooltip title={t('MateEditor.file_header.Material_ShaderFilename_tip')}>
                                            <QuestionCircleOutlined/>
                                        </Tooltip>
                                    }
                                />
                            </Form.Item>
                        </Collapse.Panel>

                        <Collapse.Panel key="properties" header={t('MateEditor.property')}>
                            {/* 用 Radio 切换样式 */}
                            <div style={{marginBottom: 8}}>
                                <Radio.Group
                                    block
                                    value={viewMode}
                                    onChange={(e) => {
                                        setViewMode(e.target.value);
                                        localStorage.setItem('mateEditorViewMode', e.target.value.toString());
                                    }}
                                    options={[
                                        {label: t('MateEditor.style1'), value: 1},
                                        {label: t('MateEditor.style2'), value: 2},
                                        {label: t('MateEditor.style3'), value: 3},
                                    ]}
                                    optionType="button"
                                    buttonStyle="solid"
                                />
                            </div>

                            {viewMode === 1 && (
                                <Form.List name="properties">
                                    {(fields, {add, remove}) =>
                                        fields.length > 70 ? (
                                            <Style1PropertiesVirtualized
                                                fields={fields}
                                                add={add}
                                                remove={remove}
                                                form={form}
                                            />
                                        ) : (
                                            <Style1Properties
                                                fields={fields}
                                                add={add}
                                                remove={remove}
                                                form={form}
                                            />
                                        )
                                    }
                                </Form.List>
                            )}

                            {viewMode === 2 && (
                                <Form.List name="properties">
                                    {(fields, {add, remove}) => (
                                        <Style2Properties
                                            fields={fields}
                                            add={add}
                                            remove={remove}
                                            form={form}
                                        />
                                    )}
                                </Form.List>
                            )}

                            {viewMode === 3 && (
                                <Style3Properties
                                    mateData={mateData}
                                    setMateData={(newVal) => setMateData(newVal)}
                                    form={form}
                                    transformMateToForm={transformMateToForm}
                                />
                            )}
                        </Collapse.Panel>
                    </Collapse>
                </Form>
            </ConfigProvider>
        </div>
    );
});

export default MateEditor;
