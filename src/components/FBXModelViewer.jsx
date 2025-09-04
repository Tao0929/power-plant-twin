import React, { useRef, useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useFBX, Html, Environment } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
import { FBXLoader, SimplifyModifier } from 'three-stdlib'
// 性能优化的FBX模型加载组件
function FBXModel({ fbxPath, showAxes = true }) {
  const [model, setModel] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const ref = useRef();
  
  // 优化后的模型加载函数
  useEffect(() => {
    const loadModel = async () => {
      try {
        // 使用React Three Fiber的预加载机制，但不阻塞主线程
        const loader = new FBXLoader();
        
        // 设置加载进度回调
        loader.onProgress = (xhr) => {
          const progress = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadingProgress(progress);
        };
        
        // 使用requestIdleCallback来优化加载时机
        const handleLoad = () => {
          loader.load(
            fbxPath,
            (loadedModel) => {
              console.log(`${fbxPath} 模型已加载`);
              
                          // 基本的模型优化已在optimizeModel函数中处理，避免在加载时进行复杂计算
              // 避免在主线程中进行耗时的模型简化操作，防止页面卡死
              // 实际优化会在模型加载完成后通过requestAnimationFrame异步执行
              
              // 调整模型大小和位置以适合视图
              loadedModel.scale.set(0.05, 0.05, 0.05);
              
              // 计算边界框并居中模型
              const box = new THREE.Box3().setFromObject(loadedModel);
              const center = box.getCenter(new THREE.Vector3());
              loadedModel.position.sub(center);
              
              setModel(loadedModel);
              setModelLoaded(true);
            },
            undefined,
            (error) => {
              console.error('加载模型出错:', error);
            }
          );
        };
        
        if ('requestIdleCallback' in window) {
          requestIdleCallback(handleLoad, { timeout: 3000 });
        } else {
          setTimeout(handleLoad, 0);
        }
      } catch (error) {
        console.error('模型加载错误:', error);
      }
    };
    
    loadModel();
  }, [fbxPath]);
  
  // 简化模型的辅助函数 - 仅在必要时使用，避免不必要的克隆
  const optimizeModel = useCallback((model) => {
    try {
      // 不要立即克隆，直接优化原始模型的必要属性
      model.traverse((child) => {
        if (child.isMesh) {
          // 优化1：减少不必要的渲染计算
          if (child.material) {
            child.material.transparent = false;
            child.material.fog = false;
            child.material.needsUpdate = true;
          }
          
          // 优化2：合并顶点（如果支持）
          if (child.geometry && typeof child.geometry.mergeVertices === 'function') {
            try {
              child.geometry.mergeVertices();
            } catch (e) {
              console.warn('合并顶点失败:', e);
            }
          }
        }
      });
    } catch (e) {
      console.error('优化模型时发生错误:', e);
    }
  }, []);
  
  // 延迟优化，避免在主线程阻塞
  useEffect(() => {
    if (model && modelLoaded) {
      // 使用requestAnimationFrame进行延迟优化，避免阻塞主线程
      requestAnimationFrame(() => {
        optimizeModel(model);
      });
    }
  }, [model, modelLoaded, optimizeModel]);

  if (!model) return null;

  return (
    <>
      {/* 直接使用原始模型，避免不必要的LOD和克隆操作 */}
      {model && <primitive object={model} />}
      
      {/* 可切换的坐标轴帮助器 */}
      {/* {showAxes && <primitive object={new THREE.AxesHelper(10)} />} */}
      
      {/* 显示加载状态和进度信息 */}
      {modelLoaded && (
        <Html position={[0, 15, 0]}>{() => (
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#00d4ff',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            width: 240,
          }}>
            {fbxPath} 模型已加载成功
          </div>
        )}</Html>
      )}
      
      {/* 显示加载进度 */}
      {!modelLoaded && loadingProgress > 0 && (
        <Html center>{() => (
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#00d4ff',
            padding: '20px',
            borderRadius: '10px',
            fontSize: '16px',
            textAlign: 'center',
            width: 240,
          }}>
            <div>📦 加载中... {loadingProgress}%</div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              marginTop: '10px',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${loadingProgress}%`,
                height: '100%',
                backgroundColor: '#00d4ff',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}</Html>
      )}
    </>
  )
}

// 加载指示器组件
function Loader({ modelPath }) {
  return (
    <Html center>
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#00d4ff',
        padding: '20px',
        borderRadius: '10px',
        fontSize: '16px',
        textAlign: 'center',
        width: 240,
      }}>
        <div>📦 加载中...</div>
        <div style={{ fontSize: '14px', marginTop: '10px' }}>
          正在加载 {modelPath} 模型
        </div>
      </div>
    </Html>
  )
}

// 优化的主3D场景组件 - 接受性能模式参数
function Scene({ fbxPath, performanceModeProp = '默认' }) {
  // 添加性能监控状态
  const [performanceStats, setPerformanceStats] = useState({ fps: 0, memory: 0 });
  const statsRef = useRef(null);
  const lastTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  
  // 添加控制器，可以调整光照和视角以及性能相关设置
  const { 
    ambientIntensity, 
    directionalIntensity, 
    showAxes, 
    enableShadows, 
    enableAntialiasing,
    performanceMode
  } = useControls({
    ambientIntensity: { value: 0.6, min: 0, max: 2, step: 0.1 },
    directionalIntensity: { value: 0.8, min: 0, max: 3, step: 0.1 }, // 降低默认光照强度
    showAxes: false, // 默认关闭坐标轴
    enableShadows: false, // 默认关闭阴影以提高性能
    enableAntialiasing: true,
    performanceMode: {
      options: ['默认', '性能优先', '质量优先'],
      value: '默认'
    }
  });
  
  // 性能监控
  useEffect(() => {
    const updatePerformanceStats = (time) => {
      frameCountRef.current++;
      if (time - lastTimeRef.current >= 1000) {
        const fps = frameCountRef.current;
        
        // 获取内存使用情况
        let memory = 0;
        if (performance && performance.memory) {
          memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        
        setPerformanceStats({ fps, memory });
        frameCountRef.current = 0;
        lastTimeRef.current = time;
      }
      
      statsRef.current = requestAnimationFrame(updatePerformanceStats);
    };
    
    statsRef.current = requestAnimationFrame(updatePerformanceStats);
    
    return () => {
      if (statsRef.current) {
        cancelAnimationFrame(statsRef.current);
      }
    };
  }, []);
  
  // 根据从props传入的性能模式调整设置 - 优化版
  const effectiveSettings = useMemo(() => {
    switch (performanceModeProp) {
      case '性能优先':
        return {
          enableShadows: false,
          enableAntialiasing: false,
          ambientIntensity: 0.4,
          directionalIntensity: 0.6,
          renderMode: 'basic' // 基础渲染模式
        };
      case '质量优先':
        return {
          enableShadows: true,
          enableAntialiasing: true,
          ambientIntensity: 0.8,
          directionalIntensity: 1.2,
          renderMode: 'advanced' // 高级渲染模式
        };
      default:
        return {
          enableShadows,
          enableAntialiasing,
          ambientIntensity,
          directionalIntensity,
          renderMode: 'balanced' // 平衡渲染模式
        };
    }
  }, [performanceModeProp, enableShadows, enableAntialiasing, ambientIntensity, directionalIntensity]);
  
  return (
    <>
      {/* 设置背景色 */}
      <color attach="background" args={['#131323']} />
      
      {/* 环境光 - 优化光照以减少计算量 */}
      <ambientLight intensity={effectiveSettings.ambientIntensity} />
      
      {/* 方向光 - 选择性启用阴影 */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={effectiveSettings.directionalIntensity} 
        castShadow={effectiveSettings.enableShadows}
        shadow-mapSize-width={effectiveSettings.enableShadows ? 1024 : 512}
        shadow-mapSize-height={effectiveSettings.enableShadows ? 1024 : 512}
      />
      
      {/* 点光源 - 减少点光源数量以提高性能 */}
      {effectiveSettings.enableShadows && (
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#00d4ff" />
      )}
      
      {/* 加载模型 */}
      <Suspense fallback={<Loader modelPath={fbxPath} />}>
        <FBXModel fbxPath={fbxPath} showAxes={showAxes} />
        
        {/* 环境贴图 - 仅在高质量模式下启用 */}
        {performanceMode === '质量优先' && (
          <Environment preset="sunset" />
        )}
      </Suspense>
      
      {/* 优化的轨道控制器 */}
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        minDistance={5}  // 最小缩放距离
        maxDistance={150}  // 增大最大缩放距离
        autoRotate={false}  // 自动旋转
        autoRotateSpeed={0.5}  // 自动旋转速度
        enableDamping={true}  // 启用阻尼效果使旋转更平滑
        dampingFactor={0.05}  // 阻尼系数
        rotateSpeed={0.5}  // 降低旋转速度
        zoomSpeed={0.8}  // 降低缩放速度
        panSpeed={0.5}  // 降低平移速度
      />
      
      {/* 性能统计信息 */}
      <Html position={[0, -15, 0]}>{() => (
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#00d4ff',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          width: 180,
        }}>
          <div>🎮 FPS: {performanceStats.fps}</div>
          <div>🧠 内存: {performanceStats.memory}MB</div>
          <div>⚡ 模式: {performanceModeProp}</div>
        </div>
      )}</Html>
    </>
  )
}

// 主要的FBX模型展示组件 - 最终优化版本
export default function FBXModelViewer({ fbxPath = '/assets/nagoya1/nagoya1.fbx' }) {
  // 性能模式状态管理
  const [performanceMode, setPerformanceMode] = useState('默认');
  
  // 组件挂载时预加载模型但不阻塞主线程
  useEffect(() => {
    const preloadModel = async () => {
      try {
        // 使用Web Worker进行模型预加载（如果浏览器支持）
        if (window.Worker && typeof useFBX.preload === 'function') {
          // 创建一个简单的Web Worker来处理预加载
          const workerCode = `
            self.addEventListener('message', function(e) {
              const { fbxPath } = e.data;
              // 这里仅发送预加载信号，实际预加载在主线程中以受控方式进行
              self.postMessage({ status: 'preloading', path: fbxPath });
            });
          `;
          
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          const worker = new Worker(URL.createObjectURL(blob));
          
          worker.onmessage = function(e) {
            if (e.data.status === 'preloading') {
              console.log(`开始预加载模型: ${e.data.path}`);
            }
          };
          
          // 发送预加载任务到Web Worker
          worker.postMessage({ fbxPath });
          
          // 组件卸载时清理Web Worker
          return () => {
            worker.terminate();
            URL.revokeObjectURL(blob);
          };
        }
      } catch (error) {
        console.warn('Web Worker预加载失败，使用传统方式:', error);
      }
    };
    
    preloadModel();
  }, [fbxPath]);
  
  // 根据性能模式获取优化的WebGL设置
  const getGlOptions = useMemo(() => {
    switch (performanceMode) {
      case '性能优先':
        return {
          powerPreference: 'high-performance',
          antialias: false, // 禁用抗锯齿以提高性能
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
          alpha: false
        };
      case '质量优先':
        return {
          powerPreference: 'high-performance',
          antialias: true, // 启用抗锯齿以提高质量
          stencil: true,
          depth: true,
          preserveDrawingBuffer: false,
          alpha: true
        };
      default:
        return {
          powerPreference: 'high-performance',
          antialias: true, // 默认启用基础抗锯齿
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
          alpha: false
        };
    }
  }, [performanceMode]);
  
  // 键盘快捷键处理
  const handleKeyDown = useCallback((e) => {
    if (e.key.toLowerCase() === 'l') {
      // 循环切换性能模式
      const modes = ['默认', '性能优先', '质量优先'];
      const currentIndex = modes.indexOf(performanceMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      setPerformanceMode(modes[nextIndex]);
      console.log(`切换性能模式至: ${modes[nextIndex]}`);
    }
  }, [performanceMode]);
  
  // 监听全局键盘事件
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
    }}>
      {/* 优化的Canvas配置 - 根据性能模式动态调整 */}
        <Canvas 
          shadows={performanceMode === '质量优先'} // 根据性能模式动态控制阴影
          camera={{
            position: [20, 20, 20], // 相机初始位置
            fov: 60, // 视野角度
            near: 0.1, // 近平面
            far: 10000 // 远平面
          }}
          gl={getGlOptions}
          onCreated={({ gl }) => {
            // 额外的WebGL优化
            gl.setPixelRatio(Math.min(window.devicePixelRatio, performanceMode === '性能优先' ? 1 : 1.5)); // 根据性能模式限制像素比
            gl.clearColor(0.07, 0.07, 0.14, 1);
            
            // 性能模式下的额外优化
            if (performanceMode === '性能优先') {
              gl.setParameter(gl.MAX_TEXTURE_SIZE, 1024); // 限制最大纹理大小
              if (gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) > 4) {
                // 注意：WebGL中不能直接设置MAX_TEXTURE_IMAGE_UNITS，这只是一个示例
                console.log('性能模式：优化纹理单元使用');
              }
            }
          }}
          performance // 启用性能监控
        >
          <Scene fbxPath={fbxPath} performanceModeProp={performanceMode} />
        </Canvas>
      
      {/* 优化的操作提示面板 - 显示当前性能模式 */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '15px',
          borderRadius: '10px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          backdropFilter: 'blur(5px)',
          maxWidth: '250px',
          zIndex: 10
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#00d4ff' }}>FBX 模型查看器</h3>
          <p style={{ margin: '5px 0', fontSize: '12px' }}>🖱️ 左键拖动：旋转视角</p>
          <p style={{ margin: '5px 0', fontSize: '12px' }}>🖱️ 右键拖动：平移视角</p>
          <p style={{ margin: '5px 0', fontSize: '12px' }}>🖱️ 滚轮：缩放视角</p>
          <div style={{ 
            marginTop: '10px', 
            fontSize: '11px', 
            color: performanceMode === '性能优先' ? '#ffcc00' : performanceMode === '质量优先' ? '#00ff88' : '#00d4ff',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '8px'
          }}>
            当前模式：{performanceMode}
            <br />
            <span style={{ color: '#aaa' }}>提示：按L键可切换性能模式</span>
          </div>
        </div>
      
      {/* 键盘快捷键处理已移至组件根级别 */}
    </div>
  )
}
useFBX.preload('/assets/nagoya1/nagoya1.fbx')