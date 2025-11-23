package COM3D2

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
)

// ModelService 专门处理 .model 文件的读写
type ModelService struct{}

// ReadModelFile 读取 .model 或 .model.json 文件并返回对应结构体
func (m *ModelService) ReadModelFile(path string) (*COM3D2.Model, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .model file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		decoder := json.NewDecoder(f)
		modelData := &COM3D2.Model{}
		if err := decoder.Decode(modelData); err != nil {
			return nil, fmt.Errorf("failed to read .model.json file: %w", err)
		}
		return modelData, nil
	}

	modelData, err := COM3D2.ReadModel(f) // .model need seek
	if err != nil {
		return nil, fmt.Errorf("parsing the .model file failed: %w", err)
	}

	return modelData, nil
}

// WriteModelFile 接收 Model 数据并写入 .model 文件或 .model.json 文件
func (m *ModelService) WriteModelFile(outputPath string, modelData *COM3D2.Model) error {
	f, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("unable to create .model file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(outputPath, ".json") {
		marshal, err := json.Marshal(modelData)
		if err != nil {
			return err
		}
		_, err = f.Write(marshal)
		if err != nil {
			return fmt.Errorf("failed to write to .model.json file: %w", err)
		}
		return nil
	}

	bw := bufio.NewWriter(f)
	if err := modelData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .model file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}

// ReadModelMetadata 读取.model 文件，但只返回其中的元数据
func (m *ModelService) ReadModelMetadata(path string) (*COM3D2.ModelMetadata, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .model file: %w", err)
	}
	defer f.Close()

	var modelData *COM3D2.Model

	if strings.HasSuffix(path, ".json") {
		decoder := json.NewDecoder(f)
		modelData = &COM3D2.Model{}
		if err = decoder.Decode(modelData); err != nil {
			return nil, fmt.Errorf("failed to read .model.json file: %w", err)
		}
	} else {
		modelData, err = COM3D2.ReadModel(f)
		if err != nil {
			return nil, fmt.Errorf("parsing the .model file failed: %w", err)
		}
	}

	return &COM3D2.ModelMetadata{
		Signature:         modelData.Signature,
		Version:           modelData.Version,
		Name:              modelData.Name,
		RootBoneName:      modelData.RootBoneName,
		ShadowCastingMode: modelData.ShadowCastingMode,
		Materials:         modelData.Materials,
	}, nil
}

// WriteModelMetadata 将元数据写入现有的 .model 文件
func (m *ModelService) WriteModelMetadata(inputPath string, outputPath string, metadata *COM3D2.ModelMetadata) error {
	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("cannot open .model file: %w", err)
	}
	defer f.Close()

	var modelData *COM3D2.Model

	if strings.HasSuffix(inputPath, ".json") {
		decoder := json.NewDecoder(f)
		modelData = &COM3D2.Model{}
		if err = decoder.Decode(modelData); err != nil {
			return fmt.Errorf("failed to read .model.json file: %w", err)
		}
	} else {
		modelData, err = COM3D2.ReadModel(f)
		if err != nil {
			return fmt.Errorf("parsing the .model file failed: %w", err)
		}
	}

	modelData.Signature = metadata.Signature
	modelData.Version = metadata.Version
	modelData.Name = metadata.Name
	modelData.RootBoneName = metadata.RootBoneName
	modelData.ShadowCastingMode = metadata.ShadowCastingMode
	modelData.Materials = metadata.Materials

	return m.WriteModelFile(outputPath, modelData)
}

// ReadModelMaterial 读取 .model 文件，但只返回其中的材质数据
func (m *ModelService) ReadModelMaterial(path string) ([]*COM3D2.Material, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .model file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		decoder := json.NewDecoder(f)
		modelData := &COM3D2.Model{}
		if err := decoder.Decode(modelData); err != nil {
			return nil, fmt.Errorf("failed to read.model.json file: %w", err)
		}
		return modelData.Materials, nil
	}

	modelData, err := COM3D2.ReadModel(f)
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

	var modelData *COM3D2.Model

	if strings.HasSuffix(inputPath, ".json") {
		decoder := json.NewDecoder(f)
		modelData = &COM3D2.Model{}
		if err = decoder.Decode(modelData); err != nil {
			return fmt.Errorf("failed to read.model.json file: %w", err)
		}
	} else {
		modelData, err = COM3D2.ReadModel(f)
		if err != nil {
			return fmt.Errorf("parsing the .model file failed: %w", err)
		}
	}

	modelData.Materials = materials

	return m.WriteModelFile(outputPath, modelData)
}

// ConvertModelToJson 接收输入文件路径和输出文件路径，将输入文件转换为 .json 文件
func (m *ModelService) ConvertModelToJson(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".model") {
		outputPath = strings.TrimSuffix(outputPath, ".model") + ".model.json"
	}

	modelData, err := m.ReadModelFile(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read model file: %w", err)
	}

	jsonData, err := json.Marshal(modelData)
	if err != nil {
		return fmt.Errorf("failed to marshal model data: %w", err)
	}

	f, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("unable to create model.json file: %w", err)
	}
	defer func() {
		if closeErr := f.Close(); closeErr != nil && err == nil {
			err = fmt.Errorf("error closing output file: %w", closeErr)
		}
	}()

	bw := bufio.NewWriter(f)
	if _, err := bw.Write(jsonData); err != nil {
		return fmt.Errorf("failed to write to model.json file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}

	return nil
}

// ConvertJsonToModel 接收输入文件路径和输出文件路径，将输入文件转换为 .model 文件
func (m *ModelService) ConvertJsonToModel(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".json") {
		outputPath = strings.TrimSuffix(outputPath, ".json") + ".model"
	}

	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("cannot open model.json file: %w", err)
	}
	defer f.Close()
	var modelData *COM3D2.Model
	if err := json.NewDecoder(f).Decode(&modelData); err != nil {
		return fmt.Errorf("parsing the model.json file failed: %w", err)
	}
	return m.WriteModelFile(outputPath, modelData)
}
