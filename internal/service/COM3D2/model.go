package COM3D2

import (
	"bufio"
	"fmt"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"io"
	"os"
)

// ModelService 专门处理 .model 文件的读写
type ModelService struct{}

// ReadModelFile 读取 .Model 文件并返回对应结构体
func (m *ModelService) ReadModelFile(path string) (*COM3D2.Model, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .model file: %w", err)
	}
	defer f.Close()

	var rs io.ReadSeeker = f // 注意，读取 Material 时需要进行 Seek，因此这里不能使用 bufio.NewReader，读 .mate 能用是因为后续没有其他数据可以直接全部读取到内存
	modelData, err := COM3D2.ReadModel(rs)
	if err != nil {
		return nil, fmt.Errorf("parsing the .model file failed: %w", err)
	}

	return modelData, nil
}

// WriteModelFile 接收 Model 数据并写入 .model 文件
func (m *ModelService) WriteModelFile(path string, modelData *COM3D2.Model) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .model file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := modelData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .model file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}

// ReadModelMaterial 读取 .model 文件，但只返回其中的材质数据
func (m *ModelService) ReadModelMaterial(path string) ([]*COM3D2.Material, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .model file: %w", err)
	}
	defer f.Close()

	var rs io.ReadSeeker = f
	modelData, err := COM3D2.ReadModel(rs)
	if err != nil {
		return nil, fmt.Errorf("parsing the .model file failed: %w", err)
	}

	return modelData.Materials, nil
}

// WriteModelMaterial 接收 Material 数据并写入.model 文件
// 因为 Material 数据是在 Model 结构体中，所以需要先读取整个 Model 结构体，然后修改其中的 Material 数据，最后再写入文件
// 因此这里需要传入输入文件路径和输出文件路径，分别用于读取和写入.model 文件，可以为相同路径
func (m *ModelService) WriteModelMaterial(inputPath string, outputPath string, materials []*COM3D2.Material) error {
	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("cannot open .model file: %w", err)
	}
	defer f.Close()
	var rs io.ReadSeeker = f
	modelData, err := COM3D2.ReadModel(rs)
	if err != nil {
		return fmt.Errorf("parsing the .model file failed: %w", err)
	}

	modelData.Materials = materials

	f, err = os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("unable to create .model file: %w", err)
	}
	defer f.Close()
	bw := bufio.NewWriter(f)
	if err := modelData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .model file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}
