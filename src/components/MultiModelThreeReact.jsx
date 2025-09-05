import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
  // const [showAxes, setShowAxes] = useState(true);
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

  const loadingProgress = useMemo(() => {
    return Number((loadedModels / totalModels) * 100).toFixed(2)
  }, [loadedModels, totalModels])
  

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
      position: [-60, 0, 0],
      rotation: [0, 0, 0],
      scale: [0.5, 0.5, 0.5],
      name: '基础模型',
      type: 'glb',
      hasRoadAnimation: true // 标记该模型包含道路箭头动画
    },
    {
      id: 'devices',
      path: '/assets/devices.glb',
      position: [-60, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      name: '设备模型',
      type: 'glb'
    },
    // gltf 模型
    {
      id: 'lines',
      path: '/assets/lines.gltf',
      position: [-60, 0, 0],
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
    // 默认加载全部
    handleLoadAllModels()
  }, [isReady, showGrid, showAxes, autoRotate, scene, controls]);

  // 初始化模型配置
  useEffect(() => {
    setModelConfigs(modelData);
    setTotalModels(modelData.length);
  }, []);

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

  // 加载单个模型
  const loadSingleModel = async (config) => {
    console.log({config})
    try {
      setError(null);
      
      let loadedModel = null;
      
      if (config.type === 'obj_mtl') {
        await loadOBJModel(
          config.path,
          config.mtlPath,
          {
            position: config.position || [0, 0, 0],
            scale: config.scale || [1, 1, 1],
            rotation: config.rotation || [0, 0, 0],
            name: config.name
          }
        );
      } else if (config.type === 'glb' || config.type === 'gltf') {
        const object = await loadGltf(config.path);
        
        // 设置模型属性
        if (object && object.scene) {
          if (config.position) object.scene.position.set(...config.position);
          if (config.scale) object.scene.scale.set(...config.scale);
          if (config.rotation) object.scene.rotation.set(...config.rotation);
        }
        
        // 如果是基础模型且需要道路动画，直接使用gltf.scene添加动画（参考GLTFViewerExample.jsx的方式）
        if (config.hasRoadAnimation && object && object.scene) {
          // 延迟添加动画以确保模型完全加载
          setTimeout(() => {
            // 创建临时模型对象，直接传递scene给动画函数
            const tempModel = { object: object.scene };
            addRoadArrowAnimation(tempModel);
          }, 500); // 增加延迟时间确保模型完全加载
        }
      }
      
      setLoadedModels(prev => prev + 1);
      // setLoadingProgress(Math.round((loadedModels + 1) / totalModels * 100));
      
      console.log(`${config.name} 加载成功`);
    } catch (error) {
      console.error(`加载模型 ${config.name} 出错:`, error);
      setError(`加载模型 ${config.name} 失败: ${error.message || '未知错误'}`);
    }
  };

  // 加载所有模型
  const handleLoadAllModels = async () => {
    try {
      setError(null);
      // setLoadingProgress(0);
      setLoadedModels(0);
      setAllModelsLoaded(false);
      
      // 先清空现有模型
      handleRemoveAllModels();
      
      // 逐个加载模型
      for (const config of modelConfigs) {
        await loadSingleModel(config);
      }
      
      setAllModelsLoaded(true);
      
      // 调整相机位置以更好地查看所有模型
      adjustCameraForAllModels();
      
      console.log('所有模型加载成功');
    } catch (error) {
      console.error('加载模型出错:', error);
      setError(`加载模型失败: ${error.message || '未知错误'}`);
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
      
      // 调整相机位置
      adjustCameraForAllModels();
      
      console.log(`${selectedConfigs.length} 个选中的模型加载成功`);
    } catch (error) {
      console.error('加载选中的模型出错:', error);
      setError(`加载模型失败: ${error.message || '未知错误'}`);
    }
  };

  // 调整相机位置以查看所有模型
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
      cameraZ *= 1.5; // 增加一点距离，让视图更舒适
      
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
  const handleRemoveAllModels = () => {
    models.forEach(model => {
      removeModel(model.id);
    });
    setLoadedModels(0);
    // setLoadingProgress(0);
    setAllModelsLoaded(false);
  };

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
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
          border: '1px solid #00d4ff',
          borderRadius: '8px',
          maxHeight: '300px',
          overflowY: 'auto',
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 100,
          minWidth: '300px',
          maxWidth: '600px',
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
          <div style={{ marginTop: '10px', width: '100%' }}>
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
          <div style={{ color: '#ff3333', fontSize: '12px', marginTop: '24px', width: '100%' }}>
            {error}
          </div>
        )}
        
        {/* 加载完成提示 */}
        {allModelsLoaded && models.length > 0 && !loading && (
          <div style={{ color: '#00ff00', fontSize: '12px', marginTop: '24px', width: '100%' }}>
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
      </div>
      
      {/* 控制面板切换按钮 */}
      <button
        onClick={() => setShowControlPanel(!showControlPanel)}
        style={{
          position: 'absolute',
          top: '24px',
          right: '10px',
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