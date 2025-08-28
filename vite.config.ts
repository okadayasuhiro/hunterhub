import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173
  },
  // 本番最適化: コンソールログ削除
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        // 本番ビルド時にconsole.log, console.info, console.debugを削除
        drop_console: ['log', 'info', 'debug'],
        // console.error, console.warnは残す（重要なエラー情報）
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    }
  }
})
