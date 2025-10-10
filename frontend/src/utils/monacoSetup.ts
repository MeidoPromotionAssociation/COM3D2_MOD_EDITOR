// Ensure Monaco loads locally instead of from a CDN
// This module should be imported before any component that uses @monaco-editor/react

import loader from '@monaco-editor/loader'
import * as monaco from 'monaco-editor'

// Import workers so Vite bundles them locally
// Note: The "?worker" query tells Vite to create worker bundles
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

// Provide MonacoEnvironment to use locally bundled workers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).MonacoEnvironment = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getWorker(_moduleId: string, label: string) {
    if (label === 'json') {
      return new (JsonWorker as unknown as { new (): Worker })()
    }
    return new (EditorWorker as unknown as { new (): Worker })()
  },
}

// Configure the loader to use the already imported local monaco instance
loader.config({ monaco })
