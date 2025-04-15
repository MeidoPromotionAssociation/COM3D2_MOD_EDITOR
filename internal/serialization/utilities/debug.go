package utilities

import "io"

// GetReaderPos 获取 io.Reader 的当前位置。
// 如果 io.Reader 支持 Seek，返回当前位置。
// 如果不支持 Seek，返回 -1, false。
func GetReaderPos(r io.Reader) (int64, bool) {
	if seeker, ok := r.(io.Seeker); ok {
		pos, err := seeker.Seek(0, io.SeekCurrent)
		if err == nil {
			return pos, true
		}
	}
	return -1, false
}

// GetPos 获取 io.Reader 的当前位置。
// 如果 io.Reader 支持 Seek，返回当前位置。
// 如果不支持 Seek，返回 -1。
func GetPos(r io.Reader) int64 {
	if pos, ok := GetReaderPos(r); ok {
		return pos
	}
	return -1
}
