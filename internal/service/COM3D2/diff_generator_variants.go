package COM3D2

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	ms "github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
)

type MateVariantAnalysis struct {
	BaseMatePath string                    `json:"BaseMatePath"`
	MateName     string                    `json:"MateName"`
	MaterialName string                    `json:"MaterialName"`
	Shader       MateShaderValue           `json:"Shader"`
	Properties   []MateVariantPropertyInfo `json:"Properties"`
	Warnings     []string                  `json:"Warnings"`
}

type MateShaderValue struct {
	ShaderName     string `json:"ShaderName"`
	ShaderFilename string `json:"ShaderFilename"`
}

type MateVariantPropertyInfo struct {
	Type     string             `json:"Type"`
	PropName string             `json:"PropName"`
	TexName  string             `json:"TexName"`
	TexPath  string             `json:"TexPath"`
	Offset   []float32          `json:"Offset"`
	Scale    []float32          `json:"Scale"`
	Values   []float32          `json:"Values"`
	Number   float32            `json:"Number"`
	Keywords []MateKeywordValue `json:"Keywords"`
}

type MateVariantGenerationRequest struct {
	BaseMatePath      string                  `json:"BaseMatePath"`
	OutputDir         string                  `json:"OutputDir"`
	OutputNamePattern string                  `json:"OutputNamePattern"`
	Overwrite         bool                    `json:"Overwrite"`
	Variants          []MateVariantDefinition `json:"Variants"`
}

type MateVariantDefinition struct {
	Index        int                    `json:"Index"`
	Name         string                 `json:"Name"`
	OutputName   string                 `json:"OutputName"`
	MateName     string                 `json:"MateName"`
	MaterialName string                 `json:"MaterialName"`
	Shader       MateShaderValue        `json:"Shader"`
	Overrides    []MatePropertyOverride `json:"Overrides"`
}

type MatePropertyOverride struct {
	Type     string             `json:"Type"`
	PropName string             `json:"PropName"`
	TexName  string             `json:"TexName"`
	TexPath  string             `json:"TexPath"`
	Values   []float32          `json:"Values"`
	Number   float32            `json:"Number"`
	Keywords []MateKeywordValue `json:"Keywords"`
}

type MateKeywordValue struct {
	Key   string `json:"Key"`
	Value bool   `json:"Value"`
}

type MenuVariantAnalysis struct {
	MenuGroups []DiffMenuGroup `json:"MenuGroups"`
	Warnings   []string        `json:"Warnings"`
}

type MenuVariantGenerationRequest struct {
	BaseMenuPaths     []string                `json:"BaseMenuPaths"`
	OutputDir         string                  `json:"OutputDir"`
	OutputNamePattern string                  `json:"OutputNamePattern"`
	Overwrite         bool                    `json:"Overwrite"`
	Variants          []MenuVariantDefinition `json:"Variants"`
}

type MenuVariantDefinition struct {
	Index        int                        `json:"Index"`
	Name         string                     `json:"Name"`
	OutputName   string                     `json:"OutputName"`
	ItemName     string                     `json:"ItemName"`
	InfoText     string                     `json:"InfoText"`
	Replacements []MenuReferenceReplacement `json:"Replacements"`
}

type MenuReferenceReplacement struct {
	Command  string `json:"Command"`
	ArgIndex int    `json:"ArgIndex"` // 1-based. 0 means all args in matched commands.
	From     string `json:"From"`
	To       string `json:"To"`
	FileType string `json:"FileType"`
}

func (s *DiffGeneratorService) AnalyzeMateVariantBase(baseMatePath string) (*MateVariantAnalysis, error) {
	if baseMatePath == "" {
		return nil, fmt.Errorf("base mate path is required")
	}

	mate, err := (&MateService{}).ReadMateFile(baseMatePath)
	if err != nil {
		return nil, err
	}

	analysis := &MateVariantAnalysis{
		BaseMatePath: baseMatePath,
		MateName:     mate.Name,
	}
	if mate.Material == nil {
		analysis.Warnings = append(analysis.Warnings, "mate has no material block")
		return analysis, nil
	}

	analysis.MaterialName = mate.Material.Name
	analysis.Shader = MateShaderValue{
		ShaderName:     mate.Material.ShaderName,
		ShaderFilename: mate.Material.ShaderFilename,
	}
	for _, prop := range mate.Material.Properties {
		analysis.Properties = append(analysis.Properties, matePropertyInfo(prop))
	}
	return analysis, nil
}

func (s *DiffGeneratorService) GenerateMateVariants(req MateVariantGenerationRequest) (*DiffGenerationResult, error) {
	if req.BaseMatePath == "" {
		return nil, fmt.Errorf("base mate path is required")
	}
	if len(req.Variants) == 0 {
		return nil, fmt.Errorf("at least one mate variant is required")
	}

	baseMate, err := (&MateService{}).ReadMateFile(req.BaseMatePath)
	if err != nil {
		return nil, err
	}
	if req.OutputDir == "" {
		req.OutputDir = filepath.Dir(req.BaseMatePath)
	}
	if req.OutputNamePattern == "" {
		req.OutputNamePattern = "{base}_z{index}.mate"
	}
	if err := validateMateVariantRequest(req); err != nil {
		return nil, err
	}

	result := &DiffGenerationResult{}
	for variantIndex, variant := range req.Variants {
		normalizedVariant := normalizeMateVariantDefinition(variant, variantIndex)
		mate := cloneMate(baseMate)
		warnings := applyMateVariant(mate, normalizedVariant)

		outputName := variantOutputName(req.BaseMatePath, ".mate", req.OutputNamePattern, normalizedVariant.Index, normalizedVariant.Name, normalizedVariant.OutputName)
		outputPath := filepath.Join(req.OutputDir, outputName)
		status := writeMateOutput(outputPath, mate, req.Overwrite)
		result.Files = append(result.Files, DiffGeneratedFile{
			Path:       outputPath,
			SourcePath: req.BaseMatePath,
			Kind:       "mate",
			Status:     status,
			Message:    normalizedVariant.Name,
		})
		if status == "generated" || status == "overwritten" {
			result.MatesGenerated++
		}
		for _, warning := range warnings {
			result.Warnings = append(result.Warnings, fmt.Sprintf("%s: %s", outputName, warning))
		}
	}

	sortGeneratedFiles(result.Files)
	return result, nil
}

func (s *DiffGeneratorService) AnalyzeMenuVariantBases(menuPaths []string) (*MenuVariantAnalysis, error) {
	if len(menuPaths) == 0 {
		return nil, fmt.Errorf("at least one base menu path is required")
	}

	analysis := &MenuVariantAnalysis{}
	menuService := &MenuService{}
	for _, menuPath := range menuPaths {
		if menuPath == "" {
			continue
		}
		menu, err := menuService.ReadMenuFile(menuPath)
		if err != nil {
			analysis.Warnings = append(analysis.Warnings, fmt.Sprintf("read menu %s failed: %v", menuPath, err))
			continue
		}
		baseName := strings.TrimSuffix(filepath.Base(logicalNameWithoutJSON(menuPath)), ".menu")
		analysis.MenuGroups = append(analysis.MenuGroups, DiffMenuGroup{
			BaseName:   baseName,
			BasePath:   menuPath,
			References: collectMenuReferences(menuPath, menu, nil, 0),
		})
		appendMenuReferenceWarnings(&analysis.Warnings, menuPath, menu)
	}
	return analysis, nil
}

func (s *DiffGeneratorService) GenerateMenuVariants(req MenuVariantGenerationRequest) (*DiffGenerationResult, error) {
	if len(req.BaseMenuPaths) == 0 {
		return nil, fmt.Errorf("at least one base menu path is required")
	}
	if len(req.Variants) == 0 {
		return nil, fmt.Errorf("at least one menu variant is required")
	}
	if req.OutputNamePattern == "" {
		req.OutputNamePattern = "{base}_z{index}.menu"
	}

	menuService := &MenuService{}
	result := &DiffGenerationResult{}
	for _, menuPath := range req.BaseMenuPaths {
		if menuPath == "" {
			continue
		}
		baseMenu, err := menuService.ReadMenuFile(menuPath)
		if err != nil {
			result.Warnings = append(result.Warnings, fmt.Sprintf("read menu %s failed: %v", menuPath, err))
			continue
		}
		outputDir := req.OutputDir
		if outputDir == "" {
			outputDir = filepath.Dir(menuPath)
		}
		result.MenusProcessed++

		for variantIndex, variant := range req.Variants {
			normalizedVariant := normalizeMenuVariantDefinition(variant, variantIndex)
			menu := cloneMenu(baseMenu)
			if normalizedVariant.ItemName != "" {
				menu.ItemName = normalizedVariant.ItemName
				setMenuCommandArg(menu, "name", 0, normalizedVariant.ItemName)
			}
			if normalizedVariant.InfoText != "" {
				menu.InfoText = normalizedVariant.InfoText
				setMenuCommandArg(menu, "setumei", 0, normalizedVariant.InfoText)
			}

			warnings := applyMenuVariantReplacements(menu, normalizedVariant.Replacements)
			outputName := variantOutputName(menuPath, ".menu", req.OutputNamePattern, normalizedVariant.Index, normalizedVariant.Name, normalizedVariant.OutputName)
			outputPath := filepath.Join(outputDir, outputName)
			status := writeMenuOutput(menuService, outputPath, menu, req.Overwrite)
			result.Files = append(result.Files, DiffGeneratedFile{
				Path:       outputPath,
				SourcePath: menuPath,
				Kind:       "menu",
				Status:     status,
				Message:    normalizedVariant.Name,
			})
			if status == "generated" || status == "overwritten" {
				result.MenusGenerated++
			}
			for _, warning := range warnings {
				result.Warnings = append(result.Warnings, fmt.Sprintf("%s: %s", outputName, warning))
			}
		}
	}

	sortGeneratedFiles(result.Files)
	return result, nil
}

func normalizeMateVariantDefinition(variant MateVariantDefinition, fallbackIndex int) MateVariantDefinition {
	if variant.Index <= 0 {
		variant.Index = fallbackIndex + 1
	}
	if variant.Name == "" {
		variant.Name = strconv.Itoa(variant.Index)
	}
	return variant
}

func normalizeMenuVariantDefinition(variant MenuVariantDefinition, fallbackIndex int) MenuVariantDefinition {
	if variant.Index <= 0 {
		variant.Index = fallbackIndex + 1
	}
	if variant.Name == "" {
		variant.Name = strconv.Itoa(variant.Index)
	}
	return variant
}

func validateMateVariantRequest(req MateVariantGenerationRequest) error {
	for index, variant := range req.Variants {
		hasShaderName := variant.Shader.ShaderName != ""
		hasShaderFilename := variant.Shader.ShaderFilename != ""
		if hasShaderName != hasShaderFilename {
			return fmt.Errorf("mate variant %d shader must include both ShaderName and ShaderFilename", index+1)
		}
	}
	return nil
}

func matePropertyInfo(prop ms.Property) MateVariantPropertyInfo {
	switch p := prop.(type) {
	case *ms.TexProperty:
		info := MateVariantPropertyInfo{
			Type:     "tex",
			PropName: p.PropName,
		}
		if p.Tex2D != nil {
			info.TexName = p.Tex2D.Name
			info.TexPath = p.Tex2D.Path
			info.Offset = []float32{p.Tex2D.Offset[0], p.Tex2D.Offset[1]}
			info.Scale = []float32{p.Tex2D.Scale[0], p.Tex2D.Scale[1]}
		}
		return info
	case *ms.ColProperty:
		return MateVariantPropertyInfo{
			Type:     "col",
			PropName: p.PropName,
			Values:   []float32{p.Color[0], p.Color[1], p.Color[2], p.Color[3]},
		}
	case *ms.VecProperty:
		return MateVariantPropertyInfo{
			Type:     "vec",
			PropName: p.PropName,
			Values:   []float32{p.Vector[0], p.Vector[1], p.Vector[2], p.Vector[3]},
		}
	case *ms.FProperty:
		return MateVariantPropertyInfo{
			Type:     "f",
			PropName: p.PropName,
			Number:   p.Number,
		}
	case *ms.RangeProperty:
		return MateVariantPropertyInfo{
			Type:     "range",
			PropName: p.PropName,
			Number:   p.Number,
		}
	case *ms.TexOffsetProperty:
		return MateVariantPropertyInfo{
			Type:     "tex_offset",
			PropName: p.PropName,
			Values:   []float32{p.OffsetX, p.OffsetY},
		}
	case *ms.TexScaleProperty:
		return MateVariantPropertyInfo{
			Type:     "tex_scale",
			PropName: p.PropName,
			Values:   []float32{p.ScaleX, p.ScaleY},
		}
	case *ms.KeywordProperty:
		keywords := make([]MateKeywordValue, 0, len(p.Keywords))
		for _, keyword := range p.Keywords {
			keywords = append(keywords, MateKeywordValue{
				Key:   keyword.Key,
				Value: keyword.Value,
			})
		}
		return MateVariantPropertyInfo{
			Type:     "keyword",
			PropName: p.PropName,
			Keywords: keywords,
		}
	default:
		return MateVariantPropertyInfo{
			Type: fmt.Sprintf("%T", prop),
		}
	}
}

func applyMateVariant(mate *ms.Mate, variant MateVariantDefinition) []string {
	warnings := make([]string, 0)
	if mate == nil || mate.Material == nil {
		return []string{"mate has no material block"}
	}

	if variant.MateName != "" {
		mate.Name = variant.MateName
	}
	if variant.MaterialName != "" {
		mate.Material.Name = variant.MaterialName
	}
	if variant.Shader.ShaderName != "" || variant.Shader.ShaderFilename != "" {
		mate.Material.ShaderName = variant.Shader.ShaderName
		mate.Material.ShaderFilename = variant.Shader.ShaderFilename
	}

	for _, override := range variant.Overrides {
		if override.Type == "" {
			warnings = append(warnings, fmt.Sprintf("skip override for %q: type is required", override.PropName))
			continue
		}
		if override.PropName == "" {
			warnings = append(warnings, fmt.Sprintf("skip %s override: property name is required", override.Type))
			continue
		}
		if !applyMatePropertyOverride(mate.Material.Properties, override) {
			warnings = append(warnings, fmt.Sprintf("property %s:%s not found or value is invalid", normalizeMatePropertyType(override.Type), override.PropName))
		}
	}
	return warnings
}

func applyMatePropertyOverride(props []ms.Property, override MatePropertyOverride) bool {
	targetType := normalizeMatePropertyType(override.Type)
	for _, prop := range props {
		switch p := prop.(type) {
		case *ms.TexProperty:
			if targetType != "tex" || !strings.EqualFold(p.PropName, override.PropName) {
				continue
			}
			if p.Tex2D == nil {
				return false
			}
			if override.TexName != "" {
				p.Tex2D.Name = override.TexName
			}
			if override.TexPath != "" {
				p.Tex2D.Path = override.TexPath
			}
			if len(override.Values) >= 4 {
				p.Tex2D.Offset = [2]float32{override.Values[0], override.Values[1]}
				p.Tex2D.Scale = [2]float32{override.Values[2], override.Values[3]}
			}
			return true
		case *ms.ColProperty:
			if targetType != "col" || !strings.EqualFold(p.PropName, override.PropName) || len(override.Values) == 0 {
				continue
			}
			p.Color = mergeFloat4(p.Color, override.Values)
			return true
		case *ms.VecProperty:
			if targetType != "vec" || !strings.EqualFold(p.PropName, override.PropName) || len(override.Values) == 0 {
				continue
			}
			p.Vector = mergeFloat4(p.Vector, override.Values)
			return true
		case *ms.FProperty:
			if targetType != "f" || !strings.EqualFold(p.PropName, override.PropName) {
				continue
			}
			p.Number = override.Number
			return true
		case *ms.RangeProperty:
			if targetType != "range" || !strings.EqualFold(p.PropName, override.PropName) {
				continue
			}
			p.Number = override.Number
			return true
		case *ms.TexOffsetProperty:
			if targetType != "tex_offset" || !strings.EqualFold(p.PropName, override.PropName) || len(override.Values) < 2 {
				continue
			}
			p.OffsetX = override.Values[0]
			p.OffsetY = override.Values[1]
			return true
		case *ms.TexScaleProperty:
			if targetType != "tex_scale" || !strings.EqualFold(p.PropName, override.PropName) || len(override.Values) < 2 {
				continue
			}
			p.ScaleX = override.Values[0]
			p.ScaleY = override.Values[1]
			return true
		case *ms.KeywordProperty:
			if targetType != "keyword" || !strings.EqualFold(p.PropName, override.PropName) || len(override.Keywords) == 0 {
				continue
			}
			applyKeywordOverrides(p, override.Keywords)
			return true
		}
	}
	return false
}

func normalizeMatePropertyType(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "color", "colour":
		return "col"
	case "vector":
		return "vec"
	case "float":
		return "f"
	default:
		return strings.ToLower(strings.TrimSpace(value))
	}
}

func mergeFloat4(current [4]float32, values []float32) [4]float32 {
	for i := 0; i < len(values) && i < 4; i++ {
		current[i] = values[i]
	}
	return current
}

func applyKeywordOverrides(prop *ms.KeywordProperty, values []MateKeywordValue) {
	for _, value := range values {
		found := false
		for i := range prop.Keywords {
			if strings.EqualFold(prop.Keywords[i].Key, value.Key) {
				prop.Keywords[i].Value = value.Value
				found = true
				break
			}
		}
		if !found {
			prop.Keywords = append(prop.Keywords, ms.Keyword{
				Key:   value.Key,
				Value: value.Value,
			})
		}
	}
	prop.Count = int32(len(prop.Keywords))
}

func sortGeneratedFiles(files []DiffGeneratedFile) {
	sort.Slice(files, func(i, j int) bool {
		if files[i].Kind == files[j].Kind {
			return files[i].Path < files[j].Path
		}
		return files[i].Kind < files[j].Kind
	})
}

func applyMenuVariantReplacements(menu *ms.Menu, replacements []MenuReferenceReplacement) []string {
	warnings := make([]string, 0)
	for _, replacement := range replacements {
		if replacement.To == "" {
			warnings = append(warnings, "skip replacement: target file is required")
			continue
		}
		if filepath.Ext(replacement.To) == "" {
			warnings = append(warnings, fmt.Sprintf("skip replacement to %q: explicit extension is required", replacement.To))
			continue
		}
		applied := false
		for commandIndex := range menu.Commands {
			cmd := &menu.Commands[commandIndex]
			if replacement.Command != "" && !strings.EqualFold(cmd.Command, replacement.Command) {
				continue
			}
			for _, argIndex := range replacementArgIndexes(cmd.Args, replacement.ArgIndex) {
				if !menuReplacementMatches(cmd.Args[argIndex], replacement) {
					continue
				}
				cmd.Args[argIndex] = replaceReferenceValue(cmd.Args[argIndex], replacement.To)
				applied = true
			}
		}
		if !applied {
			warnings = append(warnings, fmt.Sprintf("replacement from %q to %q did not match any menu command", replacement.From, replacement.To))
		}
	}
	return warnings
}

func replacementArgIndexes(args []string, argIndex int) []int {
	if len(args) == 0 {
		return nil
	}
	if argIndex > 0 {
		index := argIndex - 1
		if index >= len(args) {
			return nil
		}
		return []int{index}
	}
	indexes := make([]int, 0, len(args))
	for index := range args {
		indexes = append(indexes, index)
	}
	return indexes
}

func menuReplacementMatches(value string, replacement MenuReferenceReplacement) bool {
	if value == "" {
		return false
	}
	if replacement.FileType != "" {
		fileType := normalizeFileType(replacement.FileType)
		if fileType != "" && !strings.EqualFold(filepath.Ext(value), fileType) {
			return false
		}
	}
	if replacement.From == "" {
		return true
	}
	if strings.EqualFold(value, replacement.From) {
		return true
	}
	return strings.EqualFold(filepath.Base(filepath.FromSlash(value)), filepath.Base(filepath.FromSlash(replacement.From)))
}

func normalizeFileType(fileType string) string {
	if fileType == "" {
		return ""
	}
	fileType = strings.ToLower(strings.TrimSpace(fileType))
	if !strings.HasPrefix(fileType, ".") {
		fileType = "." + fileType
	}
	return fileType
}

func replaceReferenceValue(original string, replacement string) string {
	replacement = filepath.ToSlash(replacement)
	if replacement == filepath.Base(filepath.FromSlash(replacement)) {
		return replaceReferenceFileName(original, replacement)
	}
	return replacement
}

func setMenuCommandArg(menu *ms.Menu, command string, argIndex int, value string) {
	for commandIndex := range menu.Commands {
		cmd := &menu.Commands[commandIndex]
		if strings.EqualFold(cmd.Command, command) && argIndex < len(cmd.Args) {
			cmd.Args[argIndex] = value
			return
		}
	}
}

func variantOutputName(sourcePath string, ext string, pattern string, index int, name string, explicitName string) string {
	if explicitName != "" {
		return ensureExtension(explicitName, ext)
	}
	sourceName := logicalNameWithoutJSON(filepath.Base(sourcePath))
	base := strings.TrimSuffix(sourceName, ext)
	nameToken := sanitizeFileNameToken(name)
	outputName := pattern
	outputName = strings.ReplaceAll(outputName, "{base}", base)
	outputName = strings.ReplaceAll(outputName, "{index}", strconv.Itoa(index))
	outputName = strings.ReplaceAll(outputName, "{zindex}", fmt.Sprintf("z%d", index))
	outputName = strings.ReplaceAll(outputName, "{name}", nameToken)
	return ensureExtension(outputName, ext)
}

func ensureExtension(name string, ext string) string {
	if strings.EqualFold(filepath.Ext(name), ext) {
		return name
	}
	if filepath.Ext(name) == ".json" {
		name = strings.TrimSuffix(name, filepath.Ext(name))
	}
	if strings.EqualFold(filepath.Ext(name), ext) {
		return name
	}
	return name + ext
}

func logicalNameWithoutJSON(path string) string {
	name := filepath.Base(path)
	if strings.HasSuffix(strings.ToLower(name), ".json") {
		name = strings.TrimSuffix(name, filepath.Ext(name))
	}
	return name
}

func sanitizeFileNameToken(value string) string {
	if value == "" {
		return ""
	}
	replacer := strings.NewReplacer(
		"<", "_",
		">", "_",
		":", "_",
		"\"", "_",
		"/", "_",
		"\\", "_",
		"|", "_",
		"?", "_",
		"*", "_",
	)
	return strings.TrimSpace(replacer.Replace(value))
}

func writeMateOutput(outputPath string, mate *ms.Mate, overwrite bool) string {
	if !overwrite {
		if _, err := os.Stat(outputPath); err == nil {
			return "skipped"
		}
	}
	if strings.HasSuffix(strings.ToLower(outputPath), ".json") {
		outputPath = strings.TrimSuffix(outputPath, filepath.Ext(outputPath))
	}
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return "failed: " + err.Error()
	}
	status := "generated"
	if _, err := os.Stat(outputPath); err == nil {
		status = "overwritten"
	}
	if err := (&MateService{}).WriteMateFile(outputPath, mate); err != nil {
		return "failed: " + err.Error()
	}
	return status
}

func cloneMate(mate *ms.Mate) *ms.Mate {
	if mate == nil {
		return nil
	}
	cloned := &ms.Mate{
		Signature: mate.Signature,
		Version:   mate.Version,
		Name:      mate.Name,
	}
	if mate.Material != nil {
		cloned.Material = &ms.Material{
			Name:           mate.Material.Name,
			ShaderName:     mate.Material.ShaderName,
			ShaderFilename: mate.Material.ShaderFilename,
			Properties:     make([]ms.Property, 0, len(mate.Material.Properties)),
		}
		for _, prop := range mate.Material.Properties {
			cloned.Material.Properties = append(cloned.Material.Properties, cloneMateProperty(prop))
		}
	}
	return cloned
}

func cloneMateProperty(prop ms.Property) ms.Property {
	switch p := prop.(type) {
	case *ms.TexProperty:
		cloned := &ms.TexProperty{
			TypeName: p.TypeName,
			PropName: p.PropName,
			SubTag:   p.SubTag,
		}
		if p.Tex2D != nil {
			tex2d := *p.Tex2D
			cloned.Tex2D = &tex2d
		}
		if p.TexRT != nil {
			texRT := *p.TexRT
			cloned.TexRT = &texRT
		}
		return cloned
	case *ms.ColProperty:
		cloned := *p
		return &cloned
	case *ms.VecProperty:
		cloned := *p
		return &cloned
	case *ms.FProperty:
		cloned := *p
		return &cloned
	case *ms.RangeProperty:
		cloned := *p
		return &cloned
	case *ms.TexOffsetProperty:
		cloned := *p
		return &cloned
	case *ms.TexScaleProperty:
		cloned := *p
		return &cloned
	case *ms.KeywordProperty:
		cloned := *p
		cloned.Keywords = append([]ms.Keyword(nil), p.Keywords...)
		return &cloned
	default:
		return prop
	}
}
