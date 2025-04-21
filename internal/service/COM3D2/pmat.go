package COM3D2

import (
	"bufio"
	"fmt"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"os"
)

// PMatService 专门处理 .pmat 文件的读写
type PMatService struct{}

// ReadPMatFile 读取 .pmat 文件并返回对应结构体
func (s *PMatService) ReadPMatFile(path string) (*COM3D2.PMat, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .pmat file: %w", err)
	}
	defer f.Close()

	br := bufio.NewReaderSize(f, 1024*1024*1) //1MB 缓冲区
	PMatData, err := COM3D2.ReadPMat(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .pmat file failed: %w", err)
	}

	return PMatData, nil
}

// WritePMatFile 接收 PMat 数据并写入 .pmat 文件
func (s *PMatService) WritePMatFile(path string, PMatData *COM3D2.PMat) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .pmat file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := PMatData.Dump(bw, true); err != nil {
		return fmt.Errorf("failed to write to .pmat file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}
