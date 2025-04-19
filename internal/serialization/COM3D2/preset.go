package COM3D2

// 预设类型常量
const (
	Wear = 0 // 穿戴
	Body = 1 // 身体
	All  = 2 // 全部
)

// Preset 表示角色预设数据
type Preset struct {
	Signature      string         // "CM3D2_PRESET"
	Version        int32          // 版本号
	PresetType     int32          // 预设类型：0=穿戴, 1=身体, 2=全部
	ThumbLength    int32          // 略缩图数据长度
	ThumbData      []byte         // 略缩图数据，PNG格式
	PresetProperty PresetProperty // 预设属性列表
	MultiColor     MultiColor     // 颜色设置
	BodyProperty   BodyProperty   // 身体属性
}

// PresetProperty 表示预设属性列表
type PresetProperty struct {
	Signature string          // "CM3D2_MPROP_LIST"
	Version   int32           // 版本号
	Count     int32           // 属性数量
	Props     map[string]Prop // 属性映射表
}

// Prop 表示单个属性
type Prop struct {
	Signature       string                          // "CM3D2_MPROP"
	Version         int32                           // 版本号
	Index           int32                           // 索引
	Name            string                          // 名称
	Type            int32                           // 类型
	DefaultValue    int32                           // 默认值
	Value           int32                           // 当前值
	TempValue       int32                           // 临时值
	LinkMaxValue    int32                           // 链接最大值
	FileName        string                          // 文件名
	FileNameRID     int32                           // 文件名哈希值
	IsDut           bool                            // 是否使用
	Max             int32                           // 最大值
	Min             int32                           // 最小值
	SubProps        []SubProp                       // 子属性列表
	SkinPositions   map[int]BoneAttachPos           // 皮肤位置
	AttachPositions map[int]map[string]VtxAttachPos // 附件位置
	MaterialProps   map[int]MatPropSave             // 材质属性
	BoneLengths     map[int]map[string]float32      // 骨骼长度
}

// SubProp 表示子属性
type SubProp struct {
	IsDut       bool    // 是否使用
	FileName    string  // 文件名
	FileNameRID int32   // 文件名哈希值
	TexMulAlpha float32 // 纹理乘法透明度
}

// BoneAttachPos 表示骨骼附着位置
type BoneAttachPos struct {
	Enable bool        // 是否启用
	Pss    PosRotScale // 位置、旋转、缩放
}

// VtxAttachPos 表示顶点附着位置
type VtxAttachPos struct {
	Enable   bool        // 是否启用
	VtxCount int32       // 顶点数量
	VtxIdx   int32       // 顶点索引
	Prs      PosRotScale // 位置、旋转、缩放
}

// PosRotScale 表示位置、旋转、缩放信息
type PosRotScale struct {
	Position Vector3    // 位置
	Rotation Quaternion // 旋转
	Scale    Vector3    // 缩放
}

// MatPropSave 表示材质属性保存
type MatPropSave struct {
	MatNo    int32  // 材质编号
	PropName string // 属性名称
	TypeName string // 类型名称
	Value    string // 属性值
}

// MultiColor 表示多颜色设置
type MultiColor struct {
	Signature string       // "CM3D2_MULTI_COL"
	Version   int32        // 版本号
	Count     int32        // 颜色数量
	Colors    []PartsColor // 颜色列表
}

// PartsColor 表示部件颜色
type PartsColor struct {
	IsUse            bool  // 是否使用
	MainHue          int32 // 主色相
	MainChroma       int32 // 主色度
	MainBrightness   int32 // 主亮度
	MainContrast     int32 // 主对比度
	ShadowRate       int32 // 阴影比例
	ShadowHue        int32 // 阴影色相
	ShadowChroma     int32 // 阴影色度
	ShadowBrightness int32 // 阴影亮度
	ShadowContrast   int32 // 阴影对比度
}

// BodyProperty 表示身体属性
type BodyProperty struct {
	Signature string // "CM3D2_MAID_BODY"
	Version   int32  // 版本号
	// 是的确实没有别的东西
}
