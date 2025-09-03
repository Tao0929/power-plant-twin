import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 使用 true 而不是硬编码的 IP，这样可以在任何网络环境下访问
    port: 7777
  },
  base: '/power-plant-twin/', // 这应该与你的 GitHub 仓库名称一致
  build: {
    outDir: './docs', // GitHub Pages 可以从 docs 目录部署
    assetsDir: 'assets', // 确保资源文件路径正确
    emptyOutDir: true // 构建前清空 docs 目录
  }
})
