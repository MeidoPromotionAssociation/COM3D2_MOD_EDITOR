package COM3D2

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
)

// MenuService 专门处理 .menu 文件的读写
type MenuService struct{}

// ReadMenuFile 读取 .menu 或 .menu.json 文件并返回对应结构体
func (s *MenuService) ReadMenuFile(path string) (*COM3D2.Menu, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .menu file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		decoder := json.NewDecoder(f)
		menuData := &COM3D2.Menu{}
		if err := decoder.Decode(menuData); err != nil {
			return nil, fmt.Errorf("failed to read .menu.json file: %w", err)
		}
		return menuData, nil
	}

	br := bufio.NewReaderSize(f, 1024*1024*1) //1MB 缓冲区
	menuData, err := COM3D2.ReadMenu(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .menu file failed: %w", err)
	}
	return menuData, nil
}

// WriteMenuFile 接收 Menu 数据并写入 .menu 或 .menu.json 文件
func (s *MenuService) WriteMenuFile(path string, menuData *COM3D2.Menu) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .menu file: %w", err)
	}
	defer f.Close()

	if strings.HasSuffix(path, ".json") {
		marshal, err := json.Marshal(menuData)
		if err != nil {
			return err
		}
		_, err = f.Write(marshal)
		if err != nil {
			return fmt.Errorf("failed to write to .menu.json file: %w", err)
		}
		return nil
	}

	bw := bufio.NewWriter(f)
	if err := menuData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .menu file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}

// ConvertMenuToJson 接收输入文件路径和输出文件路径，将输入文件转换为 .json 文件
func (s *MenuService) ConvertMenuToJson(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".menu") {
		outputPath = strings.TrimSuffix(outputPath, ".menu") + ".menu.json"
	}

	menuData, err := s.ReadMenuFile(inputPath)
	if err != nil {
		return fmt.Errorf("failed to read menu file: %w", err)
	}

	jsonData, err := json.Marshal(menuData)
	if err != nil {
		return fmt.Errorf("failed to marshal menu data: %w", err)
	}

	f, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("unable to create menu.json file: %w", err)
	}
	defer func() {
		if closeErr := f.Close(); closeErr != nil && err == nil {
			err = fmt.Errorf("error closing output file: %w", closeErr)
		}
	}()

	bw := bufio.NewWriter(f)
	if _, err := bw.Write(jsonData); err != nil {
		return fmt.Errorf("failed to write to menu.json file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}

	return nil
}

// ConvertJsonToMenu 接收输入文件路径和输出文件路径，将输入文件转换为 .menu 文件
func (s *MenuService) ConvertJsonToMenu(inputPath string, outputPath string) error {
	if strings.HasSuffix(outputPath, ".json") {
		outputPath = strings.TrimSuffix(outputPath, ".json") + ".menu"
	}

	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("cannot open menu.json file: %w", err)
	}
	defer f.Close()

	var menuData *COM3D2.Menu
	if err := json.NewDecoder(f).Decode(&menuData); err != nil {
		return fmt.Errorf("parsing the menu.json file failed: %w", err)
	}

	return s.WriteMenuFile(outputPath, menuData)
}
