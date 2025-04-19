package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/utilities"
	"fmt"
	"io"
)

// CM3D2_MESH
//
// CM3D2 支持 1000 - 2000 版本
// COM3D2 支持 1000 到 2001 版本，2100 版本的额外数据追加在文件末尾，不影响解析，所以应该也可以支持
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
// 版本 2104 但低于 2200 版本
// 新增 ShadowCastingMode 支持
//
// 版本 2100 以上但低于 2200 版本
// 验证文件名，必须以 crc_ 或 crx_ 或 gp03_ 开头.
// 对于这些特殊前缀的文件，跳过了 "Bip01" 骨骼的无权重移除
//
// 版本 2200
// 未知

// Model 对应 .model 文件
// aka 皮肤网格文件结构 SkinMesh
type Model struct {
	Signature     string         `json:"Signature"` // "CM3D2_MESH"
	Version       int32          `json:"Version"`   // 2001 / 24301
	Name          string         `json:"Name"`
	RootBoneName  string         `json:"RootBoneName"`
	Bones         []*Bone        `json:"Bones"`
	VertCount     int32          `json:"VertCount"`
	SubMeshCount  int32          `json:"SubMeshCount"`
	BoneCount     int32          `json:"BoneCount"`
	BoneNames     []string       `json:"BoneNames"`
	BindPoses     []Matrix4x4    `json:"BindPoses"`
	Vertices      []Vertex       `json:"Vertices"`
	Tangents      []Quaternion   `json:"Tangents,omitempty"`
	BoneWeights   []BoneWeight   `json:"BoneWeights"`
	SubMeshes     [][]int32      `json:"SubMeshes"`
	Materials     []*Material    `json:"Materials"`
	MorphData     []*MorphData   `json:"MorphData,omitempty"`
	SkinThickness *SkinThickness `json:"SkinThickness,omitempty"`
}

// Bone 表示骨骼数据
type Bone struct {
	Name        string     `json:"Name"`
	HasScale    bool       `json:"HasScale"`
	ParentIndex int32      `json:"ParentIndex"`
	Position    Vector3    `json:"Position"`
	Rotation    Quaternion `json:"Rotation"`
	Scale       *Vector3   `json:"Scale,omitempty"`
}

// Vertex 表示顶点数据
type Vertex struct {
	Position Vector3 `json:"Position"`
	Normal   Vector3 `json:"Normal"`
	UV       Vector2 `json:"UV"`
}

// BoneWeight 表示骨骼权重
type BoneWeight struct {
	BoneIndex0 uint16  `json:"BoneIndex0"`
	BoneIndex1 uint16  `json:"BoneIndex1"`
	BoneIndex2 uint16  `json:"BoneIndex2"`
	BoneIndex3 uint16  `json:"BoneIndex3"`
	Weight0    float32 `json:"Weight0"`
	Weight1    float32 `json:"Weight1"`
	Weight2    float32 `json:"Weight2"`
	Weight3    float32 `json:"Weight3"`
}

// MorphData 表示形态数据
type MorphData struct {
	Name    string    `json:"Name"`
	Indices []int     `json:"Indices"`
	Vertex  []Vector3 `json:"Vertex"`
	Normals []Vector3 `json:"Normals"`
}

// SkinThickness 表示皮肤厚度数据
type SkinThickness struct {
	Use    bool                   `json:"Use"`
	Groups map[string]*ThickGroup `json:"Groups"`
}

// ThickGroup 表示皮肤厚度组
type ThickGroup struct {
	GroupName       string        `json:"GroupName"`
	StartBoneName   string        `json:"StartBoneName"`
	EndBoneName     string        `json:"EndBoneName"`
	StepAngleDegree int32         `json:"StepAngleDegree"`
	Points          []*ThickPoint `json:"Points"`
}

// ThickPoint 表示皮肤厚度点
type ThickPoint struct {
	TargetBoneName         string              `json:"TargetBoneName"`
	RatioSegmentStartToEnd float32             `json:"RatioSegmentStartToEnd"`
	DistanceParAngle       []*ThickDefPerAngle `json:"DistanceParAngle"`
}

// ThickDefPerAngle 表示每个角度的皮肤厚度定义
type ThickDefPerAngle struct {
	AngleDegree     int32   `json:"AngleDegree"`
	VertexIndex     int32   `json:"VertexIndex"`
	DefaultDistance float32 `json:"DefaultDistance"`
}

// ReadModel 从 r 中读取皮肤网格数据
func ReadModel(r io.Reader) (*Model, error) {
	model := &Model{}

	// 读取文件头
	var err error
	model.Signature, err = utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read signature: %w", err)
	}
	//if model.Signature != "CM3D2_MESH" {
	//	return nil, fmt.Errorf("invalid .model signature: got %q, want %s", sig, MateSignature)
	//}

	model.Version, err = utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read version: %w", err)
	}

	model.Name, err = utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read name: %w", err)
	}

	model.RootBoneName, err = utilities.ReadString(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read root bone name: %w", err)
	}

	// 读取骨骼数据
	boneCount, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read bone count: %w", err)
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
	}

	// 读取切线数据
	tangentCount, err := utilities.ReadInt32(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read the number of tangents: %w", err)
	}

	if tangentCount > 0 {
		model.Tangents = make([]Quaternion, tangentCount)
		for i := int32(0); i < tangentCount; i++ {
			fmt.Println("reading tangentCount: ", i)
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

		if tag == "end" {
			break
		}

		if tag == "morph" {
			morphData, err := ReadMorphData(r)
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
func ReadMorphData(r io.Reader) (*MorphData, error) {
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
	_, err = utilities.ReadInt32(r) // 跳过版本号
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

// Dump 将皮肤网格数据写入到w中
func (model *Model) Dump(w io.Writer) error {
	// 写入文件头
	if err := utilities.WriteString(w, model.Signature); err != nil {
		return fmt.Errorf("failed to write signature: %w", err)
	}

	if err := utilities.WriteInt32(w, model.Version); err != nil {
		return fmt.Errorf("failed to write version: %w", err)
	}

	if err := utilities.WriteString(w, model.Name); err != nil {
		return fmt.Errorf("failed to write name: %w", err)
	}

	if err := utilities.WriteString(w, model.RootBoneName); err != nil {
		return fmt.Errorf("failed to write root bone name: %w", err)
	}

	// 写入骨骼数量
	boneCount := int32(len(model.Bones))
	if err := utilities.WriteInt32(w, boneCount); err != nil {
		return fmt.Errorf("failed to write bone count: %w", err)
	}

	// 写入骨骼名称和缩放标志
	for _, bone := range model.Bones {
		if err := utilities.WriteString(w, bone.Name); err != nil {
			return fmt.Errorf("failed to write bone name: %w", err)
		}

		var hasScaleByte byte
		if bone.HasScale {
			hasScaleByte = 1
		}
		if err := utilities.WriteByte(w, hasScaleByte); err != nil {
			return fmt.Errorf("failed to write bone scaling flags: %w", err)
		}
	}

	// 写入骨骼父子关系
	for _, bone := range model.Bones {
		if err := utilities.WriteInt32(w, bone.ParentIndex); err != nil {
			return fmt.Errorf("failed to write bone parent index: %w", err)
		}
	}

	// 写入骨骼变换信息
	for _, bone := range model.Bones {
		// 位置
		if err := utilities.WriteFloat32(w, bone.Position.X); err != nil {
			return fmt.Errorf("failed to write bone position X: %w", err)
		}
		if err := utilities.WriteFloat32(w, bone.Position.Y); err != nil {
			return fmt.Errorf("failed to write bone position Y: %w", err)
		}
		if err := utilities.WriteFloat32(w, bone.Position.Z); err != nil {
			return fmt.Errorf("failed to write bone position Z: %w", err)
		}

		// 旋转
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

		// 如果版本大于等于2001且有缩放
		if model.Version >= 2001 {
			hasScale := bone.Scale != nil
			if err := utilities.WriteBool(w, hasScale); err != nil {
				return fmt.Errorf("failed to write bone scaling flags: %w", err)
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
	if err := utilities.WriteInt32(w, model.VertCount); err != nil {
		return fmt.Errorf("failed to write the number of vertices: %w", err)
	}

	if err := utilities.WriteInt32(w, model.SubMeshCount); err != nil {
		return fmt.Errorf("failed to write the number of subgrids: %w", err)
	}

	if err := utilities.WriteInt32(w, model.BoneCount); err != nil {
		return fmt.Errorf("failed to write the number of bones: %w", err)
	}

	// 写入骨骼名称
	for _, boneName := range model.BoneNames {
		if err := utilities.WriteString(w, boneName); err != nil {
			return fmt.Errorf("failed to write bone name (at bone index): %w", err)
		}
	}

	// 写入骨骼绑定姿势
	for _, bindPose := range model.BindPoses {
		if err := utilities.WriteFloat4x4(w, bindPose); err != nil {
			return fmt.Errorf("failed to write the armature binding pose: %w", err)
		}
	}

	// 写入顶点数据
	for _, vertex := range model.Vertices {
		// 顶点位置
		if err := utilities.WriteFloat32(w, vertex.Position.X); err != nil {
			return fmt.Errorf("failed to write vertex position X: %w", err)
		}
		if err := utilities.WriteFloat32(w, vertex.Position.Y); err != nil {
			return fmt.Errorf("failed to write vertex position Y: %w", err)
		}
		if err := utilities.WriteFloat32(w, vertex.Position.Z); err != nil {
			return fmt.Errorf("failed to write vertex position Z: %w", err)
		}

		// 法线
		if err := utilities.WriteFloat32(w, vertex.Normal.X); err != nil {
			return fmt.Errorf("failed to write vertex normal X: %w", err)
		}
		if err := utilities.WriteFloat32(w, vertex.Normal.Y); err != nil {
			return fmt.Errorf("failed to write vertex normal Y: %w", err)
		}
		if err := utilities.WriteFloat32(w, vertex.Normal.Z); err != nil {
			return fmt.Errorf("failed to write vertex normal Z: %w", err)
		}

		// UV 坐标
		if err := utilities.WriteFloat32(w, vertex.UV.X); err != nil {
			return fmt.Errorf("failed to write vertex UV coordinate X: %w", err)
		}
		if err := utilities.WriteFloat32(w, vertex.UV.Y); err != nil {
			return fmt.Errorf("failed to write vertex UV coordinate Y: %w", err)
		}
	}

	// 写入切线数据
	tangentCount := int32(len(model.Tangents))
	if err := utilities.WriteInt32(w, tangentCount); err != nil {
		return fmt.Errorf("failed to write the number of tangents: %w", err)
	}

	if tangentCount > 0 {
		for _, tangent := range model.Tangents {
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
	}

	// 写入骨骼权重
	for _, bw := range model.BoneWeights {
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
	for _, subMesh := range model.SubMeshes {
		triCount := int32(len(subMesh))
		if err := utilities.WriteInt32(w, triCount); err != nil {
			return fmt.Errorf("failed to write submesh triangle count: %w", err)
		}

		for _, index := range subMesh {
			if err := utilities.WriteUInt16(w, uint16(index)); err != nil {
				return fmt.Errorf("failed to write submesh triangle index: %w", err)
			}
		}
	}

	// 写入材质数据
	materialCount := int32(len(model.Materials))
	if err := utilities.WriteInt32(w, materialCount); err != nil {
		return fmt.Errorf("failed to write the number of materials: %w", err)
	}

	for _, material := range model.Materials {
		if err := material.Dump(w); err != nil {
			return fmt.Errorf("failed to write material: %w", err)
		}
	}

	// 写入形态数据
	if model.MorphData != nil && len(model.MorphData) > 0 {
		for _, morphData := range model.MorphData {
			if err := utilities.WriteString(w, "morph"); err != nil {
				return fmt.Errorf("failed to write morph tag: %w", err)
			}
			if err := writeMorphData(w, morphData); err != nil {
				return fmt.Errorf("failed to write morph data: %w", err)
			}
		}
	}

	// 写入结束标记
	if err := utilities.WriteString(w, "end"); err != nil {
		return fmt.Errorf("failed to write end tag: %w", err)
	}

	// 如果版本号 >= 2100，写入SkinThickness
	if model.Version >= 2100 {
		hasSkinThickness := int32(0)
		if model.SkinThickness != nil {
			hasSkinThickness = 1
		}
		if err := utilities.WriteInt32(w, hasSkinThickness); err != nil {
			return fmt.Errorf("failed to write skin thickness flag: %w", err)
		}

		if hasSkinThickness != 0 {
			if err := writeSkinThickness(w, model.SkinThickness); err != nil {
				return fmt.Errorf("failed to write skin thickness: %w", err)
			}
		}
	}

	return nil
}

// writeMorphData 将形态数据写入到w中
func writeMorphData(w io.Writer, morphData *MorphData) error {
	if err := utilities.WriteString(w, morphData.Name); err != nil {
		return fmt.Errorf("failed to write morph name: %w", err)
	}

	vertCount := int32(len(morphData.Indices))
	if err := utilities.WriteInt32(w, vertCount); err != nil {
		return fmt.Errorf("failed to write number of morph vertices: %w", err)
	}

	for i := int32(0); i < vertCount; i++ {
		// 写入顶点索引
		if err := utilities.WriteUInt16(w, uint16(morphData.Indices[i])); err != nil {
			return fmt.Errorf("failed to write morph vertex index: %w", err)
		}

		// 写入顶点位移
		if err := utilities.WriteFloat32(w, morphData.Vertex[i].X); err != nil {
			return fmt.Errorf("failed to write morph vertex displacement X: %w", err)
		}
		if err := utilities.WriteFloat32(w, morphData.Vertex[i].Y); err != nil {
			return fmt.Errorf("failed to write morph vertex displacement Y: %w", err)
		}
		if err := utilities.WriteFloat32(w, morphData.Vertex[i].Z); err != nil {
			return fmt.Errorf("failed to write morph vertex displacement Z: %w", err)
		}

		// 写入法线位移
		if err := utilities.WriteFloat32(w, morphData.Normals[i].X); err != nil {
			return fmt.Errorf("failed to write morph normal displacement X: %w", err)
		}
		if err := utilities.WriteFloat32(w, morphData.Normals[i].Y); err != nil {
			return fmt.Errorf("failed to write morph normal displacement Y: %w", err)
		}
		if err := utilities.WriteFloat32(w, morphData.Normals[i].Z); err != nil {
			return fmt.Errorf("failed to write morph normal displacement Z: %w", err)
		}
	}

	return nil
}

// writeSkinThickness 将皮肤厚度数据写入到w中
func writeSkinThickness(w io.Writer, skinThickness *SkinThickness) error {
	// 写入签名
	if err := utilities.WriteString(w, "SkinThickness"); err != nil {
		return fmt.Errorf("failed to write skin thickness signature: %w", err)
	}

	// 写入版本号（假设为1，你可能需要根据实际情况调整）
	if err := utilities.WriteInt32(w, 1); err != nil {
		return fmt.Errorf("failed to write skin thickness version: %w", err)
	}

	// 写入使用标志
	if err := utilities.WriteBool(w, skinThickness.Use); err != nil {
		return fmt.Errorf("failed to write skin thickness use flag: %w", err)
	}

	// 写入组数量
	groupCount := int32(len(skinThickness.Groups))
	if err := utilities.WriteInt32(w, groupCount); err != nil {
		return fmt.Errorf("failed to write skin thickness group count: %w", err)
	}

	// 写入每个组
	for key, group := range skinThickness.Groups {
		if err := utilities.WriteString(w, key); err != nil {
			return fmt.Errorf("failed to write skin thickness group key: %w", err)
		}

		if err := writeThickGroup(w, group); err != nil {
			return fmt.Errorf("failed to write skin thickness group: %w", err)
		}
	}

	return nil
}

// writeThickGroup 将皮肤厚度组数据写入到w中
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
	pointCount := int32(len(group.Points))
	if err := utilities.WriteInt32(w, pointCount); err != nil {
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

// writeThickPoint 将皮肤厚度点数据写入到w中
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
	angleDefCount := int32(len(point.DistanceParAngle))
	if err := utilities.WriteInt32(w, angleDefCount); err != nil {
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

// writeThickDefPerAngle 将每个角度的皮肤厚度定义写入到w中
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
