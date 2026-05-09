import React, {useMemo, useState} from "react";
import {
    Alert,
    Button,
    Card,
    Checkbox,
    Col,
    Divider,
    Empty,
    FloatButton,
    Input,
    InputNumber,
    Layout,
    List,
    message,
    Modal,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tabs,
    Tag,
    Typography
} from "antd";
import type {ColumnsType} from "antd/es/table";
import {
    BranchesOutlined,
    DeleteOutlined,
    ExperimentOutlined,
    FileAddOutlined,
    FolderOpenOutlined,
    PlusOutlined,
    QuestionCircleOutlined,
    ReloadOutlined
} from "@ant-design/icons";
import {useTranslation} from "react-i18next";
import NavBar from "./NavBar";
import useFileHandlers from "../hooks/fileHanlder";
import {AllSupportedFileTypes} from "../utils/consts";
import {SelectDirectory, SelectFile} from "../../wailsjs/go/main/App";
import {
    AnalyzeDiffGeneration,
    AnalyzeMateVariantBase,
    AnalyzeMenuVariantBases,
    GenerateMateVariants,
    GenerateMenuVariants
} from "../../wailsjs/go/COM3D2/DiffGeneratorService";
import {COM3D2} from "../../wailsjs/go/models";

const {Content} = Layout;
const {Text, Title} = Typography;

type MateKeywordDraft = {
    id: string;
    Key: string;
    Value: boolean;
};

type MateOverrideDraft = {
    id: string;
    Type: string;
    PropName: string;
    TexName?: string;
    TexPath?: string;
    OffsetX?: number;
    OffsetY?: number;
    ScaleX?: number;
    ScaleY?: number;
    R?: number;
    G?: number;
    B?: number;
    A?: number;
    X?: number;
    Y?: number;
    Z?: number;
    W?: number;
    Number?: number;
    Keywords?: MateKeywordDraft[];
};

type MateVariantDraft = {
    id: string;
    Index: number;
    Name: string;
    OutputName?: string;
    MateName?: string;
    MaterialName?: string;
    ShaderName?: string;
    ShaderFilename?: string;
    Overrides: MateOverrideDraft[];
};

type MenuReplacementDraft = {
    id: string;
    Command?: string;
    ArgIndex?: number;
    From?: string;
    To?: string;
    FileType?: string;
};

type MenuVariantDraft = {
    id: string;
    Index: number;
    Name: string;
    OutputName?: string;
    ItemName?: string;
    InfoText?: string;
    Replacements: MenuReplacementDraft[];
};

type DiffMenuGroupWithFiles = COM3D2.DiffMenuGroup & {
    Files?: string[];
};

type DiffGenerationAnalysisWithMenuFiles = COM3D2.DiffGenerationAnalysis & {
    MenuGroups?: DiffMenuGroupWithFiles[];
};

const fileTypeOptions = [
    {value: "menu", label: "menu"},
    {value: "mate", label: "mate"},
    {value: "model", label: "model"},
    {value: "tex", label: "tex"},
    {value: "anm", label: "anm"},
    {value: "col", label: "col"},
    {value: "phy", label: "phy"},
    {value: "psk", label: "psk"},
    {value: "pmat", label: "pmat"},
    {value: "nei", label: "nei"},
];

const propertyTypeOptions = [
    {value: "tex", label: "tex"},
    {value: "col", label: "col"},
    {value: "vec", label: "vec"},
    {value: "f", label: "f"},
    {value: "range", label: "range"},
    {value: "tex_offset", label: "tex_offset"},
    {value: "tex_scale", label: "tex_scale"},
    {value: "keyword", label: "keyword"},
];

const commandOptions = [
    "additem",
    "マテリアル変更",
    "tex",
    "テクスチャ変更",
    "テクスチャ合成",
    "anime",
    "cutout消去cc",
    "アイテム",
    "アイテム条件",
    "リソース参照",
    "半脱ぎ",
    "icon",
    "icons",
].map(value => ({value, label: value}));

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const blankMateVariant = (index: number, analysis?: COM3D2.MateVariantAnalysis): MateVariantDraft => ({
    id: createId(),
    Index: index,
    Name: `z${index}`,
    ShaderName: analysis?.Shader?.ShaderName ?? "",
    ShaderFilename: analysis?.Shader?.ShaderFilename ?? "",
    Overrides: [],
});

const blankMenuVariant = (index: number): MenuVariantDraft => ({
    id: createId(),
    Index: index,
    Name: `z${index}`,
    Replacements: [],
});

const compactAddonStyle: React.CSSProperties = {
    minWidth: 82,
    justifyContent: "center",
};

const compactSwitchStyle: React.CSSProperties = {
    alignItems: "center",
    background: "#fff",
    border: "1px solid #d9d9d9",
    borderLeft: 0,
    borderRadius: "0 6px 6px 0",
    display: "flex",
    flex: 1,
    minHeight: 32,
    padding: "0 11px",
};

const completeNumberArray = (...values: Array<number | undefined>): number[] => {
    if (!values.every(value => typeof value === "number")) {
        return [];
    }
    return values.map(value => value as number);
};

const keywordDraftsFromValues = (keywords?: COM3D2.MateKeywordValue[]): MateKeywordDraft[] => {
    return keywords?.map(keyword => ({
        id: createId(),
        Key: keyword.Key ?? "",
        Value: keyword.Value,
    })) ?? [];
};

const mateOverrideDefaults = (type: string): Partial<MateOverrideDraft> => {
    switch (type) {
        case "tex":
            return {
                TexName: "",
                TexPath: "",
                OffsetX: undefined,
                OffsetY: undefined,
                ScaleX: undefined,
                ScaleY: undefined
            };
        case "col":
            return {R: undefined, G: undefined, B: undefined, A: undefined};
        case "vec":
            return {X: undefined, Y: undefined, Z: undefined, W: undefined};
        case "f":
        case "range":
            return {Number: undefined};
        case "tex_offset":
            return {OffsetX: undefined, OffsetY: undefined};
        case "tex_scale":
            return {ScaleX: undefined, ScaleY: undefined};
        case "keyword":
            return {Keywords: []};
        default:
            return {};
    }
};

const mateOverrideFromProperty = (prop: COM3D2.MateVariantPropertyInfo): Partial<MateOverrideDraft> => {
    const values = prop.Values ?? [];
    switch (prop.Type) {
        case "tex":
            return {
                Type: prop.Type,
                PropName: prop.PropName ?? "",
                TexName: prop.TexName ?? "",
                TexPath: prop.TexPath ?? "",
                OffsetX: prop.Offset?.[0],
                OffsetY: prop.Offset?.[1],
                ScaleX: prop.Scale?.[0],
                ScaleY: prop.Scale?.[1],
            };
        case "col":
            return {
                Type: prop.Type,
                PropName: prop.PropName ?? "",
                R: values[0],
                G: values[1],
                B: values[2],
                A: values[3],
            };
        case "vec":
            return {
                Type: prop.Type,
                PropName: prop.PropName ?? "",
                X: values[0],
                Y: values[1],
                Z: values[2],
                W: values[3],
            };
        case "f":
        case "range":
            return {
                Type: prop.Type,
                PropName: prop.PropName ?? "",
                Number: prop.Number,
            };
        case "tex_offset":
            return {
                Type: prop.Type,
                PropName: prop.PropName ?? "",
                OffsetX: values[0],
                OffsetY: values[1],
            };
        case "tex_scale":
            return {
                Type: prop.Type,
                PropName: prop.PropName ?? "",
                ScaleX: values[0],
                ScaleY: values[1],
            };
        case "keyword":
            return {
                Type: prop.Type,
                PropName: prop.PropName ?? "",
                Keywords: keywordDraftsFromValues(prop.Keywords),
            };
        default:
            return {
                Type: prop.Type,
                PropName: prop.PropName ?? "",
            };
    }
};

const mateOverrideToPayload = (override: MateOverrideDraft): COM3D2.MatePropertyOverride => {
    let values: number[] = [];
    let keywords: COM3D2.MateKeywordValue[] = [];

    switch (override.Type) {
        case "tex":
            values = completeNumberArray(override.OffsetX, override.OffsetY, override.ScaleX, override.ScaleY);
            break;
        case "col":
            values = completeNumberArray(override.R, override.G, override.B, override.A);
            break;
        case "vec":
            values = completeNumberArray(override.X, override.Y, override.Z, override.W);
            break;
        case "tex_offset":
            values = completeNumberArray(override.OffsetX, override.OffsetY);
            break;
        case "tex_scale":
            values = completeNumberArray(override.ScaleX, override.ScaleY);
            break;
        case "keyword":
            keywords = (override.Keywords ?? [])
                .filter(keyword => keyword.Key.trim())
                .map(keyword => ({
                    Key: keyword.Key.trim(),
                    Value: keyword.Value,
                } as COM3D2.MateKeywordValue));
            break;
    }

    return {
        Type: override.Type,
        PropName: override.PropName,
        TexName: override.TexName || "",
        TexPath: override.TexPath || "",
        Values: values,
        Number: override.Number ?? 0,
        Keywords: keywords,
    } as COM3D2.MatePropertyOverride;
};

const CompactTextInput: React.FC<{
    label: React.ReactNode;
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
}> = ({label, value, onChange, placeholder}) => (
    <Space.Compact block>
        <Space.Addon style={compactAddonStyle}>{label}</Space.Addon>
        <Input value={value ?? ""} onChange={event => onChange(event.target.value)} placeholder={placeholder}/>
    </Space.Compact>
);

const CompactNumberInput: React.FC<{
    label: React.ReactNode;
    value?: number;
    onChange: (value: number | undefined) => void;
    min?: number;
    step?: number;
}> = ({label, value, onChange, min, step = 0.01}) => (
    <Space.Compact block>
        <Space.Addon style={compactAddonStyle}>{label}</Space.Addon>
        <InputNumber
            min={min}
            step={step}
            value={value}
            onChange={nextValue => onChange(typeof nextValue === "number" ? nextValue : undefined)}
            style={{width: "100%"}}
        />
    </Space.Compact>
);

const CompactSelectInput: React.FC<{
    label: React.ReactNode;
    value?: string;
    options: { value: string; label: React.ReactNode }[];
    onChange: (value?: string) => void;
    onSearch?: (value: string) => void;
    placeholder?: string;
    showSearch?: boolean;
    allowClear?: boolean;
}> = ({label, value, options, onChange, onSearch, placeholder, showSearch, allowClear}) => (
    <Space.Compact block>
        <Space.Addon style={compactAddonStyle}>{label}</Space.Addon>
        <Select
            allowClear={allowClear}
            showSearch={showSearch}
            value={value || undefined}
            options={options}
            onChange={onChange}
            onSearch={onSearch}
            placeholder={placeholder}
            style={{width: "100%"}}
        />
    </Space.Compact>
);

const CompactSwitchInput: React.FC<{
    label: React.ReactNode;
    checked?: boolean;
    onChange: (checked: boolean) => void;
}> = ({label, checked, onChange}) => (
    <Space.Compact block>
        <Space.Addon style={compactAddonStyle}>{label}</Space.Addon>
        <div style={compactSwitchStyle}>
            <Switch
                checked={!!checked}
                onChange={onChange}
                checkedChildren="true"
                unCheckedChildren="false"
                size="small"
            />
        </div>
    </Space.Compact>
);

const MateOverrideValueFields: React.FC<{
    override: MateOverrideDraft;
    onChange: (patch: Partial<MateOverrideDraft>) => void;
}> = ({override, onChange}) => {
    const {t} = useTranslation();

    const keywords = override.Keywords ?? [];
    const updateKeyword = (keywordId: string, patch: Partial<MateKeywordDraft>) => {
        onChange({
            Keywords: keywords.map(keyword => keyword.id === keywordId ? {...keyword, ...patch} : keyword),
        });
    };
    const removeKeyword = (keywordId: string) => {
        onChange({Keywords: keywords.filter(keyword => keyword.id !== keywordId)});
    };
    const addKeyword = () => {
        onChange({Keywords: [...keywords, {id: createId(), Key: "", Value: true}]});
    };

    if (override.Type === "tex") {
        return (
            <Row gutter={[8, 8]}>
                <Col xs={24} md={8}>
                    <CompactTextInput label={t("MateEditor.tex2dName")} value={override.TexName}
                                      onChange={value => onChange({TexName: value})}/>
                </Col>
                <Col xs={24} md={10}>
                    <CompactTextInput label={t("MateEditor.tex2dPath")} value={override.TexPath}
                                      onChange={value => onChange({TexPath: value})}/>
                </Col>
                <Col xs={12} md={3}>
                    <CompactNumberInput label={t("MateEditor.offsetX")} value={override.OffsetX}
                                        onChange={value => onChange({OffsetX: value})}/>
                </Col>
                <Col xs={12} md={3}>
                    <CompactNumberInput label={t("MateEditor.offsetY")} value={override.OffsetY}
                                        onChange={value => onChange({OffsetY: value})}/>
                </Col>
                <Col xs={12} md={3}>
                    <CompactNumberInput label={t("MateEditor.scaleX")} value={override.ScaleX}
                                        onChange={value => onChange({ScaleX: value})}/>
                </Col>
                <Col xs={12} md={3}>
                    <CompactNumberInput label={t("MateEditor.scaleY")} value={override.ScaleY}
                                        onChange={value => onChange({ScaleY: value})}/>
                </Col>
            </Row>
        );
    }

    if (override.Type === "col") {
        return (
            <Row gutter={[8, 8]}>
                <Col xs={12} md={4}>
                    <CompactNumberInput label={t("MateEditor.R")} value={override.R} min={0}
                                        onChange={value => onChange({R: value})}/>
                </Col>
                <Col xs={12} md={4}>
                    <CompactNumberInput label={t("MateEditor.G")} value={override.G} min={0}
                                        onChange={value => onChange({G: value})}/>
                </Col>
                <Col xs={12} md={4}>
                    <CompactNumberInput label={t("MateEditor.B")} value={override.B} min={0}
                                        onChange={value => onChange({B: value})}/>
                </Col>
                <Col xs={12} md={4}>
                    <CompactNumberInput label={t("MateEditor.A")} value={override.A} min={0}
                                        onChange={value => onChange({A: value})}/>
                </Col>
            </Row>
        );
    }

    if (override.Type === "vec") {
        return (
            <Row gutter={[8, 8]}>
                <Col xs={12} md={4}>
                    <CompactNumberInput label={t("MateEditor.vec_x")} value={override.X}
                                        onChange={value => onChange({X: value})}/>
                </Col>
                <Col xs={12} md={4}>
                    <CompactNumberInput label={t("MateEditor.vec_y")} value={override.Y}
                                        onChange={value => onChange({Y: value})}/>
                </Col>
                <Col xs={12} md={4}>
                    <CompactNumberInput label={t("MateEditor.vec_z")} value={override.Z}
                                        onChange={value => onChange({Z: value})}/>
                </Col>
                <Col xs={12} md={4}>
                    <CompactNumberInput label={t("MateEditor.vec_w")} value={override.W}
                                        onChange={value => onChange({W: value})}/>
                </Col>
            </Row>
        );
    }

    if (override.Type === "f" || override.Type === "range") {
        return (
            <Row gutter={[8, 8]}>
                <Col xs={24} md={8}>
                    <CompactNumberInput label={t("MateEditor.number")} value={override.Number}
                                        onChange={value => onChange({Number: value})}/>
                </Col>
            </Row>
        );
    }

    if (override.Type === "tex_offset") {
        return (
            <Row gutter={[8, 8]}>
                <Col xs={12} md={5}>
                    <CompactNumberInput label={t("MateEditor.offsetX")} value={override.OffsetX}
                                        onChange={value => onChange({OffsetX: value})}/>
                </Col>
                <Col xs={12} md={5}>
                    <CompactNumberInput label={t("MateEditor.offsetY")} value={override.OffsetY}
                                        onChange={value => onChange({OffsetY: value})}/>
                </Col>
            </Row>
        );
    }

    if (override.Type === "tex_scale") {
        return (
            <Row gutter={[8, 8]}>
                <Col xs={12} md={5}>
                    <CompactNumberInput label={t("MateEditor.scaleX")} value={override.ScaleX}
                                        onChange={value => onChange({ScaleX: value})}/>
                </Col>
                <Col xs={12} md={5}>
                    <CompactNumberInput label={t("MateEditor.scaleY")} value={override.ScaleY}
                                        onChange={value => onChange({ScaleY: value})}/>
                </Col>
            </Row>
        );
    }

    if (override.Type === "keyword") {
        return (
            <Space direction="vertical" size={8} style={{width: "100%"}}>
                {keywords.map(keyword => (
                    <Row gutter={[8, 8]} key={keyword.id} align="middle">
                        <Col xs={24} md={10}>
                            <CompactTextInput
                                label={t("MateEditor.keyword_no_brackets")}
                                value={keyword.Key}
                                onChange={value => updateKeyword(keyword.id, {Key: value})}
                            />
                        </Col>
                        <Col xs={18} md={6}>
                            <CompactSwitchInput
                                label={t("MateEditor.keyword_valve")}
                                checked={keyword.Value}
                                onChange={checked => updateKeyword(keyword.id, {Value: checked})}
                            />
                        </Col>
                        <Col xs={6} md={2}>
                            <Button danger type="text" icon={<DeleteOutlined/>}
                                    onClick={() => removeKeyword(keyword.id)}/>
                        </Col>
                    </Row>
                ))}
                <Button type="dashed" size="small" icon={<PlusOutlined/>} onClick={addKeyword}>
                    {t("MateEditor.add_key_value")}
                </Button>
            </Space>
        );
    }

    return <Text type="secondary">-</Text>;
};

const logicalNameFromPath = (value?: string) => {
    if (!value) {
        return "";
    }
    const normalized = value.replace(/\\/g, "/");
    const baseName = normalized.slice(normalized.lastIndexOf("/") + 1);
    return baseName.toLowerCase().endsWith(".json") ? baseName.slice(0, -".json".length) : baseName;
};

const splitDiffStemClient = (stem: string): [string, number] => {
    const match = stem.match(/_z(\d+)(.*)$/i);
    if (!match || match.index === undefined) {
        return [stem, 0];
    }
    return [stem.slice(0, match.index) + (match[2] ?? ""), Number(match[1] ?? 0)];
};

const variantLogicalNameCandidatesClient = (baseStem: string, fileType: string, targetIndex: number) => {
    if (!baseStem || !fileType || targetIndex <= 0) {
        return [];
    }
    const candidates: string[] = [];
    const seen = new Set<string>();
    const add = (stem: string) => {
        const name = `${stem}_z${targetIndex}${fileType}`;
        const lower = name.toLowerCase();
        if (seen.has(lower)) {
            return;
        }
        seen.add(lower);
        candidates.push(name);
    };

    add(baseStem);
    const separatorIndex = baseStem.lastIndexOf("_");
    if (separatorIndex > 0 && separatorIndex < baseStem.length - 1) {
        add(`${baseStem.slice(0, separatorIndex)}_z${targetIndex}${baseStem.slice(separatorIndex)}`);
    }
    return candidates;
};

const replacementKey = (replacement: {
    Command?: string;
    ArgIndex?: number;
    FileType?: string;
    From?: string;
}) => [
    (replacement.Command || "").toLowerCase(),
    replacement.ArgIndex || 0,
    (replacement.FileType || "").toLowerCase(),
    (replacement.From || "").toLowerCase(),
].join("|");

const pathText = (value?: string) => (
    <Text copyable={!!value} ellipsis style={{maxWidth: 520}}>
        {value || "-"}
    </Text>
);

const resultColumns = (t: (key: string) => string): ColumnsType<COM3D2.DiffGeneratedFile> => [
    {
        title: t("DiffGenerator.kind"),
        dataIndex: "Kind",
        width: 90,
        render: (value) => <Tag>{value}</Tag>,
    },
    {
        title: t("DiffGenerator.status"),
        dataIndex: "Status",
        width: 120,
        render: (value: string) => {
            const color = value === "generated" || value === "overwritten" ? "green" : value === "skipped" ? "orange" : "red";
            return <Tag color={color}>{value}</Tag>;
        },
    },
    {
        title: t("DiffGenerator.path"),
        dataIndex: "Path",
        render: pathText,
    },
    {
        title: t("DiffGenerator.source_path"),
        dataIndex: "SourcePath",
        render: pathText,
    },
];

const DiffGeneratorPage: React.FC = () => {
    const {t} = useTranslation();
    const {handleSelectFile, handleSaveFile} = useFileHandlers();
    const [helpOpen, setHelpOpen] = useState(false);

    return (
        <Layout style={{height: "100vh"}}>
            <NavBar
                onSelectFile={() => handleSelectFile(AllSupportedFileTypes, t("Infos.com3d2_mod_files"))}
                onSaveFile={() => handleSaveFile(undefined)}
                onSaveAsFile={() => handleSaveFile(undefined)}
            />
            <Content style={{padding: 20, overflow: "auto"}}>
                <FloatButton
                    onClick={() => setHelpOpen(true)}
                    icon={<QuestionCircleOutlined/>}
                    style={{zoom: 0.8}}
                />
                <Modal
                    title={t("DiffGenerator.help_title")}
                    open={helpOpen}
                    onOk={() => setHelpOpen(false)}
                    onCancel={() => setHelpOpen(false)}
                    width={760}
                >
                    <Title level={5}>{t("DiffGenerator.help_mate_title")}</Title>
                    <p>{t("DiffGenerator.help_mate_step_1")}</p>
                    <p>{t("DiffGenerator.help_mate_step_2")}</p>
                    <p>{t("DiffGenerator.help_mate_step_3")}</p>
                    <Title level={5}>{t("DiffGenerator.help_menu_title")}</Title>
                    <p>{t("DiffGenerator.help_menu_step_1")}</p>
                    <p>{t("DiffGenerator.help_menu_step_2")}</p>
                    <p>{t("DiffGenerator.help_menu_step_3")}</p>
                    <Title level={5}>{t("DiffGenerator.help_note_title")}</Title>
                    <p>{t("DiffGenerator.help_note_1")}</p>
                    <p>{t("DiffGenerator.help_note_2")}</p>
                </Modal>
                <Space direction="vertical" size={16} style={{width: "100%"}}>
                    <Title level={4} style={{margin: 0}}>{t("DiffGenerator.title")}</Title>
                    <Tabs
                        items={[
                            {
                                key: "mate",
                                label: (
                                    <Space>
                                        <ExperimentOutlined/>
                                        {t("DiffGenerator.mate_tab")}
                                    </Space>
                                ),
                                children: <MateVariantPanel/>,
                            },
                            {
                                key: "menu",
                                label: (
                                    <Space>
                                        <BranchesOutlined/>
                                        {t("DiffGenerator.menu_tab")}
                                    </Space>
                                ),
                                children: <MenuVariantPanel/>,
                            },
                        ]}
                    />
                </Space>
            </Content>
        </Layout>
    );
};

const MateVariantPanel: React.FC = () => {
    const {t} = useTranslation();
    const [baseMatePath, setBaseMatePath] = useState("");
    const [outputDir, setOutputDir] = useState("");
    const [outputNamePattern, setOutputNamePattern] = useState("{base}_z{index}.mate");
    const [overwrite, setOverwrite] = useState(false);
    const [analysis, setAnalysis] = useState<COM3D2.MateVariantAnalysis | undefined>();
    const [variants, setVariants] = useState<MateVariantDraft[]>([blankMateVariant(1)]);
    const [result, setResult] = useState<COM3D2.DiffGenerationResult | undefined>();
    const [loading, setLoading] = useState(false);

    const propertiesByType = useMemo(() => {
        const grouped = new Map<string, COM3D2.MateVariantPropertyInfo[]>();
        for (const prop of analysis?.Properties ?? []) {
            const current = grouped.get(prop.Type) ?? [];
            current.push(prop);
            grouped.set(prop.Type, current);
        }
        return grouped;
    }, [analysis]);

    const propertyOptionsForType = (type: string) => {
        return (propertiesByType.get(type) ?? []).map(prop => ({
            value: prop.PropName,
            label: prop.PropName,
        }));
    };

    const findPropertyInfo = (type: string, propName?: string) => {
        if (!propName) {
            return undefined;
        }
        return (propertiesByType.get(type) ?? []).find(prop => prop.PropName === propName);
    };

    const chooseBaseMate = async () => {
        const path = await SelectFile("*.mate;*.mate.json", t("Infos.com3d2_mate_file"));
        if (path) {
            setBaseMatePath(path);
        }
    };

    const chooseOutputDir = async () => {
        const path = await SelectDirectory(t("DiffGenerator.choose_output_dir"));
        if (path) {
            setOutputDir(path);
        }
    };

    const analyze = async () => {
        if (!baseMatePath) {
            message.warning(t("DiffGenerator.select_base_mate_first"));
            return;
        }
        setLoading(true);
        try {
            const data = await AnalyzeMateVariantBase(baseMatePath);
            setAnalysis(data);
            setVariants(current => current.map((variant, index) => ({
                ...variant,
                Index: variant.Index || index + 1,
                ShaderName: variant.ShaderName || data.Shader?.ShaderName || "",
                ShaderFilename: variant.ShaderFilename || data.Shader?.ShaderFilename || "",
            })));
        } catch (err) {
            message.error(t("DiffGenerator.analysis_failed_colon") + err);
        } finally {
            setLoading(false);
        }
    };

    const addVariant = () => {
        const nextIndex = variants.reduce((max, item) => Math.max(max, item.Index || 0), 0) + 1;
        setVariants([...variants, blankMateVariant(nextIndex, analysis)]);
    };

    const updateVariant = (id: string, patch: Partial<MateVariantDraft>) => {
        setVariants(variants.map(item => item.id === id ? {...item, ...patch} : item));
    };

    const addOverride = (variantId: string) => {
        const firstProperty = analysis?.Properties?.find(prop => propertyTypeOptions.some(option => option.value === prop.Type));
        const nextOverride: MateOverrideDraft = firstProperty
            ? {id: createId(), ...mateOverrideFromProperty(firstProperty)} as MateOverrideDraft
            : {id: createId(), Type: "col", PropName: "", ...mateOverrideDefaults("col")};

        setVariants(variants.map(item => item.id === variantId ? {
            ...item,
            Overrides: [...item.Overrides, nextOverride],
        } : item));
    };

    const updateOverride = (variantId: string, overrideId: string, patch: Partial<MateOverrideDraft>) => {
        setVariants(variants.map(item => item.id === variantId ? {
            ...item,
            Overrides: item.Overrides.map(override => override.id === overrideId ? {...override, ...patch} : override),
        } : item));
    };

    const removeOverride = (variantId: string, overrideId: string) => {
        setVariants(variants.map(item => item.id === variantId ? {
            ...item,
            Overrides: item.Overrides.filter(override => override.id !== overrideId),
        } : item));
    };

    const changeOverrideType = (variantId: string, overrideId: string, type: string) => {
        updateOverride(variantId, overrideId, {
            Type: type,
            PropName: "",
            ...mateOverrideDefaults(type),
        });
    };

    const changeOverrideProperty = (variantId: string, overrideId: string, override: MateOverrideDraft, propName?: string) => {
        const prop = findPropertyInfo(override.Type, propName);
        updateOverride(
            variantId,
            overrideId,
            prop ? mateOverrideFromProperty(prop) : {PropName: propName ?? ""},
        );
    };

    const generate = async () => {
        if (!baseMatePath) {
            message.warning(t("DiffGenerator.select_base_mate_first"));
            return;
        }
        setLoading(true);
        try {
            const payload: COM3D2.MateVariantGenerationRequest = {
                BaseMatePath: baseMatePath,
                OutputDir: outputDir,
                OutputNamePattern: outputNamePattern,
                Overwrite: overwrite,
                Variants: variants.map(variant => ({
                    Index: variant.Index,
                    Name: variant.Name,
                    OutputName: variant.OutputName || "",
                    MateName: variant.MateName || "",
                    MaterialName: variant.MaterialName || "",
                    Shader: {
                        ShaderName: variant.ShaderName || "",
                        ShaderFilename: variant.ShaderFilename || "",
                    } as COM3D2.MateShaderValue,
                    Overrides: variant.Overrides.map(mateOverrideToPayload),
                } as COM3D2.MateVariantDefinition)),
            } as COM3D2.MateVariantGenerationRequest;
            const data = await GenerateMateVariants(payload);
            setResult(data);
            message.success(t("DiffGenerator.generate_success"));
        } catch (err) {
            message.error(t("DiffGenerator.generate_failed_colon") + err);
        } finally {
            setLoading(false);
        }
    };

    const propertyColumns: ColumnsType<COM3D2.MateVariantPropertyInfo> = [
        {title: t("DiffGenerator.type"), dataIndex: "Type", width: 110, render: value => <Tag>{value}</Tag>},
        {title: t("DiffGenerator.property"), dataIndex: "PropName", width: 180},
        {
            title: t("DiffGenerator.value"),
            render: (_, record) => {
                if (record.Type === "tex") {
                    return (
                        <Space direction="vertical" size={0}>
                            <Text>{record.TexName || "-"}</Text>
                            <Text type="secondary" ellipsis style={{maxWidth: 520}}>{record.TexPath || "-"}</Text>
                        </Space>
                    );
                }
                if (record.Type === "f" || record.Type === "range") {
                    return record.Number;
                }
                if (record.Type === "keyword") {
                    return record.Keywords?.map(item => `${item.Key}=${item.Value}`).join(", ") || "-";
                }
                return record.Values?.join(", ") || record.Offset?.concat(record.Scale ?? []).join(", ") || "-";
            },
        },
    ];

    return (
        <Space direction="vertical" size={16} style={{width: "100%"}}>
            <Card size="small">
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} lg={12}>
                        <Input
                            value={baseMatePath}
                            onChange={e => setBaseMatePath(e.target.value)}
                            placeholder={t("DiffGenerator.base_mate")}
                            addonBefore={t("DiffGenerator.base_mate")}
                        />
                    </Col>
                    <Col>
                        <Button icon={<FileAddOutlined/>}
                                onClick={chooseBaseMate}>{t("DiffGenerator.choose_file")}</Button>
                    </Col>
                    <Col>
                        <Button icon={<ReloadOutlined/>} loading={loading}
                                onClick={analyze}>{t("DiffGenerator.analyze")}</Button>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Input
                            value={outputDir}
                            onChange={e => setOutputDir(e.target.value)}
                            placeholder={t("DiffGenerator.output_dir")}
                            addonBefore={t("DiffGenerator.output_dir")}
                        />
                    </Col>
                    <Col>
                        <Button icon={<FolderOpenOutlined/>}
                                onClick={chooseOutputDir}>{t("DiffGenerator.choose_output_dir")}</Button>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Input
                            value={outputNamePattern}
                            onChange={e => setOutputNamePattern(e.target.value)}
                            addonBefore={t("DiffGenerator.output_pattern")}
                        />
                    </Col>
                    <Col>
                        <Checkbox checked={overwrite} onChange={e => setOverwrite(e.target.checked)}>
                            {t("DiffGenerator.overwrite")}
                        </Checkbox>
                    </Col>
                </Row>
            </Card>

            {analysis && (
                <Card size="small" title={t("DiffGenerator.mate_analysis")}>
                    <Space direction="vertical" style={{width: "100%"}}>
                        <Space wrap>
                            <Tag>{analysis.MateName}</Tag>
                            <Tag>{analysis.MaterialName}</Tag>
                            <Tag>{analysis.Shader?.ShaderName}</Tag>
                            <Tag>{analysis.Shader?.ShaderFilename}</Tag>
                        </Space>
                        <Table
                            size="small"
                            rowKey={(record) => `${record.Type}:${record.PropName}`}
                            columns={propertyColumns}
                            dataSource={analysis.Properties ?? []}
                            pagination={{pageSize: 8}}
                        />
                        <Warnings warnings={analysis.Warnings}/>
                    </Space>
                </Card>
            )}

            <Space direction="vertical" size={12} style={{width: "100%"}}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={5} style={{margin: 0}}>{t("DiffGenerator.mate_variants")}</Title>
                    </Col>
                    <Col>
                        <Button icon={<PlusOutlined/>} onClick={addVariant}>{t("DiffGenerator.add_variant")}</Button>
                    </Col>
                </Row>
                {variants.map((variant) => (
                    <Card
                        key={variant.id}
                        size="small"
                        title={`${variant.Index}. ${variant.Name || "variant"}`}
                        extra={
                            variants.length > 1 && (
                                <Button
                                    danger
                                    type="text"
                                    icon={<DeleteOutlined/>}
                                    onClick={() => setVariants(variants.filter(item => item.id !== variant.id))}
                                />
                            )
                        }
                    >
                        <Space direction="vertical" size={12} style={{width: "100%"}}>
                            <Row gutter={[8, 8]}>
                                <Col xs={12} md={4}>
                                    <InputNumber
                                        min={1}
                                        value={variant.Index}
                                        onChange={value => updateVariant(variant.id, {Index: value ?? 1})}
                                        addonBefore="z"
                                        style={{width: "100%"}}
                                    />
                                </Col>
                                <Col xs={12} md={5}>
                                    <Input value={variant.Name}
                                           onChange={e => updateVariant(variant.id, {Name: e.target.value})}
                                           placeholder={t("DiffGenerator.variant_name")}/>
                                </Col>
                                <Col xs={24} md={7}>
                                    <Input value={variant.OutputName}
                                           onChange={e => updateVariant(variant.id, {OutputName: e.target.value})}
                                           placeholder={t("DiffGenerator.output_name_optional")}/>
                                </Col>
                                <Col xs={24} md={4}>
                                    <Input value={variant.MateName}
                                           onChange={e => updateVariant(variant.id, {MateName: e.target.value})}
                                           placeholder="MateName"/>
                                </Col>
                                <Col xs={24} md={4}>
                                    <Input value={variant.MaterialName}
                                           onChange={e => updateVariant(variant.id, {MaterialName: e.target.value})}
                                           placeholder="MaterialName"/>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Input value={variant.ShaderName}
                                           onChange={e => updateVariant(variant.id, {ShaderName: e.target.value})}
                                           placeholder="ShaderName"/>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Input value={variant.ShaderFilename}
                                           onChange={e => updateVariant(variant.id, {ShaderFilename: e.target.value})}
                                           placeholder="ShaderFilename"/>
                                </Col>
                            </Row>
                            <Divider style={{margin: "4px 0"}}/>
                            <Space direction="vertical" size={8} style={{width: "100%"}}>
                                {variant.Overrides.map(override => (
                                    <div
                                        key={override.id}
                                        style={{
                                            border: "1px solid #f0f0f0",
                                            borderRadius: 4,
                                            padding: 8,
                                        }}
                                    >
                                        <Space direction="vertical" size={8} style={{width: "100%"}}>
                                            <Row gutter={[8, 8]} align="middle">
                                                <Col xs={24} md={6}>
                                                    <CompactSelectInput
                                                        label={t("MateEditor.property_type")}
                                                        value={override.Type}
                                                        options={propertyTypeOptions}
                                                        onChange={value => changeOverrideType(variant.id, override.id, value || "col")}
                                                    />
                                                </Col>
                                                <Col xs={24} md={10}>
                                                    <CompactSelectInput
                                                        label={t("MateEditor.property_name")}
                                                        showSearch
                                                        allowClear
                                                        value={override.PropName}
                                                        options={propertyOptionsForType(override.Type)}
                                                        onChange={value => changeOverrideProperty(variant.id, override.id, override, value)}
                                                        onSearch={value => updateOverride(variant.id, override.id, {PropName: value})}
                                                        placeholder={t("DiffGenerator.property")}
                                                    />
                                                </Col>
                                                <Col xs={24} md={2}>
                                                    <Button danger type="text" icon={<DeleteOutlined/>}
                                                            onClick={() => removeOverride(variant.id, override.id)}/>
                                                </Col>
                                            </Row>
                                            <MateOverrideValueFields
                                                override={override}
                                                onChange={patch => updateOverride(variant.id, override.id, patch)}
                                            />
                                        </Space>
                                    </div>
                                ))}
                                <Button type="dashed" icon={<PlusOutlined/>} onClick={() => addOverride(variant.id)}>
                                    {t("DiffGenerator.add_override")}
                                </Button>
                            </Space>
                        </Space>
                    </Card>
                ))}
                <Button type="primary" loading={loading} onClick={generate}>
                    {t("DiffGenerator.generate_mates")}
                </Button>
            </Space>

            <GenerationResult result={result}/>
        </Space>
    );
};

const MenuVariantPanel: React.FC = () => {
    const {t} = useTranslation();
    const [baseMenuPaths, setBaseMenuPaths] = useState<string[]>([]);
    const [outputDir, setOutputDir] = useState("");
    const [scanDir, setScanDir] = useState("");
    const [outputNamePattern, setOutputNamePattern] = useState("{base}_z{index}.menu");
    const [overwrite, setOverwrite] = useState(false);
    const [analysis, setAnalysis] = useState<COM3D2.MenuVariantAnalysis | undefined>();
    const [scanAnalysis, setScanAnalysis] = useState<DiffGenerationAnalysisWithMenuFiles | undefined>();
    const [variants, setVariants] = useState<MenuVariantDraft[]>([blankMenuVariant(1)]);
    const [result, setResult] = useState<COM3D2.DiffGenerationResult | undefined>();
    const [loading, setLoading] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);

    const references = useMemo(() => {
        return analysis?.MenuGroups?.flatMap(group => group.References?.map(ref => ({
            ...ref,
            key: `${group.BasePath}:${ref.Command}:${ref.ArgIndex}:${ref.Value}`,
            BaseName: group.BaseName,
        })) ?? []) ?? [];
    }, [analysis]);

    const scanFileNameMap = useMemo(() => {
        const resultMap = new Map<string, string>();
        const addPath = (path?: string) => {
            const logicalName = logicalNameFromPath(path);
            if (!logicalName) {
                return;
            }
            const lower = logicalName.toLowerCase();
            if (!resultMap.has(lower)) {
                resultMap.set(lower, logicalName);
            }
        };

        for (const group of scanAnalysis?.MenuGroups ?? []) {
            const files = (group as DiffMenuGroupWithFiles).Files;
            if (files && files.length > 0) {
                files.forEach(addPath);
            } else {
                addPath(group.BasePath);
                for (const existingIndex of group.ExistingIndexes ?? []) {
                    variantLogicalNameCandidatesClient(group.BaseName, ".menu", existingIndex).forEach(candidate => addPath(candidate));
                }
            }
        }
        for (const group of scanAnalysis?.ResourceGroups ?? []) {
            group.Files?.forEach(addPath);
        }
        return resultMap;
    }, [scanAnalysis]);

    const addBaseMenu = async () => {
        const path = await SelectFile("*.menu;*.menu.json", t("Infos.com3d2_menu_file"));
        if (path && !baseMenuPaths.includes(path)) {
            setBaseMenuPaths([...baseMenuPaths, path]);
        }
    };

    const chooseOutputDir = async () => {
        const path = await SelectDirectory(t("DiffGenerator.choose_output_dir"));
        if (path) {
            setOutputDir(path);
        }
    };

    const chooseScanDir = async () => {
        const path = await SelectDirectory(t("DiffGenerator.choose_scan_dir"));
        if (path) {
            setScanDir(path);
        }
    };

    const analyze = async () => {
        if (baseMenuPaths.length === 0) {
            message.warning(t("DiffGenerator.select_base_menu_first"));
            return;
        }
        setLoading(true);
        try {
            const data = await AnalyzeMenuVariantBases(baseMenuPaths);
            setAnalysis(data);
        } catch (err) {
            message.error(t("DiffGenerator.analysis_failed_colon") + err);
        } finally {
            setLoading(false);
        }
    };

    const scanReplacementDir = async () => {
        if (!scanDir) {
            message.warning(t("DiffGenerator.select_scan_dir_first"));
            return;
        }
        setScanLoading(true);
        try {
            const data = await AnalyzeDiffGeneration(scanDir);
            setScanAnalysis(data as DiffGenerationAnalysisWithMenuFiles);
            message.success(t("DiffGenerator.scan_success"));
        } catch (err) {
            message.error(t("DiffGenerator.analysis_failed_colon") + err);
        } finally {
            setScanLoading(false);
        }
    };

    const addVariant = () => {
        const nextIndex = variants.reduce((max, item) => Math.max(max, item.Index || 0), 0) + 1;
        setVariants([...variants, blankMenuVariant(nextIndex)]);
    };

    const updateVariant = (id: string, patch: Partial<MenuVariantDraft>) => {
        setVariants(variants.map(item => item.id === id ? {...item, ...patch} : item));
    };

    const addReplacement = (variantId: string, ref?: COM3D2.DiffFileReference) => {
        setVariants(variants.map(item => item.id === variantId ? {
            ...item,
            Replacements: [...item.Replacements, {
                id: createId(),
                Command: ref?.Command ?? "",
                ArgIndex: ref?.ArgIndex ?? 0,
                From: ref?.Value ?? "",
                To: ref?.VariantCandidate ?? "",
                FileType: ref?.FileType ?? "",
            }],
        } : item));
    };

    const updateReplacement = (variantId: string, replacementId: string, patch: Partial<MenuReplacementDraft>) => {
        setVariants(variants.map(item => item.id === variantId ? {
            ...item,
            Replacements: item.Replacements.map(replacement => replacement.id === replacementId ? {...replacement, ...patch} : replacement),
        } : item));
    };

    const removeReplacement = (variantId: string, replacementId: string) => {
        setVariants(variants.map(item => item.id === variantId ? {
            ...item,
            Replacements: item.Replacements.filter(replacement => replacement.id !== replacementId),
        } : item));
    };

    const guessReferenceReplacement = (reference: COM3D2.DiffFileReference, targetIndex: number) => {
        if (!reference.Value || reference.HasWildcard || targetIndex <= 0) {
            return "";
        }
        const logicalName = logicalNameFromPath(reference.Value);
        const dotIndex = logicalName.lastIndexOf(".");
        if (dotIndex <= 0) {
            return "";
        }
        const stem = logicalName.slice(0, dotIndex);
        const fileType = logicalName.slice(dotIndex);
        const [baseStem] = splitDiffStemClient(stem);

        for (const candidate of variantLogicalNameCandidatesClient(baseStem, fileType, targetIndex)) {
            const matched = scanFileNameMap.get(candidate.toLowerCase());
            if (matched) {
                return matched;
            }
        }
        return "";
    };

    const applyGuessesToVariant = (variant: MenuVariantDraft) => {
        if (references.length === 0) {
            message.warning(t("DiffGenerator.analyze_menu_before_guess"));
            return;
        }
        if (scanFileNameMap.size === 0) {
            message.warning(t("DiffGenerator.scan_before_guess"));
            return;
        }

        const nextReplacements = variant.Replacements.map(replacement => ({...replacement}));
        const replacementMap = new Map<string, MenuReplacementDraft>();
        nextReplacements.forEach(replacement => replacementMap.set(replacementKey(replacement), replacement));

        let added = 0;
        let filled = 0;
        for (const reference of references) {
            const candidate = guessReferenceReplacement(reference, variant.Index);
            if (!candidate) {
                continue;
            }

            const key = replacementKey({
                Command: reference.Command,
                ArgIndex: reference.ArgIndex,
                FileType: reference.FileType,
                From: reference.Value,
            });
            const existing = replacementMap.get(key);
            if (existing) {
                if (!existing.To) {
                    existing.To = candidate;
                    if (!existing.Command) {
                        existing.Command = reference.Command;
                    }
                    if (!existing.ArgIndex) {
                        existing.ArgIndex = reference.ArgIndex;
                    }
                    if (!existing.From) {
                        existing.From = reference.Value;
                    }
                    if (!existing.FileType) {
                        existing.FileType = reference.FileType;
                    }
                    filled++;
                }
                continue;
            }

            const replacement: MenuReplacementDraft = {
                id: createId(),
                Command: reference.Command,
                ArgIndex: reference.ArgIndex,
                From: reference.Value,
                To: candidate,
                FileType: reference.FileType,
            };
            nextReplacements.push(replacement);
            replacementMap.set(key, replacement);
            added++;
        }

        if (added === 0 && filled === 0) {
            message.warning(t("DiffGenerator.guess_none"));
            return;
        }

        updateVariant(variant.id, {Replacements: nextReplacements});
        message.success(t("DiffGenerator.guess_applied", {count: added + filled}));
    };

    const generate = async () => {
        if (baseMenuPaths.length === 0) {
            message.warning(t("DiffGenerator.select_base_menu_first"));
            return;
        }
        setLoading(true);
        try {
            const payload: COM3D2.MenuVariantGenerationRequest = {
                BaseMenuPaths: baseMenuPaths,
                OutputDir: outputDir,
                OutputNamePattern: outputNamePattern,
                Overwrite: overwrite,
                Variants: variants.map(variant => ({
                    Index: variant.Index,
                    Name: variant.Name,
                    OutputName: variant.OutputName || "",
                    ItemName: variant.ItemName || "",
                    InfoText: variant.InfoText || "",
                    Replacements: variant.Replacements.map(replacement => ({
                        Command: replacement.Command || "",
                        ArgIndex: replacement.ArgIndex || 0,
                        From: replacement.From || "",
                        To: replacement.To || "",
                        FileType: replacement.FileType || "",
                    } as COM3D2.MenuReferenceReplacement)),
                } as COM3D2.MenuVariantDefinition)),
            } as COM3D2.MenuVariantGenerationRequest;
            const data = await GenerateMenuVariants(payload);
            setResult(data);
            message.success(t("DiffGenerator.generate_success"));
        } catch (err) {
            message.error(t("DiffGenerator.generate_failed_colon") + err);
        } finally {
            setLoading(false);
        }
    };

    const referenceColumns: ColumnsType<COM3D2.DiffFileReference & { BaseName: string; key: string }> = [
        {title: t("DiffGenerator.menu"), dataIndex: "BaseName", width: 160},
        {title: t("DiffGenerator.command"), dataIndex: "Command", width: 150},
        {title: t("DiffGenerator.arg_index"), dataIndex: "ArgIndex", width: 90},
        {title: t("DiffGenerator.type"), dataIndex: "FileType", width: 90, render: value => <Tag>{value}</Tag>},
        {title: t("DiffGenerator.value"), dataIndex: "Value", render: pathText},
        {title: t("DiffGenerator.candidate"), dataIndex: "VariantCandidate", render: pathText},
    ];

    return (
        <Space direction="vertical" size={16} style={{width: "100%"}}>
            <Card size="small">
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    <Row gutter={[12, 12]} align="middle">
                        <Col>
                            <Button icon={<FileAddOutlined/>}
                                    onClick={addBaseMenu}>{t("DiffGenerator.add_base_menu")}</Button>
                        </Col>
                        <Col>
                            <Button icon={<ReloadOutlined/>} loading={loading}
                                    onClick={analyze}>{t("DiffGenerator.analyze")}</Button>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Input
                                value={outputDir}
                                onChange={e => setOutputDir(e.target.value)}
                                placeholder={t("DiffGenerator.output_dir")}
                                addonBefore={t("DiffGenerator.output_dir")}
                            />
                        </Col>
                        <Col>
                            <Button icon={<FolderOpenOutlined/>}
                                    onClick={chooseOutputDir}>{t("DiffGenerator.choose_output_dir")}</Button>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Input
                                value={outputNamePattern}
                                onChange={e => setOutputNamePattern(e.target.value)}
                                addonBefore={t("DiffGenerator.output_pattern")}
                            />
                        </Col>
                        <Col>
                            <Checkbox checked={overwrite} onChange={e => setOverwrite(e.target.checked)}>
                                {t("DiffGenerator.overwrite")}
                            </Checkbox>
                        </Col>
                    </Row>
                    <Row gutter={[12, 12]} align="middle">
                        <Col xs={24} lg={12}>
                            <Input
                                value={scanDir}
                                onChange={e => setScanDir(e.target.value)}
                                placeholder={t("DiffGenerator.scan_dir")}
                                addonBefore={t("DiffGenerator.scan_dir")}
                            />
                        </Col>
                        <Col>
                            <Button icon={<FolderOpenOutlined/>}
                                    onClick={chooseScanDir}>{t("DiffGenerator.choose_scan_dir")}</Button>
                        </Col>
                        <Col>
                            <Button icon={<ReloadOutlined/>} loading={scanLoading}
                                    onClick={scanReplacementDir}>{t("DiffGenerator.scan_replacement_dir")}</Button>
                        </Col>
                    </Row>

                    {baseMenuPaths.length > 0 ? (
                        <List
                            size="small"
                            bordered
                            dataSource={baseMenuPaths}
                            renderItem={(path) => (
                                <List.Item
                                    actions={[
                                        <Button key="delete" danger type="text" icon={<DeleteOutlined/>}
                                                onClick={() => setBaseMenuPaths(baseMenuPaths.filter(item => item !== path))}/>,
                                    ]}
                                >
                                    {pathText(path)}
                                </List.Item>
                            )}
                        />
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("DiffGenerator.no_base_menus")}/>
                    )}
                </Space>
            </Card>

            {analysis && (
                <Card size="small" title={t("DiffGenerator.menu_analysis")}>
                    <Space direction="vertical" style={{width: "100%"}}>
                        <Table
                            size="small"
                            rowKey="key"
                            columns={referenceColumns}
                            dataSource={references}
                            pagination={{pageSize: 8}}
                        />
                        <Warnings warnings={analysis.Warnings}/>
                    </Space>
                </Card>
            )}

            {scanAnalysis && (
                <Card size="small" title={t("DiffGenerator.scan_result")}>
                    <Space direction="vertical" style={{width: "100%"}}>
                        <Space wrap>
                            <Tag color="blue">{t("DiffGenerator.scan_dir")}: {scanAnalysis.InputDir}</Tag>
                            <Tag color="green">{t("DiffGenerator.scan_files")}: {scanFileNameMap.size}</Tag>
                            <Tag>{t("DiffGenerator.menus_processed")}: {scanAnalysis.MenuGroups?.length ?? 0}</Tag>
                        </Space>
                        <Warnings warnings={scanAnalysis.Warnings}/>
                    </Space>
                </Card>
            )}

            <Space direction="vertical" size={12} style={{width: "100%"}}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={5} style={{margin: 0}}>{t("DiffGenerator.menu_variants")}</Title>
                    </Col>
                    <Col>
                        <Button icon={<PlusOutlined/>} onClick={addVariant}>{t("DiffGenerator.add_variant")}</Button>
                    </Col>
                </Row>
                {variants.map(variant => (
                    <Card
                        key={variant.id}
                        size="small"
                        title={`${variant.Index}. ${variant.Name || "variant"}`}
                        extra={
                            <Space size={0}>
                                <Button type="text" onClick={() => applyGuessesToVariant(variant)}>
                                    {t("DiffGenerator.guess_replacements")}
                                </Button>
                                {variants.length > 1 && (
                                    <Button
                                        danger
                                        type="text"
                                        icon={<DeleteOutlined/>}
                                        onClick={() => setVariants(variants.filter(item => item.id !== variant.id))}
                                    />
                                )}
                            </Space>
                        }
                    >
                        <Space direction="vertical" size={12} style={{width: "100%"}}>
                            <Row gutter={[8, 8]}>
                                <Col xs={12} md={4}>
                                    <InputNumber
                                        min={1}
                                        value={variant.Index}
                                        onChange={value => updateVariant(variant.id, {Index: value ?? 1})}
                                        addonBefore="z"
                                        style={{width: "100%"}}
                                    />
                                </Col>
                                <Col xs={12} md={5}>
                                    <Input value={variant.Name}
                                           onChange={e => updateVariant(variant.id, {Name: e.target.value})}
                                           placeholder={t("DiffGenerator.variant_name")}/>
                                </Col>
                                <Col xs={24} md={6}>
                                    <Input value={variant.OutputName}
                                           onChange={e => updateVariant(variant.id, {OutputName: e.target.value})}
                                           placeholder={t("DiffGenerator.output_name_optional")}/>
                                </Col>
                                <Col xs={24} md={4}>
                                    <Input value={variant.ItemName}
                                           onChange={e => updateVariant(variant.id, {ItemName: e.target.value})}
                                           placeholder="ItemName"/>
                                </Col>
                                <Col xs={24} md={5}>
                                    <Input value={variant.InfoText}
                                           onChange={e => updateVariant(variant.id, {InfoText: e.target.value})}
                                           placeholder="InfoText"/>
                                </Col>
                            </Row>
                            <Divider style={{margin: "4px 0"}}/>
                            <Space direction="vertical" size={8} style={{width: "100%"}}>
                                {variant.Replacements.map(replacement => (
                                    <Row gutter={[8, 8]} key={replacement.id} align="middle">
                                        <Col xs={24} md={4}>
                                            <Select
                                                allowClear
                                                showSearch
                                                value={replacement.Command || undefined}
                                                options={commandOptions}
                                                onChange={value => updateReplacement(variant.id, replacement.id, {Command: value})}
                                                placeholder={t("DiffGenerator.command")}
                                                style={{width: "100%"}}
                                            />
                                        </Col>
                                        <Col xs={12} md={3}>
                                            <InputNumber
                                                min={0}
                                                value={replacement.ArgIndex}
                                                onChange={value => updateReplacement(variant.id, replacement.id, {ArgIndex: value ?? 0})}
                                                placeholder={t("DiffGenerator.arg_index")}
                                                style={{width: "100%"}}
                                            />
                                        </Col>
                                        <Col xs={12} md={3}>
                                            <Select
                                                allowClear
                                                value={replacement.FileType || undefined}
                                                options={fileTypeOptions}
                                                onChange={value => updateReplacement(variant.id, replacement.id, {FileType: value})}
                                                placeholder={t("DiffGenerator.type")}
                                                style={{width: "100%"}}
                                            />
                                        </Col>
                                        <Col xs={24} md={6}>
                                            <Input value={replacement.From}
                                                   onChange={e => updateReplacement(variant.id, replacement.id, {From: e.target.value})}
                                                   placeholder={t("DiffGenerator.from")}/>
                                        </Col>
                                        <Col xs={24} md={7}>
                                            <Input value={replacement.To}
                                                   onChange={e => updateReplacement(variant.id, replacement.id, {To: e.target.value})}
                                                   placeholder={t("DiffGenerator.to")}/>
                                        </Col>
                                        <Col xs={6} md={1}>
                                            <Button danger type="text" icon={<DeleteOutlined/>}
                                                    onClick={() => removeReplacement(variant.id, replacement.id)}/>
                                        </Col>
                                    </Row>
                                ))}
                                <Space wrap>
                                    <Button type="dashed" icon={<PlusOutlined/>}
                                            onClick={() => addReplacement(variant.id)}>
                                        {t("DiffGenerator.add_replacement")}
                                    </Button>
                                    {references.slice(0, 8).map(ref => (
                                        <Button key={`${variant.id}-${ref.key}`} size="small"
                                                onClick={() => addReplacement(variant.id, ref)}>
                                            {ref.Command} {ref.Value}
                                        </Button>
                                    ))}
                                </Space>
                            </Space>
                        </Space>
                    </Card>
                ))}
                <Button type="primary" loading={loading} onClick={generate}>
                    {t("DiffGenerator.generate_menus")}
                </Button>
            </Space>

            <GenerationResult result={result}/>
        </Space>
    );
};

const Warnings: React.FC<{ warnings?: string[] }> = ({warnings}) => {
    const {t} = useTranslation();
    if (!warnings || warnings.length === 0) {
        return null;
    }
    return (
        <Alert
            type="warning"
            showIcon
            message={t("DiffGenerator.warnings")}
            description={
                <List
                    size="small"
                    dataSource={warnings}
                    renderItem={item => <List.Item>{item}</List.Item>}
                />
            }
        />
    );
};

const GenerationResult: React.FC<{ result?: COM3D2.DiffGenerationResult }> = ({result}) => {
    const {t} = useTranslation();
    if (!result) {
        return null;
    }

    return (
        <Card size="small" title={t("DiffGenerator.result")}>
            <Space direction="vertical" style={{width: "100%"}}>
                <Space wrap>
                    <Tag color="blue">{t("DiffGenerator.menus_processed")}: {result.MenusProcessed}</Tag>
                    <Tag color="green">{t("DiffGenerator.menus_generated")}: {result.MenusGenerated}</Tag>
                    <Tag color="green">{t("DiffGenerator.mates_generated")}: {result.MatesGenerated}</Tag>
                    <Tag>{t("DiffGenerator.assets_copied")}: {result.AssetsCopied}</Tag>
                </Space>
                <Table
                    size="small"
                    rowKey={(record, index) => `${record.Kind}:${record.Path}:${index}`}
                    columns={resultColumns(t)}
                    dataSource={result.Files ?? []}
                    pagination={{pageSize: 10}}
                />
                <Warnings warnings={result.Warnings}/>
            </Space>
        </Card>
    );
};

export default DiffGeneratorPage;
