
export const LastUpdateCheckTimeKey = "LastUpdateCheckTimeKey"; // 存储上次检查时间的键

export const NewVersionAvailableKey = "NewVersionAvailableKey"; // 存储新版本是否可用的键

export const UpdateCheckInterval = 24 * 60 * 60 * 1000; // 检查更新的间隔 24 小时（毫秒）

export const GitHubUrl = "https://github.com/90135/COM3D2_MOD_EDITOR"; // GitHub 仓库地址

export const GitHubReleaseUrl = "https://github.com/90135/COM3D2_MOD_EDITOR/releases"; // GitHub 仓库的发布页面地址

export const COM3D2HeaderConstants = {  // COM3D2 文件头常量
    MenuSignature: "CM3D2_MENU",
    MenuVersion: 1000,
    MateSignature: "CM3D2_MATERIAL",
    MateVersion: 2001,
    PMatSignature: "CM3D2_PMATERIAL",
    PMatVersion: 1000,
    ColSignature: "CM3D21_COL",
    ColVersion: 24102,
    PhySignature: "CM3D21_PHY",
    PhyVersion: 24102,
    TexSignature: "CM3D2_TEX",
    TexVersion: 1010,
    AnmSignature: "CM3D2_ANIM",
    AnmVersion: 1001,

    endByte: 0x00,
    MateEndString: "end"
} as const;