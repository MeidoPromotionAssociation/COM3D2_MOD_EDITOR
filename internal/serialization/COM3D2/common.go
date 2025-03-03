package COM3D2

const (
	MenuSignature = "CM3D2_MENU"
	MenuVersion   = 1000
	MateSignature = "CM3D2_MATERIAL"
	MateVersion   = 2001
	PMatSignature = "CM3D2_PMATERIAL"
	PMatVersion   = 1000
	ColSignature  = "CM3D21_COL"
	ColVersion    = 24102
	PhySignature  = "CM3D21_PHY"
	PhyVersion    = 24102
	TexSignature  = "CM3D2_TEX"
	TexVersion    = 1010
	AnmSignature  = "CM3D2_ANIM"
	AnmVersion    = 1001
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
