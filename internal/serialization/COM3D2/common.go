package COM3D2

import "hash/fnv"

const (
	MenuSignature = "CM3D2_MENU"
	MateSignature = "CM3D2_MATERIAL"
	PMatSignature = "CM3D2_PMATERIAL"
	endByte       = 0x00
	MateEndString = "end"
)

func GetStringHashInt32(s string) int32 {
	h := fnv.New32a()
	h.Write([]byte(s))
	return int32(h.Sum32()) // 强制转换为 int32，可能返回负数
}
