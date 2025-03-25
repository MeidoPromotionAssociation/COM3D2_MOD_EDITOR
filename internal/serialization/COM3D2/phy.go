package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/utilities"
	"fmt"
	"io"
)

// -------------------------------------------------------
// 定义 Phy (Phy) 的数据结构
// -------------------------------------------------------

type Phy struct {
	// 头部信息
	Signature string `json:"Signature"` // 1. 签名, 通常为 "CM3D21_PHY"
	Version   int32  `json:"Version"`   // 2. 版本 (例如 24102) 这个版本每次更新都会更改，但无结构更改
	RootName  string `json:"RootName"`  // 3. RootBone 名称

	// 4. Damping 阻尼相关参数
	EnablePartialDamping int32          `json:"EnablePartialDamping"` // PartialMode 枚举，模式
	PartialDamping       []BoneValue    `json:"PartialDamping"`       // 按骨骼设置的阻尼值
	Damping              float32        `json:"Damping"`              // 静态或曲线模式下的阻尼值
	DampingDistrib       AnimationCurve `json:"DampingDistrib"`       // 曲线

	// 5. Elasticity 弹性相关参数
	EnablePartialElasticity int32          `json:"EnablePartialElasticity"`
	PartialElasticity       []BoneValue    `json:"PartialElasticity"`
	Elasticity              float32        `json:"Elasticity"`
	ElasticityDistrib       AnimationCurve `json:"ElasticityDistrib"`

	// 6. Stiffness 刚度相关参数
	EnablePartialStiffness int32          `json:"EnablePartialStiffness"`
	PartialStiffness       []BoneValue    `json:"PartialStiffness"`
	Stiffness              float32        `json:"Stiffness"`
	StiffnessDistrib       AnimationCurve `json:"StiffnessDistrib"`

	// 7. Inert 惯性相关参数
	EnablePartialInert int32          `json:"EnablePartialInert"`
	PartialInert       []BoneValue    `json:"PartialInert"`
	Inert              float32        `json:"Inert"`
	InertDistrib       AnimationCurve `json:"InertDistrib"`

	// 8. 碰撞半径相关参数
	EnablePartialRadius int32          `json:"EnablePartialRadius"`
	PartialRadius       []BoneValue    `json:"PartialRadius"`
	Radius              float32        `json:"Radius"`
	RadiusDistrib       AnimationCurve `json:"RadiusDistrib"`

	// 9. 骨骼末端参数
	EndLength float32    `json:"EndLength"`
	EndOffset [3]float32 `json:"EndOffset"`

	// 10. 外力参数
	Gravity [3]float32 `json:"Gravity"`
	Force   [3]float32 `json:"Force"`

	// 10. 碰撞器相关参数
	ColliderFileName string `json:"ColliderFileName"` // 碰撞器文件名
	CollidersCount   int32  `json:"CollidersCount"`   // 碰撞器数量

	// 11.  排除骨骼
	ExclusionsCount int32 `json:"ExclusionsCount"` // 排除的骨骼数量

	// 12. 冻结轴向
	FreezeAxis int32 `json:"FreezeAxis"` // FreezeAxis 枚举
}

// PartialMode 枚举
const (
	PartialMode_StaticOrCurve int32 = 0 // C#里的 StaticOrCurve，静态或曲线模式
	PartialMode_Partial       int32 = 1 // C#里的 Partial，按骨骼设置模式
	PartialMode_FromBoneName  int32 = 2 // C#里的 FromBoneName，旧自动按骨骼名设置模式
)

// FreezeAxis 枚举
const (
	FreezeAxis_None int32 = 0
	FreezeAxis_X    int32 = 1
	FreezeAxis_Y    int32 = 2
	FreezeAxis_Z    int32 = 3
)

// AnimationCurve 用于存储 Keyframe 数组
type AnimationCurve struct {
	Keyframes []Keyframe `json:"Keyframes"`
}

// BoneValue 存储一个骨骼名称与对应 float 值
type BoneValue struct {
	BoneName string  `json:"BoneName"`
	Value    float32 `json:"Value"`
}

// ReadPhy 读取 "CM3D21_PHY" 格式
func ReadPhy(r io.Reader) (*Phy, error) {
	p := &Phy{}

	// 1. Signature
	sig, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read signature failed: %w", err)
	}
	//if sig != PhySignature {
	//	return nil, fmt.Errorf("invalid phy signature, want %v, got %q", PhySignature, sig)
	//}
	p.Signature = sig

	// 2. Version
	ver, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("read version failed: %w", err)
	}
	p.Version = ver

	// 3. RootName
	rootName, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read rootName failed: %w", err)
	}
	p.RootName = rootName

	// 4. Damping
	p.EnablePartialDamping, p.PartialDamping, err = readPartial(r)
	if err != nil {
		return nil, fmt.Errorf("read partial damping failed: %w", err)
	}
	p.Damping, err = utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read Damping failed: %w", err)
	}
	p.DampingDistrib, err = readAnimationCurve(r)
	if err != nil {
		return nil, fmt.Errorf("read DampingDistrib failed: %w", err)
	}

	// 5. Elasticity
	p.EnablePartialElasticity, p.PartialElasticity, err = readPartial(r)
	if err != nil {
		return nil, fmt.Errorf("read partial elasticity failed: %w", err)
	}
	p.Elasticity, err = utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read Elasticity failed: %w", err)
	}
	p.ElasticityDistrib, err = readAnimationCurve(r)
	if err != nil {
		return nil, fmt.Errorf("read ElasticityDistrib failed: %w", err)
	}

	// 6. Stiffness
	p.EnablePartialStiffness, p.PartialStiffness, err = readPartial(r)
	if err != nil {
		return nil, fmt.Errorf("read partial stiffness failed: %w", err)
	}
	p.Stiffness, err = utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read Stiffness failed: %w", err)
	}
	p.StiffnessDistrib, err = readAnimationCurve(r)
	if err != nil {
		return nil, fmt.Errorf("read StiffnessDistrib failed: %w", err)
	}

	// 7. Inert
	p.EnablePartialInert, p.PartialInert, err = readPartial(r)
	if err != nil {
		return nil, fmt.Errorf("read partial inert failed: %w", err)
	}
	p.Inert, err = utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read Inert failed: %w", err)
	}
	p.InertDistrib, err = readAnimationCurve(r)
	if err != nil {
		return nil, fmt.Errorf("read InertDistrib failed: %w", err)
	}

	// 8. Radius
	p.EnablePartialRadius, p.PartialRadius, err = readPartial(r)
	if err != nil {
		return nil, fmt.Errorf("read partial radius failed: %w", err)
	}
	p.Radius, err = utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read Radius failed: %w", err)
	}
	p.RadiusDistrib, err = readAnimationCurve(r)
	if err != nil {
		return nil, fmt.Errorf("read RadiusDistrib failed: %w", err)
	}

	// 9. EndLength, EndOffset (x,y,z)
	p.EndLength, err = utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read EndLength failed: %w", err)
	}
	// EndOffset
	for i := 0; i < 3; i++ {
		p.EndOffset[i], err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("read EndOffset[%d] failed: %w", i, err)
		}
	}

	// 10.  Gravity (x,y,z), Force (x,y,z)
	for i := 0; i < 3; i++ {
		p.Gravity[i], err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("read Gravity[%d] failed: %w", i, err)
		}
	}
	// Force
	for i := 0; i < 3; i++ {
		p.Force[i], err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("read Force[%d] failed: %w", i, err)
		}
	}

	// 11. ColliderFileName
	cfn, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read ColliderFileName failed: %w", err)
	}
	p.ColliderFileName = cfn

	// 12. CollidersCount
	colCount, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("read CollidersCount failed: %w", err)
	}
	p.CollidersCount = colCount

	// 虽然 C# 记录了 CollidersCount，但并没有写任何内容
	// 目前记录 CollidersCount 只是为了初始化列表

	// 13. ExclusionsCount
	excCount, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("read ExclusionsCount failed: %w", err)
	}
	p.ExclusionsCount = excCount

	// 同样，C# 只写了数量，没有写任何内容
	// 猜测此功能已弃用
	// 目前记录 ExclusionsCount 只是为了初始化列表

	// 13. FreezeAxis
	fa, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("read freezeAxis failed: %w", err)
	}
	p.FreezeAxis = fa

	return p, nil
}

// Dump 写出 "CM3D21_PHY" 格式
func (p *Phy) Dump(w io.Writer) error {
	// 1. Signature
	if err := utilities.WriteString(w, p.Signature); err != nil {
		return fmt.Errorf("write signature failed: %w", err)
	}
	// 2. Version
	if err := utilities.WriteInt32(w, p.Version); err != nil {
		return fmt.Errorf("write version failed: %w", err)
	}
	// 3. RootName
	if err := utilities.WriteString(w, p.RootName); err != nil {
		return fmt.Errorf("write rootName failed: %w", err)
	}

	// 4. Damping
	if err := writePartial(w, p.EnablePartialDamping, p.PartialDamping); err != nil {
		return fmt.Errorf("write partial damping failed: %w", err)
	}
	if err := utilities.WriteFloat32(w, p.Damping); err != nil {
		return fmt.Errorf("write Damping failed: %w", err)
	}
	if err := writeAnimationCurve(w, p.DampingDistrib); err != nil {
		return fmt.Errorf("write DampingDistrib failed: %w", err)
	}

	// 5. Elasticity
	if err := writePartial(w, p.EnablePartialElasticity, p.PartialElasticity); err != nil {
		return fmt.Errorf("write partial elasticity failed: %w", err)
	}
	if err := utilities.WriteFloat32(w, p.Elasticity); err != nil {
		return fmt.Errorf("write Elasticity failed: %w", err)
	}
	if err := writeAnimationCurve(w, p.ElasticityDistrib); err != nil {
		return fmt.Errorf("write ElasticityDistrib failed: %w", err)
	}

	// 6. Stiffness
	if err := writePartial(w, p.EnablePartialStiffness, p.PartialStiffness); err != nil {
		return fmt.Errorf("write partial stiffness failed: %w", err)
	}
	if err := utilities.WriteFloat32(w, p.Stiffness); err != nil {
		return fmt.Errorf("write Stiffness failed: %w", err)
	}
	if err := writeAnimationCurve(w, p.StiffnessDistrib); err != nil {
		return fmt.Errorf("write StiffnessDistrib failed: %w", err)
	}

	// 7. Inert
	if err := writePartial(w, p.EnablePartialInert, p.PartialInert); err != nil {
		return fmt.Errorf("write partial inert failed: %w", err)
	}
	if err := utilities.WriteFloat32(w, p.Inert); err != nil {
		return fmt.Errorf("write Inert failed: %w", err)
	}
	if err := writeAnimationCurve(w, p.InertDistrib); err != nil {
		return fmt.Errorf("write InertDistrib failed: %w", err)
	}

	// 8. Radius
	if err := writePartial(w, p.EnablePartialRadius, p.PartialRadius); err != nil {
		return fmt.Errorf("write partial radius failed: %w", err)
	}
	if err := utilities.WriteFloat32(w, p.Radius); err != nil {
		return fmt.Errorf("write Radius failed: %w", err)
	}
	if err := writeAnimationCurve(w, p.RadiusDistrib); err != nil {
		return fmt.Errorf("write RadiusDistrib failed: %w", err)
	}

	// 9. EndLength
	if err := utilities.WriteFloat32(w, p.EndLength); err != nil {
		return fmt.Errorf("write EndLength failed: %w", err)
	}
	// 10. EndOffset (x, y, z)
	for i := 0; i < 3; i++ {
		if err := utilities.WriteFloat32(w, p.EndOffset[i]); err != nil {
			return fmt.Errorf("write EndOffset[%d] failed: %w", i, err)
		}
	}
	// 11. Gravity (x, y, z)
	for i := 0; i < 3; i++ {
		if err := utilities.WriteFloat32(w, p.Gravity[i]); err != nil {
			return fmt.Errorf("write Gravity[%d] failed: %w", i, err)
		}
	}
	// 12. Force (x, y, z)
	for i := 0; i < 3; i++ {
		if err := utilities.WriteFloat32(w, p.Force[i]); err != nil {
			return fmt.Errorf("write Force[%d] failed: %w", i, err)
		}
	}

	// 13. ColliderFileName
	if err := utilities.WriteString(w, p.ColliderFileName); err != nil {
		return fmt.Errorf("write ColliderFileName failed: %w", err)
	}

	// 14. CollidersCount
	if err := utilities.WriteInt32(w, p.CollidersCount); err != nil {
		return fmt.Errorf("write CollidersCount failed: %w", err)
	}

	// 虽然 C# 记录了 CollidersCount，但并没有写任何内容，所以这里直接略过
	// 猜测因为以前 phy 和 col 是合并的
	// 但是碰撞器有自己的格式 col，所以 phy 内不写出 col 的内容
	// 记录 CollidersCount 只是为了初始化列表

	// 15. ExclusionsCount
	if err := utilities.WriteInt32(w, p.ExclusionsCount); err != nil {
		return fmt.Errorf("write ExclusionsCount failed: %w", err)
	}
	// 同样，C# 只写了数量，没有写任何内容
	// 猜测此功能已弃用
	// 记录 ExclusionsCount 只是为了初始化列表

	// 16. FreezeAxis
	if err := utilities.WriteInt32(w, p.FreezeAxis); err != nil {
		return fmt.Errorf("write freezeAxis failed: %w", err)
	}

	return nil
}

// readPartial 读取：
//
//	int(PartialMode) -> 如果 != PartialMode_Partial, 结束；
//	int(boneCount) -> 循环读取 boneName + floatValue
func readPartial(r io.Reader) (int32, []BoneValue, error) {
	mode, err := utilities.ReadInt32(r) // 读取 PartialMode，对应 PartialMode 枚举
	if err != nil {
		return 0, nil, fmt.Errorf("read partialMode failed: %w", err)
	}
	if mode != PartialMode_Partial { // 如果不是 PartialMode_Partial 部位模式，直接返回
		return mode, nil, nil
	}

	count, err := utilities.ReadInt32(r) // 读取骨骼数量
	if err != nil {
		return mode, nil, fmt.Errorf("read partial count failed: %w", err)
	}

	vals := make([]BoneValue, count)
	for i := 0; i < int(count); i++ { // 循环读取骨骼名称和对应 float 值
		bn, err := utilities.ReadString(r) // 读取骨骼名称
		if err != nil {
			return mode, nil, fmt.Errorf("read boneName failed: %w", err)
		}
		fv, err := utilities.ReadFloat32(r) // 读取对应 float 值
		if err != nil {
			return mode, nil, fmt.Errorf("read boneValue failed: %w", err)
		}
		vals[i] = BoneValue{BoneName: bn, Value: fv} // 存储到切片中
	}
	return mode, vals, nil
}

// writePartial 写出：
//
//	int(PartialMode) -> 如果 == PartialMode_Partial 再写 (count + boneName + floatValue * count)
func writePartial(w io.Writer, mode int32, values []BoneValue) error {
	if err := utilities.WriteInt32(w, mode); err != nil {
		return fmt.Errorf("write partialMode failed: %w", err)
	}
	if mode != PartialMode_Partial {
		return nil
	}

	count := int32(len(values))
	if err := utilities.WriteInt32(w, count); err != nil {
		return fmt.Errorf("write partial count failed: %w", err)
	}
	for _, bv := range values {
		if err := utilities.WriteString(w, bv.BoneName); err != nil {
			return fmt.Errorf("write boneName failed: %w", err)
		}
		if err := utilities.WriteFloat32(w, bv.Value); err != nil {
			return fmt.Errorf("write boneValue failed: %w", err)
		}
	}
	return nil
}

// 读取 AnimationCurve：先读 int(个数)，若为 0 则返回空
func readAnimationCurve(r io.Reader) (AnimationCurve, error) {
	n, err := utilities.ReadInt32(r) // 读取 Keyframe 数量
	if err != nil {
		return AnimationCurve{}, fmt.Errorf("read curve keyCount failed: %w", err)
	}
	if n == 0 {
		return AnimationCurve{}, nil
	}
	arr := make([]Keyframe, n)
	for i := 0; i < int(n); i++ {
		t, err := utilities.ReadFloat32(r) // 读取关键帧时间
		if err != nil {
			return AnimationCurve{}, fmt.Errorf("read time failed: %w", err)
		}
		v, err := utilities.ReadFloat32(r) // 读取关键帧值
		if err != nil {
			return AnimationCurve{}, fmt.Errorf("read value failed: %w", err)
		}
		inT, err := utilities.ReadFloat32(r) // 读取关键字入切线
		if err != nil {
			return AnimationCurve{}, fmt.Errorf("read inTangent failed: %w", err)
		}
		outT, err := utilities.ReadFloat32(r) // 读取关键字出切线
		if err != nil {
			return AnimationCurve{}, fmt.Errorf("read outTangent failed: %w", err)
		}
		arr[i] = Keyframe{Time: t, Value: v, InTangent: inT, OutTangent: outT}
	}
	return AnimationCurve{Keyframes: arr}, nil
}

// 写出 AnimationCurve：先写 int(个数)，然后依次写 time,value,inTangent,outTangent
func writeAnimationCurve(w io.Writer, ac AnimationCurve) error {
	n := int32(len(ac.Keyframes))
	if err := utilities.WriteInt32(w, n); err != nil {
		return fmt.Errorf("write curve keyCount failed: %w", err)
	}
	for _, k := range ac.Keyframes {
		if err := utilities.WriteFloat32(w, k.Time); err != nil {
			return fmt.Errorf("write time failed: %w", err)
		}
		if err := utilities.WriteFloat32(w, k.Value); err != nil {
			return fmt.Errorf("write value failed: %w", err)
		}
		if err := utilities.WriteFloat32(w, k.InTangent); err != nil {
			return fmt.Errorf("write inTangent failed: %w", err)
		}
		if err := utilities.WriteFloat32(w, k.OutTangent); err != nil {
			return fmt.Errorf("write outTangent failed: %w", err)
		}
	}
	return nil
}
