import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {Editor} from "@monaco-editor/react";
import {COM3D2} from "../../wailsjs/go/models";
import {Button, Checkbox, CheckboxProps, Collapse, Flex, Input, message, Modal, Radio, Space, Tooltip} from "antd";
import {CheckboxGroupProps} from "antd/es/checkbox";
import {useTranslation} from "react-i18next";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {t} from "i18next";
import {SaveFile} from "../../wailsjs/go/main/App";
import {QuestionCircleOutlined} from "@ant-design/icons";
import {useDarkMode} from "../hooks/themeSwitch";
import {setupMonacoEditor} from "../utils/menuMonacoConfig";
import {ReadMenuFile, WriteMenuFile} from "../../wailsjs/go/COM3D2/MenuService";
import {COM3D2HeaderConstants} from "../utils/ConstCOM3D2";
import Menu = COM3D2.Menu;
import Command = COM3D2.Command;

type FormatType = "treeIndent" | "colonSplit" | "JSON" | "TSV";

export interface MenuEditorProps {
    filePath?: string;
}

export interface MenuEditorRef {
    handleReadMenuFile: () => Promise<void>;
    handleSaveMenuFile: () => Promise<void>;
    handleSaveAsMenuFile: () => Promise<void>;
}


const MenuEditor = forwardRef<MenuEditorRef, MenuEditorProps>(({filePath}, ref) => {
        const {t} = useTranslation();
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
            () => (localStorage.getItem('lastMenuDisplayFormat') as FormatType) || "treeIndent"
        );

        // 只读字段是否可编辑
        const [isInputDisabled, setIsInputDisabled] = useState(true);


        // 监听 Dark Mode
        const isDarkMode = useDarkMode();
        // Monaco Editor 主题
        const [editorTheme, setEditorTheme] = useState("vs-light");
        // Monaco Editor 编程语言
        const [language, setLanguage] = useState("plaintext");

        // 显示格式选项
        const formatOptions: CheckboxGroupProps<string>['options'] = [
            {label: t('MenuEditor.treeIndent'), value: 'treeIndent'},
            {label: t('MenuEditor.TSV'), value: 'TSV'},
            {label: t('MenuEditor.colonSplit'), value: 'colonSplit'},
            {label: t('MenuEditor.JSON'), value: 'JSON'},
        ];

        // 显示帮助模态
        const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);

        const handleShowHelp = () => {
            setIsHelpModalVisible(true);
        }

        const handleHelpOk = () => {
            setIsHelpModalVisible(false);
        };

        const handleHelpCancel = () => {
            setIsHelpModalVisible(false);
        };

        // 当 filePath 变化或初始化时读取菜单数据
        useEffect(() => {
            if (!filePath) {
                WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
                setMenuData(new (Menu));
                // default values
                setSignature(COM3D2HeaderConstants.MenuSignature);
                setVersion(COM3D2HeaderConstants.MenuVersion);
                setBodySize(0);
                updateCommandsText([], displayFormat);
                return;
            }

            // 设置窗口标题
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

            async function loadMenu() {
                try {
                    if (filePath) {
                        const result = await ReadMenuFile(filePath);
                        setMenuData(result);

                        setSignature(result.Signature);
                        setBodySize(result.BodySize);
                        setVersion(result.Version);
                        setSrcFileName(result.SrcFileName);
                        setItemName(result.ItemName);
                        setCategory(result.Category);
                        setInfoText(result.InfoText);

                        updateCommandsText(result.Commands, displayFormat);
                    }
                } catch (err) {
                    console.error(err);
                    message.error(t('Errors.read_menu_file_failed_colon') + err);
                }
            }

            loadMenu();
        }, [filePath]);


        /**
         * 从后端读取 .menu 文件
         */
        const handleReadMenuFile = async () => {
            if (!filePath) {
                message.error(t('Errors.pls_input_menu_file_path_to_open'));
                return;
            }
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

                if (displayFormat === "treeIndent") {
                    setCommandsText(commandsToTextTreeIndent(result.Commands));
                } else if (displayFormat === "colonSplit") {
                    setCommandsText(commandsToTextColonSplit(result.Commands));
                } else if (displayFormat === "JSON") {
                    setCommandsText(commandsToTextJSON(result.Commands));
                } else {
                    setCommandsText("unknown format");
                }
            } catch (err) {
                console.error(err);
                message.error(t('Errors.read_menu_file_failed_colon') + err);
            }
        };

        /**
         * 保存当前编辑内容到后端
         */
        const handleSaveMenuFile = async () => {
            if (!filePath) {
                message.error(t('Errors.pls_input_file_path_first'));
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

                const path = await SaveFile("*.menu", t('Infos.com3d2_menu_file'));
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
        }, [displayFormat]);


        /**
         * 监听 Ctrl+S 快捷键，触发保存
         */
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                // Windows/Linux: Ctrl+S, macOS: Cmd+S => e.metaKey
                if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                    e.preventDefault();
                    handleSaveMenuFile();
                }
            };
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }, [handleSaveMenuFile]);


        // 将文件操作方法暴露给父组件
        useImperativeHandle(ref, () => ({
            handleReadMenuFile,
            handleSaveMenuFile,
            handleSaveAsMenuFile,
        }));


        // 只读字段是否可编辑可选框响应
        const handleCheckboxChange: CheckboxProps['onChange'] = (e) => {
            setIsInputDisabled(!e.target.checked);
        };

        return (
            <div style={{padding: 10}}>
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
                                            setDisplayFormat(e.target.value);
                                            localStorage.setItem('lastMenuDisplayFormat', e.target.value);
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
                                <Button
                                    onClick={handleShowHelp}
                                    size="small"
                                    type="text"
                                    style={{position: "absolute", bottom: 0, right: 0, zIndex: 9999}}
                                    icon={<QuestionCircleOutlined/>}
                                />
                                <Modal title={t('MenuEditor.menu_editor_help')} open={isHelpModalVisible}
                                       onOk={handleHelpOk} onCancel={handleHelpCancel}>
                                    <h4>{t('MenuEditor.shortcut')}</h4>
                                    <p>{t('MenuEditor.ctrl_space')}</p>
                                    <p>{t('MenuEditor.other_shortcuts')}</p>
                                    <h4>{t('MenuEditor.note')}</h4>
                                    <p>{t('MenuEditor.format_tree_tsv_use_tab')}</p>
                                    <p>{t('MenuEditor.only_tree_indent_have_autocomplete')}</p>
                                    {/*TODO*/}
                                </Modal>
                                <Editor
                                    beforeMount={(monacoInstance) => setupMonacoEditor(monacoInstance, isDarkMode)}
                                    language={language}
                                    theme="menuTheme"
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
    })
;

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
        if (cmd.Args && cmd.Args.length > 0) {
            // 假设 Args[0] 是类似命令名
            lines.push(cmd.Args[0]);
            // 后续参数
            for (let i = 1; i < cmd.Args.length; i++) {
                // 只在这里插入一次制表符
                lines.push("\t" + cmd.Args[i]);
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
        if (cmd.Args && cmd.Args.length > 0) {
            const commandName = cmd.Args[0];
            const restParams = cmd.Args.slice(1);
            lines.push(`${commandName}: ${restParams.join(", ")}`);
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
        if (cmd.Args && cmd.Args.length > 0) {
            // 把该 command 的所有 Args 用 \t 拼成一个字符串
            lines.push(cmd.Args.join("\t"));
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

    let currentArgs: string[] = [];

    function commitArgs() {
        if (currentArgs.length > 0) {
            commands.push({
                ArgCount: currentArgs.length,
                Args: [...currentArgs],
            });
            currentArgs = [];
        }
    }

    for (let line of lines) {
        const trimmed = line.trimEnd(); // 保留左侧缩进判断
        // 空行：提交上一条命令
        if (!trimmed.trim()) {
            commitArgs();
            continue;
        }

        if (trimmed.startsWith("\t")) {
            // 1) 直接去掉开头所有 \t
            const paramText = trimmed.replace(/^\t+/, "");
            currentArgs.push(paramText);
        } else {
            // 2) 新的命令行
            commitArgs();  // 提交上一条命令
            currentArgs.push(trimmed);
        }
    }
    // 最后一条
    commitArgs();

    return commands;
}

/**
 * parseTextAsColonSplit
 *  - 冒号分割
 *  - 每行形如: CommandName: param1, param2, ...
 *  - 冒号分隔 commandName 与后续，用逗号再分隔后续
 */
function parseTextAsColonSplit(text: string): Command[] {
    const lines = text.split(/\r?\n/);
    const commands: Command[] = [];

    for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const colonIndex = trimmed.indexOf(":");
        if (colonIndex < 0) {
            // 没有冒号就跳过或视为只有一个 Arg
            commands.push({
                ArgCount: 1,
                Args: [trimmed],
            });
            continue;
        }
        const commandName = trimmed.substring(0, colonIndex).trim();
        const rest = trimmed.substring(colonIndex + 1).trim();

        let args = [commandName];
        if (rest) {
            const splitted = rest.split(",");
            splitted.forEach((item) => {
                args.push(item.trim());
            });
        }

        commands.push({
            ArgCount: args.length,
            Args: args,
        });
    }
    return commands;
}

/**
 * parseTextAsJSON
 *  - JSON
 *  - 期望整个编辑器内容是一个 JSON 数组
 *  - 形如: [ { "ArgCount": 2, "Args": ["Foo", "Bar"] }, ... ]
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
            throw new Error(t('Errors.json_root_node_not_array'));
        }
        // 简单映射为 Command[]
        return parsed.map((item: any) => {
            return {
                ArgCount: item.ArgCount ?? (item.Args ? item.Args.length : 0),
                Args: item.Args ?? [],
            } as Command;
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
                ArgCount: 1,
                Args: [trimmed],
            });
        } else {
            // 第一个制表符之前是命令名称
            const commandName = trimmed.substring(0, tabIndex);
            // 第一个制表符之后的剩余部分，再次用 \t 分割为参数
            const rest = trimmed.substring(tabIndex + 1);
            const params = rest.split("\t");

            commands.push({
                ArgCount: 1 + params.length,
                Args: [commandName, ...params],
            });
        }
    }
    return commands;
}