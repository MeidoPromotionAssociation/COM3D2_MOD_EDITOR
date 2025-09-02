package COM3D2

import (
	"bytes"
	"crypto/aes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/utilities"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/tools"
)

// 游戏名称
const (
	UnknowGame = "Unknown"
	NoneGame   = "None"
	GameCOM3D2 = "COM3D2"
	GameKCES   = "KCES"
)

// 文件类型
const (
	FormatUnknown = "Unknown"
	FormatBinary  = "binary"
	FormatJSON    = "json"
	FormatCSV     = "csv"
)

const (
	UnknownFileType  = "Unknown"
	UnknownSignature = "Unknown"
)

const (
	SignatureNone = "None"
)

// 文件类型集合，用于判断文件类型
var fileTypeSet = map[string]struct{}{
	"menu":   {},
	"mate":   {},
	"pmat":   {},
	"col":    {},
	"phy":    {},
	"psk":    {},
	"tex":    {},
	"anm":    {},
	"model":  {},
	"preset": {},
	"save":   {},
}

// SpecialFileTypeSet 特殊文件类型集合，用于判断文件类型
var SpecialFileTypeSet = map[string]struct{}{
	"nei": {},
}

var NoneGameFileTypeSet = map[string]struct{}{
	"csv":  {},
	"json": {},
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
	COM3D2.AnmSignature:    "anm",
	COM3D2.ModelSignature:  "model",
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
	ext := strings.ToLower(filepath.Ext(path))
	// 去掉开头的点
	ext = ext[1:]
	if !strictMode {
		if ext != "" {
			if ext == "json" {
				return parseJSONFileType(f, fileInfo)
			}

			// 检查是否是特殊文件类型
			// 例如 .nei, .arc 这类文件无法按常规方式读取签名与版本，直接根据扩展名返回
			if _, exists := SpecialFileTypeSet[ext]; exists {
				fileInfo.FileType = ext
				fileInfo.Game = GameCOM3D2
				fileInfo.StorageFormat = FormatBinary
				return fileInfo, nil
			}

			if _, exists := NoneGameFileTypeSet[ext]; exists {
				fileInfo.FileType = ext
				fileInfo.Game = NoneGame
				fileInfo.StorageFormat = FormatBinary
				return fileInfo, nil
			}

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

	// 检查是否为支持的图片类型
	imageErr := tools.IsSupportedImageType(path)
	if imageErr == nil {
		// 设置为图片类型
		fileInfo.FileType = "image"
		fileInfo.Game = NoneGame
		fileInfo.StorageFormat = FormatBinary
		return fileInfo, nil
	}

	// 读取少量数据来判断是否为 JSON 格式
	headerBytes := make([]byte, 1024) // 读取前 1024 Byte 数据来判断文件类型
	n, err := f.Read(headerBytes)
	if err != nil && err != io.EOF {
		return fileInfo, err
	}
	headerBytes = headerBytes[:n]

	// 重置文件读取位置
	_, err = f.Seek(0, 0)
	if err != nil {
		// 如果重置失败，回退到使用已读取的数据创建 Reader
		fmt.Printf("Warning: Failed to seek file %s to beginning: %v. Using buffer instead.\n", path, err)
		// 先检查是否为 JSON 格式
		if bytes.HasPrefix(bytes.TrimSpace(headerBytes), []byte{'{'}) {
			var r io.Reader = bytes.NewReader(headerBytes)
			return parseJSONFileType(r, fileInfo)
		}
		// 如果不是 JSON，按二进制格式处理
		var rs io.ReadSeeker = bytes.NewReader(headerBytes)
		return readBinaryFileType(rs, fileInfo)
	}

	// 检查文件是否为 JSON 格式 (简单判断是否以'{'开头)
	if bytes.HasPrefix(bytes.TrimSpace(headerBytes), []byte{'{'}) {
		fmt.Printf("File %s is detected as JSON format.\n", path)
		return parseJSONFileType(f, fileInfo)
	}

	// 尝试严格识别 NEI（解密并校验固定签名）
	if ok, err := detectNEI(f); err == nil && ok {
		fileInfo.FileType = "nei"
		fileInfo.Game = GameCOM3D2
		fileInfo.StorageFormat = FormatBinary
		fileInfo.Signature = string(COM3D2.NeiSignature)
		return fileInfo, nil
	} else if err != nil {
		return fileInfo, fmt.Errorf("failed to detect NEI: %w", err)
	}

	ft, err := readBinaryFileType(f, fileInfo)
	if err == nil {
		return ft, nil
	}

	// 二进制签名读取失败，尝试按文本/CSV 进行内容识别；若仍无法识别，则返回 unknown 而非报错
	if _, _ = f.Seek(0, 0); true {
		csvReader := tools.NewCSVReaderSkipUTF8BOM(f, 0)
		if csvReader != nil {
			_, err = csvReader.Read()
			if err == nil {
				fileInfo.FileType = "csv"
				fileInfo.Game = NoneGame
				fileInfo.StorageFormat = FormatCSV
				fileInfo.Signature = SignatureNone
				return fileInfo, nil
			}
		}
	}

	fileInfo.FileType = UnknownFileType
	fileInfo.Game = UnknowGame
	fileInfo.StorageFormat = FormatUnknown
	fileInfo.Signature = UnknownSignature
	return fileInfo, nil
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
func parseJSONFileType(f io.Reader, fileInfo FileInfo) (FileInfo, error) {
	// 使用 decoder 进行流式解析，不需要读取整个文件
	decoder := json.NewDecoder(f)
	fileInfo.StorageFormat = FormatJSON

	// 查找开始的 '{'
	if _, err := decoder.Token(); err != nil {
		return fileInfo, fmt.Errorf("file mark as json, but unable to find JSON start tag '{': %v", err)
	}

	// 只查找所需的字段，不解码整个文件
	// 解析文件头找到需要的字段
	foundSignature := false
	foundVersion := false

	for decoder.More() && !(foundSignature && foundVersion) {
		// 获取字段名
		key, err := decoder.Token()
		if err != nil {
			return fileInfo, fmt.Errorf("error parsing JSON key value: %v", err)
		}

		// 检查是否为我们需要的字段
		keyStr, ok := key.(string)
		if !ok {
			// 跳过当前值
			if err := skipValue(decoder); err != nil {
				return fileInfo, err
			}
			continue
		}

		switch keyStr {
		case "Signature":
			var signature string
			if err := decoder.Decode(&signature); err != nil {
				return fileInfo, fmt.Errorf("failed to parse the Signature field: %v", err)
			}
			fileInfo.Signature = signature
			foundSignature = true

		case "Version":
			var version int32
			if err := decoder.Decode(&version); err != nil {
				return fileInfo, fmt.Errorf("failed to parse the Version field: %v", err)
			}
			fileInfo.Version = version
			foundVersion = true

		default:
			// 跳过不需要的字段
			if err := skipValue(decoder); err != nil {
				return fileInfo, err
			}
		}

		// 如果已找到所需信息，可以提前退出
		if foundSignature && foundVersion {
			break
		}
	}

	// 根据签名映射到文件类型
	if foundSignature {
		var mappingErr error
		fileInfo.FileType, mappingErr = fileTypeMapping(fileInfo.Signature)
		if mappingErr != nil {
			return fileInfo, mappingErr
		}
	}

	fileInfo.Game = GameCOM3D2

	return fileInfo, nil
}

// skipValue 跳过当前 JSON 值，无论它是对象、数组还是基本类型
func skipValue(decoder *json.Decoder) error {
	// 使用 RawMessage 来有效地跳过当前值
	var raw json.RawMessage
	return decoder.Decode(&raw)
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

// detectNEI 尝试通过解密并校验签名来识别 NEI 文件
func detectNEI(rs io.ReadSeeker) (bool, error) {
	// 读取整个文件（NEI 需要完整密文以解密）
	data, err := io.ReadAll(rs)
	if err != nil {
		return false, fmt.Errorf("read file content failed: %w", err)
	}
	// 重置游标，供后续其他探测继续使用
	if _, err := rs.Seek(0, 0); err != nil {
		return false, fmt.Errorf("reset reader position failed: %w", err)
	}

	// 快速过滤：长度至少包含 1 字节 extraLen 和 4 字节 ivSeed
	if len(data) < 5 {
		return false, nil
	}
	dataLen := len(data) - 5
	if dataLen <= 0 || dataLen%aes.BlockSize != 0 {
		return false, nil
	}
	// 检查额外填充长度是否在合理范围 [0, blockSize)
	ivSeed := data[dataLen+1 : dataLen+5]
	extraLen := int(data[dataLen] ^ ivSeed[0])
	if extraLen < 0 || extraLen >= aes.BlockSize {
		return false, nil
	}
	// 通过底层解析器进行严格校验（含解密与魔数校验）
	if _, err := COM3D2.ReadNei(bytes.NewReader(data), nil); err != nil {
		return false, nil
	}
	return true, nil
}
