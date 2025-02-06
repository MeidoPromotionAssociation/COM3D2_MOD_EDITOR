package main

import (
	"context"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"os"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// Startup is called when the app starts. The context is saved
// so we can call the runtime methods
// `Startup` 事件：在应用启动时检查是否有文件路径传入
func (a *App) Startup(ctx context.Context) {
	if len(os.Args) > 1 {
		filePath := os.Args[1] // 获取双击打开的文件路径

		// 发送文件路径到前端
		runtime.EventsEmit(ctx, "file-opened", filePath)
	}
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
