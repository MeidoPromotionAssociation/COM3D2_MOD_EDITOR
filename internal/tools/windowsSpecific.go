//go:build windows

package tools

import (
	"os/exec"
	"syscall"
)

// SetHideWindow 用于设置 Windows 系统下的命令行窗口隐藏属性。
// 这个函数通常在执行外部命令时使用，以确保命令行窗口不会显示出来。
func SetHideWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}
