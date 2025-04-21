package COM3D2

import (
	"bufio"
	"fmt"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"os"
)

// PskService 专门处理 .psk 文件的读写
type PskService struct{}

// ReadPskFile 读取 .psk 文件并返回对应结构体
func (m *PskService) ReadPskFile(path string) (*COM3D2.Psk, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .psk file: %w", err)
	}
	defer f.Close()

	br := bufio.NewReaderSize(f, 1024*1024*1) //1MB 缓冲区
	pskData, err := COM3D2.ReadPsk(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .psk file failed: %w", err)
	}

	return pskData, nil
}

// WritePskFile 接收 Psk 数据并写入 .psk 文件
func (m *PskService) WritePskFile(path string, pskData *COM3D2.Psk) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .psk file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := pskData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .psk file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}
