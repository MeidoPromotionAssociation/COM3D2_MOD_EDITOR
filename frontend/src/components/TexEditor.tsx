import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {BrowserOpenURL, WindowSetTitle} from "../../wailsjs/runtime";
import {useTranslation} from "react-i18next";
import {Button, Card, Image, Input, message, Space, Spin, Switch, Tooltip} from "antd";
import {CheckImageMagick, ConvertAnyToPng} from "../../wailsjs/go/COM3D2/TexService";
import {ExportOutlined} from "@ant-design/icons";
import {ImageMagickUrl} from "../utils/consts";
import useFileHandlers from "../hooks/fileHanlder";
import {SelectPathToSave} from "../../wailsjs/go/main/App";
import {useDarkMode} from "../hooks/themeSwitch";

export interface TexEditorProps {
    filePath?: string;
}

export interface TexEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

const TexEditor = forwardRef<TexEditorRef, TexEditorProps>((props, ref) => {
    const {t} = useTranslation();
    const {filePath} = props;
    const {handleSelectFile, exportTexOrImageAsAny} = useFileHandlers();
    const isDarkMode = useDarkMode();

    // 预览数据
    const [imageData, setImageData] = useState<string | null>(null);

    // 持久化选项
    const [forcePng, setForcePng] = useState<boolean>(() => {
        const saved = localStorage.getItem("TexEditorForcePng");
        return saved ? JSON.parse(saved) : true;
    });
    const [directConvert, setDirectConvert] = useState<boolean>(() => {
        const saved = localStorage.getItem("TexEditorDirectConvert");
        return saved ? JSON.parse(saved) : false;
    });
    const [compress, setCompress] = useState<boolean>(() => {
        const saved = localStorage.getItem("TexEditorCompress");
        return saved ? JSON.parse(saved) : false;
    });
    const [defaultFormat, setDefaultFormat] = useState<string>(() => {
        const saved = localStorage.getItem("TexEditorDefaultFormat");
        return saved ? JSON.parse(saved) : ".png";
    })


    // 加载状态
    const [loading, setLoading] = useState<boolean>(false);

    // ImageMagick 是否安装
    const [isImageMagickInstalled, setIsImageMagickInstalled] = useState<boolean>(false);

    // 检查 ImageMagick 是否安装
    const checkImageMagick = async () => {
        setLoading(true);
        const result = await CheckImageMagick()
        setIsImageMagickInstalled(result);
        setLoading(false);
    }

    /** 切换选项 */
    const toggleForcePng = (value: boolean) => {
        setForcePng(value);
        localStorage.setItem("TexEditorForcePng", JSON.stringify(value));
    };

    const toggleCompress = (value: boolean) => {
        setCompress(value);
        localStorage.setItem("TexEditorCompress", JSON.stringify(value));
    };

    const toggleDirectConvert = (value: boolean) => {
        setDirectConvert(value);
        localStorage.setItem("TexEditorDirectConvert", JSON.stringify(value));
    }

    /** 读取任意文件并转换为 png 以供预览 */
    const handleReadTexFile = async () => {
        if (!filePath) return;

        try {
            setLoading(true);
            const result = await ConvertAnyToPng(filePath)
            if (result) {
                const base64Image = `data:image/png;base64,${result}`;
                setImageData(base64Image);
                setLoading(false)
            }
        } catch (error) {
            console.error("Error reading file:", error);
            message.error(t("Errors.read_file_failed_colon") + error);
        }
    };

    // 导出为 tex 文件
    const handleExportAsTex = async () => {
        if (!filePath) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }

        const outputPath = await SelectPathToSave("*.tex", t('Infos.image_file'));

        if (!outputPath) return;

        await exportTexOrImageAsAny(filePath, outputPath);
    }

    // 导出为任意格式文件
    const handleExportAsImage = async () => {
        if (!filePath) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }
        let outputPath = await SelectPathToSave("*.*", t('Infos.image_file'));

        if (!outputPath) return;

        if (forcePng && !outputPath.endsWith(".tex")) {
            outputPath = outputPath.replace(/\.[^/.]+$/, ".png");
        }

        await exportTexOrImageAsAny(filePath, outputPath);
    }

    // 快速导出为同名文件
    const handleQuickExport = async () => {
        if (!filePath) {
            message.error(t('Errors.pls_load_file_first'));
            return;
        }

        if (filePath.endsWith(".tex")) {
            await exportTexOrImageAsAny(filePath, filePath.replace(".tex", defaultFormat));
            return;
        } else {
            await exportTexOrImageAsAny(filePath, filePath.replace(/\.[^/.]+$/, ".tex"));
            return;
        }
    }

    //当路径更改时加载文件
    useEffect(() => {
        let isMounted = true;

        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop() || "";
            WindowSetTitle(`COM3D2 MOD EDITOR V2 by 90135 —— ${t("Infos.editing_colon")}${fileName}  (${filePath})`);

            (async () => {
                try {
                    if (!isMounted) return;
                    await handleReadTexFile();
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            })();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
        }

        return () => {
            isMounted = false;
        };
    }, [filePath]);



    /**
     * 监听 Ctrl+S 快捷键，触发快速导出
     */
    const saveHandlerRef = useRef(handleQuickExport);

    // 如果改变，更新 saveHandlerRef
    useEffect(() => {
        saveHandlerRef.current = handleQuickExport;
    }, [filePath]); // 包含所有可能影响保存行为的状态

    // 设置 keydown 事件监听器
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Windows/Linux: Ctrl+S, macOS: Cmd+S => e.metaKey
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveHandlerRef.current();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // 暴露至外部的方法
    useImperativeHandle(ref, () => ({
        handleReadFile: handleReadTexFile,
        handleSaveFile: async () => {
            message.warning(t("Infos.not_available_in_this_editor"));
        },
        handleSaveAsFile: async () => {
            message.warning(t("Infos.not_available_in_this_editor"));
        }
    }));


    // 检查 ImageMagick 是否安装
    useEffect(() => {
        checkImageMagick().then(() => {
        })
    }, []);

    return (
        <div style={{padding: "10px", height: "100%", display: "flex", flexDirection: "column"}}>
            <div style={{
                textAlign: "right",
            }
            }>
                <Space direction="horizontal" style={{marginBottom: 16}}>

                    <Tooltip title={t('TexEditor.default_format_tip')}>
                        <Input

                            addonBefore={t('TexEditor.default_format')}
                            defaultValue=".png"
                            value={defaultFormat}
                            onChange={e => setDefaultFormat(e.target.value.replace(/[^a-zA-Z.0-9]/g, '').toLowerCase())}
                            style={{width: '150px'}}
                        />
                    </Tooltip>

                    <Tooltip title={t("TexEditor.force_png_tip")}>
                        <Switch
                            checkedChildren={t("TexEditor.force_png")}
                            unCheckedChildren={t("TexEditor.auto_format")}
                            checked={forcePng}
                            onChange={toggleForcePng}
                        />
                    </Tooltip>

                    <Tooltip title={t("TexEditor.compress_tip")}>
                        <Switch
                            checkedChildren={t("TexEditor.compress")}
                            unCheckedChildren={t("TexEditor.no_compress")}
                            checked={compress}
                            onChange={toggleCompress}
                        />
                    </Tooltip>

                    <Tooltip title={t('TexEditor.direct_convert_tip')}>
                        <Switch
                            checkedChildren={t("TexEditor.direct_convert")}
                            unCheckedChildren={t("TexEditor.preview")}
                            checked={directConvert}
                            onChange={toggleDirectConvert}
                        />
                    </Tooltip>

                    <Tooltip title={t('TexEditor.export_as_tex_tip')}>
                        <Button
                            icon={<ExportOutlined/>}
                            onClick={handleExportAsTex}
                        >
                            {t('TexEditor.export_as_tex')}
                        </Button>
                    </Tooltip>

                    <Tooltip title={t('TexEditor.export_as_image_tip')}>
                        <Button
                            icon={<ExportOutlined/>}
                            onClick={handleExportAsImage}
                        >
                            {t('TexEditor.export_as_image')}
                        </Button>
                    </Tooltip>

                    <Tooltip title={t('TexEditor.quick_export_tip')}>
                        <Button
                            type="primary"
                            icon={<ExportOutlined/>}
                            onClick={handleQuickExport}
                        >
                            {t('TexEditor.quick_export')}
                        </Button>
                    </Tooltip>

                </Space>
            </div>


            <Spin spinning={loading} tip={t("Infos.loading")}>
                <div>
                    {imageData ? (
                        <div>
                            <Card
                                style={{
                                    height: "82vh",
                                    width: "100%",
                                    backgroundColor: isDarkMode ? "#1f1f1f" : "#f1f1f1",
                                }}>
                                <Image
                                    src={imageData}
                                    alt="Tex Preview"
                                    style={{maxWidth: "100%", maxHeight: "75vh"}}
                                />
                            </Card>

                            {filePath?.endsWith(".tex") && (
                                <></>
                            )

                            }

                        </div>
                    ) : (
                        <div>
                            <Card
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    height: "82vh",
                                    width: "100%",
                                    backgroundColor: isDarkMode ? "#1f1f1f" : "#f1f1f1",
                                }}>

                                {!isImageMagickInstalled ? (
                                    <>
                                        <Space direction="vertical" size="middle" style={{width: '100%'}}>
                                            <h1>{t("TexEditor.no_ImageMagick")}</h1>
                                            <div>{t("TexEditor.ImageMagick_tip")}</div>
                                            <div>{t("TexEditor.ImageMagick_download_tip")}</div>

                                            <Button
                                                type="primary"
                                                icon={<ExportOutlined/>}
                                                onClick={() => BrowserOpenURL(ImageMagickUrl)}>
                                                {t('TexEditor.download_ImageMagick')}
                                            </Button>

                                            <div>{t("TexEditor.ImageMagick_tip2")}</div>
                                        </Space>
                                    </>
                                ) : (
                                    <>
                                        <Space direction="vertical" size="middle" style={{width: '100%'}}>
                                            <Button
                                                type="primary"
                                                onClick={() => handleSelectFile("*.tex;*.*", t('Infos.com3d2_tex_file'))}
                                            >
                                                {t('Infos.choose_file')}
                                            </Button>
                                            {filePath ? t("TexEditor.no_preview_available") : t("Infos.pls_select_a_file_to_preview")}
                                        </Space>
                                    </>
                                )}
                            </Card>
                        </div>
                    )}
                </div>
            </Spin>
        </div>
    );
});

export default TexEditor;