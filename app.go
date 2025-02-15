package main

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/COM3D2"
	com3d2serivice "COM3D2_MOD_EDITOR_V2/internal/service/COM3D2"
	"context"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"os"
	"path/filepath"
	"strings"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// Startup is called when the app starts.
// The context is saved,
// so we can call the runtime methods
// `Startup` 事件：在应用启动时检查是否有文件路径传入
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx // 保存上下文，重要

	fmt.Println("App started")
	fmt.Println("Args:", os.Args)

	args := os.Args[1:] // 排除第一个参数（程序路径）
	// 过滤开发模式参数（如"--devtools"）
	var filePath string
	for _, arg := range args {
		if !strings.HasPrefix(arg, "--") && arg != "" {
			filePath = arg
			break
		}
	}

	runtime.EventsOnce(ctx, "app-ready", func(_ ...interface{}) {
		if filePath != "" {
			runtime.LogInfo(ctx, "[Go] 发送文件路径事件: "+filePath)
			runtime.EventsOnce(ctx, "file-opened", func(_ ...interface{}) {})
			runtime.EventsEmit(ctx, "file-opened", filePath)
		}
	})
}

// SelectFile 选择需要处理的文件，打开文件
func (a *App) SelectFile(filetype string, fileDisplayName string) string {
	selection, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Choose a file",
		Filters: []runtime.FileFilter{
			{
				DisplayName: fileDisplayName,
				Pattern:     filetype,
			},
		},
	})
	if err != nil {
		return fmt.Sprintf("err %s!", err)
	}
	return selection
}

// SaveFile 保存文件，另存为
func (a *App) SaveFile(filetype string, fileDisplayName string) string {
	selection, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title: "Save file",
		Filters: []runtime.FileFilter{
			{
				DisplayName: fileDisplayName,
				Pattern:     filetype,
			},
		},
	})
	if err != nil {
		return fmt.Sprintf("err %s!", err)
	}
	return selection
}

// OpenModFile 解析 MOD 文件
func (a *App) OpenModFile(path string) (interface{}, error) {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".menu":
		return com3d2serivice.NewMenuService().ReadFile(path)
	case ".mate":
		return com3d2serivice.NewMateService().ReadFile(path)
	case ".pmat":
		return com3d2serivice.NewPMatService().ReadFile(path)
	default:
		return nil, fmt.Errorf("unsupported extension: %s", ext)
	}
}

// SaveModFile 保存 MOD 文件
func (a *App) SaveModFile(path string, data interface{}) error {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".menu":
		menuData, ok := data.(COM3D2.Menu)
		if !ok {
			return fmt.Errorf("invalid data type for .menu file")
		}
		return com3d2serivice.NewMenuService().SaveFile(path, &menuData)
	case ".mate":
		mateData, ok := data.(COM3D2.Mate)
		if !ok {
			return fmt.Errorf("invalid data type for.mate file")
		}
		return com3d2serivice.NewMateService().SaveFile(path, &mateData)
	case ".pmat":
		pmatData, ok := data.(COM3D2.PMat)
		if !ok {
			return fmt.Errorf("invalid data type for.pmat file")
		}
		return com3d2serivice.NewPMatService().SaveFile(path, &pmatData)
	default:
		return fmt.Errorf("unsupported extension: %s", ext)
	}
}
