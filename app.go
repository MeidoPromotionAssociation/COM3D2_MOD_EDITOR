package main

import (
	"context"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"os"
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
	// 过滤其他参数
	var filePath string
	for _, arg := range args {
		if !strings.HasPrefix(arg, "--") && !strings.HasPrefix(arg, "-") && arg != "" {
			filePath = arg
			break
		}
	}

	runtime.EventsOnce(ctx, "app-ready", func(_ ...interface{}) {
		if filePath != "" {
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
