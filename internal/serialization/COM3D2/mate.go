package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/utilities"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
)

// Mate 对应 .mate 文件的整体结构
type Mate struct {
	Signature string    `json:"Signature"`
	Version   int32     `json:"Version"`
	Name      string    `json:"Name"`
	Material  *Material `json:"Material"`
}

// ReadMate 从 r 中读取一个 .mate 文件，返回 Mate 结构
func ReadMate(r io.Reader) (*Mate, error) {
	m := &Mate{}

	// 1. signature (string)
	sig, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read .mate signature failed: %w", err)
	}
	//if sig != MateSignature {
	//	return nil, fmt.Errorf("invalid .mate signature: got %q, want %s", sig, MateSignature)
	//}
	m.Signature = sig

	// 2. version (int32)
	ver, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("read .mate version failed: %w", err)
	}
	m.Version = ver

	// 3. name (string)
	nameStr, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read .mate name failed: %w", err)
	}
	m.Name = nameStr

	// 4. material (Material)
	mat, err := readMaterial(r)
	if err != nil {
		return nil, fmt.Errorf("read .mate material failed: %w", err)
	}
	m.Material = mat

	return m, nil
}

// Dump 将 Mate 写出到 w 中
func (m *Mate) Dump(w io.Writer) error {
	// 1. signature
	if err := utilities.WriteString(w, m.Signature); err != nil {
		return fmt.Errorf("write .mate signature failed: %w", err)
	}

	// 2. version
	if err := utilities.WriteInt32(w, m.Version); err != nil {
		return fmt.Errorf("write .mate version failed: %w", err)
	}

	// 3. name
	if err := utilities.WriteString(w, m.Name); err != nil {
		return fmt.Errorf("write .mate name failed: %w", err)
	}

	// 4. material
	if m.Material != nil {
		if err := m.Material.Dump(w); err != nil {
			return fmt.Errorf("write .mate material failed: %w", err)
		}
	}

	return nil
}

// Material 及其属性解析
type Material struct {
	Name           string     `json:"Name"`
	ShaderName     string     `json:"ShaderName"`
	ShaderFilename string     `json:"ShaderFilename"`
	Properties     []Property `json:"Properties"`
}

// readMaterial 用于解析 Material 结构。
func readMaterial(r io.Reader) (*Material, error) {
	// 确保我们有一个 io.ReadSeeker
	rs, ok := r.(io.ReadSeeker)
	if !ok {
		// 如果不是可寻址流，就把它全部读到内存
		allBytes, err := io.ReadAll(r)
		if err != nil {
			return nil, fmt.Errorf("readAll for readMaterial failed: %w", err)
		}
		rs = bytes.NewReader(allBytes)
	}

	m := &Material{}

	// 1. name
	nameStr, err := utilities.ReadString(rs)
	if err != nil {
		return nil, fmt.Errorf("read material.name failed: %w", err)
	}
	m.Name = nameStr

	// 2. shaderName
	shaderName, err := utilities.ReadString(rs)
	if err != nil {
		return nil, fmt.Errorf("read material.shaderName failed: %w", err)
	}
	m.ShaderName = shaderName

	// 3. shaderFilename
	shaderFile, err := utilities.ReadString(rs)
	if err != nil {
		return nil, fmt.Errorf("read material.shaderFilename failed: %w", err)
	}
	m.ShaderFilename = shaderFile

	// 4. properties (循环读取，直到遇到 MateEndString 字段)
	props := make([]Property, 0)
	for {
		peek, err := utilities.PeekString(rs)
		if err != nil {
			return nil, fmt.Errorf("peek property type failed: %w", err)
		}

		if peek == MateEndString {
			// 消费掉 MateEndString
			_, _ = utilities.ReadString(rs)
			break
		}
		// 根据不同的类型创建不同的 property
		prop, err := readProperty(rs)
		if err != nil {
			return nil, err
		}
		props = append(props, prop)
	}

	m.Properties = props

	return m, nil
}

// Dump 将 Material 写出到 w 中。
func (m *Material) Dump(w io.Writer) error {
	// 1. name
	if err := utilities.WriteString(w, m.Name); err != nil {
		return fmt.Errorf("write material.name failed: %w", err)
	}

	// 2. shaderName
	if err := utilities.WriteString(w, m.ShaderName); err != nil {
		return fmt.Errorf("write material.shaderName failed: %w", err)
	}

	// 3. shaderFilename
	if err := utilities.WriteString(w, m.ShaderFilename); err != nil {
		return fmt.Errorf("write material.shaderFilename failed: %w", err)
	}

	// 4. 写出 properties
	for _, prop := range m.Properties {
		if err := dumpProperty(w, prop); err != nil {
			return fmt.Errorf("write material property failed: %w", err)
		}
	}

	// 最后写出一个 MateEndString 标识，表示 property 列表结束
	if err := utilities.WriteString(w, MateEndString); err != nil {
		return fmt.Errorf("write properties %s failed: %w", MateEndString, err)
	}

	return nil
}

// Property 是一个接口，对应 C# 里的抽象 class Property
// Go 中我们用接口 + 具体 struct 来表达
// 注意在每个 struct 中保存 TypeName 是故意的，否则前端类型推断困难
type Property interface {
	GetTypeName() string
	Read(r io.Reader) error
	Write(w io.Writer) error
}

// PropertyCreator 定义属性创建器类型
type PropertyCreator func() Property

// 属性类型注册表
var propertyRegistry = map[string]PropertyCreator{
	"tex":        func() Property { return &TexProperty{} },
	"col":        func() Property { return &ColProperty{} },
	"vec":        func() Property { return &VecProperty{} },
	"f":          func() Property { return &FProperty{} },
	"range":      func() Property { return &RangeProperty{} },
	"tex_offset": func() Property { return &TexOffsetProperty{} },
	"tex_scale":  func() Property { return &TexScaleProperty{} },
	"keyword":    func() Property { return &KeywordProperty{} },
}

// readProperty 根据下一段内容来解析 Property 的具体子类型
func readProperty(r io.Reader) (Property, error) {
	// 先读出 property 的类型标识，比如 "tex", "col", "vec", "f"
	typeStr, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read property type failed: %w", err)
	}

	// 通过注册表创建属性实例
	creator, ok := propertyRegistry[typeStr]
	if !ok {
		return nil, fmt.Errorf("unknown property type: %q", typeStr)
	}
	prop := creator()

	// 调用具体类型的反序列化方法
	if err := prop.Read(r); err != nil {
		return nil, fmt.Errorf("read %s property failed: %w", typeStr, err)
	}
	return prop, nil
}

// dumpProperty 根据 Property 的子类型写出对应的数据
func dumpProperty(w io.Writer, prop Property) error {
	return prop.Write(w)
}

// -------------------------------------------------------------------
// 1) TexProperty

type TexProperty struct {
	TypeName string            `json:"TypeName" default:"tex"`
	PropName string            `json:"PropName"`
	SubTag   string            `json:"SubTag"`
	Tex2D    *Tex2DSubProperty `json:"Tex2D"`
	TexRT    *TexRTSubProperty `json:"TexRT"`
}

type Tex2DSubProperty struct {
	Name   string     `json:"Name"`
	Path   string     `json:"Path"`
	Offset [2]float32 `json:"Offset"` // (x, y)
	Scale  [2]float32 `json:"Scale"`  // (x, y)
}
type TexRTSubProperty struct {
	DiscardedStr1 string `json:"DiscardedStr1"`
	DiscardedStr2 string `json:"DiscardedStr2"`
}

func (t *TexProperty) GetTypeName() string { return "tex" }

func (t *TexProperty) Read(r io.Reader) error {
	t.TypeName = t.GetTypeName()

	// 读取属性名 (string)
	name, err := utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("read property name failed: %w", err)
	}
	t.PropName = name

	// 读取 subTag (string) => "tex2d" or "cube" or "texRT" or "null"
	subTag, err := utilities.ReadString(r)

	if err != nil {
		return fmt.Errorf("read TexProperty subtag failed: %w", err)
	}
	t.SubTag = subTag

	switch subTag {
	case "tex2d", "cube":
		// 解析 Tex2DSubProperty
		var tex2d Tex2DSubProperty

		// name
		s1, err := utilities.ReadString(r)
		if err != nil {
			return fmt.Errorf("read tex2d.name failed: %w", err)
		}
		tex2d.Name = s1

		// path
		s2, err := utilities.ReadString(r)
		if err != nil {
			return fmt.Errorf("read tex2d.path failed: %w", err)
		}
		tex2d.Path = s2

		// offset (Float2)
		offsetX, err := utilities.ReadFloat32(r)
		if err != nil {
			return fmt.Errorf("read tex2d.offset.x failed: %w", err)
		}
		offsetY, err := utilities.ReadFloat32(r)
		if err != nil {
			return fmt.Errorf("read tex2d.offset.y failed: %w", err)
		}
		tex2d.Offset[0] = offsetX
		tex2d.Offset[1] = offsetY

		// scale (Float2)
		scaleX, err := utilities.ReadFloat32(r)
		if err != nil {
			return fmt.Errorf("read tex2d.scale.x failed: %w", err)
		}
		scaleY, err := utilities.ReadFloat32(r)
		if err != nil {
			return fmt.Errorf("read tex2d.scale.y failed: %w", err)
		}
		tex2d.Scale[0] = scaleX
		tex2d.Scale[1] = scaleY

		t.Tex2D = &tex2d

	case "texRT":
		// 解析 TexRTSubProperty
		var texRT TexRTSubProperty

		s1, err := utilities.ReadString(r)
		if err != nil {
			return fmt.Errorf("read texRT.discardedStr1 failed: %w", err)
		}
		s2, err := utilities.ReadString(r)
		if err != nil {
			return fmt.Errorf("read texRT.discardedStr2 failed: %w", err)
		}
		texRT.DiscardedStr1 = s1
		texRT.DiscardedStr2 = s2
		t.TexRT = &texRT

	case "null":
		// 当作空 tex2d
		var tex2d Tex2DSubProperty
		t.Tex2D = &tex2d

	default:
		return fmt.Errorf("unknown TexProperty subTag: %q", subTag)
	}

	return nil
}

func (t *TexProperty) Write(w io.Writer) error {
	// 写出类型标识 "tex"
	if err := utilities.WriteString(w, t.GetTypeName()); err != nil {
		return fmt.Errorf("write TexProperty type failed: %w", err)
	}
	// 写出属性名
	if err := utilities.WriteString(w, t.PropName); err != nil {
		return fmt.Errorf("write TexProperty name failed: %w", err)
	}
	// 写出子标签 (subTag): "tex2d"/"cube"/"texRT"/"null"
	if err := utilities.WriteString(w, t.SubTag); err != nil {
		return fmt.Errorf("write TexProperty subTag failed: %w", err)
	}
	// 根据 subTag 写出不同的内容
	switch t.SubTag {
	case "tex2d", "cube":
		if t.Tex2D == nil {
			return fmt.Errorf("TexProperty with subTag '%s' but Tex2D is nil", t.SubTag)
		}
		// 写出 Tex2DSubProperty
		if err := utilities.WriteString(w, t.Tex2D.Name); err != nil {
			return fmt.Errorf("write tex2d.name failed: %w", err)
		}
		if err := utilities.WriteString(w, t.Tex2D.Path); err != nil {
			return fmt.Errorf("write tex2d.path failed: %w", err)
		}
		if err := utilities.WriteFloat32(w, t.Tex2D.Offset[0]); err != nil {
			return fmt.Errorf("write tex2d.offset.x failed: %w", err)
		}
		if err := utilities.WriteFloat32(w, t.Tex2D.Offset[1]); err != nil {
			return fmt.Errorf("write tex2d.offset.y failed: %w", err)
		}
		if err := utilities.WriteFloat32(w, t.Tex2D.Scale[0]); err != nil {
			return fmt.Errorf("write tex2d.scale.x failed: %w", err)
		}
		if err := utilities.WriteFloat32(w, t.Tex2D.Scale[1]); err != nil {
			return fmt.Errorf("write tex2d.scale.y failed: %w", err)
		}
	case "texRT":
		if t.TexRT == nil {
			return fmt.Errorf("TexProperty with subTag 'texRT' but TexRT is nil")
		}
		// 写出 TexRTSubProperty
		if err := utilities.WriteString(w, t.TexRT.DiscardedStr1); err != nil {
			return fmt.Errorf("write texRT.discardedStr1 failed: %w", err)
		}
		if err := utilities.WriteString(w, t.TexRT.DiscardedStr2); err != nil {
			return fmt.Errorf("write texRT.discardedStr2 failed: %w", err)
		}
	case "null":
		// 什么都不写，子标签已经写了一个 null，这里不用写了
	default:
		return fmt.Errorf("unknown TexProperty subTag: %q", t.SubTag)
	}
	return nil
}

// -------------------------------------------------------------------
// 2) ColProperty => "col"

type ColProperty struct {
	TypeName string     `json:"TypeName" default:"col"`
	PropName string     `json:"PropName"`
	Color    [4]float32 `json:"Color"` // RGBA
}

func (c *ColProperty) GetTypeName() string { return "col" }

func (c *ColProperty) Read(r io.Reader) error {
	c.TypeName = c.GetTypeName()

	// 读取属性名 (string)
	name, err := utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("read property name failed: %w", err)
	}
	c.PropName = name

	// 读取 4 个 float32
	for i := 0; i < 4; i++ {
		c.Color[i], err = utilities.ReadFloat32(r)
		if err != nil {
			return fmt.Errorf("read ColProperty color[%d] failed: %w", i, err)
		}
	}

	return nil
}

func (c *ColProperty) Write(w io.Writer) error {
	// 写出类型标识 "col"
	if err := utilities.WriteString(w, c.GetTypeName()); err != nil {
		return fmt.Errorf("write ColProperty type failed: %w", err)
	}
	// 写出属性名
	if err := utilities.WriteString(w, c.PropName); err != nil {
		return fmt.Errorf("write ColProperty name failed: %w", err)
	}
	// 写出四个 float32 (RGBA)
	for i, c := range c.Color {
		if err := utilities.WriteFloat32(w, c); err != nil {
			return fmt.Errorf("write ColProperty color[%d] failed: %w", i, err)
		}
	}
	return nil
}

// -------------------------------------------------------------------
// 3) VecProperty => "vec"

type VecProperty struct {
	TypeName string     `json:"TypeName" default:"vec"`
	PropName string     `json:"PropName"`
	Vector   [4]float32 `json:"Vector"`
}

func (v *VecProperty) GetTypeName() string { return "vec" }

func (v *VecProperty) Read(r io.Reader) error {
	v.TypeName = v.GetTypeName()

	// 读取属性名 (string)
	name, err := utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("read property name failed: %w", err)
	}
	v.PropName = name

	// 读取 4 个 float32
	for i := 0; i < 4; i++ {
		v.Vector[i], err = utilities.ReadFloat32(r)
		if err != nil {
			return fmt.Errorf("read VecProperty vector[%d] failed: %w", i, err)
		}
	}

	return nil
}

func (v *VecProperty) Write(w io.Writer) error {
	// 写出类型标识 "vec"
	if err := utilities.WriteString(w, v.GetTypeName()); err != nil {
		return fmt.Errorf("write VecProperty type failed: %w", err)
	}
	// 写出属性名
	if err := utilities.WriteString(w, v.PropName); err != nil {
		return fmt.Errorf("write VecProperty name failed: %w", err)
	}
	// 写出四个 float32
	for i, v := range v.Vector {
		if err := utilities.WriteFloat32(w, v); err != nil {
			return fmt.Errorf("write VecProperty vector[%d] failed: %w", i, err)
		}
	}
	return nil
}

// -------------------------------------------------------------------
// 4) FProperty => "f"

type FProperty struct {
	TypeName string  `json:"TypeName" default:"f"`
	PropName string  `json:"PropName"`
	Number   float32 `json:"Number"`
}

func (f *FProperty) GetTypeName() string { return "f" }

func (f *FProperty) Read(r io.Reader) error {
	f.TypeName = f.GetTypeName()
	// 读取属性名 (string)
	name, err := utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("read property name failed: %w", err)
	}
	f.PropName = name

	// 读取一个 float32
	val, err := utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("read FProperty float failed: %w", err)
	}
	f.Number = val

	return nil
}

func (f *FProperty) Write(w io.Writer) error {
	// 写出类型标识 "f"
	if err := utilities.WriteString(w, f.GetTypeName()); err != nil {
		return fmt.Errorf("write FProperty type failed: %w", err)
	}
	// 写出属性名
	if err := utilities.WriteString(w, f.PropName); err != nil {
		return fmt.Errorf("write FProperty name failed: %w", err)
	}
	// 写出一个 float32
	if err := utilities.WriteFloat32(w, f.Number); err != nil {
		return fmt.Errorf("write FProperty float failed: %w", err)
	}
	return nil
}

// -------------------------------------------------------------------
// 5) RangeProperty => "range"
// Only COM3D2_5 +

type RangeProperty struct {
	TypeName string  `json:"TypeName" default:"range"`
	PropName string  `json:"PropName"`
	Number   float32 `json:"Number"`
}

func (ra *RangeProperty) GetTypeName() string { return "range" }

func (ra *RangeProperty) Read(r io.Reader) error {
	ra.TypeName = ra.GetTypeName()

	// 读取属性名 (string)
	name, err := utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("read property name failed: %w", err)
	}
	ra.PropName = name

	// 读取一个 float32
	val, err := utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("read RangeProperty float failed: %w", err)
	}
	ra.Number = val

	return nil
}

func (ra *RangeProperty) Write(w io.Writer) error {
	// 写出类型标识 "range"
	if err := utilities.WriteString(w, ra.GetTypeName()); err != nil {
		return fmt.Errorf("write RangeProperty type failed: %w", err)
	}
	// 写出属性名
	if err := utilities.WriteString(w, ra.PropName); err != nil {
		return fmt.Errorf("write RangeProperty name failed: %w", err)
	}
	// 写出一个 float32
	if err := utilities.WriteFloat32(w, ra.Number); err != nil {
		return fmt.Errorf("write RangeProperty float failed: %w", err)
	}
	return nil
}

// -------------------------------------------------------------------
// 6) TexOffsetProperty => "tex_offset"
// Only COM3D2_5 +

type TexOffsetProperty struct {
	TypeName string  `json:"TypeName" default:"tex_offset"`
	PropName string  `json:"PropName"`
	OffsetX  float32 `json:"OffsetX"`
	OffsetY  float32 `json:"OffsetY"`
}

func (to *TexOffsetProperty) GetTypeName() string { return "tex_offset" }

func (to *TexOffsetProperty) Read(r io.Reader) error {
	to.TypeName = to.GetTypeName()

	// 读取属性名 (string)
	name, err := utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("read property name failed: %w", err)
	}
	to.PropName = name

	// 读取两个 float32
	x, err := utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("read RangeProperty float x failed: %w", err)
	}
	to.OffsetX = x

	y, err := utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("read RangeProperty float y failed: %w", err)
	}
	to.OffsetY = y

	return nil
}

func (to *TexOffsetProperty) Write(w io.Writer) error {
	// 写出类型标识 "tex_offset"
	if err := utilities.WriteString(w, to.GetTypeName()); err != nil {
		return fmt.Errorf("write TexOffsetProperty type failed: %w", err)
	}
	// 写出属性名
	if err := utilities.WriteString(w, to.PropName); err != nil {
		return fmt.Errorf("write TexOffsetProperty name failed: %w", err)
	}
	// 写出两个 float32
	if err := utilities.WriteFloat32(w, to.OffsetX); err != nil {
		return fmt.Errorf("write TexOffsetProperty float x failed: %w", err)
	}

	if err := utilities.WriteFloat32(w, to.OffsetY); err != nil {
		return fmt.Errorf("write TexOffsetProperty float y failed: %w", err)
	}
	return nil
}

// -------------------------------------------------------------------
// 7) TexScaleProperty => "tex_scale"
// Only COM3D2_5 +

type TexScaleProperty struct {
	TypeName string  `json:"TypeName" default:"tex_scale"`
	PropName string  `json:"PropName"`
	ScaleX   float32 `json:"ScaleX"`
	ScaleY   float32 `json:"ScaleY"`
}

func (ts *TexScaleProperty) GetTypeName() string { return "tex_scale" }

func (ts *TexScaleProperty) Read(r io.Reader) error {
	ts.TypeName = ts.GetTypeName()
	// 读取属性名 (string)
	name, err := utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("read property name failed: %w", err)
	}
	ts.PropName = name

	// 读取两个 float32
	x, err := utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("read RangeProperty float x failed: %w", err)
	}
	ts.ScaleX = x

	y, err := utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("read RangeProperty float y failed: %w", err)
	}
	ts.ScaleY = y

	return nil
}

func (ts *TexScaleProperty) Write(w io.Writer) error {
	// 写出类型标识 "tex_offset"
	if err := utilities.WriteString(w, ts.GetTypeName()); err != nil {
		return fmt.Errorf("write TexOffsetProperty type failed: %w", err)
	}
	// 写出属性名
	if err := utilities.WriteString(w, ts.PropName); err != nil {
		return fmt.Errorf("write TexOffsetProperty name failed: %w", err)
	}
	// 写出两个 float32
	if err := utilities.WriteFloat32(w, ts.ScaleX); err != nil {
		return fmt.Errorf("write TexOffsetProperty float x failed: %w", err)
	}

	if err := utilities.WriteFloat32(w, ts.ScaleY); err != nil {
		return fmt.Errorf("write TexOffsetProperty float y failed: %w", err)
	}
	return nil
}

// -------------------------------------------------------------------
// 8) KeywordProperty => "keyword"
// Only COM3D2_5 +

type KeywordProperty struct {
	TypeName string    `json:"TypeName" default:"keyword"`
	PropName string    `json:"PropName"`
	Count    int32     `json:"Count"`
	Keywords []Keyword `json:"Keywords"`
}

type Keyword struct {
	Key   string `json:"Key"`
	Value bool   `json:"Value"`
}

func (f *KeywordProperty) GetTypeName() string { return "keyword" }

func (f *KeywordProperty) Read(r io.Reader) error {
	f.TypeName = f.GetTypeName()

	// 读取属性名 (string)
	name, err := utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("read property name failed: %w", err)
	}
	f.PropName = name

	// 读取一个 int32， keyword 的数量
	count, err := utilities.ReadInt32(r)
	if err != nil {
		return fmt.Errorf("read Keyword count failed: %w", err)
	}
	f.Count = count

	// 循环读取 count 个 keyword
	f.Keywords = make([]Keyword, count)
	for i := int32(0); i < count; i++ {
		key, err := utilities.ReadString(r)
		if err != nil {
			return fmt.Errorf("read Keyword key failed: %w", err)
		}
		value, err := utilities.ReadBool(r)
		if err != nil {
			return fmt.Errorf("read Keyword value failed: %w", err)
		}
		f.Keywords[i] = Keyword{
			Key:   key,
			Value: value,
		}
	}
	return nil
}

func (f *KeywordProperty) Write(w io.Writer) error {
	// 写出类型标识 "keyword"
	if err := utilities.WriteString(w, f.GetTypeName()); err != nil {
		return fmt.Errorf("write KeywordProperty type failed: %w", err)
	}
	// 写出属性名
	if err := utilities.WriteString(w, f.PropName); err != nil {
		return fmt.Errorf("write KeywordProperty name failed: %w", err)
	}
	// 写出 count
	if err := utilities.WriteInt32(w, int32(len(f.Keywords))); err != nil {
		return fmt.Errorf("write KeywordProperty count failed: %w", err)
	}
	// 循环写出 count 个 keyword
	for i, kv := range f.Keywords {
		if err := utilities.WriteString(w, kv.Key); err != nil {
			return fmt.Errorf("write Keywords[%d] key failed: %w", i, err)
		}
		if err := utilities.WriteBool(w, kv.Value); err != nil {
			return fmt.Errorf("write Keywords[%d] value failed: %w", i, err)
		}
	}
	return nil
}

// printMaterialDetails 打印 Material 的详细信息
// Debug 使用
func printMaterialDetails(m *Material) {
	fmt.Printf("Material Name: %s\n", m.Name)
	fmt.Printf("Shader Name: %s\n", m.ShaderName)
	fmt.Printf("Shader Filename: %s\n", m.ShaderFilename)

	fmt.Println("Properties:")
	for _, prop := range m.Properties {
		fmt.Printf("  - Type: %s\n", prop.GetTypeName())
		// 根据不同的属性类型，打印具体的属性值
		switch p := prop.(type) {
		case *TexProperty:
			fmt.Printf("    PropName: %s\n", p.PropName)
			fmt.Printf("    SubTag: %s\n", p.SubTag)
			if p.Tex2D != nil {
				fmt.Printf("    Tex2D Name: %s\n", p.Tex2D.Name)
				fmt.Printf("    Tex2D Path: %s\n", p.Tex2D.Path)
				fmt.Printf("    Tex2D Offset: %v\n", p.Tex2D.Offset)
				fmt.Printf("    Tex2D Scale: %v\n", p.Tex2D.Scale)
			}
			if p.TexRT != nil {
				fmt.Printf("    TexRT DiscardedStr1: %s\n", p.TexRT.DiscardedStr1)
				fmt.Printf("    TexRT DiscardedStr2: %s\n", p.TexRT.DiscardedStr2)
			}
		case *ColProperty:
			fmt.Printf("    PropName: %s\n", p.PropName)
			fmt.Printf("    Color: %v\n", p.Color)
		case *VecProperty:
			fmt.Printf("    PropName: %s\n", p.PropName)
			fmt.Printf("    Vector: %v\n", p.Vector)
		case *FProperty:
			fmt.Printf("    PropName: %s\n", p.PropName)
			fmt.Printf("    Number: %v\n", p.Number)
		case *RangeProperty:
			fmt.Printf("    PropName: %s\n", p.PropName)
			fmt.Printf("    Number: %v\n", p.Number)
		case *TexOffsetProperty:
			fmt.Printf("    PropName: %s\n", p.PropName)
			fmt.Printf("    OffsetX: %v\n", p.OffsetX)
			fmt.Printf("    OffsetY: %v\n", p.OffsetY)
		case *TexScaleProperty:
			fmt.Printf("    PropName: %s\n", p.PropName)
			fmt.Printf("    ScaleX: %v\n", p.ScaleX)
			fmt.Printf("    ScaleY: %v\n", p.ScaleY)
		case *KeywordProperty:
			fmt.Printf("    PropName: %s\n", p.PropName)
			fmt.Printf("    Count: %v\n", p.Count)
			for i, kw := range p.Keywords {
				fmt.Printf("      - Key[%d]: %s, Value: %v\n", i, kw.Key, kw.Value)
			}
		}
	}
}

// UnmarshalJSON 为 Material 实现自定义 UnmarshalJSON
// 因为 Material 的 Properties 字段是一个接口切片，需要根据 typeName 字段来决定反序列化为哪个具体类型
func (m *Material) UnmarshalJSON(data []byte) error {
	// 先定义一个中间结构来接住 Colliders 的原始数据
	// 其他字段 Signature / Version 可以直接接收
	type Alias Material
	aux := &struct {
		Properties []json.RawMessage `json:"Properties"`
		*Alias
	}{
		Alias: (*Alias)(m),
	}

	// 先把大部分字段 (Signature, Version) 解析出来
	if err := json.Unmarshal(data, aux); err != nil {
		return err
	}

	// 逐个解析 Properties，根据 typeName 字段决定反序列化为哪个具体类型
	var props []Property
	for _, raw := range aux.Properties {
		// 定义一个临时结构体用于提取 TypeName 字段
		var typeHolder struct {
			TypeName string `json:"TypeName"`
		}
		if err := json.Unmarshal(raw, &typeHolder); err != nil {
			return err
		}
		switch typeHolder.TypeName {
		case "tex":
			var tp TexProperty
			if err := json.Unmarshal(raw, &tp); err != nil {
				return err
			}
			props = append(props, &tp)
		case "col":
			var cp ColProperty
			if err := json.Unmarshal(raw, &cp); err != nil {
				return err
			}
			props = append(props, &cp)
		case "vec":
			var vp VecProperty
			if err := json.Unmarshal(raw, &vp); err != nil {
				return err
			}
			props = append(props, &vp)
		case "f":
			var fp FProperty
			if err := json.Unmarshal(raw, &fp); err != nil {
				return err
			}
			props = append(props, &fp)
		case "range":
			var r RangeProperty
			if err := json.Unmarshal(raw, &r); err != nil {
				return err
			}
			props = append(props, &r)
		case "tex_offset":
			var t TexOffsetProperty
			if err := json.Unmarshal(raw, &t); err != nil {
				return err
			}
			props = append(props, &t)
		case "tex_scale":
			var s TexScaleProperty
			if err := json.Unmarshal(raw, &s); err != nil {
				return err
			}
			props = append(props, &s)
		case "keyword":
			var k KeywordProperty
			if err := json.Unmarshal(raw, &k); err != nil {
				return err
			}
			props = append(props, &k)
		default:
			return fmt.Errorf("unknown property type: %s", typeHolder.TypeName)
		}
	}
	m.Properties = props
	return nil
}
