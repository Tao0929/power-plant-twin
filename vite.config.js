import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { createAssetPathPlugin } from './vite.config.assets-plugin'
import UnoCSS from 'unocss/vite'
import { fileURLToPath } from 'url'

const isDev = process.env.NODE_ENV === 'development';
console.log({isDev})
// https://vitejs.dev/config/
export default defineConfig({
  // 指定public目录，Vite会自动处理其中的静态资源
  publicDir: 'public',
  // 使用React插件和我们自定义的资源路径处理插件
  plugins: [
    UnoCSS(),
    react(),
    createAssetPathPlugin()
  ],
  server: {
    host: true, // 使用 true 而不是硬编码的 IP，这样可以在任何网络环境下访问
    port: 7777
  },
  // 路径别名配置
  resolve: {
    alias: {
      // 为public/assets创建别名，这样可以在代码中使用'@assets/'来引用资源
      '@assets': resolve(__dirname, 'public/assets'),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
  base: isDev ? './' : '/power-plant-twin/', // 这应该与你的 GitHub 仓库名称一致
  build: {
    outDir: './docs', // GitHub Pages 可以从 docs 目录部署
    assetsDir: 'assets', // 确保资源文件路径正确
    emptyOutDir: true, // 构建前清空 docs 目录
    rollupOptions: {
      output: {
        // 确保静态资源路径正确
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
})
