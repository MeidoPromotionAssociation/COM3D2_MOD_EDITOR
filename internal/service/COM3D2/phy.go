package COM3D2

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
)

// PhyService 专门处理 .phy 文件的读写
type PhyService struct{}

// ReadPhyFile 读取 .phy 或 .phy.json 文件并返回对应结构体
func (m *PhyService) ReadPhyFile(path string) (*COM3D2.Phy, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .phy file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		decoder := json.NewDecoder(f)
		phyData := &COM3D2.Phy{}
		if err := decoder.Decode(phyData); err != nil {
			return nil, fmt.Errorf("failed to read .phy.json file: %w", err)
		}
		return phyData, nil
	}

	phyData, err := COM3D2.ReadPhy(f) // 无需缓冲，3579 个样本中 90% 文件小于: 754 B
	if err != nil {
		return nil, fmt.Errorf("parsing the .phy file failed: %w", err)
	}

	return phyData, nil
}

// WritePhyFile 接收 Phy 数据并写入 .phy 或 .phy.json 文件
func (m *PhyService) WritePhyFile(path string, phyData *COM3D2.Phy) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .phy file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		marshal, err := json.Marshal(phyData)
		if err != nil {
			return err
		}
		_, err = f.Write(marshal)
		if err != nil {
			return fmt.Errorf("failed to write to .phy.json file: %w", err)
		}
		return nil
	}

	bw := bufio.NewWriter(f)
	if err := phyData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .phy file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}

// ConvertPhyToJson 接收输入文件路径和输出文件路径，将输入文件转换为 .json 文件
func (m *PhyService) ConvertPhyToJson(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".phy") {
		outputPath = strings.TrimSuffix(outputPath, ".phy") + ".phy.json"
	}

	phyData, err := m.ReadPhyFile(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read phy file: %w", err)
	}

	jsonData, err := json.Marshal(phyData)
	if err != nil {
		return fmt.Errorf("failed to marshal phy data: %w", err)
	}

	f, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("unable to create phy.json file: %w", err)
	}
	defer func() {
		if closeErr := f.Close(); closeErr != nil && err == nil {
			err = fmt.Errorf("error closing output file: %w", closeErr)
		}
	}()

	bw := bufio.NewWriter(f)
	if _, err := bw.Write(jsonData); err != nil {
		return fmt.Errorf("failed to write to phy.json file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}

	return nil
}

// ConvertJsonToPhy 接收输入文件路径和输出文件路径，将输入文件转换为 .phy 文件
func (m *PhyService) ConvertJsonToPhy(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".json") {
		outputPath = strings.TrimSuffix(outputPath, ".json") + ".phy"
	}

	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("cannot open phy.json file: %w", err)
	}
	defer f.Close()

	var phyData *COM3D2.Phy
	if err := json.NewDecoder(f).Decode(&phyData); err != nil {
		return fmt.Errorf("parsing the phy.json file failed: %w", err)
	}

	return m.WritePhyFile(outputPath, phyData)
}
