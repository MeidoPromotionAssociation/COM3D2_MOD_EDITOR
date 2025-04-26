package COM3D2

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/utilities"
	"io"
	"os"
)

type CommonService struct{}

// FileType 用于表示文件类型的结构
type FileType struct {
	Name      string `json:"Name"`      // 文件类型名称
	Type      string `json:"Type"`      // 用于区分二进制和JSON格式 binary/json
	Game      string `json:"Game"`      // 游戏名称 COM3D2/KCES
	Signature string `json:"Signature"` // 文件签名
	Version   int32  `json:"Version"`   // 文件版本
}

// FileHeader 用于JSON部分读取的结构
type FileHeader struct {
	Signature string `json:"Signature"`
	Version   int32  `json:"Version"`
}

// FileTypeDetermine 判断文件类型，支持二进制和 JSON 格式
func (m *CommonService) FileTypeDetermine(path string) (fileType FileType, err error) {
	f, err := os.Open(path)
	if err != nil {
		return fileType, err
	}
	defer f.Close()

	// 先读取少量数据来判断是否为JSON格式
	headerBytes := make([]byte, 1024) // 读取前 1024 Byte 数据来判断文件类型
	n, err := f.Read(headerBytes)
	if err != nil && err != io.EOF {
		return fileType, err
	}
	headerBytes = headerBytes[:n]

	// 检查文件是否为JSON格式 (简单判断是否以'{'开头)
	if bytes.HasPrefix(bytes.TrimSpace(headerBytes), []byte{'{'}) {
		return parseJSONFileType(headerBytes, path)
	}

	// 如果不是JSON，假设是二进制格式，重置文件读取位置
	// 使用已读取的数据创建 Reader
	var rs io.ReadSeeker = bytes.NewReader(headerBytes)
	signature, err := utilities.ReadString(rs)
	if err != nil {
		return fileType, err
	}
	fileType.Signature = signature

	version, err := utilities.ReadInt32(rs)
	if err != nil {
		return fileType, err
	}
	fileType.Version = version

	fileType.Name, err = fileTypeMapping(signature)
	if err != nil {
		return fileType, err
	}
	fileType.Game = "COM3D2"
	fileType.Type = "binary"

	return fileType, nil
}

// parseJSONFileType 解析JSON格式的文件类型，仅读取文件头部
func parseJSONFileType(headerBytes []byte, path string) (fileType FileType,err error) {
	// 先尝试从读取的头部数据解析
	var header FileHeader
	if err := json.Unmarshal(headerBytes, &header); err == nil {
		// 检查JSON解析是否成功并完整
		if header.Signature != "" && header.Version != 0 {
			return mapJSONToFileType(header)
		}
	}

	// 如果从头部无法完整解析，使用流式解析方式
	f, err := os.Open(path)
	if err != nil {
		return fileType, err
	}
	defer f.Close()

	// 使用bufio.Reader进行流式读取
	reader := bufio.NewReader(f)
	decoder := json.NewDecoder(reader)

	// 只解析文件头部
	var header2 FileHeader
	if err := decoder.Decode(&header2); err != nil {
		return fileType, fmt.Errorf("failed to parse JSON: %v", err)
	}

	fileType, err = mapJSONToFileType(header2)
	if err!= nil {
		return fileType, err
	}
	fileType.Type = "json"
	fileType.Game = "COM3D2"

	return fileType, nil
}

// mapJSONToFileType 根据JSON头信息映射到对应的文件类型
func mapJSONToFileType(header FileHeader) (fileType FileType, err error) {
	fileType.Signature = header.Signature
	fileType.Version = header.Version

	fileType.Name, err = fileTypeMapping(header.Signature)
	if err != nil {
		return fileType, err
	}

	return fileType, nil
}

func fileTypeMapping(signature string) (string, error) {
	signatureMap := map[string]string{
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

	if result, ok := signatureMap[signature]; ok {
		return result, nil
	}
	return "", fmt.Errorf("unknown file type with signature: %s", signature)
}
