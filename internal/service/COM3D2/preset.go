package COM3D2

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/binaryio/stream"
)

// PresetService 专门处理 .preset 文件的读写
type PresetService struct{}

// ReadPresetFile 读取 .preset 或 .preset.json 文件并返回对应结构体
func (s *PresetService) ReadPresetFile(path string) (*COM3D2.Preset, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .preset file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		decoder := json.NewDecoder(f)
		presetData := &COM3D2.Preset{}
		if err := decoder.Decode(presetData); err != nil {
			return nil, fmt.Errorf("failed to read .preset.json file: %w", err)
		}
		return presetData, nil
	}

	br := bufio.NewReaderSize(f, 1024*64)
	presetData, err := COM3D2.ReadPreset(br) // 64KB 缓冲区，4574 个样本中 90% 文件小于 58.83 KB，平均 51.33 KB，中位数 50.51 KB，最大值 157.35 KB
	if err != nil {
		return nil, fmt.Errorf("parsing the .preset file failed: %w", err)
	}

	return presetData, nil
}

// ReadPresetFileMetadata 读取 .preset 或 .preset.json 文件并返回对应结构体，仅包含预览图等元数据
func (s *PresetService) ReadPresetFileMetadata(path string) (*COM3D2.PresetMetadata, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .preset file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		decoder := json.NewDecoder(f)
		presetData := &COM3D2.PresetMetadata{}
		if err := decoder.Decode(presetData); err != nil {
			return nil, fmt.Errorf("failed to read .preset.json file: %w", err)
		}
		return presetData, nil
	}

	br := bufio.NewReaderSize(f, 1024*64) //64KB 缓冲区， 3231 个样本中 90% 文件小于 58.80 KB，中位数 50.57 KB
	reader := stream.NewBinaryReader(br)
	presetData, err := COM3D2.ReadPresetMetadata(reader)
	if err != nil {
		return nil, fmt.Errorf("parsing the .preset file failed: %w", err)
	}

	return presetData, nil
}

// WritePresetFile 接收 Preset 数据并写入 .preset 或 .preset.json 文件
func (s *PresetService) WritePresetFile(path string, PresetData *COM3D2.Preset) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .preset file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		marshal, err := json.Marshal(PresetData)
		if err != nil {
			return err
		}
		_, err = f.Write(marshal)
		if err != nil {
			return fmt.Errorf("failed to write to .preset.json file: %w", err)
		}
		return nil
	}

	bw := bufio.NewWriter(f)
	if err := PresetData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .preset file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}

// ConvertPresetToJson 接收输入文件路径和输出文件路径，将输入文件转换为 .json 文件
func (s *PresetService) ConvertPresetToJson(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".preset") {
		outputPath = strings.TrimSuffix(outputPath, ".preset") + ".preset.json"
	}

	presetData, err := s.ReadPresetFile(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read preset file: %w", err)
	}

	jsonData, err := json.Marshal(presetData)
	if err != nil {
		return fmt.Errorf("failed to marshal preset data: %w", err)
	}

	f, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("unable to create preset.json file: %w", err)
	}
	defer func() {
		if closeErr := f.Close(); closeErr != nil && err == nil {
			err = fmt.Errorf("error closing output file: %w", closeErr)
		}
	}()

	bw := bufio.NewWriter(f)
	if _, err := bw.Write(jsonData); err != nil {
		return fmt.Errorf("failed to write to preset.json file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}

	return nil
}

// ConvertJsonToPreset 接收输入文件路径和输出文件路径，将输入文件转换为 .preset 文件
func (s *PresetService) ConvertJsonToPreset(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".json") {
		outputPath = strings.TrimSuffix(outputPath, ".json") + ".preset"
	}

	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("cannot open preset.json file: %w", err)
	}
	defer f.Close()

	var presetData *COM3D2.Preset
	if err := json.NewDecoder(f).Decode(&presetData); err != nil {
		return fmt.Errorf("parsing the preset.json file failed: %w", err)
	}

	return s.WritePresetFile(outputPath, presetData)
}
