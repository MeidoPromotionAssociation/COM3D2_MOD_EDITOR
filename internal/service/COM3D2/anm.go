package COM3D2

import (
	"bufio"
	"fmt"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"os"
)

// AnmService 专门处理 .anm 文件的读写
type AnmService struct{}

// ReadAnmFile 读取 .anm 文件并返回对应结构体
func (m *AnmService) ReadAnmFile(path string) (*COM3D2.Anm, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .anm file: %w", err)
	}
	defer f.Close()

	br := bufio.NewReaderSize(f, 1024*1024*10) //10MB 缓冲区
	anmData, err := COM3D2.ReadAnm(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .anm file failed: %w", err)
	}

	return anmData, nil
}

// WriteAnmFile 接收 Anm 数据并写入 .anm 文件
func (m *AnmService) WriteAnmFile(path string, anmData *COM3D2.Anm) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .anm file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := anmData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .anm file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}
