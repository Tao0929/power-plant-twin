import { useRef, useState, useEffect } from 'react';
import { useThreeReact } from '../hook/useThreeReact';
import * as THREE from 'three';

/**
 * 使用 useThreeReact hook 的示例组件
 * 展示如何在 React 组件中使用原生 Three.js 功能
 */
export default function UseThreeReactExample() {
  const containerRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState('substation');
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [error, setError] = useState(null);
  const [modelConfigs] = useState({
    substation: {
      name: '变电站模型',
      path: '/assets/substation_ht_1005_01.obj',
      mtlPath: '/assets/substation_ht_1005_01.mtl',
      position: [0, 0, 0],
      scale: [0.05, 0.05, 0.05],
      rotation: [0, 0, 0]
    },
    electricTower: {
      name: '电力塔模型',
      path: '/assets/electric_tower_1005_01.obj',
      mtlPath: '/assets/electric_tower_1005_01.mtl',
      position: [0, 0, 0],
      scale: [0.1, 0.1, 0.1],
      rotation: [0, 0, 0]
    },
    transformer: {
      name: '变压器模型',
      path: '/assets/transformer_1005_01_01.obj',
      mtlPath: '/assets/transformer_1005_01_01.mtl',
      position: [0, 0, 0],
      scale: [0.5, 0.5, 0.5],
      rotation: [0, -Math.PI/2, 0]
    },
    train: {
      name: '运输车辆模型',
      path: '/assets/train_1005_01.obj',
      mtlPath: '/assets/train_1005_01.mtl',
      position: [0, 0, 0],
      scale: [0.03, 0.03, 0.03],
      rotation: [0, 0, 0]
    }
  });

  // 用于网格和坐标轴的引用
  const gridHelperRef = useRef();
  const axesHelperRef = useRef();

  // 使用我们完善的 useThreeReact hook
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

  // 初始化网格和坐标轴
  useEffect(() => {
    if (!isReady || !scene) return;

    // 添加网格地面
    if (showGrid && !gridHelperRef.current) {
      gridHelperRef.current = new THREE.GridHelper(100, 100, '#00d4ff', '#333333');
      gridHelperRef.current.position.set(0, -0.01, 0); // 略微低于地面
      scene.add(gridHelperRef.current);
    }

    // 添加坐标轴
    if (showAxes && !axesHelperRef.current) {
      axesHelperRef.current = new THREE.AxesHelper(10);
      scene.add(axesHelperRef.current);
    }

    // 移除网格地面
    if (!showGrid && gridHelperRef.current) {
      scene.remove(gridHelperRef.current);
      gridHelperRef.current = null;
    }

    // 移除坐标轴
    if (!showAxes && axesHelperRef.current) {
      scene.remove(axesHelperRef.current);
      axesHelperRef.current = null;
    }

    // 设置自动旋转
    if (controls) {
      controls.autoRotate = autoRotate;
    }
  }, [isReady, showGrid, showAxes, autoRotate, scene, controls]);

  // 当 Three.js 环境准备好后加载默认模型
  useEffect(() => {
    if (isReady) {
      // 默认不自动加载模型，让用户手动点击加载
      console.log('Three.js 环境已准备好，可以加载模型');
    }
  }, [isReady]);

  // 加载选中的模型
  const handleLoadModel = async () => {
    try {
      setError(null);
      const config = modelConfigs[selectedModel];
      
      if (!config) {
        throw new Error('未找到选中的模型配置');
      }

      // 先清空现有模型
      handleRemoveAllModels();
      
      // 加载新模型
      const model = await loadOBJModel(
        config.path,
        config.mtlPath,
        {
          position: config.position,
          scale: config.scale,
          rotation: config.rotation,
          name: config.name
        }
      );
      
      console.log(`${config.name} 加载成功`);
      
      // 调整相机位置以更好地查看模型
      if (camera && model.object) {
        // 简单的相机自动调整逻辑
        const box = new THREE.Box3().setFromObject(model.object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // 计算合适的相机距离
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5; // 增加一点距离，让视图更舒适
        
        // 设置相机位置和目标
        camera.position.set(center.x + cameraZ, center.y + cameraZ / 2, center.z + cameraZ);
        camera.lookAt(center);
        
        // 更新控制器目标
        if (controls) {
          controls.target.set(center.x, center.y, center.z);
          controls.update();
        }
      }
    } catch (error) {
      console.error('加载模型出错:', error);
      setError(`加载模型失败: ${error.message || '未知错误'}`);
    }
  };

  // 加载多个模型组成场景
  const handleLoadScene = async () => {
    try {
      setError(null);
      
      // 先清空现有模型
      handleRemoveAllModels();
      
      // 加载变电站场景
      await loadOBJModel(
        '/assets/substation_ht_1005_01.obj',
        '/assets/substation_ht_1005_01.mtl',
        {
          position: [-10, 0, 0],
          scale: [0.05, 0.05, 0.05],
          name: '变电站建筑'
        }
      );
      
      await loadOBJModel(
        '/assets/electric_tower_1005_01.obj',
        '/assets/electric_tower_1005_01.mtl',
        {
          position: [10, 0, 0],
          scale: [0.1, 0.1, 0.1],
          name: '电力塔'
        }
      );
      
      await loadOBJModel(
        '/assets/transformer_1005_01_01.obj',
        '/assets/transformer_1005_01_01.mtl',
        {
          position: [0, 0, 10],
          scale: [0.5, 0.5, 0.5],
          rotation: [0, -Math.PI/2, 0],
          name: '变压器'
        }
      );
      
      // 调整相机位置
      if (camera) {
        camera.position.set(20, 15, 20);
        camera.lookAt(0, 0, 0);
        if (controls) {
          controls.target.set(0, 0, 0);
          controls.update();
        }
      }
      
      console.log('场景加载成功');
    } catch (error) {
      console.error('加载场景出错:', error);
      setError(`加载场景失败: ${error.message || '未知错误'}`);
    }
  };

  // 移除所有模型
  const handleRemoveAllModels = () => {
    models.forEach(model => {
      removeModel(model.id);
    });
  };

  // 更改背景色
  const handleChangeBackgroundColor = () => {
    const colors = ['#131323', '#0a0a0a', '#1a1a2e', '#16213e', '#0f3460', '#16213e'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setBackgroundColor(randomColor);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* 控制按钮区域 */}
      <div style={{
        padding: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap',
        borderBottom: '1px solid #00d4ff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#00d4ff', fontSize: '12px' }}>选择模型:</label>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={loading || !isReady}
            style={selectStyle}
          >
            {Object.entries(modelConfigs).map(([key, config]) => (
              <option key={key} value={key}>{config.name}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={handleLoadModel}
          disabled={loading || !isReady}
          style={buttonStyle}
        >
          {loading ? '加载中...' : `加载 ${modelConfigs[selectedModel]?.name || '模型'}`}
        </button>
        
        <button 
          onClick={handleLoadScene}
          disabled={loading || !isReady}
          style={secondaryButtonStyle}
        >
          加载完整场景
        </button>
        
        <button 
          onClick={handleRemoveAllModels}
          disabled={!isReady || models.length === 0}
          style={dangerButtonStyle}
        >
          清空场景
        </button>
        
        <button 
          onClick={handleChangeBackgroundColor}
          disabled={!isReady}
          style={secondaryButtonStyle}
        >
          更换背景
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            id="showGrid" 
            checked={showGrid} 
            onChange={(e) => setShowGrid(e.target.checked)}
            disabled={!isReady}
          />
          <label htmlFor="showGrid" style={{ color: '#00d4ff', fontSize: '12px' }}>显示网格</label>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            id="showAxes" 
            checked={showAxes} 
            onChange={(e) => setShowAxes(e.target.checked)}
            disabled={!isReady}
          />
          <label htmlFor="showAxes" style={{ color: '#00d4ff', fontSize: '12px' }}>显示坐标轴</label>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            id="autoRotate" 
            checked={autoRotate} 
            onChange={(e) => setAutoRotate(e.target.checked)}
            disabled={!isReady}
          />
          <label htmlFor="autoRotate" style={{ color: '#00d4ff', fontSize: '12px' }}>自动旋转</label>
        </div>
        
        <span style={statusTextStyle}>
          {isReady ? 'Three.js 已就绪' : 'Three.js 初始化中...'}
        </span>
        
        {models.length > 0 && (
          <span style={statusTextStyle}>
            已加载 {models.length} 个模型
          </span>
        )}
      </div>
      
      {/* 错误提示区域 */}
      {error && (
        <div style={errorContainerStyle}>
          <span style={errorTextStyle}>{error}</span>
          <button 
            onClick={() => setError(null)}
            style={closeButtonStyle}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Three.js 渲染容器 */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#131323'
        }}
      >
        {!isReady && (
          <div style={loadingContainerStyle}>
            <div style={loadingTextStyle}>初始化 Three.js 环境中...</div>
            <div style={loadingSpinnerStyle}></div>
          </div>
        )}
        
        {isReady && models.length === 0 && (
          <div style={emptySceneStyle}>
            <div style={emptySceneTextStyle}>📦 请选择并加载一个模型</div>
            <div style={emptySceneSubtextStyle}>或点击「加载完整场景」查看多个模型</div>
          </div>
        )}
        
        {/* 操作提示浮动面板 */}
        <div style={floatingHelpStyle}>
          <h4 style={floatingHelpTitleStyle}>操作提示</h4>
          <ul style={floatingHelpListStyle}>
            <li>🖱️ 左键拖动：旋转视角</li>
            <li>🖱️ 右键拖动：平移视角</li>
            <li>🖱️ 滚轮：缩放视角</li>
            <li>↑↓←→：移动相机</li>
            <li>空格：重置视角</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 样式定义
const buttonStyle = {
  padding: '8px 16px',
  backgroundColor: '#00d4ff',
  color: 'black',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  opacity: 0.9,
  transition: 'opacity 0.3s',
  fontSize: '12px'
};

const secondaryButtonStyle = {
  padding: '8px 16px',
  backgroundColor: 'rgba(0, 212, 255, 0.3)',
  color: '#00d4ff',
  border: '1px solid #00d4ff',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background-color 0.3s',
  fontSize: '12px'
};

const dangerButtonStyle = {
  padding: '8px 16px',
  backgroundColor: 'rgba(255, 68, 68, 0.3)',
  color: '#ff4444',
  border: '1px solid #ff4444',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background-color 0.3s',
  fontSize: '12px'
};

const selectStyle = {
  padding: '6px 10px',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: '#00d4ff',
  border: '1px solid #00d4ff',
  borderRadius: '4px',
  fontSize: '12px'
};

const statusTextStyle = {
  color: '#00d4ff',
  fontSize: '12px',
  marginLeft: '10px',
};

const loadingContainerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
};

const loadingTextStyle = {
  color: '#00d4ff',
  fontSize: '18px',
  marginBottom: '20px'
};

const loadingSpinnerStyle = {
  width: '50px',
  height: '50px',
  border: '3px solid #00d4ff',
  borderTop: '3px solid transparent',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto'
};

const emptySceneStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
};

const emptySceneTextStyle = {
  color: '#00d4ff',
  fontSize: '24px',
  marginBottom: '10px'
};

const emptySceneSubtextStyle = {
  color: 'white',
  fontSize: '14px',
  opacity: 0.7
};

const errorContainerStyle = {
  padding: '8px 15px',
  backgroundColor: 'rgba(255, 68, 68, 0.2)',
  border: '1px solid #ff4444',
  borderLeft: '4px solid #ff4444',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
};

const errorTextStyle = {
  color: '#ff4444',
  fontSize: '12px'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#ff4444',
  fontSize: '18px',
  cursor: 'pointer',
  padding: '0',
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const floatingHelpStyle = {
  position: 'absolute',
  top: '20px',
  right: '20px',
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(5px)',
  border: '1px solid #00d4ff',
  borderRadius: '8px',
  padding: '15px',
  maxWidth: '200px',
  zIndex: 100
};

const floatingHelpTitleStyle = {
  color: '#00d4ff',
  fontSize: '14px',
  margin: '0 0 10px 0'
};

const floatingHelpListStyle = {
  color: 'white',
  fontSize: '12px',
  margin: 0,
  paddingLeft: '20px',
  lineHeight: '1.6'
};

// 添加动画样式
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);