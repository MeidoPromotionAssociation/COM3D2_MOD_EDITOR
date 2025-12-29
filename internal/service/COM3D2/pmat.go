package COM3D2

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
)

// PMatService 专门处理 .pmat 文件的读写
type PMatService struct{}

// ReadPMatFile 读取 .pmat 或 .pmat.json 文件并返回对应结构体
func (s *PMatService) ReadPMatFile(path string) (*COM3D2.PMat, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .pmat file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		decoder := json.NewDecoder(f)
		pmatData := &COM3D2.PMat{}
		if err := decoder.Decode(pmatData); err != nil {
			return nil, fmt.Errorf("failed to read .pmat.json file: %w", err)
		}
		return pmatData, nil
	}

	PMatData, err := COM3D2.ReadPMat(f) // 无需缓冲区，4188 个样本中 90% 文件小于: 88.00 B，平均 71.75 B，中位数 67.00 B，最大值 118.00 B
	if err != nil {
		return nil, fmt.Errorf("parsing the .pmat file failed: %w", err)
	}

	return PMatData, nil
}

// WritePMatFile 接收 PMat 数据并写入 .pmat 或 .pmat.json 文件
func (s *PMatService) WritePMatFile(path string, PMatData *COM3D2.PMat) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .pmat file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		marshal, err := json.Marshal(PMatData)
		if err != nil {
			return err
		}
		_, err = f.Write(marshal)
		if err != nil {
			return fmt.Errorf("failed to write to .pmat.json file: %w", err)
		}
		return nil
	}

	bw := bufio.NewWriter(f)
	if err := PMatData.Dump(bw, true); err != nil {
		return fmt.Errorf("failed to write to .pmat file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}

// ConvertPMatToJson 接收输入文件路径和输出文件路径，将输入文件转换为 .json 文件
func (s *PMatService) ConvertPMatToJson(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".pmat") {
		outputPath = strings.TrimSuffix(outputPath, ".pmat") + ".pmat.json"
	}

	pmatData, err := s.ReadPMatFile(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read pmat file: %w", err)
	}

	jsonData, err := json.Marshal(pmatData)
	if err != nil {
		return fmt.Errorf("failed to marshal pmat data: %w", err)
	}

	f, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("unable to create pmat.json file: %w", err)
	}
	defer func() {
		if closeErr := f.Close(); closeErr != nil && err == nil {
			err = fmt.Errorf("error closing output file: %w", closeErr)
		}
	}()

	bw := bufio.NewWriter(f)
	if _, err := bw.Write(jsonData); err != nil {
		return fmt.Errorf("failed to write to pmat.json file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}

	return nil
}

// ConvertJsonToPMat 接收输入文件路径和输出文件路径，将输入文件转换为 .pmat 文件
func (s *PMatService) ConvertJsonToPMat(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".json") {
		outputPath = strings.TrimSuffix(outputPath, ".json") + ".pmat"
	}

	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("cannot open pmat.json file: %w", err)
	}
	defer f.Close()

	var pmatData *COM3D2.PMat
	if err := json.NewDecoder(f).Decode(&pmatData); err != nil {
		return fmt.Errorf("parsing the pmat.json file failed: %w", err)
	}

	return s.WritePMatFile(outputPath, pmatData)
}
