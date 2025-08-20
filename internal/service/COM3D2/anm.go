package COM3D2

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
)

// AnmService 专门处理 .anm 文件的读写
type AnmService struct{}

// ReadAnmFile 读取 .anm 或 .anm.json 文件并返回对应结构体
func (m *AnmService) ReadAnmFile(path string) (*COM3D2.Anm, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .anm file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		decoder := json.NewDecoder(f)
		anmData := &COM3D2.Anm{}
		if err := decoder.Decode(anmData); err != nil {
			return nil, fmt.Errorf("failed to read .anm.json file: %w", err)
		}
		return anmData, nil
	}

	br := bufio.NewReaderSize(f, 1024*1024*10) //10MB 缓冲区
	anmData, err := COM3D2.ReadAnm(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .anm file failed: %w", err)
	}

	return anmData, nil
}

// WriteAnmFile 接收 Anm 数据并写入 .anm 文件或 .anm.json 文件
func (m *AnmService) WriteAnmFile(path string, anmData *COM3D2.Anm) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .anm file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		marshal, err := json.Marshal(anmData)
		if err != nil {
			return err
		}
		_, err = f.Write(marshal)
		if err != nil {
			return fmt.Errorf("failed to write to .anm.json file: %w", err)
		}
		return nil
	}

	bw := bufio.NewWriter(f)
	if err := anmData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .anm file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}

// ConvertAnmToJson 接收输入文件路径和输出文件路径，将输入文件转换为 .json 文件
func (m *AnmService) ConvertAnmToJson(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".anm") {
		outputPath = strings.TrimSuffix(outputPath, ".anm") + ".anm.json"
	}

	anmData, err := m.ReadAnmFile(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read anm file: %w", err)
	}

	jsonData, err := json.Marshal(anmData)
	if err != nil {
		return fmt.Errorf("failed to marshal anm data: %w", err)
	}

	f, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("unable to create anm.json file: %w", err)
	}
	defer func() {
		if closeErr := f.Close(); closeErr != nil && err == nil {
			err = fmt.Errorf("error closing output file: %w", closeErr)
		}
	}()

	bw := bufio.NewWriter(f)
	if _, err := bw.Write(jsonData); err != nil {
		return fmt.Errorf("failed to write to anm.json file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}

	return nil
}

// ConvertJsonToAnm 接收输入文件路径和输出文件路径，将输入文件转换为 .anm 文件
func (m *AnmService) ConvertJsonToAnm(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".json") {
		outputPath = strings.TrimSuffix(outputPath, ".json") + ".anm"
	}

	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("cannot open anm.json file: %w", err)
	}
	defer f.Close()

	var anmData *COM3D2.Anm
	if err := json.NewDecoder(f).Decode(&anmData); err != nil {
		return fmt.Errorf("parsing the anm.json file failed: %w", err)
	}

	return m.WriteAnmFile(outputPath, anmData)
}
