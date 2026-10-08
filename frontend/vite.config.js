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

    // the backend server
    server: {
        // Wait for saves to finish so synced files are not reloaded while empty.
        watch: {
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 100,
            },
        },
        proxy: {
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
            },
        },
    },
})
