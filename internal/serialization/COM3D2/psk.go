package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/utilities"
	"fmt"
	"io"
)

// Psk 整体描述一个 .psk 文件的结构
type Psk struct {
	Signature                    string              `json:"Signature"`                    // CM3D21_PSK
	Version                      int32               `json:"Version"`                      // 24201
	PanierRadius                 float32             `json:"PanierRadius"`                 // 裙撑半径
	PanierRadiusDistrib          AnimationCurve      `json:"PanierRadiusDistrib"`          // 裙撑半径分布曲线
	PanierRadiusDistribGroups    []PanierRadiusGroup `json:"PanierRadiusDistribGroups"`    // 裙撑半径分布组
	PanierForce                  float32             `json:"PanierForce"`                  // 裙撑力度
	PanierForceDistrib           AnimationCurve      `json:"PanierForceDistrib"`           // 裙撑力度分布曲线
	PanierStressForce            float32             `json:"PanierStressForce"`            // 裙撑应力
	StressDegreeMin              float32             `json:"StressDegreeMin"`              // 最小应力度
	StressDegreeMax              float32             `json:"StressDegreeMax"`              // 最大应力度
	StressMinScale               float32             `json:"StressMinScale"`               // 最小应力缩放
	ScaleEaseSpeed               float32             `json:"ScaleEaseSpeed"`               // 缩放平滑速度
	PanierForceDistanceThreshold float32             `json:"PanierForceDistanceThreshold"` // 裙撑力度距离阈值
	CalcTime                     int32               `json:"CalcTime"`                     // 计算时间
	VelocityForceRate            float32             `json:"VelocityForceRate"`            // 速度力率
	VelocityForceRateDistrib     AnimationCurve      `json:"VelocityForceRateDistrib"`     // 速度力率分布曲线
	Gravity                      Vector3             `json:"Gravity"`                      // 重力向量
	GravityDistrib               AnimationCurve      `json:"GravityDistrib"`               // 重力分布曲线
	HardValues                   [4]float32          `json:"HardValues"`                   // 硬度值数组
}

// PanierRadiusGroup 存储骨骼特定的半径信息
type PanierRadiusGroup struct {
	BoneName string         `json:"BoneName"`
	Radius   float32        `json:"Radius"`
	Curve    AnimationCurve `json:"Curve"`
}

// ReadPsk 读取并解析一个 .psk 文件，返回 Psk 结构。
func ReadPsk(r io.Reader) (*Psk, error) {
	psk := &Psk{}

	// 1. 读取签名字符串 "CM3D21_PSK"
	sig, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("read psk signature failed: %w", err)
	}
	//if sig != "CM3D21_PSK" {
	//	return nil, fmt.Errorf("invalid .psk signature: got %q, want CM3D21_PSK", sig)
	//}
	psk.Signature = sig

	// 2. 读取版本号 int32
	ver, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("read psk version failed: %w", err)
	}
	psk.Version = ver

	// 3. 读取裙撑半径
	panierRadius, err := utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read panier radius failed: %w", err)
	}
	psk.PanierRadius = panierRadius

	// 4. 读取裙撑半径分布曲线
	panierRadiusDistrib, err := ReadAnimationCurve(r)
	if err != nil {
		return nil, fmt.Errorf("read panier radius distribution curve failed: %w", err)
	}
	psk.PanierRadiusDistrib = panierRadiusDistrib

	// 5. 判断版本号并读取裙撑半径分布组
	if ver >= 217 { //2.1.7? no idea, now this version fellow game version like 2.42.1 will be 24201
		groupCount, err := utilities.ReadInt32(r)
		if err != nil {
			return nil, fmt.Errorf("read panier radius group count failed: %w", err)
		}

		if groupCount > 0 {
			psk.PanierRadiusDistribGroups = make([]PanierRadiusGroup, groupCount)
			for i := 0; i < int(groupCount); i++ {
				boneName, err := utilities.ReadString(r)
				if err != nil {
					return nil, fmt.Errorf("read bone name failed: %w", err)
				}

				radius, err := utilities.ReadFloat32(r)
				if err != nil {
					return nil, fmt.Errorf("read radius failed: %w", err)
				}

				curve, err := ReadAnimationCurve(r)
				if err != nil {
					return nil, fmt.Errorf("read curve failed: %w", err)
				}

				psk.PanierRadiusDistribGroups[i] = PanierRadiusGroup{
					BoneName: boneName,
					Radius:   radius,
					Curve:    curve,
				}
			}
		}
	}

	// 6. 读取裙撑力度
	panierForce, err := utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read panier force failed: %w", err)
	}
	psk.PanierForce = panierForce

	// 7. 读取裙撑力度分布曲线
	panierForceDistrib, err := ReadAnimationCurve(r)
	if err != nil {
		return nil, fmt.Errorf("read panier force distribution curve failed: %w", err)
	}
	psk.PanierForceDistrib = panierForceDistrib

	// 8. 读取裙撑应力
	panierStressForce, err := utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read panier stress force failed: %w", err)
	}
	psk.PanierStressForce = panierStressForce

	// 9. 读取最小应力度
	stressDegreeMin, err := utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read stress degree min failed: %w", err)
	}
	psk.StressDegreeMin = stressDegreeMin

	// 10. 读取最大应力度
	stressDegreeMax, err := utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read stress degree max failed: %w", err)
	}
	psk.StressDegreeMax = stressDegreeMax

	// 11. 读取最小应力缩放
	stressMinScale, err := utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read stress min scale failed: %w", err)
	}
	psk.StressMinScale = stressMinScale

	// 12. 读取缩放平滑速度
	scaleEaseSpeed, err := utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read scale ease speed failed: %w", err)
	}
	psk.ScaleEaseSpeed = scaleEaseSpeed

	// 13. 读取裙撑力度距离阈值
	panierForceDistanceThreshold, err := utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read panier force distance threshold failed: %w", err)
	}
	psk.PanierForceDistanceThreshold = panierForceDistanceThreshold

	// 14. 读取计算时间
	calcTime, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("read calc time failed: %w", err)
	}
	psk.CalcTime = calcTime

	// 15. 读取速度力率
	velocityForceRate, err := utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read velocity force rate failed: %w", err)
	}
	psk.VelocityForceRate = velocityForceRate

	// 16. 读取速度力率分布曲线
	velocityForceRateDistrib, err := ReadAnimationCurve(r)
	if err != nil {
		return nil, fmt.Errorf("read velocity force rate distribution curve failed: %w", err)
	}
	psk.VelocityForceRateDistrib = velocityForceRateDistrib

	// 17. 读取重力向量
	gravityX, err := utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read gravity X failed: %w", err)
	}
	gravityY, err := utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read gravity Y failed: %w", err)
	}
	gravityZ, err := utilities.ReadFloat32(r)
	if err != nil {
		return nil, fmt.Errorf("read gravity Z failed: %w", err)
	}
	psk.Gravity = Vector3{X: gravityX, Y: gravityY, Z: gravityZ}

	// 18. 读取重力分布曲线
	gravityDistrib, err := ReadAnimationCurve(r)
	if err != nil {
		return nil, fmt.Errorf("read gravity distribution curve failed: %w", err)
	}
	psk.GravityDistrib = gravityDistrib

	// 19. 读取硬度值数组
	for i := 0; i < 4; i++ {
		hardValue, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("read hard value %d failed: %w", i, err)
		}
		psk.HardValues[i] = hardValue
	}

	return psk, nil
}

// Dump 将 Psk 结构写到 w 中，生成符合 CM3D21_PSK 格式的二进制数据。
func (p Psk) Dump(w io.Writer) error {
	// 1. 写签名
	if err := utilities.WriteString(w, p.Signature); err != nil {
		return fmt.Errorf("write psk signature failed: %w", err)
	}

	// 2. 写版本号
	if err := utilities.WriteInt32(w, p.Version); err != nil {
		return fmt.Errorf("write psk version failed: %w", err)
	}

	// 3. 写裙撑半径
	if err := utilities.WriteFloat32(w, p.PanierRadius); err != nil {
		return fmt.Errorf("write panier radius failed: %w", err)
	}

	// 4. 写裙撑半径分布曲线
	if err := WriteAnimationCurve(w, p.PanierRadiusDistrib); err != nil {
		return fmt.Errorf("write panier radius distribution curve failed: %w", err)
	}

	// 5. 写裙撑半径分布组
	groupCount := int32(len(p.PanierRadiusDistribGroups))
	if err := utilities.WriteInt32(w, groupCount); err != nil {
		return fmt.Errorf("write panier radius group count failed: %w", err)
	}

	for i := 0; i < int(groupCount); i++ {
		group := p.PanierRadiusDistribGroups[i]
		if err := utilities.WriteString(w, group.BoneName); err != nil {
			return fmt.Errorf("write bone name failed: %w", err)
		}

		if err := utilities.WriteFloat32(w, group.Radius); err != nil {
			return fmt.Errorf("write radius failed: %w", err)
		}

		if err := WriteAnimationCurve(w, group.Curve); err != nil {
			return fmt.Errorf("write curve failed: %w", err)
		}
	}

	// 6. 写裙撑力度
	if err := utilities.WriteFloat32(w, p.PanierForce); err != nil {
		return fmt.Errorf("write panier force failed: %w", err)
	}

	// 7. 写裙撑力度分布曲线
	if err := WriteAnimationCurve(w, p.PanierForceDistrib); err != nil {
		return fmt.Errorf("write panier force distribution curve failed: %w", err)
	}

	// 8. 写裙撑应力
	if err := utilities.WriteFloat32(w, p.PanierStressForce); err != nil {
		return fmt.Errorf("write panier stress force failed: %w", err)
	}

	// 9. 写最小应力度
	if err := utilities.WriteFloat32(w, p.StressDegreeMin); err != nil {
		return fmt.Errorf("write stress degree min failed: %w", err)
	}

	// 10. 写最大应力度
	if err := utilities.WriteFloat32(w, p.StressDegreeMax); err != nil {
		return fmt.Errorf("write stress degree max failed: %w", err)
	}

	// 11. 写最小应力缩放
	if err := utilities.WriteFloat32(w, p.StressMinScale); err != nil {
		return fmt.Errorf("write stress min scale failed: %w", err)
	}

	// 12. 写缩放平滑速度
	if err := utilities.WriteFloat32(w, p.ScaleEaseSpeed); err != nil {
		return fmt.Errorf("write scale ease speed failed: %w", err)
	}

	// 13. 写裙撑力度距离阈值
	if err := utilities.WriteFloat32(w, p.PanierForceDistanceThreshold); err != nil {
		return fmt.Errorf("write panier force distance threshold failed: %w", err)
	}

	// 14. 写计算时间
	if err := utilities.WriteInt32(w, p.CalcTime); err != nil {
		return fmt.Errorf("write calc time failed: %w", err)
	}

	// 15. 写速度力率
	if err := utilities.WriteFloat32(w, p.VelocityForceRate); err != nil {
		return fmt.Errorf("write velocity force rate failed: %w", err)
	}

	// 16. 写速度力率分布曲线
	if err := WriteAnimationCurve(w, p.VelocityForceRateDistrib); err != nil {
		return fmt.Errorf("write velocity force rate distribution curve failed: %w", err)
	}

	// 17. 写重力向量
	if err := utilities.WriteFloat32(w, p.Gravity.X); err != nil {
		return fmt.Errorf("write gravity X failed: %w", err)
	}
	if err := utilities.WriteFloat32(w, p.Gravity.Y); err != nil {
		return fmt.Errorf("write gravity Y failed: %w", err)
	}
	if err := utilities.WriteFloat32(w, p.Gravity.Z); err != nil {
		return fmt.Errorf("write gravity Z failed: %w", err)
	}

	// 18. 写重力分布曲线
	if err := WriteAnimationCurve(w, p.GravityDistrib); err != nil {
		return fmt.Errorf("write gravity distribution curve failed: %w", err)
	}

	// 19. 写硬度值数组
	for i := 0; i < 4; i++ {
		if err := utilities.WriteFloat32(w, p.HardValues[i]); err != nil {
			return fmt.Errorf("write hard value %d failed: %w", i, err)
		}
	}

	return nil
}
