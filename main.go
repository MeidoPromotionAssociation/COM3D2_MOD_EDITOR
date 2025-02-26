package main

import (
	"COM3D2_MOD_EDITOR_V2/internal/service/COM3D2"
	"embed"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	MenuService := &COM3D2.MenuService{}
	MateService := &COM3D2.MateService{}
	PMatService := &COM3D2.PMatService{}
	ColService := &COM3D2.ColService{}
	PhyService := &COM3D2.PhyService{}

	MenuModel := &COM3D2.MenuModel{}
	MateModel := &COM3D2.MateModel{}
	PMatModel := &COM3D2.PMatModel{}
	ColModel := &COM3D2.ColModel{}
	PhyModel := &COM3D2.PhyModel{}

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "COM3D2 MOD EDITOR V2 by 90135",
		Width:  1024,
		Height: 768,
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop:     true,
			DisableWebViewDrop: false,
			CSSDropProperty:    "--wails-drop-target",
			CSSDropValue:       "drop",
		},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.Startup,
		Bind: []interface{}{
			app,
			MenuService,
			MateService,
			PMatService,
			ColService,
			PhyService,
			MenuModel,
			MateModel,
			PMatModel,
			ColModel,
			PhyModel,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
