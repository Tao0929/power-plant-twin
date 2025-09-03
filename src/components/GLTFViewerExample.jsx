import React, { useEffect, useRef, useState } from 'react';
import { useThreeReact } from '../hook/useThreeReact';
import * as THREE from 'three';

const GLTFViewerExample = () => {
  const containerRef = useRef(null);
  const [models, setModels] = useState({});
  
  // 使用我们的自定义hook
  const { 
    isReady, 
    loading, 
    loadGltf, 
    scene, 
    camera, 
    controls, 
    addRenderMixin, 
    removeRenderMixin,
    TWEEN
  } = useThreeReact(containerRef);

  // 示例：添加一个简单的渲染混入，用于动画效果
  useEffect(() => {
    if (!isReady) return;

    // 创建一个简单的旋转动画
    const rotationAnimation = () => {
      if (controls) {
        // 可以在这里添加任何自定义的渲染逻辑
        // 例如更新UI、处理交互等
      }
    };

    // 添加到渲染循环中
    addRenderMixin('rotationAnimation', rotationAnimation);

    // 清理函数
    return () => {
      removeRenderMixin('rotationAnimation');
    };
  }, [isReady, controls, addRenderMixin, removeRenderMixin]);

  // 添加道路箭头动画
  const addRoadArrowAnimation = () => {
    if (!models.building) return;
    
    const textures = [];
    
    models.building.traverse((mesh) => {
      if (mesh.name && mesh.name.includes('道路箭头') && mesh.material && mesh.material.map) {
        textures.push(mesh.material.map);
      }
    });
    
    const animation = () => {
      textures.forEach((texture) => {
        texture.offset.y = (texture.offset.y + 0.02) % 10000;
      });
    };
    
    addRenderMixin('road-arrow', animation);
    console.log('已添加道路箭头动画', models.building);
  };

  // 加载GLTF模型
  const handleLoadModel = async () => {
    try {
      // 注意：这里使用的是占位符路径，实际使用时需要替换为您项目中真实的模型路径
      const modelPath = '/assets/base.glb'; // 这个路径在App.jsx中提到过
      
      console.log('开始加载模型:', modelPath);
      const gltf = await loadGltf(modelPath);
      
      if (gltf) {
        console.log('模型加载成功:', gltf);
        
        // 保存模型引用
        setModels({ building: gltf.scene });
        
        // 调整模型位置和缩放
        if (gltf.scene) {
          // 可以根据需要调整模型的位置、旋转和缩放
          gltf.scene.position.set(0, 0, 0);
          gltf.scene.scale.set(1, 1, 1);
        }
      }
    } catch (error) {
      console.error('加载模型失败:', error);
      alert('加载模型失败，请检查模型路径是否正确');
    }
  };

  // 使用TWEEN创建一个简单的相机动画
  const handleCameraAnimation = () => {
    if (!camera || !TWEEN) return;

    new TWEEN.Tween(camera.position)
      .to({ x: 10, y: 10, z: 10 }, 2000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();

    new TWEEN.Tween(camera.lookAt)
      .to({ x: 0, y: 0, z: 0 }, 2000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();
  };

  useEffect(() => {
    if (!loading && !isReady) {
      handleLoadModel()
    }
  }, [isReady, loading])

  useEffect(() => {
    if (models?.building) {
      addRoadArrowAnimation()
      setTimeout(() => {
        handleCameraAnimation()
      }, 1500)
    }
  }, [models.building])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 3D渲染容器 */}
      <div 
        ref={containerRef} 
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#000'
        }}
      >
        {!isReady && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '18px'
          }}>
            初始化Three.js环境...
          </div>
        )}
      </div>
    </div>
  );
};

export default GLTFViewerExample;