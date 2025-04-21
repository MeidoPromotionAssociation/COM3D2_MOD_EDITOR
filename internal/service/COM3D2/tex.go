package COM3D2

import (
	"bufio"
	"fmt"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
	"github.com/MeidoPromotionAssociation/MeidoSerialization/tools"
	"github.com/emmansun/base64" // use faster base64 implementation
	"os"
	"path/filepath"
	"strings"
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
	TexData, err := COM3D2.ReadTex(br)
	if err != nil {
		return nil, fmt.Errorf("parsing the .tex file failed: %w", err)
	}

	return TexData, nil
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

// CovertTexToImageResult 前端不接受多个返回值，因此使用结构体
type CovertTexToImageResult struct {
	Base64EncodedImageData string
	Format                 string
	Rects                  []COM3D2.TexRect
}

// CovertTexToImage 将 .tex 文件转换为图像文件，但不写出
// 依赖外部库 ImageMagick，且有 Path 环境变量可以直接调用 magick 命令
// 如果 forcePNG 为 false 那么如果图像数据位是 JPG 或 PNG 则直接返回数据为，否则根据有没有透明通道保存为 JPG 或 PNG
// 如果 forcePNG 为 true 则强制保存为 PNG，不考虑图像格式和透明通道
// 如果是 1011 版本的 tex（纹理图集），则还会返回 rects
func (t *TexService) CovertTexToImage(inputPath string, forcePng bool) (covertTexToImageResult CovertTexToImageResult, err error) {
	tex, err := t.ReadTexFile(inputPath)
	if err != nil {
		return covertTexToImageResult, err
	}

	imageData, format, rects, err := COM3D2.ConvertTexToImage(tex, forcePng)
	if err != nil {
		return covertTexToImageResult, err
	}
	fmt.Println("imageData", imageData)

	covertTexToImageResult.Base64EncodedImageData = base64.StdEncoding.EncodeToString(imageData)
	covertTexToImageResult.Format = format
	covertTexToImageResult.Rects = rects
	return covertTexToImageResult, nil

}

// ConvertTexToImageAndWrite 将 .tex 文件转换为图像文件，并写出
// 依赖外部库 ImageMagick，且有 Path 环境变量可以直接调用 magick 命令
// 如果 forcePNG 为 false 那么如果图像是有损格式且没有透明通道，则保存为 JPG，否则保存为 PNG
// 如果 forcePNG 为 true 则强制保存为 PNG，不考虑图像格式和透明通道
// 如果是 1011 版本的 tex（纹理图集），则还会生成一个 .uv.csv 文件（例如 foo.png 对应 foo.png.uv.csv），文件内容为矩形数组 x, y, w, h 一行一组
func (t *TexService) ConvertTexToImageAndWrite(tex *COM3D2.Tex, outputPath string, forcePng bool) error {
	err := COM3D2.ConvertTexToImageAndWrite(tex, outputPath, forcePng)
	if err != nil {
		return err
	}
	return nil
}

// ConvertImageToTex 将任意 ImageMagick 支持的文件格式转换为 tex 格式，但不写出
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

// ConvertImageToTexAndWrite 将任意 ImageMagick 支持的文件格式转换为 tex 格式，但不写出
// 依赖外部库 ImageMagick，且有 Path 环境变量可以直接调用 magick 命令
// 如果 forcePNG 为 true，且 compress 为 false，则 tex 的数据位是原始 PNG 数据或转换为 PNG
// 如果 forcePNG 为 false，且 compress 为 false，那么检查输入格式是否是 PNG 或 JPG，如果是则数据位直接使用原始图片，否则如果原始格式有损且无透明通道则转换为 JPG，否则转换为 PNG
// 如果 forcePNG 为 true，且 compress 为 true，那么 compress 标识会被忽略，结果同 forcePNG 为 true，且 compress 为 false
// 如果 forcePNG 为 false，且 compress 为 true，那么会对结果进行 DXT 压缩，数据位为 DDS 数据，根据有无透明通道选择 DXT1 或 DXT5
// 如果要生成 1011 版本的 tex（纹理图集），需要在图片目录下有一个同名的 .uv.csv 文件（例如 foo.png 对应 foo.png.uv.csv），文件内容为矩形数组 x, y, w, h 一行一组，否则生成 1010 版本的 tex
// 如果输入输出都是 .tex，则原样复制
func (t *TexService) ConvertImageToTexAndWrite(inputPath string, texName string, compress bool, forcePNG bool, outputPath string) error {
	err := COM3D2.ConvertImageToTexAndWrite(inputPath, texName, compress, forcePNG, outputPath)
	if err != nil {
		return err
	}
	return nil
}

// ConvertAnyToPng 任意 ImageMagick 支持的格式转换为 PNG，包括 .tex
// 依赖外部库 ImageMagick，且有 Path 环境变量可以直接调用 magick 命令
// 输出为 base64 编码的 PNG 数据
func (t *TexService) ConvertAnyToPng(inputPath string) (Base64EncodedPngData string, err error) {
	if strings.HasSuffix(strings.ToLower(inputPath), ".tex") {
		covertTexToImageResult, err := t.CovertTexToImage(inputPath, true)
		if err != nil {
			return "", err
		}
		return covertTexToImageResult.Base64EncodedImageData, nil
	} else {
		err = tools.IsSupportedImageType(inputPath)
		if err != nil {
			return "", err
		}

		imageData, err := tools.ConvertImageToPng(inputPath)
		if err != nil {
			return "", err
		}
		return base64.StdEncoding.EncodeToString(imageData), nil
	}
}

// ConvertAnyToAnyAndWrite 任意 ImageMagick 支持的格式和 .tex 转换为任意 ImageMagick 支持的格式，并写出
// 依赖外部库 ImageMagick，且有 Path 环境变量可以直接调用 magick 命令
// 转换为图片时：
// 输出格式根据输出路径后缀决定，如果 forcePng 为 true 则强制输出为 PNG，但是如果输出格式为 .tex 则输出为.tex
// 转换为 .tex 时：
// 如果 forcePNG 为 true，且 compress 为 false，则 tex 的数据位是原始 PNG 数据或转换为 PNG
// 如果 forcePNG 为 false，且 compress 为 false，那么检查输入格式是否是 PNG 或 JPG，如果是则数据位直接使用原始图片，否则如果原始格式有损且无透明通道则转换为 JPG，否则转换为 PNG
// 如果 forcePNG 为 true，且 compress 为 true，那么 compress 标识会被忽略，结果同 forcePNG 为 true，且 compress 为 false
// 如果 forcePNG 为 false，且 compress 为 true，那么会对结果进行 DXT 压缩，数据位为 DDS 数据，根据有无透明通道选择 DXT1 或 DXT5
// 如果输入输出都是 .tex，则原样复制，只不过是先读取再写出
func (t *TexService) ConvertAnyToAnyAndWrite(inputPath string, texName string, compress bool, forcePNG bool, outputPath string) error {
	if strings.HasSuffix(strings.ToLower(inputPath), ".tex") {
		tex, err := t.ReadTexFile(inputPath)
		if err != nil {
			return err
		}
		return t.ConvertTexToImageAndWrite(tex, outputPath, forcePNG)
	} else {
		if strings.HasSuffix(strings.ToLower(outputPath), ".tex") {
			err := t.ConvertImageToTexAndWrite(inputPath, texName, compress, forcePNG, outputPath)
			if err != nil {
				return err
			}
			return nil
		}

		err := tools.IsSupportedImageType(inputPath)
		if err != nil {
			return err
		}

		if forcePNG || filepath.Ext(outputPath) == "" {
			outputPath = strings.TrimSuffix(outputPath, filepath.Ext(outputPath)) + ".png"
		}

		err = tools.ConvertImageToImageAndWrite(inputPath, outputPath)
		if err != nil {
			return err
		}

		return nil
	}
}

// CheckImageMagick 检查是否安装了 ImageMagick
func (t *TexService) CheckImageMagick() bool {
	err := tools.CheckMagick()
	if err != nil {
		return false
	}
	return true
}
