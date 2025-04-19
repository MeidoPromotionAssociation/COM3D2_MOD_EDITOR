package utilities

// BoolToByte 将bool转换为byte
// 如果 b 为 true，返回 1；否则返回 0。
func BoolToByte(b bool) byte {
	if b {
		return 1
	}
	return 0
}
