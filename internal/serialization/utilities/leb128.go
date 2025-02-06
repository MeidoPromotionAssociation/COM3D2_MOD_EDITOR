package utilities

import (
	"fmt"
	"io"
)

// ReadLEB128 读取一个变长 int，返回 int
func ReadLEB128(r io.Reader) (int, error) {
	var result int
	var shift uint
	for {
		b, err := ReadByte(r)
		if err != nil {
			return 0, err
		}
		// 低 7 位
		result |= int(b&0x7F) << shift
		// 如果最高位 0，则结束
		if (b & 0x80) == 0 {
			break
		}
		shift += 7
		if shift > 31 {
			return 0, fmt.Errorf("LEB128 too large for int32")
		}
	}
	return result, nil
}

// WriteLEB128 写一个变长 int
func WriteLEB128(w io.Writer, value int) error {
	// Go 不区分 int/int32，但此处与C#对应，假设在 int32 范围。
	uval := uint32(value)
	for {
		// 取低 7 位
		tmp := byte(uval & 0x7F)
		uval >>= 7
		// 后面还有非零？则设置最高位
		if uval != 0 {
			tmp |= 0x80
		}
		if err := WriteByte(w, tmp); err != nil {
			return err
		}
		if uval == 0 {
			break
		}
	}
	return nil
}

// LEB128SizeOfValue 根据 LEB128 的编码规则，计算给定整数 value 编码后占用的字节数。
// 这里假设 value 是一个非负整数。
func LEB128SizeOfValue(value int) int {
	count := 0
	for {
		count++
		// 如果 value 小于 0x80，则本次循环即可结束
		if value < 0x80 {
			break
		}
		value >>= 7
	}
	return count
}
