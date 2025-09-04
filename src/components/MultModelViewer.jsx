/** 渲染多种模型到 一个 3D 场景，支持 GLTF、GLB、FBX、OBJ+MTL 格式, 通过配置得方式使用 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader, MTLLoader, FBXLoader } from 'three-stdlib';
import { useControls } from 'leva';

// 模型组件，根据类型渲染不同格式的模型
const ModelComponent = React.memo(({ type, path, mtlPath, position, rotation, scale, onLoad }) => {
  // GLTF 模型
  if (type === 'gltf') {
    const { scene } = useGLTF(path);
    useEffect(() => {
      if (onLoad) onLoad(scene);
    }, [scene, onLoad]);
    return (
      <group position={position} rotation={rotation} scale={scale}>
        <primitive object={scene} />
      </group>
    );
  }

  // GLB 模型
  if (type === 'glb') {
    const { scene } = useGLTF(path);
    useEffect(() => {
      if (onLoad) onLoad(scene);
    }, [scene, onLoad]);
    return (
      <group position={position} rotation={rotation} scale={scale}>
        <primitive object={scene} />
      </group>
    );
  }

  // FBX 模型 - 使用THREE.FBXLoader直接实现
  if (type === 'fbx') {
    const [fbx, setFbx] = useState(null);
    
    useEffect(() => {
      // 使用从three-stdlib导入的FBXLoader加载FBX模型
      const loader = new FBXLoader();
      
      // 添加加载进度回调（可选）
      const onProgress = (xhr) => {
        console.log(`FBX模型加载进度: ${Math.round((xhr.loaded / xhr.total) * 100)}%`);
      };
      
      // 添加加载错误回调
      const onError = (error) => {
        console.error('FBX模型加载错误:', error);
      };
      
      // 临时重定向console.warn来抑制特定警告
      const originalWarn = console.warn;
      console.warn = (...args) => {
        // 过滤掉ShininessExponent map不支持的警告
        if (!args[0]?.includes('ShininessExponent map is not supported in three.js')) {
          originalWarn.apply(console, args);
        }
      };
      
      // 加载FBX模型
      loader.load(
        path,
        (object) => {
          // 恢复原始的console.warn
          console.warn = originalWarn;
          
          // 处理材质优化
          object.traverse((child) => {
            if (child.isMesh && child.material) {
              // 可以在这里添加额外的材质处理逻辑
              // 例如：简化材质或调整属性以提高性能
              if (child.material.specularMap) {
                // 可选：完全移除specularMap以避免任何潜在问题
                // child.material.specularMap = null;
              }
            }
          });
          
          setFbx(object);
          if (onLoad) onLoad(object);
        },
        onProgress,
        (error) => {
          // 确保在错误情况下也恢复console.warn
          console.warn = originalWarn;
          onError(error);
        }
      );
      
      // 组件卸载时清理资源
      return () => {
        // 确保在组件卸载时恢复console.warn
        console.warn = originalWarn;
        if (fbx) {
          fbx.traverse((child) => {
            if (child.isMesh) {
              if (child.geometry) child.geometry.dispose();
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach((mat) => mat.dispose());
                } else {
                  child.material.dispose();
                }
              }
            }
          });
        }
      };
    }, [path, onLoad]);
    
    return fbx ? (
      <group position={position} rotation={rotation} scale={scale}>
        <primitive object={fbx} />
      </group>
    ) : null;
  }

  // OBJ+MTL 模型（简化版）
  if (type === 'obj_mtl') {
    // 注意：完整的OBJ+MTL加载可能需要额外的库，这里提供一个简化的实现
    const [obj, setObj] = useState(null);
    const [mtl, setMtl] = useState(null);

    useEffect(() => {
      // 这里应该是完整的OBJ+MTL加载逻辑
      // 由于复杂性，这里仅提供一个简化的版本
      const objLoader = new OBJLoader();
      const mtlLoader = new MTLLoader();

      if (mtlPath) {
        mtlLoader.load(mtlPath, (materials) => {
          materials.preload();
          setMtl(materials);
          objLoader.setMaterials(materials);
          objLoader.load(path, (object) => {
            setObj(object);
            if (onLoad) onLoad(object);
          });
        });
      } else {
        objLoader.load(path, (object) => {
          setObj(object);
          if (onLoad) onLoad(object);
        });
      }

      return () => {
        // 清理逻辑
        if (obj) {
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.geometry) child.geometry.dispose();
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach((mat) => mat.dispose());
                } else {
                  child.material.dispose();
                }
              }
            }
          });
        }
      };
    }, [path, mtlPath, onLoad]);

    return obj ? (
      <group position={position} rotation={rotation} scale={scale}>
        <primitive object={obj} />
      </group>
    ) : null;
  }

  return null;
});
function CoordinateSystem() {
  // 创建网格组
  const gridGroup = useMemo(() => {
    const group = new THREE.Group();
    
    // XZ平面网格（地面网格）
    const xzGrid = new THREE.GridHelper(200, 200, 0x333333, 0x1a1a1a);
    xzGrid.position.y = -0.01; // 稍微低于原点，避免Z-fighting
    group.add(xzGrid);
    
    // XY平面网格（垂直于Z轴的网格）
    const xyGrid = new THREE.GridHelper(200, 200, 0x333333, 0x1a1a1a);
    xyGrid.rotation.z = Math.PI / 2;
    xyGrid.position.z = -0.01; // 稍微偏移，避免Z-fighting
    // group.add(xyGrid);
    
    // YZ平面网格（垂直于X轴的网格）
    const yzGrid = new THREE.GridHelper(200, 200, 0x333333, 0x1a1a1a);
    yzGrid.rotation.x = Math.PI / 2;
    yzGrid.position.x = -0.01; // 稍微偏移，避免Z-fighting
    // group.add(yzGrid);
    
    return group;
  }, []);
  
  return (
    <group>
      {/* 显示网格 */}
      <primitive object={gridGroup} />
      
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
// 场景组件
const ModelScene = React.memo(({ models, onModelsLoaded }) => {
  const [loadedModels, setLoadedModels] = useState([]);
  const sceneRef = useRef(null);
  const { ambientIntensity, directionalIntensity, showAxes } = useControls({
    ambientIntensity: { value: 0.6, min: 0, max: 2, step: 0.1 },
    directionalIntensity: { value: 1, min: 0, max: 3, step: 0.1 },
    showAxes: true
  })

  // 处理模型加载完成
  const handleModelLoad = useCallback((model) => {
    setLoadedModels((prev) => {
      const newLoadedModels = [...prev, model];
      // 当所有模型都加载完成时调用回调
      if (newLoadedModels.length === models.length && onModelsLoaded) {
        onModelsLoaded(newLoadedModels);
      }
      return newLoadedModels;
    });
  }, [models, onModelsLoaded]);

  return (
    <>
      {showAxes && <CoordinateSystem />}
      {/* 环境光 */}
      <ambientLight intensity={ambientIntensity} />
      {/* 平行光 - 调整位置以扩大照射范围 */}
      <directionalLight position={[20, 40, 20]} intensity={directionalIntensity} />
      {/* 点光源 - 添加distance和decay属性扩大照射范围 */}
      <pointLight position={[0, 30, 0]} intensity={100} distance={500} decay={1.5} />
      
      {/* 渲染所有模型 */}
      {models.map((model, index) => (
        <ModelComponent
          key={`${model.type}-${index}`}
          type={model.type}
          path={model.path}
          mtlPath={model.mtlPath}
          position={model.position || [0, 0, 0]}
          rotation={model.rotation || [0, 0, 0]}
          scale={model.scale || [1, 1, 1]}
          onLoad={handleModelLoad}
        />
      ))}
    </>
  );
});

const MultModelViewer = React.memo(({ 
  models = [], 
  width = '100%', 
  height = '100%', 
  backgroundColor = '#131323',
  onModelsLoaded,
  orbitControls = true,
  cameraPosition = [0, 10, 0],
  cameraTarget = [0, 0, 0]
}) => {
  // 计算模型中心点（可选功能）
  const calculateCenterPoint = useCallback((models) => {
    if (!models || models.length === 0) return { x: 0, y: 0, z: 0 };

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    models.forEach((model) => {
      // 这里应该基于实际模型几何体计算边界
      // 简化版本：假设模型已经在正确位置
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
    <div style={{ width, height, backgroundColor }}>
      <Canvas>
        <ModelScene models={models} onModelsLoaded={onModelsLoaded} />
        {orbitControls && (
          <OrbitControls
            enableDamping={true}
            dampingFactor={0.05}
            autoRotate={false}
            target={cameraTarget}
            position={cameraPosition}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1}
            maxDistance={100}
            center={calculateCenterPoint(models)}
          />
        )}
      </Canvas>
    </div>
  );
});

export default MultModelViewer;