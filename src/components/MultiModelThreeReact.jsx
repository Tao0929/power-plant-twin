import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import { useThreeReact } from '../hook/useThreeReact';
import * as THREE from 'three';
import { useControls } from 'leva';
import { Loading } from '@jiaminghi/data-view-react';

/**
 * 使用 useThreeReact hook 渲染多个模型的组件
 * 支持 OBJ+MTL, GLB, GLTF 格式的模型
 */
export default function MultiModelThreeReact() {
  const containerRef = useRef(null);
  // const [loadingProgress, setLoadingProgress] = useState(0);
  const [totalModels, setTotalModels] = useState(0);
  const [loadedModels, setLoadedModels] = useState(0);
  const [error, setError] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [modelConfigs, setModelConfigs] = useState([]);
  const [selectedModels, setSelectedModels] = useState(new Set());
  const [allModelsLoaded, setAllModelsLoaded] = useState(false);
  // 控制悬浮控制面板的显示/隐藏
  const [showControlPanel, setShowControlPanel] = useState(false);
  // 用于网格和坐标轴的引用
  const gridHelperRef = useRef();
  const axesHelperRef = useRef();
  const resizeObserverRef = useRef(null);
  
  // 新增状态：当前显示的模型组类型
  const [currentModelGroup, setCurrentModelGroup] = useState('obj'); // 'obj' 或 'glb'
  // 新增状态：是否在内部视角
  const [isInternalView, setIsInternalView] = useState(false);
  // 新增状态：模型切换加载状态
  const [modelSwitchLoading, setModelSwitchLoading] = useState(false);
  // 存储当前加载的GLB模型引用
  const currentGlbModelsRef = useRef({});
  // 存储相机的外部视角位置
  const externalCameraPositionRef = useRef(null);
  // 存储相机的内部视角位置，用于返回时的平滑过渡
  const internalCameraPositionRef = useRef(null);
  
  // 存储最新的models引用，解决闭包问题
  const modelsRef = useRef([]);
  
  // 存储初始相机位置
  const initialCameraPositionRef = useRef(null);
  
  // 存储用户最后调整的相机位置
  const lastCameraPositionRef = useRef(null);
  // 控制是否在加载新模型后自动调整相机位置的状态
  const [autoAdjustCamera, setAutoAdjustCamera] = useState(false);
  
  // 新增状态：中心点位置
  const [centerPoint, setCenterPoint] = useState({ x: 0, y: 0, z: 0 });
  // 新增状态：是否执行相机旋转动画
  const [performCameraRotation, setPerformCameraRotation] = useState(false);
  // 存储当前正在进行的TWEEN动画
  const currentAnimationRef = useRef(null);

  // 使用 useThreeReact hook
  const {
    scene,
    camera,
    renderer,
    showAxes,
    controls,
    isReady,
    loading,
    models,
    loadOBJModel,
    loadGltf,
    removeModel,
    setBackgroundColor,
    addRenderMixin,
    removeRenderMixin,
  } = useThreeReact(containerRef);
  
  // 相机自动绕模型一周并聚焦到中心点的函数
  const cameraOrbitAndFocus = useCallback(() => {
    if (!camera || !controls || models.length === 0) return;
    
    // 先取消任何正在进行的动画
    if (currentAnimationRef.current) {
      currentAnimationRef.current.stop();
    }
    
    // 计算所有模型的包围盒和中心点
    const box = new THREE.Box3();
    models.forEach(model => {
      if (model && model.object) {
        box.expandByObject(model.object);
      }
    });
    
    if (box.min.x !== Infinity) {
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      // 设置中心点状态
      setCenterPoint({ x: center.x, y: center.y, z: center.z });
      
      // 计算合适的相机距离
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 0.7; // 调整相机距离，使模型显示适中
      
      // 获取相机当前位置
      const startPosition = camera.position.clone();
      
      // 创建旋转动画：从0度到45度
      let rotationProgress = 0;
      const rotationDuration = 3000; // 旋转一周的时间（毫秒）
      const startTime = Date.now();
      
      const animateRotation = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / rotationDuration, 1);
        
        // 使用平滑的缓动函数
        const easedProgress = TWEEN.Easing.Cubic.InOut(progress);
        rotationProgress = easedProgress * Math.PI * 0.25; // 270度 = 1.5π
        
        // 根据当前进度计算相机新位置（围绕Y轴旋转）
        const newX = center.x + cameraZ * Math.sin(rotationProgress);
        const newZ = center.z + cameraZ * Math.cos(rotationProgress);
        const newY = center.y + cameraZ / 2;
        
        // 更新相机位置
        camera.position.set(newX, newY, newZ);
        camera.lookAt(center);
        
        // 如果动画未完成，继续请求下一帧
        if (progress < 1) {
          requestAnimationFrame(animateRotation);
        } else {
          // 动画完成后，聚焦到模型中心点
          if (controls) {
            controls.target.set(center.x, center.y, center.z);
            controls.update();
          }
          setPerformCameraRotation(false);
        }
      };
      
      // 启动旋转动画
      animateRotation();
      
      // 存储当前动画引用，以便后续可能需要取消
      currentAnimationRef.current = { stop: () => {
        rotationProgress = Math.PI * 2; // 标记为已完成
      }};
    }
  }, [camera, controls, models, setCenterPoint]);
  
  // 确保modelsRef始终持有最新的models值
  useEffect(() => {
    modelsRef.current = models;
    console.log('models更新了:', models.length, '个模型');
  }, [models]);

  const loadingProgress = useMemo(() => {
    return Number((loadedModels / totalModels) * 100).toFixed(2)
  }, [loadedModels, totalModels])

  useEffect(() => {
    console.log({models})
  }, [models])
  

  const objModel = [
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

  const glbObj = [
    {
      id: 'base',
      path: '/assets/base.glb',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [0.5, 0.5, 0.5],
      name: '基础模型',
      type: 'glb',
      hasRoadAnimation: true // 标记该模型包含道路箭头动画
    },
    {
      id: 'devices',
      path: '/assets/devices.glb',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      name: '设备模型',
      type: 'glb'
    },
    // gltf 模型
    {
      id: 'lines',
      path: '/assets/lines.gltf',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      name: '线路模型',
      type: 'gltf'
    }
  ]
  
  // 模型配置数据 - 从 App.jsx 中提取
  const modelData = [
    // obj 模型
    ...objModel?.map(i => ({
      ...i,
      type: 'obj_mtl'
    })),
    // glb 模型
    // ...glbObj?.map(i => ({
    //   ...i,
    //   type: 'glb'
    // }))
  ];

  // 初始化网格和坐标轴
  useEffect(() => {
    if (!isReady || !scene) return;

    // 添加网格地面
    if (showGrid && !gridHelperRef.current) {
      gridHelperRef.current = new THREE.GridHelper(200, 200, '#00d4ff', '#333333');
      gridHelperRef.current.position.set(0, -0.01, 0); // 略微低于地面
      scene.add(gridHelperRef.current);
    }

    // 添加坐标轴
    if (showAxes && !axesHelperRef.current) {
      axesHelperRef.current = new THREE.AxesHelper(20);
      scene.add(axesHelperRef.current);
    }

    // 移除网格地面
    if (!showGrid && gridHelperRef.current) {
      scene.remove(gridHelperRef.current);
      gridHelperRef.current = null;
    }

    // 移除坐标轴
    if (!showAxes && axesHelperRef.current) {
      scene.remove(axesHelperRef.current);
      axesHelperRef.current = null;
    }

    // 设置自动旋转
    if (controls) {
      controls.autoRotate = autoRotate;
    }
    
    // 添加点击事件监听器
    if (containerRef.current) {
      containerRef.current.addEventListener('click', handleModelClick);
    }
    
    // 默认加载全部
    handleLoadAllModels();
    
    // 清理函数
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleModelClick);
      }
    };
  }, [isReady, showGrid, showAxes, autoRotate, scene, controls]);

  // 初始化模型配置 - 确保只初始化一次
  useEffect(() => {
    // 只有在modelConfigs为空时才设置，避免重复设置
    if (modelConfigs.length === 0) {
      setModelConfigs(modelData);
      setTotalModels(modelData.length);
      console.log(`初始化模型配置，总共${modelData.length}个模型`);
    }
  }, []);
  
  // 清理GLB模型
  const cleanupGlbModels = () => {
    if (scene) {
      Object.values(currentGlbModelsRef.current).forEach(({ object }) => {
        if (object && object.scene) {
          scene.remove(object.scene);
        }
      });
    }
    // 清空引用
    currentGlbModelsRef.current = {};
  };

  // 处理模型点击事件 - 增强版本，确保正确检测模型
  const handleModelClick = (event) => {
    console.log({event});
    console.log('Models数组长度:', models.length);
    console.log('isReady状态:', isReady);
    console.log('scene:', !!scene);
    console.log('camera:', !!camera);
    console.log('isInternalView:', isInternalView);
    console.log('isLoadingModels:', isLoadingModels);
    
    // 简化条件判断，确保点击事件能够被触发
    if (!isReady || !scene || !camera || isInternalView || isLoadingModels) return;

    // 计算鼠标在屏幕上的位置
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    // 创建射线投射器
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // 检查models数组是否有效
    if (!Array.isArray(models)) {
      console.error('models不是数组:', typeof models);
      return;
    }

    // 使用更直接的方式检测模型 - 直接检查models数组中的模型
    let foundTargetModel = false;
    
    // 方式1: 直接检查models数组中的模型
    const currentModels = modelsRef.current;
    console.log('点击检测时的模型数量:', currentModels.length);
    for (const model of currentModels) {
      if (model && model.object) {
        const intersects = raycaster.intersectObject(model.object, true);
        if (intersects.length > 0) {
          console.log('检测到模型点击:', model.name, '路径:', model.path);
          console.log('模型ID(userData):', model.object.userData?.modelId);
          
          // 使用多种方式检测目标模型
          const isTargetModel = 
            // 方式1: 检查模型路径是否包含特定文件名
            model.path.includes('substation_ht_1005_02.obj') ||
            // 方式2: 检查模型对象的userData中的modelId
            (model.object.userData && model.object.userData.modelId === 'substation02') ||
            // 方式3: 检查配置中的id
            (model.config && model.config.id === 'substation02');
            
          if (isTargetModel) {
            enterBuildingInternalView();
            foundTargetModel = true;
            break;
          }
        }
      }
    }

    // 如果models数组为空或通过models数组没找到，尝试直接从场景中检测
    if (!foundTargetModel && models.length === 0) {
      console.log('models数组为空，尝试直接从场景中检测模型');
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        console.log('从场景中检测到点击:', clickedObject.name);
        console.log('点击对象的userData:', clickedObject.userData);
        
        // 检查当前对象和父对象是否有模型ID
        let currentObj = clickedObject;
        while (currentObj && currentObj !== scene) {
          if (currentObj.userData && 
              (currentObj.userData.modelId === 'substation02' || 
               (currentObj.userData.config && currentObj.userData.config.id === 'substation02') ||
               (currentObj.parent && currentObj.parent.userData && currentObj.parent.userData.modelId === 'substation02'))) {
            enterBuildingInternalView();
            foundTargetModel = true;
            break;
          }
          currentObj = currentObj.parent;
        }
      }
    }

    // 如果通过models数组没找到，再尝试原来的方式
    if (!foundTargetModel) {
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        
        // 检查当前对象和父对象是否有模型ID
        let currentObj = clickedObject;
        while (currentObj && currentObj !== scene) {
          if (currentObj.userData && currentObj.userData.modelId === 'substation02') {
            enterBuildingInternalView();
            break;
          }
          currentObj = currentObj.parent;
        }
      }
    }
  };
  
  // 进入建筑内部视角
  const enterBuildingInternalView = async () => {
    if (!isReady || !camera || !controls) return;
    try {
      // 显示加载状态
      setError(null);
      setModelSwitchLoading(true);
      
      // 记录当前相机位置作为外部视角
      if (!externalCameraPositionRef.current) {
        externalCameraPositionRef.current = {
          position: camera.position.clone(),
          target: controls.target.clone()
        };
      }
      
      // 清理之前可能加载的GLB模型
      cleanupGlbModels();

      // 加载新的GLB模型
      for (const config of glbObj) {
        const object = await loadGltf(config.path);
        
        // 设置模型属性
        if (object && object.scene) {
          if (config.position) object.scene.position.set(...config.position);
          if (config.scale) object.scene.scale.set(...config.scale);
          if (config.rotation) object.scene.rotation.set(...config.rotation);
          
          // 为场景对象添加模型ID标识
          object.scene.userData = {
            ...object.scene.userData,
            modelId: config.id,
            config: config
          };
          
          // 先隐藏，等动画完成后再显示
          object.scene.visible = false;
          
          // 添加到场景
          scene.add(object.scene);
          
          // 如果是基础模型且需要道路动画，直接使用gltf.scene添加动画
          if (config.hasRoadAnimation) {
            // 延迟添加动画以确保模型完全加载
            setTimeout(() => {
              const tempModel = { object: object.scene };
              addRoadArrowAnimation(tempModel);
            }, 500);
          }
        }
        
        // 存储加载的模型
        currentGlbModelsRef.current[config.id] = { object, config };
      }
      
      console.log('GLB模型加载完成');
      
      // 执行相机动画，移动到内部视角
      await animateCameraToInternal();
      
      // 动画完成后显示模型
      Object.values(currentGlbModelsRef.current).forEach(({ object }) => {
        if (object && object.scene) {
          object.scene.visible = true;
        }
      });
      
      // 使用modelsRef.current获取最新的models值
      const currentModels = modelsRef.current;
      console.log('进入内部视角时的模型数量:', currentModels.length);
      
      // 隐藏所有OBJ模型
      currentModels.forEach(model => {
        if (model && model.object && model.modelType === 'obj') {
          model.object.visible = false;
        }
      });
      

      // 存储内部视角位置，用于返回时的平滑过渡
      internalCameraPositionRef.current = {
        position: camera.position.clone(),
        target: controls.target.clone()
      };
      
      
      setCurrentModelGroup('glb');
      setIsInternalView(true);
      
    } catch (error) {
      console.error('进入内部视角出错:', error);
      setError(`进入内部视角失败: ${error.message || '未知错误'}`);
      
      // 出错时恢复OBJ模型显示
      const currentModels = modelsRef.current;
      currentModels.forEach(model => {
        if (model && model.object) {
          model.object.visible = true;
        }
      });
    } finally {
      // 无论成功失败，都隐藏加载状态
      setModelSwitchLoading(false);
    }
  };
  
  // 返回外部视角
  const returnToExternalView = async () => {
    if (!isReady || !camera || !controls || !externalCameraPositionRef.current) return;
    
    try {
      // 显示加载状态
      setError(null);
      setModelSwitchLoading(true);
      // 显示所有OBJ模型
      const currentModels = modelsRef.current;
      currentModels.forEach(model => {
        if (model && model.object) {
          model.object.visible = true;
        }
      });
      
      setCurrentModelGroup('obj');
      setIsInternalView(false);

      // 先隐藏GLB模型
      Object.values(currentGlbModelsRef.current).forEach(({ object }) => {
        if (object && object.scene) {
          object.scene.visible = false;
        }
      });
      
      // 执行相机动画，移动回外部视角
      await animateCameraToExternal();
      
      // 动画完成后清理GLB模型
      cleanupGlbModels();
      
    } catch (error) {
      console.error('返回外部视角出错:', error);
      setError(`返回外部视角失败: ${error.message || '未知错误'}`);
    } finally {
      // 无论成功失败，都隐藏加载状态
      setModelSwitchLoading(false);
    }
  };
  
  // 相机动画：移动到内部视角 - 调整为拉远并从斜上方查看的运镜效果
  const animateCameraToInternal = () => {
    return new Promise((resolve) => {
      if (!camera || !controls) return resolve();
      
      // 停止之前的所有动画
      TWEEN.removeAll();
      
      // 内部视角的目标位置和目标点 - 调整为斜上方查看，实现运镜效果
      const targetPosition = new THREE.Vector3(10, 10, 10); // 拉远并从斜上方查看
      const targetLookAt = new THREE.Vector3(0, 0, 0);  // 看向建筑中心
      
      // 创建位置动画 - 延长时间至3秒以获得更流畅的运镜效果
      const positionTween = new TWEEN.Tween(camera.position)
        .to(targetPosition, 3000) // 3秒的动画，增强运镜效果
        .easing(TWEEN.Easing.Quadratic.InOut);
      
      // 创建目标点动画
      const lookAtTween = new TWEEN.Tween(controls.target)
        .to(targetLookAt, 3000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
          controls.update();
        })
        .onComplete(() => {
          resolve();
        });
      
      // 启动动画
      positionTween.start();
      lookAtTween.start();
    });
  };
  
  // 相机动画：移动回外部视角
  const animateCameraToExternal = () => {
    return new Promise((resolve) => {
      if (!camera || !controls || !externalCameraPositionRef.current) return resolve();
      
      // 停止之前的所有动画
      TWEEN.removeAll();
      
      // 创建位置动画
      const positionTween = new TWEEN.Tween(camera.position)
        .to(externalCameraPositionRef.current.position, 2000) // 2秒的动画
        .easing(TWEEN.Easing.Quadratic.InOut);
      
      // 创建目标点动画
      const lookAtTween = new TWEEN.Tween(controls.target)
        .to(externalCameraPositionRef.current.target, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
          controls.update();
        })
        .onComplete(() => {
          resolve();
        });
      
      // 启动动画
      positionTween.start();
      lookAtTween.start();
    });
  };
  
  // 添加道路箭头动画
  const addRoadArrowAnimation = (model) => {
    if (!model || !model.object) return;
    
    const animatedTextures = [];
    let foundTextures = 0;
    
    // 递归遍历模型，只查找名称包含"道路箭头"的网格
    model.object.traverse((mesh) => {
      // 只处理名称包含"道路箭头"的网格
      if (mesh.name && mesh.name.includes('道路箭头')) {
        console.log('找到道路箭头网格:', mesh.name);
        
        // 检查材质和纹理
        if (mesh.material) {
          // 处理材质数组情况
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material, index) => {
              if (material && material.map) {
                animatedTextures.push(material.map);
                foundTextures++;
                console.log(`网格 ${mesh.name} 的材质 ${index} 包含纹理`);
              }
            });
          } else if (mesh.material.map) {
            // 处理单一材质情况
            animatedTextures.push(mesh.material.map);
            foundTextures++;
            console.log(`网格 ${mesh.name} 包含纹理`);
          }
        }
      }
    });
    
    console.log(`总共找到 ${foundTextures} 个道路箭头纹理`);
    
    if (animatedTextures.length > 0 && addRenderMixin) {
      // 创建动画函数
      const animation = () => {
        animatedTextures.forEach((texture, index) => {
          if (texture && texture.offset) {
            // 对不同纹理应用适当的动画速度
            const speed = 0.01;
            texture.offset.y = (texture.offset.y + speed) % 1;
            // 确保纹理更新被标记
            if (texture.needsUpdate !== undefined) {
              texture.needsUpdate = true;
            }
          }
        });
      };
      
      // 添加动画到渲染循环
      addRenderMixin('road-arrow', animation);
      console.log('已添加道路箭头动画，共', animatedTextures.length, '个纹理将被动画化');
    } else {
      console.log('未找到可动画的道路箭头纹理');
    }
  };

  // 加载单个模型 - 增强版本，确保正确加载和引用
  const loadSingleModel = async (config) => {
    console.log('加载模型配置:', config);
    try {
      setError(null);
      
      // 确保模型配置有正确的ID
      console.log('加载模型ID:', config.id);
      
      if (config.type === 'obj_mtl') {
        console.log('开始加载OBJ模型:', config.path);
        // 调用loadOBJModel并存储返回的模型对象
        const model = await loadOBJModel(
          config.path,
          config.mtlPath,
          {
            position: config.position || [0, 0, 0],
            scale: config.scale || [1, 1, 1],
            rotation: config.rotation || [0, 0, 0],
            name: config.name
          }
        );
        
        // 为模型添加明确的ID标识，便于后续识别
        if (model && model.object) {
          model.object.userData = {
            ...model.object.userData,
            modelId: config.id,
            config: config
          };
        }
      } else if (config.type === 'glb' || config.type === 'gltf') {
        console.log('开始加载GLB/GLTF模型:', config.path);
        const object = await loadGltf(config.path);
        
        // 设置模型属性
        if (object && object.scene) {
          if (config.position) object.scene.position.set(...config.position);
          if (config.scale) object.scene.scale.set(...config.scale);
          if (config.rotation) object.scene.rotation.set(...config.rotation);
          
          // 为场景对象添加模型ID标识
          object.scene.userData = {
            ...object.scene.userData,
            modelId: config.id,
            config: config
          };
        }
        
        // 如果是基础模型且需要道路动画，直接使用gltf.scene添加动画
        if (config.hasRoadAnimation && object && object.scene) {
          // 延迟添加动画以确保模型完全加载
          setTimeout(() => {
            const tempModel = { object: object.scene };
            addRoadArrowAnimation(tempModel);
          }, 500);
        }
      }
      
      setLoadedModels(prev => {
        const newData = prev + 1
        console.log({newData})
        console.log(`${config.name} 加载成功，当前已加载 ${newData}/${totalModels}`);
        return newData
      });
    } catch (error) {
      console.error(`加载模型 ${config.name} 出错:`, error);
      setError(`加载模型 ${config.name} 失败: ${error.message || '未知错误'}`);
    }
  };
  
  // 使用状态标志来防止重复加载模型
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // 修复models数组为空的问题 - 确保在组件挂载时正确加载模型
  useEffect(() => {
    // 等待useThreeReact初始化完成
    const timer = setTimeout(() => {
      console.log('检查模型加载状态，当前models长度:', models.length);
      console.log('当前totalModels:', totalModels);
      
      // 如果models为空但应该有模型，尝试重新加载
      if (models.length === 0 && totalModels > 0 && isReady && !isLoadingModels) {
        console.log('检测到models为空，尝试重新加载所有模型');
        handleLoadAllModels();
      }
    }, 1000); // 延迟1秒，确保useThreeReact完全初始化
    
    return () => clearTimeout(timer);
  }, [isReady, models.length, totalModels, isLoadingModels]);

  // 移除所有模型 - 优化版本，确保安全移除
  const handleRemoveAllModels = () => {
    const currentModels = modelsRef.current;
    console.log('清理所有模型，当前models数量:', currentModels.length);
    // 创建副本以避免在遍历时修改数组
    const modelsCopy = [...currentModels];
    modelsCopy.forEach(model => {
      try {
        if (model && model.id !== undefined) {
          removeModel(model.id);
        }
      } catch (error) {
        console.error('移除模型出错:', error);
      }
    });
    setLoadedModels(0);
    setAllModelsLoaded(false);
  };

  // 加载所有模型 - 防止重复加载版本
  const handleLoadAllModels = async () => {
    // 如果已经在加载中，防止重复调用
    if (isLoadingModels) {
      console.log('模型加载已在进行中，防止重复加载');
      return;
    }
    
    try {
      setIsLoadingModels(true);
      setError(null);
      setLoadedModels(0);
      setAllModelsLoaded(false);
      
      // 先清空现有模型
      handleRemoveAllModels();
      
      // 逐个加载模型
      console.log(`开始加载${modelConfigs.length}个模型`);
      for (const config of modelConfigs) {
        await loadSingleModel(config);
      }
      
      setAllModelsLoaded(true);
      
      // 保存初始相机位置
      if (!initialCameraPositionRef.current) {
        initialCameraPositionRef.current = {
          position: camera.position.clone(),
          target: controls.target.clone()
        };
        console.log('已保存初始相机位置');
      }
      
      // 只有在autoAdjustCamera为true时才自动调整相机位置
      if (autoAdjustCamera) {
        adjustCameraForAllModels();
      } else if (lastCameraPositionRef.current) {
        // 优先使用用户最后调整的相机位置
        camera.position.copy(lastCameraPositionRef.current.position);
        controls.target.copy(lastCameraPositionRef.current.target);
        controls.update();
      } else if (initialCameraPositionRef.current) {
        // 否则使用初始相机位置
        camera.position.copy(initialCameraPositionRef.current.position);
        controls.target.copy(initialCameraPositionRef.current.target);
        controls.update();
      }
      
      console.log(`所有模型加载成功(${models.length})`);
    } catch (error) {
      console.error('加载模型出错:', error);
      setError(`加载模型失败: ${error.message || '未知错误'}`);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // 加载选中的模型
  const handleLoadSelectedModels = async () => {
    try {
      setError(null);
      // setLoadingProgress(0);
      setLoadedModels(0);
      setAllModelsLoaded(false);
      
      const selectedConfigs = modelConfigs.filter(config => 
        selectedModels.has(config.id)
      );
      
      if (selectedConfigs.length === 0) {
        setError('请先选择要加载的模型');
        return;
      }
      
      setTotalModels(selectedConfigs.length);
      
      // 先清空现有模型
      handleRemoveAllModels();
      
      // 逐个加载选中的模型
      for (const config of selectedConfigs) {
        await loadSingleModel(config);
      }
      
      setAllModelsLoaded(true);
      
      // 只有在autoAdjustCamera为true时才自动调整相机位置
      if (autoAdjustCamera) {
        adjustCameraForAllModels();
      } else if (lastCameraPositionRef.current) {
        // 优先使用用户最后调整的相机位置
        camera.position.copy(lastCameraPositionRef.current.position);
        controls.target.copy(lastCameraPositionRef.current.target);
        controls.update();
      } else if (initialCameraPositionRef.current) {
        // 否则使用初始相机位置
        camera.position.copy(initialCameraPositionRef.current.position);
        controls.target.copy(initialCameraPositionRef.current.target);
        controls.update();
      }
      
      console.log(`${selectedConfigs.length} 个选中的模型加载成功`);
    } catch (error) {
      console.error('加载选中的模型出错:', error);
      setError(`加载模型失败: ${error.message || '未知错误'}`);
    }
  };

  // 调整相机位置以查看所有模型 - 修改为直接显示更大视图
  const adjustCameraForAllModels = useCallback(() => {
    if (!camera || models.length === 0) return;
    
    // 计算所有模型的包围盒
    const box = new THREE.Box3();
    
    models.forEach(model => {
      if (model && model.object) {
        box.expandByObject(model.object);
      }
    });
    
    // 如果包围盒有效，调整相机位置
    if (box.min.x !== Infinity) {
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      // 计算合适的相机距离
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 0.7; // 调整相机距离，使模型显示适中 (从0.5调整为0.7，向后调整)
      
      // 设置相机位置和目标
      camera.position.set(center.x + cameraZ, center.y + cameraZ / 2, center.z + cameraZ);
      camera.lookAt(center);
      
      // 更新控制器目标
      if (controls) {
        controls.target.set(center.x, center.y, center.z);
        controls.update();
      }
    }
  }, [camera, models, controls]);

  // 监听相机控制变化，保存用户调整后的相机位置
  useEffect(() => {
    if (!isReady || !controls) return;
    
    // 保存相机位置的函数
    const saveCameraPosition = () => {
      if (camera && controls) {
        lastCameraPositionRef.current = {
          position: camera.position.clone(),
          target: controls.target.clone()
        };
      }
    };
    
    // 监听控制变化事件
    controls.addEventListener('change', saveCameraPosition);
    
    return () => {
      controls.removeEventListener('change', saveCameraPosition);
    };
  }, [isReady, camera, controls]);
  
  // 监听中心点变化，更新相机控制器的target
  useEffect(() => {
    if (!isReady || !controls) return;
    
    // 更新控制器目标点
    controls.target.set(centerPoint.x, centerPoint.y, centerPoint.z);
    controls.update();
    
  }, [isReady, controls, centerPoint]);
  
  // 监听模型加载完成事件，启动相机旋转动画
  useEffect(() => {
    if (allModelsLoaded && models.length > 0) {
      // 延迟一小段时间，确保模型完全加载和渲染
      const timer = setTimeout(() => {
        cameraOrbitAndFocus();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [allModelsLoaded, models.length, cameraOrbitAndFocus]);
  
  // 监听容器尺寸变化
  useEffect(() => {
    if (!containerRef.current || !isReady || !renderer) return;

    // 调整渲染器大小的函数
    const handleContainerResize = () => {
      // 调整渲染器大小以匹配容器
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      if (renderer && camera) {
        // 调整相机宽高比
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        // 调整渲染器大小
        renderer.setSize(width, height);
        
        // 调整相机位置以适应新的容器大小
        if (models.length > 0) {
          adjustCameraForAllModels();
        }
      }
    };

    // 创建 ResizeObserver
    resizeObserverRef.current = new ResizeObserver(handleContainerResize);

    // 开始观察容器尺寸变化
    resizeObserverRef.current.observe(containerRef.current);
    
    // 初始调整一次
    handleContainerResize();

    // 清理函数
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [isReady, adjustCameraForAllModels, models.length, renderer, camera]);

  // 移除所有模型
  // const handleRemoveAllModels = () => {
  //   models.forEach(model => {
  //     removeModel(model.id);
  //   });
  //   setLoadedModels(0);
  //   // setLoadingProgress(0);
  //   setAllModelsLoaded(false);
  // };

  // 切换模型选择
  const toggleModelSelection = (modelId) => {
    const newSelectedModels = new Set(selectedModels);
    if (newSelectedModels.has(modelId)) {
      newSelectedModels.delete(modelId);
    } else {
      newSelectedModels.add(modelId);
    }
    setSelectedModels(newSelectedModels);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedModels.size === modelConfigs.length) {
      setSelectedModels(new Set());
    } else {
      setSelectedModels(new Set(modelConfigs.map(model => model.id)));
    }
  };

  // 更改背景色
  const handleChangeBackgroundColor = () => {
    const colors = ['#131323', '#0a0a0a', '#1a1a2e', '#16213e', '#0f3460', '#16213e'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setBackgroundColor(randomColor);
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#00d4ff',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#333',
    color: '#00d4ff'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ff3333',
    color: '#fff'
  };

  const selectStyle = {
    padding: '6px',
    backgroundColor: '#222',
    color: '#00d4ff',
    border: '1px solid #00d4ff',
    borderRadius: '4px',
    fontSize: '12px'
  };

  const checkboxStyle = {
    accentColor: '#00d4ff'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* 悬浮控制面板 */}
      {showControlPanel && (
        <div style={{
          padding: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
          border: '1px solid #00d4ff',
          borderRadius: '8px',
          maxHeight: '400px',
          overflowY: 'auto',
          position: 'absolute',
          top: '50px',
          left: '10px',
          zIndex: 100,
          minWidth: '200px',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(0, 212, 255, 0.3)'
        }}>
        <button 
          onClick={handleLoadAllModels}
          disabled={loading || !isReady}
          style={buttonStyle}
        >
          {loading ? '加载中...' : '加载所有模型'}
        </button>
        
        <button 
          onClick={handleLoadSelectedModels}
          disabled={loading || !isReady || selectedModels.size === 0}
          style={secondaryButtonStyle}
        >
          加载选中模型 ({selectedModels.size})
        </button>
        
        <button 
          onClick={handleRemoveAllModels}
          disabled={!isReady || models.length === 0}
          style={dangerButtonStyle}
        >
          清空场景
        </button>
        
        <button 
          onClick={handleChangeBackgroundColor}
          disabled={!isReady}
          style={secondaryButtonStyle}
        >
          更换背景
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            id="showGrid"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            disabled={!isReady}
            style={checkboxStyle}
          />
          <label htmlFor="showGrid" style={{ color: '#00d4ff', fontSize: '12px', cursor: isReady ? 'pointer' : 'not-allowed' }}>
            显示网格
          </label>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            id="autoRotate"
            checked={autoRotate}
            onChange={(e) => setAutoRotate(e.target.checked)}
            disabled={!isReady}
            style={checkboxStyle}
          />
          <label htmlFor="autoRotate" style={{ color: '#00d4ff', fontSize: '12px', cursor: isReady ? 'pointer' : 'not-allowed' }}>
            自动旋转
          </label>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            id="autoAdjustCamera"
            checked={autoAdjustCamera}
            onChange={(e) => setAutoAdjustCamera(e.target.checked)}
            disabled={!isReady}
            style={checkboxStyle}
          />
          <label htmlFor="autoAdjustCamera" style={{ color: '#00d4ff', fontSize: '12px', cursor: isReady ? 'pointer' : 'not-allowed' }}>
            自动调整相机
          </label>
        </div>
        
        {/* 中心点调整控制 */}
        <div style={{ marginTop: '15px', width: '100%', borderTop: '1px solid #00d4ff', paddingTop: '10px' }}>
          <div style={{ color: '#00d4ff', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
            中心点调整
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <label style={{ color: '#00d4ff', fontSize: '11px', width: '20px' }}>X:</label>
            <input
              type="range"
              min="-50"
              max="50"
              step="0.1"
              value={centerPoint.x}
              onChange={(e) => setCenterPoint({ ...centerPoint, x: parseFloat(e.target.value) })}
              disabled={!isReady}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: '#333',
                outline: 'none',
                cursor: isReady ? 'pointer' : 'not-allowed'
              }}
            />
            <span style={{ color: '#00d4ff', fontSize: '10px', width: '30px' }}>
              {centerPoint.x.toFixed(1)}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <label style={{ color: '#00d4ff', fontSize: '11px', width: '20px' }}>Y:</label>
            <input
              type="range"
              min="-50"
              max="50"
              step="0.1"
              value={centerPoint.y}
              onChange={(e) => setCenterPoint({ ...centerPoint, y: parseFloat(e.target.value) })}
              disabled={!isReady}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: '#333',
                outline: 'none',
                cursor: isReady ? 'pointer' : 'not-allowed'
              }}
            />
            <span style={{ color: '#00d4ff', fontSize: '10px', width: '30px' }}>
              {centerPoint.y.toFixed(1)}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: '#00d4ff', fontSize: '11px', width: '20px' }}>Z:</label>
            <input
              type="range"
              min="-50"
              max="50"
              step="0.1"
              value={centerPoint.z}
              onChange={(e) => setCenterPoint({ ...centerPoint, z: parseFloat(e.target.value) })}
              disabled={!isReady}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: '#333',
                outline: 'none',
                cursor: isReady ? 'pointer' : 'not-allowed'
              }}
            />
            <span style={{ color: '#00d4ff', fontSize: '10px', width: '30px' }}>
              {centerPoint.z.toFixed(1)}
            </span>
          </div>
        </div>
        
        {/* 模型选择区域 */}
        <div style={{ marginTop: '10px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input 
              type="checkbox" 
              id="selectAll"
              checked={selectedModels.size === modelConfigs.length && modelConfigs.length > 0}
              onChange={toggleSelectAll}
              disabled={!isReady || modelConfigs.length === 0}
              style={checkboxStyle}
            />
            <label htmlFor="selectAll" style={{ color: '#00d4ff', fontSize: '12px', cursor: isReady ? 'pointer' : 'not-allowed' }}>
              全选/取消全选
            </label>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '100px', overflowY: 'auto' }}>
            {modelConfigs.map(model => (
              <div key={model.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input 
                  type="checkbox" 
                  id={`model-${model.id}`}
                  checked={selectedModels.has(model.id)}
                  onChange={() => toggleModelSelection(model.id)}
                  disabled={!isReady}
                  style={checkboxStyle}
                />
                <label 
                  htmlFor={`model-${model.id}`} 
                  style={{ color: '#00d4ff', fontSize: '11px', cursor: isReady ? 'pointer' : 'not-allowed' }}
                >
                  {model.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div> )}

      {/* 加载进度 */}
      {loading && (
        <div style={{ marginTop: '10px', width: '100%', }}>
          <div style={{ 
            height: '8px', 
            backgroundColor: '#333', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div 
              style={{
                height: '100%',
                width: `${loadingProgress}%`,
                backgroundColor: '#00d4ff',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <div style={{ color: '#00d4ff', fontSize: '11px', marginTop: '4px', textAlign: 'center' }}>
            加载进度: {loadingProgress}% ({loadedModels}/{totalModels})
          </div>
        </div>
      )}
      
      {/* 错误信息 */}
      {error && (
        <div style={{ color: '#ff3333', fontSize: '12px', marginTop: '0px', width: '100%' }}>
          {error}
        </div>
      )}
      
      {/* 加载完成提示 */}
      {allModelsLoaded && models.length > 0 && !loading && (
        <div style={{ color: '#00ff00', fontSize: '12px', marginTop: '0px', width: '100%' }}>
          所有模型加载完成！
        </div>
      )}

      {/* Three.js 渲染区域 */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: '#000',
          minHeight: '0' // 确保在flex容器中正确计算高度
        }}
      >
        {!isReady && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#00d4ff',
            fontSize: '14px'
          }}>
            Three.js 环境初始化中...
          </div>
        )}
        
        {/* 模型切换加载状态 */}
        {modelSwitchLoading && (
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 500
          }}>
            <div style={{
              textAlign: 'center',
              color: '#00d4ff'
            }}>
              <Loading />
              <div style={{
                marginTop: '20px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {isInternalView ? '正在返回外部视角...' : '正在进入内部视角...'}
              </div>
            </div>
          </div>
        )}
        
        {/* 内部视角返回按钮 */}
        {isInternalView && !modelSwitchLoading && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 100
          }}>
            <button 
              onClick={returnToExternalView}
              style={{
                padding: '10px 20px',
                backgroundColor: '#00d4ff',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0, 212, 255, 0.5)'
              }}
              title="返回外部视角"
            >
              ← 返回
            </button>
          </div>
        )}
      </div>
      
      {/* 控制面板切换按钮 */}
      <button
        onClick={() => setShowControlPanel(!showControlPanel)}
        style={{
          position: 'absolute',
          top: '32px',
          right: '8px',
          zIndex: 200,
          padding: '8px 12px',
          backgroundColor: '#00d4ff',
          color: '#000',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(0, 212, 255, 0.5)'
        }}
      >
        {showControlPanel ? '隐藏控制面板' : '显示控制面板'}
      </button>
    </div>
  );
}