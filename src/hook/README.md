# useThreeReact Hook 文档

`useThreeReact` 是一个自定义 React Hook，它封装了 Three.js 的核心功能，提供了在 React 应用中使用原生 Three.js 的便捷方式。这个 hook 特别适用于需要对 Three.js 有更精细控制的场景，或者作为 @react-three/fiber 的替代方案。

## 功能特性

- **完整的 Three.js 环境**：自动初始化场景、相机、渲染器和控制器
- **响应式设计**：自动处理窗口大小变化
- **模型加载**：内置 OBJ 模型加载功能，支持材质文件
- **资源管理**：自动清理资源，防止内存泄漏
- **与项目风格集成**：使用与现有项目一致的视觉风格（颜色、光照等）
- **事件处理**：提供完整的交互控制（旋转、缩放、平移）

## 安装依赖

使用前，请确保您的项目已安装以下依赖：

```bash
npm install three three-stdlib
# 或使用 yarn
# yarn add three three-stdlib
```

## 使用方法

### 基本用法

```jsx
import { useRef } from 'react';
import { useThreeReact } from './hook/useThreeReact';

function MyThreeComponent() {
  const containerRef = useRef(null);
  
  const {
    scene,
    camera,
    renderer,
    controls,
    isReady,
    loading,
    models,
    loadOBJModel,
    removeModel,
    setBackgroundColor
  } = useThreeReact(containerRef);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
  );
}
```

### 加载模型示例

```jsx
// 在组件中
const handleLoadModel = async () => {
  try {
    await loadOBJModel(
      '/assets/model.obj',
      '/assets/model.mtl', // 可选
      {
        position: [0, 0, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
        name: '我的模型'
      }
    );
  } catch (error) {
    console.error('加载模型失败:', error);
  }
};
```

### 完整示例组件

请查看 `UseThreeReactExample.jsx` 文件，了解如何在实际项目中使用这个 hook。

## Hook 返回值

`useThreeReact` hook 返回一个包含以下属性的对象：

| 属性 | 类型 | 描述 |
|------|------|------|
| `scene` | THREE.Scene | Three.js 场景对象 |
| `camera` | THREE.Camera | Three.js 相机对象 |
| `renderer` | THREE.WebGLRenderer | Three.js 渲染器对象 |
| `controls` | OrbitControls | 轨道控制器对象，用于交互控制 |
| `isReady` | boolean | Three.js 环境是否初始化完成 |
| `loading` | boolean | 是否正在加载模型 |
| `models` | Array | 已加载的模型列表 |
| `loadOBJModel` | Function | 加载 OBJ 模型的方法 |
| `removeModel` | Function | 移除指定模型的方法 |
| `setBackgroundColor` | Function | 设置场景背景色的方法 |

## API 方法详解

### loadOBJModel(path, mtlPath, options)

加载 OBJ 格式的 3D 模型

- **参数**:
  - `path`: string - OBJ 文件路径
  - `mtlPath`: string (可选) - MTL 材质文件路径
  - `options`: object (可选) - 加载选项
    - `position`: Array [x, y, z] - 模型位置
    - `scale`: Array [x, y, z] - 模型缩放
    - `rotation`: Array [x, y, z] - 模型旋转
    - `name`: string - 模型名称

- **返回值**: Promise<Object> - 加载的模型对象

### removeModel(modelId)

从场景中移除指定的模型

- **参数**:
  - `modelId`: number - 模型的唯一 ID

### setBackgroundColor(color)

设置场景的背景色

- **参数**:
  - `color`: string | THREE.Color - 颜色值或 Three.js 颜色对象

## 注意事项

1. 确保容器元素有明确的尺寸（宽度和高度），否则 Three.js 渲染器可能无法正确初始化
2. 加载大模型时，可能会导致页面短暂卡顿，建议添加加载指示器
3. 在组件卸载时，hook 会自动清理所有资源，无需手动操作
4. 如需使用其他类型的模型加载器（如 GLTF、FBX 等），可以扩展此 hook 或参考 `loadOBJModel` 方法实现类似功能

## 项目兼容性

此 hook 与项目中使用的 Three.js 版本兼容，并使用了与现有组件（如 GLTFSceneViewer、RealOBJModelViewer）相同的视觉风格设置，确保整体视觉一致性。