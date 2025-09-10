import {enumMap, getCommandSnippetMap, getMenuCommandDocs} from "./menuCommandDocs";
import {t} from "i18next";

// 用于存储已初始化的 Monaco 实例
const initializedMonacoInstances = new WeakMap()

// 语言定义
const defineLanguages = (monacoInstance: any) => {
// 注册自定义语言 menuTreeIndent
    monacoInstance.languages.register({id: "menuTreeIndent"});
    monacoInstance.languages.setMonarchTokensProvider("menuTreeIndent", {
        tokenizer: {
            root: [
                [/^\t+.+$/, "parameter"],
                [/^[^\t].+$/, "command"],
                [/^\s*$/, "white"],
            ],
        },
    });

// 注册自定义语言 menuColonSplit
    monacoInstance.languages.register({id: "menuColonSplit"});
    monacoInstance.languages.setMonarchTokensProvider("menuColonSplit", {
        tokenizer: {
            root: [
                [/^[^:]+(?=:)/, "command"],
                [/:/, "delimiter"],
                [/\b[^,]+\b/, "parameter"],
                [/[,]/, "delimiter"],
                [/\s+/, "white"],
            ],
        },
    });

    // 自定义语言 menuJSON（JSON）
    // 无需额外定义，Monaco 自带 JSON 语法高亮


    // 自定义语言 menuTSV（TSV）
    monacoInstance.languages.register({id: "menuTSV"});
    monacoInstance.languages.setMonarchTokensProvider("menuTSV", {
        tokenizer: {
            root: [
                [/^[^\t]+(?=\t)/, "command"],
                [/\t/, "delimiter"],
                [/[^\t]+/, "parameter"],
                [/\s+/, "white"],
            ],
        },
    });
};

const defineMenuJsonSchema = (monacoInstance: any) => {
    monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
            {
                fileMatch: ["*"],
                schema: {
                    oneOf: [
                        // 完整 Menu 对象
                        {
                            type: "object",
                            properties: {
                                Signature: {type: "string", description: t('MenuEditor.file_header.Signature')},
                                BodySize: {type: "number", description: t('MenuEditor.file_header.BodySize')},
                                Version: {type: "number", description: t('MenuEditor.file_header.Version')},
                                SrcFileName: {type: "string", description: t('MenuEditor.file_header.SrcFileName_tip')},
                                ItemName: {type: "string", description: t('MenuEditor.file_header.ItemName_tip')},
                                Category: {type: "string", description: t('MenuEditor.file_header.Category_tip')},
                                InfoText: {type: "string", description: t('MenuEditor.file_header.SetInfoText_tip')},
                                Commands: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            Command: {type: "string", description: t('MenuEditor.Command')},
                                            Args: {
                                                anyOf: [
                                                    {
                                                        type: "array",
                                                        items: {type: "string"},
                                                        description: t('MenuEditor.Args')
                                                    },
                                                    {type: "null"}
                                                ]
                                            }
                                        },
                                        required: ["Command"],
                                        additionalProperties: true
                                    }
                                }
                            },
                            required: ["Signature", "BodySize", "Version", "SrcFileName", "ItemName", "Category", "InfoText", "Commands"],
                            additionalProperties: false
                        }
                    ]
                }
            }
        ]
    })
}


//注册 Hover 提示
const defineHoverProviders = (monacoInstance: any) => {
    ["menuTreeIndent", "menuColonSplit", "json", "menuTSV"].forEach((language) => {
        monacoInstance.languages.registerHoverProvider(language, {
            provideHover: function (model: { getWordAtPosition: (arg0: any) => any; }, position: { lineNumber: any; }) {
                const word = model.getWordAtPosition(position);
                const menuCommandDocs = getMenuCommandDocs();
                if (word && menuCommandDocs[word.word]) {
                    return {
                        range: new monacoInstance.Range(
                            position.lineNumber,
                            word.startColumn,
                            position.lineNumber,
                            word.endColumn
                        ),
                        contents: [{value: `**${word.word}**\n\n${menuCommandDocs[word.word]}`}],
                    };
                }
                return null;
            },
        });
    });
};

// 定义编辑器主题 "menuTheme"
const defineTheme = (monacoInstance: any) => {
    monacoInstance.editor.defineTheme("menuTheme", {
        base: "vs",
        inherit: true,
        colors: {
            "editor.foreground": "#000000",
            "editor.background": "#FFFFFF",
        },
        rules: [
            {token: "command", foreground: "#A31515", fontStyle: "bold"},
            {token: "parameter", foreground: "#0451A5"},
            {token: "delimiter", foreground: "#7B3814"},
        ],
    });

    monacoInstance.editor.defineTheme("menuTheme-dark", {
        base: "vs-dark",
        inherit: true,
        colors: {
            "editor.foreground": "#D4D4D4",
            "editor.background": "#1E1E1E",
        },
        rules: [
            {token: "command", foreground: "#CE9178", fontStyle: "bold"},
            {token: "parameter", foreground: "#9CDCFE"},
            {token: "delimiter", foreground: "#F8F8F8"},
        ],
    });
};


function customShortcut(monacoInstance: any) {
    // 注册删除行命令
    monacoInstance.editor.registerCommand('deleteLine', (/* accessor */) => {
        const editors = monacoInstance.editor.getEditors();
        if (!editors || editors.length === 0) {
            return;
        }

        const editor = editors.find((ed: any) => ed.hasWidgetFocus());
        if (!editor) {
            return;
        }

        const model = editor.getModel();
        const position = editor.getPosition();
        if (model && position) {
            const lineNumber = position.lineNumber;
            model.applyEdits([
                {
                    range: new monacoInstance.Range(
                        lineNumber,
                        1,
                        lineNumber,
                        model.getLineMaxColumn(lineNumber)
                    ),
                    text: null,
                    forceMoveMarkers: true,
                },
            ]);
        }
    });

    // ctrl+ w 注册为删除当前行
    monacoInstance.editor.addKeybindingRules([
        {
            keybinding: monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyW,
            command: 'deleteLine',
        },
    ]);
}


// 自动补全
const Autocomplete = (monacoInstance: any) => {
    // 给各个自定义语言注册自动补全，但是懒得做了只做 "menuTreeIndent"
    ["menuTreeIndent"].forEach((languageId) => {
        monacoInstance.languages.registerCompletionItemProvider(languageId, {
            // 触发字符，换行 / 制表符 / 空格 / 冒号
            triggerCharacters: [" ", "\t", ":"],
            provideCompletionItems(model: { getLineContent: (arg0: any) => any; }, position: { lineNumber: any; }) {
                const lineNumber = position.lineNumber;
                const lineContent = model.getLineContent(lineNumber);
                const suggestions: any[] = [];
                const menuCommandDocs = getMenuCommandDocs();

                // (A) 如果是在“命令名位置”，就提示所有已知命令 (menuCommandDocs 中的 key)
                if (shouldSuggestCommandName(lineContent)) {
                    Object.keys(menuCommandDocs).forEach((cmdKey) => {
                        suggestions.push({
                            label: cmdKey,
                            kind: monacoInstance.languages.CompletionItemKind.Keyword,
                            insertText: cmdKey,
                            documentation: menuCommandDocs[cmdKey],
                        });

                        // snippet 直接插入多行示例
                        suggestions.push({
                            label: `${cmdKey}` + "  (" + t('MenuEditor.snippet.pre_filled') + ")",
                            kind: monacoInstance.languages.CompletionItemKind.Snippet,
                            insertText: createSnippetForCommand(cmdKey),
                            insertTextRules:
                            monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: t('MenuEditor.snippet.pre_filled_tip'),
                        });
                    });
                } else {
                    // (B) 如果是在“命令参数位置”，根据命令名查找枚举并提示
                    const currentCmd = findCurrentCommandName(model, lineNumber);
                    if (currentCmd && enumMap[currentCmd]) {
                        const enumValues = enumMap[currentCmd];
                        enumValues.forEach((val) => {
                            suggestions.push({
                                label: val,
                                kind: monacoInstance.languages.CompletionItemKind.Enum,
                                insertText: val,
                                documentation: t(`MenuEditor.commands.${currentCmd}`),
                            });
                        });
                    }
                }

                return {suggestions};
            },
        });
    });
}


// 判断当前行是否应该提示“命令名”
function shouldSuggestCommandName(line: string): boolean {
    // 检查当前行是否没有缩进（即可能是命令行）
    return !line.startsWith('\t');
}


// 获取本行之前的命令名
function findCurrentCommandName(model: any, lineNumber: number): string | null {
    // 包含当前行向上查找
    for (let i = lineNumber; i >= 1; i--) {
        const rawContent = model.getLineContent(i); // 使用原始内容判断缩进

        // 精确匹配命令行特征：无缩进且包含有效命令
        if (rawContent.length > 0 && !rawContent.startsWith('\t')) {
            // 使用正则提取命令名（支持带空格的命令）
            const commandMatch = rawContent.match(/^([^\t:]+?)(\s|:|$)/);
            if (commandMatch) {
                return commandMatch[1].trim(); // 去除尾部可能存在的空格
            }
        }
    }
    return null;
}

// 用于生成 snippet
function createSnippetForCommand(cmdName: string): string {
    const commandSnippetMap = getCommandSnippetMap();

    // 根据命令名从 commandSnippetMap 取对应的参数列表
    const paramList = commandSnippetMap[cmdName];
    // 如果没定义任何参数，则只插入命令名
    if (!paramList) {
        return cmdName;
    }
    // 开始构造多行 snippet，逐行添加占位符
    // 形如： commandName\n\t${1:param1}\n\t${2:param2} ...
    let snippet = `${cmdName}\n`;
    paramList.forEach((paramName, index) => {
        snippet += `\t\${${index + 1}:${paramName}}\n`;
    });
    return snippet;
}


// 初始化 Monaco 编辑器，接受 beforeMount 调用
export const setupMonacoEditor = (monacoInstance: any) => {
    // 每次都注册，因为会被其他编辑器覆盖
    defineMenuJsonSchema(monacoInstance);

    // 只初始化一次，否则切换编辑器时会重复初始化，自动补全会出现多个选项
    if (initializedMonacoInstances.has(monacoInstance)) {
        return;
    }

    defineLanguages(monacoInstance);
    defineHoverProviders(monacoInstance);
    defineTheme(monacoInstance);
    customShortcut(monacoInstance);
    Autocomplete(monacoInstance);

    initializedMonacoInstances.set(monacoInstance, true);
};
