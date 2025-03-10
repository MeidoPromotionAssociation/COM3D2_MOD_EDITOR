import {useEffect, useState} from 'react';
import {
    AppVersion,
    LastUpdateCheckTimeKey,
    LatestVersionKey,
    NewVersionAvailableKey,
    RetryInterval,
    UpdateCheckInterval
} from "./consts";
import {CheckLatestVersion} from "../../wailsjs/go/main/App";

/**
 * 检查是否需要更新
 * @returns {Promise<boolean>} 是否有新版本
 */
export async function checkForUpdates(): Promise<boolean> {
    try {
        // 获取当前存储的版本信息
        const storedLatestVersion = localStorage.getItem(LatestVersionKey);
        const newVersionAvailable = localStorage.getItem(NewVersionAvailableKey);

        // 如果当前版本大于等于已存储的最新版本，清除相关本地存储
        if (storedLatestVersion && compareVersions(AppVersion, storedLatestVersion) >= 0) {
            clearUpdateInfo();
            return false;
        }

        // 如果已经记录了新版本可用，直接返回
        if (newVersionAvailable === 'true') {
            return true;
        }

        // 检查是否需要进行更新检查
        if (!shouldCheckForUpdate()) {
            return !!newVersionAvailable;
        }

        // 执行更新检查
        const result = await CheckLatestVersion();

        // 更新最后检查时间
        updateLastCheckTime();

        // 如果检测到新版本
        if (result.IsNewer) {
            // 保存最新版本信息
            localStorage.setItem(LatestVersionKey, result.LatestVersion);
            localStorage.setItem(NewVersionAvailableKey, 'true');
            return true;
        } else {
            // 没有新版本，设置或更新最新版本号
            localStorage.setItem(LatestVersionKey, result.LatestVersion);
            localStorage.setItem(NewVersionAvailableKey, 'false');
            return false;
        }
    } catch (error) {
        console.error('check update failed:', error);
        // 设置重试间隔为1小时
        setRetryInterval();
        return false;
    }
}

/**
 * 判断是否应该检查更新
 * @returns {boolean} 是否应该检查更新
 */
function shouldCheckForUpdate(): boolean {
    const lastCheckTime = localStorage.getItem(LastUpdateCheckTimeKey);

    if (!lastCheckTime) {
        return true; // 从未检查过，应该检查
    }

    const currentTime = new Date().getTime();
    const lastCheck = parseInt(lastCheckTime, 10);

    // 获取当前设置的检查间隔
    const interval = localStorage.getItem('UpdateRetry') === 'true'
        ? RetryInterval
        : UpdateCheckInterval;

    return currentTime - lastCheck >= interval;
}

/**
 * 更新上次检查时间
 */
function updateLastCheckTime(): void {
    const currentTime = new Date().getTime();
    localStorage.setItem(LastUpdateCheckTimeKey, currentTime.toString());

    // 检查成功后，如果是重试状态，重置为正常间隔
    if (localStorage.getItem('UpdateRetry') === 'true') {
        localStorage.removeItem('UpdateRetry');
    }
}

/**
 * 设置重试间隔
 */
function setRetryInterval(): void {
    localStorage.setItem('UpdateRetry', 'true');
}

/**
 * 清除更新相关信息
 */
function clearUpdateInfo(): void {
    localStorage.removeItem(NewVersionAvailableKey);
    localStorage.removeItem(LatestVersionKey);
}

/**
 * 比较版本号
 * @param ver1 版本号1，例如 "v1.0.1"
 * @param ver2 版本号2，例如 "v1.0.2"
 * @returns {number} 如果ver1 > ver2返回1，如果ver1 < ver2返回-1，如果相等返回0
 */
function compareVersions(ver1: string, ver2: string): number {
    // 移除版本号前缀 "v"
    const v1 = ver1.startsWith('v') ? ver1.substring(1) : ver1;
    const v2 = ver2.startsWith('v') ? ver2.substring(1) : ver2;

    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = i < parts1.length ? parts1[i] : 0;
        const num2 = i < parts2.length ? parts2[i] : 0;

        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }

    return 0; // 版本相等
}

/**
 * 使用自定义Hook监控版本更新
 * @returns {boolean} 是否有新版本可用
 */
export function useVersionCheck(): boolean {
    const [hasUpdate, setHasUpdate] = useState<boolean>(false);

    useEffect(() => {
        // 应用启动时检查是否有新版本
        const checkUpdate = async () => {
            const result = await checkForUpdates();
            setHasUpdate(result);
        };

        checkUpdate();
    }, []);

    return hasUpdate;
}