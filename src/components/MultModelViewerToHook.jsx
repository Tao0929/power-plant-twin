/** 渲染多种模型到 一个 3D 场景，使用 useThreeReact hook 实现，支持 OBJ+MTL 格式 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useThreeReact } from '../hook/useThreeReact';

/**
 * 多模型查看器组件 - 使用 useThreeReact hook 优化版
 * 支持配置化加载多个 3D 模型到同一场景
 */
const MultModelViewer = React.memo(({ 
  models = [], 
  width = '100%', 
  height = '100%', 
  backgroundColor = '#131323',
  onModelsLoaded,
  orbitControls = true,
  cameraPosition = [20, 20, 20],
  cameraTarget = [0, 0, 0]
}) => {
  const containerRef = useRef(null);
  const [loadingModels, setLoadingModels] = useState(new Set());
  const [loadedModels, setLoadedModels] = useState([]);
  const [error, setError] = useState(null);

  // 使用我们的 useThreeReact hook
  const {
    scene,
    camera,
    controls,
    isReady,
    loading,
    loadOBJModel,
    removeModel,
    setBackgroundColor: setSceneBackgroundColor,
    fitModelsToView
  } = useThreeReact(containerRef);

  // 设置背景色
  useEffect(() => {
    if (isReady) {
      setSceneBackgroundColor(backgroundColor);
    }
  }, [isReady, backgroundColor, setSceneBackgroundColor]);

  // 设置相机位置和目标
  useEffect(() => {
    if (isReady && camera) {
      camera.position.set(...cameraPosition);
      camera.lookAt(...cameraTarget);
    }
  }, [isReady, camera, cameraPosition, cameraTarget]);

  // 设置控制器参数
  useEffect(() => {
    if (isReady && controls && orbitControls) {
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = false;
      controls.target.set(...cameraTarget);
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.enableRotate = true;
      controls.minDistance = 1;
      controls.maxDistance = 50;
      controls.update();
    } else if (isReady && controls && !orbitControls) {
      controls.enabled = false;
    }
  }, [isReady, controls, orbitControls, cameraTarget]);

  // 加载所有模型
  useEffect(() => {
    if (!isReady || models.length === 0) return;

    const loadAllModels = async () => {
      try {
        setError(null);
        const loaded = [];
        
        for (const model of models) {
          // 目前只支持 obj_mtl 类型，其他类型会发出警告
          if (model.type === 'obj_mtl') {
            setLoadingModels(prev => new Set(prev).add(model.path));
            
            try {
              const loadedModel = await loadOBJModel(
                model.path,
                model.mtlPath,
                {
                  position: model.position || [0, 0, 0],
                  scale: model.scale || [1, 1, 1],
                  rotation: model.rotation || [0, 0, 0],
                  name: model.name || ''
                }
              );
              loaded.push(loadedModel);
            } catch (err) {
              console.error(`加载模型失败: ${model.path}`, err);
              setError(`部分模型加载失败: ${model.path}`);
            } finally {
              setLoadingModels(prev => {
                const newSet = new Set(prev);
                newSet.delete(model.path);
                return newSet;
              });
            }
          } else {
            console.warn(`当前版本暂不支持 ${model.type} 格式的模型`);
          }
        }
        
        setLoadedModels(loaded);
        
        // 所有模型加载完成后调用回调
        if (onModelsLoaded) {
          onModelsLoaded(loaded);
        }
        
        // 模型加载完成后自动调整视角，使所有模型占满可视区域
        console.log('模型加载完成，准备调整视角');
        console.log('已加载的模型数量:', loaded.length);
        
        // 使用较长的延迟，确保模型完全加载和渲染
        setTimeout(() => {
          console.log('调用fitModelsToView调整视角');
          fitModelsToView(loaded);
        }, 500);
      } catch (err) {
        console.error('加载模型时发生错误:', err);
        setError('加载模型时发生错误');
      }
    };

    loadAllModels();

    // 清理函数
    return () => {
      // 清理已加载的模型
      loadedModels.forEach(loadedModel => {
        removeModel(loadedModel.id);
      });
    };
  }, [isReady, models, loadOBJModel, removeModel, onModelsLoaded]);

  // 计算模型中心点
  const calculateCenterPoint = useCallback((models) => {
    if (!models || models.length === 0) return { x: 0, y: 0, z: 0 };

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    models.forEach((model) => {
      if (model.position) {
        const [x, y, z] = model.position;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        maxZ = Math.max(maxZ, z);
      }
    });

    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    };
  }, []);

  return (
    <div 
      style={{
        width,
        height,
        backgroundColor,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Three.js 渲染容器 */}
      <div 
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
      
      {/* 加载状态显示 */}
      {loading || loadingModels.size > 0 && (
        <div style={loadingContainerStyle}>
          <div style={loadingTextStyle}>
            {loading ? '初始化 Three.js 环境中...' : `加载模型中 (${models.length - loadingModels.size}/${models.length})`}
          </div>
          <div style={loadingSpinnerStyle}></div>
        </div>
      )}
      
      {/* 错误提示 */}
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
      
      {/* 操作提示和重置视角按钮 */}
      {isReady && !loading && (
        <>
          <div style={infoPanelStyle}>
            <ul style={infoListStyle}>
              <li>🖱️ 左键拖动：旋转视角</li>
              <li>🖱️ 右键拖动：平移视角</li>
              <li>🖱️ 滚轮：缩放视角</li>
            </ul>
          </div>
          
          {/* 重置视角按钮 */}
          <button
            style={resetViewButtonStyle}
            onClick={() => {
              console.log('手动触发重置视角');
              fitModelsToView(loadedModels);
            }}
          >
            重置视角
          </button>
        </>
      )}
    </div>
  );
});

// 样式定义
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
  zIndex: 1000
};

const loadingTextStyle = {
  color: '#00d4ff',
  fontSize: '16px',
  marginBottom: '20px',
  textAlign: 'center'
};

const loadingSpinnerStyle = {
  width: '40px',
  height: '40px',
  border: '3px solid #00d4ff',
  borderTop: '3px solid transparent',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const errorContainerStyle = {
  position: 'absolute',
  top: '20px',
  left: '20px',
  padding: '10px 15px',
  backgroundColor: 'rgba(255, 68, 68, 0.2)',
  border: '1px solid #ff4444',
  borderLeft: '4px solid #ff4444',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  maxWidth: '400px',
  zIndex: 1001
};

const errorTextStyle = {
  color: '#ff4444',
  fontSize: '12px',
  marginRight: '10px'
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

const infoPanelStyle = {
  position: 'absolute',
  bottom: '20px',
  right: '20px',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  border: '1px solid #00d4ff',
  borderRadius: '8px',
  padding: '10px 15px',
  zIndex: 1000
};

const infoListStyle = {
  color: 'white',
  fontSize: '12px',
  margin: 0,
  paddingLeft: '20px',
  lineHeight: '1.6'
};

const resetViewButtonStyle = {
  position: 'absolute',
  top: '20px',
  right: '20px',
  padding: '8px 16px',
  backgroundColor: 'rgba(0, 212, 255, 0.2)',
  border: '1px solid #00d4ff',
  borderRadius: '4px',
  color: '#00d4ff',
  fontSize: '12px',
  cursor: 'pointer',
  zIndex: 1000,
  '&:hover': {
    backgroundColor: 'rgba(0, 212, 255, 0.3)'
  }
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

export default MultModelViewer;