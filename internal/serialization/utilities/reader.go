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

// ReadInt32 读取 4 字节（little-endian）
func ReadInt32(r io.Reader) (int32, error) {
	var buf [4]byte
	_, err := io.ReadFull(r, buf[:])
	if err != nil {
		return 0, err
	}
	return int32(binary.LittleEndian.Uint32(buf[:])), nil
}

// ReadFloat32 从 r 中读取 4 个字节，以 little-endian 解码成 float32
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
func PeekString(r io.Reader) (string, error) {
	// 必须是一个支持 Peek 的 bufio.Reader 或类似接口。
	br, ok := r.(interface {
		Peek(int) ([]byte, error)
	})
	if !ok {
		return "", errors.New("PeekString: the reader is not peekable (not *bufio.Reader)")
	}

	// 一次 peek 大块数据（例如 64 KB），假设可涵盖后续解析
	// 如果字符串非常大，这里可能不够，你可以视情况改大一些。
	const peekSize = 64 * 1024
	buf, err := br.Peek(peekSize)
	if err != nil {
		// 如果仅仅因为底层数据不够 64K, 但足以解析字符串，也可能会返回错误
		// 这里可以判断 err == bufio.ErrBufferFull 再继续处理，但示例就不展开了
		return "", fmt.Errorf("PeekString: peek error: %w", err)
	}

	// 解码出 LEB128（字符串长度）
	length, usedBytes, err := decodeLEB128FromBytes(buf)
	if err != nil {
		return "", fmt.Errorf("PeekString: decode LEB128 failed: %w", err)
	}
	if length < 0 {
		return "", fmt.Errorf("PeekString: invalid string length: %d", length)
	}

	// 检查剩余空间是否足够拿到完整字符串
	if usedBytes+length > len(buf) {
		return "", fmt.Errorf("PeekString: not enough peeked data for the entire string (need %d, got %d)",
			usedBytes+length, len(buf))
	}

	// 从 buf 中切出字符串对应的部分
	str := string(buf[usedBytes : usedBytes+length])

	// 此时我们并没有 discard 这段数据，下次真正读时还能继续读到它
	return str, nil
}

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

// -------------------- Float2 / Float3 / Float4 / Float4x4 --------------------

func readFloat2(r io.Reader) ([2]float32, error) {
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

func readFloat3(r io.Reader) ([3]float32, error) {
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

func readFloat4(r io.Reader) ([4]float32, error) {
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
