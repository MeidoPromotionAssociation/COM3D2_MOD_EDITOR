import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {
    Button,
    Checkbox,
    Collapse,
    ConfigProvider,
    Flex,
    Form,
    FormListFieldData,
    Input,
    InputNumber,
    message,
    Radio,
    Space
} from "antd";
import {DeleteOutlined} from "@ant-design/icons";
import type {FormListOperation} from "antd/es/form";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {SaveFile} from "../../wailsjs/go/main/App";
import {ReadColFile, WriteColFile} from "../../wailsjs/go/COM3D2/ColService";
import {useDarkMode} from "../hooks/themeSwitch";
import {Editor} from "@monaco-editor/react";
import {useTranslation} from "react-i18next";
import {COM3D2HeaderConstants} from "../utils/consts";
import DynamicBoneColliderBase = COM3D2.DynamicBoneColliderBase;
import DynamicBoneCollider = COM3D2.DynamicBoneCollider;
import DynamicBonePlaneCollider = COM3D2.DynamicBonePlaneCollider;
import DynamicBoneMuneCollider = COM3D2.DynamicBoneMuneCollider;
import MissingCollider = COM3D2.MissingCollider;
import ColModel = COM3D2.Col;


/** 样式1：所有 Collider 顺序排布 */
const Style1Colliders: React.FC<{
    fields: FormListFieldData[];
    add: FormListOperation["add"];
    remove: FormListOperation["remove"];
    form: any;
}> = ({fields, add, remove, form}) => {
    const {t} = useTranslation();

    return (
        <>
            {fields.map(({key, name, ...restField}) => {
                const typeName = form.getFieldValue(["colliders", name, "TypeName"]);
                return (
                    <div
                        key={key}
                        style={{
                            position: "relative",
                            padding: 8,
                            marginBottom: 10,
                            border: "1px solid #ccc",
                            borderRadius: 4
                        }}
                    >
                        <DynamicColliderFormItem name={name} form={form}/>
                        <Button
                            onClick={() => remove(name)}
                            style={{position: "absolute", bottom: 0, right: 0}}
                            icon={<DeleteOutlined/>}
                        >
                        </Button>
                    </div>
                );
            })}
            <Button icon={<></>} block type="primary" onClick={() => add()}>
                {t('ColEditor.add_collider')}
            </Button>
        </>
    );
};


/**
 * 用于渲染单个 Collider 的表单区域，根据 typeName 动态切换要展示的字段
 */
const DynamicColliderFormItem: React.FC<{ name: number; form: any }> = ({
                                                                            name,
                                                                            form
                                                                        }) => {
    const {t} = useTranslation();
    // 其中 position/rotation/scale/center 都是 array
    const typeName = Form.useWatch(["colliders", name, "TypeName"], form);

    return (
        <div
            style={{
                marginBottom: 8,
                padding: 8,
                border: '1px solid #000',
                borderRadius: 4,
                textAlign: 'left',
            }}
        >
            <Form.Item
                label={t('ColEditor.collider_type')}
                name={[name, "TypeName"]}
            >
                <Radio.Group>
                    <Radio value="dbc">dbc</Radio>
                    <Radio value="dpc">dpc</Radio>
                    <Radio value="dbm">dbm</Radio>
                    <Radio value="missing">missing</Radio>
                </Radio.Group>
            </Form.Item>


            {/* 当类型不是 missing 时才渲染公共字段 */}
            {typeName !== 'missing' && (
                <>
                    {/* base 公共字段 */}
                    <Form.Item label={t('ColEditor.ParentName')} name={[name, "parentName"]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={t('ColEditor.SelfName')} name={[name, "selfName"]}>
                        <Input/>
                    </Form.Item>

                    {/* LocalPosition (3个数) */}
                    <Form.Item label={t('ColEditor.LocalPosition')}>
                        <Flex gap="middle">
                            <Form.Item name={[name, "localPosition", 0]} noStyle>
                                <InputNumber
                                    addonBefore="X"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localPosition", 1]} noStyle>
                                <InputNumber
                                    addonBefore="Y"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localPosition", 2]} noStyle>
                                <InputNumber
                                    addonBefore="Z"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                        </Flex>
                    </Form.Item>

                    {/* LocalRotation (4个数) */}
                    <Form.Item label={t('ColEditor.LocalRotation')}>
                        <Flex gap="middle">
                            <Form.Item name={[name, "localRotation", 0]} noStyle>
                                <InputNumber
                                    addonBefore="X"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localRotation", 1]} noStyle>
                                <InputNumber
                                    addonBefore="Y"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localRotation", 2]} noStyle>
                                <InputNumber
                                    addonBefore="Z"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localRotation", 3]} noStyle>
                                <InputNumber
                                    addonBefore="W"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                        </Flex>
                    </Form.Item>

                    {/* LocalScale (3个数) */}
                    <Form.Item label={t('ColEditor.LocalScale')}>
                        <Flex gap="middle">
                            <Form.Item name={[name, "localScale", 0]} noStyle>
                                <InputNumber
                                    addonBefore="SX"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localScale", 1]} noStyle>
                                <InputNumber
                                    addonBefore="SY"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "localScale", 2]} noStyle>
                                <InputNumber
                                    addonBefore="SZ"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                        </Flex>
                    </Form.Item>

                    <Form.Item label={t('ColEditor.Direction')} name={[name, "direction"]}>
                        <InputNumber style={{width: "20%"}}/>
                    </Form.Item>

                    <Form.Item label={t('ColEditor.Center')}>
                        <Flex gap="middle">
                            <Form.Item name={[name, "center", 0]} noStyle>
                                <InputNumber
                                    addonBefore="CX"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "center", 1]} noStyle>
                                <InputNumber
                                    addonBefore="CY"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "center", 2]} noStyle>
                                <InputNumber
                                    addonBefore="CZ"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                        </Flex>
                    </Form.Item>

                    <Form.Item label={t('ColEditor.Bound')} name={[name, "bound"]}>
                        <InputNumber style={{width: "20%"}}/>
                    </Form.Item>
                </>
            )}

            {/* 只有 dbc/dbm 才显示 radius/height */}
            {(typeName === "dbc" || typeName === "dbm") && (
                <>
                    <Form.Item label={t('ColEditor.Radius')} name={[name, "radius"]}>
                        <InputNumber style={{width: "20%"}}/>
                    </Form.Item>
                    <Form.Item label={t('ColEditor.Height')} name={[name, "height"]}>
                        <InputNumber style={{width: "20%"}}/>
                    </Form.Item>
                </>
            )}

            {/* dbm 独有的字段 */}
            {typeName === "dbm" && (
                <>
                    <Form.Item label={t('ColEditor.ScaleRateMulMax')} name={[name, "scaleRateMulMax"]}>
                        <InputNumber style={{width: "20%"}}/>
                    </Form.Item>
                    <Form.Item label={t('ColEditor.CenterRateMax')}>
                        <Flex gap="middle">
                            <Form.Item name={[name, "centerRateMax", 0]} noStyle>
                                <InputNumber
                                    addonBefore="CRX"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "centerRateMax", 1]} noStyle>
                                <InputNumber
                                    addonBefore="CRY"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                            <Form.Item name={[name, "centerRateMax", 2]} noStyle>
                                <InputNumber
                                    addonBefore="CRZ"
                                    style={{width: "20%"}}/>
                            </Form.Item>
                        </Flex>
                    </Form.Item>
                </>
            )}

            {/* missingCollider 无字段，不需要额外内容 */}
        </div>
    );
};

/** 样式2：直接用 Monaco Editor 展示/编辑整个 JSON */
const Style2Properties: React.FC<{
    colData: ColModel | null;
    setColData: (m: ColModel | null) => void;
}> = ({colData, setColData}) => {
    const isDarkMode = useDarkMode();
    const [jsonValue, setJsonValue] = useState("");
    const editorRef = useRef<any>(null);
    const isInternalUpdate = useRef(false);
    const prevColDataRef = useRef<string | null>(null);

    // 处理 ColData 的外部更新（如文件加载）
    useEffect(() => {
        if (colData) {
            const colDataJson = JSON.stringify(colData);
            // Only update if this is an external change, not from our editor
            if (!isInternalUpdate.current && colDataJson !== prevColDataRef.current) {
                setJsonValue(JSON.stringify(colData, null, 2));
                prevColDataRef.current = colDataJson;
            }
        } else {
            setJsonValue("");
            prevColDataRef.current = null;
        }
    }, [colData]);

    // 初始化第一次渲染
    useEffect(() => {
        console.log(colData)
        if (colData) {
            setJsonValue(JSON.stringify(colData, null, 2));
            prevColDataRef.current = JSON.stringify(colData);
        }
    }, []);

    // Handle the editor being mounted
    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
    };

    // When user edits in the editor
    const handleEditorChange = (value?: string) => {
        const newVal = value ?? "";

        // Update local state without full re-render
        if (newVal !== jsonValue) {
            setJsonValue(newVal);
        }

        try {
            const parsed = JSON.parse(newVal);

            // Only update parent if actual content changed
            if (JSON.stringify(parsed) !== JSON.stringify(colData)) {
                isInternalUpdate.current = true;
                setColData(parsed);
                prevColDataRef.current = JSON.stringify(parsed);

                // Reset the flag after a delay to allow React to process
                setTimeout(() => {
                    isInternalUpdate.current = false;
                }, 0);
            }
        } catch (err) {
            // JSON is not valid, don't update parent
        }
    };

    return (
        <div style={{height: "calc(100vh - 230px)"}}>
            <Editor
                language="json"
                theme={isDarkMode ? "vs-dark" : "vs"}
                value={jsonValue}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: {enabled: true},
                    tabSize: 2,
                }}
            />
        </div>
    );
};


/** ColEditorProps:
 *  filePath: 传入要打开的 .col 文件路径
 */
interface ColEditorProps {
    filePath?: string;
}

/** ColEditorRef:
 *  提供给父组件或外部的操作方法，例如读取、保存、另存为
 */
export interface ColEditorRef {
    handleReadColFile: () => Promise<void>;
    handleSaveColFile: () => Promise<void>;
    handleSaveAsColFile: () => Promise<void>;
}

/**
 * ColEditor 组件：
 *  - 读取/编辑/保存 .col 文件
 *  - 类似 MateEditor 的用法
 */
const ColEditor = forwardRef<ColEditorRef, ColEditorProps>((props, ref) => {
    const {t} = useTranslation();
    const {filePath} = props;

    // Col 数据对象
    const [colData, setColData] = useState<ColModel | null>(null);

    // 是否允许编辑 Signature、Version 等字段
    const [headerEditable, setHeaderEditable] = useState(false);

    // antd form
    const [form] = Form.useForm();

    // 用来切换视图模式
    const [viewMode, setViewMode] = useState<1 | 2>(() => {
        const saved = localStorage.getItem("colEditorViewMode");
        return saved ? Number(saved) as 1 | 2 : 1;
    });

    /** 组件挂载或 filePath 改变时，如果传入了 filePath 就自动读取一次 */
    useEffect(() => {
        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle(
                "COM3D2 MOD EDITOR V2 —— Editing: " + fileName + "  (" + filePath + ")"
            );
            handleReadColFile();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            // 没有 filePath 时，可初始化一个新的 Col 对象
            const empty = new ColModel();
            empty.Signature = COM3D2HeaderConstants.ColSignature;
            empty.Version = COM3D2HeaderConstants.ColVersion;
            empty.Colliders = [];
            setColData(empty);
            form.resetFields();
        }
    }, [filePath]);


    /** 读取 Col 文件 */
    async function handleReadColFile() {
        if (!filePath) {
            message.error(t('Infos.pls_open_file_first'));
            return;
        }
        try {
            const data = await ReadColFile(filePath);
            setColData(data);
            // 映射到 Form
            form.setFieldsValue(transformColToForm(data));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.read_mate_file_failed_colon') + error);
        }
    }

    /** 保存 Col 文件（覆盖写回） */
    async function handleSaveColFile() {
        if (!filePath) {
            message.error(t('Errors.pls_input_file_path_first'));
            return;
        }
        if (!colData) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }
        try {
            // 模式 2 JSON 编辑，直接保存
            if (viewMode === 2) {
                await WriteColFile(filePath, colData);
                message.success(t('Infos.success_save_file'));
                return;
            }
            // 其他模式使用表单数据
            // 拿到表单最新数据并组装回 Col 对象
            const values = form.getFieldsValue(true);
            const newCol = transformFormToCol(values, colData);

            await WriteColFile(filePath, newCol);
            message.success(t('Infos.success_save_file'));
        } catch (error: any) {
            console.error(error);
            message.error(t('Errors.save_file_failed_colon') + error);
        }
    }

    /** 另存为 Col 文件 */
    async function handleSaveAsColFile() {
        if (!colData) {
            message.error("请先读取或新建一个 Col 再尝试另存为");
            return;
        }

        try {
            // 模式 2 JSON 编辑，直接保存
            if (viewMode === 2) {

                const newPath = await SaveFile("*.col", t('Infos.com3d2_col_file'));
                if (!newPath) {
                    // 用户取消
                    return;
                }
                await WriteColFile(newPath, colData);
                message.success(t('Infos.success_save_as_file_colon') + newPath);
            }


            const values = form.getFieldsValue(true);
            const newCol = transformFormToCol(values, colData);

            // 让用户选择一个保存路径
            const newPath = await SaveFile("*.col", t('Infos.com3d2_col_file'));
            if (!newPath) {
                // 用户取消
                return;
            }
            await WriteColFile(newPath, newCol);
            message.success(t('Infos.success_save_as_file_colon') + newPath);
        } catch (error: any) {
            message.error(t('Errors.save_as_file_failed_colon') + error.message);
            console.error(error);
        }
    }

    /** 监听 Ctrl+S，进行保存 */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSaveColFile();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSaveColFile]);


    /** 暴露给父组件的 Ref 方法：读取、保存、另存为 */
    useImperativeHandle(ref, () => ({
        handleReadColFile,
        handleSaveColFile,
        handleSaveAsColFile
    }));

    /**
     * 将后端的 Col 对象 -> 前端表单字段
     */
// 要在 transformColToForm 函数内进行的修改
    function transformColToForm(col: ColModel) {
        // 1. 先给每个 collider 注入推断后的 TypeName（如果还没有）
        (col.Colliders || []).forEach((collider: any) => {
            if (!("TypeName" in collider)) {
                collider.TypeName = guessColliderType(collider);
            }
        });

        // 2. 返回顶层字段 + 一个统一的“properties”
        return {
            signature: col.Signature,
            version: col.Version,
            // 将 colliders
            colliders: col.Colliders?.map((collider: any) => {
                const base = (collider.Base as DynamicBoneColliderBase) || {};
                // 这里统一用 propType 来表示类型
                const item: any = {
                    propType: collider.TypeName,
                    parentName: base.ParentName,
                    selfName: base.SelfName,
                    localPosition: base.LocalPosition || [0, 0, 0],
                    localRotation: base.LocalRotation || [0, 0, 0, 0],
                    localScale: base.LocalScale || [1, 1, 1],
                    direction: base.Direction,
                    center: base.Center || [0, 0, 0],
                    bound: base.Bound
                };

                switch (collider.TypeName) {
                    case "dbc":
                        item.radius = collider.Radius;
                        item.height = collider.Height;
                        break;
                    case "dbm":
                        item.radius = collider.Radius;
                        item.height = collider.Height;
                        item.scaleRateMulMax = collider.ScaleRateMulMax;
                        item.centerRateMax = collider.CenterRateMax || [0, 0, 0];
                        break;
                    case "dpc":
                        // DynamicBonePlaneCollider 没有额外字段
                        break;
                    case "missing":
                        // missingCollider 无额外字段
                        break;
                    default:
                        // 如果有其他未识别类型，可在此处理
                        break;
                }
                return item;
            })
        };
    }


    /**
     * 前端表单字段 -> Col 对象
     */
    function transformFormToCol(values: any, oldCol: ColModel): ColModel {
        // 复制一份
        const newCol = COM3D2.Col.createFrom(oldCol);

        if (headerEditable) {
            newCol.Signature = values.signature;
            newCol.Version = parseInt(values.version, 10);
        }

        // 处理 colliders
        const newColliders: any[] = [];
        if (Array.isArray(values.colliders)) {
            for (const item of values.colliders) {
                const typeName = item.TypeName;
                if (!typeName) {
                    // 无类型，不处理
                    continue;
                }

                // 先构造 base
                const baseData = new DynamicBoneColliderBase({
                    TypeName: typeName,
                    ParentName: item.parentName || "",
                    SelfName: item.selfName || "",
                    LocalPosition: item.localPosition || [0, 0, 0],
                    LocalRotation: item.localRotation || [0, 0, 0, 0],
                    LocalScale: item.localScale || [1, 1, 1],
                    Direction: Number(item.direction),
                    Center: item.center || [0, 0, 0],
                    Bound: Number(item.bound)
                });

                // 根据类型生成对应 collider
                switch (typeName) {
                    case "dbc": {
                        const dbc = new DynamicBoneCollider({
                            TypeName: "dbc",
                            Base: baseData,
                            Radius: parseFloat(item.radius) || 0,
                            Height: parseFloat(item.height) || 0
                        });
                        newColliders.push(dbc);
                        break;
                    }
                    case "dbm": {
                        const dbm = new DynamicBoneMuneCollider({
                            TypeName: "dbm",
                            Base: baseData,
                            Radius: parseFloat(item.radius) || 0,
                            Height: parseFloat(item.height) || 0,
                            ScaleRateMulMax: parseFloat(item.scaleRateMulMax) || 0,
                            CenterRateMax: item.centerRateMax || [0, 0, 0]
                        });
                        newColliders.push(dbm);
                        break;
                    }
                    case "dpc": {
                        const dpc = new DynamicBonePlaneCollider({
                            TypeName: "dpc",
                            Base: baseData
                        });
                        newColliders.push(dpc);
                        break;
                    }
                    case "missing": {
                        const mc = new MissingCollider({
                            TypeName: "missing",
                        }); // 无字段
                        newColliders.push(mc);
                        break;
                    }
                }
            }
        }
        newCol.Colliders = newColliders;
        return newCol;
    }

    /** 根据结构推断数据类型 */
    function guessColliderType(colliderObj: any): string {
        // 根据已知字段判断
        if (colliderObj?.Radius !== undefined && colliderObj?.Height !== undefined && colliderObj?.ScaleRateMulMax !== undefined && colliderObj?.CenterRateMax !== undefined) {
            return "dbm";
        } else if (colliderObj?.Radius !== undefined && colliderObj?.Height !== undefined) {
            return "dbc";
        } else if (colliderObj?.Base !== undefined && colliderObj?.Radius === undefined && colliderObj?.Height === undefined) {
            if (colliderObj?.Base) return "dpc"; // dpc 只有基类
        } else if (colliderObj?.Base === undefined) {
            return "missing"; // missing 什么都没有
        }
        return "missing";
    }

    // 当 colData 变化时同步到表单
    useEffect(() => {
        if (colData) {
            const formValues = transformColToForm(colData);
            form.setFieldsValue(formValues);
        }
    }, [colData, form]);


    return (
        <div style={{padding: 10}}>
            <ConfigProvider
                theme={{
                    components: {
                        Form: {
                            itemMarginBottom: 10
                        }
                    }
                }}
            >
                <Form
                    form={form}
                    layout="horizontal"
                    labelAlign="left"
                    size="small"
                    labelCol={{style: {width: '10vw'}}}
                >
                    <Collapse defaultActiveKey={["basic", "colliders"]}>
                        <Collapse.Panel header={t('ColEditor.file_header.file_head')} key="basic">
                            <Space>
                                <Form.Item name="signature"
                                           initialValue={COM3D2HeaderConstants.ColSignature.toString()}>
                                    <Input
                                        disabled={!headerEditable}
                                        addonBefore={t('ColEditor.file_header.Signature')}
                                    />
                                </Form.Item>
                                <Form.Item name="version" initialValue={COM3D2HeaderConstants.ColVersion.toString()}>
                                    <Input
                                        disabled={!headerEditable}
                                        addonBefore={t('ColEditor.file_header.Version')}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Checkbox
                                        checked={headerEditable}
                                        onChange={(e) => setHeaderEditable(e.target.checked)}
                                    >
                                        {t('ColEditor.file_header.enable_edit_do_not_edit')}
                                    </Checkbox>
                                </Form.Item>
                            </Space>
                        </Collapse.Panel>
                        <Collapse.Panel header={t('ColEditor.Colliders')} key="colliders">
                            <div style={{marginBottom: 8}}>
                                <Radio.Group
                                    block
                                    value={viewMode}
                                    onChange={(e) => {
                                        // Get current form values and update mateData before switching view
                                        const currentFormValues = form.getFieldsValue(true);
                                        if (colData && (viewMode != 2)) { // 非模式 2 时更新表单数据，因为模式 2 是 JSON
                                            const updatedCol = transformFormToCol(currentFormValues, colData);
                                            setColData(updatedCol);
                                        }

                                        setViewMode(e.target.value);
                                        localStorage.setItem('colEditorViewMode', e.target.value.toString());
                                    }}
                                    options={[
                                        {label: t('ColEditor.style1'), value: 1},
                                        {label: t('ColEditor.style2'), value: 2},
                                    ]}
                                    optionType="button"
                                    buttonStyle="solid"
                                />
                            </div>

                            {viewMode === 1 && (
                                <Form.List name="colliders">
                                    {(fields, {add, remove}) =>
                                        <Style1Colliders
                                            fields={fields}
                                            add={add}
                                            remove={remove}
                                            form={form}
                                        />
                                    }
                                </Form.List>
                            )}

                            {viewMode === 2 && (
                                <Style2Properties
                                    colData={colData}
                                    setColData={(newVal) => setColData(newVal)}
                                />
                            )}
                        </Collapse.Panel>
                    </Collapse>
                </Form>
            </ConfigProvider>
        </div>
    );
});

export default ColEditor;