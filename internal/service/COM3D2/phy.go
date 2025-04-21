package COM3D2

import (
	"bufio"
	"fmt"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"os"
)

// PhyService 专门处理 .phy 文件的读写
type PhyService struct{}

// ReadPhyFile 读取 .phy 文件并返回对应结构体
func (m *PhyService) ReadPhyFile(path string) (*COM3D2.Phy, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .phy file: %w", err)
	}
	defer f.Close()

	br := bufio.NewReaderSize(f, 1024*1024*1) //1MB 缓冲区
	phyData, err := COM3D2.ReadPhy(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .phy file failed: %w", err)
	}

	return phyData, nil
}

// WritePhyFile 接收 Phy 数据并写入 .phy 文件
func (m *PhyService) WritePhyFile(path string, phyData *COM3D2.Phy) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .phy file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := phyData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .phy file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}
