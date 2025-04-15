package utilities

import (
	"encoding/binary"
	"fmt"
	"io"
	"math"
)

// WriteByte 写单字节
func WriteByte(w io.Writer, b byte) error {
	_, err := w.Write([]byte{b})
	return err
}

// WriteInt32 写一个 4 字节 int32（little-endian）
func WriteInt32(w io.Writer, v int32) error {
	var buf [4]byte
	binary.LittleEndian.PutUint32(buf[:], uint32(v))
	_, err := w.Write(buf[:])
	return err
}

// WriteUInt16 写入一个16位无符号整数(little-endian)
func WriteUInt16(w io.Writer, val uint16) error {
	var buf [2]byte
	binary.LittleEndian.PutUint16(buf[:], val)
	_, err := w.Write(buf[:])
	return err
}

// WriteFloat32 写一个 float32 (4 bytes, little-endian)
// 在 C# 中是 BinaryWriter.WriteSingle
func WriteFloat32(w io.Writer, val float32) error {
	var buf [4]byte
	bits := math.Float32bits(val)
	binary.LittleEndian.PutUint32(buf[:], bits)
	_, err := w.Write(buf[:])
	return err
}

// WriteString 先写字符串长度(LEB128)，再写 UTF8 字节
func WriteString(w io.Writer, s string) error {
	length := len(s)
	if err := WriteLEB128(w, length); err != nil {
		return fmt.Errorf("write string length failed: %w", err)
	}
	if length > 0 {
		_, err := w.Write([]byte(s))
		if err != nil {
			return fmt.Errorf("write string content failed: %w", err)
		}
	}
	return nil
}

// WriteBool 写一个字节，如果 b 为 true 则写入 1，否则写入 0
func WriteBool(w io.Writer, v bool) error {
	var b byte
	if v {
		b = 1
	}
	return WriteByte(w, b)
}

// -------------------- Float2 / Float3 / Float4 / Float4x4 --------------------

func WriteFloat2(w io.Writer, arr [2]float32) error {
	for i := 0; i < 2; i++ {
		if err := WriteFloat32(w, arr[i]); err != nil {
			return err
		}
	}
	return nil
}

func WriteFloat3(w io.Writer, arr [3]float32) error {
	for i := 0; i < 3; i++ {
		if err := WriteFloat32(w, arr[i]); err != nil {
			return err
		}
	}
	return nil
}

func WriteFloat4(w io.Writer, arr [4]float32) error {
	for i := 0; i < 4; i++ {
		if err := WriteFloat32(w, arr[i]); err != nil {
			return err
		}
	}
	return nil
}

func WriteFloat4x4(w io.Writer, arr [16]float32) error {
	for i := 0; i < 16; i++ {
		if err := WriteFloat32(w, arr[i]); err != nil {
			return err
		}
	}
	return nil
}
