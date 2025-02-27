import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {
    Button,
    Checkbox,
    Col as AntdCol,
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
    Space
} from "antd";
import type {FormListOperation} from "antd/es/form";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {COM3D2} from "../../wailsjs/go/models";
import {SaveFile} from "../../wailsjs/go/main/App";
import {ReadColFile, WriteColFile} from "../../wailsjs/go/COM3D2/ColService";
import ColModel = COM3D2.Col; // 注意别名，避免与 antd 的 Col 冲突
import DynamicBoneColliderBase = COM3D2.DynamicBoneColliderBase;
import DynamicBoneCollider = COM3D2.DynamicBoneCollider;
import DynamicBonePlaneCollider = COM3D2.DynamicBonePlaneCollider;
import DynamicBoneMuneCollider = COM3D2.DynamicBoneMuneCollider;
import MissingCollider = COM3D2.MissingCollider;

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
    const {filePath} = props;

    // Col 数据对象
    const [colData, setColData] = useState<ColModel | null>(null);

    // 是否允许编辑 Signature、Version 等字段
    const [headerEditable, setHeaderEditable] = useState(false);

    // antd form
    const [form] = Form.useForm();

    // 用来切换视图模式（类似 MateEditor 里的两种布局）
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
            message.error("未指定文件路径");
            return;
        }
        if (!colData) {
            message.error("当前没有已加载的 Col 数据");
            return;
        }
        try {
            // 拿到表单最新数据并组装回 Col 对象
            const values = form.getFieldsValue(true);
            const newCol = transformFormToCol(values, colData);

            await WriteColFile(filePath, newCol);
            message.success("保存成功");
        } catch (err: any) {
            message.error(`保存失败: ${err.message}`);
            console.error(err);
        }
    }

    /** 另存为 Col 文件 */
    async function handleSaveAsColFile() {
        if (!colData) {
            message.error("请先读取或新建一个 Col 再尝试另存为");
            return;
        }
        try {
            const values = form.getFieldsValue(true);
            const newCol = transformFormToCol(values, colData);

            // 让用户选择一个保存路径（后端 App.SaveFile 示例）
            const newPath = await SaveFile("*.col", "COM3D2 Collider File");
            if (!newPath) {
                // 用户取消
                return;
            }
            await WriteColFile(newPath, newCol);
            message.success(`另存为成功: ${newPath}`);
        } catch (err: any) {
            message.error(`另存为失败: ${err.message}`);
            console.error(err);
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
                    _typeName: typeName,
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
                        formItem.radius = collider.Radius;
                        formItem.height = collider.Height;
                        break;
                    }
                    case "dbm": {
                        // DynamicBoneMuneCollider
                        formItem.radius = collider.Radius;
                        formItem.height = collider.Height;
                        formItem.scaleRateMulMax = collider.ScaleRateMulMax;
                        formItem.centerRateMax = collider.CenterRateMax || [0, 0, 0];
                        break;
                    }
                    case "dpc": {
                        // PlaneCollider 只有 base，没有额外字段
                        break;
                    }
                    case "missing": {
                        // missingCollider 无字段
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
                const typeName = item._typeName;
                if (!typeName) {
                    // 无类型，不处理
                    continue;
                }

                // 先构造 base
                const baseData = new DynamicBoneColliderBase({
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
                            Base: baseData,
                            Radius: parseFloat(item.radius) || 0,
                            Height: parseFloat(item.height) || 0
                        });
                        newColliders.push(dbc);
                        break;
                    }
                    case "dbm": {
                        const dbm = new DynamicBoneMuneCollider({
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
                            Base: baseData
                        });
                        newColliders.push(dpc);
                        break;
                    }
                    case "missing": {
                        const mc = new MissingCollider(); // 无字段
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
                    const typeName = form.getFieldValue(["colliders", name, "_typeName"]);
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
        const typeName = Form.useWatch(["colliders", name, "_typeName"], form);

        return (
            <Space direction="vertical" style={{width: "100%"}}>
                <Form.Item
                    label="Collider类型"
                    name={[name, "_typeName"]}
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
                        <Collapse.Panel header="File Header" key="basic">
                            <Space wrap>
                                <Form.Item label="Signature" name="signature">
                                    <Input disabled={!headerEditable}/>
                                </Form.Item>
                                <Form.Item label="Version" name="version">
                                    <InputNumber disabled={!headerEditable}/>
                                </Form.Item>
                                <Form.Item>
                                    <Checkbox
                                        checked={headerEditable}
                                        onChange={(e) => setHeaderEditable(e.target.checked)}
                                    >
                                        允许编辑文件头（一般不建议修改）
                                    </Checkbox>
                                </Form.Item>
                            </Space>
                        </Collapse.Panel>
                        <Collapse.Panel header="Colliders" key="colliders">
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
                        </Collapse.Panel>
                    </Collapse>
                </Form>
            </ConfigProvider>
        </div>
    );
});

export default ColEditor;
