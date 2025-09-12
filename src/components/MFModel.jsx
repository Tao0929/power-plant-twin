import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useThreeReact } from '../hook/useThreeReact';
import * as THREE from 'three';

// 模型配置 - 合并了useTurbine.js中的优化配置
const CONFIG = {
    MODEL_SOURCES: {
        EQUIPMENT: `assets/mf/models/equipment.glb`,
        PLANE: `assets/mf/models/plane.glb`,
        SKELETON: `assets/mf/models/skeleton.glb`,
    },
    MODEL_SCALES: [0.001*3, 0.001*3, 0.001*3],
    ANIMATION_DURATION: 1000, // 统一动画持续时间
    POSITION_SCALE: {
        X_Y: 10000,
        Z: 1000
    },
    // 设备位置配置，增加了更精确的匹配规则
    EQUIPMENT_POSITION: {
        变桨系统: {
        LABEL: { x: 0.0291, y: 2.6277, z: 0.2308 },
        COMPOSE: { x: 2519.0795, y: 29288.6777, z: 0 },
        DECOMPOSE: { x: 2519.0795, y: 29000.6777, z: 300 },
        // 添加可能的网格名称变体
        meshNames: ['pitch', '变桨', 'pitch_system']
        },
        转子: {
        LABEL: { x: 0.0632, y: 2.7692, z: 0.1746 },
        COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
        DECOMPOSE: { x: 20437.7851, y: 8850, z: 300 },
        meshNames: ['rotor', '转子']
        },
        主轴: {
        LABEL: { x: 0.0183, y: 2.6193, z: 0.0815 },
        COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
        DECOMPOSE: { x: 20437.7851, y: 8350, z: 200 },
        meshNames: ['main_shaft', '主轴']
        },
        齿轮箱: {
        LABEL: { x: 0.0319, y: 2.6239, z: -0.0402 },
        COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
        DECOMPOSE: { x: 20437.7851, y: 8350, z: 100 },
        meshNames: ['gearbox', '齿轮箱']
        },
        油冷装置: {
        LABEL: { x: 0.0364, y: 2.7995, z: 0.0593 },
        COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
        DECOMPOSE: { x: 20437.7851, y: 8650, z: 600 },
        meshNames: ['oil_cooler', '油冷', 'oil']
        },
        偏航电机: {
        LABEL: { x: -0.0122, y: 2.75662, z: -0.0305 },
        COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
        DECOMPOSE: { x: 20437.7851, y: 8850, z: 400 },
        meshNames: ['yaw_motor', '偏航', 'yaw']
        },
        风冷装置: {
        LABEL: { x: -0.001, y: 2.7643, z: -0.1305 },
        COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
        DECOMPOSE: { x: 20437.7851, y: 8750, z: 300 },
        meshNames: ['air_cooler', '风冷', 'fan']
        },
        发电机: {
        LABEL: { x: 0.0047, y: 2.6156, z: -0.2045 },
        COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
        DECOMPOSE: { x: 20437.7851, y: 8350, z: 0 },
        meshNames: ['generator', '发电']
        },
        控制柜: {
        LABEL: { x: 0.0249, y: 2.7605, z: -0.2521 },
        COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
        DECOMPOSE: { x: 20437.7851, y: 8850, z: 0 },
        meshNames: ['control_cabinet', '控制柜', 'control']
        },
    },
}
const MfModel = () => {
  const containerRef = useRef(null);
  const [models, setModels] = useState({});
  const [isComposed, setIsComposed] = useState(true); // 控制模型是组合还是分解状态
  const [loadingModels, setLoadingModels] = useState(false);
  const [showLabels, setShowLabels] = useState(false); // 新增：控制是否显示标签
  const [showAxes, setShowAxes] = useState(false); // 新增：控制是否显示坐标轴
  const [alarmEquipment, setAlarmEquipment] = useState([]); // 新增：告警设备列表
  const [isAnimation, setIsAnimation] = useState(false); // 控制是否正在执行动画
  const skeletons = useRef({ // 存储骨架模型引用
    color: null,
    wireframe: null
  });

  // 使用我们的自定义hook - 添加了fitModelsToView方法
  const { 
    isReady, 
    loading: threeLoading, 
    loadGltf, 
    scene, 
    camera, 
    controls, 
    addRenderMixin, 
    removeRenderMixin,
    TWEEN,
    removeModel,
    fitModelsToView, // 新增：使用useThreeReact中的自动适配视角功能
    setBackgroundColor
  } = useThreeReact(containerRef);
  
    // 存储扇叶动画ID的引用
    const fanBladeAnimationIds = useRef(new Map());
    // 存储设备标签引用
    const equipmentLabels = useRef(new Map());
    // 存储告警效果引用
    const alarmEffects = useRef(new Map());

    // 查找设备网格 - 优化版
  const findEquipmentMesh = useCallback((equipmentName, meshNames = []) => {
    if (!models.equipment) return null;
    
    let foundMesh = null;
    const equipmentNameLower = equipmentName.toLowerCase();
    
    // 首先尝试使用精确的网格名称列表匹配
    if (meshNames.length > 0) {
      models.equipment.traverse((mesh) => {
        if (mesh.isMesh && !foundMesh) {
          const meshNameLower = mesh.name.toLowerCase();
          const isMatch = meshNames.some(name => 
            meshNameLower.includes(name.toLowerCase())
          );
          
          if (isMatch) {
            foundMesh = mesh;
          }
        }
      });
    }
    
    // 如果没有找到，使用宽松的匹配策略
    if (!foundMesh) {
      models.equipment.traverse((mesh) => {
        if (mesh.isMesh && !foundMesh) {
          const meshNameLower = mesh.name.toLowerCase();
          // 尝试多种匹配策略
          const nameMatches = 
            meshNameLower.includes(equipmentNameLower) || 
            equipmentNameLower.includes(meshNameLower);
            
          if (nameMatches) {
            foundMesh = mesh;
          }
        }
      });
    }
    
    return foundMesh;
  }, [models.equipment]);

  // 提供备选组合/分解方案 - 移到此处以解决初始化顺序问题
  const provideFallbackComposition = useCallback((isComposing) => {
    if (!models.equipment || !TWEEN) return;
    
    try {
      // 创建一个更智能的备选方案，不仅移动整体位置，还可以添加旋转
      const targetPosition = isComposing 
        ? { x: 0, y: 0, z: 0 }
        : { x: 0.5, y: 0.5, z: 0.5 };
      
      const targetRotation = isComposing 
        ? { x: 0, y: 0, z: 0 }
        : { x: 0, y: Math.PI/8, z: 0 };
      
      new TWEEN.Tween(models.equipment.position)
        .to(targetPosition, CONFIG.ANIMATION_DURATION)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
      
      // 添加旋转动画以增强视觉效果
      new TWEEN.Tween(models.equipment.rotation)
        .to(targetRotation, CONFIG.ANIMATION_DURATION)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
      
      console.log('尝试移动并旋转整个设备组作为备选方案');
    } catch (error) {
      console.error('尝试移动整个设备组时出错:', error);
    }
  }, [models, TWEEN]);

  // 应用安全的相机位置 - 移到此处以解决初始化顺序问题
  const applySafeCameraPosition = useCallback(() => {
    if (!camera) return;
    
    const safePosition = { x: 0, y: 100, z: 100 };
    const safeTarget = { x: 0, y: 0, z: 0 };
    
    console.log('使用安全相机位置:', safePosition);
    
    if (controls) {
      controls.target.set(...Object.values(safeTarget));
      controls.update();
    }
    
    if (TWEEN) {
      new TWEEN.Tween(camera.position)
        .to(safePosition, CONFIG.ANIMATION_DURATION)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
    } else {
      camera.position.set(...Object.values(safePosition));
    }
  }, [camera, TWEEN, controls]);

  // 验证相机聚焦效果
  const verifyCameraFocus = useCallback(() => {
    if (!camera || !scene) return;
    
    // 这里可以添加更复杂的验证逻辑
    // 例如检查模型是否在相机视锥体内
    console.log('验证相机聚焦效果:', camera.position);
  }, [camera, scene]);

  // 优化的模型聚焦功能 - 移到此处以解决初始化顺序问题
  const focusOnModels = useCallback(() => {
    if (!camera || !Object.keys(models).length) {
      console.log('无法聚焦到模型:', { hasCamera: !!camera, modelCount: Object.keys(models).length });
      return;
    }

    try {
      console.log('开始聚焦模型，当前相机位置:', camera.position);
      
      // 优先使用useThreeReact提供的fitModelsToView方法
      if (fitModelsToView) {
        console.log('使用fitModelsToView方法自动调整视角');
        
        // 准备要适配的模型数组
        const modelsToFit = Object.values(models).filter(model => {
          // 确保模型有效且已加载
          if (!model) return false;
          
          // 检查模型是否有有效边界框
          const box = new THREE.Box3().setFromObject(model);
          return !box.isEmpty();
        });
        
        if (modelsToFit.length > 0) {
          fitModelsToView(modelsToFit, 0.3); // 30% 边距，提供更好的视觉效果
          return;
        }
      }
      
      console.log('fitModelsToView不可用或无有效模型，使用备选聚焦逻辑');
      
      // 备选聚焦逻辑 - 确保相机近平面设置合理
      if (camera.near > 0.01) {
        camera.near = 0.01;
        camera.updateProjectionMatrix();
        console.log('已调整相机近平面为0.01');
      }
      
      // 计算模型中心点（优化版）
      const modelCenters = [];
      let validModels = 0;
      
      Object.values(models).forEach(model => {
        if (model) {
          const box = new THREE.Box3().setFromObject(model);
          if (!box.isEmpty()) {
            const center = box.getCenter(new THREE.Vector3());
            modelCenters.push({
              center,
              size: box.getSize(new THREE.Vector3())
            });
            validModels++;
          }
        }
      });
      
      console.log(`找到 ${validModels} 个有效模型`);
      
      // 如果没有有效的模型，使用默认位置
      if (modelCenters.length === 0) {
        applySafeCameraPosition();
        return;
      }
      
      // 计算所有模型中心点的平均位置
      const avgCenter = new THREE.Vector3();
      modelCenters.forEach(item => avgCenter.add(item.center));
      avgCenter.divideScalar(modelCenters.length);
      
      // 计算最大尺寸和最远距离
      let maxSize = 0;
      let maxDistance = 0;
      
      modelCenters.forEach(item => {
        const size = item.size.length();
        const distance = item.center.distanceTo(avgCenter);
        maxSize = Math.max(maxSize, size);
        maxDistance = Math.max(maxDistance, distance);
      });
      
      // 更精确的相机距离计算
      const fov = camera.fov * (Math.PI / 180);
      const requiredDistance = (Math.max(maxSize, maxDistance * 2) / (2 * Math.tan(fov / 2))) * 1.3;
      
      // 设置相机位置 - 使用固定的斜上方视角
      const fixedDirection = new THREE.Vector3(-1, 1, -1).normalize();
      const targetPosition = avgCenter.clone().add(fixedDirection.multiplyScalar(requiredDistance));
      
      console.log('计算结果:', { avgCenter, requiredDistance, targetPosition });
      
      // 应用相机位置和目标
      if (TWEEN) {
        // 使用动画平滑过渡
        new TWEEN.Tween(camera.position)
          .to(targetPosition, CONFIG.ANIMATION_DURATION)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .start();
        
        // 添加动画完成后的验证
        setTimeout(() => {
          verifyCameraFocus();
        }, CONFIG.ANIMATION_DURATION + 100);
      } else {
        // 无动画，直接设置
        camera.position.copy(targetPosition);
        verifyCameraFocus();
      }
      
      // 更新控制器目标
      if (controls) {
        controls.target.copy(avgCenter);
        controls.update();
      }
      
    } catch (error) {
      console.error('聚焦模型时出错:', error);
      // 出错时使用安全位置作为备用
      applySafeCameraPosition();
    }
  }, [camera, models, TWEEN, controls, fitModelsToView, applySafeCameraPosition, verifyCameraFocus]);

    // 核心动画管理 - 统一管理所有动画效果
  useEffect(() => {
    if (!isReady) return;

    // 主动画循环
    const mainAnimationLoop = () => {
      // TWEEN动画更新
      if (TWEEN) {
        TWEEN.update();
      }
      
      // 更新告警效果
      updateAlarmEffects();
    };

    // 添加到渲染循环中
    addRenderMixin('mainAnimation', mainAnimationLoop);

    // 清理函数
    return () => {
      removeRenderMixin('mainAnimation');
      // 清理所有动画资源
      cleanupAllAnimations();
    };
  }, [isReady, addRenderMixin, removeRenderMixin, TWEEN, alarmEquipment]);

  // 清理告警效果
  const cleanupAlarmEffects = useCallback(() => {
    alarmEffects.current.forEach(({ mesh, originalColor }) => {
      if (mesh && mesh.material) {
        // 恢复原始颜色
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material, index) => {
            if (material.color && originalColor[index]) {
              material.color.copy(originalColor[index]);
            }
          });
        } else if (mesh.material.color) {
          mesh.material.color.copy(originalColor);
        }
      }
    });
    alarmEffects.current.clear();
  }, []);

  // 清理设备标签
  const cleanupEquipmentLabels = useCallback(() => {
    if (!scene || !equipmentLabels.current) return;
    
    equipmentLabels.current.forEach((label, equipmentName) => {
      if (label && label.parent === scene) {
        // 清理纹理和材质
        if (label.material && label.material.map) {
          label.material.map.dispose();
        }
        if (label.material) {
          label.material.dispose();
        }
        scene.remove(label);
      }
    });
    equipmentLabels.current.clear();
  }, [scene]);

  // 创建设备标签
  const createEquipmentLabels = useCallback(() => {
    if (!models.equipment || !scene || !THREE) return;
    
    cleanupEquipmentLabels(); // 先清理现有标签
    
    const { EQUIPMENT_POSITION } = CONFIG;
    
    Object.entries(EQUIPMENT_POSITION).forEach(([equipmentName, positionData]) => {
      try {
        // 查找设备对应的网格
        const mesh = findEquipmentMesh(equipmentName, positionData.meshNames || []);
        if (!mesh) {
          console.warn(`未找到设备 ${equipmentName} 的网格，无法创建设备标签`);
          return;
        }
        
        // 创建标签精灵
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) return;
        
        // 设置画布大小
        canvas.width = 256;
        canvas.height = 64;
        
        // 设置字体和样式
        context.font = '16px Arial';
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        
        // 绘制背景
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const textWidth = context.measureText(equipmentName).width + 20;
        context.fillRect(canvas.width / 2 - textWidth / 2, 10, textWidth, 40);
        
        // 绘制文本
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(equipmentName, canvas.width / 2, canvas.height / 2);
        
        // 创建纹理和材质
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        
        // 创建精灵
        const label = new THREE.Sprite(material);
        label.scale.set(textWidth * 0.1, 40 * 0.1, 1); // 调整标签大小
        
        // 设置标签位置（在设备上方）
        const box = new THREE.Box3().setFromObject(mesh);
        const labelPosition = box.max.clone();
        labelPosition.y += 0.5; // 标签在设备上方
        
        label.position.copy(labelPosition);
        
        // 添加到场景
        scene.add(label);
        
        // 存储标签引用
        equipmentLabels.current.set(equipmentName, label);
        
        console.log(`为设备 ${equipmentName} 创建标签`);
      } catch (error) {
        console.error(`创建设备 ${equipmentName} 标签时出错:`, error);
      }
    });
  }, [models, scene, findEquipmentMesh]);

  // 清理所有动画资源
  const cleanupAllAnimations = useCallback(() => {
    // 清理所有扇叶动画
    fanBladeAnimationIds.current.forEach((_, key) => {
      removeRenderMixin(key);
    });
    fanBladeAnimationIds.current.clear();
    
    // 清理所有标签
    cleanupEquipmentLabels();
    
    // 清理所有告警效果
    cleanupAlarmEffects();
  }, [removeRenderMixin]);

  // 设置告警设备 - 重命名以避免与React state setter冲突
  const applyAlarmEquipment = useCallback((equipmentNames = []) => {
    if (!models.equipment || !THREE) return;
    
    // 清理旧的告警效果
    cleanupAlarmEffects();
    
    equipmentNames.forEach(equipmentName => {
      try {
        // 查找设备对应的网格
        const positionData = CONFIG.EQUIPMENT_POSITION[equipmentName];
        if (!positionData) return;
        
        const mesh = findEquipmentMesh(equipmentName, positionData.meshNames || []);
        if (!mesh || !mesh.material) return;
        
        // 保存原始颜色
        const originalColor = Array.isArray(mesh.material)
          ? mesh.material.map(m => m.color.clone())
          : mesh.material.color.clone();
        
        // 存储告警效果引用
        alarmEffects.current.set(equipmentName, {
          mesh,
          originalColor
        });
        
        console.log(`为设备 ${equipmentName} 设置告警效果`);
      } catch (error) {
        console.error(`为设备 ${equipmentName} 设置告警效果时出错:`, error);
      }
    });
  }, [models, findEquipmentMesh, cleanupAlarmEffects]);

  // Apply alarm effects when alarmEquipment changes
  useEffect(() => {
    applyAlarmEquipment(alarmEquipment);
  }, [alarmEquipment, applyAlarmEquipment]);

  // 添加扇叶旋转动画
  const addFanBladeAnimations = useCallback((model) => {
    if (!model || !THREE) return;
    
    const fanKeywords = ['扇叶', 'blade', 'Fan', 'propeller'];
    
    model.traverse((mesh) => {
      if (mesh.isMesh) {
        const meshNameLower = mesh.name.toLowerCase();
        const isFanBlade = fanKeywords.some(keyword => meshNameLower.includes(keyword.toLowerCase()));
        
        if (isFanBlade) {
          // 保存原始材质信息
          const originalMaterials = Array.isArray(mesh.material) 
            ? mesh.material.map(m => ({ 
                color: m.color.clone(), 
                emissive: m.emissive.clone(),
                metalness: m.metalness, 
                roughness: m.roughness 
              })) 
            : { 
                color: mesh.material.color.clone(), 
                emissive: mesh.material.emissive.clone(),
                metalness: mesh.material.metalness, 
                roughness: mesh.material.roughness 
              };
        
          // 记录动画开始时间
          const animationStartTime = Date.now();
          const materialShowDuration = 2000; // 材质展示效果持续2秒
          const rotationAccelerationTime = 1000; // 旋转加速时间
          
          // 添加旋转动画到扇叶
          const animateBlade = () => {
            try {
              if (mesh && mesh.rotation) {
                // 计算动画运行时间
                const elapsedTime = Date.now() - animationStartTime;
                
                // 旋转加速效果
                let rotationSpeed = 0.02; // 默认旋转速度
                if (elapsedTime < rotationAccelerationTime) {
                  // 平滑加速到目标速度
                  rotationSpeed = 0.02 * (elapsedTime / rotationAccelerationTime);
                }
                
                // 应用旋转
                mesh.rotation.y += rotationSpeed;
                
                // 防止旋转值过大导致精度问题
                if (Math.abs(mesh.rotation.y) > Math.PI * 2) {
                  mesh.rotation.y = mesh.rotation.y % (Math.PI * 2);
                }
                
                // 在动画开始时展示材质（增强视觉效果）
                if (elapsedTime < materialShowDuration) {
                  const progress = elapsedTime / materialShowDuration;
                  const intensity = Math.sin(progress * Math.PI) * 0.5 + 0.5; // 平滑的强度变化
                  
                  if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((material, index) => {
                      // 临时增强材质亮度和金属感以更好地展示材质
                      material.emissive.setHex(0x0066ff);
                      material.emissiveIntensity = intensity * 0.5;
                      material.metalness = originalMaterials[index].metalness + intensity * 0.3;
                      material.roughness = Math.max(0, originalMaterials[index].roughness - intensity * 0.4);
                    });
                  } else {
                    mesh.material.emissive.setHex(0x0066ff);
                    mesh.material.emissiveIntensity = intensity * 0.5;
                    mesh.material.metalness = originalMaterials.metalness + intensity * 0.3;
                    mesh.material.roughness = Math.max(0, originalMaterials.roughness - intensity * 0.4);
                  }
                } else if (elapsedTime === materialShowDuration) {
                  // 恢复原始材质属性
                  if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((material, index) => {
                      material.color.copy(originalMaterials[index].color);
                      material.emissive.copy(originalMaterials[index].emissive);
                      material.metalness = originalMaterials[index].metalness;
                      material.roughness = originalMaterials[index].roughness;
                    });
                  } else {
                    mesh.material.color.copy(originalMaterials.color);
                    mesh.material.emissive.copy(originalMaterials.emissive);
                    mesh.material.metalness = originalMaterials.metalness;
                    mesh.material.roughness = originalMaterials.roughness;
                  }
                }
              }
            } catch (error) {
              console.warn('扇叶动画更新错误:', error);
            }
          };
          
          // 将扇叶动画添加到渲染循环
          const animationKey = `fanBlade_${mesh.uuid}`;
          addRenderMixin(animationKey, animateBlade);
          fanBladeAnimationIds.current.set(animationKey, true);
          
          console.log(`已为扇叶模型添加动画: ${mesh.name}，并配置了材质展示效果`);
        }
      }
    });
  }, [addRenderMixin, THREE]);
  
  // 加载所有模型 - 优化版
  const handleLoadAllModels = useCallback(async () => {
    if (loadingModels || !isReady) return;
    
    setLoadingModels(true);
    try {
      console.log('开始加载模型，当前模型数量:', Object.keys(models).length);
      
      // 1. 清除所有现有资源
      cleanupAllAnimations();
      
      // 2. 设置背景色
      if (setBackgroundColor) {
        setBackgroundColor('#0a0a0a'); // 深色背景，提升模型可视性
      }
      
      // 3. 创建新的模型对象
      const loadedModels = {};
      const { MODEL_SOURCES, MODEL_SCALES } = CONFIG;
      
      // 4. 并行加载模型以提高性能
      const loadPromises = [];
      
      // 加载骨架模型
      if (MODEL_SOURCES.SKELETON) {
        loadPromises.push(
          loadGltf(MODEL_SOURCES.SKELETON)
            .then(skeletonGltf => {
              if (skeletonGltf && skeletonGltf.scene) {
                skeletonGltf.scene.position.set(0, 0, 0);
                skeletonGltf.scene.scale.set(...MODEL_SCALES);
                loadedModels.skeleton = skeletonGltf.scene;
                
                // 存储骨架模型引用，用于开场动画
                if (skeletonGltf.scene.children && skeletonGltf.scene.children.length > 0) {
                  // 假设第一个子元素是彩色外壳，第二个是线框
                  skeletons.current.color = skeletonGltf.scene.children[0];
                  if (skeletonGltf.scene.children.length > 1) {
                    skeletons.current.wireframe = skeletonGltf.scene.children[1];
                  }
                }
                
                console.log('骨架模型加载完成');
              }
            })
            .catch(error => console.warn('骨架模型加载失败:', error))
        );
      }
      
      // 加载平面模型
      if (MODEL_SOURCES.PLANE) {
        loadPromises.push(
          loadGltf(MODEL_SOURCES.PLANE)
            .then(planeGltf => {
              if (planeGltf && planeGltf.scene) {
                planeGltf.scene.position.set(0, 0, 0);
                planeGltf.scene.scale.set(...MODEL_SCALES);
                loadedModels.plane = planeGltf.scene;
                console.log('平面模型加载完成');
              }
            })
            .catch(error => console.warn('平面模型加载失败:', error))
        );
      }
      
      // 加载设备模型
      if (MODEL_SOURCES.EQUIPMENT) {
        loadPromises.push(
          loadGltf(MODEL_SOURCES.EQUIPMENT)
            .then(equipmentGltf => {
              if (equipmentGltf && equipmentGltf.scene) {
                equipmentGltf.scene.position.set(0, 0, 0);
                equipmentGltf.scene.scale.set(...MODEL_SCALES);
                loadedModels.equipment = equipmentGltf.scene;
                console.log('设备模型加载完成');
                
                // 添加扇叶动画
                addFanBladeAnimations(equipmentGltf.scene);
                
                // 如果需要显示标签，立即创建标签
                if (showLabels) {
                  createEquipmentLabels(equipmentGltf.scene);
                }
              }
            })
            .catch(error => console.warn('设备模型加载失败:', error))
        );
      }
      
      // 5. 等待所有模型加载完成
      await Promise.all(loadPromises);
      
      // 6. 更新模型状态
      setModels(loadedModels);
      console.log('所有模型加载完成:', Object.keys(loadedModels).length, '个模型');
      
      // 7. 自动调整视角以显示所有模型
      setTimeout(() => {
        if (fitModelsToView && Object.keys(loadedModels).length > 0) {
          fitModelsToView(Object.values(loadedModels), 0.3); // 30% 边距
        }
      }, 500);
      
    } catch (error) {
      console.error('加载模型时发生错误:', error);
      // 使用toast替代alert，提升用户体验
      console.error('加载模型失败，请检查模型路径是否正确');
    } finally {
      setLoadingModels(false);
    }
  }, [loadingModels, isReady, models, loadGltf, cleanupAllAnimations, setBackgroundColor, addFanBladeAnimations, createEquipmentLabels, showLabels, fitModelsToView]);

  // 更新告警效果
  const updateAlarmEffects = useCallback(() => {
    if (!models.equipment || !THREE) return;
    
    alarmEffects.current.forEach(({ mesh, originalColor }) => {
      if (mesh && mesh.material) {
        // 创建脉动效果
        const pulseValue = (Math.sin(Date.now() * 0.005) + 1) / 2;
        const targetColor = new THREE.Color(1, 0, 0); // 红色
        
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => {
            if (material.color) {
              material.color.lerpColors(originalColor, targetColor, pulseValue);
            }
          });
        } else if (mesh.material.color) {
          mesh.material.color.lerpColors(originalColor, targetColor, pulseValue);
        }
      }
    });
  }, [models]);

  // 平面削切动画工具函数
  const planeClippingAnimation = useCallback(({
    objects, 
    from, 
    to, 
    during, 
    onComplete
  }) => {
    if (!TWEEN) return { start: () => {}, chain: () => ({ start: () => {} }) };
    
    let currentTween = null;
    
    objects.forEach((obj) => {
      if (!obj) return;
      
      // 确保对象有clippingPlanes属性
      if (!obj.clippingPlanes) {
        obj.clippingPlanes = [];
      }
      
      // 创建一个平面
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), from);
      obj.clippingPlanes.push(plane);
      
      // 创建TWEEN动画
      const tween = new TWEEN.Tween({ value: from })
        .to({ value: to }, during)
        .easing(TWEEN.Easing.Quintic.InOut)
        .onUpdate(({ value }) => {
          plane.constant = value;
        })
        .onComplete(() => {
          if (onComplete) onComplete();
        });
      
      if (currentTween) {
        currentTween.chain(tween);
      } else {
        currentTween = tween;
      }
    });
    
    return {
      start: () => {
        if (currentTween) currentTween.start();
      },
      chain: (next) => {
        if (currentTween) currentTween.chain(next);
        return next;
      }
    };
  }, [TWEEN]);
  
  // 过渡动画工具函数
  const transitionAnimation = useCallback(({
    from, 
    to, 
    duration, 
    easing, 
    onUpdate, 
    onComplete
  }) => {
    if (!TWEEN) return { start: () => {}, chain: () => ({ start: () => {} }) };
    
    const tween = new TWEEN.Tween(from)
      .to(to, duration)
      .easing(easing || TWEEN.Easing.Linear.None)
      .onUpdate((data) => {
        if (onUpdate) onUpdate(data);
      })
      .onComplete(() => {
        if (onComplete) onComplete();
      });
    
    return {
      start: () => {
        tween.start();
      },
      chain: (next) => {
        tween.chain(next);
        return next;
      }
    };
  }, [TWEEN]);
  
  // 开场动画 - 优化版
  const openingAnimation = useCallback(() => {
    return new Promise((resolve) => {
      setIsAnimation(true);
      
      // 1. 执行相机聚焦到核心部件的动画
      const cameraFocusAnimation = transitionAnimation({
        from: camera.position,
        to: { x: 0.5, y: 2.8, z: 0.5 },
        duration: 1000 * 4, // 增加聚焦动画的持续时间，与外壳褪去动画同步
        easing: TWEEN.Easing.Quintic.InOut,
        onUpdate: ({ x, y, z }) => {
          if (camera) {
            camera.position.set(x, y, z);
          }
          if (controls) {
            controls.update();
          }
        },
      });
      
      // 2. 执行风机白色外壳平滑褪去的动画
      const shellFadeAnimation = planeClippingAnimation({
        objects: [skeletons.current.color],
        from: 4,
        to: 2,
        during: 1000 * 4,
        onComplete: () => {
          setIsAnimation(false);
          if (skeletons.current.color) {
            skeletons.current.color.visible = false;
          }
          resolve(void 0);
        },
      });
      
      // 两个动画同时开始，实现聚焦过程中褪去外壳的效果
      cameraFocusAnimation.start();
      shellFadeAnimation.start();
    });
  }, [camera, controls, planeClippingAnimation, transitionAnimation, TWEEN]);
  
  // 设备分解动画: 外壳削切 => 设备分离 => 显示标签/摄像头转动
  const eqDecomposeAnimation = useCallback(() => {
    return new Promise((resolve) => {
      // 先确保白色外壳隐藏
      if (skeletons.current.color) {
        skeletons.current.color.visible = false;
      }
      setIsAnimation(true);
      
      const skeletonAnimate = planeClippingAnimation({
        objects: [skeletons.current.wireframe],
        from: 4,
        to: 2,
        during: 1000 * 2,
        onComplete: () => {
          if (skeletons.current.wireframe) {
            skeletons.current.wireframe.visible = false;
          }
          cameraAnimate.start();
        },
      });
      
      // 为每个设备创建动画配置
      const from = {};
      const to = {};
      const meshMap = {};
      
      if (models.equipment && models.equipment.children) {
        models.equipment.children.forEach((mesh, index) => {
          const name = mesh.name;
          // 查找匹配的设备配置
          let positionData = null;
          for (const [key, data] of Object.entries(CONFIG.EQUIPMENT_POSITION)) {
            const meshNames = data.meshNames || [];
            if (meshNames.some(meshName => name.includes(meshName))) {
              positionData = data;
              break;
            }
          }
          
          if (positionData) {
            const decompose = positionData.DECOMPOSE;
            const compose = positionData.COMPOSE;
            from[`x${index}`] = compose.x;
            from[`y${index}`] = compose.y;
            from[`z${index}`] = compose.z;
            to[`x${index}`] = decompose.x;
            to[`y${index}`] = decompose.y;
            to[`z${index}`] = decompose.z;
            meshMap[index] = mesh;
          }
        });
      }
      
      const eqAnimate = transitionAnimation({
        from,
        to,
        duration: 1000 * 2,
        easing: TWEEN.Easing.Quintic.InOut,
        onUpdate: (data) => {
          Object.entries(meshMap).forEach(([index, mesh]) => {
            const idx = parseInt(index);
            mesh.position.set(
              data[`x${idx}`] / CONFIG.POSITION_SCALE.X_Y,
              data[`y${idx}`] / CONFIG.POSITION_SCALE.X_Y,
              data[`z${idx}`] / CONFIG.POSITION_SCALE.Z
            );
          });
        },
        onComplete: () => {
          setIsAnimation(false);
          setIsComposed(false);
          createEquipmentLabels();
          resolve(void 0);
        },
      });
      
      const cameraAnimate = transitionAnimation({
        from: camera.position,
        to: { x: 0.7, y: 2.8, z: 0 },
        duration: 1000 * 2,
        easing: TWEEN.Easing.Linear.None,
        onUpdate: (data) => {
          if (camera) {
            camera.position.set(data.x, data.y, data.z);
          }
          if (controls) {
            controls.update();
          }
        },
      });
      
      skeletonAnimate.chain(eqAnimate).start();
    });
  }, [camera, controls, models, planeClippingAnimation, transitionAnimation, createEquipmentLabels, TWEEN]);
  
  // 切换模型组合/分解状态 - 优化版
  const toggleModelComposition = useCallback(() => {
    const newState = !isComposed;
    
    // 如果当前是组合状态，使用分解动画
    if (isComposed && !isAnimation) {
      eqDecomposeAnimation().then(() => {
        setIsComposed(false);
      });
    } else {
      // 正常的组合/分解逻辑
      setIsComposed(newState);
      
      console.log(`切换模型组合状态: ${isComposed} -> ${newState}`);
      
      // 检查必要条件
      if (!models.equipment || !CONFIG.EQUIPMENT_POSITION) {
        console.warn('设备模型或位置配置不存在，无法执行分解/组合操作');
        return;
      }
      
      if (!TWEEN) {
        console.warn('TWEEN库未正确加载，使用立即定位');
      }
      
      const { POSITION_SCALE, ANIMATION_DURATION } = CONFIG;
      let anyEquipmentFound = false;
      const animations = [];
      
      // 遍历设备位置配置
      Object.entries(CONFIG.EQUIPMENT_POSITION).forEach(([equipmentName, positionData]) => {
        try {
          const targetPosition = newState ? positionData.COMPOSE : positionData.DECOMPOSE;
          
          // 简化位置值
          const simplifiedPosition = {
            x: targetPosition.x / POSITION_SCALE.X_Y,
            y: targetPosition.y / POSITION_SCALE.X_Y,
            z: targetPosition.z / POSITION_SCALE.Z
          };
          
          console.log(`更新设备 ${equipmentName} 位置:`, simplifiedPosition);
          
          // 使用优化的设备查找策略
          const foundMesh = findEquipmentMesh(equipmentName, positionData.meshNames || []);
          
          if (foundMesh) {
            anyEquipmentFound = true;
            
            // 创建动画并添加到动画列表
            if (TWEEN) {
              const animation = new TWEEN.Tween(foundMesh.position)
                .to(simplifiedPosition, ANIMATION_DURATION)
                .easing(TWEEN.Easing.Quadratic.InOut);
              animations.push(animation);
              
              console.log(`成功为设备 ${equipmentName} (${foundMesh.name}) 创建动画`);
            } else {
              // 不使用动画，直接设置位置
              foundMesh.position.set(simplifiedPosition.x, simplifiedPosition.y, simplifiedPosition.z);
            }
          } else {
            console.warn(`未找到与设备名称 "${equipmentName}" 匹配的网格`);
          }
        } catch (error) {
          console.error(`处理设备 ${equipmentName} 时出错:`, error);
        }
      });
      
      // 启动所有动画
      animations.forEach(animation => animation.start());
      
      // 如果没有找到任何设备，提供备选方案
      if (!anyEquipmentFound) {
        console.warn('未找到任何可更新位置的设备，可能是设备名称与模型网格名称不匹配');
        provideFallbackComposition(newState);
      }
      
      // 确保在模型位置变化后重新聚焦
      setTimeout(() => {
        if (fitModelsToView && Object.keys(models).length > 0) {
          fitModelsToView(Object.values(models), 0.3);
        } else {
          focusOnModels();
        }
      }, ANIMATION_DURATION + 100);
    }
  }, [models, isComposed, TWEEN, fitModelsToView, findEquipmentMesh, provideFallbackComposition, eqDecomposeAnimation, isAnimation]);

  // 查找设备网格 - 优化版
//   const findEquipmentMesh = useCallback((equipmentName, meshNames = []) => {
//     if (!models.equipment) return null;
    
//     let foundMesh = null;
//     const equipmentNameLower = equipmentName.toLowerCase();
    
//     // 首先尝试使用精确的网格名称列表匹配
//     if (meshNames.length > 0) {
//       models.equipment.traverse((mesh) => {
//         if (mesh.isMesh && !foundMesh) {
//           const meshNameLower = mesh.name.toLowerCase();
//           const isMatch = meshNames.some(name => 
//             meshNameLower.includes(name.toLowerCase())
//           );
          
//           if (isMatch) {
//             foundMesh = mesh;
//           }
//         }
//       });
//     }
    
//     // 如果没有找到，使用宽松的匹配策略
//     if (!foundMesh) {
//       models.equipment.traverse((mesh) => {
//         if (mesh.isMesh && !foundMesh) {
//           const meshNameLower = mesh.name.toLowerCase();
//           // 尝试多种匹配策略
//           const nameMatches = 
//             meshNameLower.includes(equipmentNameLower) || 
//             equipmentNameLower.includes(meshNameLower);
            
//           if (nameMatches) {
//             foundMesh = mesh;
//           }
//         }
//       });
//     }
    
//     return foundMesh;
//   }, [models]);

  // 注意：provideFallbackComposition、focusOnModels、applySafeCameraPosition和verifyCameraFocus函数已移至文件上方以解决初始化顺序问题

  // 只在组件挂载时加载一次模型
  useEffect(() => {
    const loadModelsOnce = async () => {
      console.log('检查是否需要加载模型:', { threeLoading, isReady, modelsCount: Object.keys(models).length });
      if (!threeLoading && isReady && Object.keys(models).length === 0) {
        await handleLoadAllModels();
      }
    };
    
    loadModelsOnce();
    
  }, [isReady, threeLoading]);

  useEffect(() => {
    return () => {
      console.log('组件卸载时清理动画资源');
      // 清理所有扇叶动画
      fanBladeAnimationIds.current?.forEach((_, key) => {
        removeRenderMixin(key);
      });
      fanBladeAnimationIds.current?.clear();
    };
  }, [])

  // 当模型状态变化时聚焦到模型
  useEffect(() => {
    console.log('模型状态变化，当前模型数量:', Object.keys(models).length);
    // 当所有模型加载完成后，聚焦到模型
    if (Object.keys(models).length > 0 && isReady) {
      // 延迟更长时间，确保模型完全加载和显示
      setTimeout(() => {
        console.log('执行模型聚焦...');
        // focusOnModels();
      }, 1000);
    }
  }, [models, isReady]);
  
  // 监听模型加载完成的状态变化，额外添加一层保障
  useEffect(() => {
    if (isReady && threeLoading === false && Object.keys(models).length > 0) {
      console.log('模型已加载完成并准备就绪，确保相机正确聚焦');
      // 再次调用focusOnModels以确保模型在视野中
      setTimeout(() => {
        focusOnModels();
      }, 1500);
    }
  }, [isReady, threeLoading, Object.keys(models).length]);

  // 标签显示/隐藏控制
  useEffect(() => {
    if (showLabels && isReady && Object.keys(models).length > 0) {
      createEquipmentLabels();
    } else {
      cleanupEquipmentLabels();
    }
  }, [showLabels, isReady, models, createEquipmentLabels, cleanupEquipmentLabels]);

  // 告警效果模拟
  const toggleAlarmSimulation = useCallback(() => {
    if (alarmEquipment.length > 0) {
      setAlarmEquipment([]);
    } else {
      // 选择一些设备进行告警模拟
      const sampleEquipment = Object.keys(CONFIG.EQUIPMENT_POSITION).slice(0, 2);
      setAlarmEquipment(sampleEquipment);
    }
  }, [alarmEquipment]);

  // 组件卸载时清理所有资源
  useEffect(() => {
    return () => {
      cleanupAllAnimations();
    };
  }, [cleanupAllAnimations]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 3D渲染容器 */}
      
      
      {/* 控制面板 */}
      {isReady && (
        <div style={{
          padding: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <button 
            onClick={toggleModelComposition} 
            disabled={loadingModels || Object.keys(models).length === 0 || isAnimation}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (loadingModels || isAnimation) ? 'not-allowed' : 'pointer'
            }}
          >
            {isComposed ? '分解模型' : '组合模型'}
          </button>
          
          <button 
            onClick={openingAnimation} 
            disabled={loadingModels || Object.keys(models).length === 0 || isAnimation}
            style={{
              padding: '8px 16px',
              backgroundColor: '#673ab7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (loadingModels || isAnimation) ? 'not-allowed' : 'pointer'
            }}
          >
            开场动画
          </button>
          
          <button 
            onClick={focusOnModels} 
            disabled={loadingModels || Object.keys(models).length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: '#34a853',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingModels ? 'not-allowed' : 'pointer'
            }}
          >
            聚焦模型
          </button>
          
          <button 
            onClick={() => setShowLabels(!showLabels)} 
            disabled={loadingModels || Object.keys(models).length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: showLabels ? '#ea4335' : '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingModels ? 'not-allowed' : 'pointer'
            }}
          >
            {showLabels ? '隐藏标签' : '显示标签'}
          </button>
          
          <button 
            onClick={toggleAlarmSimulation} 
            disabled={loadingModels || Object.keys(models).length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: alarmEquipment.length > 0 ? '#ea4335' : '#fbbc04',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingModels ? 'not-allowed' : 'pointer'
            }}
          >
            {alarmEquipment.length > 0 ? '清除告警' : '模拟告警'}
          </button>
          
          <button 
            onClick={handleLoadAllModels} 
            disabled={loadingModels}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingModels ? 'not-allowed' : 'pointer'
            }}
          >
            重新加载模型
          </button>
          
          <div style={{ marginLeft: 'auto', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {loadingModels ? '加载中...' : (
              <>
                <div>模型状态: {isComposed ? '组合' : '分解'}</div>
                {alarmEquipment.length > 0 && (
                  <div style={{ color: '#ea4335', fontSize: '12px' }}>
                    告警设备: {alarmEquipment.join(', ')}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#000'
        }}
      >
        {(!isReady || loadingModels) && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '18px',
            textAlign: 'center'
          }}>
            {!isReady ? '初始化Three.js环境...' : '加载模型中...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MfModel;