package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/COM3D2"
	"bufio"
	"fmt"
	"os"
)

// ColService 专门处理 .col 文件的读写
type ColService struct{}

// ReadColFile 读取 .col 文件并返回对应结构体
func (m *MateService) ReadColFile(path string) (*COM3D2.Col, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .mate file: %w", err)
	}
	defer f.Close()

	br := bufio.NewReaderSize(f, 1024*1024*10)
	colData, err := COM3D2.ReadCol(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .mate file failed: %w", err)
	}

	return colData, nil
}

// SaveColFile 接收 Col 数据并写入 .col 文件
func (m *MateService) WriteColFile(path string, colData *COM3D2.Col) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .menu file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := colData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .menu file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}
