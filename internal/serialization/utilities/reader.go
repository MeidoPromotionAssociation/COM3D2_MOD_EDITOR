package utilities

import (
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"math"
)

// ReadByte 读 1 字节
func ReadByte(r io.Reader) (byte, error) {
	var b [1]byte
	_, err := io.ReadFull(r, b[:])
	if err != nil {
		return 0, err
	}
	return b[0], nil
}

// ReadInt32 读取 4 字节 int32（little-endian）
func ReadInt32(r io.Reader) (int32, error) {
	var buf [4]byte
	_, err := io.ReadFull(r, buf[:])
	if err != nil {
		return 0, err
	}
	return int32(binary.LittleEndian.Uint32(buf[:])), nil
}

// ReadUInt16 读取 2 字节无符号整数 (little-endian)
func ReadUInt16(r io.Reader) (uint16, error) {
	var buf [2]byte
	_, err := io.ReadFull(r, buf[:])
	if err != nil {
		return 0, err
	}
	return binary.LittleEndian.Uint16(buf[:]), nil
}

// ReadFloat32 从 r 中读取 4 个字节，以 little-endian 解码成 float32
// 在 C# 中是 BinaryReader.ReadSingle
func ReadFloat32(r io.Reader) (float32, error) {
	var buf [4]byte
	_, err := io.ReadFull(r, buf[:])
	if err != nil {
		return 0, err
	}
	bits := binary.LittleEndian.Uint32(buf[:])
	return math.Float32frombits(bits), nil
}

// ReadString 先读一个 LEB128 长度，再读相应字节的 UTF-8
func ReadString(r io.Reader) (string, error) {
	length, err := ReadLEB128(r)
	if err != nil {
		return "", fmt.Errorf("read string length failed: %w", err)
	}
	if length < 0 {
		return "", fmt.Errorf("invalid string length: %d", length)
	}
	data := make([]byte, length)
	_, err = io.ReadFull(r, data)
	if err != nil {
		return "", fmt.Errorf("read string bytes failed: %w", err)
	}
	return string(data), nil
}

// ReadBool 读取一个字节，返回 bool，如果字节非 0 则返回 true，否则返回 false
// 对应 C# 中的 BinaryReader.ReadBoolean
func ReadBool(r io.Reader) (bool, error) {
	b, err := ReadByte(r)
	if err != nil {
		return false, fmt.Errorf("read bool failed: %w", err)
	}
	return b != 0, nil
}

// -------------------- Float2 / Float3 / Float4 / Float4x4 --------------------

func ReadFloat2(r io.Reader) ([2]float32, error) {
	var arr [2]float32
	for i := 0; i < 2; i++ {
		f, err := ReadFloat32(r)
		if err != nil {
			return arr, err
		}
		arr[i] = f
	}
	return arr, nil
}

func ReadFloat3(r io.Reader) ([3]float32, error) {
	var arr [3]float32
	for i := 0; i < 3; i++ {
		f, err := ReadFloat32(r)
		if err != nil {
			return arr, err
		}
		arr[i] = f
	}
	return arr, nil
}

func ReadFloat4(r io.Reader) ([4]float32, error) {
	var arr [4]float32
	for i := 0; i < 4; i++ {
		f, err := ReadFloat32(r)
		if err != nil {
			return arr, err
		}
		arr[i] = f
	}
	return arr, nil
}

func ReadFloat4x4(r io.Reader) ([16]float32, error) {
	var arr [16]float32
	for i := 0; i < 16; i++ {
		f, err := ReadFloat32(r)
		if err != nil {
			return arr, err
		}
		arr[i] = f
	}
	return arr, nil
}

// -------------------- Peek --------------------

// PeekByte 偷看下一个字节，不移动读取指针。
// 这里需要一个带缓冲、可 Peek 的包装，如 bufio.Reader。
func PeekByte(r io.Reader) (byte, error) {
	br, ok := r.(interface {
		Peek(int) ([]byte, error)
	})
	if !ok {
		// 如果没有实现 Peek，需要自己封装一个 bufio.Reader
		return 0, fmt.Errorf("PeekByte: the reader is not peekable, wrap it with bufio.Reader first")
	}
	bytes, err := br.Peek(1)
	if err != nil {
		return 0, err
	}
	return bytes[0], nil
}

// PeekString 读取下一个字符串（LEB128 + UTF-8），但不消耗它。
// 因此下次再从同一个 reader 中读取时，会得到相同的数据。
func PeekString(rs io.ReadSeeker) (string, error) {
	// 记录当前指针
	startPos, err := rs.Seek(0, io.SeekCurrent)
	if err != nil {
		return "", err
	}

	// 尝试读取字符串
	str, err := ReadString(rs)
	if err != nil {
		// 如果出错了也回退
		_, _ = rs.Seek(startPos, io.SeekStart)
		return "", err
	}

	fmt.Printf("PeekString str: %s\n", str)

	// 读完后回退到之前的位置
	_, err = rs.Seek(startPos, io.SeekStart)
	if err != nil {
		return "", err
	}

	return str, nil
}

// -------------------- Decode --------------------

// decodeLEB128FromBytes 尝试从 buf 开头解出一个 LEB128 整数，
// 返回解析出来的数值 value，使用了多少字节 used，以及错误 err。
func decodeLEB128FromBytes(buf []byte) (value int, used int, err error) {
	var shift uint
	used = 0
	value = 0

	for {
		if used >= len(buf) {
			return 0, used, io.ErrUnexpectedEOF
		}
		b := buf[used]
		used++

		value |= int(b&0x7F) << shift
		if (b & 0x80) == 0 {
			// 最高位 0，结束
			break
		}
		shift += 7
		if shift > 31 {
			return 0, used, errors.New("decodeLEB128: too large for int32")
		}
	}
	return value, used, nil
}
