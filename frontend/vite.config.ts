import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        target: "es2022"
    },
    plugins: [
        react(),
    ]
})
