package COM3D2

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
)

type DiffGeneratorService struct{}

type DiffGenerationRequest struct {
	InputDir                   string `json:"InputDir"`
	OutputDir                  string `json:"OutputDir"`
	StartIndex                 int    `json:"StartIndex"`
	EndIndex                   int    `json:"EndIndex"`
	Indexes                    []int  `json:"Indexes"`
	Overwrite                  bool   `json:"Overwrite"`
	UseExistingMenuVariants    bool   `json:"UseExistingMenuVariants"`
	GenerateMenus              bool   `json:"GenerateMenus"`
	GenerateReferencedMates    bool   `json:"GenerateReferencedMates"`
	CopyReferencedBinaryAssets bool   `json:"CopyReferencedBinaryAssets"`
}

type DiffGenerationAnalysis struct {
	InputDir         string              `json:"InputDir"`
	MenuGroups       []DiffMenuGroup     `json:"MenuGroups"`
	ResourceGroups   []DiffResourceGroup `json:"ResourceGroups"`
	AvailableIndexes []int               `json:"AvailableIndexes"`
	Warnings         []string            `json:"Warnings"`
}

type DiffMenuGroup struct {
	BaseName        string              `json:"BaseName"`
	BasePath        string              `json:"BasePath"`
	ExistingIndexes []int               `json:"ExistingIndexes"`
	Files           []string            `json:"Files"`
	References      []DiffFileReference `json:"References"`
}

type DiffResourceGroup struct {
	FileType        string   `json:"FileType"`
	BaseName        string   `json:"BaseName"`
	BasePath        string   `json:"BasePath"`
	ExistingIndexes []int    `json:"ExistingIndexes"`
	Files           []string `json:"Files"`
}

type DiffFileReference struct {
	MenuPath          string `json:"MenuPath"`
	Command           string `json:"Command"`
	ArgIndex          int    `json:"ArgIndex"` // 1-based index in the menu command arguments.
	FileType          string `json:"FileType"`
	Value             string `json:"Value"`
	HasWildcard       bool   `json:"HasWildcard"`
	VariantCandidate  string `json:"VariantCandidate"`
	VariantCandidateZ int    `json:"VariantCandidateZ"`
}

type DiffGenerationResult struct {
	MenusProcessed int                 `json:"MenusProcessed"`
	MenusGenerated int                 `json:"MenusGenerated"`
	MatesGenerated int                 `json:"MatesGenerated"`
	AssetsCopied   int                 `json:"AssetsCopied"`
	Files          []DiffGeneratedFile `json:"Files"`
	Warnings       []string            `json:"Warnings"`
}

type DiffGeneratedFile struct {
	Path       string `json:"Path"`
	SourcePath string `json:"SourcePath"`
	Kind       string `json:"Kind"`
	Status     string `json:"Status"`
	Message    string `json:"Message"`
}

type menuReferenceSpec struct {
	Command  string
	ArgIndex int
	FileType string
}

type indexedModFile struct {
	Path        string
	RelPath     string
	LogicalName string
	FileType    string
	Format      string
	Stem        string
	BaseStem    string
	DiffIndex   int
}

type diffFileGroup struct {
	FileType string
	BaseStem string
	Base     *indexedModFile
	Variants map[int]*indexedModFile
	Files    []*indexedModFile
}

type diffFileIndex struct {
	Root          string
	Files         []*indexedModFile
	ByLogicalName map[string]*indexedModFile
	Groups        map[string]*diffFileGroup
}

const (
	diffFormatBinary = "binary"
	diffFormatJSON   = "json"
)

var (
	diffSuffixRe  = regexp.MustCompile(`(?i)_z(\d+)(.*)$`)
	diffFileTypes = map[string]struct{}{
		".menu":  {},
		".mate":  {},
		".model": {},
		".tex":   {},
		".anm":   {},
		".col":   {},
		".phy":   {},
		".psk":   {},
		".pmat":  {},
		".nei":   {},
	}
	menuReferenceSpecs = []menuReferenceSpec{
		{Command: "アイテム", ArgIndex: 0, FileType: ".menu"},
		{Command: "アイテム条件", ArgIndex: -1, FileType: ".menu"},
		{Command: "リソース参照", ArgIndex: -1, FileType: ".menu"},
		{Command: "半脱ぎ", ArgIndex: -1, FileType: ".menu"},
		{Command: "additem", ArgIndex: 0, FileType: ".model"},
		{Command: "tex", ArgIndex: 3, FileType: ".tex"},
		{Command: "テクスチャ変更", ArgIndex: 3, FileType: ".tex"},
		{Command: "テクスチャ合成", ArgIndex: 4, FileType: ".tex"},
		{Command: "マテリアル変更", ArgIndex: 2, FileType: ".mate"},
		{Command: "anime", ArgIndex: 1, FileType: ".anm"},
		{Command: "cutout消去cc", ArgIndex: 1, FileType: ".tex"},
		{Command: "icon", ArgIndex: 0, FileType: ".tex"},
		{Command: "icons", ArgIndex: 0, FileType: ".tex"},
	}
)

func (s *DiffGeneratorService) AnalyzeDiffGeneration(inputDir string) (*DiffGenerationAnalysis, error) {
	idx, err := buildDiffFileIndex(inputDir)
	if err != nil {
		return nil, err
	}

	analysis := &DiffGenerationAnalysis{
		InputDir: inputDir,
	}
	indexSet := map[int]struct{}{}

	for _, group := range sortedGroups(idx.Groups) {
		for z := range group.Variants {
			indexSet[z] = struct{}{}
		}

		if group.FileType == ".menu" && group.Base != nil {
			menu, err := (&MenuService{}).ReadMenuFile(group.Base.Path)
			if err != nil {
				analysis.Warnings = append(analysis.Warnings, fmt.Sprintf("read menu %s failed: %v", group.Base.Path, err))
				continue
			}

			files := make([]string, 0, len(group.Files))
			for _, file := range group.Files {
				files = append(files, file.Path)
			}
			sort.Strings(files)

			refs := collectMenuReferences(group.Base.Path, menu, idx, 0)
			analysis.MenuGroups = append(analysis.MenuGroups, DiffMenuGroup{
				BaseName:        group.BaseStem,
				BasePath:        group.Base.Path,
				ExistingIndexes: sortedVariantIndexes(group.Variants),
				Files:           files,
				References:      refs,
			})
			appendMenuReferenceWarnings(&analysis.Warnings, group.Base.Path, menu)
			continue
		}

		if group.FileType != ".menu" {
			files := make([]string, 0, len(group.Files))
			for _, file := range group.Files {
				files = append(files, file.Path)
			}
			sort.Strings(files)

			basePath := ""
			if group.Base != nil {
				basePath = group.Base.Path
			}
			analysis.ResourceGroups = append(analysis.ResourceGroups, DiffResourceGroup{
				FileType:        strings.TrimPrefix(group.FileType, "."),
				BaseName:        group.BaseStem,
				BasePath:        basePath,
				ExistingIndexes: sortedVariantIndexes(group.Variants),
				Files:           files,
			})
		}
	}

	analysis.AvailableIndexes = sortedIndexSet(indexSet)
	return analysis, nil
}

func (s *DiffGeneratorService) GenerateDiffFiles(req DiffGenerationRequest) (*DiffGenerationResult, error) {
	if req.InputDir == "" {
		return nil, fmt.Errorf("input directory is required")
	}
	if req.OutputDir == "" {
		req.OutputDir = req.InputDir
	}
	if !req.GenerateMenus && !req.GenerateReferencedMates && !req.CopyReferencedBinaryAssets {
		req.GenerateMenus = true
		req.GenerateReferencedMates = true
	}
	targetIndexes, err := normalizeRequestedIndexes(req)
	if err != nil {
		return nil, err
	}

	idx, err := buildDiffFileIndex(req.InputDir)
	if err != nil {
		return nil, err
	}

	result := &DiffGenerationResult{}
	menuService := &MenuService{}

	for _, group := range sortedGroups(idx.Groups) {
		if group.FileType != ".menu" || group.Base == nil {
			continue
		}

		baseMenu, err := menuService.ReadMenuFile(group.Base.Path)
		if err != nil {
			result.Warnings = append(result.Warnings, fmt.Sprintf("read menu %s failed: %v", group.Base.Path, err))
			continue
		}
		result.MenusProcessed++

		for _, targetIndex := range targetIndexes {
			menuForOutput := cloneMenu(baseMenu)
			sourcePath := group.Base.Path
			if req.UseExistingMenuVariants {
				if variant, ok := group.Variants[targetIndex]; ok {
					variantMenu, err := menuService.ReadMenuFile(variant.Path)
					if err != nil {
						result.Warnings = append(result.Warnings, fmt.Sprintf("read menu variant %s failed: %v", variant.Path, err))
					} else {
						menuForOutput = variantMenu
						sourcePath = variant.Path
					}
				} else {
					applyMenuReferenceVariants(menuForOutput, targetIndex, idx, &result.Warnings)
				}
			} else {
				applyMenuReferenceVariants(menuForOutput, targetIndex, idx, &result.Warnings)
			}

			if req.GenerateMenus {
				logicalName := fmt.Sprintf("%s_z%d.menu", group.BaseStem, targetIndex)
				outputPath := outputPathForLogical(req.OutputDir, group.Base.RelPath, logicalName)
				status := writeMenuOutput(menuService, outputPath, menuForOutput, req.Overwrite)
				result.Files = append(result.Files, DiffGeneratedFile{
					Path:       outputPath,
					SourcePath: sourcePath,
					Kind:       "menu",
					Status:     status,
				})
				if status == "generated" || status == "overwritten" {
					result.MenusGenerated++
				}
			}

			if req.GenerateReferencedMates || req.CopyReferencedBinaryAssets {
				refs := collectMenuReferences(sourcePath, menuForOutput, idx, targetIndex)
				for _, ref := range refs {
					if ref.VariantCandidate == "" {
						continue
					}
					sourceFile := idx.ByLogicalName[strings.ToLower(ref.VariantCandidate)]
					if sourceFile == nil {
						continue
					}
					if sourceFile.FileType == ".mate" && req.GenerateReferencedMates {
						outputPath := outputPathForLogical(req.OutputDir, sourceFile.RelPath, sourceFile.LogicalName)
						status, err := writeOrCopyModFile(sourceFile, outputPath, req.Overwrite)
						if err != nil {
							result.Warnings = append(result.Warnings, err.Error())
							continue
						}
						result.Files = append(result.Files, DiffGeneratedFile{
							Path:       outputPath,
							SourcePath: sourceFile.Path,
							Kind:       "mate",
							Status:     status,
						})
						if status == "generated" || status == "overwritten" {
							result.MatesGenerated++
						}
						continue
					}
					if sourceFile.FileType != ".menu" && sourceFile.FileType != ".mate" && req.CopyReferencedBinaryAssets {
						outputPath := outputPathForLogical(req.OutputDir, sourceFile.RelPath, sourceFile.LogicalName)
						status, err := copyModFile(sourceFile.Path, outputPath, req.Overwrite)
						if err != nil {
							result.Warnings = append(result.Warnings, err.Error())
							continue
						}
						result.Files = append(result.Files, DiffGeneratedFile{
							Path:       outputPath,
							SourcePath: sourceFile.Path,
							Kind:       strings.TrimPrefix(sourceFile.FileType, "."),
							Status:     status,
						})
						if status == "generated" || status == "overwritten" {
							result.AssetsCopied++
						}
					}
				}
			}
		}
	}

	sortGeneratedFiles(result.Files)

	return result, nil
}

func buildDiffFileIndex(root string) (*diffFileIndex, error) {
	root = filepath.Clean(root)
	info, err := os.Stat(root)
	if err != nil {
		return nil, fmt.Errorf("stat input directory failed: %w", err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("input path is not a directory: %s", root)
	}

	idx := &diffFileIndex{
		Root:          root,
		ByLogicalName: map[string]*indexedModFile{},
		Groups:        map[string]*diffFileGroup{},
	}

	err = filepath.WalkDir(root, func(path string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() {
			return nil
		}

		logicalName, fileType, format, ok := logicalModName(d.Name())
		if !ok {
			return nil
		}

		rel, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		stem := strings.TrimSuffix(logicalName, fileType)
		baseStem, diffIndex := splitDiffStem(stem)
		file := &indexedModFile{
			Path:        path,
			RelPath:     rel,
			LogicalName: logicalName,
			FileType:    fileType,
			Format:      format,
			Stem:        stem,
			BaseStem:    baseStem,
			DiffIndex:   diffIndex,
		}

		lowerLogical := strings.ToLower(logicalName)
		if existing := idx.ByLogicalName[lowerLogical]; existing == nil || format == diffFormatBinary {
			idx.ByLogicalName[lowerLogical] = file
		}
		idx.Files = append(idx.Files, file)

		groupKey := fileType + "\x00" + strings.ToLower(baseStem)
		group := idx.Groups[groupKey]
		if group == nil {
			group = &diffFileGroup{
				FileType: fileType,
				BaseStem: baseStem,
				Variants: map[int]*indexedModFile{},
			}
			idx.Groups[groupKey] = group
		}
		group.Files = append(group.Files, file)
		if diffIndex > 0 {
			if existing := group.Variants[diffIndex]; existing == nil || format == diffFormatBinary {
				group.Variants[diffIndex] = file
			}
		} else if group.Base == nil || format == diffFormatBinary {
			group.Base = file
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("scan input directory failed: %w", err)
	}

	return idx, nil
}

func logicalModName(name string) (logicalName string, fileType string, format string, ok bool) {
	lower := strings.ToLower(name)
	if strings.HasSuffix(lower, ".json") {
		withoutJSON := name[:len(name)-len(".json")]
		ext := strings.ToLower(filepath.Ext(withoutJSON))
		if _, exists := diffFileTypes[ext]; exists {
			return withoutJSON, ext, diffFormatJSON, true
		}
		return "", "", "", false
	}

	ext := strings.ToLower(filepath.Ext(name))
	if _, exists := diffFileTypes[ext]; exists {
		return name, ext, diffFormatBinary, true
	}
	return "", "", "", false
}

func splitDiffStem(stem string) (string, int) {
	matches := diffSuffixRe.FindStringSubmatchIndex(stem)
	if matches == nil {
		return stem, 0
	}
	indexText := stem[matches[2]:matches[3]]
	var index int
	_, _ = fmt.Sscanf(indexText, "%d", &index)
	return stem[:matches[0]] + stem[matches[4]:matches[5]], index
}

func sortedGroups(groups map[string]*diffFileGroup) []*diffFileGroup {
	result := make([]*diffFileGroup, 0, len(groups))
	for _, group := range groups {
		result = append(result, group)
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].FileType == result[j].FileType {
			return strings.ToLower(result[i].BaseStem) < strings.ToLower(result[j].BaseStem)
		}
		return result[i].FileType < result[j].FileType
	})
	return result
}

func sortedVariantIndexes(variants map[int]*indexedModFile) []int {
	indexes := make([]int, 0, len(variants))
	for index := range variants {
		indexes = append(indexes, index)
	}
	sort.Ints(indexes)
	return indexes
}

func sortedIndexSet(indexSet map[int]struct{}) []int {
	indexes := make([]int, 0, len(indexSet))
	for index := range indexSet {
		indexes = append(indexes, index)
	}
	sort.Ints(indexes)
	return indexes
}

func normalizeRequestedIndexes(req DiffGenerationRequest) ([]int, error) {
	indexSet := map[int]struct{}{}
	for _, index := range req.Indexes {
		if index <= 0 {
			return nil, fmt.Errorf("diff index must be greater than 0: %d", index)
		}
		indexSet[index] = struct{}{}
	}

	if len(indexSet) == 0 {
		if req.StartIndex <= 0 {
			req.StartIndex = 1
		}
		if req.EndIndex <= 0 {
			req.EndIndex = req.StartIndex
		}
		if req.EndIndex < req.StartIndex {
			return nil, fmt.Errorf("end index must be greater than or equal to start index")
		}
		for index := req.StartIndex; index <= req.EndIndex; index++ {
			indexSet[index] = struct{}{}
		}
	}

	indexes := sortedIndexSet(indexSet)
	if len(indexes) == 0 {
		return nil, fmt.Errorf("no diff indexes requested")
	}
	return indexes, nil
}

func cloneMenu(menu *COM3D2.Menu) *COM3D2.Menu {
	if menu == nil {
		return nil
	}
	cloned := &COM3D2.Menu{
		Signature:   menu.Signature,
		Version:     menu.Version,
		SrcFileName: menu.SrcFileName,
		ItemName:    menu.ItemName,
		Category:    menu.Category,
		InfoText:    menu.InfoText,
		BodySize:    menu.BodySize,
		Commands:    make([]COM3D2.Command, 0, len(menu.Commands)),
	}
	for _, cmd := range menu.Commands {
		args := make([]string, len(cmd.Args))
		copy(args, cmd.Args)
		cloned.Commands = append(cloned.Commands, COM3D2.Command{
			Command: cmd.Command,
			Args:    args,
		})
	}
	return cloned
}

func collectMenuReferences(menuPath string, menu *COM3D2.Menu, idx *diffFileIndex, targetIndex int) []DiffFileReference {
	refs := make([]DiffFileReference, 0)
	for _, cmd := range menu.Commands {
		for _, spec := range specsForCommand(cmd.Command) {
			for _, argIndex := range referenceArgIndexes(cmd.Args, spec) {
				value := cmd.Args[argIndex]
				if !looksLikeReference(value, spec.FileType) {
					continue
				}
				candidateName, candidateIndex := "", 0
				if idx != nil {
					candidateName, _, candidateIndex = idx.resolveVariant(value, spec.FileType, targetIndex)
				}
				refs = append(refs, DiffFileReference{
					MenuPath:          menuPath,
					Command:           cmd.Command,
					ArgIndex:          argIndex + 1,
					FileType:          strings.TrimPrefix(spec.FileType, "."),
					Value:             value,
					HasWildcard:       strings.Contains(value, "*"),
					VariantCandidate:  candidateName,
					VariantCandidateZ: candidateIndex,
				})
			}
		}
	}
	return refs
}

func applyMenuReferenceVariants(menu *COM3D2.Menu, targetIndex int, idx *diffFileIndex, warnings *[]string) {
	for commandIndex := range menu.Commands {
		cmd := &menu.Commands[commandIndex]
		for _, spec := range specsForCommand(cmd.Command) {
			for _, argIndex := range referenceArgIndexes(cmd.Args, spec) {
				value := cmd.Args[argIndex]
				if !looksLikeReference(value, spec.FileType) {
					continue
				}
				if strings.Contains(value, "*") {
					*warnings = append(*warnings, fmt.Sprintf("skip wildcard reference %q in command %s", value, cmd.Command))
					continue
				}
				if strings.HasPrefix(strings.ToLower(value), "res:") {
					*warnings = append(*warnings, fmt.Sprintf("skip internal resource reference %q in command %s", value, cmd.Command))
					continue
				}
				if filepath.Ext(value) == "" {
					*warnings = append(*warnings, fmt.Sprintf("skip reference without explicit %s extension %q in command %s", spec.FileType, value, cmd.Command))
					continue
				}
				candidateName, _, _ := idx.resolveVariant(value, spec.FileType, targetIndex)
				if candidateName == "" {
					continue
				}
				cmd.Args[argIndex] = replaceReferenceFileName(value, candidateName)
			}
		}
	}
}

func appendMenuReferenceWarnings(warnings *[]string, menuPath string, menu *COM3D2.Menu) {
	for _, cmd := range menu.Commands {
		for _, spec := range specsForCommand(cmd.Command) {
			for _, argIndex := range referenceCheckArgIndexes(cmd.Args, spec) {
				value := cmd.Args[argIndex]
				if value == "" {
					continue
				}
				if strings.HasPrefix(strings.ToLower(value), "res:") {
					*warnings = append(*warnings, fmt.Sprintf("%s: command %s arg %d references internal resource %q; it will not be generated as a loose mod file", menuPath, cmd.Command, argIndex+1, value))
					continue
				}
				if strings.Contains(value, "*") && filepath.Ext(value) == "" {
					*warnings = append(*warnings, fmt.Sprintf("%s: command %s arg %d uses wildcard reference without explicit extension: %q", menuPath, cmd.Command, argIndex+1, value))
					continue
				}
				if spec.FileType != "" && !strings.Contains(value, "*") && filepath.Ext(value) == "" {
					*warnings = append(*warnings, fmt.Sprintf("%s: command %s arg %d is missing explicit %s extension: %q", menuPath, cmd.Command, argIndex+1, spec.FileType, value))
				}
			}
		}
	}
}

func referenceCheckArgIndexes(args []string, spec menuReferenceSpec) []int {
	if len(args) == 0 {
		return nil
	}
	if spec.ArgIndex >= 0 {
		if spec.ArgIndex >= len(args) {
			return nil
		}
		return []int{spec.ArgIndex}
	}
	indexes := make([]int, 0, len(args))
	for argIndex, value := range args {
		if value == "" {
			continue
		}
		if strings.HasPrefix(strings.ToLower(value), "res:") || strings.Contains(value, "*") || strings.EqualFold(filepath.Ext(value), spec.FileType) {
			indexes = append(indexes, argIndex)
		}
	}
	return indexes
}

func referenceArgIndexes(args []string, spec menuReferenceSpec) []int {
	if len(args) == 0 {
		return nil
	}
	if spec.ArgIndex >= 0 {
		if spec.ArgIndex >= len(args) {
			return nil
		}
		return []int{spec.ArgIndex}
	}

	indexes := make([]int, 0, len(args))
	for argIndex, value := range args {
		if looksLikeReference(value, spec.FileType) {
			indexes = append(indexes, argIndex)
		}
	}
	return indexes
}

func specsForCommand(command string) []menuReferenceSpec {
	specs := make([]menuReferenceSpec, 0, 2)
	for _, spec := range menuReferenceSpecs {
		if strings.EqualFold(command, spec.Command) {
			specs = append(specs, spec)
		}
	}
	return specs
}

func looksLikeReference(value string, fileType string) bool {
	if value == "" {
		return false
	}
	if strings.Contains(value, "*") {
		return true
	}
	return strings.EqualFold(filepath.Ext(value), fileType)
}

func (idx *diffFileIndex) resolveVariant(value string, fileType string, targetIndex int) (string, *indexedModFile, int) {
	if targetIndex <= 0 || strings.Contains(value, "*") {
		return "", nil, 0
	}

	name := filepath.Base(filepath.FromSlash(value))
	ext := strings.ToLower(filepath.Ext(name))
	if ext != fileType {
		return "", nil, 0
	}

	stem := strings.TrimSuffix(name, filepath.Ext(name))
	baseStem, _ := splitDiffStem(stem)
	candidates := variantLogicalNameCandidates(baseStem, fileType, targetIndex)
	for _, candidate := range candidates {
		if file := idx.ByLogicalName[strings.ToLower(candidate)]; file != nil {
			return candidate, file, targetIndex
		}
	}

	groupKey := fileType + "\x00" + strings.ToLower(baseStem)
	if group := idx.Groups[groupKey]; group != nil {
		if file := group.Variants[targetIndex]; file != nil {
			return file.LogicalName, file, targetIndex
		}
	}
	return "", nil, 0
}

func variantLogicalNameCandidates(baseStem string, fileType string, targetIndex int) []string {
	seen := map[string]struct{}{}
	candidates := make([]string, 0, 3)
	add := func(stem string) {
		name := fmt.Sprintf("%s_z%d%s", stem, targetIndex, fileType)
		lower := strings.ToLower(name)
		if _, ok := seen[lower]; ok {
			return
		}
		seen[lower] = struct{}{}
		candidates = append(candidates, name)
	}

	add(baseStem)
	if pos := strings.LastIndex(baseStem, "_"); pos > 0 && pos < len(baseStem)-1 {
		add(baseStem[:pos] + fmt.Sprintf("_z%d", targetIndex) + baseStem[pos:])
	}
	return candidates
}

func replaceReferenceFileName(original string, newName string) string {
	if original == filepath.Base(filepath.FromSlash(original)) {
		return newName
	}
	normalized := filepath.ToSlash(original)
	lastSlash := strings.LastIndex(normalized, "/")
	if lastSlash < 0 {
		return newName
	}
	return normalized[:lastSlash+1] + newName
}

func outputPathForLogical(outputRoot string, sourceRel string, logicalName string) string {
	dir := filepath.Dir(sourceRel)
	if dir == "." {
		dir = ""
	}
	return filepath.Join(outputRoot, dir, logicalName)
}

func writeMenuOutput(service *MenuService, outputPath string, menu *COM3D2.Menu, overwrite bool) string {
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
	if err := service.WriteMenuFile(outputPath, menu); err != nil {
		return "failed: " + err.Error()
	}
	return status
}

func writeOrCopyModFile(source *indexedModFile, outputPath string, overwrite bool) (string, error) {
	if !overwrite {
		if _, err := os.Stat(outputPath); err == nil {
			return "skipped", nil
		}
	}
	if strings.HasSuffix(strings.ToLower(outputPath), ".json") {
		outputPath = strings.TrimSuffix(outputPath, filepath.Ext(outputPath))
	}
	if samePath(source.Path, outputPath) {
		return "skipped", nil
	}
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return "", fmt.Errorf("create output directory failed for %s: %w", outputPath, err)
	}
	status := "generated"
	if _, err := os.Stat(outputPath); err == nil {
		status = "overwritten"
	}

	switch source.FileType {
	case ".menu":
		menu, err := (&MenuService{}).ReadMenuFile(source.Path)
		if err != nil {
			return "", fmt.Errorf("read menu %s failed: %w", source.Path, err)
		}
		if err := (&MenuService{}).WriteMenuFile(outputPath, menu); err != nil {
			return "", fmt.Errorf("write menu %s failed: %w", outputPath, err)
		}
		return status, nil
	case ".mate":
		mate, err := (&MateService{}).ReadMateFile(source.Path)
		if err != nil {
			return "", fmt.Errorf("read mate %s failed: %w", source.Path, err)
		}
		if err := (&MateService{}).WriteMateFile(outputPath, mate); err != nil {
			return "", fmt.Errorf("write mate %s failed: %w", outputPath, err)
		}
		return status, nil
	default:
		return copyModFile(source.Path, outputPath, overwrite)
	}
}

func copyModFile(sourcePath string, outputPath string, overwrite bool) (string, error) {
	if !overwrite {
		if _, err := os.Stat(outputPath); err == nil {
			return "skipped", nil
		}
	}
	if samePath(sourcePath, outputPath) {
		return "skipped", nil
	}
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return "", fmt.Errorf("create output directory failed for %s: %w", outputPath, err)
	}
	status := "generated"
	if _, err := os.Stat(outputPath); err == nil {
		status = "overwritten"
	}

	in, err := os.Open(sourcePath)
	if err != nil {
		return "", fmt.Errorf("open source file %s failed: %w", sourcePath, err)
	}
	defer in.Close()

	out, err := os.Create(outputPath)
	if err != nil {
		return "", fmt.Errorf("create output file %s failed: %w", outputPath, err)
	}
	defer out.Close()

	if _, err := io.Copy(out, in); err != nil {
		return "", fmt.Errorf("copy %s to %s failed: %w", sourcePath, outputPath, err)
	}
	return status, nil
}

func samePath(left string, right string) bool {
	leftAbs, leftErr := filepath.Abs(left)
	rightAbs, rightErr := filepath.Abs(right)
	if leftErr != nil || rightErr != nil {
		return false
	}
	return strings.EqualFold(filepath.Clean(leftAbs), filepath.Clean(rightAbs))
}
