package COM3D2

import (
	"bufio"
	"fmt"
	"os"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/tools"
)

// NeiService 专门处理 .nei 文件的读写
type NeiService struct{}

// ReadNeiFile 读取 .nei 文件并返回对应结构体
func (s *NeiService) ReadNeiFile(path string) (*COM3D2.Nei, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .nei file: %w", err)
	}
	defer f.Close()

	br := bufio.NewReader(f)
	neiData, err := COM3D2.ReadNei(br, nil) // 4KB 缓冲区， 172 个样本中 90% 文件小于 2.94 KB，平均 1.91 KB，中位数 1.74 KB，最大值 10.63 KB
	if err != nil {
		return nil, fmt.Errorf("parsing the .nei file failed: %w", err)
	}

	return neiData, nil
}

// WriteNeiFile 接收 Nei 数据并写入 .nei 文件
func (s *NeiService) WriteNeiFile(neiData *COM3D2.Nei, path string) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .nei file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := neiData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .nei file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}

// CSVToNei 将 CSV 结构转换为 Nei 结构体
func (s *NeiService) CSVToNei(csvData [][]string) (*COM3D2.Nei, error) {
	return &COM3D2.Nei{
		Rows: uint32(len(csvData)),
		Cols: uint32(len(csvData[0])),
		Data: csvData,
	}, nil
}

// NeiToCSV 将 Nei 结构体转换为 CSV 结构
func (s *NeiService) NeiToCSV(neiData *COM3D2.Nei) (csvDate [][]string, err error) {
	return neiData.Data, nil
}

// NeiToCSVFile 将 Nei 结构体转换为 CSV 文件
func (s *NeiService) NeiToCSVFile(neiData *COM3D2.Nei, outputPath string) error {
	csvFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to create CSV file: %w", err)
	}
	defer csvFile.Close()

	if err := tools.WriteCSVWithUTF8BOM(csvFile, neiData.Data); err != nil {
		return fmt.Errorf("failed to write CSV file: %w", err)
	}

	return nil
}

// NeiFileToCSVFile 将 Nei 文件转换为 CSV 文件
func (s *NeiService) NeiFileToCSVFile(inputPath string, outputPath string) error {
	csvData, err := s.NeiFileToCSV(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read Nei file: %w", err)
	}

	csvFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to create CSV file: %w", err)
	}
	defer csvFile.Close()

	if err := tools.WriteCSVWithUTF8BOM(csvFile, csvData); err != nil {
		return fmt.Errorf("failed to write CSV file: %w", err)
	}

	return nil
}

// CSVFileToNeiFile 将 CSV 文件转换为 Nei 文件
func (s *NeiService) CSVFileToNeiFile(inputPath string, outputPath string) error {
	csvData, err := s.CSVFileToNei(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read CSV file: %w", err)
	}

	err = s.WriteNeiFile(csvData, outputPath)
	if err != nil {
		return fmt.Errorf("failed to write Nei file: %w", err)
	}

	return nil
}

// CSVFileToNei 读取 .csv 文件并返回对应的 Nei 结构体
func (s *NeiService) CSVFileToNei(path string) (*COM3D2.Nei, error) {
	csvFile, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open CSV file: %w", err)
	}
	defer csvFile.Close()

	reader := tools.NewCSVReaderSkipUTF8BOM(csvFile, 0)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSV: %w", err)
	}

	if len(records) == 0 {
		return &COM3D2.Nei{Rows: 0, Cols: 0, Data: [][]string{}}, nil
	}

	// 计算最大列数
	maxCols := 0
	for _, record := range records {
		if len(record) > maxCols {
			maxCols = len(record)
		}
	}

	// 标准化数据（确保所有行都有相同列数）
	data := make([][]string, len(records))
	for i, record := range records {
		row := make([]string, maxCols)
		copy(row, record)
		data[i] = row
	}

	return &COM3D2.Nei{
		Rows: uint32(len(records)),
		Cols: uint32(maxCols),
		Data: data,
	}, nil
}

// NeiFileToCSV 读取 .nei 文件并返回对应的 CSV 结构体
func (s *NeiService) NeiFileToCSV(inputPath string) (csvData [][]string, err error) {
	neiData, err := s.ReadNeiFile(inputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read Nei file: %w", err)
	}

	csvData, err = s.NeiToCSV(neiData)
	if err != nil {
		return nil, fmt.Errorf("failed to convert Nei to CSV: %w", err)
	}

	return csvData, nil
}
