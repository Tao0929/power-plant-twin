/** 渲染多种模型到 一个 3D 场景，支持 GLTF、GLB、FBX、OBJ+MTL 格式, 通过配置得方式使用 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib'
import { MTLLoader } from 'three-stdlib'
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

  // FBX 模型
  if (type === 'fbx') {
    const fbx = useFBX(path);
    useEffect(() => {
      if (onLoad) onLoad(fbx);
    }, [fbx, onLoad]);
    return (
      <group position={position} rotation={rotation} scale={scale}>
        <primitive object={fbx} />
      </group>
    );
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
      {/* 环境光 */}
      <ambientLight intensity={ambientIntensity} />
      {/* 平行光 */}
      <directionalLight position={[10, 10, 10]} intensity={directionalIntensity} />
      {/* 点光源 */}
      <pointLight position={[0, 10, 0]} intensity={0.5} />
      
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
  cameraPosition = [20, 20, 20],
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
            maxDistance={50}
          />
        )}
      </Canvas>
    </div>
  );
});

export default MultModelViewer;