import {forwardRef} from "react";

export interface TexEditorProps {
    filePath?: string;
}

export interface TexEditorRef {
    handleReadTexFile: () => Promise<void>;
    handleSaveTexFile: () => Promise<void>;
    handleSaveAsTexFile: () => Promise<void>;
}

const TexEditor = forwardRef<TexEditorRef, TexEditorProps>(({filePath}, ref) => {
    return null;
});


export default TexEditor;