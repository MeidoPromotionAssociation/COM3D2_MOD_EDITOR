package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/utilities"
	"fmt"
	"io"
)

// CM3D2_MESH
//
// CM3D2 支持 1000 - 2000 版本
// COM3D2 支持 1000 到 2001 版本，2100 版本的额外数据追加在文件末尾，不影响解析，应当可以正常读取，但无实际功能
// COM3D2_5 支持 1000 到 2200 以下版本
//
// 1000 - 2000 版本
// 基础版本
// 支持基本的骨骼、网格、UV、法线、切线数据
// 支持材质和基本的形态数据
//
// 2001 版本
// 新增 localScale 支持
//
// 2100 版本
// 新增 SkinThickness 支持
//
// 版本 2101
// 新增更多 UV 通道支持 (UV2, UV3, UV4)
// 新增多个未知标志位读取
//
// 版本 2102
// 新增 Morph Tangents 支持
//
// 版本 2104 及以上但低于 2200 版本
// 新增 ShadowCastingMode 支持
//
// 版本 2100 及以上但低于 2200 版本
// 验证文件名，必须以 crc_ 或 crx_ 或 gp03_ 开头
// 对于这些特殊前缀的文件，跳过了 "Bip01" 骨骼的无权重移除
//
// 版本 2200
// 未知

// Model 对应 .model 文件
// aka 皮肤网格文件结构 SkinMesh
type Model struct {
	Signature         string         `json:"Signature"`                   // "CM3D2_MESH"
	Version           int32          `json:"Version"`                     // 2001
	Name              string         `json:"Name"`                        // 模型名称
	RootBoneName      string         `json:"RootBoneName"`                // 根骨骼名称
	ShadowCastingMode *string        `json:"ShadowCastingMode,omitempty"` // 定义如何投射阴影，Unity 的 ShadowCastingMode 的字符串表示
	Bones             []*Bone        `json:"Bones"`                       // 骨骼数据
	VertCount         int32          `json:"VertCount"`                   // 顶点数量
	SubMeshCount      int32          `json:"SubMeshCount"`                // 子网格数量
	BoneCount         int32          `json:"BoneCount"`                   // 骨骼数量
	BoneNames         []string       `json:"BoneNames"`                   // 骨骼名称列表
	BindPoses         []Matrix4x4    `json:"BindPoses"`                   // 绑定姿势
	Vertices          []Vertex       `json:"Vertices"`                    // 顶点数据
	Tangents          []Quaternion   `json:"Tangents,omitempty"`          // 切线数据
	BoneWeights       []BoneWeight   `json:"BoneWeights"`                 // 骨骼权重数据
	SubMeshes         [][]int32      `json:"SubMeshes"`                   // 子网格索引列表
	Materials         []*Material    `json:"Materials"`                   // 材质数据
	MorphData         []*MorphData   `json:"MorphData,omitempty"`         // 形态数据
	SkinThickness     *SkinThickness `json:"SkinThickness,omitempty"`     // 皮肤厚度数据
}

// Bone 表示骨骼数据
type Bone struct {
	Name        string     `json:"Name"`            // 骨骼名称
	HasScale    bool       `json:"HasScale"`        // 是否有缩放
	ParentIndex int32      `json:"ParentIndex"`     // 父骨骼索引
	Position    Vector3    `json:"Position"`        // 骨骼位置
	Rotation    Quaternion `json:"Rotation"`        // 骨骼旋转
	Scale       *Vector3   `json:"Scale,omitempty"` // 骨骼缩放
}

// Vertex 表示顶点数据
type Vertex struct {
	Position Vector3  `json:"Position"`           // 顶点位置
	Normal   Vector3  `json:"Normal"`             // 顶点法线
	UV       Vector2  `json:"UV"`                 // 顶点 UV 坐标
	UV2      *Vector2 `json:"UV2,omitempty"`      // 顶点 UV2 坐标
	UV3      *Vector2 `json:"UV3,omitempty"`      // 顶点 UV3 坐标
	UV4      *Vector2 `json:"UV4,omitempty"`      // 顶点 UV4 坐标
	Unknown1 *Vector2 `json:"Unknown1,omitempty"` // 顶点未知 1 坐标
	Unknown2 *Vector2 `json:"Unknown2,omitempty"` // 顶点未知 2 坐标
	Unknown3 *Vector2 `json:"Unknown3,omitempty"` // 顶点未知 3 坐标
	Unknown4 *Vector2 `json:"Unknown4,omitempty"` // 顶点未知 4 坐标
}

// BoneWeight 表示骨骼权重
type BoneWeight struct {
	BoneIndex0 uint16  `json:"BoneIndex0"` // 骨骼索引
	BoneIndex1 uint16  `json:"BoneIndex1"`
	BoneIndex2 uint16  `json:"BoneIndex2"`
	BoneIndex3 uint16  `json:"BoneIndex3"`
	Weight0    float32 `json:"Weight0"` // 权重
	Weight1    float32 `json:"Weight1"`
	Weight2    float32 `json:"Weight2"`
	Weight3    float32 `json:"Weight3"`
}

// MorphData 表示形态数据
type MorphData struct {
	Name     string       `json:"Name"`               // 形态名称
	Indices  []int        `json:"Indices"`            // 顶点索引
	Vertex   []Vector3    `json:"Vertex"`             // 顶点位置
	Normals  []Vector3    `json:"Normals"`            // 顶点法线
	Tangents []Quaternion `json:"Tangents,omitempty"` // 切线，版本 2102 新增
}

// SkinThickness 表示皮肤厚度数据
type SkinThickness struct {
	Version int32                  `json:"Version"` // 版本号
	Use     bool                   `json:"Use"`     // 是否使用皮肤厚度
	Groups  map[string]*ThickGroup `json:"Groups"`  // 皮肤厚度组
}

// ThickGroup 表示皮肤厚度组
type ThickGroup struct {
	GroupName       string        `json:"GroupName"`       // 组名称
	StartBoneName   string        `json:"StartBoneName"`   // 起始骨骼名称
	EndBoneName     string        `json:"EndBoneName"`     // 结束骨骼名称
	StepAngleDegree int32         `json:"StepAngleDegree"` // 角度步长
	Points          []*ThickPoint `json:"Points"`          // 皮肤厚度点
}

// ThickPoint 表示皮肤厚度点
type ThickPoint struct {
	TargetBoneName         string              `json:"TargetBoneName"`         // 目标骨骼名称
	RatioSegmentStartToEnd float32             `json:"RatioSegmentStartToEnd"` // 起始到结束的比例
	DistanceParAngle       []*ThickDefPerAngle `json:"DistanceParAngle"`       // 距离和角度定义
}

// ThickDefPerAngle 表示每个角度的皮肤厚度定义
type ThickDefPerAngle struct {
	AngleDegree     int32   `json:"AngleDegree"`     // 角度
	VertexIndex     int32   `json:"VertexIndex"`     // 顶点索引
	DefaultDistance float32 `json:"DefaultDistance"` // 默认距离
}

// 阴影投射方式，对应 Unity 的 ShadowCastingMode
const (
	ShadowCastingModeOff         = "Off"         // 不投射阴影
	ShadowCastingModeOn          = "On"          // 投射阴影
	ShadowCastingModeTwoSided    = "TwoSided"    // 双面投射阴影
	ShadowCastingModeShadowsOnly = "ShadowsOnly" // 只投射阴影
)

// ReadModel 从 r 中读取皮肤网格数据
func ReadModel(r io.Reader) (*Model, error) {
	model := &Model{}

	// 读取文件头
	var err error
	// 读取签名
	model.Signature, err = utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read signature: %w", err)
	}
	//if model.Signature != "CM3D2_MESH" {
	//	return nil, fmt.Errorf("invalid .model signature: got %q, want %s", sig, MateSignature)
	//}

	// 读取版本号
	model.Version, err = utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read version: %w", err)
	}

	// 读取模型名称
	model.Name, err = utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read name: %w", err)
	}

	// 读取根骨骼名称
	model.RootBoneName, err = utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read root bone name: %w", err)
	}

	// 读取骨骼数量
	boneCount, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read bone count: %w", err)
	}

	// 读取阴影投射方式
	if model.Version >= 2104 && model.Version < 2200 {
		shadowCastingMode, err := utilities.ReadString(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read shadow casting mode: %w", err)
		}
		model.ShadowCastingMode = &shadowCastingMode
	}

	model.Bones = make([]*Bone, boneCount)
	for i := int32(0); i < boneCount; i++ {
		bone := &Bone{}

		bone.Name, err = utilities.ReadString(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone name: %w", err)
		}

		hasScale, err := utilities.ReadByte(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone scaling flags: %w", err)
		}
		bone.HasScale = hasScale != 0

		model.Bones[i] = bone
	}

	// 读取骨骼父子关系
	for i := int32(0); i < boneCount; i++ {
		parentIndex, err := utilities.ReadInt32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone parent index: %w", err)
		}
		model.Bones[i].ParentIndex = parentIndex
	}

	// 读取骨骼变换信息
	for i := int32(0); i < boneCount; i++ {
		bone := model.Bones[i]

		// 位置
		x, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone position X: %w", err)
		}
		y, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone position Y: %w", err)
		}
		z, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone position Z: %w", err)
		}
		bone.Position = Vector3{X: x, Y: y, Z: z}

		// 旋转
		x, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone rotation X: %w", err)
		}
		y, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone rotation Y: %w", err)
		}
		z, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone rotation Z: %w", err)
		}
		w, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone rotation W: %w", err)
		}
		bone.Rotation = Quaternion{X: x, Y: y, Z: z, W: w}

		// 如果版本大于等于2001且有缩放
		if model.Version >= 2001 {
			hasScale, err := utilities.ReadBool(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read bone scaling flags: %w", err)
			}

			if hasScale {
				x, err := utilities.ReadFloat32(r) // 读取缩放X
				if err != nil {
					return nil, fmt.Errorf("failed to read bone scale X: %w", err)
				}
				y, err := utilities.ReadFloat32(r)
				if err != nil {
					return nil, fmt.Errorf("failed to read bone scale Y: %w", err)
				}
				z, err := utilities.ReadFloat32(r)
				if err != nil {
					return nil, fmt.Errorf("failed to read bone scale Z: %w", err)
				}
				bone.Scale = &Vector3{X: x, Y: y, Z: z}
			}
		}
	}

	// 读取网格基本信息
	model.VertCount, err = utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read the number of vertices: %w", err)
	}

	model.SubMeshCount, err = utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read the number of subgrids: %w", err)
	}

	model.BoneCount, err = utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read the number of bones: %w", err)
	}

	// 读取骨骼名称
	boneNames := make([]string, model.BoneCount)
	for i := int32(0); i < model.BoneCount; i++ {
		boneName, err := utilities.ReadString(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone name (at bone index): %w", err)
		}
		boneNames[i] = boneName
	}
	model.BoneNames = boneNames

	// 读取骨骼绑定姿势
	bindPoses := make([]Matrix4x4, model.BoneCount)
	for i := int32(0); i < model.BoneCount; i++ {
		matrix, err := utilities.ReadFloat4x4(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read the armature binding pose: %w", err)
		}
		bindPoses[i] = matrix
	}
	model.BindPoses = bindPoses

	// 如果版本为 2101 或更高，读取额外标志位
	hasUV2 := false
	hasUV3 := false
	hasUV4 := false
	hasUnknownFlag1 := false
	hasUnknownFlag2 := false
	hasUnknownFlag3 := false
	hasUnknownFlag4 := false

	if model.Version >= 2101 {
		hasUV2, err = utilities.ReadBool(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read UV2 flag: %w", err)
		}

		hasUV3, err = utilities.ReadBool(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read UV3 flag: %w", err)
		}

		hasUV4, err = utilities.ReadBool(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read UV4 flag: %w", err)
		}

		hasUnknownFlag1, err = utilities.ReadBool(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read unknown flag 1: %w", err)
		}

		hasUnknownFlag2, err = utilities.ReadBool(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read unknown flag 2: %w", err)
		}

		hasUnknownFlag3, err = utilities.ReadBool(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read unknown flag 3: %w", err)
		}

		hasUnknownFlag4, err = utilities.ReadBool(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read unknown flag 4: %w", err)
		}
	}

	// 读取顶点数据
	model.Vertices = make([]Vertex, model.VertCount)
	for i := int32(0); i < model.VertCount; i++ {
		// 顶点位置
		x, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read vertex position X: %w", err)
		}
		y, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read vertex position Y: %w", err)
		}
		z, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read vertex position Z: %w", err)
		}
		model.Vertices[i].Position = Vector3{X: x, Y: y, Z: z}

		// 法线
		x, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read vertex normal X: %w", err)
		}
		y, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read vertex normal Y: %w", err)
		}
		z, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read vertex normal Z: %w", err)
		}
		model.Vertices[i].Normal = Vector3{X: x, Y: y, Z: z}

		// UV 坐标
		uvX, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read vertex UV coordinate X: %w", err)
		}
		uvY, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read vertex UV coordinate Y: %w", err)
		}
		model.Vertices[i].UV = Vector2{X: uvX, Y: uvY}

		if hasUV2 {
			uv2X, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read vertex UV2 coordinate X: %w", err)
			}
			uv2Y, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read vertex UV2 coordinate Y: %w", err)
			}
			model.Vertices[i].UV2 = &Vector2{X: uv2X, Y: uv2Y}
		}

		if hasUV3 {
			uv3X, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read vertex UV3 coordinate X: %w", err)
			}
			uv3Y, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read vertex UV3 coordinate Y: %w", err)
			}
			model.Vertices[i].UV3 = &Vector2{X: uv3X, Y: uv3Y}
		}

		if hasUV4 {
			uv4X, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read vertex UV4 coordinate X: %w", err)
			}
			uv4Y, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read vertex UV4 coordinate Y: %w", err)
			}
			model.Vertices[i].UV4 = &Vector2{X: uv4X, Y: uv4Y}
		}

		// 读取未知标志位对应的数据
		if hasUnknownFlag1 {
			unknownX1, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read unknown flag 1 data X: %w", err)
			}
			unknownY1, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read unknown flag 1 data Y: %w", err)
			}
			model.Vertices[i].Unknown1 = &Vector2{X: unknownX1, Y: unknownY1}
		}

		if hasUnknownFlag2 {
			unknownX2, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read unknown flag 2 data X: %w", err)
			}
			unknownY2, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read unknown flag 2 data Y: %w", err)
			}
			model.Vertices[i].Unknown2 = &Vector2{X: unknownX2, Y: unknownY2}
		}

		if hasUnknownFlag3 {
			unknownX3, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read unknown flag 3 data X: %w", err)
			}
			unknownY3, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read unknown flag 3 data Y: %w", err)
			}
			model.Vertices[i].Unknown3 = &Vector2{X: unknownX3, Y: unknownY3}
		}

		if hasUnknownFlag4 {
			unknownX4, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read unknown flag 4 data X: %w", err)
			}
			unknownY4, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read unknown flag 4 data Y: %w", err)
			}
			model.Vertices[i].Unknown4 = &Vector2{X: unknownX4, Y: unknownY4}
		}
	}

	// 读取切线数据
	tangentCount, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read the number of tangents: %w", err)
	}

	if tangentCount > 0 {
		model.Tangents = make([]Quaternion, tangentCount)
		for i := int32(0); i < tangentCount; i++ {
			x, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read tangent X: %w", err)
			}
			y, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read tangent Y: %w", err)
			}
			z, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read tangent Z: %w", err)
			}
			w, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read tangent W: %w", err)
			}
			model.Tangents[i] = Quaternion{X: x, Y: y, Z: z, W: w}
		}
	}

	// 读取骨骼权重
	model.BoneWeights = make([]BoneWeight, model.VertCount)
	for i := int32(0); i < model.VertCount; i++ {
		bw := &model.BoneWeights[i]

		bw.BoneIndex0, err = utilities.ReadUInt16(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone weight index 0: %w", err)
		}

		bw.BoneIndex1, err = utilities.ReadUInt16(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone weight index 1: %w", err)
		}

		bw.BoneIndex2, err = utilities.ReadUInt16(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone weight index 2: %w", err)
		}

		bw.BoneIndex3, err = utilities.ReadUInt16(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone weight index 3: %w", err)
		}

		bw.Weight0, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone weight 0: %w", err)
		}

		bw.Weight1, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone weight 1: %w", err)
		}

		bw.Weight2, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone weight 2: %w", err)
		}

		bw.Weight3, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read bone weight 3: %w", err)
		}
	}

	// 读取子网格数据
	model.SubMeshes = make([][]int32, model.SubMeshCount)
	for i := int32(0); i < model.SubMeshCount; i++ {
		triCount, err := utilities.ReadInt32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read submesh triangle count: %w", err)
		}

		triangles := make([]int32, triCount)
		for j := int32(0); j < triCount; j++ {
			index, err := utilities.ReadUInt16(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read submesh triangle index: %w", err)
			}
			triangles[j] = int32(index)
		}
		model.SubMeshes[i] = triangles
	}

	// 读取材质数据
	materialCount, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read the number of materials: %w", err)
	}
	model.Materials = make([]*Material, materialCount)
	for i := int32(0); i < materialCount; i++ {
		model.Materials[i], err = readMaterial(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read material: %w", err)
		}
	}

	// 读取形态数据数据
	for {
		tag, err := utilities.ReadString(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read tag: %w", err)
		}

		if tag == EndTag {
			break
		}

		if tag == "morph" {
			morphData, err := ReadMorphData(r, model.Version)
			if err != nil {
				return nil, fmt.Errorf("failed to read morph data: %w", err)
			}
			model.MorphData = append(model.MorphData, morphData)
		}
	}

	// 检查版本号，读取SkinThickness
	if model.Version >= 2100 {
		hasSkinThickness, err := utilities.ReadInt32(r)
		if err != nil {
			// 这可能是文件结束，不返回错误
			if err == io.EOF {
				return model, nil
			}
			return nil, fmt.Errorf("failed to read skin thickness flag: %w", err)
		}

		if hasSkinThickness != 0 {
			model.SkinThickness, err = ReadSkinThickness(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read skin thickness: %w", err)
			}
		}
	}

	return model, nil
}

// ReadMorphData 从r中读取形态数据
func ReadMorphData(r io.Reader, version int32) (*MorphData, error) {
	md := &MorphData{}
	var err error

	md.Name, err = utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read the morph name: %w", err)
	}

	vertCount, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read the number of morph vertices: %w", err)
	}

	md.Indices = make([]int, vertCount)
	md.Vertex = make([]Vector3, vertCount)
	md.Normals = make([]Vector3, vertCount)

	// 2102 版本支持
	hasTangents := false
	if version >= 2102 {
		hasTangents, err = utilities.ReadBool(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read has tangents flag: %w", err)
		}

		if hasTangents {
			md.Tangents = make([]Quaternion, vertCount)
		}
	}

	for i := int32(0); i < vertCount; i++ {
		index, err := utilities.ReadUInt16(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read the morph vertex index.: %w", err)
		}
		md.Indices[i] = int(index)

		// 读取顶点位移
		x, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read morph vertex displacement X: %w", err)
		}
		y, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read morph vertex displacement Y: %w", err)
		}
		z, err := utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read morph vertex displacement Z: %w", err)
		}
		md.Vertex[i] = Vector3{X: x, Y: y, Z: z}

		// 读取法线位移
		x, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read the morph normal displacement X: %w", err)
		}
		y, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read the morph normal displacement Y: %w", err)
		}
		z, err = utilities.ReadFloat32(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read the morph normal displacement Z: %w", err)
		}
		md.Normals[i] = Vector3{X: x, Y: y, Z: z}

		// 如果有切线数据，读取切线
		if hasTangents {
			x, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read morph tangent X: %w", err)
			}
			y, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read morph tangent Y: %w", err)
			}
			z, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read morph tangent Z: %w", err)
			}
			w, err := utilities.ReadFloat32(r)
			if err != nil {
				return nil, fmt.Errorf("failed to read morph tangent W: %w", err)
			}
			md.Tangents[i] = Quaternion{X: x, Y: y, Z: z, W: w}
		}
	}

	return md, nil
}

// ReadSkinThickness 从r中读取皮肤厚度数据
func ReadSkinThickness(r io.Reader) (*SkinThickness, error) {
	skinThickness := &SkinThickness{
		Groups: make(map[string]*ThickGroup),
	}

	signature, err := utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read skin thickness signature: %w", err)
	}
	if signature != "SkinThickness" {
		return nil, fmt.Errorf("invalid skin thickness signature: got %q, want 'SkinThickness'", signature)
	}

	// 读取版本号
	skinThickness.Version, err = utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read skin thickness version: %w", err)
	}

	// 读取使用标志
	skinThickness.Use, err = utilities.ReadBool(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read skin thickness use flag: %w", err)
	}

	// 读取组数量
	groupCount, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read skin thickness group count: %w", err)
	}

	// 读取每个组
	for i := int32(0); i < groupCount; i++ {
		key, err := utilities.ReadString(r)
		if err != nil {
			return nil, fmt.Errorf("failed to read skin thickness group key: %w", err)
		}

		group := &ThickGroup{}
		err = readThickGroup(r, group)
		if err != nil {
			return nil, fmt.Errorf("failed to read skin thickness group: %w", err)
		}

		skinThickness.Groups[key] = group
	}

	return skinThickness, nil
}

// readThickGroup 从r中读取皮肤厚度组数据
func readThickGroup(r io.Reader, group *ThickGroup) error {
	var err error

	// 读取组名
	group.GroupName, err = utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("failed to read group name: %w", err)
	}

	// 读取起始骨骼名
	group.StartBoneName, err = utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("failed to read start bone name: %w", err)
	}

	// 读取结束骨骼名
	group.EndBoneName, err = utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("failed to read end bone name: %w", err)
	}

	// 读取角度步长
	group.StepAngleDegree, err = utilities.ReadInt32(r)
	if err != nil {
		return fmt.Errorf("failed to read step angle degree: %w", err)
	}

	// 读取点数量
	pointCount, err := utilities.ReadInt32(r)
	if err != nil {
		return fmt.Errorf("failed to read point count: %w", err)
	}

	// 读取每个点
	group.Points = make([]*ThickPoint, pointCount)
	for i := int32(0); i < pointCount; i++ {
		point := &ThickPoint{}
		err = readThickPoint(r, point)
		if err != nil {
			return fmt.Errorf("failed to read point: %w", err)
		}
		group.Points[i] = point
	}

	return nil
}

// readThickPoint 从r中读取皮肤厚度点数据
func readThickPoint(r io.Reader, point *ThickPoint) error {
	var err error

	// 读取目标骨骼名
	point.TargetBoneName, err = utilities.ReadString(r)
	if err != nil {
		return fmt.Errorf("failed to read target bone name: %w", err)
	}

	// 读取起始到结束的比例
	point.RatioSegmentStartToEnd, err = utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("failed to read ratio segment start to end: %w", err)
	}

	// 读取角度定义数量
	angleDefCount, err := utilities.ReadInt32(r)
	if err != nil {
		return fmt.Errorf("failed to read angle definition count: %w", err)
	}

	// 读取每个角度定义
	point.DistanceParAngle = make([]*ThickDefPerAngle, angleDefCount)
	for i := int32(0); i < angleDefCount; i++ {
		angleDef := &ThickDefPerAngle{}
		err = readThickDefPerAngle(r, angleDef)
		if err != nil {
			return fmt.Errorf("failed to read angle definition: %w", err)
		}
		point.DistanceParAngle[i] = angleDef
	}

	return nil
}

// readThickDefPerAngle 从r中读取每个角度的皮肤厚度定义
func readThickDefPerAngle(r io.Reader, angleDef *ThickDefPerAngle) error {
	var err error

	// 读取角度
	angleDef.AngleDegree, err = utilities.ReadInt32(r)
	if err != nil {
		return fmt.Errorf("failed to read angle degree: %w", err)
	}

	// 读取顶点索引
	angleDef.VertexIndex, err = utilities.ReadInt32(r)
	if err != nil {
		return fmt.Errorf("failed to read vertex index: %w", err)
	}

	// 读取默认距离
	angleDef.DefaultDistance, err = utilities.ReadFloat32(r)
	if err != nil {
		return fmt.Errorf("failed to read default distance: %w", err)
	}

	return nil
}

func (m *Model) Dump(w io.Writer) error {
	// 写入文件头
	// 写入签名
	if err := utilities.WriteString(w, m.Signature); err != nil {
		return fmt.Errorf("failed to write signature: %w", err)
	}

	// 写入版本号
	if err := utilities.WriteInt32(w, m.Version); err != nil {
		return fmt.Errorf("failed to write version: %w", err)
	}

	// 写入模型名称
	if err := utilities.WriteString(w, m.Name); err != nil {
		return fmt.Errorf("failed to write name: %w", err)
	}

	// 写入根骨骼名称
	if err := utilities.WriteString(w, m.RootBoneName); err != nil {
		return fmt.Errorf("failed to write root bone name: %w", err)
	}

	// 写入骨骼数量
	if err := utilities.WriteInt32(w, int32(len(m.Bones))); err != nil {
		return fmt.Errorf("failed to write bone count: %w", err)
	}

	// 写入阴影投射方式（如果版本支持）
	if m.Version >= 2104 && m.Version < 2200 {
		if err := utilities.WriteString(w, *m.ShadowCastingMode); err != nil {
			return fmt.Errorf("failed to write shadow casting mode: %w", err)
		}
	}

	// 写入骨骼数据
	for _, bone := range m.Bones {
		// 写入骨骼名称
		if err := utilities.WriteString(w, bone.Name); err != nil {
			return fmt.Errorf("failed to write bone name: %w", err)
		}

		// 写入骨骼缩放标志
		if err := utilities.WriteByte(w, utilities.BoolToByte(bone.HasScale)); err != nil {
			return fmt.Errorf("failed to write bone scaling flags: %w", err)
		}
	}

	// 写入骨骼父子关系
	for _, bone := range m.Bones {
		// 写入父骨骼索引
		if err := utilities.WriteInt32(w, bone.ParentIndex); err != nil {
			return fmt.Errorf("failed to write bone parent index: %w", err)
		}
	}

	// 写入骨骼变换信息
	for _, bone := range m.Bones {
		// 写入位置
		if err := utilities.WriteFloat32(w, bone.Position.X); err != nil {
			return fmt.Errorf("failed to write bone position X: %w", err)
		}
		if err := utilities.WriteFloat32(w, bone.Position.Y); err != nil {
			return fmt.Errorf("failed to write bone position Y: %w", err)
		}
		if err := utilities.WriteFloat32(w, bone.Position.Z); err != nil {
			return fmt.Errorf("failed to write bone position Z: %w", err)
		}

		// 写入旋转
		if err := utilities.WriteFloat32(w, bone.Rotation.X); err != nil {
			return fmt.Errorf("failed to write bone rotation X: %w", err)
		}
		if err := utilities.WriteFloat32(w, bone.Rotation.Y); err != nil {
			return fmt.Errorf("failed to write bone rotation Y: %w", err)
		}
		if err := utilities.WriteFloat32(w, bone.Rotation.Z); err != nil {
			return fmt.Errorf("failed to write bone rotation Z: %w", err)
		}
		if err := utilities.WriteFloat32(w, bone.Rotation.W); err != nil {
			return fmt.Errorf("failed to write bone rotation W: %w", err)
		}

		// 如果版本大于等于2001，处理骨骼缩放
		if m.Version >= 2001 {
			hasScale := bone.Scale != nil
			if err := utilities.WriteBool(w, hasScale); err != nil {
				return fmt.Errorf("failed to write bone scaling flag: %w", err)
			}

			if hasScale {
				if err := utilities.WriteFloat32(w, bone.Scale.X); err != nil {
					return fmt.Errorf("failed to write bone scale X: %w", err)
				}
				if err := utilities.WriteFloat32(w, bone.Scale.Y); err != nil {
					return fmt.Errorf("failed to write bone scale Y: %w", err)
				}
				if err := utilities.WriteFloat32(w, bone.Scale.Z); err != nil {
					return fmt.Errorf("failed to write bone scale Z: %w", err)
				}
			}
		}
	}

	// 写入网格基本信息
	if err := utilities.WriteInt32(w, m.VertCount); err != nil {
		return fmt.Errorf("failed to write the number of vertices: %w", err)
	}

	if err := utilities.WriteInt32(w, m.SubMeshCount); err != nil {
		return fmt.Errorf("failed to write the number of subgrids: %w", err)
	}

	if err := utilities.WriteInt32(w, m.BoneCount); err != nil {
		return fmt.Errorf("failed to write the number of bones: %w", err)
	}

	// 写入骨骼名称
	for _, boneName := range m.BoneNames {
		if err := utilities.WriteString(w, boneName); err != nil {
			return fmt.Errorf("failed to write bone name (at bone index): %w", err)
		}
	}

	// 写入骨骼绑定姿势
	for _, bindPose := range m.BindPoses {
		if err := utilities.WriteFloat4x4(w, bindPose); err != nil {
			return fmt.Errorf("failed to write the armature binding pose: %w", err)
		}
	}

	// 如果版本为 2101 或更高，写入额外标志位
	if m.Version >= 2101 {
		// 确定是否有UV2、UV3、UV4和未知标志位
		hasUV2 := false
		hasUV3 := false
		hasUV4 := false
		hasUnknownFlag1 := false
		hasUnknownFlag2 := false
		hasUnknownFlag3 := false
		hasUnknownFlag4 := false

		// 检查第一个顶点确定是否存在这些标志位
		if len(m.Vertices) > 0 {
			hasUV2 = m.Vertices[0].UV2 != nil
			hasUV3 = m.Vertices[0].UV3 != nil
			hasUV4 = m.Vertices[0].UV4 != nil
			hasUnknownFlag1 = m.Vertices[0].Unknown1 != nil
			hasUnknownFlag2 = m.Vertices[0].Unknown2 != nil
			hasUnknownFlag3 = m.Vertices[0].Unknown3 != nil
			hasUnknownFlag4 = m.Vertices[0].Unknown4 != nil
		}

		// 写入UV标志位
		if err := utilities.WriteBool(w, hasUV2); err != nil {
			return fmt.Errorf("failed to write UV2 flag: %w", err)
		}
		if err := utilities.WriteBool(w, hasUV3); err != nil {
			return fmt.Errorf("failed to write UV3 flag: %w", err)
		}
		if err := utilities.WriteBool(w, hasUV4); err != nil {
			return fmt.Errorf("failed to write UV4 flag: %w", err)
		}

		// 写入未知标志位
		if err := utilities.WriteBool(w, hasUnknownFlag1); err != nil {
			return fmt.Errorf("failed to write unknown flag 1: %w", err)
		}
		if err := utilities.WriteBool(w, hasUnknownFlag2); err != nil {
			return fmt.Errorf("failed to write unknown flag 2: %w", err)
		}
		if err := utilities.WriteBool(w, hasUnknownFlag3); err != nil {
			return fmt.Errorf("failed to write unknown flag 3: %w", err)
		}
		if err := utilities.WriteBool(w, hasUnknownFlag4); err != nil {
			return fmt.Errorf("failed to write unknown flag 4: %w", err)
		}
	}

	// 写入顶点数据
	for _, vertex := range m.Vertices {
		// 写入顶点位置
		if err := utilities.WriteFloat32(w, vertex.Position.X); err != nil {
			return fmt.Errorf("failed to write vertex position X: %w", err)
		}
		if err := utilities.WriteFloat32(w, vertex.Position.Y); err != nil {
			return fmt.Errorf("failed to write vertex position Y: %w", err)
		}
		if err := utilities.WriteFloat32(w, vertex.Position.Z); err != nil {
			return fmt.Errorf("failed to write vertex position Z: %w", err)
		}

		// 写入法线
		if err := utilities.WriteFloat32(w, vertex.Normal.X); err != nil {
			return fmt.Errorf("failed to write vertex normal X: %w", err)
		}
		if err := utilities.WriteFloat32(w, vertex.Normal.Y); err != nil {
			return fmt.Errorf("failed to write vertex normal Y: %w", err)
		}
		if err := utilities.WriteFloat32(w, vertex.Normal.Z); err != nil {
			return fmt.Errorf("failed to write vertex normal Z: %w", err)
		}

		// 写入UV坐标
		if err := utilities.WriteFloat32(w, vertex.UV.X); err != nil {
			return fmt.Errorf("failed to write vertex UV coordinate X: %w", err)
		}
		if err := utilities.WriteFloat32(w, vertex.UV.Y); err != nil {
			return fmt.Errorf("failed to write vertex UV coordinate Y: %w", err)
		}

		// 写入UV2坐标（如果存在）
		if vertex.UV2 != nil {
			if err := utilities.WriteFloat32(w, vertex.UV2.X); err != nil {
				return fmt.Errorf("failed to write vertex UV2 coordinate X: %w", err)
			}
			if err := utilities.WriteFloat32(w, vertex.UV2.Y); err != nil {
				return fmt.Errorf("failed to write vertex UV2 coordinate Y: %w", err)
			}
		}

		// 写入UV3坐标（如果存在）
		if vertex.UV3 != nil {
			if err := utilities.WriteFloat32(w, vertex.UV3.X); err != nil {
				return fmt.Errorf("failed to write vertex UV3 coordinate X: %w", err)
			}
			if err := utilities.WriteFloat32(w, vertex.UV3.Y); err != nil {
				return fmt.Errorf("failed to write vertex UV3 coordinate Y: %w", err)
			}
		}

		// 写入UV4坐标（如果存在）
		if vertex.UV4 != nil {
			if err := utilities.WriteFloat32(w, vertex.UV4.X); err != nil {
				return fmt.Errorf("failed to write vertex UV4 coordinate X: %w", err)
			}
			if err := utilities.WriteFloat32(w, vertex.UV4.Y); err != nil {
				return fmt.Errorf("failed to write vertex UV4 coordinate Y: %w", err)
			}
		}

		// 写入未知标志位对应的数据（如果存在）
		if vertex.Unknown1 != nil {
			if err := utilities.WriteFloat32(w, vertex.Unknown1.X); err != nil {
				return fmt.Errorf("failed to write unknown flag 1 data X: %w", err)
			}
			if err := utilities.WriteFloat32(w, vertex.Unknown1.Y); err != nil {
				return fmt.Errorf("failed to write unknown flag 1 data Y: %w", err)
			}
		}

		if vertex.Unknown2 != nil {
			if err := utilities.WriteFloat32(w, vertex.Unknown2.X); err != nil {
				return fmt.Errorf("failed to write unknown flag 2 data X: %w", err)
			}
			if err := utilities.WriteFloat32(w, vertex.Unknown2.Y); err != nil {
				return fmt.Errorf("failed to write unknown flag 2 data Y: %w", err)
			}
		}

		if vertex.Unknown3 != nil {
			if err := utilities.WriteFloat32(w, vertex.Unknown3.X); err != nil {
				return fmt.Errorf("failed to write unknown flag 3 data X: %w", err)
			}
			if err := utilities.WriteFloat32(w, vertex.Unknown3.Y); err != nil {
				return fmt.Errorf("failed to write unknown flag 3 data Y: %w", err)
			}
		}

		if vertex.Unknown4 != nil {
			if err := utilities.WriteFloat32(w, vertex.Unknown4.X); err != nil {
				return fmt.Errorf("failed to write unknown flag 4 data X: %w", err)
			}
			if err := utilities.WriteFloat32(w, vertex.Unknown4.Y); err != nil {
				return fmt.Errorf("failed to write unknown flag 4 data Y: %w", err)
			}
		}
	}

	// 写入切线数据
	if m.Tangents != nil {
		if err := utilities.WriteInt32(w, int32(len(m.Tangents))); err != nil {
			return fmt.Errorf("failed to write the number of tangents: %w", err)
		}

		for _, tangent := range m.Tangents {
			if err := utilities.WriteFloat32(w, tangent.X); err != nil {
				return fmt.Errorf("failed to write tangent X: %w", err)
			}
			if err := utilities.WriteFloat32(w, tangent.Y); err != nil {
				return fmt.Errorf("failed to write tangent Y: %w", err)
			}
			if err := utilities.WriteFloat32(w, tangent.Z); err != nil {
				return fmt.Errorf("failed to write tangent Z: %w", err)
			}
			if err := utilities.WriteFloat32(w, tangent.W); err != nil {
				return fmt.Errorf("failed to write tangent W: %w", err)
			}
		}
	} else {
		// 如果没有切线数据，写入0
		if err := utilities.WriteInt32(w, 0); err != nil {
			return fmt.Errorf("failed to write the number of tangents: %w", err)
		}
	}

	// 写入骨骼权重
	for _, bw := range m.BoneWeights {
		if err := utilities.WriteUInt16(w, bw.BoneIndex0); err != nil {
			return fmt.Errorf("failed to write bone weight index 0: %w", err)
		}
		if err := utilities.WriteUInt16(w, bw.BoneIndex1); err != nil {
			return fmt.Errorf("failed to write bone weight index 1: %w", err)
		}
		if err := utilities.WriteUInt16(w, bw.BoneIndex2); err != nil {
			return fmt.Errorf("failed to write bone weight index 2: %w", err)
		}
		if err := utilities.WriteUInt16(w, bw.BoneIndex3); err != nil {
			return fmt.Errorf("failed to write bone weight index 3: %w", err)
		}

		if err := utilities.WriteFloat32(w, bw.Weight0); err != nil {
			return fmt.Errorf("failed to write bone weight 0: %w", err)
		}
		if err := utilities.WriteFloat32(w, bw.Weight1); err != nil {
			return fmt.Errorf("failed to write bone weight 1: %w", err)
		}
		if err := utilities.WriteFloat32(w, bw.Weight2); err != nil {
			return fmt.Errorf("failed to write bone weight 2: %w", err)
		}
		if err := utilities.WriteFloat32(w, bw.Weight3); err != nil {
			return fmt.Errorf("failed to write bone weight 3: %w", err)
		}
	}

	// 写入子网格数据
	for _, subMesh := range m.SubMeshes {
		if err := utilities.WriteInt32(w, int32(len(subMesh))); err != nil {
			return fmt.Errorf("failed to write submesh triangle count: %w", err)
		}

		for _, index := range subMesh {
			if err := utilities.WriteUInt16(w, uint16(index)); err != nil {
				return fmt.Errorf("failed to write submesh triangle index: %w", err)
			}
		}
	}

	// 写入材质数据
	if err := utilities.WriteInt32(w, int32(len(m.Materials))); err != nil {
		return fmt.Errorf("failed to write the number of materials: %w", err)
	}
	for _, material := range m.Materials {
		if err := material.Dump(w); err != nil {
			return fmt.Errorf("failed to write material: %w", err)
		}
	}

	// 写入形态数据
	for _, morph := range m.MorphData {
		if err := utilities.WriteString(w, "morph"); err != nil {
			return fmt.Errorf("failed to write morph tag: %w", err)
		}

		if err := writeMorphData(w, morph, m.Version); err != nil {
			return fmt.Errorf("failed to write morph data: %w", err)
		}
	}

	// 写入结束标记
	if err := utilities.WriteString(w, EndTag); err != nil {
		return fmt.Errorf("failed to write end tag: %w", err)
	}

	// 如果版本号大于等于2100，写入SkinThickness
	if m.Version >= 2100 {
		if m.SkinThickness != nil {
			if err := utilities.WriteInt32(w, 1); err != nil {
				return fmt.Errorf("failed to write skin thickness flag: %w", err)
			}
			if err := writeSkinThickness(w, m.SkinThickness); err != nil {
				return fmt.Errorf("failed to write skin thickness: %w", err)
			}
		} else {
			if err := utilities.WriteInt32(w, 0); err != nil {
				return fmt.Errorf("failed to write skin thickness flag: %w", err)
			}
		}
	}

	return nil
}

// writeMorphData 将形态数据写入w
func writeMorphData(w io.Writer, md *MorphData, version int32) error {
	// 写入形态名称
	if err := utilities.WriteString(w, md.Name); err != nil {
		return fmt.Errorf("failed to write the morph name: %w", err)
	}

	// 写入顶点数量
	if err := utilities.WriteInt32(w, int32(len(md.Indices))); err != nil {
		return fmt.Errorf("failed to write the number of morph vertices: %w", err)
	}

	// 2102 版本支持
	hasTangents := md.Tangents != nil && version >= 2102
	if version >= 2102 {
		if err := utilities.WriteBool(w, hasTangents); err != nil {
			return fmt.Errorf("failed to write has tangents flag: %w", err)
		}
	}

	for i, index := range md.Indices {
		if err := utilities.WriteUInt16(w, uint16(index)); err != nil {
			return fmt.Errorf("failed to write the morph vertex index: %w", err)
		}

		// 写入顶点位移
		if err := utilities.WriteFloat32(w, md.Vertex[i].X); err != nil {
			return fmt.Errorf("failed to write morph vertex displacement X: %w", err)
		}
		if err := utilities.WriteFloat32(w, md.Vertex[i].Y); err != nil {
			return fmt.Errorf("failed to write morph vertex displacement Y: %w", err)
		}
		if err := utilities.WriteFloat32(w, md.Vertex[i].Z); err != nil {
			return fmt.Errorf("failed to write morph vertex displacement Z: %w", err)
		}

		// 写入法线位移
		if err := utilities.WriteFloat32(w, md.Normals[i].X); err != nil {
			return fmt.Errorf("failed to write the morph normal displacement X: %w", err)
		}
		if err := utilities.WriteFloat32(w, md.Normals[i].Y); err != nil {
			return fmt.Errorf("failed to write the morph normal displacement Y: %w", err)
		}
		if err := utilities.WriteFloat32(w, md.Normals[i].Z); err != nil {
			return fmt.Errorf("failed to write the morph normal displacement Z: %w", err)
		}

		// 如果有切线数据，写入切线
		if hasTangents {
			if err := utilities.WriteFloat32(w, md.Tangents[i].X); err != nil {
				return fmt.Errorf("failed to write morph tangent X: %w", err)
			}
			if err := utilities.WriteFloat32(w, md.Tangents[i].Y); err != nil {
				return fmt.Errorf("failed to write morph tangent Y: %w", err)
			}
			if err := utilities.WriteFloat32(w, md.Tangents[i].Z); err != nil {
				return fmt.Errorf("failed to write morph tangent Z: %w", err)
			}
			if err := utilities.WriteFloat32(w, md.Tangents[i].W); err != nil {
				return fmt.Errorf("failed to write morph tangent W: %w", err)
			}
		}
	}

	return nil
}

// writeSkinThickness 将皮肤厚度数据写入w
func writeSkinThickness(w io.Writer, st *SkinThickness) error {
	// 写入签名
	if err := utilities.WriteString(w, SkinThicknessSignature); err != nil {
		return fmt.Errorf("failed to write skin thickness signature: %w", err)
	}

	// 写入版本号
	if err := utilities.WriteInt32(w, st.Version); err != nil {
		return fmt.Errorf("failed to write skin thickness version: %w", err)
	}

	// 写入使用标志
	if err := utilities.WriteBool(w, st.Use); err != nil {
		return fmt.Errorf("failed to write skin thickness use flag: %w", err)
	}

	// 写入组数量
	if err := utilities.WriteInt32(w, int32(len(st.Groups))); err != nil {
		return fmt.Errorf("failed to write skin thickness group count: %w", err)
	}

	// 写入每个组
	for key, group := range st.Groups {
		if err := utilities.WriteString(w, key); err != nil {
			return fmt.Errorf("failed to write skin thickness group key: %w", err)
		}

		if err := writeThickGroup(w, group); err != nil {
			return fmt.Errorf("failed to write skin thickness group: %w", err)
		}
	}

	return nil
}

// writeThickGroup 将皮肤厚度组数据写入w
func writeThickGroup(w io.Writer, group *ThickGroup) error {
	// 写入组名
	if err := utilities.WriteString(w, group.GroupName); err != nil {
		return fmt.Errorf("failed to write group name: %w", err)
	}

	// 写入起始骨骼名
	if err := utilities.WriteString(w, group.StartBoneName); err != nil {
		return fmt.Errorf("failed to write start bone name: %w", err)
	}

	// 写入结束骨骼名
	if err := utilities.WriteString(w, group.EndBoneName); err != nil {
		return fmt.Errorf("failed to write end bone name: %w", err)
	}

	// 写入角度步长
	if err := utilities.WriteInt32(w, group.StepAngleDegree); err != nil {
		return fmt.Errorf("failed to write step angle degree: %w", err)
	}

	// 写入点数量
	if err := utilities.WriteInt32(w, int32(len(group.Points))); err != nil {
		return fmt.Errorf("failed to write point count: %w", err)
	}

	// 写入每个点
	for _, point := range group.Points {
		if err := writeThickPoint(w, point); err != nil {
			return fmt.Errorf("failed to write point: %w", err)
		}
	}

	return nil
}

// writeThickPoint 将皮肤厚度点数据写入w
func writeThickPoint(w io.Writer, point *ThickPoint) error {
	// 写入目标骨骼名
	if err := utilities.WriteString(w, point.TargetBoneName); err != nil {
		return fmt.Errorf("failed to write target bone name: %w", err)
	}

	// 写入起始到结束的比例
	if err := utilities.WriteFloat32(w, point.RatioSegmentStartToEnd); err != nil {
		return fmt.Errorf("failed to write ratio segment start to end: %w", err)
	}

	// 写入角度定义数量
	if err := utilities.WriteInt32(w, int32(len(point.DistanceParAngle))); err != nil {
		return fmt.Errorf("failed to write angle definition count: %w", err)
	}

	// 写入每个角度定义
	for _, angleDef := range point.DistanceParAngle {
		if err := writeThickDefPerAngle(w, angleDef); err != nil {
			return fmt.Errorf("failed to write angle definition: %w", err)
		}
	}

	return nil
}

// writeThickDefPerAngle 将每个角度的皮肤厚度定义写入w
func writeThickDefPerAngle(w io.Writer, angleDef *ThickDefPerAngle) error {
	// 写入角度
	if err := utilities.WriteInt32(w, angleDef.AngleDegree); err != nil {
		return fmt.Errorf("failed to write angle degree: %w", err)
	}

	// 写入顶点索引
	if err := utilities.WriteInt32(w, angleDef.VertexIndex); err != nil {
		return fmt.Errorf("failed to write vertex index: %w", err)
	}

	// 写入默认距离
	if err := utilities.WriteFloat32(w, angleDef.DefaultDistance); err != nil {
		return fmt.Errorf("failed to write default distance: %w", err)
	}

	return nil
}
