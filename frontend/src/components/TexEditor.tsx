import {forwardRef, useEffect} from "react";
import {WindowSetTitle} from "../../wailsjs/runtime";
import {useTranslation} from "react-i18next";

export interface TexEditorProps {
    filePath?: string;
}

export interface TexEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

const TexEditor = forwardRef<TexEditorRef, TexEditorProps>((props, ref) => {
    const {t} = useTranslation();
    const {filePath} = props;


    /** 组件挂载或 filePath 改变时，如果传入了 filePath 就自动读取一次 */
    useEffect(() => {
        let isMounted = true;

        if (filePath) {
            const fileName = filePath.split(/[\\/]/).pop();
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135 —— " + t("Infos.editing_colon") + fileName + "  (" + filePath + ")");

            (async () => {
                try {
                    if (!isMounted) return;
                    await handleReadTexFile();
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            })();
        } else {
            WindowSetTitle("COM3D2 MOD EDITOR V2 by 90135");
            if (!isMounted) return;
            // 如果没有 filePath，就新建一个空的
        }

        return () => {
            isMounted = false;
        };
    }, [filePath]);

    /** 读取 Tex 或图片文件 */
    const handleReadTexFile = async () => {
    }


    return null;
});


export default TexEditor;