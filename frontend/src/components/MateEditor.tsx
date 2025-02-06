import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";

export interface MateEditorProps {
    filePath?: string;
}

export interface MateEditorRef {
    handleReadMenuFile: () => Promise<void>;
    handleSaveMenuFile: () => Promise<void>;
    handleSaveAsMenuFile: () => Promise<void>;
}


const MateEditor = forwardRef<MateEditorRef, MateEditorProps>(({filePath}, ref) => {

        return (
            <div style={{padding: 20}}>

            </div>
        );
    })
;

export default MateEditor;
