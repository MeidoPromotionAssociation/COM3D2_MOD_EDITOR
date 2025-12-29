package COM3D2

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
)

// ColService 专门处理 .col 文件的读写
type ColService struct{}

// ReadColFile 读取 .col 或 .col.json 文件并返回对应结构体
func (m *ColService) ReadColFile(path string) (*COM3D2.Col, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .col file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		decoder := json.NewDecoder(f)
		colData := &COM3D2.Col{}
		if err := decoder.Decode(colData); err != nil {
			return nil, fmt.Errorf("failed to read .col.json file: %w", err)
		}
		return colData, nil
	}

	colData, err := COM3D2.ReadCol(f) //无需缓冲，2740 个样本中 90% 文件小于: 1.65 KB，平均 915.16 B，中位数 904.00 B，最大值 3.41 KB
	if err != nil {
		return nil, fmt.Errorf("parsing the .col file failed: %w", err)
	}

	return colData, nil
}

// WriteColFile 接收 Col 数据并写入 .col 或 .col.json 文件
func (m *ColService) WriteColFile(path string, colData *COM3D2.Col) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .col file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		marshal, err := json.Marshal(colData)
		if err != nil {
			return err
		}
		_, err = f.Write(marshal)
		if err != nil {
			return fmt.Errorf("failed to write to .col.json file: %w", err)
		}
		return nil
	}

	bw := bufio.NewWriter(f)
	if err := colData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .col file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}

// ConvertColToJson 接收输入文件路径和输出文件路径，将输入文件转换为 .json 文件
func (m *ColService) ConvertColToJson(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".col") {
		outputPath = strings.TrimSuffix(outputPath, ".col") + ".col.json"
	}

	colData, err := m.ReadColFile(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read col file: %w", err)
	}

	jsonData, err := json.Marshal(colData)
	if err != nil {
		return fmt.Errorf("failed to marshal col data: %w", err)
	}

	f, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("unable to create col.json file: %w", err)
	}
	defer func() {
		if closeErr := f.Close(); closeErr != nil && err == nil {
			err = fmt.Errorf("error closing output file: %w", closeErr)
		}
	}()

	bw := bufio.NewWriter(f)
	if _, err := bw.Write(jsonData); err != nil {
		return fmt.Errorf("failed to write to col.json file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}

	return nil
}

// ConvertJsonToCol 接收输入文件路径和输出文件路径，将输入文件转换为 .col 文件
func (m *ColService) ConvertJsonToCol(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".json") {
		outputPath = strings.TrimSuffix(outputPath, ".json") + ".col"
	}

	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("cannot open col.json file: %w", err)
	}
	defer f.Close()

	var colData *COM3D2.Col
	if err := json.NewDecoder(f).Decode(&colData); err != nil {
		return fmt.Errorf("parsing the col.json file failed: %w", err)
	}

	return m.WriteColFile(outputPath, colData)
}
