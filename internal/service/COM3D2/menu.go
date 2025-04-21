package COM3D2

import (
	"bufio"
	"fmt"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"os"
)

// MenuService 专门处理 .menu 文件的读写
type MenuService struct{}

// ReadMenuFile 读取 .menu 文件并返回对应结构体
func (s *MenuService) ReadMenuFile(path string) (*COM3D2.Menu, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .menu file: %w", err)
	}
	defer f.Close()

	br := bufio.NewReaderSize(f, 1024*1024*1) //1MB 缓冲区
	menuData, err := COM3D2.ReadMenu(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .menu file failed: %w", err)
	}
	return menuData, nil
}

// WriteMenuFile 接收 Menu 数据并写入 .menu 文件
func (s *MenuService) WriteMenuFile(path string, menuData *COM3D2.Menu) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .menu file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := menuData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .menu file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}
