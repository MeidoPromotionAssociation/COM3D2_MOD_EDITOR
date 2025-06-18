[English](#english) | [简体中文](#%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87) | [日本語](#%E6%97%A5%E6%9C%AC%E8%AA%9E)

[Disclaimer/How to Dev/Credit/KISS Rule](#how-to-dev)

[![Github All Releases](https://img.shields.io/github/downloads/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/total.svg)]() [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR)

# English

## COM3D2 MOD EDITOR V2

COM3D2 MOD editor, built with Golang + Wails + React + TypeScript, Modern technology here we come!!

<br>

This is a MOD creation tool for [カスタムオーダーメイド3D 2](https://com3d2.jp/) (CUSTOM ORDER MAID 3D2 / COM3D2)

But it can also be used for [カスタムメイド3D 2](https://www.kisskiss.tv/kiss/) (CUSTOM MAID 3D2 / CM3D2)

<br>

If you like it, please light up the Star~

Any Bug or request, plsease use Issues or Discussions

Or you can find me in Discord [Custom Maid Server](https://discord.gg/custommaid)

### Supported File Types

For now, it allows you to edit files in these formats

- `.menu`
- `.mate`
- `.pmat`
- `.col`
- `.phy`
- `.psk`
- `.tex` (preview & convert only & requires external dependencies)
- `.anm` (JSON only)
- `.model` (JSON only full mode and metadata editing mode)

Current Game Version COM3D2 v2.44.1 & COM3D2.5 v3.44.1 

| Extension | Description           | Version Support    | Note                                                                                                                                    |
|-----------|-----------------------|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| .menu     | Menu files            | All versions       | No structural changes so far, so version numbers are irrelevant                                                                         |
| .mate     | Material files        | All versions       | No structural changes so far, but there are some 2.5-only features                                                                      |
| .pmat     | Rendering order files | All versions       | No structural changes so far, so version numbers are irrelevant                                                                         |
| .col      | Collider files        | All versions       | No structural changes so far, so version numbers are irrelevant                                                                         |
| .phy      | Physics files         | All versions       | No structural changes so far, so version numbers are irrelevant                                                                         |
| .psk      | Panier skirt files    | All versions       | No structural change since version 217                                                                                                  |
| .tex      | Texture files         | All versions       | Not support write version 1000, because version 1000 is poorly designed (CM3D2 also supports version 1010,so there is no reason to use) |
| .anm      | Animation files       | All versions       |                                                                                                                                         |
| .model    | Model files           | Versions 1000-2200 |                                                                                                                                         |

Each file corresponds to a .go file：[https://github.com/MeidoPromotionAssociation/MeidoSerialization/tree/main/serialization/COM3D2](https://github.com/MeidoPromotionAssociation/MeidoSerialization/tree/main/serialization/COM3D2)


### Highlights

- Fully open source, completely free, and completely free; say goodbye to non-open source non-free software.
- With full multilingual support, please contribute to us through [Crowdin](https://crowdin.com/project/com3d2modeditorv2)!
- With complete entry help, don’t know what to fill in the box? You are in the right place!
- Ability to create files from scratch, no need to copy files from elsewhere.
- With light mode and dark mode.
- .menu editing syntax highlighting.
- All-in-one.
- More benefits are waiting for you to discover.

### Requirements

This application requires the following software to run:
- Microsoft Edge WebView2
  - This app is built using the Wails framework which relies on Microsoft Edge WebView2 to render the UI.
  - If you're using Windows 11, this is usually pre-installed on your system.
  - For other systems without WebView2 installed，the application should prompt you to install it upon launch.
  - Alternatively, you can install it from the official website: [https://developer.microsoft.com/en-us/microsoft-edge/webview2/](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
  - What is Microsoft Edge WebView2? [https://learn.microsoft.com/en-us/microsoft-edge/webview2/](https://learn.microsoft.com/en-us/microsoft-edge/webview2/)
- ImageMagick
  - Required for working with .tex files and image processing features to support various image formats. Optional if you don't need .tex editing.
  - Install from the official website: [https://imagemagick.org/script/download.php](https://imagemagick.org/script/download.php)
  - On the download page, look for `ImageMagick-version-Q16-HDRI-x64-dll.exe` and install it. During installation, check `Add application directory to your system path`.
  - Or install via terminal command: `winget install ImageMagick.Q16-HDRI`
  - The version used for testing is `ImageMagick-7.1.1-47-Q16-HDRI-x64-dll.exe` If you have problems, please try this version.
  - After installation, verify by running `magick -version` in your terminal. A version number output indicates success.
  - ImageMagick® is a free and open-source software suite for image editing and manipulation.

### Localization

[![Crowdin](https://badges.crowdin.net/com3d2modeditorv2/localized.svg)](https://crowdin.com/project/com3d2modeditorv2)

We use Crowdin for localization, and we will synchronize translations with Crowdin at each release.

If you want to participate in localization, please check [https://crowdin.com/project/com3d2modeditorv2](https://crowdin.com/project/com3d2modeditorv2)

register a free account and you can contribute translations on Crowdin.

Currently, some languages use AI translation. If you are not satisfied with the existing translations, please feel free to contribute translations through Crowdin.

If your language is not available, you can request to add a new language in Crowdin or Issue.

### Privacy

This application does not collect any personal information nor upload any data to servers.

The only active network request is for update checks, which solely communicates with GitHub API. You can disable the update check feature.

Code location: https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/blob/c2ea8d4bf2ea42c3b28b929ce7c118eac33cad20/app.go#L127


### Download

By downloading this software, you accept and agree to abide by the [Disclaimer](https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR?tab=readme-ov-file#disclaimer)

Please download it from Github Releases: [https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/releases](https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/releases)

- If you want to install the editor into your system and automatically associate the file type, please use `COM3D2.MOD.EDITOR.V2-amd64-installer.exe ` 
  - After associating the file type, different files will be displayed with different icons. Please check [here](https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/tree/main/build) to preview the icon
- If you don't want to install, please use `COM3D2_MOD_EDITOR_V2.exe `
- If you are on Linux, please use `COM3D2_MOD_EDITOR_V2-amd64-Linux `


### FAQ

- Opening large files is slow
  - This application is built with Wails technology, so it is essentially a browser architecture with separated front-end and back-end. Therefore, after the back-end parses the file, it must be passed to the front-end through Http. This is the main speed bottleneck, not the application itself, and I can do little about it

- I want to process files in batches
  - This is a planned feature, but we currently provide a command line interface in a separate program that can batch convert files for other programs to process.
  - Please see: [https://github.com/MeidoPromotionAssociation/MeidoSerialization](https://github.com/MeidoPromotionAssociation/MeidoSerialization)

- Unable to export .tex version 1000
  - This is intentional.
  - When converting version 1000 of .tex, please export it as an image first, and then convert it back to .tex.

<br>

### Other Repositories

Also check out my other repositories

- [COM3D2 Simple MOD Guide in Chinese](https://github.com/MeidoPromotionAssociation/COM3D2_Simple_MOD_Guide_Chinese)
- [COM3D2 MOD Editor](https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR)
- [COM3D2 Plugin Chinese Translation](https://github.com/MeidoPromotionAssociation/COM3D2_Plugin_Translate_Chinese)
- [COM3D2 Chinese Guide by 90135](https://github.com/90135/COM3D2_GUIDE_CHINESE)
- [COM3D2 Script Collection by 90135](https://github.com/90135/COM3D2_Scripts_901)
- [COM3D2 Tools](https://github.com/90135/COM3D2_Tools_901)

<br>

| ScreenShot                | ScreenShot                | ScreenShot                | ScreenShot                |
|---------------------------|---------------------------|---------------------------|---------------------------|
| ![1](.github/image/1.png) | ![2](.github/image/2.png) | ![3](.github/image/3.png) | ![4](.github/image/4.png) |
| ![5](.github/image/5.png) | ![6](.github/image/6.png) | ![7](.github/image/7.png) | ![8](.github/image/8.png) |

<br>
<br>
<br>
<br>

# 简体中文

## COM3D2 MOD EDITOR V2

COM3D2 MOD 编辑器，使用 Golang + Wails + React + TypeScript 打造，现代技术我们来了！！

<br>

这是 [カスタムオーダーメイド3D2](https://com3d2.jp/) (CUSTOM ORDER MAID 3D2 / COM3D2) 的 MOD 制作工具

但它也可以用于 [カスタムメイド3D 2](https://www.kisskiss.tv/kiss/) (CUSTOM MAID 3D2 / CM3D2)

<br>

如果您喜欢，请点亮 Star~

任何 Bug 或请求，请使用 Issues 或 Discussions

你也可以在 Discord [Custom Maid Server](https://discord.gg/custommaid) 找到我

或者我的中文 Discord 频道 [https://discord.gg/XQVfcJWbPp](https://discord.gg/XQVfcJWbPp) 

有问题请在群内提问/反馈，请勿私聊

### 支持的文件类型

目前，它允许您编辑以下格式的文件

- `.menu`
- `.mate`
- `.pmat`
- `.col`
- `.phy`
- `.psk`
- `.tex` (仅支持预览和转换、需要外部依赖)
- `.anm` (仅 JSON 格式)
- `.model` (仅 JSON的完整模式和元数据编辑模式)

当前游戏版本 COM3D2 v2.44.1 和 COM3D2.5 v3.44.1

| 扩展名    | 描述     | 版本支持         | 备注                                                     |
|--------|--------|--------------|--------------------------------------------------------|
| .menu  | 菜单文件   | 所有版本         | 目前为止未发生过结构更改，因此版本号无关紧要                                   |
| .mate  | 材质文件   | 所有版本         | 目前为止未发生过结构更改，但有一些属性只在 2.5 有效                             |
| .pmat  | 渲染顺序文件 | 所有版本         | 目前为止未发生过结构更改，因此版本号无关紧要                                   |
| .col   | 碰撞体文件  | 所有版本         | 目前为止未发生过结构更改，因此版本号无关紧要                                   |
| .phy   | 物理文件   | 所有版本         | 目前为止未发生过结构更改，因此版本号无关紧要                                   |
| .psk   | 裙撑文件   | 所有版本         | 自版本 217 以后没有发生结构变化                                     |
| .tex   | 纹理文件   | 所有版本         | 不支持写出版本 1000，因为版本 1000 设计不佳（CM3D2 也支持版本 1010，因此没有理由使用） |
| .anm   | 动画文件   | 所有版本         |                                                       |
| .model | 模型文件   | 1000-2200 版本 |                                                        |

每种文件对应一个 .go 文件：[https://github.com/MeidoPromotionAssociation/MeidoSerialization/tree/main/serialization/COM3D2](https://github.com/MeidoPromotionAssociation/MeidoSerialization/tree/main/serialization/COM3D2)

### 亮点

- 完全开源，完全免费，完全自由；和非开源的非自由软件说再见。
- 拥有完整的多国语言支持，请通过 [Crowdin](https://crowdin.com/project/com3d2modeditorv2) 为我们贡献翻译！
- 拥有完整的条目帮助，不知道框内该填什么？你来对地方了！
- 有能力从 0 创建文件，告别需要从别处复制文件。
- 拥有浅色模式和暗黑模式。
- .menu 编辑语法高亮。
- 多合一。
- 更多好处等你来发现！

### 依赖

该应用需要以下软件以运行：
- Microsoft Edge WebView2
  - 本应用使用 Wails 技术打造，它依赖于 Microsoft Edge WebView2 来渲染页面，因此需要安装 WebView2。
  - 如果你使用 Windows 11，这通常已经安装在你的系统上了。
  - 如果你使用其他系统，且没有安装 WebView2，启动应用程序时它应该会提示您安装。
  - 或者您也可以从官方网站安装：[https://developer.microsoft.com/zh-cn/microsoft-edge/webview2](https://developer.microsoft.com/zh-cn/microsoft-edge/webview2)
  - Microsoft Edge WebView2 是什么？[https://learn.microsoft.com/zh-cn/microsoft-edge/webview2/](https://learn.microsoft.com/zh-cn/microsoft-edge/webview2/)
- ImageMagick
  - 使用 .tex 格式和图片处理相关功能需要安装 ImageMagick，这是为了支持尽可能多的图片格式。如果您不使用 .tex 编辑，您可以选择不安装。
  - 请从官方网站安装：[https://imagemagick.org/script/download.php](https://imagemagick.org/script/download.php)
  - 在下载页面上找到 `ImageMagick-版本号-Q16-HDRI-x64-dll.exe` 下载并安装，安装时需要勾选 `Add application directory to your system path`
  - 或者在您的终端执行 `winget install ImageMagick.Q16-HDRI` 命令安装。
  - 用于测试是版本是 `ImageMagick-7.1.1-47-Q16-HDRI-x64-dll.exe` 如果出现问题，请尝试这个版本。
  - 安装完成后在终端执行 `magick -version` 命令查看版本号，如果显示版本号则说明安装成功。
  - ImageMagick® 是一个自由的开源软件套件，用于编辑和操纵数字图像。

### 本地化

[![Crowdin](https://badges.crowdin.net/com3d2modeditorv2/localized.svg)](https://crowdin.com/project/com3d2modeditorv2)

我们使用 Crowdin 进行本地化，在每个版本发布时我们会从 Crowdin 同步翻译。

如果您想参与本地化，请访问 [https://crowdin.com/project/com3d2modeditorv2](https://crowdin.com/project/com3d2modeditorv2)

注册一个免费账户后，您就可以在 Crowdin 上为我们贡献翻译。

目前部分语言使用 AI 翻译，如果您对现有翻译不满意，请随时贡献翻译。

如果没有您的语言，您可以在 Crowdin 或 Issue 中请求新增语言。

### 隐私

本应用不会收集任何个人信息，也不会上传任何信息到任何服务器。

唯一的主动网络请求是用于检查更新，它只会请求 Github API，您也可以关闭更新检查功能。

代码位于 https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/blob/c2ea8d4bf2ea42c3b28b929ce7c118eac33cad20/app.go#L127

### 下载

下载此软件即表示您接受并同意遵守[免责声明](https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR?tab=readme-ov-file#disclaimer)

请在 Github Releases 中下载：[https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/releases](https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/releases)

- 如果您希望将编辑器安装到系统中并自动关联文件类型，请使用 `COM3D2.MOD.EDITOR.V2-amd64-installer.exe`
  - 关联文件类型后，不同的文件将显示不同的图标。请查看[此处](https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/tree/main/build)预览图标。
- 如果您不想安装，请使用 `COM3D2_MOD_EDITOR_V2.exe`
- 如果您使用的是 Linux 系统，请使用 `COM3D2_MOD_EDITOR_V2-amd64-Linux`

### 常见问题

- 打开大文件时很慢
  - 本应用使用 Wails 技术打造，所以其本质上是一个前后端分离的浏览器架构，因此后端解析文件后必须通过 Http 传递至前端，这里是主要速度瓶颈，而非应用本身，我对此几乎无能为力

- 我希望批量处理文件
  - 这是一个计划中的功能，但目前我们在单独的程序中提供了一个命令行界面，可以批量转换文件以便其他程序处理。
  - 请查看：[https://github.com/MeidoPromotionAssociation/MeidoSerialization](https://github.com/MeidoPromotionAssociation/MeidoSerialization)

- 无法导出 1000 版本的 .tex 文件
  - 这是有意为之的
  - 转换 1000 版 .tex 文件时，请先将其导出为图片，然后再转换回 .tex 文件。

<br>

### 也可以看看我的其他仓库

- [COM3D2 简明 MOD 教程中文](https://github.com/MeidoPromotionAssociation/COM3D2_Simple_MOD_Guide_Chinese)
- [COM3D2 MOD 编辑器](https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR)
- [COM3D2 插件中文翻译](https://github.com/MeidoPromotionAssociation/COM3D2_Plugin_Translate_Chinese)
- [90135 的 COM3D2 中文指北](https://github.com/90135/COM3D2_GUIDE_CHINESE)
- [90135 的 COM3D2 脚本收藏集](https://github.com/90135/COM3D2_Scripts_901)
- [90135 的 COM3D2 工具](https://github.com/90135/COM3D2_Tools_901)

<br>

| 截图                        | 截图                        | 截图                        | 截图                        |
|---------------------------|---------------------------|---------------------------|---------------------------|
| ![1](.github/image/1.png) | ![2](.github/image/2.png) | ![3](.github/image/3.png) | ![4](.github/image/4.png) |
| ![5](.github/image/5.png) | ![6](.github/image/6.png) | ![7](.github/image/7.png) | ![8](.github/image/8.png) |

<br>
<br>
<br>
<br>

# 日本語

## COM3D2 MOD EDITOR V2

AI Translation

COM3D2 MOD エディターは、Golang + Wails + React + TypeScript を使用して開発されました。最新技術で新たな時代へ！！

<br>

[カスタムオーダーメイド3D2](https://com3d2.jp/)(CUSTOM ORDER MAID 3D2 / COM3D2)用のMOD作成ツールです。

ただし、[カスタムメイド3D 2](https://www.kisskiss.tv/kiss/)(CUSTOM MAID 3D2 / CM3D2)でも使用できます。

<br>

気に入っていただけたら「Star」ボタンを点灯してくださいね〜

バグやリクエストがある場合は、Issues または Discussions をご利用ください

または、Discord [Custom Maid Server](https://discord.gg/custommaid) で私を見つけることができます。

### 対応ファイル形式

現在以下の形式のファイル編集が可能です

- `.menu`
- `.mate`
- `.pmat`
- `.col`
- `.phy`
- `.psk`
- `.tex` (プレビューと変換のみ対応、外部依存関係が必要)
- `.anm` (JSON形式のみ)
- `.model` (JSONの完全スキーマとメタデータ編集モード)

対応ゲームバージョン COM3D2 v2.44.1 および COM3D2.5 v3.44.1

| 拡張子   | 説明       | 対応バージョン     | 備考                                                     |
|--------|------------|------------------|--------------------------------------------------------|
| .menu  | メニューファイル | 全バージョン       | これまで構造の変更がないためバージョン番号は無関係                           |
| .mate  | マテリアルファイル | 全バージョン       | 構造変更はないが2.5で有効な属性が存在する                               |
| .pmat  | 描画順ファイル | 全バージョン       | 構造変更がないためバージョン番号は無関係                                 |
| .col   | コリジョンファイル | 全バージョン       | 構造変更がないためバージョン番号は無関係                                 |
| .phy   | 物理ファイル  | 全バージョン       | 構造変更がないためバージョン番号は無関係                                 |
| .psk   | プチシェコール | 全バージョン       | バージョン217以降で構造変更なし                                       |
| .tex   | テクスチャファイル | 全バージョン       | バージョン1000の書き出し非対応（設計が不適切なため、CM3D2でも1010をサポートしているため必要性なし） |
| .anm   | アニメーションファイル | 全バージョン       |                                                  |
| .model | モデルファイル | バージョン1000-2200 |                                                        |

各ファイルに対応する.goファイル：[https://github.com/MeidoPromotionAssociation/MeidoSerialization/tree/main/serialization/COM3D2](https://github.com/MeidoPromotionAssociation/MeidoSerialization/tree/main/serialization/COM3D2)

### ハイライト

- 完全にオープンソース、完全に無料、そして完全にフリー。オープンソースではない、フリーではないソフトウェアとはお別れです。
- 完全な多言語サポートを備えており、Crowdinを通じて翻訳にご協力ください！
- 完全な入力ヘルプがありますが、ボックスに何を入力すればよいかわかりませんか?あなたは正しい場所に来ました！
- 最初からファイルを作成する機能。他の場所からファイルをコピーする必要はありません。
- ファイルのドラッグとファイルとして開くことをサポート
- ライトモードとダークモードがあります。
- .menu 編集構文の強調表示。
- オールインワン。
- さらに多くのメリットがあなたを待っています

### 必要なソフトウェア

本アプリケーションの実行には以下のソフトウェアが必要です：
- Microsoft Edge WebView2
  - 本アプリはWailsフレームワークを使用しており、UIのレンダリングにMicrosoft Edge WebView2を必要とします
  - Windows 11をご利用の場合、通常はプリインストールされています
  - 他のOSを使用している場合、WebView2が未インストールの状態でアプリを起動するとインストールプロンプトが表示されます
  - 公式サイトから手動でインストールすることも可能です：[https://developer.microsoft.com/ja-jp/microsoft-edge/webview2/](https://developer.microsoft.com/ja-jp/microsoft-edge/webview2/)
  - Microsoft Edge WebView2とは？[https://learn.microsoft.com/ja-jp/microsoft-edge/webview2/](https://learn.microsoft.com/ja-jp/microsoft-edge/webview2/)
- ImageMagick
  - .texファイルの編集および画像処理機能を使用する場合に必要です。.tex編集が不要な場合はインストール不要です
  - 公式サイトからインストールしてください：[https://imagemagick.org/script/download.php](https://imagemagick.org/script/download.php)
  - ダウンロードページで`ImageMagick-バージョン-Q16-HDRI-x64-dll.exe`を選択し、インストール時に`Add application directory to your system path（システムパスに追加）`にチェックを入れてください
  - またはターミナルで次のコマンドを実行：`winget install ImageMagick.Q16-HDRI`
  - テストに使用したバージョンは `ImageMagick-7.1.1-47-Q16-HDRI-x64-dll.exe` です。問題がある場合は、このバージョンを試してください。
  - インストール後、ターミナルで`magick -version`を実行し、バージョン番号が表示されれば成功です
  - ImageMagick® は画像編集・加工用のオープンソースソフトウェアスイートです

### ローカライゼーション

[![Crowdin](https://badges.crowdin.net/com3d2modeditorv2/localized.svg)](https://crowdin.com/project/com3d2modeditorv2)

私たちはCrowdinを使用してローカライゼーションを行っており、各バージョンのリリース時に[Crowdin](https://crowdin.com/project/com3d2modeditorv2)から翻訳を同期します。

ローカライゼーションに参加したい場合は、[https://crowdin.com/project/com3d2modeditorv2](https://crowdin.com/project/com3d2modeditorv2) をご覧ください。

無料アカウントを登録すれば、Crowdin上で翻訳に貢献することができます。

現在、一部の言語ではAI翻訳を使用しています。既存の翻訳に満足できない場合は、いつでも翻訳を提供してください。

ご希望の言語が利用できない場合は、CrowdinまたはIssueで新しい言語の追加をリクエストできます。

### プライバシー

本アプリは個人情報を一切収集せず、いかなる情報もサーバーにアップロードすることはありません。

唯一の能動的なネットワークリクエストは更新チェック用で、GitHub API のみにリクエストを送信します。更新チェック機能を無効にすることも可能です。

該当コード: https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/blob/c2ea8d4bf2ea42c3b28b929ce7c118eac33cad20/app.go#L127

### ダウンロード

本ソフトウェアをダウンロードすることにより、[免責事項](https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR?tab=readme-ov-file#disclaimer)に同意し、遵守することに同意したものとみなされます

Github Releasesからダウンロードしてください：[https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/releases](https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/releases)

- システムへのインストールとファイルタイプの自動関連付けを希望する場合、`COM3D2.MOD.EDITOR.V2-amd64-installer.exe`を使用してください
  - ファイルタイプの関連付けを行うと、異なるファイルタイプに応じて異なるアイコンが表示されます。アイコンプレビューは[こちら](https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/tree/main/build)で確認できます
- インストールを希望しない場合、`COM3D2_MOD_EDITOR_V2.exe`を使用してください
- Linuxシステムをご利用の場合、`COM3D2_MOD_EDITOR_V2-amd64-Linux`を使用してください

### よくある質問

- 大きなファイルを開くのが遅い
  - このアプリケーションはWailsテクノロジーで構築されているため、本質的にはフロントエンドとバックエンドが分離されたブラウザアーキテクチャです。そのため、バックエンドでファイルを解析した後、HTTP経由でフロントエンドに渡す必要があります。これがアプリケーション自体ではなく、主な速度ボトルネックであり、対処できる範囲が限られています。

- ファイルを一括処理したい
  - これは計画中の機能ですが、現在、他のプログラムで処理できるようにファイルを一括変換できるコマンドラインインターフェースを別のプログラムで提供しています。
  - 詳細は[https://github.com/MeidoPromotionAssociation/MeidoSerialization](https://github.com/MeidoPromotionAssociation/MeidoSerialization)をご覧ください。

- バージョン1000の.texファイルはエクスポートできません
  - これは意図的な動作です
  - バージョン1000の.texファイルを変換する場合は、まず画像としてエクスポートし、その後.texファイルに戻してください。

<br>

### 他の倉庫もぜひご覧ください
- [COM3D2 シンプルMODガイド（中国語）](https://github.com/MeidoPromotionAssociation/COM3D2_Simple_MOD_Guide_Chinese)
- [COM3D2 MODエディター](https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR)
- [COM3D2プラグイン 中国語翻訳](https://github.com/MeidoPromotionAssociation/COM3D2_Plugin_Translate_Chinese)
- [90135によるCOM3D2中国語ガイド](https://github.com/90135/COM3D2_GUIDE_CHINESE)
- [90135によるCOM3D2スクリプト集](https://github.com/90135/COM3D2_Scripts_901)
- [COM3D2ツール](https://github.com/90135/COM3D2_Tools_901)

<br>

| SS                        | SS                        | SS                        | SS                        |
|---------------------------|---------------------------|---------------------------|---------------------------|
| ![1](.github/image/1.png) | ![2](.github/image/2.png) | ![3](.github/image/3.png) | ![4](.github/image/4.png) |
| ![5](.github/image/5.png) | ![6](.github/image/6.png) | ![7](.github/image/7.png) | ![8](.github/image/8.png) |

<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>

# How to Dev

1. Clone this repo, and cd to project root
2. Install [Golang](https://go.dev/)  1.24+
3. Run `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
4. Install [Nodejs](https://nodejs.org/) v22 lts
5. Install Pnpm `npm install -g pnpm@latest-10`
6. Run `cd .\frontend\` and `pnpm install`

<br>

- Run `wails dev` in project root to run in dev mode
- Run `wails build` in project root to build project
- Press `Ctrl + Shift + F12` Open Browser console
- This is a Wails App. The front-end method is automatically generated after the back-end is bound.
- Starting from v1.4.0, the core serialization library of this application has been separated into a separate repository: [https://github.com/MeidoPromotionAssociation/MeidoSerialization](https://github.com/MeidoPromotionAssociation/MeidoSerialization)
- To view the serialization structure and methods, please refer to the repository above.

<br>

# KISS Rule

*This Project is not owned or endorsed by KISS.

*MODs are not supported by KISS.

*KISS cannot be held responsible for any problems that may arise when using MODs.

*If any problem occurs, please do not contact KISS.


```
KISS 規約

・原作がMOD作成者にある場合、又は、原作が「カスタムメイド3D2」のみに存在する内部データの場合、又は、原作が「カスタムメイド3D2」と「カスタムオーダーメイド3D2」の両方に存在する内部データの場合。
※MODはKISSサポート対象外です。
※MODを利用するに当たり、問題が発生してもKISSは一切の責任を負いかねます。
※「カスタムメイド3D2」か「カスタムオーダーメイド3D2」か「CR EditSystem」を購入されている方のみが利用できます。
※「カスタムメイド3D2」か「カスタムオーダーメイド3D2」か「CR EditSystem」上で表示する目的以外の利用は禁止します。
※これらの事項は https://kisskiss.tv/kiss/diary.php?no=558 を優先します。

・原作が「カスタムオーダーメイド3D2(GP01含む)」の内部データのみにある場合。
※MODはKISSサポート対象外です。
※MODを利用するに当たり、問題が発生してもKISSは一切の責任を負いかねます。
※「カスタムオーダーメイド3D2」か「CR EditSystem」をを購入されている方のみが利用できます。
※「カスタムオーダーメイド3D2」か「CR EditSystem」上で表示する目的以外の利用は禁止します。
※「カスタムメイド3D2」上では利用しないで下さい。
※これらの事項は https://kisskiss.tv/kiss/diary.php?no=558 を優先します。

・原作が「CR EditSystem」の内部データのみにある場合。
※MODはKISSサポート対象外です。
※MODを利用するに当たり、問題が発生してもKISSは一切の責任を負いかねます。
※「CR EditSystem」を購入されている方のみが利用できます。
※「CR EditSystem」上で表示する目的以外の利用は禁止します。
※「カスタムメイド3D2」「カスタムオーダーメイド3D2」上では利用しないで下さい。
※これらの事項は https://kisskiss.tv/kiss/diary.php?no=558 を優先します。
```

<br>

# Disclaimer

By downloading this software, you agree to read, accept and abide by this Disclaimer, this is a developer protection measure and we apologize for any inconvenience this may cause.

下载此软件即表示您已阅读且接受并同意遵守此免责声明，这是为了保护开发人员而采取的措施，对于由此造成的不便，我们深表歉意。

本ソフトウェアをダウンロードすることにより、利用者は本免責事項を読み、内容を理解し、全ての条項に同意し、遵守することを表明したものとみなされます。これは開発者保護のための措置であることをご理解いただき、ご不便をおかけする場合もあらかじめご了承ください。

```
English

In case of any discrepancy between the translated versions, the Simplified Chinese version shall prevail.

1. Tool Nature Statement
    This project is an open-source tool released under the BSD-3-Clause license. The developer(s) (hereinafter referred to as "the Author") are individual technical researchers only. The Author does not derive any commercial benefit from this tool and does not provide any form of online service or user account system.
    This tool is a purely local data processing tool with no content generation capabilities whatsoever. It possesses no online upload or download functionality.
    At its core, this tool is a format converter. All output content is the result of format conversion applied to the user's original input data. The tool itself does not generate, modify, or inject any new data content.

2. Usage restrictions
  This software shall not be used for any illegal purposes. This includes, but is not limited to, creating or disseminating obscene or illegal materials, infringing upon the intellectual property rights of others, violating platform user agreements, or any other actions that may contravene the laws and regulations of the user's jurisdiction.
    Users shall bear full responsibility for any consequences arising from violations of the law.

Users must commit to:
    - Not creating, publishing, transmitting, disseminating, or storing any content that violates the laws and regulations of their jurisdiction.
    - Not creating, publishing, transmitting, disseminating, or storing obscene or illegal materials.
    - Not creating, publishing, transmitting, disseminating, or storing content that infringes upon the intellectual property rights of others.
    - Not creating, publishing, transmitting, disseminating, or storing content that violates platform user agreements.
    - Not using the tool for any activities that endanger national security or undermine social stability.
    - Not using the tool to conduct cyber attacks or crack licensed software.
    - The Author has no legal association with user-generated content.
    - Any content created using this tool that violates local laws and regulations (including but not limited to pornography, violence, or infringing content) entails legal liability borne solely by the content creator.

3. Liability exemption
Given the nature of open-source projects:
    - The Author cannot monitor the use of all derivative code.
    - The Author is not responsible for modified versions compiled/distributed by users.
    - The Author assumes no liability for any legal consequences resulting from illegal use by users.
    - The Author provides no technical guarantee for content review or filtering.
    - The tool's operational mechanism inherently prevents it from recognizing or filtering content nature.
    - All data processing occurs solely on the user's local device; the Author cannot access or control any user data.

Users acknowledge and agree that:
    - This tool possesses no content generation capabilities; the final content depends entirely on the input files. The tool merely performs format conversion operations and cannot be held responsible for the legality, nature, or usage context of the user's input data.
    - This tool contains no data upload/download capabilities; all content processing is completed on the user's local device.
    - If illegal activities involving this tool are discovered, they must be reported immediately to the public security authorities.
    - The Author reserves the right to cease distribution of specific versions suspected of being abused.

4. Age and guardianship responsibility
  Users must be persons with full civil capacity (18 years of age or older). Minors are prohibited from downloading, installing or using this tool. Guardians must assume full management responsibility for device access.

5. Agreement Update
  The author has the right to update this statement through the GitHub repository. Continued use is deemed to accept the latest version of the terms.

6. Disclaimer of Warranty
  This tool is provided "AS IS" and the developer expressly disclaims any express or implied warranties, including but not limited to:
    - Warranty of merchantability
    - Warranty of fitness for a particular purpose
    - Warranty of code freedom from defects or potential risks
    - Warranty of continuous availability and technical support

7. Waiver of liability for damages
  Regardless of the use/inability to use this tool resulting in:
    - Direct/indirect property loss
    - Data loss or business interruption
    - Third-party claims or administrative penalties
  The developer shall not bear any civil, administrative or criminal liability

8. Waiver of liability for third-party reliance
  If the third-party libraries/components included or relied upon by this tool have:
    - Intellectual property disputes
    - Security vulnerabilities
    - Content that violates local laws
    - Subject to criminal or civil penalties
  The developer shall not bear joint and several liability, and users should review the relevant licenses on their own

9. Version iteration risk
  Users understand and accept:
    - Different versions of code may have compatibility issues
    - Developers are not obliged to maintain the security of old versions
    - Modifying the code on your own may lead to unforeseen legal risks

简体中文

1. 工具性质声明  
   本项目是基于 BSD-3-Clause 许可证的开源工具。开发者（以下简称"作者"）仅为个人技术研究者，不通过本工具获取任何商业利益，亦不提供任何形式的在线服务及用户账号体系。
   本工具为纯本地化数据处理工具，不具备任何内容生成能力，无任何在线上传下载功能。
   本工具本质上是一个格式转换器，所有输出内容均为用户提供的原始数据的格式转换结果，工具本身不产生、修改或注入任何新数据内容。

2. 使用限制
   本软件不得用于任何违法用途，包括但不限于制作、传播淫秽违法物品、侵害他人知识产权、违反平台用户协议的行为等可能违反所在地法律法规的违法行为。
   使用者因违反法律造成的后果需自行承担全部责任。

   用户必须承诺：  
     - 不制作、发布、传送、传播、储存任何违反所在地法律法规的内容
     - 不制作、发布、传送、传播、储存淫秽违法物品
     - 不制作、发布、传送、传播、储存侵害他人知识产权的内容
     - 不制作、发布、传送、传播、储存违反平台用户协议的内容
     - 不将工具用于任何危害国家安全或破坏社会稳定的活动
     - 不使用本工具实施网络攻击或破解正版软件
     - 开发者与用户生成内容无法律关联性
     - 任何使用本工具创建违反当地法律法规的内容（包括但不限于色情、暴力、侵权内容），其法律责任由内容创建者独立承担

3. 责任豁免  
   鉴于开源项目特性：  
     - 作者无法监控所有衍生代码的使用
     - 不负责用户自行编译/分发的修改版本
     - 不承担用户非法使用导致的任何法律责任
     - 不提供内容审核或过滤的技术保证
     - 工具运行机制决定其无法识别或过滤内容性质
     - 所有数据处理均在用户本地设备完成，开发者无法访问或控制任何用户数据

   用户知悉并同意：
     - 本工具不具备任何内容生成能力，最终内容完全取决于其输入文件。工具仅执行格式转换操作，无法对用户输入数据的合法性、内容性质及使用场景负责。
     - 本工具不包含任何数据上传/下载功能，所有内容生成均在用户本地设备完成
     - 如发现有人利用本工具从事违法活动，应立即向公安机关举报
     - 开发者保留停止分发涉嫌被滥用的特定版本的权利

4. 年龄及监护责任  
   用户须为完全民事行为能力人（18 周岁及以上），禁止未成年人下载、安装或使用。监护人须对设备访问承担完全管理责任。

5. 协议更新  
   作者有权通过 GitHub 仓库更新本声明，继续使用视为接受最新版本条款。

6. 担保免责  
  此工具按"原样"提供，不附带任何明示或暗示的保证，包括但不限于：
     - 适销性担保  
     - 特定用途适用性担保  
     - 代码无缺陷或潜在风险担保  
     - 持续可用性及技术支持担保  

7. 损害赔偿责任免除  
   无论使用/无法使用本工具导致：  
     - 直接/间接财产损失
     - 数据丢失或业务中断
     - 第三方索赔或行政处罚
     - 受到刑事或民事处罚
   开发者均不承担民事、行政或刑事责任  

8. 第三方依赖免责  
   本工具包含或依赖的第三方库/组件如存在：  
     - 知识产权纠纷  
     - 安全漏洞  
     - 违反当地法律的内容  
   开发者不承担连带责任，用户应自行审查相关许可  

9. 版本迭代风险  
    用户理解并接受：  
     - 不同版本代码可能存在兼容性问题  
     - 开发者无义务维护旧版本安全性  
     - 自行修改代码可能导致不可预见的法律风险


日本語

本声明の翻訳版（日本語を含む）と簡体中文原文に解釈上の相違がある場合は、簡体中文版が優先的に有効とします。

1. ツールの性質に関する声明
   本プロジェクトは、BSD-3-Clause ライセンスに基づくオープンソースツールです。開発者（以下「作者」）は個人の技術研究者に過ぎず、本ツールを通じていかなる商業的利益も得ておらず、いかなる形式のオンラインサービス及びユーザーアカウントシステムも提供しません。
   本ツールは純粋にローカル環境でのデータ処理ツールであり、いかなるコンテンツ生成能力も有しておらず、いかなるオンラインアップロード・ダウンロード機能も備えていません。
   本ツールは本質的にフォーマット変換ツールであり、すべての出力内容はユーザーが提供したオリジナルデータのフォーマット変換結果です。ツール自体は、いかなる新しいデータ内容も生成、修正、または注入しません。

2. 使用制限
   本ソフトウェアは、以下のような、所在地の法令に違反する可能性のある違法行為を含むがこれに限定されない、いかなる違法目的にも使用してはなりません：
     - わいせつ物や違法物の作成・頒布
     - 他人の知的財産権の侵害
     - プラットフォーム利用規約違反行為
   使用者は、法律違反によって生じた結果について、自ら全ての責任を負うものとします。

   ユーザーは以下を確約しなければなりません：
     - 所在地の法令に違反する内容を、作成、公開、送信、拡散、保存しないこと。
     - わいせつ物や違法物を、作成、公開、送信、拡散、保存しないこと。
     - 他人の知的財産権を侵害する内容を、作成、公開、送信、拡散、保存しないこと。
     - プラットフォーム利用規約に違反する内容を、作成、公開、送信、拡散、保存しないこと。
     - 本ツールを国家安全を脅かす、または社会の安定を破壊する活動に使用しないこと。
     - 本ツールを使用してネットワーク攻撃を実行したり、正規ソフトウェアのクラッキングを行わないこと。
     - 開発者はユーザー生成コンテンツとの法的関連性を一切有しないこと。
     - 本ツールを使用して作成された、当地の法令に違反するコンテンツ（ポルノ、暴力、著作権侵害等を含むがこれに限定されない）についての法的責任は、コンテンツ作成者が単独で負うこと。

3. 免責事項
   オープンソースプロジェクトの性質上：
     - 作者はすべての派生コードの使用状況を監視することはできません。
     - ユーザー自身がコンパイル/配布する修正版について責任を負いません。
     - ユーザーの違法使用に起因するいかなる法的責任も負いません。
     - コンテンツ審査やフィルタリングの技術的保証は提供しません。
     - ツールの動作メカニズム上、コンテンツの性質を識別またはフィルタリングすることはできません。
     - すべてのデータ処理はユーザーのローカルデバイス上で完了し、開発者はユーザーデータにアクセスまたは制御することはできません。

   ユーザーはこれを理解し同意するものとします：
     - 本ツールはコンテンツ生成能力を一切有しておらず、最終的なコンテンツは完全に入力ファイルに依存します。ツールはフォーマット変換操作のみを実行し、ユーザー入力データの合法性、内容の性質、および使用シナリオについて責任を負うことはできません。
     - 本ツールにはいかなるデータアップロード/ダウンロード機能も含まれておらず、すべてのコンテンツ生成はユーザーのローカルデバイス上で完了します。
     - 本ツールを利用した違法行為を発見した場合は、直ちに公安機関に通報すること。
     - 開発者は、悪用の疑いのある特定バージョンの配布停止権利を留保します。

4. 年齢及び監督責任
   ユーザーは完全民事行為能力者（18歳以上）でなければなりません。未成年者のダウンロード、インストール、または使用は禁止されています。保護者はデバイスへのアクセスについて完全な管理責任を負うものとします。

5. 規約の更新
   作者は、GitHub リポジトリを通じて本声明を更新する権利を有します。継続的な使用は最新版の条項の受諾とみなされます。

6. 保証の免責
   本ツールは「現状のまま」提供され、商品性、特定目的への適合性、コードの欠陥や潜在リスクの不存在、継続的な利用可能性及び技術サポートの保証を含むがこれらに限定されない、明示または黙示を問わず、いかなる保証も付帯しません。

7. 損害賠償責任の免責
   本ツールの使用または使用不能によって生じた以下の事項について、開発者は民事、行政、または刑事上のいかなる責任も負いません：
     - 直接的または間接的な財産上の損害
     - データ損失または業務中断
     - 第三者からの請求または行政処分
     - 刑事罰または民事罰の適用

8. 第三者依存関係に関する免責
   本ツールに含まれる、または依存するサードパーティライブラリ/コンポーネントに関して：
     - 知的財産権に関する紛争
     - セキュリティ上の脆弱性
     - 当地の法律に違反する内容
   が存在する場合でも、開発者は連帯責任を負わず、ユーザーは関連ライセンスを自ら確認するものとします。

9. バージョン更新リスク
   ユーザーは以下を理解し受諾するものとします：
     - 異なるバージョンのコード間で互換性の問題が生じる可能性があること。
     - 開発者は旧バージョンのセキュリティを維持する義務を負わないこと。
     - コードの独自修正は予期せぬ法的リスクを招く可能性があること。
```

<br>

# Credit

- [CM3D2.Serialization](https://github.com/luvoid/CM3D2.Serialization) (I got some file structure information from here)
- [Golang](https://golang.org/)
- [Wails](https://wails.io/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Ant Design](https://ant.design/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [ImageMagick](https://imagemagick.org/) by ImageMagick Studio LLC
