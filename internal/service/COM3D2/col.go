package COM3D2

import (
	"bufio"
	"fmt"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"os"
)

// ColService 专门处理 .col 文件的读写
type ColService struct{}

// ReadColFile 读取 .col 文件并返回对应结构体
func (m *ColService) ReadColFile(path string) (*COM3D2.Col, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .col file: %w", err)
	}
	defer f.Close()

	br := bufio.NewReaderSize(f, 1024*1024*1) //1MB 缓冲区
	colData, err := COM3D2.ReadCol(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .col file failed: %w", err)
	}

	return colData, nil
}

// WriteColFile 接收 Col 数据并写入 .col 文件
func (m *ColService) WriteColFile(path string, colData *COM3D2.Col) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .col file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := colData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .col file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}
