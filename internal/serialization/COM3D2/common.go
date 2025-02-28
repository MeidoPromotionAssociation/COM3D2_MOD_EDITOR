package COM3D2

const (
	MenuSignature = "CM3D2_MENU"
	MateSignature = "CM3D2_MATERIAL"
	PMatSignature = "CM3D2_PMATERIAL"
	ColSignature  = "CM3D21_COL"
	PhySignature  = "CM3D21_PHY"
	TexSignature  = "CM3D2_TEX"
	AnmSignature  = "CM3D2_ANIM"
	endByte       = 0x00
	MateEndString = "end"
)

// Keyframe 与 UnityEngine.Keyframe 对应
type Keyframe struct {
	Time       float32 `json:"Time"`
	Value      float32 `json:"Value"`
	InTangent  float32 `json:"InTangent"`
	OutTangent float32 `json:"OutTangent"`
}
