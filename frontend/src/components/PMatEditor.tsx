import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";

export interface PMatEditorProps {
    filePath?: string;
}

export interface PMatEditorRef {
    handleReadMenuFile: () => Promise<void>;
    handleSaveMenuFile: () => Promise<void>;
    handleSaveAsMenuFile: () => Promise<void>;
}


const PMatEditor = forwardRef<PMatEditorRef, PMatEditorProps>(({filePath}, ref) => {

        return (
            <div style={{padding: 20}}>

            </div>
        );
    })
;

export default PMatEditor;
