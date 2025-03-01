import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {
    Button,
    Checkbox,
    Collapse,
    ConfigProvider,
    Divider,
    Form,
    FormListFieldData,
    Input,
    InputNumber,
    message,
    Radio,
    Space
} from "antd";
import type {FormListOperation} from "antd/es/form";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {SaveFile} from "../../wailsjs/go/main/App";
import {ReadColFile, WriteColFile} from "../../wailsjs/go/COM3D2/ColService";
import {useDarkMode} from "../hooks/themeSwitch";
import {Editor} from "@monaco-editor/react";
import {useTranslation} from "react-i18next";
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
                            style={{position: "absolute", top: 4, right: 4}}
                            danger
                        >
                            删除
                        </Button>
                        <Divider orientation="left" plain>
                            {typeName}
                        </Divider>
                    </div>
                );
            })}
            <Button icon={<></>} block type="primary" onClick={() => add()}>
                添加新Collider
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
    // 这里可以使用 <Form.Item> 包裹具体的字段
    // 其中 position/rotation/scale/center 都是 array，可以做成 3/4 个 <InputNumber> 并排
    const typeName = Form.useWatch(["colliders", name, "TypeName"], form);

    return (
        <Space direction="vertical" style={{width: "100%"}}>
            <Form.Item
                label="Collider类型"
                name={[name, "TypeName"]}
                rules={[{required: true, message: "请选择 Collider 类型"}]}
            >
                <Radio.Group>
                    <Radio value="dbc">dbc</Radio>
                    <Radio value="dpc">dpc</Radio>
                    <Radio value="dbm">dbm</Radio>
                    <Radio value="missing">missing</Radio>
                </Radio.Group>
            </Form.Item>

            {/* base 公共字段 */}
            <Form.Item label="ParentName" name={[name, "parentName"]}>
                <Input/>
            </Form.Item>
            <Form.Item label="SelfName" name={[name, "selfName"]}>
                <Input/>
            </Form.Item>

            {/* LocalPosition (3个数) */}
            <Form.Item label="LocalPosition">
                <Input.Group compact>
                    <Form.Item name={[name, "localPosition", 0]} noStyle>
                        <InputNumber style={{width: "33%"}} placeholder="x"/>
                    </Form.Item>
                    <Form.Item name={[name, "localPosition", 1]} noStyle>
                        <InputNumber style={{width: "33%"}} placeholder="y"/>
                    </Form.Item>
                    <Form.Item name={[name, "localPosition", 2]} noStyle>
                        <InputNumber style={{width: "33%"}} placeholder="z"/>
                    </Form.Item>
                </Input.Group>
            </Form.Item>

            {/* LocalRotation (4个数) */}
            <Form.Item label="LocalRotation">
                <Input.Group compact>
                    <Form.Item name={[name, "localRotation", 0]} noStyle>
                        <InputNumber style={{width: "25%"}} placeholder="x"/>
                    </Form.Item>
                    <Form.Item name={[name, "localRotation", 1]} noStyle>
                        <InputNumber style={{width: "25%"}} placeholder="y"/>
                    </Form.Item>
                    <Form.Item name={[name, "localRotation", 2]} noStyle>
                        <InputNumber style={{width: "25%"}} placeholder="z"/>
                    </Form.Item>
                    <Form.Item name={[name, "localRotation", 3]} noStyle>
                        <InputNumber style={{width: "25%"}} placeholder="w"/>
                    </Form.Item>
                </Input.Group>
            </Form.Item>

            {/* LocalScale (3个数) */}
            <Form.Item label="LocalScale">
                <Input.Group compact>
                    <Form.Item name={[name, "localScale", 0]} noStyle>
                        <InputNumber style={{width: "33%"}} placeholder="sx"/>
                    </Form.Item>
                    <Form.Item name={[name, "localScale", 1]} noStyle>
                        <InputNumber style={{width: "33%"}} placeholder="sy"/>
                    </Form.Item>
                    <Form.Item name={[name, "localScale", 2]} noStyle>
                        <InputNumber style={{width: "33%"}} placeholder="sz"/>
                    </Form.Item>
                </Input.Group>
            </Form.Item>

            <Form.Item label="Direction" name={[name, "direction"]}>
                <InputNumber/>
            </Form.Item>

            <Form.Item label="Center">
                <Input.Group compact>
                    <Form.Item name={[name, "center", 0]} noStyle>
                        <InputNumber style={{width: "33%"}} placeholder="cx"/>
                    </Form.Item>
                    <Form.Item name={[name, "center", 1]} noStyle>
                        <InputNumber style={{width: "33%"}} placeholder="cy"/>
                    </Form.Item>
                    <Form.Item name={[name, "center", 2]} noStyle>
                        <InputNumber style={{width: "33%"}} placeholder="cz"/>
                    </Form.Item>
                </Input.Group>
            </Form.Item>

            <Form.Item label="Bound" name={[name, "bound"]}>
                <InputNumber/>
            </Form.Item>

            {/* 只有 dbc/dbm 才显示 radius/height */}
            {(typeName === "dbc" || typeName === "dbm") && (
                <>
                    <Form.Item label="Radius" name={[name, "radius"]}>
                        <InputNumber/>
                    </Form.Item>
                    <Form.Item label="Height" name={[name, "height"]}>
                        <InputNumber/>
                    </Form.Item>
                </>
            )}

            {/* dbm 独有的字段 */}
            {typeName === "dbm" && (
                <>
                    <Form.Item label="ScaleRateMulMax" name={[name, "scaleRateMulMax"]}>
                        <InputNumber/>
                    </Form.Item>
                    <Form.Item label="CenterRateMax">
                        <Input.Group compact>
                            <Form.Item name={[name, "centerRateMax", 0]} noStyle>
                                <InputNumber style={{width: "33%"}} placeholder="crx"/>
                            </Form.Item>
                            <Form.Item name={[name, "centerRateMax", 1]} noStyle>
                                <InputNumber style={{width: "33%"}} placeholder="cry"/>
                            </Form.Item>
                            <Form.Item name={[name, "centerRateMax", 2]} noStyle>
                                <InputNumber style={{width: "33%"}} placeholder="crz"/>
                            </Form.Item>
                        </Input.Group>
                    </Form.Item>
                </>
            )}

            {/* missingCollider 无字段，不需要额外内容 */}
        </Space>
    );
};

/** 样式2：直接用 Monaco Editor 展示/编辑整个 JSON */
// const Style2Properties: React.FC<{
//     colData: ColModel | null;
//     setColData: (m: ColModel | null) => void;
// }> = ({colData, setColData}) => {
//     const isDarkMode = useDarkMode();
//     const [jsonValue, setJsonValue] = useState("");
//
//     useEffect(() => {
//         if (colData) {
//             // 初次/每次切换时，把对象序列化为 JSON
//             setJsonValue(JSON.stringify(colData, null, 2));
//         } else {
//             setJsonValue("");
//         }
//     }, []);
//
//     // 当用户在编辑器里输入时
//     const handleEditorChange = (value?: string) => {
//         const newVal = value ?? "";
//         setJsonValue(newVal);
//
//         try {
//             const parsed = JSON.parse(newVal);
//
//             if (JSON.stringify(parsed) !== JSON.stringify(colData)) {
//                 setColData(parsed);
//             }
//         } catch (err) {
//             // JSON 不合法就先不往外层写
//         }
//     };
//
//     return (
//         <div style={{height: "calc(100vh - 230px)"}}>
//             <Editor
//                 language="json"
//                 theme={isDarkMode ? "vs-dark" : "vs"}
//                 value={jsonValue}
//                 onChange={handleEditorChange}
//                 options={{
//                     minimap: {enabled: true},
//                     tabSize: 2,
//                 }}
//             />
//         </div>
//     );
// };

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
            WindowSetTitle("COM3D2 MOD EDITOR V2");
            // 没有 filePath 时，可初始化一个新的 Col 对象
            const empty = new ColModel();
            empty.Signature = "CM3D21_COL";
            empty.Version = 24102;
            empty.Colliders = [];
            setColData(empty);
            form.resetFields();
        }
    }, [filePath]);

    /** 暴露给父组件的 Ref 方法：读取、保存、另存为 */
    useImperativeHandle(ref, () => ({
        handleReadColFile,
        handleSaveColFile,
        handleSaveAsColFile
    }));

    /** 读取 Col 文件 */
    async function handleReadColFile() {
        if (!filePath) {
            message.error("请先选择一个 .col 文件");
            return;
        }
        try {
            const data = await ReadColFile(filePath);
            setColData(data);
            // 映射到 Form
            form.setFieldsValue(transformColToForm(data));
            message.success(`读取成功: ${filePath}`);
        } catch (err: any) {
            message.error(`读取失败: ${err.message}`);
            console.error(err);
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
            message.error(t('Errors.save_file_failed_colon') + error);
            console.error(error);
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

    /**
     * 将后端的 Col 对象 -> 前端表单字段
     */
    function transformColToForm(col: ColModel) {
        return {
            signature: col.Signature,
            version: col.Version,
            // colliders 是一个 Form.List，要将每个 collider 转成一条记录
            colliders: (col.Colliders || []).map((collider: any) => {
                // collider 可能是 dbc / dpc / dbm / missing
                // 后端使用 interface 实现的多态，所以前端只能类型推断了
                const typeName = guessColliderType(collider);

                // 先把 base 中的数据拿出来
                let base = (collider.Base as DynamicBoneColliderBase) || {};
                const formItem: any = {
                    TypeName: typeName,
                    parentName: base.ParentName,
                    selfName: base.SelfName,
                    localPosition: base.LocalPosition || [0, 0, 0],
                    localRotation: base.LocalRotation || [0, 0, 0, 0],
                    localScale: base.LocalScale || [1, 1, 1],
                    direction: base.Direction,
                    center: base.Center || [0, 0, 0],
                    bound: base.Bound
                };

                // 根据不同类型追加字段
                switch (typeName) {
                    case "dbc": {
                        // DynamicBoneCollider
                        formItem.TypeName = "dbc";
                        formItem.radius = collider.Radius;
                        formItem.height = collider.Height;
                        break;
                    }
                    case "dbm": {
                        // DynamicBoneMuneCollider
                        formItem.TypeName = "dbm";
                        formItem.radius = collider.Radius;
                        formItem.height = collider.Height;
                        formItem.scaleRateMulMax = collider.ScaleRateMulMax;
                        formItem.centerRateMax = collider.CenterRateMax || [0, 0, 0];
                        break;
                    }
                    case "dpc": {
                        // DynamicBonePlaneCollider
                        formItem.TypeName = "dpc";
                        // PlaneCollider 只有 base，没有额外字段
                        break;
                    }
                    case "missing": {
                        // missingCollider 无字段
                        formItem.TypeName = "missing";
                        break;
                    }
                }
                return formItem;
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
            newCol.Version = Number(values.version);
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
                    labelCol={{style: {width: "180px"}}}
                >
                    <Collapse defaultActiveKey={["basic", "colliders"]}>
                        <Collapse.Panel header={t('ColEditor.file_header.file_head')} key="basic">
                            <Space>
                                <Form.Item name="signature" initialValue="CM3D21_COL">
                                    <Input
                                        disabled={!headerEditable}
                                        addonBefore={t('ColEditor.file_header.Signature')}
                                    />
                                </Form.Item>
                                <Form.Item name="version" initialValue="1001">
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
                                        if (colData && viewMode !== 2) { // 非模式 2 时更新表单数据，因为模式 2 是 JSON
                                            const updatedCol = transformFormToCol(currentFormValues, colData);
                                            setColData(updatedCol);
                                        }

                                        setViewMode(e.target.value);
                                        localStorage.setItem('mateEditorViewMode', e.target.value.toString());
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


//TODO 无法保存