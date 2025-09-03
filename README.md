# power-plant-twin
数字孪生玩家项目

## 项目简介
这是一个基于 React 和 Three.js 的数字孪生发电厂项目，用于可视化和管理发电厂设备。

## 技术栈
- React 18
- Three.js
- React Three Fiber
- Vite

## 快速开始

### 安装依赖
```bash
npm install
# 或者使用 yarn
# yarn install
```

### 开发模式
```bash
npm run dev
# 或者使用 yarn
# yarn dev
```

### 构建项目
```bash
npm run build
# 或者使用 yarn
# yarn build
```

### 预览构建结果
```bash
npm run preview
# 或者使用 yarn
# yarn preview
```

## GitHub Pages 部署指南

### 前置条件
1. 确保你已经创建了 GitHub 仓库，仓库名称应为 `power-plant-twin`
2. 确保你的本地项目已经关联到 GitHub 仓库

### 部署步骤

1. **安装依赖**
   ```bash
   npm install
   ```

2. **安装 gh-pages 包**（已在 package.json 中添加）
   ```bash
   npm install gh-pages --save-dev
   ```

3. **使用部署脚本**
   ```bash
   npm run deploy
   ```

   这个命令会：
   - 构建项目到 docs 目录
   - 将 docs 目录部署到 GitHub Pages

4. **在 GitHub 上配置 Pages**
   - 打开你的 GitHub 仓库
   - 点击 "Settings" -> "Pages"
   - 在 "Source" 部分，选择 "Deploy from a branch"
   - 在 "Branch" 部分，选择 "gh-pages" 和 "/ (root)"
   - 点击 "Save"

5. **等待部署完成**
   - GitHub Pages 可能需要几分钟时间来部署你的网站
   - 部署完成后，你可以通过 `https://<your-username>.github.io/power-plant-twin/` 访问你的网站

### 注意事项
- 确保 `vite.config.js` 中的 `base` 设置与你的 GitHub 仓库名称一致
- 确保 `outDir` 设置为 `./docs`
- 如果遇到资源路径问题，请检查 `vite.config.js` 中的 `assetsDir` 配置
