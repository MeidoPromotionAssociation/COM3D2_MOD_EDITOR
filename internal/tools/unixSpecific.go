//go:build !windows

package tools

import "os/exec"

// SetHideWindow 隐藏窗口
// 这个函数通常在执行外部命令时使用，以确保命令行窗口不会显示出来。
// 但在非 Windows 系统下，这个函数什么也不做。
func SetHideWindow(cmd *exec.Cmd) {
	// do nothing
}
