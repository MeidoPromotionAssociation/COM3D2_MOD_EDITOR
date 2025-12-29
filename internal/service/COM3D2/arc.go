package COM3D2

import (
	"fmt"
	"path/filepath"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2/arc"
)

type ArcService struct{}

// NewArc 创建一个空的 Arc 结构体
func (a *ArcService) NewArc(name string) *arc.Arc {
	return arc.New(name)
}

// ReadArc 读取 .arc 文件并返回对应结构体
func (a *ArcService) ReadArc(path string) (*arc.Arc, error) {
	return arc.ReadArc(path)
}

// UnpackArc 将 .arc 文件解压到指定文件夹
func (a *ArcService) UnpackArc(path string, outDir string) error {
	return arc.UnpackArc(path, outDir)
}

// PackArc 将文件夹打包为 .arc 文件
func (a *ArcService) PackArc(dirPath string, arcPath string) error {
	return arc.Pack(dirPath, arcPath)
}

// MergeArc 将 fromArc 合并到 toArc 中。如果 keepDupes 为真，则使用文件的完整路径作为键；否则使用最后一个段。
func (a *ArcService) MergeArc(fromArc *arc.Arc, toArc *arc.Arc, keepDupes bool) *arc.Arc {
	toArc.MergeFrom(fromArc, keepDupes)
	return toArc
}

// GetFileList 获取 Arc 中的所有文件列表（相对路径）
func (a *ArcService) GetFileList(fs *arc.Arc) []string {
	return fs.GetFileList()
}

// CopyFile 在 Arc 内部复制文件
func (a *ArcService) CopyFile(fs *arc.Arc, srcPath, dstPath string) error {
	return fs.CopyFile(srcPath, dstPath)
}

// ExtractFile 从 Arc 中提取单个文件
func (a *ArcService) ExtractFile(fs *arc.Arc, path, outPath string) error {
	f := fs.GetFile(path)
	if f == nil {
		return fmt.Errorf("file not found: %s", path)
	}
	return f.Extract(outPath)
}

// ExtractFiles 从 Arc 中提取多个文件到指定目录
func (a *ArcService) ExtractFiles(fs *arc.Arc, paths []string, outDir string) error {
	for _, p := range paths {
		f := fs.GetFile(p)
		if f == nil {
			return fmt.Errorf("file not found: %s", p)
		}
		targetPath := filepath.Join(outDir, f.RelativePath())
		if err := f.Extract(targetPath); err != nil {
			return err
		}
	}
	return nil
}

// CreateFile 在 Arc 中创建或更新文件
func (a *ArcService) CreateFile(fs *arc.Arc, path string, data []byte) error {
	f := fs.CreateFile(path, data)
	if f == nil {
		return fmt.Errorf("failed to create file: %s", path)
	}
	return nil
}

// DeleteFile 在 Arc 中删除文件
func (a *ArcService) DeleteFile(fs *arc.Arc, path string) error {
	if !fs.DeleteFile(path) {
		return fmt.Errorf("file not found: %s", path)
	}
	return nil
}
