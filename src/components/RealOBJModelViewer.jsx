import React, { useRef, Suspense, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Html, useGLTF } from '@react-three/drei'
import { OBJLoader } from 'three-stdlib'
import { MTLLoader } from 'three-stdlib'
import * as THREE from 'three'
import { useControls } from 'leva'

// 模型配置数组 - 调整位置和比例，确保都在网格上
const models = [
    // 原有模型 - 保持不变
    {
      id: 'substation',
      path: '/assets/substation_ht_1005_01.obj',
      mtlPath: '/assets/substation_ht_1005_01.mtl',
      position: [10, 0, -50],
      scale: [0.05, 0.05, 0.05],
      name: '厂区围墙'
    },
    {
      id: 'train',
      path: '/assets/train_1005_01.obj',
      mtlPath: '/assets/train_1005_01.mtl',
      position: [8, -0.5, -29],
      scale: [0.03, 0.03, 0.03],
      name: '运输车辆'
    },
    {
      id: 'electricTower',
      path: '/assets/electric_tower_1005_01.obj',
      mtlPath: '/assets/electric_tower_1005_01.mtl',
      position: [25, 0, -85],
      scale: [0.1, 0.1, 0.1],
      name: '变电站主体'
    },
    {
      id: 'transformer1',
      path: '/assets/transformer_1005_01_01.obj',
      mtlPath: '/assets/transformer_1005_01_01.mtl',
      position: [39.2, 0, 66.9], // 调整位置以适应旋转后的视觉效果
      scale: [0.5, 0.5, 0.5],
      rotation: [0, -Math.PI/2, 0], // 水平方向顺时针旋转90度
      name: '稳压器1'
    },
    {
      id: 'transformer',
      path: '/assets/transformer_1005_01_01.obj',
      mtlPath: '/assets/transformer_1005_01_01.mtl',
      position: [33.5, 0, 66.9], // 调整位置以适应旋转后的视觉效果
      scale: [0.5, 0.5, 0.5],
      rotation: [0, -Math.PI/2, 0], // 水平方向顺时针旋转90度
      name: '稳压器2'
    },
    // 新增模型 - substation_ht_1005系列补充
    {
      id: 'substation02',
      path: '/assets/substation_ht_1005_02.obj',
      mtlPath: '/assets/substation_ht_1005_02.mtl',
      position: [10, 0, -50],
      scale: [0.05, 0.05, 0.05],
      name: '控电楼1'
    },
    {
      id: 'substation03',
      path: '/assets/substation_ht_1005_03.obj',
      mtlPath: '/assets/substation_ht_1005_03.mtl',
      position: [10, 0, -50],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑3'
    },
    {
      id: 'substation04',
      path: '/assets/substation_ht_1005_04.obj',
      mtlPath: '/assets/substation_ht_1005_04.mtl',
      position: [10.1, 0, -50],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑4'
    },
    // {
    //   id: 'substation05plus1',
    //   path: '/assets/substation_ht_1005_05-.obj',
    //   mtlPath: '/assets/substation_ht_1005_05-.mtl',
    //   position: [1, 0, -55],
    //   scale: [0.05, 0.05, 0.05],
    //   name: '变电站扩展建筑5-'
    // },
    {
      id: 'substation05',
      path: '/assets/substation_ht_1005_05.obj',
      mtlPath: '/assets/substation_ht_1005_05.mtl',
      position: [-16.5, 0, 37.5],
      scale: [0.05, 0.05, 0.05],
      rotation: [0, Math.PI, 0], // 水平方向顺时针旋转90度
      name: '变电站建筑5'
    },
    {
      id: 'substation05-1',
      path: '/assets/substation_ht_1005_05.obj',
      mtlPath: '/assets/substation_ht_1005_05.mtl',
      position: [-9.5, 0, 37.5],
      scale: [0.05, 0.05, 0.05],
      rotation: [0, Math.PI, 0], // 水平方向顺时针旋转90度
      name: '变电站建筑5'
    },
    {
      id: 'substation05-2',
      path: '/assets/substation_ht_1005_05.obj',
      mtlPath: '/assets/substation_ht_1005_05.mtl',
      position: [-16.5, 0, 45.5],
      scale: [0.05, 0.05, 0.05],
      rotation: [0, Math.PI, 0], // 水平方向顺时针旋转90度
      name: '变电站建筑5'
    },
    {
      id: 'substation05-3',
      path: '/assets/substation_ht_1005_05.obj',
      mtlPath: '/assets/substation_ht_1005_05.mtl',
      position: [-9.5, 0, 45.5],
      scale: [0.05, 0.05, 0.05],
      rotation: [0, Math.PI, 0], // 水平方向顺时针旋转90度
      name: '变电站建筑5'
    },
    // {
    //   id: 'substation05plus',
    //   path: '/assets/substation_ht_1005_05+.obj',
    //   mtlPath: '/assets/substation_ht_1005_05+.mtl',
    //   position: [1, 0, -55],
    //   scale: [0.05, 0.05, 0.05],
    //   rotation: [0, Math.PI, 0], // 水平方向顺时针旋转90度
    //   name: '变电站扩展建筑5+'
    // },
    // {
    //   id: 'substation06',
    //   path: '/assets/substation_ht_1005_06.obj',
    //   mtlPath: '/assets/substation_ht_1005_06.mtl',
    //   position: [50, 0, -50],
    //   scale: [0.1, 0.1, 0.1],
    //   name: '变电站建筑6'
    // },
    // {
    //   id: 'substation07',
    //   path: '/assets/substation_ht_1005_07.obj',
    //   mtlPath: '/assets/substation_ht_1005_07.mtl',
    //   position: [-30, 0, -50],
    //   scale: [0.05, 0.05, 0.05],
    //   name: 'Y形柱子'
    // },
    // {
    //   id: 'substation08',
    //   path: '/assets/substation_ht_1005_08.obj',
    //   mtlPath: '/assets/substation_ht_1005_08.mtl',
    //   position: [10, 0, -90],
    //   scale: [0.1, 0.1, 0.1],
    //   name: '电杆'
    // },
    // 一组
    {
      id: 'substation09-1',
      path: '/assets/substation_ht_1005_09.obj',
      mtlPath: '/assets/substation_ht_1005_09.mtl',
      position: [5, 0, -59],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑9'
    },
    {
      id: 'substation10-1',
      path: '/assets/substation_ht_1005_10.obj',
      mtlPath: '/assets/substation_ht_1005_10.mtl',
      position: [7, 0, -58],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑10'
    },
    {
      id: 'substation09-2',
      path: '/assets/substation_ht_1005_09.obj',
      mtlPath: '/assets/substation_ht_1005_09.mtl',
      position: [9, 0, -59],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑9'
    },
    // 一组
    {
      id: 'substation09-3',
      path: '/assets/substation_ht_1005_09.obj',
      mtlPath: '/assets/substation_ht_1005_09.mtl',
      position: [5, 0, -60],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑9'
    },
    {
      id: 'substation10-2',
      path: '/assets/substation_ht_1005_10.obj',
      mtlPath: '/assets/substation_ht_1005_10.mtl',
      position: [7, 0, -59],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑10'
    },
    {
      id: 'substation09-4',
      path: '/assets/substation_ht_1005_09.obj',
      mtlPath: '/assets/substation_ht_1005_09.mtl',
      position: [9, 0, -60],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑9'
    },
    // 一组
    {
      id: 'substation09-5',
      path: '/assets/substation_ht_1005_09.obj',
      mtlPath: '/assets/substation_ht_1005_09.mtl',
      position: [5, 0, -61],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑9'
    },
    {
      id: 'substation10-3',
      path: '/assets/substation_ht_1005_10.obj',
      mtlPath: '/assets/substation_ht_1005_10.mtl',
      position: [7, 0, -60],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑10'
    },
    {
      id: 'substation09-6',
      path: '/assets/substation_ht_1005_09.obj',
      mtlPath: '/assets/substation_ht_1005_09.mtl',
      position: [9, 0, -61],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑9'
    },
    // 一组
    {
      id: 'substation09-7',
      path: '/assets/substation_ht_1005_09.obj',
      mtlPath: '/assets/substation_ht_1005_09.mtl',
      position: [5, 0, -51],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑9'
    },
    {
      id: 'substation10-4',
      path: '/assets/substation_ht_1005_10.obj',
      mtlPath: '/assets/substation_ht_1005_10.mtl',
      position: [7, 0, -50],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑10'
    },
    {
      id: 'substation09-8',
      path: '/assets/substation_ht_1005_09.obj',
      mtlPath: '/assets/substation_ht_1005_09.mtl',
      position: [9, 0, -51],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑9'
    },
    // 一组
    {
      id: 'substation09-9',
      path: '/assets/substation_ht_1005_09.obj',
      mtlPath: '/assets/substation_ht_1005_09.mtl',
      position: [5, 0, -52],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑9'
    },
    {
      id: 'substation10-5',
      path: '/assets/substation_ht_1005_10.obj',
      mtlPath: '/assets/substation_ht_1005_10.mtl',
      position: [7, 0, -51],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑10'
    },
    {
      id: 'substation09-10',
      path: '/assets/substation_ht_1005_09.obj',
      mtlPath: '/assets/substation_ht_1005_09.mtl',
      position: [9, 0, -52],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑9'
    },
    // 一组
    {
      id: 'substation09-11',
      path: '/assets/substation_ht_1005_09.obj',
      mtlPath: '/assets/substation_ht_1005_09.mtl',
      position: [5, 0, -53],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑9'
    },
    {
      id: 'substation10-6',
      path: '/assets/substation_ht_1005_10.obj',
      mtlPath: '/assets/substation_ht_1005_10.mtl',
      position: [7, 0, -52],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑10'
    },
    {
      id: 'substation09-12',
      path: '/assets/substation_ht_1005_09.obj',
      mtlPath: '/assets/substation_ht_1005_09.mtl',
      position: [9, 0, -53],
      scale: [0.05, 0.05, 0.05],
      name: '变电站建筑9'
    },
  ]
// 坐标系组件
function CoordinateSystem() {
  return (
    <group>
      {/* X轴 - 红色 */}
      <mesh position={[5, 0, 0]}>
        <boxGeometry args={[10, 0.1, 0.1]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <Html position={[10.5, 0, 0]} center>
        <div style={{ color: 'red', fontSize: '12px', fontWeight: 'bold' }}>X (东)</div>
      </Html>
      
      {/* Y轴 - 绿色 */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[0.1, 10, 0.1]} />
        <meshBasicMaterial color="green" />
      </mesh>
      <Html position={[0, 10.5, 0]} center>
        <div style={{ color: 'green', fontSize: '12px', fontWeight: 'bold' }}>Y (上)</div>
      </Html>
      
      {/* Z轴 - 蓝色 */}
      <mesh position={[0, 0, 5]}>
        <boxGeometry args={[0.1, 0.1, 10]} />
        <meshBasicMaterial color="blue" />
      </mesh>
      <Html position={[0, 0, 10.5]} center>
        <div style={{ color: 'blue', fontSize: '12px', fontWeight: 'bold' }}>Z (北)</div>
      </Html>
    </group>
  )
}

// 加载OBJ模型的通用组件
function OBJModel({ path, mtlPath, position, scale = [0.3, 0.3, 0.3], rotation = [0, 0, 0], name }) {
  const [model, setModel] = useState(null)
  const ref = useRef()

  useEffect(() => {
    const loadModel = async () => {
      try {
        const objLoader = new OBJLoader()
        
        if (mtlPath) {
          const mtlLoader = new MTLLoader()
          const materials = await mtlLoader.loadAsync(mtlPath)
          console.log({materials})
          // materials.precompute()
          objLoader.setMaterials(materials)
        }
        
        const object = await objLoader.loadAsync(path)
          console.log({object})
          // 重置模型的旋转，确保应用我们的旋转设置
          if (object) {
            object.rotation.set(0, 0, 0)
          }
          setModel(object)
      } catch (error) {
        console.error('Error loading model:', error)
      }
    }

    loadModel()
  }, [path, mtlPath])

  useFrame(() => {
    if (ref.current) {
      // ref.current.rotation.y += 0.0005
    }
  })

  if (!model) {
      return (
        <Html center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#00d4ff',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            width: 240,
            textAlign: 'center',
          }}>
            加载 {name || path.split('/').pop()}...
          </div>
        </Html>
      )
    }

  return (
    <primitive 
      ref={ref}
      object={model} 
      position={position}
      scale={scale} 
      rotation={rotation}
    />
  )
}

// 图片底座组件
function Ground() {
  // 使用three.js的TextureLoader加载图片
  const texture = new THREE.TextureLoader().load('/assets/stars_01.jpg');
  
  // 设置纹理参数以确保正确显示
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5); // 控制图片重复次数
  
  return (
    <mesh 
      position={[0, -2, 0]} 
      rotation={[-Math.PI / 2, 0, 0]} 
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial 
        map={texture} 
        side={THREE.DoubleSide} 
        roughness={1} 
        metalness={0} 
      />
    </mesh>
  )
}

// 主场景组件
function Scene() {
    // 添加控制器，可以调整光照和视角
  const { ambientIntensity, directionalIntensity, showAxes } = useControls({
    ambientIntensity: { value: 0.6, min: 0, max: 2, step: 0.1 },
    directionalIntensity: { value: 1, min: 0, max: 3, step: 0.1 },
    showAxes: true
  })
  
  // 计算所有模型的中心点
  const calculateCenterPoint = (models) => {
    if (!models || models.length === 0) return { x: 0, y: 0, z: 0 }
    
    let totalX = 0, totalY = 0, totalZ = 0
    const validModels = models.filter(model => model && model.position)
    
    validModels.forEach(model => {
      totalX += model.position[0]
      totalY += model.position[1]
      totalZ += model.position[2]
    })
    
    return {
      x: totalX / validModels.length,
      y: totalY / validModels.length,
      z: totalZ / validModels.length
    }
  }

  {/* 计算模型中心点 */}
  // const centerPoint = calculateCenterPoint(models)
  // console.log('模型中心点:', centerPoint)
  return (
    <>
      <Ground />
      {showAxes && <CoordinateSystem />}
      
      {/* 环境光照 */}
      <ambientLight intensity={ambientIntensity} />

      {/* 方向光 */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={directionalIntensity} 
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* 点光源 */}
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#00d4ff" />
      {/* 通过map渲染所有模型 */}
      {models.map((model) => (
        <OBJModel 
          key={model.id}
          path={model.path}
          mtlPath={model.mtlPath}
          position={model.position}
          rotation={model.rotation}
          scale={model.scale}
          name={model.name}
        />
      ))}
      
      {/* 轨道控制器 - 提供旋转、缩放、平移功能 */}
      <OrbitControls
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        minDistance={5}  // 最小缩放距离
        maxDistance={100}  // 最大缩放距离
        autoRotate={false}  // 自动旋转
        autoRotateSpeed={0.5}  // 自动旋转速度
        // target={[centerPoint.x, centerPoint.y, centerPoint.z]} // 设置控制器的目标点为模型中心
      />
    </>
  )
}

// 主组件
export default function OBJModelViewer() {
  const [loading, setLoading] = useState(true)
  const [autoCenter, setAutoCenter] = useState(true)
  const [showInfoPanel, setShowInfoPanel] = useState(false) // 控制信息面板显示隐藏

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const style = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .info-panel {
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #00d4ff;
      border-radius: 8px;
      padding: 20px;
      color: #ffffff;
      font-size: 14px;
      max-width: 300px;
      backdrop-filter: blur(5px);
    }
    
    .info-panel h3 {
      color: #00d4ff;
      margin-top: 0;
      margin-bottom: 15px;
      border-bottom: 1px solid #00d4ff;
      padding-bottom: 8px;
    }
    
    .info-panel-item {
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
    }
    
    .info-panel-label {
      color: #b0bec5;
    }
    
    .info-panel-value {
      color: #ffffff;
      font-weight: 500;
    }
    
    .toggle-panel-btn {
      position: absolute;
      bottom: 20px;
      left: 20px;
      z-index: 99;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #00d4ff;
      color: #00d4ff;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
    }
    
    .toggle-panel-btn:hover {
      background: rgba(0, 212, 255, 0.1);
      transform: translateY(-2px);
    }
  `

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
    }}>
      <style>{style}</style>
      
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#00d4ff',
          fontSize: '24px',
          zIndex: 100,
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '20px' }}>📦 加载真实OBJ模型中...</div>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #00d4ff',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
      )}
      {/* 2D信息展示面板 - 可以控制显示隐藏 */}
      <button 
        className="toggle-panel-btn" 
        onClick={() => setShowInfoPanel(!showInfoPanel)}
        style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 99 }}
      >
        {showInfoPanel ? '隐藏信息面板' : '显示信息面板'}
      </button>
      
      {showInfoPanel && (
        <div 
          className="info-panel"
          style={{ 
            position: 'absolute', 
            bottom: '60px', 
            left: '20px', 
            zIndex: 98 
          }}
        >
          <h3>变电站模型信息</h3>
          <div className="info-panel-item">
            <span className="info-panel-label">总模型数量:</span>
            <span className="info-panel-value">{models.length}</span>
          </div>
          <div className="info-panel-item">
            <span className="info-panel-label">厂区围墙:</span>
            <span className="info-panel-value">{models.filter(m => m.name === '厂区围墙').length}</span>
          </div>
          <div className="info-panel-item">
            <span className="info-panel-label">变电站建筑:</span>
            <span className="info-panel-value">{models.filter(m => m.name && m.name.includes('变电站建筑')).length}</span>
          </div>
          <div className="info-panel-item">
            <span className="info-panel-label">稳压器:</span>
            <span className="info-panel-value">{models.filter(m => m.name && m.name.includes('稳压器')).length}</span>
          </div>
          <div className="info-panel-item">
            <span className="info-panel-label">运输车辆:</span>
            <span className="info-panel-value">{models.filter(m => m.name && m.name.includes('运输')).length}</span>
          </div>
          <div className="info-panel-item">
            <span className="info-panel-label">变电站主体:</span>
            <span className="info-panel-value">{models.filter(m => m.name && m.name.includes('主体')).length}</span>
          </div>
        </div>
      )}
      <Canvas 
        shadows 
        camera={{ 
          position: [-20, 20, 15], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
      >
        <Suspense fallback={null}>
          <Scene />
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2}
            target={[0, 0, 0]} // 设置目标点为原点，因为我们已经在Scene组件中计算并设置了中心
          />
        </Suspense>
      </Canvas>
    </div>
  )
}