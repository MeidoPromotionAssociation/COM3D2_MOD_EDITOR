export function getFileExtension(filePath: string): string {
    const lastDotIndex = filePath.lastIndexOf('.');
    if (lastDotIndex === -1) {
        return '';
    }
    return filePath.slice(lastDotIndex + 1);
}


export function cancelJsonSchemaValidation(monacoInstance: any): void {
    monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [],
    });
}