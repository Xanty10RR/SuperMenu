import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    base: './', // Clave absoluta para que Electron cargue los scripts locales
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src') // Recuperamos tu alias indispensable
      }
    },
    plugins: [react()]
  }
})
