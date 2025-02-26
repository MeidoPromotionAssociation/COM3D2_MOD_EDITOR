package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/COM3D2"
	"bufio"
	"fmt"
	"os"
)

// PhyService 专门处理 .phy 文件的读写
type PhyService struct{}

// ReadPhyFile 读取 .phy 文件并返回对应结构体
func (m *PhyService) ReadPhyFile(path string) (*COM3D2.Phy, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .mate file: %w", err)
	}
	defer f.Close()

	br := bufio.NewReaderSize(f, 1024*1024*10)
	phyData, err := COM3D2.ReadPhy(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .mate file failed: %w", err)
	}

	return phyData, nil
}

// WritePhyFile 接收 Phy 数据并写入 .phy 文件
func (m *PhyService) WritePhyFile(path string, phyData *COM3D2.Phy) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .menu file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := phyData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .menu file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}
