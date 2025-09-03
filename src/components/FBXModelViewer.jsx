import React, { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useFBX, Html, Environment } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
// 加载FBX模型的组件
function FBXModel({ fbxPath, showAxes = true }) {
  const model = useFBX(fbxPath)
  const ref = useRef()
  const [modelLoaded, setModelLoaded] = useState(false)

  // 确保模型被正确缩放和定位
  useEffect(() => {
    if (model) {
      console.log(`${fbxPath} 模型已加载`)
      
      // 调整模型大小和位置以适合视图
      model.scale.set(0.1, 0.1, 0.1) // 调整模型比例
      
      // 计算边界框并居中模型
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center)
      
      setModelLoaded(true)
    }
  }, [model, fbxPath])

  return (
    <>
      <primitive 
        ref={ref} 
        object={model} 
        dispose={null} // 保留资源，避免不必要的重加载
      />
      {/* 可切换的坐标轴帮助器 */}
      {/* {showAxes && <primitive object={new THREE.AxesHelper(10)} />} */}
      
      {/* 显示加载状态信息 */}
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

// 主3D场景组件
function Scene({ fbxPath }) {
  // 添加控制器，可以调整光照和视角
  const { ambientIntensity, directionalIntensity, showAxes } = useControls({
    ambientIntensity: { value: 0.6, min: 0, max: 2, step: 0.1 },
    directionalIntensity: { value: 1, min: 0, max: 3, step: 0.1 },
    showAxes: true
  })
  
  return (
    <>
      {/* 设置背景色 */}
      <color attach="background" args={['#131323']} />
      
      {/* 环境光 */}
      <ambientLight intensity={ambientIntensity} />
      
      {/* 方向光 */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={directionalIntensity} 
        castShadow
      />
      
      {/* 点光源 */}
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#00d4ff" />
      
      {/* 加载模型 */}
      <Suspense fallback={<Loader modelPath={fbxPath} />}>
        <FBXModel fbxPath={fbxPath} showAxes={showAxes} />
        
        {/* 可选：添加环境贴图 */}
        <Environment preset="sunset" />
      </Suspense>
      
      {/* 轨道控制器 - 提供旋转、缩放、平移功能 */}
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        minDistance={5}  // 最小缩放距离
        maxDistance={100}  // 最大缩放距离
        autoRotate={false}  // 自动旋转
        autoRotateSpeed={0.5}  // 自动旋转速度
      />
    </>
  )
}

// 主要的FBX模型展示组件
export default function FBXModelViewer({ fbxPath = '/assets/Air_Jordan_Fusion_Sne_0324095217_texture.fbx' }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
    }}>
      <Canvas 
        shadows 
        camera={{
          position: [20, 20, 20], // 相机初始位置
          fov: 60, // 视野角度
          near: 0.1, // 近平面
          far: 1000 // 远平面
        }}
      >
        <Scene fbxPath={fbxPath} />
      </Canvas>
      
      {/* 操作提示面板 */}
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
        backdropFilter: 'blur(5px)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#00d4ff' }}>FBX 模型查看器</h3>
        <p style={{ margin: '5px 0', fontSize: '12px' }}>🖱️ 左键拖动：旋转视角</p>
        <p style={{ margin: '5px 0', fontSize: '12px' }}>🖱️ 右键拖动：平移视角</p>
        <p style={{ margin: '5px 0', fontSize: '12px' }}>🖱️ 滚轮：缩放视角</p>
      </div>
    </div>
  )
}

// 为useFBX添加加载器配置
// 预加载默认模型
useFBX.preload('/assets/Air_Jordan_Fusion_Sne_0324095217_texture.fbx')