package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/COM3D2"
	"fmt"
	"path/filepath"
	"strings"
)

type CommonService struct{}

// OpenModFile 解析 MOD 文件
func (a *CommonService) OpenModFile(path string) (interface{}, error) {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".menu":
		return NewMenuService().ReadFile(path)
	case ".mate":
		return NewMateService().ReadFile(path)
	case ".pmat":
		return NewPMatService().ReadFile(path)
	default:
		return nil, fmt.Errorf("unsupported extension: %s", ext)
	}
}

// SaveModFile 保存 MOD 文件
func (a *CommonService) SaveModFile(path string, data interface{}) error {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".menu":
		menuData, ok := data.(COM3D2.Menu)
		if !ok {
			return fmt.Errorf("invalid data type for .menu file")
		}
		return NewMenuService().SaveFile(path, &menuData)
	case ".mate":
		mateData, ok := data.(COM3D2.Mate)
		if !ok {
			return fmt.Errorf("invalid data type for.mate file")
		}
		return NewMateService().SaveFile(path, &mateData)
	case ".pmat":
		pmatData, ok := data.(COM3D2.PMat)
		if !ok {
			return fmt.Errorf("invalid data type for.pmat file")
		}
		return NewPMatService().SaveFile(path, &pmatData)
	default:
		return fmt.Errorf("unsupported extension: %s", ext)
	}
}
