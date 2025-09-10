import {GetAppVersion} from "../../wailsjs/go/main/App";

export const AppVersion = await GetAppVersion()

export const UpdateCheckInterval = 24 * 60 * 60 * 1000; // 检查更新的间隔 24 小时（毫秒）

export const RetryInterval = 1 * 60 * 60 * 1000; // 重试检查更新间隔 1 小时（毫秒）

export const AppTitle = "COM3D2 MOD EDITOR V2 by 90135";

export const AppTitleNoAuthor = "COM3D2 MOD EDITOR V2"

export const SettingCheckUpdateKey = "SettingCheckUpdateKey"; // 检查更新设置的键

export const GitHubUrl = "https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR"; // GitHub 仓库地址

export const GitHubReleaseUrl = "https://github.com/MeidoPromotionAssociation/COM3D2_MOD_EDITOR/releases"; // GitHub 仓库的发布页面地址

export const ChineseMODGuideUrl = "https://github.com/MeidoPromotionAssociation/COM3D2_Simple_MOD_Guide_Chinese" // 中文 MOD 教程，简明 MOD 教程

export const CrowdinUrl = "https://crowdin.com/project/com3d2modeditorv2" // Crowdin 项目地址

export const ImageMagickUrl = "https://imagemagick.org/script/download.php" // ImageMagick 下载地址

// 支持的所有文件类型，用分号分隔，不包含图片类型
export const AllSupportedFileTypes =
    "*.menu;*.menu.json;" +
    "*.mate;*.mate.json;" +
    "*.pmat;*.pmat.json;" +
    "*.col;*.col.json;" +
    "*.phy;*.phy.json;" +
    "*.psk;*.psk.json;" +
    "*.tex;*.tex.json;" +
    "*.anm;*.anm.json;" +
    "*.model;*.model.json;" +
    "*.nei;*.csv;"

export const AllSupportedFileTypesSet = new Set(['menu', 'mate', 'pmat', 'col', 'phy', 'psk', 'tex', 'anm', 'model', 'nei']);
