import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [
        react(),

        babel({
            presets: [reactCompilerPreset()]
        })
    ],

    server: {
        host: "0.0.0.0",
        port: 5173,
        strictPort: true,
        watch: {
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 100,
            },
        },
        proxy: {
            "/api": {
                target: "http://127.0.0.1:5000",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://127.0.0.1:5000",
                ws: true,
                changeOrigin: true,
            },
        },
    },
})
