import {menuCommandDocs} from "./menuCommandDocs";


//any 不代表它真的是 any，只是引入类型会导致最终二进制文件变大 3MB

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

//注册 Hover 提示
const defineHoverProviders = (monacoInstance: any) => {
    ["menuTreeIndent", "menuColonSplit", "json", "menuTSV"].forEach((language) => {
        monacoInstance.languages.registerHoverProvider(language, {
            provideHover: function (model: { getWordAtPosition: (arg0: any) => any; }, position: { lineNumber: any; }) {
                const word = model.getWordAtPosition(position);
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
const defineTheme = (monacoInstance: any, isDarkMode: boolean) => {
    monacoInstance.editor.defineTheme("menuTheme", {
        base: isDarkMode ? "vs-dark" : "vs",
        inherit: true,
        colors: {
            "editor.foreground": isDarkMode ? "#D4D4D4" : "#000000",
            "editor.background": isDarkMode ? "#1E1E1E" : "#FFFFFF",
        },
        rules: [
            {token: "command", foreground: isDarkMode ? "#CE9178" : "#A31515", fontStyle: "bold"},
            {token: "parameter", foreground: isDarkMode ? "#9CDCFE" : "#0451A5"},
            {token: "delimiter", foreground: isDarkMode ? "#F8F8F8" : "#7B3814"},
        ],
    });
};


// 自动补全
const Autocomplete = (monacoInstance: any) => {
    // 1) 定义命令 -> 可选枚举列表的映射
    const enumMap: Record<string, string[]> = {
        "category": [
            "null_mpn", "MuneL", "MuneS", "MuneTare", "RegFat", "ArmL", "Hara", "RegMeet",
            "KubiScl", "UdeScl", "EyeScl", "EyeSclX", "EyeSclY", "EyePosX", "EyePosY",
            "EyeClose", "EyeBallPosX", "EyeBallPosY", "EyeBallSclX", "EyeBallSclY",
            "EarNone", "EarElf", "EarRot", "EarScl", "NosePos", "NoseScl", "FaceShape",
            "FaceShapeSlim", "MayuShapeIn", "MayuShapeOut", "MayuX", "MayuY", "MayuRot",
            "HeadX", "HeadY", "DouPer", "sintyou", "koshi", "kata", "west", "MuneUpDown",
            "MuneYori", "MuneYawaraka", "MayuThick", "MayuLong", "Yorime", "MabutaUpIn",
            "MabutaUpIn2", "MabutaUpMiddle", "MabutaUpOut", "MabutaUpOut2", "MabutaLowIn",
            "MabutaLowUpMiddle", "MabutaLowUpOut", "body", "moza", "head", "hairf",
            "hairr", "hairt", "hairs", "hairaho", "haircolor", "skin", "acctatoo",
            "accnail", "underhair", "hokuro", "mayu", "lip", "eye", "eye_hi", "eye_hi_r",
            "chikubi", "chikubicolor", "eyewhite", "nose", "facegloss", "matsuge_up",
            "matsuge_low", "futae", "wear", "skirt", "mizugi", "bra", "panz", "stkg",
            "shoes", "headset", "glove", "acchead", "accha", "acchana", "acckamisub",
            "acckami", "accmimi", "accnip", "acckubi", "acckubiwa", "accheso", "accude",
            "accashi", "accsenaka", "accshippo", "accanl", "accvag", "megane", "accxxx",
            "handitem", "acchat", "onepiece", "set_maidwear", "set_mywear",
            "set_underwear", "set_body", "set_head_slider", "folder_eye", "folder_mayu",
            "folder_underhair", "folder_skin", "folder_eyewhite", "folder_matsuge_up",
            "folder_matsuge_low", "folder_futae", "kousoku_upper", "kousoku_lower",
            "seieki_naka", "seieki_hara", "seieki_face", "seieki_mune", "seieki_hip",
            "seieki_ude", "seieki_ashi"
        ],
        "color_set": [
            "HAIR", "ACCESSORY", "DRESS",
        ],
        //TODO
    };

    // 2) 给各个自定义语言注册自动补全，但是懒得做了只做 "menuTreeIndent"
    ["menuTreeIndent"].forEach((languageId) => {
        monacoInstance.languages.registerCompletionItemProvider(languageId, {
            // 触发字符，换行 / 制表符 / 空格 / 冒号
            triggerCharacters: [" ", "\t", ":"],
            provideCompletionItems(model: { getLineContent: (arg0: any) => any; }, position: { lineNumber: any; }) {
                const lineNumber = position.lineNumber;
                const lineContent = model.getLineContent(lineNumber);
                const suggestions: any[] = [];

                // (A) 如果是在“命令名位置”，就提示所有已知命令 (menuCommandDocs 中的 key)
                if (shouldSuggestCommandName(lineContent)) {
                    console.log("命令位置", lineContent)
                    Object.keys(menuCommandDocs).forEach((cmdKey) => {
                        suggestions.push({
                            label: cmdKey,
                            kind: monacoInstance.languages.CompletionItemKind.Keyword,
                            insertText: cmdKey,
                            documentation: menuCommandDocs[cmdKey],
                        });

                        // snippet 直接插入多行示例
                        suggestions.push({
                            label: `${cmdKey} (snippet)`,
                            kind: monacoInstance.languages.CompletionItemKind.Snippet,
                            insertText: createSnippetForCommand(cmdKey),
                            insertTextRules:
                            monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: `Snippet: 多行插入，可带参占位符。`,
                        });
                    });
                } else {
                    console.log("参数位置", lineContent)
                    // (B) 如果是在“命令参数位置”，根据命令名查找枚举并提示
                    const currentCmd = findCurrentCommandName(model, lineNumber);
                    if (currentCmd && enumMap[currentCmd]) {
                        const enumValues = enumMap[currentCmd];
                        enumValues.forEach((val) => {
                            suggestions.push({
                                label: val,
                                kind: monacoInstance.languages.CompletionItemKind.Enum,
                                insertText: val,
                                documentation: `『${currentCmd}』可用枚举值`,
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
    console.log("shouldSuggestCommandName", line)
    // 如果是空行，就认为要提示命令名
    if (!line) {
        console.log("空行")
        return true;
    }

    return false;
}

// 获取本行之前的命令名
function findCurrentCommandName(model: any, lineNumber: number): string | null {
    // 往上找到上一行“没有缩进的行”当作命令名
    for (let i = lineNumber; i > 0; i--) {
        const content = model.getLineContent(i).trim();
        if (content && !content.startsWith("\t") && !content.includes(":")) {
            return content.split(/\s+/)[0]; // 可能就是命令名
        }
    }
    return null;
}

// 用于生成 snippet 的示例，这里简单做一个多行占位
function createSnippetForCommand(cmdName: string): string {
    const commandSnippetMap: Record<string, string[]> = {
        "category": ["MPN 枚举", "其他描述"],
        "color_set": ["MPN 枚举", "颜色值"],
        "additem": ["MPN 枚举", "模型文件", "attach", "附着点", "附着点名称"]
        //TODO
    };

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
export const setupMonacoEditor = (monacoInstance: any, isDarkMode: boolean) => {
    defineLanguages(monacoInstance);
    defineHoverProviders(monacoInstance);
    defineTheme(monacoInstance, isDarkMode);
    Autocomplete(monacoInstance);
};
