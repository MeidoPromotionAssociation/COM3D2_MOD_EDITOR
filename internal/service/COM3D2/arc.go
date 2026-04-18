package COM3D2

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2/arc"
)

type ArcService struct{}

// NewArc 创建一个空的 Arc 结构体
func (a *ArcService) NewArc(name string) *arc.Arc {
	if name == "" {
		name = "root"
	}
	return arc.NewArc(name)
}

// ReadArc 读取 .arc 文件并返回对应结构体
// arc 数据将被完整读入内存，请注意占用
func (a *ArcService) ReadArc(path string) (*arc.Arc, error) {
	arcFs, err := arc.ReadArcFile(path)
	if err != nil {
		return nil, fmt.Errorf("parsing the .arc file failed: %w", err)
	}

	return arcFs, nil
}

// ReadArcLazy 读取 .arc 文件并返回对应结构体
// 不会将所有数据都读入内存，而是在需要时从文件读取
// 因此读取完成后，调用者必须关闭返回的 io.Closer
func (a *ArcService) ReadArcLazy(path string) (*arc.Arc, io.Closer, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, nil, fmt.Errorf("cannot open .arc file: %w", err)
	}

	arcFs, err := arc.ReadArc(f)
	if err != nil {
		_ = f.Close()
		return nil, nil, fmt.Errorf("parsing the .arc file failed: %w", err)
	}

	return arcFs, f, nil
}

// UnpackArc 将 .arc 文件解压到指定文件夹
func (a *ArcService) UnpackArc(path string, outDir string) error {
	fs, closer, err := a.ReadArcLazy(path)
	if err != nil {
		return err
	}
	defer closer.Close()
	return fs.Unpack(outDir)
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
func (a *ArcService) CopyFile(fs *arc.Arc, srcPath string, dstPath string) error {
	return fs.CopyFile(srcPath, dstPath)
}

// ExtractFile 从 Arc 中提取单个文件
func (a *ArcService) ExtractFile(fs *arc.Arc, path string, outPath string) error {
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
// 在目录树中，相对于给定的父目录，在指定路径处创建一个文件节点。
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
