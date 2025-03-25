package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/utilities"
	"encoding/json"
	"fmt"
	"io"
)

// -------------------------------------------------------
// 定义 Col (ColliderFile) 的数据结构
// -------------------------------------------------------

type Col struct {
	Signature string      `json:"Signature"` // "CM3D21_COL"
	Version   int32       `json:"Version"`   // 24201 这个版本每次更新都会更改，但无结构更改
	Colliders []ICollider `json:"Colliders"` // 碰撞器列表
}

// -------------------------------------------------------
// 读取 Col
// -------------------------------------------------------

// ReadCol 从二进制流里读取一个 Col
func ReadCol(r io.Reader) (*Col, error) {
	file := &Col{}

	// 1. Signature
	sig, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read signature failed: %w", err)
	}
	//if sig != ColSignature {
	//	return nil, fmt.Errorf("invalid col signature, want %v, got %s", ColSignature, sig)
	//}
	file.Signature = sig

	// 2. Version
	ver, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("read version failed: %w", err)
	}
	file.Version = ver

	// 3. Collider count
	count, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("read collider count failed: %w", err)
	}

	// 4. 逐个读取 Collider
	file.Colliders = make([]ICollider, 0, count)
	for i := 0; i < int(count); i++ {
		typeName, err := utilities.ReadString(r)
		if err != nil {
			return nil, fmt.Errorf("read collider type string failed at index %d: %w", i, err)
		}

		var collider ICollider
		switch typeName {
		case "dbc":
			collider = &DynamicBoneCollider{}
		case "dpc":
			collider = &DynamicBonePlaneCollider{}
		case "dbm":
			collider = &DynamicBoneMuneCollider{}
		case "missing":
			collider = &MissingCollider{}
		default:
			return nil, fmt.Errorf("unrecognized collider type %q at index %d", typeName, i)
		}

		if err := collider.Read(r, ver); err != nil {
			return nil, fmt.Errorf("collider.Read failed at index %d: %w", i, err)
		}
		file.Colliders = append(file.Colliders, collider)
	}

	return file, nil
}

// -------------------------------------------------------
// 写出 Col
// -------------------------------------------------------

// Dump 把 Col 写出到 w 中
func (c *Col) Dump(w io.Writer) error {
	// 1. 写 Signature
	if err := utilities.WriteString(w, c.Signature); err != nil {
		return fmt.Errorf("write signature failed: %w", err)
	}
	// 2. 写 Version
	if err := utilities.WriteInt32(w, c.Version); err != nil {
		return fmt.Errorf("write version failed: %w", err)
	}
	// 3. 写 Collider count
	count := int32(len(c.Colliders))
	if err := utilities.WriteInt32(w, count); err != nil {
		return fmt.Errorf("write collider count failed: %w", err)
	}
	// 4. 遍历写出每个 collider
	for i, collider := range c.Colliders {
		typeName := collider.GetTypeName()
		// 先写 typeName
		if err := utilities.WriteString(w, typeName); err != nil {
			return fmt.Errorf("write collider type failed at index %d: %w", i, err)
		}
		// 写具体数据
		if err := collider.Write(w, c.Version); err != nil {
			return fmt.Errorf("collider.Write failed at index %d: %w", i, err)
		}
	}
	return nil
}

// ICollider 是所有Collider的接口，不同具体类型各自实现。
// 注意在每个 struct 中保存 TypeName 是故意的，否则前端类型推断困难
type ICollider interface {
	GetTypeName() string
	Read(r io.Reader, version int32) error
	Write(w io.Writer, version int32) error
}

// -------------------------------------------------------
// Collider 类型
// -------------------------------------------------------

// DynamicBoneColliderBase 基类
type DynamicBoneColliderBase struct {
	TypeName      string     `json:"TypeName"  default:"base"` // 碰撞器类型，仅标记，不序列化 "base"
	ParentName    string     `json:"ParentName"`               // 父级 Transform （骨骼）名称
	SelfName      string     `json:"SelfName"`                 // 当前 Transform 名称
	LocalPosition [3]float32 `json:"LocalPosition"`            // 局部坐标系中的位置 (x,y,z)
	LocalRotation [4]float32 `json:"LocalRotation"`            // 局部坐标系中的旋转 (四元数)
	LocalScale    [3]float32 `json:"LocalScale"`               // 局部坐标系中的缩放 (x,y,z)

	Direction int32      `json:"Direction"` // 碰撞体方向，指定哪一个轴是胶囊碰撞器的高(0=x, 1=y, 2=z)
	Center    [3]float32 `json:"Center"`    // 碰撞体中心偏移
	Bound     int32      `json:"Bound"`     // 碰撞约束边界类型 (0=Outside, 1=Inside)
}

func (base *DynamicBoneColliderBase) GetTypeName() string {
	return "base" // not in C#
}

func (base *DynamicBoneColliderBase) Read(r io.Reader, version int32) error {
	base.TypeName = base.GetTypeName()

	var err error

	// 1. ParentName
	base.ParentName, err = utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("read parentName failed: %w", err)
	}

	// 2. SelfName
	base.SelfName, err = utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("read selfName failed: %w", err)
	}

	// 3. localPosition
	for i := 0; i < 3; i++ {
		base.LocalPosition[i], err = utilities.ReadFloat32(r)
		if err != nil {
			return fmt.Errorf("read localPosition[%d] failed: %w", i, err)
		}
	}

	// 4. localRotation
	for i := 0; i < 4; i++ {
		base.LocalRotation[i], err = utilities.ReadFloat32(r)
		if err != nil {
			return fmt.Errorf("read localRotation[%d] failed: %w", i, err)
		}
	}

	// 5. localScale
	for i := 0; i < 3; i++ {
		base.LocalScale[i], err = utilities.ReadFloat32(r)
		if err != nil {
			return fmt.Errorf("read localScale[%d] failed: %w", i, err)
		}
	}

	// 6. Direction
	base.Direction, err = utilities.ReadInt32(r)
	if err != nil {
		return fmt.Errorf("read direction failed: %w", err)
	}

	// 7. Center (x,y,z)
	for i := 0; i < 3; i++ {
		base.Center[i], err = utilities.ReadFloat32(r)
		if err != nil {
			return fmt.Errorf("read center[%d] failed: %w", i, err)
		}
	}

	// 8. Bound
	base.Bound, err = utilities.ReadInt32(r)
	if err != nil {
		return fmt.Errorf("read bound failed: %w", err)
	}

	return nil
}

func (base *DynamicBoneColliderBase) Write(w io.Writer, version int32) error {
	// 1. ParentName
	if err := utilities.WriteString(w, base.ParentName); err != nil {
		return fmt.Errorf("write parentName failed: %w", err)
	}
	// 2. SelfName
	if err := utilities.WriteString(w, base.SelfName); err != nil {
		return fmt.Errorf("write selfName failed: %w", err)
	}

	// 3. localPosition
	for i := 0; i < 3; i++ {
		if err := utilities.WriteFloat32(w, base.LocalPosition[i]); err != nil {
			return fmt.Errorf("write localPosition[%d] failed: %w", i, err)
		}
	}

	// 4. localRotation
	for i := 0; i < 4; i++ {
		if err := utilities.WriteFloat32(w, base.LocalRotation[i]); err != nil {
			return fmt.Errorf("write localRotation[%d] failed: %w", i, err)
		}
	}

	// 5. localScale
	for i := 0; i < 3; i++ {
		if err := utilities.WriteFloat32(w, base.LocalScale[i]); err != nil {
			return fmt.Errorf("write localScale[%d] failed: %w", i, err)
		}
	}

	// 6. Direction
	if err := utilities.WriteInt32(w, base.Direction); err != nil {
		return fmt.Errorf("write direction failed: %w", err)
	}

	// 7. Center
	for i := 0; i < 3; i++ {
		if err := utilities.WriteFloat32(w, base.Center[i]); err != nil {
			return fmt.Errorf("write center[%d] failed: %w", i, err)
		}
	}

	// 8. Bound
	if err := utilities.WriteInt32(w, base.Bound); err != nil {
		return fmt.Errorf("write bound failed: %w", err)
	}

	return nil
}

// DynamicBoneCollider 对应 "dbc"
type DynamicBoneCollider struct {
	TypeName string                   `json:"TypeName" default:"dbc"` // 碰撞器类型，仅标记，不序列化 "dbc"
	Base     *DynamicBoneColliderBase `json:"Base"`                   // 基类

	Radius float32 `json:"Radius"` // 碰撞器半径
	Height float32 `json:"Height"` // 碰撞器高度
}

func (dbc *DynamicBoneCollider) GetTypeName() string {
	return "dbc"
}

func (dbc *DynamicBoneCollider) Read(r io.Reader, version int32) error {
	dbc.TypeName = dbc.GetTypeName()

	// 先读基类字段
	baseData := DynamicBoneColliderBase{}
	err := baseData.Read(r, version)
	if err != nil {
		return fmt.Errorf("read base collider failed: %w", err)
	}
	dbc.Base = &baseData

	// 读 2 个 Float32
	radius, err := utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("read m_Radius failed: %w", err)
	}
	height, err := utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("read m_Height failed: %w", err)
	}
	dbc.Radius = radius
	dbc.Height = height

	return nil
}

func (dbc *DynamicBoneCollider) Write(w io.Writer, version int32) error {
	// 先写基类字段
	err := dbc.Base.Write(w, version)
	if err != nil {
		return err
	}

	// 写 2 个 Float32
	if err := utilities.WriteFloat32(w, dbc.Radius); err != nil {
		return fmt.Errorf("write m_Radius failed: %w", err)
	}

	if err := utilities.WriteFloat32(w, dbc.Height); err != nil {
		return fmt.Errorf("write m_Height failed: %w", err)
	}
	return nil
}

// DynamicBonePlaneCollider 对应 "dpc"
// 在 C# 中并无其它独立字段，只继承基类。
type DynamicBonePlaneCollider struct {
	TypeName string                   `json:"TypeName" default:"dpc"` // 碰撞器类型，仅标记，不序列化 "dpc"
	Base     *DynamicBoneColliderBase `json:"Base"`                   // 基类
}

func (dpc *DynamicBonePlaneCollider) GetTypeName() string {
	return "dpc"
}

func (dpc *DynamicBonePlaneCollider) Read(r io.Reader, version int32) error {
	dpc.TypeName = dpc.GetTypeName()

	// 只有基类字段
	baseData := DynamicBoneColliderBase{}
	err := baseData.Read(r, version)
	if err != nil {
		return fmt.Errorf("read base collider for dpc failed: %w", err)
	}
	dpc.Base = &baseData

	return nil
}

func (dpc *DynamicBonePlaneCollider) Write(w io.Writer, version int32) error {
	// 只有基类字段
	if err := dpc.Base.Write(w, version); err != nil {
		return fmt.Errorf("write base collider for dpc failed: %w", err)
	}

	return nil
}

// DynamicBoneMuneCollider 对应 "dbm"
type DynamicBoneMuneCollider struct {
	TypeName string                   `json:"TypeName" default:"dbm"` // 碰撞器类型，仅标记，不序列化 "dbm"
	Base     *DynamicBoneColliderBase `json:"Base"`                   // 基类

	Radius          float32    `json:"Radius"`          // 碰撞器半径
	Height          float32    `json:"Height"`          // 碰撞器高度
	ScaleRateMulMax float32    `json:"ScaleRateMulMax"` // 最大缩放倍率
	CenterRateMax   [3]float32 `json:"CenterRateMax"`   // 最大中心偏移(x,y,z)
}

func (c *DynamicBoneMuneCollider) GetTypeName() string {
	return "dbm"
}

func (c *DynamicBoneMuneCollider) Read(r io.Reader, version int32) error {
	c.TypeName = c.GetTypeName()

	baseData := DynamicBoneColliderBase{}
	err := baseData.Read(r, version)
	if err != nil {
		return fmt.Errorf("read base collider for dbm failed: %w", err)
	}
	c.Base = &baseData

	radius, err := utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("read m_Radius failed: %w", err)
	}
	c.Radius = radius

	height, err := utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("read m_Height failed: %w", err)
	}
	c.Height = height

	scaleRateMulMax, err := utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("read m_fScaleRateMulMax failed: %w", err)
	}
	c.ScaleRateMulMax = scaleRateMulMax

	var centerRateMax [3]float32
	for i := 0; i < 3; i++ {
		centerRateMax[i], err = utilities.ReadFloat32(r)
		if err != nil {
			return fmt.Errorf("read m_CenterRateMax[%d] failed: %w", i, err)
		}
	}
	c.CenterRateMax = centerRateMax

	return nil
}

func (c *DynamicBoneMuneCollider) Write(w io.Writer, version int32) error {
	// 写基类字段
	if err := c.Base.Write(w, version); err != nil {
		return fmt.Errorf("write base collider failed: %w", err)
	}

	// 写 2 个 Float32
	if err := utilities.WriteFloat32(w, c.Radius); err != nil {
		return fmt.Errorf("write m_Radius failed: %w", err)
	}

	if err := utilities.WriteFloat32(w, c.Height); err != nil {
		return fmt.Errorf("write m_Height failed: %w", err)
	}

	// 写 1 个 Float32
	if err := utilities.WriteFloat32(w, c.ScaleRateMulMax); err != nil {
		return fmt.Errorf("write m_fScaleRateMulMax failed: %w", err)
	}

	// 写 3 个 Float32
	for i := 0; i < 3; i++ {
		if err := utilities.WriteFloat32(w, c.CenterRateMax[i]); err != nil {
			return fmt.Errorf("write m_CenterRateMax[%d] failed: %w", i, err)
		}
	}

	return nil
}

// MissingCollider 对应 "missing"
type MissingCollider struct {
	TypeName string `json:"TypeName" default:"missing"` // 碰撞器类型，仅标记，不序列化 "missing"
}

func (m *MissingCollider) GetTypeName() string {
	return "missing"
}

func (m *MissingCollider) Read(r io.Reader, version int32) error {
	m.TypeName = m.GetTypeName()
	// "missing" 字段什么都不做，typeName 已经在外层写了
	return nil
}

func (m *MissingCollider) Write(w io.Writer, version int32) error {
	// 同上，什么也不写
	return nil
}

// UnmarshalJSON 为 Col 实现自定义 UnmarshalJSON
// 因为 Col 的 ICollider 字段是一个接口切片，需要根据 typeName 字段来决定反序列化为哪个具体类型
func (c *Col) UnmarshalJSON(data []byte) error {
	// 先定义一个中间结构来接住 Colliders 的原始数据
	// 其他字段 Signature / Version 可以直接接收
	type colAlias Col
	var temp struct {
		Colliders []json.RawMessage `json:"Colliders"`
		*colAlias
	}
	temp.colAlias = (*colAlias)(c)

	// 先把大部分字段 (Signature, Version) 解析出来
	if err := json.Unmarshal(data, &temp); err != nil {
		return err
	}

	// 此时 c.Signature 和 c.Version 已经有值了
	// 逐个解析 Colliders
	var result []ICollider
	for _, raw := range temp.Colliders {
		// 1. 先解析出 TypeName 用来分辨子类型
		var typeHolder struct {
			TypeName string `json:"TypeName"`
		}
		if err := json.Unmarshal(raw, &typeHolder); err != nil {
			return err
		}

		// 2. 根据 TypeName 创建对应的 collider 实例
		var collider ICollider
		switch typeHolder.TypeName {
		case "dbc":
			collider = &DynamicBoneCollider{}
		case "dpc":
			collider = &DynamicBonePlaneCollider{}
		case "dbm":
			collider = &DynamicBoneMuneCollider{}
		case "missing":
			collider = &MissingCollider{}
		default:
			return fmt.Errorf("unrecognized collider TypeName: %q", typeHolder.TypeName)
		}

		// 3. 用创建好的实例再去解析整个 JSON
		if err := json.Unmarshal(raw, collider); err != nil {
			return err
		}
		result = append(result, collider)
	}

	// 全部解析完毕，赋值给真实字段
	c.Colliders = result
	return nil
}
