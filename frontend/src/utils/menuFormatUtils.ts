// menuFormatUtils.ts
export interface AttrsDict {
    [key: string]: string[][];

    // key -> list of list-of-string
}

// 把 attrs 转成 "format1"
export function attrsToTextFormat1(attrs: AttrsDict): string {
    const lines: string[] = []
    for (const key of Object.keys(attrs)) {
        const listOfValLists = attrs[key]
        for (const valList of listOfValLists) {
            lines.push(key)
            for (const val of valList) {
                lines.push("\t" + val)
            }
            lines.push("") // 空行分隔
        }
    }
    return lines.join("\n").trim()
}

// 把 attrs 转成 "format2"
export function attrsToTextFormat2(attrs: AttrsDict): string {
    const lines: string[] = []
    for (const key of Object.keys(attrs)) {
        const listOfValLists = attrs[key]
        for (const valList of listOfValLists) {
            if (valList.length > 0) {
                const joined = valList.join(", ")
                lines.push(`${key}: ${joined}`)
            } else {
                lines.push(`${key}: `)
            }
        }
    }
    return lines.join("\n")
}

// 解析 "format1"
export function parseTextAsFormat1(text: string): AttrsDict {
    const lines = text.split(/\r?\n/)
    const attrs: AttrsDict = {}
    let currentKey: string | null = null
    let currentValues: string[] = []

    function commitKey(k: string | null, vals: string[]) {
        if (k !== null) {
            if (!attrs[k]) {
                attrs[k] = []
            }
            attrs[k].push(vals)
        }
    }

    for (let line of lines) {
        line = line.replace(/\r$/, "")
        if (!line.trim()) {
            // 空行 => 结束一组
            if (currentKey !== null) {
                commitKey(currentKey, currentValues)
                currentKey = null
                currentValues = []
            }
            continue
        }

        if (line.startsWith("\t")) {
            currentValues.push(line.trim())
        } else {
            if (currentKey !== null) {
                commitKey(currentKey, currentValues)
            }
            currentKey = line.trim()
            currentValues = []
        }
    }
    if (currentKey !== null) {
        commitKey(currentKey, currentValues)
    }
    return attrs
}

// 解析 "format2"
export function parseTextAsFormat2(text: string): AttrsDict {
    const lines = text.split(/\r?\n/)
    const attrs: AttrsDict = {}
    for (let line of lines) {
        line = line.trim()
        if (!line) continue
        const idx = line.indexOf(":")
        if (idx < 0) {
            continue
        }
        const keyPart = line.substring(0, idx).trim()
        const valPart = line.substring(idx + 1).trim()
        let valList: string[] = []
        if (valPart.length > 0) {
            valList = valPart.split(",").map(s => s.trim())
        }
        if (!attrs[keyPart]) {
            attrs[keyPart] = []
        }
        attrs[keyPart].push(valList)
    }
    return attrs
}
