package main

import (
	"COM3D2_MOD_EDITOR_V2/internal/tools"
	"context"
	"encoding/json"
	"fmt"
	"github.com/Masterminds/semver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	// GitHubApiURL GitHub API 版本检查 URL
	GitHubApiURL = "https://api.github.com/repos/90135/COM3D2_MOD_EDITOR/releases/latest"
	// CurrentVersion 当前应用版本
	CurrentVersion = "v1.3.1"
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

// SelectFile 选择需要处理的文件，返回用户选择的文件路径
func (a *App) SelectFile(filetype string, fileDisplayName string) (path string) {
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
		// 前端无法通过返回 error 来判断是否保存成功，所以这里直接 panic，这样前端就知道失败了
		panic(err)
	}
	return selection
}

// SelectPathToSave 选择一个路径保存文件，返回用户选择的路径
func (a *App) SelectPathToSave(filetype string, fileDisplayName string) (path string) {
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
		panic(err)
	}
	return selection
}

// GetAppVersion 获取应用版本
func (a *App) GetAppVersion() string {
	return CurrentVersion
}

type VersionCheckResult struct {
	CurrentVersion string
	LatestVersion  string
	IsNewer        bool
}

// CheckLatestVersion 版本检查
// 不幸的是，Wails 只接受一个返回值和一个错误，所以我们需要结构体来返回多个值
func (a *App) CheckLatestVersion() (VersionCheckResult, error) {
	latestVersion, err := fetchLatestVersion()
	if err != nil {
		return VersionCheckResult{
			CurrentVersion: CurrentVersion,
			LatestVersion:  "",
			IsNewer:        false,
		}, err
	}

	isNewer, err := a.CompareVersions(CurrentVersion, latestVersion)
	if err != nil {
		return VersionCheckResult{
			CurrentVersion: CurrentVersion,
			LatestVersion:  latestVersion,
			IsNewer:        false,
		}, err
	}

	return VersionCheckResult{
		CurrentVersion: CurrentVersion,
		LatestVersion:  latestVersion,
		IsNewer:        isNewer,
	}, nil
}

// fetchLatestVersion 从 GitHub 获取最新 release 版本
func fetchLatestVersion() (version string, err error) {
	client := &http.Client{
		Timeout: 120 * time.Second,
	}
	resp, err := client.Get(GitHubApiURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub API request failed, status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var release struct {
		TagName string `json:"tag_name"`
	}

	if err := json.Unmarshal(body, &release); err != nil {
		return "", err
	}

	return release.TagName, nil
}

// CompareVersions 版本号比较
// 比较两个版本号的大小，返回 true 表示 localVersion 小于 latestVersion
func (a *App) CompareVersions(localVersion, latestVersion string) (bool, error) {
	// semver not support big letter V prefix, so we need to remove it
	if strings.HasPrefix(localVersion, "V") {
		localVersion = "v" + localVersion[1:]
	}
	if strings.HasPrefix(latestVersion, "V") {
		latestVersion = "v" + latestVersion[1:]
	}

	lv, err := semver.NewVersion(localVersion)
	if err != nil {
		return false, fmt.Errorf("invalid local version: %v", err)
	}

	lvRemote, err := semver.NewVersion(latestVersion)
	if err != nil {
		return false, fmt.Errorf("invalid remote version: %v", err)
	}

	return lvRemote.GreaterThan(lv), nil
}

// IsSupportedImageType 是否是 ImageMagick 支持的图片格式
// 依赖外部库 ImageMagick，且有 Path 环境变量可以直接调用 magick 命令
func (a *App) IsSupportedImageType(filePath string) bool {
	err := tools.IsSupportedImageType(filePath)
	if err != nil {
		return false
	}
	return true
}
