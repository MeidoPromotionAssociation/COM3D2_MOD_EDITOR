package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/COM3D2"
	"bufio"
	"fmt"
	"os"
)

// ReadFunc 定义通用的文件解析方法
type ReadFunc[T any] func(*bufio.Reader) (*T, error)

// DumpFunc 定义通用的文件写入方法
type DumpFunc[T any] func(*T, *bufio.Writer) error

// FileService 泛型结构体，适用于任何文件类型（如 .menu 和 .mate）
type FileService[T any] struct {
	Read ReadFunc[T] // 解析方法
	Dump DumpFunc[T] // 序列化方法
}

// ReadFile 读取 MOD 文件并返回数据结构
func (s *FileService[T]) ReadFile(path string) (*T, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open file: %w", err)
	}
	defer f.Close()

	br := bufio.NewReaderSize(f, 1024*1024*10) // 10MB 缓冲区
	data, err := s.Read(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the file failed: %w", err)
	}
	return data, nil
}

// SaveFile 写入 MOD 文件
func (s *FileService[T]) SaveFile(path string, data *T) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := s.Dump(data, bw); err != nil {
		return fmt.Errorf("failed to write to file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flushing buffer: %w", err)
	}
	return nil
}

// NewMenuService 创建 .menu 文件的通用处理器
func NewMenuService() *FileService[COM3D2.Menu] {
	return &FileService[COM3D2.Menu]{
		Read: func(br *bufio.Reader) (*COM3D2.Menu, error) {
			return COM3D2.ReadMenu(br)
		},
		Dump: func(menu *COM3D2.Menu, bw *bufio.Writer) error {
			return menu.Dump(bw)
		},
	}
}

// NewMateService 创建 .mate 文件的通用处理器
func NewMateService() *FileService[COM3D2.Mate] {
	return &FileService[COM3D2.Mate]{
		Read: func(br *bufio.Reader) (*COM3D2.Mate, error) {
			return COM3D2.ReadMate(br)
		},
		Dump: func(mate *COM3D2.Mate, bw *bufio.Writer) error {
			return mate.Dump(bw)
		},
	}
}

// NewPMatService 创建 .pmat 文件的通用处理器
func NewPMatService() *FileService[COM3D2.PMat] {
	return &FileService[COM3D2.PMat]{
		Read: func(br *bufio.Reader) (*COM3D2.PMat, error) {
			return COM3D2.ReadPMat(br)
		},
		Dump: func(pmat *COM3D2.PMat, bw *bufio.Writer) error {
			return pmat.Dump(bw)
		},
	}
}
