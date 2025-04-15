package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/COM3D2"
	"bufio"
	"fmt"
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

	//br := bufio.NewReaderSize(f, 1024*1024*10) //10MB 缓冲区
	var br io.ReadSeeker = f
	modelData, err := COM3D2.ReadModel(br)
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
