/**
 * Three.js 3D渲染学习示例
 * 包含：场景、相机、光源、模型加载和交互控制
 * 学习重点：
 * 1. 如何创建基本的3D场景
 * 2. 如何设置相机和视角
 * 3. 如何添加光源以增强视觉效果
 * 4. 如何加载和显示3D模型
 * 5. 如何实现交互控制
 */
import React, { useRef, useState, useEffect } from 'react';
import { useThreeReact } from '../hook/useThreeReact';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const Example = () => {
  // 容器引用，用于挂载Three.js渲染器
  const containerRef = useRef(null);
  // 模型状态管理
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  
  // 网格和坐标轴辅助器的引用
  const gridHelperRef = useRef();
  const axesHelperRef = useRef();
  const modelRef = useRef();

  // 使用项目中封装的Three.js hook
  // 这个hook已经封装了场景、相机、渲染器、控制器等基本组件的初始化和管理
  const { 
    scene, 
    camera, 
    controls, 
    isReady, 
    loading 
  } = useThreeReact(containerRef);

  // 初始化3D场景的基本元素
  useEffect(() => {
    if (!isReady || !scene || !camera || !controls) return;

    // 设置相机位置和朝向
    camera.position.set(10, 10, 10); // 设置相机位置
    camera.lookAt(0, 0, 0); // 相机看向原点
    
    // 设置控制器参数
    controls.enableDamping = true; // 启用阻尼效果，使旋转更平滑
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate; // 自动旋转
    controls.autoRotateSpeed = 0.5;
    controls.target.set(0, 0, 0); // 控制器目标点
    controls.update();
  }, [isReady, scene, camera, controls, autoRotate]);

  // 添加/移除网格地面和坐标轴辅助器
  useEffect(() => {
    if (!isReady || !scene) return;

    // 网格地面：帮助用户理解3D空间的深度和位置
    if (showGrid && !gridHelperRef.current) {
      gridHelperRef.current = new THREE.GridHelper(20, 20, '#00d4ff', '#333333');
      gridHelperRef.current.position.set(0, -0.01, 0); // 略微低于地面
      scene.add(gridHelperRef.current);
    } else if (!showGrid && gridHelperRef.current) {
      scene.remove(gridHelperRef.current);
      gridHelperRef.current = null;
    }

    // 坐标轴辅助器：X轴(红色)、Y轴(绿色)、Z轴(蓝色)
    if (showAxes && !axesHelperRef.current) {
      axesHelperRef.current = new THREE.AxesHelper(5);
      scene.add(axesHelperRef.current);
    } else if (!showAxes && axesHelperRef.current) {
      scene.remove(axesHelperRef.current);
      axesHelperRef.current = null;
    }
  }, [isReady, scene, showGrid, showAxes]);

  // 加载FBX模型
  const loadFBXModel = async () => {
    if (!isReady || !scene) return;

    try {
      setError(null);
      
      // 创建FBX加载器
      const loader = new FBXLoader();
      
      // 加载模型文件
      // 注意：这里使用的文件路径需要根据实际项目结构调整
      const model = await loader.loadAsync('/assets/Car_Charger_Speaker_C_0319091440_texture.fbx');
      
      // 设置模型属性
      model.scale.set(0.01, 0.01, 0.01); // 缩放模型大小
      model.position.set(0, 0, 0); // 设置模型位置
      model.rotation.set(0, Math.PI / 2, 0); // 设置模型旋转
      
      // 为模型添加材质，确保它能被正确渲染
      model.traverse((child) => {
        if (child.isMesh) {
          // 如果模型已有材质，保留它；否则添加基础材质
          if (!child.material) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x777777,
              metalness: 0.5,
              roughness: 0.5
            });
          }
          child.castShadow = true; // 允许模型投射阴影
          child.receiveShadow = true; // 允许模型接收阴影
        }
      });
      
      // 保存模型引用并添加到场景
      modelRef.current = model;
      scene.add(model);
      
      setModelLoaded(true);
      console.log('FBX模型加载成功');
    } catch (err) {
      console.error('加载FBX模型失败:', err);
      setError('加载FBX模型失败，请检查文件路径是否正确');
    }
  };

  // 当组件准备就绪时，加载模型
  useEffect(() => {
    if (isReady && !modelLoaded) {
      loadFBXModel();
    }
  }, [isReady, modelLoaded]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (modelRef.current && scene) {
        scene.remove(modelRef.current);
        modelRef.current = null;
      }
    };
  }, [scene]);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 控制面板 - 用于学习和交互 */}
      <div style={{
        padding: '10px',
        backgroundColor: '#222',
        color: '#fff',
        display: 'flex',
        gap: '20px',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0 }}>Three.js 3D渲染学习示例</h2>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          显示网格
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="checkbox"
            checked={showAxes}
            onChange={(e) => setShowAxes(e.target.checked)}
          />
          显示坐标轴
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={(e) => setAutoRotate(e.target.checked)}
          />
          自动旋转
        </label>
        
        <button 
          onClick={loadFBXModel} 
          disabled={loading || modelLoaded}
          style={{
            padding: '5px 10px',
            backgroundColor: '#00d4ff',
            border: 'none',
            borderRadius: '3px',
            cursor: loading || modelLoaded ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '加载中...' : (modelLoaded ? '模型已加载' : '加载模型')}
        </button>
      </div>
      
      {/* Three.js 渲染容器 */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          backgroundColor: '#131323',
          position: 'relative'
        }}
      />
      
      {/* 操作提示 */}
      {isReady && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          <div><strong>操作指南：</strong></div>
          <div>• 左键拖动：旋转视角</div>
          <div>• 右键拖动：平移视图</div>
          <div>• 滚轮：缩放视图</div>
          <div>• 空格键+拖动：移动中心点</div>
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 1001
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default Example;
