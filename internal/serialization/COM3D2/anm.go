package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/utilities"
	"fmt"
	"io"
)

// PropertyIndex 表示属性索引，用于标识属性的类型。
// 最高位为 6，含义如下：
const (
	LocalRotationX = 0
	LocalRotationY = 1
	LocalRotationZ = 2
	LocalRotationW = 3
	localPositionX = 4
	localPositionY = 5
	localPositionZ = 6
)

// Anm 整体描述一个 .anm 文件的结构
type Anm struct {
	Signature    string          `json:"Signature"`    // CM3D2_ANIM
	Version      int32           `json:"Version"`      // 1001
	BoneCurves   []BoneCurveData `json:"BoneCurves"`   // 所有骨骼的动画曲线数据
	BustKeyLeft  bool            `json:"BustKeyLeft"`  // 左胸部动画开关
	BustKeyRight bool            `json:"BustKeyRight"` // 右胸部动画开关
}

// PropertyCurve 存储单一属性（例如 localRotation.x）的一整条 AnimationCurve
type PropertyCurve struct {
	PropertyIndex int        `json:"PropertyIndex"` // 属性索引 b=100 => index=0, b=101 => index=1, 最高位为 6，含义查看上方枚举
	Keyframes     []Keyframe `json:"Keyframes"`     // 该属性的所有关键帧数据
}

// BoneCurveData 存储某个骨骼(或节点)对应的一组曲线信息
type BoneCurveData struct {
	BonePath       string          `json:"BonePath"`       // 骨骼路径（如"Bip01/Bip01 Spine/Bip01 Spine0a/Bip01 Spine1"）
	PropertyCurves []PropertyCurve `json:"PropertyCurves"` // 该骨骼的所有属性动画曲线
}

// ReadAnm 读取并解析一个 .anm 文件，返回 Anm 结构。
func ReadAnm(r io.Reader) (*Anm, error) {
	clip := &Anm{}

	// 1. 读取签名字符串 "CM3D2_ANIM"
	sig, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read anm signature failed: %w", err)
	}
	//if sig != AnmSignature {
	//	return nil, fmt.Errorf("invalid .anm signature: got %q, want %v", sig, AnmSignature)
	//}
	clip.Signature = sig

	// 2. 读取版本号 int32
	ver, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("read anm version failed: %w", err)
	}
	clip.Version = ver

	// 在 clip.BoneCurves 中定位到当前骨骼对应的下标
	var currentBoneIndex = -1

	// 3. 循环读取，直到 b == 0
	for {
		b, err := utilities.ReadByte(r)
		if err != nil {
			return nil, fmt.Errorf("read chunk byte failed: %w", err)
		}
		if b == 0 {
			// 表示骨骼曲线数据结束，跳出循环
			break
		}

		switch {
		// 用一个字节标识不同数据块：1 表示“下一行是一个骨骼路径字符串”，>=100 表示“后一段是关键帧曲线数据”。
		case b == 1:
			// 读入新的骨骼路径
			bonePath, err := utilities.ReadString(r)
			if err != nil {
				return nil, fmt.Errorf("read bone path failed: %w", err)
			}

			// 新增一个 BoneCurveData
			clip.BoneCurves = append(clip.BoneCurves, BoneCurveData{
				BonePath:       bonePath,
				PropertyCurves: []PropertyCurve{},
			})
			currentBoneIndex = len(clip.BoneCurves) - 1

		case b >= 100:
			if currentBoneIndex < 0 {
				return nil, fmt.Errorf("anm file invalid: got property curve data without bone path first")
			}
			// 读取关键帧数量
			keyframeCount, err := utilities.ReadInt32(r)
			if err != nil {
				return nil, fmt.Errorf("read keyframeCount failed: %w", err)
			}
			kfs := make([]Keyframe, keyframeCount)
			for i := 0; i < int(keyframeCount); i++ {
				t, err := utilities.ReadFloat32(r)
				if err != nil {
					return nil, fmt.Errorf("read keyframe time failed: %w", err)
				}
				v, err := utilities.ReadFloat32(r)
				if err != nil {
					return nil, fmt.Errorf("read keyframe value failed: %w", err)
				}
				inT, err := utilities.ReadFloat32(r)
				if err != nil {
					return nil, fmt.Errorf("read keyframe inTangent failed: %w", err)
				}
				outT, err := utilities.ReadFloat32(r)
				if err != nil {
					return nil, fmt.Errorf("read keyframe outTangent failed: %w", err)
				}

				kfs[i] = Keyframe{
					Time:       t,
					Value:      v,
					InTangent:  inT,
					OutTangent: outT,
				}
			}
			// 把这一组关键帧附加到当前骨骼
			propertyIndex := int(b - 100) // 例如 100 => 0, 101 => 1, ...
			curve := PropertyCurve{
				PropertyIndex: propertyIndex,
				Keyframes:     kfs,
			}
			clip.BoneCurves[currentBoneIndex].PropertyCurves =
				append(clip.BoneCurves[currentBoneIndex].PropertyCurves, curve)

		default:
			return nil, fmt.Errorf("unknown chunk byte: %d", b)
		}
	}

	// 4. 读取两个 byte，用来判断是否启用胸部动画
	//    也有部分文件可能没有这两字节，如果动画不是全身骨骼角色就没有这个
	bustKeyL, err := utilities.ReadByte(r)
	if err != nil {
		return clip, nil
		//return nil, fmt.Errorf("read useBustKeyL failed: %w", err)
	}
	bustKeyR, err := utilities.ReadByte(r)
	if err != nil {
		return clip, nil
		//return nil, fmt.Errorf("read useBustKeyR failed: %w", err)
	}
	clip.BustKeyLeft = bustKeyL != 0
	clip.BustKeyRight = bustKeyR != 0

	return clip, nil
}

// Dump 将 Anm 结构写到 w 中，生成符合 CM3D2_ANIM 格式的二进制数据。
func (a Anm) Dump(w io.Writer) error {
	// 1. 写签名
	if err := utilities.WriteString(w, a.Signature); err != nil {
		return fmt.Errorf("write anm signature failed: %w", err)
	}
	// 2. 写版本号
	if err := utilities.WriteInt32(w, a.Version); err != nil {
		return fmt.Errorf("write anm version failed: %w", err)
	}

	// 3. 写骨骼曲线数据
	//    先写 b=1 再写 bonePath
	//    然后对每条属性写 b=(100+index)，再写 keyframeCount，接着 N 个 keyframe
	for _, boneData := range a.BoneCurves {
		// 标记 byte=1，后跟骨骼路径
		if err := utilities.WriteByte(w, 1); err != nil {
			return fmt.Errorf("write boneData mark failed: %w", err)
		}
		if err := utilities.WriteString(w, boneData.BonePath); err != nil {
			return fmt.Errorf("write bone path failed: %w", err)
		}

		// 写所有 PropertyCurve（旋转和位置数据）
		for _, pc := range boneData.PropertyCurves {
			// 属性标记 = 100 + PropertyIndex
			// PropertyIndex 含义参考顶部枚举
			b := byte(100 + pc.PropertyIndex)
			if err := utilities.WriteByte(w, b); err != nil {
				return fmt.Errorf("write property mark failed: %w", err)
			}
			// keyframe 数量
			kfCount := int32(len(pc.Keyframes))
			if err := utilities.WriteInt32(w, kfCount); err != nil {
				return fmt.Errorf("write keyframeCount failed: %w", err)
			}
			// 写每个关键帧
			for _, kf := range pc.Keyframes {
				if err := utilities.WriteFloat32(w, kf.Time); err != nil {
					return fmt.Errorf("write keyframe time failed: %w", err)
				}
				if err := utilities.WriteFloat32(w, kf.Value); err != nil {
					return fmt.Errorf("write keyframe value failed: %w", err)
				}
				if err := utilities.WriteFloat32(w, kf.InTangent); err != nil {
					return fmt.Errorf("write keyframe inTangent failed: %w", err)
				}
				if err := utilities.WriteFloat32(w, kf.OutTangent); err != nil {
					return fmt.Errorf("write keyframe outTangent failed: %w", err)
				}
			}
		}
	}

	// 4. 写一个 0 标记骨骼曲线段结束
	if err := utilities.WriteByte(w, 0); err != nil {
		return fmt.Errorf("write end-of-bonedata mark failed: %w", err)
	}

	// 5. 写两个 byte，表示胸部动画标志
	// 非全身骨骼角色动画可以不写，但是写了也不会怎么样所以就写了
	var bustL, bustR byte
	if a.BustKeyLeft {
		bustL = 1
	} else {
		bustL = 0
	}
	if a.BustKeyRight {
		bustR = 1
	} else {
		bustR = 0
	}
	if err := utilities.WriteByte(w, bustL); err != nil {
		return fmt.Errorf("write bustKeyL failed: %w", err)
	}
	if err := utilities.WriteByte(w, bustR); err != nil {
		return fmt.Errorf("write bustKeyR failed: %w", err)
	}

	return nil
}
