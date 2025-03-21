import {forwardRef} from "react";

export interface TexEditorProps {
    filePath?: string;
}

export interface TexEditorRef {
    handleReadFile: () => Promise<void>;
    handleSaveFile: () => Promise<void>;
    handleSaveAsFile: () => Promise<void>;
}

const TexEditor = forwardRef<TexEditorRef, TexEditorProps>(({filePath}, ref) => {
    return null;
});


export default TexEditor;