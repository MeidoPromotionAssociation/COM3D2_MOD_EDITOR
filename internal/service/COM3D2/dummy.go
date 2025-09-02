package COM3D2

import "github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"

// ColModel 用于让 wails 识别 col 对应结构体
type ColModel struct{}

// Dummy 用于让 wails 识别 col 对应结构体，需要在签名中使用所有结构体
func (s *ColModel) Dummy(COM3D2.Col, COM3D2.DynamicBoneColliderBase, COM3D2.DynamicBoneCollider, COM3D2.DynamicBoneMuneCollider, COM3D2.DynamicBonePlaneCollider, COM3D2.MissingCollider) {
}

// MateModel 用于让 wails 识别 mate 对应结构体
type MateModel struct{}

// Dummy 用于让 wails 识别 mate 对应结构体，需要在签名中使用所有结构体
func (s *MateModel) Dummy(COM3D2.Mate, COM3D2.Material, COM3D2.TexProperty, COM3D2.Tex2DSubProperty, COM3D2.TexRTSubProperty, COM3D2.ColProperty, COM3D2.VecProperty, COM3D2.FProperty, COM3D2.RangeProperty, COM3D2.TexOffsetProperty, COM3D2.TexScaleProperty, COM3D2.KeywordProperty, COM3D2.Keyword) {
}

// MenuModel 用于让 wails 识别 menu 对应结构体
type MenuModel struct{}

// Dummy 用于让 wails 识别 menu 对应结构体，需要在签名中使用所有结构体
func (s *MenuModel) Dummy(COM3D2.Menu, COM3D2.Command) {}

// PMatModel 用于让 wails 识别 pmat 对应结构体
type PMatModel struct{}

// Dummy 用于让 wails 识别 pmat 对应结构体，需要在签名中使用所有结构体
func (s *PMatModel) Dummy(COM3D2.PMat) {}

// PhyModel 用于让 wails 识别 phy 对应结构体
type PhyModel struct{}

// Dummy 用于让 wails 识别 phy 对应结构体，需要在签名中使用所有结构体
func (s *PhyModel) Dummy(COM3D2.Phy, COM3D2.AnimationCurve, COM3D2.Keyframe, COM3D2.BoneValue) {}

// PskModel 用于让 wails 识别 psk 对应结构体
type PskModel struct{}

// Dummy 用于让 wails 识别 psk 对应结构体，需要在签名中使用所有结构体
func (s *PskModel) Dummy(COM3D2.Psk, COM3D2.PanierRadiusGroup, COM3D2.AnimationCurve, COM3D2.Vector3) {
}

// TexModel 用于让 wails 识别 tex 对应结构体
type TexModel struct{}

// Dummy 用于让 wails 识别 tex 对应结构体，需要在签名中使用所有结构体
func (s *TexModel) Dummy(COM3D2.Tex, COM3D2.TexRect, CovertTexToImageResult) {}

// AnmModel 用于让 wails 识别 anm 对应结构体
type AnmModel struct{}

// Dummy 用于让 wails 识别 anm 对应结构体，需要在签名中使用所有结构体
func (s *AnmModel) Dummy(COM3D2.Anm, COM3D2.PropertyCurve, COM3D2.BoneCurveData, COM3D2.Keyframe) {}

type ModelModel struct{}

// Dummy 用于让 wails 识别 model 对应结构体，需要在签名中使用所有结构体
func (s *ModelModel) Dummy(COM3D2.Model, COM3D2.Bone, COM3D2.Vertex, COM3D2.Vertex, COM3D2.BoneWeight, COM3D2.Matrix4x4, COM3D2.MorphData, COM3D2.SkinThickness, COM3D2.ThickGroup, COM3D2.ThickPoint, COM3D2.ThickDefPerAngle, COM3D2.Vector2, COM3D2.Vector3, COM3D2.Quaternion, COM3D2.Material) {
}

type NeiModel struct{}

// Dummy 用于让 wails 识别 nei 对应结构体，需要在签名中使用所有结构体
func (s *NeiModel) Dummy(COM3D2.Nei) {}
