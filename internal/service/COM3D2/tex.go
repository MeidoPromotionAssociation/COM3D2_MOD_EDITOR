package COM3D2

import (
	"COM3D2_MOD_EDITOR_V2/internal/serialization/COM3D2"
	"bufio"
	"fmt"
	"os"
)

// TexService 专门处理 .tex 文件的读写
type TexService struct{}

// ReadTexFile 读取 .tex 文件并返回对应结构体
func (t *TexService) ReadTexFile(path string) (*COM3D2.Tex, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open .tex file: %w", err)
	}
	defer f.Close()

	br := bufio.NewReaderSize(f, 1024*1024*10) //10MB 缓冲区
	PMatData, err := COM3D2.ReadTex(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .tex file failed: %w", err)
	}

	return PMatData, nil
}

// WriteTexFile 接收 Tex 数据并写入 .tex 文件
func (t *TexService) WriteTexFile(path string, TexData *COM3D2.Tex) error {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("unable to create .tex file: %w", err)
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	if err := TexData.Dump(bw); err != nil {
		return fmt.Errorf("failed to write to .tex file: %w", err)
	}
	if err := bw.Flush(); err != nil {
		return fmt.Errorf("an error occurred while flush bufio: %w", err)
	}
	return nil
}

// ConvertTexToImage 将 .tex 文件转换为图像文件
// 依赖外部库 ImageMagick，且有 Path 环境变量可以直接调用 magick 命令
// 如果 forcePNG 为 false 那么如果图像是有损格式且没有透明通道，则保存为 JPG，否则保存为 PNG
// 如果 forcePNG 为 true 则强制保存为 PNG，不考虑图像格式和透明通道
// 如果是 1011 版本的 tex（纹理图集），则还会生成一个 .uv.csv 文件（例如 foo.png 对应 foo.png.uv.csv），文件内容为矩形数组 x, y, w, h 一行一组
func (t *TexService) ConvertTexToImage(tex *COM3D2.Tex, outPath string, forcePng bool) error {
	err := COM3D2.ConvertTexToImage(tex, outPath, forcePng)
	if err != nil {
		return err
	}
	return nil
}

// ConvertImageToTex 将任意 ImageMagick 支持的文件格式转换为 tex 格式
// 依赖外部库 ImageMagick，且有 Path 环境变量可以直接调用 magick 命令
// 如果 forcePNG 为 true，且 compress 为 false，则 tex 的数据位是原始 PNG 数据或转换为 PNG
// 如果 forcePNG 为 false，且 compress 为 false，那么检查输入格式是否是 PNG 或 JPG，如果是则数据位直接使用原始图片，否则如果原始格式有损且无透明通道则转换为 JPG，否则转换为 PNG
// 如果 forcePNG 为 true，且 compress 为 true，那么 compress 标识会被忽略，结果同 forcePNG 为 true，且 compress 为 false
// 如果 forcePNG 为 false，且 compress 为 true，那么会对结果进行 DXT 压缩，数据位为 DDS 数据，根据有无透明通道选择 DXT1 或 DXT5
// 如果要生成 1011 版本的 tex（纹理图集），需要在图片目录下有一个同名的 .uv.csv 文件（例如 foo.png 对应 foo.png.uv.csv），文件内容为矩形数组 x, y, w, h 一行一组
// 否则生成 1010 版本的 tex
func (t *TexService) ConvertImageToTex(inputPath string, texName string, compress bool, forcePNG bool) (*COM3D2.Tex, error) {
	tex, err := COM3D2.ConvertImageToTex(inputPath, texName, compress, forcePNG)
	if err != nil {
		return nil, err
	}
	return tex, nil
}
