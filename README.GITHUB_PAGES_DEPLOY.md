# GitHub Pages 部署配置指南

本指南解释了如何在不修改代码中资源路径的情况下，正确配置项目以支持GitHub Pages部署。

## 问题概述

当将项目部署到GitHub Pages时，代码中直接使用的`/assets/xxx`路径引用可能无法正确解析，因为：

1. GitHub Pages站点通常托管在`https://username.github.io/repo-name/`下
2. 而代码中的`/assets/xxx`路径会被解析为`https://username.github.io/assets/xxx`
3. 正确的路径应该是`https://username.github.io/repo-name/assets/xxx`

## 解决方案

我们实现了一个零侵入式的解决方案，不需要修改代码中的任何资源路径引用。通过以下配置，构建过程会自动处理路径问题：

### 1. Vite配置 (vite.config.js)

- 设置了正确的`base`路径：`/power-plant-twin/`
- 配置了`publicDir`：确保Vite正确处理public目录下的静态资源
- 添加了路径别名`@assets`：指向public/assets目录
- 配置了Rollup的输出路径：确保构建生成的资源路径正确

### 2. 资源路径处理插件 (vite.config.assets-plugin.js)

这是核心解决方案，它会在构建过程中自动执行以下操作：

- 在开发环境中：保持代码不变，不影响开发体验
- 在生产环境构建时：
  1. 首先将所有`/assets/`引用替换为`/@assets/`
  2. 然后在最终的bundle中确保所有路径都正确指向`/power-plant-twin/assets/`

## 部署步骤

1. 确保vite.config.js中的`base`值与你的GitHub仓库名称一致
2. 运行构建命令：`npm run build`
3. 部署docs目录到GitHub Pages

## 验证

构建完成后，你可以检查以下几点来验证配置是否正确：

1. 检查`docs/index.html`中的JS/CSS引用路径是否包含`/power-plant-twin/`前缀
2. 检查构建生成的JS文件中的资源路径是否已正确转换

## 注意事项

- 此方案仅适用于通过代码直接引用的静态资源（如模型文件、纹理等）
- 对于在HTML中直接引用的资源（如vite.svg），需要确保路径正确
- 如果你需要修改部署路径或仓库名称，请记得同时更新vite.config.js中的`base`配置

## 常见问题

**问：为什么我本地开发时一切正常，但部署到GitHub Pages后资源无法加载？**

**答：** 这是因为本地开发时，`/assets/`路径会被解析到开发服务器的根目录，而在GitHub Pages上，它需要解析到仓库的子目录下。我们的插件解决了这个问题。

**问：我需要修改代码中的资源路径引用吗？**

**答：** 不需要！这正是我们解决方案的优势所在 - 你可以继续使用现有的`/assets/xxx`路径引用，构建过程会自动处理路径转换。