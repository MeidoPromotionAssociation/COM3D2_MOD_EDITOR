package COM3D2

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/utilities"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/tools"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// 游戏名称
const (
	GameCOM3D2 = "COM3D2"
	GameKCES   = "KCES"
)

// 文件类型
const (
	FormatBinary = "binary"
	FormatJSON   = "json"
)

// 文件类型集合，用于判断文件类型
var fileTypeSet = map[string]struct{}{
	"menu":  {},
	"mate":  {},
	"pmat":  {},
	"col":   {},
	"phy":   {},
	"psk":   {},
	"tex":   {},
	"anm":   {},
	"model": {},
}

// 文件签名映射，用于判断文件类型
var fileSignatureMap = map[string]string{
	COM3D2.MenuSignature:   "menu",
	COM3D2.MateSignature:   "mate",
	COM3D2.PMatSignature:   "pmat",
	COM3D2.ColSignature:    "col",
	COM3D2.PhySignature:    "phy",
	COM3D2.PskSignature:    "psk",
	COM3D2.TexSignature:    "tex",
	COM3D2.ModelSignature:  "model",
	COM3D2.AnmSignature:    "anm",
	COM3D2.PresetSignature: "preset",
	COM3D2.SaveSignature:   "save",
}

type CommonService struct{}

// FileInfo 用于表示文件类型的结构
type FileInfo struct {
	FileType      string `json:"FileType"`      // 文件类型名称
	StorageFormat string `json:"StorageFormat"` // 用于区分二进制和 JSON 格式 binary/json，见顶部常量定义
	Game          string `json:"Game"`          // 游戏名称 COM3D2/KCES，见顶部常量定义
	Signature     string `json:"Signature"`     // 文件签名
	Version       int32  `json:"Version"`       // 文件版本
	Path          string `json:"Path"`          // 文件路径
	Size          int64  `json:"Size"`          // 文件大小
}

// FileHeader 用于 JSON 部分读取的结构
type FileHeader struct {
	Signature string `json:"Signature"`
	Version   int32  `json:"Version"`
}

// FileTypeDetermine 判断文件类型，支持二进制和 JSON 格式
// strictMode 为 true 时，严格按照文件内容判断文件类型
// strictMode 为 false 时，优先根据文件后缀判断文件类型，如果无法判断再根据文件内容判断
func (m *CommonService) FileTypeDetermine(path string, strictMode bool) (fileInfo FileInfo, err error) {
	fileInfo.Path = path

	// 打开文件
	f, err := os.Open(path)
	if err != nil {
		return fileInfo, err
	}
	defer f.Close()

	// 获取文件大小
	fi, err := f.Stat()
	if err != nil {
		return fileInfo, err
	}
	fileInfo.Size = fi.Size()

	// 非严格模式下，优先根据文件后缀判断文件类型
	if !strictMode {
		ext := strings.ToLower(filepath.Ext(path))
		if ext != "" {
			// 去掉开头的点
			ext = ext[1:]

			// 检查是否是已知的文件类型
			_, exists := fileTypeSet[ext]
			if exists {
				// 根据扩展名设置文件类型信息
				fileInfo.FileType = ext
				fileInfo.Game = GameCOM3D2
				fileInfo.StorageFormat = FormatBinary

				// 尝试打开文件获取实际签名和版本
				signature, readErr := utilities.ReadString(f)
				if readErr != nil {
					fmt.Printf("Warning: Failed to read signature from file %s: %v\n", path, readErr)
					return fileInfo, nil //读取失败也不返回错误，因为是非严格模式
				}
				fileInfo.Signature = signature
				version, readErr := utilities.ReadInt32(f)
				if readErr != nil {
					fmt.Printf("Warning: Failed to read version from file %s: %v\n", path, readErr)
					return fileInfo, nil
				}
				fileInfo.Version = version
				return fileInfo, nil
			}
		}
	}

	// 严格模式或者通过扩展名无法判断时，根据文件内容判断

	// 首先检查是否为支持的图片类型
	imageErr := tools.IsSupportedImageType(path)
	if imageErr == nil {
		// 设置为图片类型
		fileInfo.FileType = "image"
		fileInfo.StorageFormat = FormatBinary
		return fileInfo, nil
	}

	// 使用更小的缓冲区快速检查文件头
	headerBytes := make([]byte, 128) // 减小到128字节，足够检查JSON开头
	n, err := f.Read(headerBytes)
	if err != nil && err != io.EOF {
		return fileInfo, err
	}
	headerBytes = headerBytes[:n]

	// 检查文件是否为 JSON 格式 (简单判断是否以'{'开头)
	if bytes.HasPrefix(bytes.TrimSpace(headerBytes), []byte{'{'}) {
		return parseJSONFileType(headerBytes, path, fileInfo)
	}

	// 如果不是 JSON，假设是二进制格式，重置文件读取位置
	_, err = f.Seek(0, 0)
	if err != nil {
		// 如果重置失败，回退到使用已读取的数据创建 Reader
		fmt.Printf("Warning: Failed to seek file %s to beginning: %v. Using buffer instead.\n", path, err)
		var rs io.ReadSeeker = bytes.NewReader(headerBytes)
		return readBinaryFileType(rs, fileInfo)
	}

	// 使用重置后的文件指针读取
	return readBinaryFileType(f, fileInfo)
}

// readBinaryFileType 从二进制文件读取类型信息的辅助函数
func readBinaryFileType(rs io.ReadSeeker, fileType FileInfo) (FileInfo, error) {
	signature, err := utilities.ReadString(rs)
	if err != nil {
		// 如果读取签名失败，可能不是支持的二进制格式
		return fileType, fmt.Errorf("failed to read signature: %w", err)
	}
	fileType.Signature = signature

	version, err := utilities.ReadInt32(rs)
	if err != nil {
		return fileType, fmt.Errorf("failed to read version: %w", err)
	}
	fileType.Version = version

	fileType.FileType, err = fileTypeMapping(signature)
	if err != nil {
		return fileType, err
	}
	fileType.Game = GameCOM3D2
	fileType.StorageFormat = FormatBinary

	return fileType, nil
}

// parseJSONFileType 解析JSON格式的文件类型，仅读取文件头部
func parseJSONFileType(headerBytes []byte, path string, fileInfo FileInfo) (fileType FileInfo, err error) {
	// 先尝试从读取的头部数据解析
	var header FileHeader
	if err := json.Unmarshal(headerBytes, &header); err == nil {
		// 检查JSON解析是否成功并完整
		if header.Signature != "" && header.Version != 0 {
			return mapJSONToFileType(header, fileInfo)
		}
	}

	// 如果从头部无法完整解析，使用流式解析方式
	f, err := os.Open(path)
	if err != nil {
		return fileType, err
	}
	defer f.Close()

	reader := bufio.NewReader(f)
	decoder := json.NewDecoder(reader)

	// 只解析文件头部
	var header2 FileHeader
	if err := decoder.Decode(&header2); err != nil {
		return fileType, fmt.Errorf("failed to parse JSON: %v", err)
	}

	fileType, err = mapJSONToFileType(header2, fileInfo)
	if err != nil {
		return fileType, err
	}
	fileType.StorageFormat = FormatJSON
	fileType.Game = GameCOM3D2

	return fileType, nil
}

// fileTypeMapping 根据文件签名返回对应的文件类型
func fileTypeMapping(signature string) (string, error) {
	if fileType, exists := fileSignatureMap[signature]; exists {
		return fileType, nil
	}
	return "", fmt.Errorf("unknown file type with signature: %s", signature)
}

// mapJSONToFileType 根据 JSON 头信息映射到对应的文件类型
func mapJSONToFileType(header FileHeader, fileInfo FileInfo) (FileInfo, error) {
	var err error
	fileInfo.Signature = header.Signature
	fileInfo.Version = header.Version

	fileInfo.FileType, err = fileTypeMapping(header.Signature)
	if err != nil {
		return fileInfo, err
	}

	return fileInfo, nil
}
