package COM3D2

import "COM3D2_MOD_EDITOR_V2/internal/serialization/COM3D2"

// ColModel 用于让 wails 识别 col 对应结构体
type ColModel struct{}

// Dummy 用于让 wails 识别 col 对应结构体，需要在签名中使用所有结构体
func (s *ColModel) Dummy(COM3D2.Col, COM3D2.DynamicBoneColliderBase, COM3D2.DynamicBoneCollider, COM3D2.DynamicBoneMuneCollider, COM3D2.DynamicBonePlaneCollider, COM3D2.MissingCollider) {
}

// MateModel 用于让 wails 识别 mate 对应结构体
type MateModel struct{}

// Dummy 用于让 wails 识别 mate 对应结构体，需要在签名中使用所有结构体
func (s *MateModel) Dummy(COM3D2.Mate, COM3D2.Material, COM3D2.TexProperty, COM3D2.Tex2DSubProperty, COM3D2.TexRTSubProperty, COM3D2.ColProperty, COM3D2.VecProperty, COM3D2.FProperty) {
}

// MenuModel 用于让 wails 识别 menu 对应结构体
type MenuModel struct{}

// Dummy 用于让 wails 识别 menu 对应结构体，需要在签名中使用所有结构体
func (s *MenuModel) Dummy(COM3D2.Menu, COM3D2.Command) {}

// PMatModel 用于让 wails 识别 pmat 对应结构体
type PMatModel struct{}

// Dummy 用于让 wails 识别 pmat 对应结构体，需要在签名中使用所有结构体
func (s *PMatModel) Dummy(COM3D2.PMat) {}
