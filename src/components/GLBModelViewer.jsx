import React, { useRef, useState, useEffect, Suspense  } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Html, Environment } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
// 加载GLB/GLTF模型的组件
function GLBModel({ modelPath, showAxes = true }) {
  const { scene, nodes, materials } = useGLTF(modelPath)
  const ref = useRef()
  const [modelLoaded, setModelLoaded] = useState(false)

  // 确保模型被正确缩放和定位
  useEffect(() => {
    if (scene) {
      console.log(`${modelPath} 模型已加载`, {
        nodes: Object.keys(nodes || {}),
        materials: Object.keys(materials || {}),
        hasGeometry: scene.children.length > 0
      })
      
      // 计算边界框并居中模型
      const box = new THREE.Box3().setFromObject(scene)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      
      // 计算缩放因子，确保模型大小合适
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = 60
      const cameraZ = Math.abs(maxDim / 2 / Math.tan(Math.PI * fov / 360))
      
      // 设置适当的缩放
      const scale = 20 / maxDim
      scene.scale.set(scale, scale, scale)
      
      // 居中模型
      scene.position.x = scene.position.x - center.x * scale
      scene.position.y = scene.position.y - center.y * scale
      scene.position.z = scene.position.z - center.z * scale
      
      setModelLoaded(true)
    }
  }, [scene, nodes, materials, modelPath])

  return (
    <>
      <primitive 
        ref={ref} 
        object={scene} 
        dispose={null} // 保留资源，避免不必要的重加载
      />
      {/* 可切换的坐标轴帮助器 */}
      {/* {showAxes && <primitive object={new THREE.AxesHelper(10)} />} */}
      
      {/* 显示加载状态信息 */}
      {modelLoaded && (
        <Html position={[0, 15, 0]}>{() => (
          <div style={{
            background: '#131323',
            color: '#00d4ff',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            width: 240,
          }}>
            {modelPath} 模型已加载成功
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
function Scene({ modelPath }) {
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
      <Suspense fallback={<Loader modelPath={modelPath} />}>
        <GLBModel modelPath={modelPath} showAxes={showAxes} />
        
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

// 主要的GLB/GLTF模型展示组件
export default function GLBModelViewer({ modelPath = '/assets/Car_Charger_Speaker_C_0319091353_texture.glb' }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: '#131323'
    }}>
      <Canvas 
        shadows 
        camera={{
          position: [20, 20, 20], // 相机初始位置
          fov: 60, // 视野角度
          near: 0.1, // 近平面
          far: 10000 // 远平面
        }}
      >
        <Scene modelPath={modelPath} />
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
        <h3 style={{ margin: '0 0 10px 0', color: '#00d4ff' }}>GLB/GLTF 模型查看器</h3>
        <p style={{ margin: '5px 0', fontSize: '12px' }}>🖱️ 左键拖动：旋转视角</p>
        <p style={{ margin: '5px 0', fontSize: '12px' }}>🖱️ 右键拖动：平移视角</p>
        <p style={{ margin: '5px 0', fontSize: '12px' }}>🖱️ 滚轮：缩放视角</p>
      </div>
    </div>
  )
}

// 为useGLTF添加加载器配置
// 预加载默认模型
useGLTF.preload('/assets/Car_Charger_Speaker_C_0319091353_texture.glb')

// // 导入THREE命名空间，用于在useEffect中使用
// const THREE = window.THREE || {};
// if (!window.THREE) {
//   window.THREE = THREE;
// }