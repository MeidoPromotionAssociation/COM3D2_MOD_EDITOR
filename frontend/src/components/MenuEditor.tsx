import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {Editor} from "@monaco-editor/react";
import {COM3D2} from "../../wailsjs/go/models";
import {
    Button,
    Checkbox,
    CheckboxProps,
    Collapse,
    Flex,
    FloatButton,
    Input,
    message,
    Modal,
    Radio,
    Space,
    Tooltip
} from "antd";
import {CheckboxGroupProps} from "antd/es/checkbox";
import {useTranslation} from "react-i18next";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {t} from "i18next";
import {SelectPathToSave} from "../../wailsjs/go/main/App";
import {QuestionCircleOutlined} from "@ant-design/icons";
import {useDarkMode} from "../hooks/themeSwitch";
import {setupMonacoEditor} from "../utils/menuMonacoConfig";
import {ConvertJsonToMenu, ConvertMenuToJson, ReadMenuFile, WriteMenuFile} from "../../wailsjs/go/COM3D2/MenuService";
import {COM3D2HeaderConstants} from "../utils/ConstCOM3D2";
import {MenuEditorViewModeKey} from "../utils/LocalStorageKeys";
import Menu = COM3D2.Menu;
import Command = COM3D2.Command;
import FileInfo = COM3D2.FileInfo;

type FormatType = "treeIndent" | "colonSplit" | "JSON" | "TSV";

export interface MenuEditorProps {
    fileInfo?: FileInfo;
}

export interface MenuEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}


const MenuEditor = forwardRef<MenuEditorRef, MenuEditorProps>((props, ref) => {
        const {t} = useTranslation();

        const [fileInfo, setFileInfo] = useState<FileInfo | null>(props.fileInfo || null);
        const [filePath, setFilePath] = useState<string | null>(props.fileInfo?.Path || null);

        const [menuData, setMenuData] = useState<Menu | null>(null);

        // 只读字段
        const [signature, setSignature] = useState("");
        const [bodySize, setBodySize] = useState<number>(0);

        // 可编辑字段
        const [version, setVersion] = useState<number>(0);
        const [srcFileName, setSrcFileName] = useState("");
        const [itemName, setItemName] = useState("");
        const [category, setCategory] = useState("");
        const [infoText, setInfoText] = useState("");

        // Commands 在 MonacoEditor 中以文本形式显示/编辑
        const [commandsText, setCommandsText] = useState<string>("");

        // 切换显示格式
        const [displayFormat, setDisplayFormat] = useState<FormatType>(
            // 从 localStorage 读取上次保存的格式，默认使用 treeIndent
            () => (localStorage.getItem(MenuEditorViewModeKey) as FormatType) || "treeIndent"
        );

        // 只读字段是否可编辑
        const [isInputDisabled, setIsInputDisabled] = useState(true);


        // 监听 Dark Mode
        const isDarkMode = useDarkMode();
        // Monaco Editor 编程语言
        const [language, setLanguage] = useState(() => {
            // 根据当前的 displayFormat 初始化 language
            const fmt = localStorage.getItem(MenuEditorViewModeKey) as FormatType || "treeIndent";
            if (fmt === "JSON") {
                return "json";
            } else if (fmt === "treeIndent") {
                return "menuTreeIndent";
            } else if (fmt === "colonSplit") {
                return "menuColonSplit";
            } else if (fmt === "TSV") {
                return "menuTSV";
            }
            return "plaintext";
        });

        // 显示格式选项
        const formatOptions: CheckboxGroupProps<string>['options'] = [
            {label: t('MenuEditor.treeIndent'), value: 'treeIndent'},
            {label: t('MenuEditor.TSV'), value: 'TSV'},
            {label: t('MenuEditor.colonSplit'), value: 'colonSplit'},
            {label: t('MenuEditor.JSON'), value: 'JSON'},
        ];

        // 显示帮助模态
        const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
        const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
        const [pendingFileContent, setPendingFileContent] = useState<{ size: number }>({size: 0});

        // 关键命令缺少参数的Modal状态
        const [isMissingParamsModalOpen, setIsMissingParamsModalOpen] = useState(false);
        const [missingCommandNames, setMissingCommandNames] = useState<string[]>([]);

        const handleShowHelp = () => {
            setIsHelpModalVisible(true);
        }

        const handleHelpOk = () => {
            setIsHelpModalVisible(false);
        };

        const handleHelpCancel = () => {
            setIsHelpModalVisible(false);
        };

        useEffect(() => {
            if (props.fileInfo) {
                setFileInfo(props.fileInfo);
                setFilePath(props.fileInfo.Path);
            }
        }, [props.fileInfo]);

        // 当 filePath 变化或初始化时读取菜单数据
        useEffect(() => {
            let isMounted = true;

            if (filePath) {
                const fileName = filePath.split(/[\\/]/).pop();
                WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

                (async () => {
                    try {
                        if (!isMounted) return;
                        await handleReadMenuFile();
                    } catch {
                    }
                })();
            } else {
                WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
                if (!isMounted) return;
                setMenuData(new (Menu));
                setSignature(COM3D2HeaderConstants.MenuSignature);
                setVersion(COM3D2HeaderConstants.MenuVersion);
                setBodySize(0);
                updateCommandsText([], displayFormat);
            }

            return () => {
                isMounted = false;
            };
        }, [filePath]);


        /**
         * 从后端读取 .menu 文件
         */
        const handleReadMenuFile = async () => {
            if (!filePath || !fileInfo) {
                message.error(t('Infos.pls_open_file_first'));
                return;
            }
            try {
                const size = fileInfo?.Size;
                if (size > 1024 * 1024 * 20) {
                    setPendingFileContent({size});
                    setIsConfirmModalOpen(true);
                    return;
                }
                await handleConfirmRead(false);
            } catch (error: any) {
                console.error(error);
                message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.menu'}) + error);
            }
        };

        // 确认读取文件
        const handleConfirmRead = async (DirectlyConvert: boolean) => {
            setIsConfirmModalOpen(false);
            if (!filePath || !fileInfo) {
                message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
                return;
            }
            if (DirectlyConvert) {
                const hide = message.loading(t('Infos.converting_please_wait'), 0);
                try {
                    if (fileInfo.StorageFormat == "json") {
                        const path = filePath.replace(/\.menu\.json$/, '.menu');
                        await ConvertJsonToMenu(filePath, path);
                        message.success(t('Infos.directly_convert_success') + path, 5);
                    } else {
                        const path = filePath.replace(/\.menu$/, '.menu.json');
                        await ConvertMenuToJson(filePath, path);
                        message.success(t('Infos.directly_convert_success') + path, 5);
                    }
                } catch (error: any) {
                    console.error(error);
                    message.error(t('Errors.directly_convert_failed_colon') + error);
                } finally {
                    setFilePath(null)
                    hide();
                }
                return;
            }
            const hide = message.loading(t('Infos.loading_please_wait'));
            try {
                const result = await ReadMenuFile(filePath);
                setMenuData(result);
                setSignature(result.Signature);
                setBodySize(result.BodySize);
                setVersion(result.Version);
                setSrcFileName(result.SrcFileName);
                setItemName(result.ItemName);
                setCategory(result.Category);
                setInfoText(result.InfoText);

                setDisplayFormat(displayFormat);

                if (displayFormat === "treeIndent") {
                    setCommandsText(commandsToTextTreeIndent(result.Commands));
                } else if (displayFormat === "colonSplit") {
                    setCommandsText(commandsToTextColonSplit(result.Commands));
                } else if (displayFormat === "JSON") {
                    setCommandsText(commandsToTextJSON(result.Commands));
                } else if (displayFormat === "TSV") {
                    setCommandsText(commandsToTextTSV(result.Commands));
                } else {
                    setCommandsText("unknown format");
                }
            } catch (error: any) {
                console.error(error);
                message.error(t('Errors.read_foo_file_failed_colon', {file_type: '.menu'}) + error);
            } finally {
                hide();
            }
        };

        /**
         * 保存当前编辑内容到后端
         */
        const handleSaveMenuFile = async () => {
            if (!filePath || !fileInfo) {
                message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
                return;
            }
            if (!menuData) {
                message.error(t('Errors.pls_load_file_first'));
                return;
            }
            try {
                let parsedCommands: Command[];
                switch (displayFormat) {
                    case "treeIndent":
                        parsedCommands = parseTextAsTreeIndent(commandsText);
                        break;
                    case "colonSplit":
                        parsedCommands = parseTextAsColonSplit(commandsText);
                        break;
                    case "JSON":
                        parsedCommands = parseTextAsJSON(commandsText);
                        break;
                    case "TSV":
                        parsedCommands = parseTextAsTSV(commandsText);
                        break;
                    default:
                        parsedCommands = [];
                }

                // 检查关键命令是否缺少参数
                const criticalCommands = ['category', 'setumei', 'name'];
                const missingParamCommands = parsedCommands.filter(command => {
                    const cmdName = (command.Command || '').toLowerCase();
                    const args = command.Args ?? [];
                    return criticalCommands.includes(cmdName) &&
                        (args.length === 0 || (args[0] ?? '').trim() === '');
                });

                if (missingParamCommands.length > 0) {
                    // 获取所有缺少参数的命令名称
                    const cmdNames = missingParamCommands.map(cmd => cmd.Command);
                    setMissingCommandNames(cmdNames);
                    setIsMissingParamsModalOpen(true);
                    return;
                }

                await saveMenuFileToPath(parsedCommands);
            } catch (err) {
                console.error(err);
                message.error(t('Errors.save_file_failed_colon') + err);
            }
        };

        // 实际保存文件的函数
        const saveMenuFileToPath = async (parsedCommands: Command[]) => {
            try {
                if (!filePath) {
                    message.error(t('Errors.pls_open_file_first_new_file_use_save_as'));
                    return;
                }

                const newMenuData = COM3D2.Menu.createFrom({
                    Signature: signature,
                    BodySize: bodySize,
                    Version: version,
                    SrcFileName: srcFileName,
                    ItemName: itemName,
                    Category: category,
                    InfoText: infoText,
                    Commands: parsedCommands
                });

                await WriteMenuFile(filePath, newMenuData);
                message.success(t('Infos.success_save_file'));
            } catch (err) {
                console.error(err);
                message.error(t('Errors.save_file_failed_colon') + err);
            }
        };

        // 处理关键命令缺少参数Modal的确认
        const handleMissingParamsOk = async () => {
            setIsMissingParamsModalOpen(false);

            // 继续保存
            let parsedCommands: Command[];
            switch (displayFormat) {
                case "treeIndent":
                    parsedCommands = parseTextAsTreeIndent(commandsText);
                    break;
                case "colonSplit":
                    parsedCommands = parseTextAsColonSplit(commandsText);
                    break;
                case "JSON":
                    parsedCommands = parseTextAsJSON(commandsText);
                    break;
                case "TSV":
                    parsedCommands = parseTextAsTSV(commandsText);
                    break;
                default:
                    parsedCommands = [];
            }

            await saveMenuFileToPath(parsedCommands);
        };

        // 处理关键命令缺少参数Modal的取消
        const handleMissingParamsCancel = () => {
            setIsMissingParamsModalOpen(false);
        };

        /**
         * 另存为文件
         */
        const handleSaveAsMenuFile = async () => {
            if (!menuData) {
                message.error(t('Errors.pls_load_file_first'));
                return;
            }
            try {
                let parsedCommands: Command[];
                switch (displayFormat) {
                    case "treeIndent":
                        parsedCommands = parseTextAsTreeIndent(commandsText);
                        break;
                    case "colonSplit":
                        parsedCommands = parseTextAsColonSplit(commandsText);
                        break;
                    case "JSON":
                        parsedCommands = parseTextAsJSON(commandsText);
                        break;
                    case "TSV":
                        parsedCommands = parseTextAsTSV(commandsText);
                        break;
                    default:
                        parsedCommands = [];
                }

                const newMenuData = COM3D2.Menu.createFrom({
                    Signature: signature,
                    BodySize: bodySize,
                    Version: version,
                    SrcFileName: srcFileName,
                    ItemName: itemName,
                    Category: category,
                    InfoText: infoText,
                    Commands: parsedCommands
                });

                const path = await SelectPathToSave("*.menu;*.menu.json", t('Infos.com3d2_menu_file'));
                if (!path) {
                    // 用户取消了保存
                    return;
                }

                await WriteMenuFile(path, newMenuData);
                message.success(t('Infos.success_save_as_file_colon') + path);
            } catch (err) {
                console.error(err);
                message.error(t('Errors.save_as_file_failed_colon') + err);
            }
        };


        /**
         * 根据给定 commands 和格式类型，更新编辑器文本
         */
        const updateCommandsText = (commands: Command[], fmt: FormatType) => {
            let text;
            let language;
            switch (fmt) {
                case "treeIndent":
                    text = commandsToTextTreeIndent(commands);
                    language = "menuTreeIndent"
                    break;
                case "colonSplit":
                    text = commandsToTextColonSplit(commands);
                    language = "menuColonSplit"
                    break;
                case "JSON":
                    text = commandsToTextJSON(commands);
                    language = "json"
                    break;
                case "TSV":
                    text = commandsToTextTSV(commands);
                    language = "menuTSV";
                    break;
                default:
                    text = "";
                    language = "plaintext"
            }
            setCommandsText(text);
            setLanguage(language)
        };


        /**
         * 当 displayFormat 改变时，重新生成编辑器文本
         */
        useEffect(() => {
            if (menuData && menuData.Commands) {
                updateCommandsText(menuData.Commands, displayFormat);
            }
        }, [displayFormat, menuData]);


        // 将文件操作方法暴露给父组件
        useImperativeHandle(ref, () => ({
            handleReadFile: handleReadMenuFile,
            handleSaveFile: handleSaveMenuFile,
            handleSaveAsFile: handleSaveAsMenuFile,
        }));


        // 只读字段是否可编辑可选框响应
        const handleCheckboxChange: CheckboxProps['onChange'] = (e) => {
            setIsInputDisabled(!e.target.checked);
        };

        return (
            <div style={{padding: 10}}>
                <Modal
                    title={t('Infos.large_file_waring')}
                    open={isConfirmModalOpen}
                    onCancel={() => setIsConfirmModalOpen(false)}
                    footer={[
                        <Button key="convert" type="primary" onClick={() => handleConfirmRead(true)}>
                            {t('Common.convert_directly')}
                        </Button>,
                        <Button key="cancel" onClick={() => {
                            setIsConfirmModalOpen(false);
                            setFilePath(null);
                        }}>
                            {t('Common.cancel')}
                        </Button>,
                        <Button key="confirm" onClick={() => handleConfirmRead(false)}>
                            {t('Common.continue')}
                        </Button>
                    ]}
                >
                    <p>{t('Infos.file_too_large_tip', {size: (pendingFileContent?.size / 1024 / 1024).toFixed(2)})}</p>
                    <p>{t('Infos.file_too_large_convert_to_json_directly')}</p>
                </Modal>
                {menuData && (
                    <div
                        style={{
                            height: '100%',
                        }}
                    >
                        {/* 文件头编辑区 */}
                        <div style={{marginBottom: 10}}>
                            <Collapse
                                size="small"
                                items={[{
                                    key: '1',
                                    label: t('MenuEditor.file_header.file_head_usually_no_modify_required'),
                                    children: <>
                                        <Space direction="vertical" style={{width: '100%'}}>
                                            <Space style={{width: '100%'}}>
                                                <Input addonBefore={t('MenuEditor.file_header.Signature')}
                                                       value={signature}
                                                       disabled={isInputDisabled}
                                                       onChange={(e) => setSignature(e.target.value)}/>
                                                <Input addonBefore={t('MenuEditor.file_header.BodySize')}
                                                       value={bodySize}
                                                       disabled={isInputDisabled}
                                                       onChange={(e) => setBodySize(parseInt(e.target.value, 10))}/>
                                                <Input addonBefore={t('MenuEditor.file_header.Version')}
                                                       value={version}
                                                       disabled={isInputDisabled}
                                                       type="number"
                                                       onChange={(e) => setVersion(parseInt(e.target.value, 10))}/>
                                                <Checkbox checked={!isInputDisabled}
                                                          onChange={handleCheckboxChange}>{t('MenuEditor.file_header.enable_edit_do_not_edit')}</Checkbox>
                                            </Space>


                                            <Space direction="vertical" style={{width: '100%'}}>
                                                <Input addonBefore={<span style={{
                                                    width: '15vw',
                                                    display: 'inline-block',
                                                    textAlign: 'left'
                                                }}>{t('MenuEditor.file_header.SrcFileName')}</span>}
                                                       value={srcFileName}
                                                       onChange={(e) => setSrcFileName(e.target.value)}
                                                       suffix={
                                                           <Tooltip title={t('MenuEditor.file_header.SrcFileName_tip')}>
                                                               <QuestionCircleOutlined/>
                                                           </Tooltip>
                                                       }/>
                                                <Input addonBefore={<span style={{
                                                    width: '15vw',
                                                    display: 'inline-block',
                                                    textAlign: 'left'
                                                }}>{t('MenuEditor.file_header.ItemName')}</span>}
                                                       value={itemName}
                                                       onChange={(e) => setItemName(e.target.value)}
                                                       suffix={
                                                           <Tooltip title={t('MenuEditor.file_header.ItemName_tip')}>
                                                               <QuestionCircleOutlined/>
                                                           </Tooltip>
                                                       }/>
                                                <Input addonBefore={<span style={{
                                                    width: '15vw',
                                                    display: 'inline-block',
                                                    textAlign: 'left'
                                                }}>{t('MenuEditor.file_header.Category')}</span>}
                                                       value={category}
                                                       onChange={(e) => setCategory(e.target.value)}
                                                       suffix={
                                                           <Tooltip title={t('MenuEditor.file_header.Category_tip')}>
                                                               <QuestionCircleOutlined/>
                                                           </Tooltip>
                                                       }/>
                                                <Input addonBefore={<span style={{
                                                    width: '15vw',
                                                    display: 'inline-block',
                                                    textAlign: 'left'
                                                }}>{t('MenuEditor.file_header.SetInfoText')}</span>}
                                                       value={infoText}
                                                       onChange={(e) => setInfoText(e.target.value)}
                                                       suffix={
                                                           <Tooltip title={t('MenuEditor.file_header.SetInfoText_tip')}>
                                                               <QuestionCircleOutlined/>
                                                           </Tooltip>
                                                       }/>
                                            </Space>
                                        </Space>
                                    </>
                                }]}
                            />
                        </div>

                        {/* Commands 编辑区 */}
                        <div style={{marginTop: 8}}>
                            <div style={{marginBottom: 8}}>
                                {/*<span>Commands 显示格式: </span>*/}
                                <Flex vertical gap="middle">
                                    <Radio.Group
                                        size="small"
                                        block
                                        options={formatOptions}
                                        defaultValue="treeIndent"
                                        optionType="button"
                                        buttonStyle="solid"
                                        value={displayFormat}
                                        onChange={(e) => {
                                            const newFmt = e.target.value as FormatType;
                                            try {
                                                // 1) 先按当前视图解析现有文本
                                                let parsed: Command[] = [];
                                                switch (displayFormat) {
                                                    case "treeIndent":
                                                        parsed = parseTextAsTreeIndent(commandsText);
                                                        break;
                                                    case "colonSplit":
                                                        parsed = parseTextAsColonSplit(commandsText);
                                                        break;
                                                    case "JSON":
                                                        parsed = parseTextAsJSON(commandsText);
                                                        break;
                                                    case "TSV":
                                                        parsed = parseTextAsTSV(commandsText);
                                                        break;
                                                    default:
                                                        parsed = [];
                                                }

                                                // 2) 同步更新内存中的 Commands
                                                setMenuData((prev) => {
                                                    if (!prev) return prev;
                                                    return COM3D2.Menu.createFrom({
                                                        ...prev,
                                                        Commands: parsed,
                                                    });
                                                });

                                                // 3) 切换视图；文本将在 useEffect 中用最新 Commands 渲染
                                                setDisplayFormat(newFmt);
                                                localStorage.setItem(MenuEditorViewModeKey, newFmt);
                                            } catch (err: any) {
                                                console.error(err);
                                                if (displayFormat === "JSON") {
                                                    message.error(t('Errors.json_parse_failed') + (err?.message || "")).then();
                                                } else {
                                                    message.error(String(err?.message || err || 'Parse failed')).then();
                                                }
                                                // 解析失败则不切换视图
                                            }
                                        }}
                                    />
                                </Flex>
                            </div>

                            <div
                                style={{
                                    height: "calc(100vh - 165px)",
                                    borderRadius: '8px',   // 添加圆角
                                    overflow: 'hidden'     // 隐藏超出圆角范围的部分
                                }}
                            >
                                <FloatButton
                                    onClick={handleShowHelp}
                                    icon={<QuestionCircleOutlined/>}
                                    style={{zoom: 0.8}}
                                />
                                <Modal title={t('MenuEditor.menu_editor_help')} open={isHelpModalVisible}
                                       onOk={handleHelpOk} onCancel={handleHelpCancel}>
                                    <h4>{t('MenuEditor.command_description')}</h4>
                                    <p>{t('MenuEditor.place_mouse_on_command_view_description')}</p>
                                    <h4>{t('MenuEditor.shortcut')}</h4>
                                    <p>{t('MenuEditor.ctrl_space')}</p>
                                    <p>{t('MenuEditor.other_shortcuts')}</p>
                                    <h4>{t('MenuEditor.note')}</h4>
                                    <p>{t('MenuEditor.format_tree_tsv_use_tab')}</p>
                                    <p>{t('MenuEditor.only_tree_indent_have_autocomplete')}</p>
                                    <p>{t('MenuEditor.cannot_save_empty_line')}</p>
                                    {/*TODO*/}
                                </Modal>
                                <Modal
                                    title={t('Infos.critical_command_missing_params')}
                                    open={isMissingParamsModalOpen}
                                    onOk={handleMissingParamsOk}
                                    onCancel={handleMissingParamsCancel}
                                    okText={t('Common.continue_save')}
                                    cancelText={t('Common.back')}
                                    footer={[
                                        <Button onClick={handleMissingParamsOk}>
                                            {t('Common.continue_save')}
                                        </Button>,
                                        <Button type="primary" onClick={handleMissingParamsCancel}>
                                            {t('Common.back')}
                                        </Button>,
                                    ]}
                                >
                                    <p>{t('Infos.commands_missing_params')}</p>
                                    {missingCommandNames.map((name, index) => (
                                        <li key={index}>{name}</li>
                                    ))}
                                    <br/>
                                    <p>{t('Infos.may_cause_game_malfunction')}</p>
                                    <p>{t('Common.note_colon')}{t('MenuEditor.cannot_save_empty_line')}</p>
                                </Modal>
                                <Editor
                                    beforeMount={(monacoInstance) => setupMonacoEditor(monacoInstance)}
                                    language={language}
                                    theme={isDarkMode ? "menuTheme-dark" : "menuTheme"}
                                    value={commandsText}
                                    onChange={(value) => setCommandsText(value ?? "")}
                                    options={{
                                        minimap: {enabled: true},
                                        insertSpaces: false,
                                        tabSize: 4,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

export default MenuEditor;

/* -----------------------------
 *   utils: commands 文本格式的转换
 * ----------------------------- */

/**
 * treeIndent 树形缩进:
 *  - 每一条命令用命令名占一行 (即 Arg[0] )，后续参数(Arg[1..])行前有制表符
 *  - 命令之间用空行分割
 *
 * 示例:
 *  CommandName
 *      param1
 *      param2
 *
 *  AnotherCommand
 *      x
 *      y
 */
function commandsToTextTreeIndent(commands: Command[]): string {
    const lines: string[] = [];
    commands.forEach((cmd) => {
        const name = (cmd.Command ?? '').trim();
        const args = cmd.Args ?? [];
        if (name) {
            lines.push(name);
            for (const p of args) {
                lines.push("\t" + p);
            }
            lines.push(""); // 命令与命令之间空行
        }
    });
    return lines.join("\n").trim();
}

/**
 * colonSplit:
 *  - 每条命令一行: CommandName: param1, param2, ...
 * 示例:
 *  CommandName: param1, param2
 *  AnotherCmd: x, y, z
 */
function commandsToTextColonSplit(commands: Command[]): string {
    const lines: string[] = [];
    commands.forEach((cmd) => {
        const name = (cmd.Command ?? '').trim();
        const args = cmd.Args ?? [];
        if (!name) return;
        if (args.length > 0) {
            lines.push(`${name}: ${args.join(", ")}`);
        } else {
            lines.push(name);
        }
    });
    return lines.join("\n");
}

/**
 * JSON
 *  - 整个 commands 数组转为 JSON，缩进 2 格
 */
function commandsToTextJSON(commands: Command[]): string {
    return JSON.stringify(commands, null, 2);
}


/**
 * TSV
 *  - 每条命令一行
 *  - 同一条命令所有参数用制表符分隔
 *
 * 示例:
 *  CommandName   param1   param2
 *  AnotherCmd    x        y
 */
function commandsToTextTSV(commands: Command[]): string {
    const lines: string[] = [];
    commands.forEach((cmd) => {
        const name = (cmd.Command ?? '').trim();
        const args = cmd.Args ?? [];
        if (name) {
            lines.push([name, ...args].join("\t"));
        }
    });
    return lines.join("\n");
}

/**
 * parseTextAsTreeIndent
 *  - 树形缩进
 *  - 遇到不以 '\t' 开头的行 => 认为是新的命令 Arg[0]
 *  - 以 '\t' 开头的行 => 认为是当前命令的后续参数
 *  - 空行表示命令结束
 */
function parseTextAsTreeIndent(text: string): Command[] {
    const lines = text.split(/\r?\n/);
    const commands: Command[] = [];

    let currentName: string | null = null;
    let currentParams: string[] = [];

    function commit() {
        if (currentName && currentName.trim() !== '') {
            commands.push({
                Command: currentName.trim(),
                Args: currentParams.length > 0 ? currentParams : null,
            } as unknown as Command);
        }
        currentName = null;
        currentParams = [];
    }

    for (let line of lines) {
        const raw = line; // 保留左侧缩进判断
        // 空行：提交上一条命令
        if (!raw.trim()) {
            commit();
            continue;
        }

        if (raw.startsWith("\t")) {
            // 1) 直接去掉开头所有 \t
            const paramText = raw.replace(/^\t+/, "");
            if (currentName !== null) {
                currentParams.push(paramText);
            }
        } else {
            // 2) 新的命令行
            commit();  // 提交上一条命令
            currentName = raw.trim();
        }
    }
    // 最后一条
    commit();

    return commands;
}

/**
 * parseTextAsColonSplit
 *  - 冒号分割
 *  - 每行形如: CommandName: param1, param2, ...
 * 示例:
 *  CommandName: param1, param2
 *  AnotherCmd: x, y, z
 */
function parseTextAsColonSplit(text: string): Command[] {
    const lines = text.split(/\r?\n/);
    const commands: Command[] = [];

    for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const colonIndex = trimmed.indexOf(":");
        if (colonIndex < 0) {
            // 没有冒号 => 只有命令名
            commands.push({
                Command: trimmed,
                Args: null,
            } as unknown as Command);
            continue;
        }
        const commandName = trimmed.substring(0, colonIndex).trim();
        const rest = trimmed.substring(colonIndex + 1).trim();

        const argsArr = rest ? rest.split(",").map((item) => item.trim()).filter(s => s.length > 0) : [];

        commands.push({
            Command: commandName,
            Args: argsArr.length > 0 ? argsArr : null,
        } as unknown as Command);
    }
    return commands;
}

/**
 * parseTextAsJSON
 *  - JSON
 *  - 期望整个编辑器内容是一个 JSON 数组
 *  - 形如: [ { "Command": "Foo", "Args": ["Bar"] }, ... ]
 */
function parseTextAsJSON(text: string): Command[] {
    const trimmed = text.trim();
    if (!trimmed) {
        // 空内容 => 空数组
        return [];
    }

    try {
        const parsed = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) {
            message.error(t('Errors.json_root_node_not_array')).then(() => {
            });
            return [];
        }
        // 映射为 Command[]
        return parsed.map((item: any) => {
            if (typeof item.Command !== "string") {
                throw new Error("Invalid Command field");
            }
            let args: string[] | null;
            if (item.Args === null || item.Args === undefined) {
                args = null;
            } else if (Array.isArray(item.Args)) {
                // 校验元素均为字符串（宽松处理：非字符串将转为字符串）
                args = item.Args.map((v: any) => String(v));
            } else {
                throw new Error("Invalid Args field");
            }
            return {
                Command: item.Command,
                Args: args,
            } as unknown as Command;
        });
    } catch (err: any) {
        console.error("parseTextAsJSON error:", err);
        throw new Error(t('Errors.json_parse_failed') + err.message);
    }
}

/**
 * parseTextAsTSV
 *  - TSV
 *  - 每行表示一条命令
 *  - 通过制表符分割成多个参数，Args[0] 视为命令名称，后面是参数
 */
function parseTextAsTSV(text: string): Command[] {
    const lines = text.split(/\r?\n/);
    const commands: Command[] = [];

    for (const line of lines) {
        // 去掉行首尾空格后，如果行是空的就跳过
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }

        // 找到当前行第一个制表符的位置
        const tabIndex = trimmed.indexOf("\t");
        if (tabIndex < 0) {
            // 行内没有任何制表符 => 整行当作命令名称
            commands.push({
                Command: trimmed,
                Args: null,
            } as unknown as Command);
        } else {
            // 第一个制表符之前是命令名称
            const commandName = trimmed.substring(0, tabIndex);
            // 第一个制表符之后的剩余部分，再次用 \t 分割为参数
            const rest = trimmed.substring(tabIndex + 1);
            const params = rest.length > 0 ? rest.split("\t") : [];

            commands.push({
                Command: commandName,
                Args: params.length > 0 ? params : null,
            } as unknown as Command);
        }
    }
    return commands;
}