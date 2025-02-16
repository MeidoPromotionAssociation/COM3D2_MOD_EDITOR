import { useEffect, useState } from "react";

export function useDarkMode() {
    const [isDarkMode, setIsDarkMode] = useState(
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        // 监听主题变化
        const handleChange = (event: MediaQueryListEvent) => {
            setIsDarkMode(event.matches);
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    return isDarkMode;
}
