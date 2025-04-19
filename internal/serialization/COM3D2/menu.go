package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/utilities"
	"fmt"
	"io"
)

// CM3D2_MENU
// 无版本差异

// Menu 对应 .menu 文件的结构
type Menu struct {
	Signature   string    `json:"Signature"` // "CM3D2_MENU"
	Version     int32     `json:"Version"`
	SrcFileName string    `json:"SrcFileName"`
	ItemName    string    `json:"ItemName"`
	Category    string    `json:"Category"`
	InfoText    string    `json:"InfoText"`
	BodySize    int32     `json:"BodySize"`
	Commands    []Command `json:"Commands"`
}

// Command 对应 .menu 中的命令
type Command struct {
	ArgCount byte     `json:"ArgCount"`
	Args     []string `json:"Args"`
}

// ReadMenu 从 r 中读取一个 .menu 文件结构
func ReadMenu(r io.Reader) (*Menu, error) {
	m := &Menu{}

	// 1. Signature
	sig, err := utilities.ReadString(r) // LEB128 + UTF8
	if err != nil {
		return nil, err
	}
	//if sig != MenuSignature {
	//	return nil, fmt.Errorf("invalid signature, got %q, want %s", sig, MenuSignature)
	//}
	m.Signature = sig

	// 2. Version (4 bytes little-endian)
	ver, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("read version failed: %w", err)
	}
	m.Version = ver

	// 3. SrcFileName (string)
	src, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read srcFileName failed: %w", err)
	}
	m.SrcFileName = src

	// 4. ItemName
	itemName, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read itemName failed: %w", err)
	}
	m.ItemName = itemName

	// 5. Category
	cat, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read category failed: %w", err)
	}
	m.Category = cat

	// 6. InfoText
	infoText, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read infoText failed: %w", err)
	}
	m.InfoText = infoText

	// 7. BodySize
	bodySize, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("read bodySize failed: %w", err)
	}
	m.BodySize = bodySize

	// 8. Commands, until we see a 0 byte
	for {
		peek, err := utilities.PeekByte(r)
		if err != nil {
			return nil, fmt.Errorf("peek command argCount failed: %w", err)
		}
		if peek == 0 {
			// 说明后面是 endByte=0
			break
		}
		// read a new Command
		var cmd Command
		ac, err := utilities.ReadByte(r)
		if err != nil {
			return nil, fmt.Errorf("read command.argCount failed: %w", err)
		}
		cmd.ArgCount = ac
		cmd.Args = make([]string, ac)
		for i := 0; i < int(ac); i++ {
			arg, err := utilities.ReadString(r)
			if err != nil {
				return nil, fmt.Errorf("read command arg failed: %w", err)
			}
			cmd.Args[i] = arg
		}
		m.Commands = append(m.Commands, cmd)
	}

	// 9. endByte = 0
	endB, err := utilities.ReadByte(r)
	if err != nil {
		return nil, fmt.Errorf("read endByte failed: %w", err)
	}
	if endB != endByte {
		return nil, fmt.Errorf("expected endByte=0 but got %d", endB)
	}

	return m, nil
}

// Dump 把 Menu 写出到 w 中
func (m *Menu) Dump(w io.Writer) error {
	m.UpdateBodySize()

	// 1. Signature
	if err := utilities.WriteString(w, m.Signature); err != nil {
		return fmt.Errorf("write signature failed: %w", err)
	}

	// 2. Version
	if err := utilities.WriteInt32(w, m.Version); err != nil {
		return fmt.Errorf("write version failed: %w", err)
	}

	// 3. SrcFileName
	if err := utilities.WriteString(w, m.SrcFileName); err != nil {
		return fmt.Errorf("write srcFileName failed: %w", err)
	}

	// 4. ItemName
	if err := utilities.WriteString(w, m.ItemName); err != nil {
		return fmt.Errorf("write itemName failed: %w", err)
	}

	// 5. Category
	if err := utilities.WriteString(w, m.Category); err != nil {
		return fmt.Errorf("write category failed: %w", err)
	}

	// 6. InfoText
	if err := utilities.WriteString(w, m.InfoText); err != nil {
		return fmt.Errorf("write infoText failed: %w", err)
	}

	// 7. BodySize
	if err := utilities.WriteInt32(w, m.BodySize); err != nil {
		return fmt.Errorf("write bodySize failed: %w", err)
	}

	// 8. 写入 Commands
	for _, cmd := range m.Commands {
		if len(cmd.Args) == 0 || len(cmd.Args) > 255 {
			return fmt.Errorf("command %v has invalid arg count=%d", cmd.Args, len(cmd.Args))
		}
		// ArgCount
		if err := utilities.WriteByte(w, cmd.ArgCount); err != nil {
			return fmt.Errorf("write command argCount failed: %w", err)
		}
		// Args
		for _, arg := range cmd.Args {
			if err := utilities.WriteString(w, arg); err != nil {
				return fmt.Errorf("write command arg failed: %w", err)
			}
		}
	}

	// 9. 写一个 0 byte 结束
	if err := utilities.WriteByte(w, endByte); err != nil {
		return fmt.Errorf("write endByte=0 failed: %w", err)
	}
	return nil
}

// UpdateBodySize 根据当前的 Commands 列表计算 BodySize。
//   - 每个命令占用 1 字节记录 ArgCount。
//   - 对于每个字符串参数，先计算其 UTF-8 编码后字节数 encodedLength，然后
//     加上 LEB128 编码 encodedLength 所需的字节数，再加上 encodedLength 本身。
//   - 最后再加上 1 个字节的结束标志。
func (m *Menu) UpdateBodySize() {
	var sum int32 = 0

	for _, cmd := range m.Commands {
		// 1. 写入 ArgCount (1 字节)
		sum += 1

		// 2. 遍历每个参数
		for _, arg := range cmd.Args {
			// Go 的字符串底层就是 UTF-8 编码，len(arg) 返回字节数
			encodedLength := len(arg)
			// 计算 encodedLength 对应的 LEB128 编码所占字节数
			lebSize := utilities.LEB128SizeOfValue(encodedLength)
			sum += int32(lebSize)
			// 加上字符串的实际字节数
			sum += int32(encodedLength)
		}
	}

	// 3. 结束标志 0 字节
	sum += 1

	m.BodySize = sum
}
