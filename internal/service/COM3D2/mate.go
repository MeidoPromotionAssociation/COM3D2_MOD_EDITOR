package COM3D2

import (
	"bufio"
	"fmt"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"os"
)

// MateService 专门处理 .mate 文件的读写
type MateService struct{}

// ReadMateFile 读取 .mate 文件并返回对应结构体
func (m *MateService) ReadMateFile(path string) (*COM3D2.Mate, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .mate file: %w", err)
	}
	defer f.Close()

	br := bufio.NewReaderSize(f, 1024*1024*1) //1MB 缓冲区
	mateData, err := COM3D2.ReadMate(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .mate file failed: %w", err)
	}

	return mateData, nil
}

// WriteMateFile 接收 Mate 数据并写入 .mate 文件
func (m *MateService) WriteMateFile(path string, mateData *COM3D2.Mate) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .mate file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := mateData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .mate file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}
