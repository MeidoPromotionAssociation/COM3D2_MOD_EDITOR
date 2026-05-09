package COM3D2

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/MeidoPromotionAssociation/MeidoSerialization/serialization/COM3D2"
)

func TestSplitDiffStem(t *testing.T) {
	tests := []struct {
		name      string
		wantStem  string
		wantIndex int
	}{
		{name: "foo", wantStem: "foo", wantIndex: 0},
		{name: "foo_z1", wantStem: "foo", wantIndex: 1},
		{name: "foo_z12_liltoon", wantStem: "foo_liltoon", wantIndex: 12},
		{name: "foo_bar_z3_liltoon", wantStem: "foo_bar_liltoon", wantIndex: 3},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotStem, gotIndex := splitDiffStem(tt.name)
			if gotStem != tt.wantStem || gotIndex != tt.wantIndex {
				t.Fatalf("splitDiffStem(%q) = (%q, %d), want (%q, %d)", tt.name, gotStem, gotIndex, tt.wantStem, tt.wantIndex)
			}
		})
	}
}

func TestGenerateDiffFilesUsesBinaryMenuAndMate(t *testing.T) {
	tempDir := t.TempDir()
	inputDir := filepath.Join(tempDir, "input")
	outputDir := filepath.Join(tempDir, "output")
	if err := os.MkdirAll(inputDir, 0755); err != nil {
		t.Fatal(err)
	}

	menuService := &MenuService{}
	mateService := &MateService{}

	baseMenu := &COM3D2.Menu{
		Signature:   COM3D2.MenuSignature,
		Version:     1000,
		SrcFileName: "Assets/texture/texture/test.txt",
		ItemName:    "test",
		Category:    "wear",
		InfoText:    "test",
		Commands: []COM3D2.Command{
			{Command: "category", Args: []string{"wear"}},
			{Command: "additem", Args: []string{"body.model", "wear"}},
			{Command: "マテリアル変更", Args: []string{"wear", "0", "cloth_liltoon.mate"}},
		},
	}
	if err := menuService.WriteMenuFile(filepath.Join(inputDir, "cloth.menu"), baseMenu); err != nil {
		t.Fatal(err)
	}

	variantMenu := cloneMenu(baseMenu)
	variantMenu.Commands[2].Args[2] = "cloth_z1_liltoon.mate"
	if err := menuService.WriteMenuFile(filepath.Join(inputDir, "cloth_z1.menu"), variantMenu); err != nil {
		t.Fatal(err)
	}

	baseMate := testMate("cloth")
	if err := mateService.WriteMateFile(filepath.Join(inputDir, "cloth_liltoon.mate"), baseMate); err != nil {
		t.Fatal(err)
	}
	variantMate := testMate("cloth_z1")
	if texProp, ok := variantMate.Material.Properties[0].(*COM3D2.TexProperty); ok {
		texProp.Tex2D.Name = "cloth_z1_tex"
		texProp.Tex2D.Path = "Assets/texture/texture/cloth_z1_tex.png"
	}
	if err := mateService.WriteMateFile(filepath.Join(inputDir, "cloth_z1_liltoon.mate"), variantMate); err != nil {
		t.Fatal(err)
	}

	result, err := (&DiffGeneratorService{}).GenerateDiffFiles(DiffGenerationRequest{
		InputDir:                   inputDir,
		OutputDir:                  outputDir,
		Indexes:                    []int{1},
		Overwrite:                  false,
		UseExistingMenuVariants:    true,
		GenerateMenus:              true,
		GenerateReferencedMates:    true,
		CopyReferencedBinaryAssets: false,
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.MenusGenerated != 1 {
		t.Fatalf("MenusGenerated = %d, want 1; result=%+v", result.MenusGenerated, result)
	}
	if result.MatesGenerated != 1 {
		t.Fatalf("MatesGenerated = %d, want 1; result=%+v", result.MatesGenerated, result)
	}

	generatedMenu, err := menuService.ReadMenuFile(filepath.Join(outputDir, "cloth_z1.menu"))
	if err != nil {
		t.Fatal(err)
	}
	gotMateRef := generatedMenu.Commands[2].Args[2]
	if gotMateRef != "cloth_z1_liltoon.mate" {
		t.Fatalf("generated menu mate ref = %q, want cloth_z1_liltoon.mate", gotMateRef)
	}

	generatedMate, err := mateService.ReadMateFile(filepath.Join(outputDir, "cloth_z1_liltoon.mate"))
	if err != nil {
		t.Fatal(err)
	}
	texProp, ok := generatedMate.Material.Properties[0].(*COM3D2.TexProperty)
	if !ok {
		t.Fatalf("first generated mate property is %T, want *TexProperty", generatedMate.Material.Properties[0])
	}
	if !strings.Contains(texProp.Tex2D.Name, "z1") {
		t.Fatalf("generated mate texture name = %q, want z1 variant", texProp.Tex2D.Name)
	}
}

func TestAnalyzeDiffGenerationReportsMenuReferenceWarnings(t *testing.T) {
	tempDir := t.TempDir()
	menuService := &MenuService{}
	menu := &COM3D2.Menu{
		Signature:   COM3D2.MenuSignature,
		Version:     1000,
		SrcFileName: "Assets/texture/texture/test.txt",
		ItemName:    "test",
		Category:    "wear",
		InfoText:    "test",
		Commands: []COM3D2.Command{
			{Command: "アイテム条件", Args: []string{"has", "dress_variant.menu"}},
			{Command: "半脱ぎ", Args: []string{"half_dress.menu"}},
			{Command: "additem", Args: []string{"missing_extension", "wear"}},
			{Command: "tex", Args: []string{"wear", "0", "_MainTex", "res:builtin_tex.tex"}},
		},
	}
	if err := menuService.WriteMenuFile(filepath.Join(tempDir, "dress.menu"), menu); err != nil {
		t.Fatal(err)
	}

	analysis, err := (&DiffGeneratorService{}).AnalyzeDiffGeneration(tempDir)
	if err != nil {
		t.Fatal(err)
	}
	if len(analysis.MenuGroups) != 1 {
		t.Fatalf("MenuGroups len = %d, want 1", len(analysis.MenuGroups))
	}
	if len(analysis.MenuGroups[0].Files) != 1 || !strings.HasSuffix(strings.ToLower(analysis.MenuGroups[0].Files[0]), "dress.menu") {
		t.Fatalf("MenuGroups[0].Files = %+v, want dress.menu path", analysis.MenuGroups[0].Files)
	}
	refs := analysis.MenuGroups[0].References
	if len(refs) != 3 {
		t.Fatalf("References len = %d, want 3; refs=%+v", len(refs), refs)
	}
	if refs[0].Command != "アイテム条件" || refs[0].ArgIndex != 2 || refs[0].FileType != "menu" {
		t.Fatalf("first reference = %+v, want アイテム条件 arg 2 menu", refs[0])
	}
	if refs[1].Command != "半脱ぎ" || refs[1].ArgIndex != 1 || refs[1].FileType != "menu" {
		t.Fatalf("second reference = %+v, want 半脱ぎ arg 1 menu", refs[1])
	}
	if refs[2].Command != "tex" || refs[2].ArgIndex != 4 || refs[2].FileType != "tex" {
		t.Fatalf("third reference = %+v, want tex arg 4 tex", refs[2])
	}
	gotWarnings := strings.Join(analysis.Warnings, "\n")
	if !strings.Contains(gotWarnings, "missing explicit .model extension") {
		t.Fatalf("warnings = %q, want missing extension warning", gotWarnings)
	}
	if !strings.Contains(gotWarnings, "internal resource") {
		t.Fatalf("warnings = %q, want res: warning", gotWarnings)
	}
}

func TestAnalyzeDiffGenerationIncludesNonMateResourceGroups(t *testing.T) {
	tempDir := t.TempDir()
	menuService := &MenuService{}
	menu := &COM3D2.Menu{
		Signature:   COM3D2.MenuSignature,
		Version:     1000,
		SrcFileName: "Assets/texture/texture/test.txt",
		ItemName:    "test",
		Category:    "wear",
		InfoText:    "test",
		Commands: []COM3D2.Command{
			{Command: "additem", Args: []string{"dress.model", "wear"}},
			{Command: "anime", Args: []string{"wear", "dress.anm"}},
		},
	}
	if err := menuService.WriteMenuFile(filepath.Join(tempDir, "dress.menu"), menu); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tempDir, "dress.model"), []byte("model"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tempDir, "dress_z2.model"), []byte("model z2"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tempDir, "dress.anm"), []byte("anm"), 0644); err != nil {
		t.Fatal(err)
	}

	analysis, err := (&DiffGeneratorService{}).AnalyzeDiffGeneration(tempDir)
	if err != nil {
		t.Fatal(err)
	}

	resourceGroups := map[string]DiffResourceGroup{}
	for _, group := range analysis.ResourceGroups {
		resourceGroups[group.FileType+"\x00"+group.BaseName] = group
	}

	modelGroup, ok := resourceGroups["model\x00dress"]
	if !ok {
		t.Fatalf("resource groups = %+v, want model group for dress", analysis.ResourceGroups)
	}
	if len(modelGroup.ExistingIndexes) != 1 || modelGroup.ExistingIndexes[0] != 2 {
		t.Fatalf("model ExistingIndexes = %+v, want [2]", modelGroup.ExistingIndexes)
	}
	if len(modelGroup.Files) != 2 {
		t.Fatalf("model Files = %+v, want 2 files", modelGroup.Files)
	}

	if _, ok := resourceGroups["anm\x00dress"]; !ok {
		t.Fatalf("resource groups = %+v, want anm group for dress", analysis.ResourceGroups)
	}
}

func TestGenerateMateVariantsAppliesShaderPairAndPropertyOverrides(t *testing.T) {
	tempDir := t.TempDir()
	basePath := filepath.Join(tempDir, "cloth_liltoon.mate")
	outputDir := filepath.Join(tempDir, "out")
	mateService := &MateService{}

	baseMate := testMate("cloth")
	baseMate.Material.Properties = append(baseMate.Material.Properties,
		&COM3D2.ColProperty{
			TypeName: "col",
			PropName: "_Color",
			Color:    [4]float32{1, 1, 1, 1},
		},
		&COM3D2.VecProperty{
			TypeName: "vec",
			PropName: "_MainTex_ST",
			Vector:   [4]float32{1, 1, 0, 0},
		},
	)
	if err := mateService.WriteMateFile(basePath, baseMate); err != nil {
		t.Fatal(err)
	}

	result, err := (&DiffGeneratorService{}).GenerateMateVariants(MateVariantGenerationRequest{
		BaseMatePath:      basePath,
		OutputDir:         outputDir,
		OutputNamePattern: "{base}_{name}.mate",
		Variants: []MateVariantDefinition{
			{
				Index: 1,
				Name:  "red_trans",
				Shader: MateShaderValue{
					ShaderName:     "lilToon_Trans",
					ShaderFilename: "_lilToon_Trans_",
				},
				Overrides: []MatePropertyOverride{
					{Type: "col", PropName: "_Color", Values: []float32{1, 0, 0, 0.5}},
					{Type: "vec", PropName: "_MainTex_ST", Values: []float32{2, 2, 0.1, 0.2}},
				},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.MatesGenerated != 1 {
		t.Fatalf("MatesGenerated = %d, want 1; result=%+v", result.MatesGenerated, result)
	}

	generated, err := mateService.ReadMateFile(filepath.Join(outputDir, "cloth_liltoon_red_trans.mate"))
	if err != nil {
		t.Fatal(err)
	}
	if generated.Material.ShaderName != "lilToon_Trans" || generated.Material.ShaderFilename != "_lilToon_Trans_" {
		t.Fatalf("shader = (%q, %q), want paired transparent shader", generated.Material.ShaderName, generated.Material.ShaderFilename)
	}
	var gotColor [4]float32
	var gotVector [4]float32
	for _, prop := range generated.Material.Properties {
		switch p := prop.(type) {
		case *COM3D2.ColProperty:
			if p.PropName == "_Color" {
				gotColor = p.Color
			}
		case *COM3D2.VecProperty:
			if p.PropName == "_MainTex_ST" {
				gotVector = p.Vector
			}
		}
	}
	if gotColor != [4]float32{1, 0, 0, 0.5} {
		t.Fatalf("_Color = %v, want red transparent", gotColor)
	}
	if gotVector != [4]float32{2, 2, 0.1, 0.2} {
		t.Fatalf("_MainTex_ST = %v, want override", gotVector)
	}
}

func TestGenerateMateVariantsRejectsPartialShaderPair(t *testing.T) {
	tempDir := t.TempDir()
	basePath := filepath.Join(tempDir, "cloth.mate")
	if err := (&MateService{}).WriteMateFile(basePath, testMate("cloth")); err != nil {
		t.Fatal(err)
	}

	_, err := (&DiffGeneratorService{}).GenerateMateVariants(MateVariantGenerationRequest{
		BaseMatePath: basePath,
		Variants: []MateVariantDefinition{
			{
				Shader: MateShaderValue{ShaderName: "lilToon"},
			},
		},
	})
	if err == nil {
		t.Fatal("GenerateMateVariants returned nil error for partial shader pair")
	}
}

func TestGenerateMenuVariantsAppliesExplicitReferences(t *testing.T) {
	tempDir := t.TempDir()
	basePath := filepath.Join(tempDir, "cloth.menu")
	outputDir := filepath.Join(tempDir, "out")
	menuService := &MenuService{}
	baseMenu := &COM3D2.Menu{
		Signature:   COM3D2.MenuSignature,
		Version:     1000,
		SrcFileName: "Assets/texture/texture/test.txt",
		ItemName:    "cloth",
		Category:    "wear",
		InfoText:    "cloth base",
		Commands: []COM3D2.Command{
			{Command: "name", Args: []string{"cloth"}},
			{Command: "setumei", Args: []string{"cloth base"}},
			{Command: "additem", Args: []string{"cloth.model", "wear"}},
			{Command: "マテリアル変更", Args: []string{"wear", "0", "cloth_liltoon.mate"}},
			{Command: "anime", Args: []string{"wear", "cloth.anm"}},
		},
	}
	if err := menuService.WriteMenuFile(basePath, baseMenu); err != nil {
		t.Fatal(err)
	}

	result, err := (&DiffGeneratorService{}).GenerateMenuVariants(MenuVariantGenerationRequest{
		BaseMenuPaths:     []string{basePath},
		OutputDir:         outputDir,
		OutputNamePattern: "{base}_z{index}.menu",
		Variants: []MenuVariantDefinition{
			{
				Index:    2,
				Name:     "blue",
				ItemName: "cloth blue",
				InfoText: "cloth blue description",
				Replacements: []MenuReferenceReplacement{
					{Command: "additem", ArgIndex: 1, From: "cloth.model", To: "cloth_blue.model", FileType: "model"},
					{Command: "マテリアル変更", ArgIndex: 3, From: "cloth_liltoon.mate", To: "cloth_blue_liltoon.mate", FileType: "mate"},
					{Command: "anime", ArgIndex: 2, From: "cloth.anm", To: "cloth_blue.anm", FileType: "anm"},
				},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.MenusGenerated != 1 {
		t.Fatalf("MenusGenerated = %d, want 1; result=%+v", result.MenusGenerated, result)
	}

	generated, err := menuService.ReadMenuFile(filepath.Join(outputDir, "cloth_z2.menu"))
	if err != nil {
		t.Fatal(err)
	}
	if generated.ItemName != "cloth blue" || generated.InfoText != "cloth blue description" {
		t.Fatalf("header = (%q, %q), want overridden item text", generated.ItemName, generated.InfoText)
	}
	if generated.Commands[2].Args[0] != "cloth_blue.model" {
		t.Fatalf("additem ref = %q, want cloth_blue.model", generated.Commands[2].Args[0])
	}
	if generated.Commands[3].Args[2] != "cloth_blue_liltoon.mate" {
		t.Fatalf("mate ref = %q, want cloth_blue_liltoon.mate", generated.Commands[3].Args[2])
	}
	if generated.Commands[4].Args[1] != "cloth_blue.anm" {
		t.Fatalf("anime ref = %q, want cloth_blue.anm", generated.Commands[4].Args[1])
	}
}

func testMate(name string) *COM3D2.Mate {
	return &COM3D2.Mate{
		Signature: COM3D2.MateSignature,
		Version:   1000,
		Name:      name,
		Material: &COM3D2.Material{
			Name:           name + "@material",
			ShaderName:     "lilToon",
			ShaderFilename: "_lilToon_",
			Properties: []COM3D2.Property{
				&COM3D2.TexProperty{
					TypeName: "tex",
					PropName: "_MainTex",
					SubTag:   "tex2d",
					Tex2D: &COM3D2.Tex2DSubProperty{
						Name:   name + "_tex",
						Path:   "Assets/texture/texture/" + name + "_tex.png",
						Offset: [2]float32{0, 0},
						Scale:  [2]float32{1, 1},
					},
				},
			},
		},
	}
}
