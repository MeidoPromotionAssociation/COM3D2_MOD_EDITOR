package tools

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sync"
	"syscall"
)

// too big, gave up
////go:embed thirdParty/ImageMagick/*.exe
//var embeddedMagick embed.FS

const tempMagickDir = "imagemagick_temp"
const magickExeName = "magick.exe"
const requiredMajorVersion = 7 // 需要的最低主版本号

var ISImageMagickInstalled bool
var magickMutex sync.Mutex

// 获取 ImageMagick 版本号
func getMagickVersion(magickPath string) (int, string, error) {
	cmd := exec.Command(magickPath, "-version")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	output, err := cmd.CombinedOutput()
	if err != nil {
		return 0, "", fmt.Errorf("execution magic -version failed: %v", err)
	}

	// 解析版本号 (示例: "ImageMagick 7.1.0-19 Q16 x64 2024-02-27")
	versionOutput := string(output)

	re := regexp.MustCompile(`ImageMagick (\d+)\.(\d+)\.(\d+)`)
	matches := re.FindStringSubmatch(versionOutput)
	if len(matches) < 4 {
		return 0, versionOutput, fmt.Errorf("unable to resolve version number")
	}

	majorVersion := matches[1]
	majorVersionInt := 0
	fmt.Sscanf(majorVersion, "%d", &majorVersionInt)

	return majorVersionInt, versionOutput, nil
}

// 查找系统中是否已安装 ImageMagick
func findSystemMagick() (string, bool) {
	magickPath, err := exec.LookPath("magick")
	if err == nil {

		// 检查版本号是否符合要求
		majorVersion, _, err := getMagickVersion(magickPath)
		if err == nil && majorVersion >= requiredMajorVersion {
			return magickPath, true
		}

		return magickPath, true
	}
	return "", false
}

// 检查临时目录是否已有 magick.exe
func findTempMagick() (string, bool) {
	exePath := filepath.Join(os.TempDir(), tempMagickDir, magickExeName)

	if _, err := os.Stat(exePath); err == nil {

		// 检查版本号是否符合要求
		majorVersion, _, err := getMagickVersion(exePath)
		if err == nil && majorVersion >= requiredMajorVersion {
			return exePath, true
		}

		return exePath, true
	}
	return "", false
}

// 释放嵌入的 ImageMagick 文件
//func extractMagick() (string, error) {
//	tempDir := filepath.Join(os.TempDir(), tempMagickDir)
//	err := os.MkdirAll(tempDir, 0755)
//	if err != nil {
//		return "", fmt.Errorf("unable to create temporary directory: %v", err)
//	}
//
//	err = fs.WalkDir(embeddedMagick, "imagemagick", func(path string, d fs.DirEntry, err error) error {
//		if err != nil {
//			return err
//		}
//		if d.IsDir() {
//			return nil
//		}
//		relPath, _ := filepath.Rel("imagemagick", path)
//		destPath := filepath.Join(tempDir, relPath)
//
//		// 读取嵌入的文件
//		data, err := embeddedMagick.ReadFile(path)
//		if err != nil {
//			return err
//		}
//
//		// 写入到临时目录
//		err = os.WriteFile(destPath, data, 0755)
//		if err != nil {
//			return err
//		}
//
//		fmt.Println("Releasing the imagemagick file:", destPath)
//		return nil
//	})
//
//	if err != nil {
//		return "", err
//	}
//
//	exePath := filepath.Join(tempDir, magickExeName)
//	return exePath, nil
//}

// CheckMagick 检查是否已安装对应版本的 ImageMagick
func CheckMagick() error {
	magickMutex.Lock()
	defer magickMutex.Unlock()

	// 每次应用启动只检查一次
	// 记住检查结果
	if ISImageMagickInstalled {
		return nil
	}

	//var magickPath string
	//var found bool

	//// 1. 检查是否有系统 ImageMagick
	//magickPath, found = findSystemMagick()
	//if !found {
	//	// 2. 检查临时目录是否已有 magick.exe
	//	magickPath, found = findTempMagick()
	//}

	//if !found {
	// 3. 如果都没有，则释放内置的 ImageMagick
	//var err error
	//magickPath, err = extractMagick()
	//if err != nil {
	//	fmt.Println("Release ImageMagick failed: ", err)
	//	return
	//}
	//	return fmt.Errorf("no ImageMagick found, please install ImageMagick first, we need ImageMagick version %d or higher，If you have Installed it make sure Path is setup (can run 'magick' command direct), and you need restart this app", requiredMajorVersion)
	//}

	// 测试运行 magick.exe
	//cmd := exec.Command(magickPath, "-version")
	cmd := exec.Command("magick", "-version")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	_, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("no ImageMagick found, please install ImageMagick first, we need ImageMagick version %d or higher，If you have Installed it make sure Path is setup (can run 'magick' command direct), and you need restart this app. error: "+err.Error(), requiredMajorVersion)
	}

	ISImageMagickInstalled = true
	return nil
}

// IsSupportedImageType 是否是 ImageMagick 支持的图片格式
// 依赖外部库 ImageMagick，且有 Path 环境变量可以直接调用 magick 命令
func IsSupportedImageType(filepath string) error {
	err := CheckMagick()
	if err != nil {
		return err
	}

	cmd := exec.Command("magick", "identify", filepath)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	_, err = cmd.CombinedOutput()
	return err
}

// ConvertImageToPng 将 ImageMagick 支持的文件格式转换为 PNG 格式
// 依赖外部库 ImageMagick，且有 Path 环境变量可以直接调用 magick 命令
func ConvertImageToPng(filepath string) (imageData []byte, err error) {
	err = CheckMagick()
	if err != nil {
		return nil, err
	}

	pr, pw := io.Pipe()
	defer pr.Close()

	cmd := exec.Command("magick", "convert", filepath, "png:-")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	cmd.Stdout = pw

	go func() {
		defer pw.Close()
		if err = cmd.Run(); err != nil {
			err = pw.CloseWithError(err)
			if err != nil {
				return
			}
		}
	}()

	imageData, err = io.ReadAll(pr)
	if err != nil {
		return nil, fmt.Errorf("conversion failed: %v", err)
	}

	return imageData, nil
}

// ConvertImageToImage 将任意 ImageMagick 支持的文件格式转换为任意 ImageMagick 支持的格式
// 依赖外部库 ImageMagick，且有 Path 环境变量可以直接调用 magick 命令
func ConvertImageToImage(inputPath string, outputFormat string) (imageData []byte, err error) {
	err = CheckMagick()
	if err != nil {
		return nil, err
	}

	pr, pw := io.Pipe()
	defer pr.Close()

	cmd := exec.Command("magick", inputPath, fmt.Sprintf("%s:-", outputFormat))
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	cmd.Stdout = pw

	go func() {
		defer pw.Close()
		if err = cmd.Run(); err != nil {
			err = pw.CloseWithError(err)
			if err != nil {
				return
			}
		}
	}()

	imageData, err = io.ReadAll(pr)
	if err != nil {
		return nil, fmt.Errorf("conversion failed: %v", err)
	}

	return imageData, nil
}

// ConvertImageToImageAndWrite 将任意 ImageMagick 支持的文件格式转换为任意 ImageMagick 支持的格式，并写出
// 依赖外部库 ImageMagick，且有 Path 环境变量可以直接调用 magick 命令
func ConvertImageToImageAndWrite(inputPath string, outputPath string) error {
	err := CheckMagick()
	if err != nil {
		return err
	}
	cmd := exec.Command("magick", inputPath, outputPath)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	_, err = cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("conversion failed: %v", err)
	}
	return nil
}
