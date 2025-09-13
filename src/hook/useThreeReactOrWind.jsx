import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OBJLoader } from 'three-stdlib';
import { MTLLoader } from 'three-stdlib';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import { useControls } from 'leva';

/**
 * React Three.js Hook - 封装了Three.js场景、相机、渲染器、控制器等初始化和管理
 * 适用于项目中需要使用原生Three.js而不是@react-three/fiber的场景
 * 
 * 主要功能：
 * - 自动初始化Three.js场景、相机、渲染器
 * - 提供OrbitControls控制器，支持3D交互
 * - 内置光源系统（环境光、方向光、点光源）
 * - 支持模型加载（GLTF、OBJ格式）
 * - 提供场景、相机、模型管理的API
 * - 包含动画混合器支持
 */
/**
 * useThreeReact Hook
 * 
 * @param {React.RefObject} containerRef - 用于挂载Three.js渲染器的DOM容器引用
 * @returns {Object} Three.js场景管理对象，包含场景、相机、渲染器等实例和控制方法
 */
export function useThreeReactOrWind(containerRef) {
  // Three.js核心对象引用
  const sceneRef = useRef(); // 3D场景引用
  const cameraRef = useRef(); // 相机引用
  const rendererRef = useRef(); // WebGL渲染器引用
  const cssRendererRef = useRef(); // CSS2D渲染器引用
  const controlsRef = useRef(); // 轨道控制器引用
  const animationIdRef = useRef(); // 动画帧ID引用
  
  // 状态管理
  const [isReady, setIsReady] = useState(false); // 场景是否初始化完成
  const [loading, setLoading] = useState(false); // 是否正在加载资源
  const [models, setModels] = useState([]); // 已加载的模型列表
  
  // 用于控制中心点拖动的状态
  const isSpacePressedRef = useRef(false); // 空格键是否按下
  const isDraggingRef = useRef(false); // 是否正在拖动
  const prevMousePosRef = useRef({ x: 0, y: 0 }); // 上一次鼠标位置
  
  // 高级功能支持
  const composers = useRef(new Map()); // 后处理效果合成器映射表
  const mixers = useRef([]); // 动画混合器数组
  const clock = useRef(new THREE.Clock()); // 用于动画计时的时钟
  const renderMixins = useRef(new Map()); // 自定义渲染混入函数映射表
  
  // 光照和辅助器引用
  const ambientLightRef = useRef(); // 环境光引用
  const directionalLightRef = useRef(); // 方向光引用
  const axesHelperRef = useRef(); // 坐标轴辅助器引用

  // 使用leva库提供的控制面板参数
  const ambientIntensity = 1.6
  const directionalIntensity = 2.5
  // const { ambientIntensity, directionalIntensity, showAxes } = useControls({
  //   ambientIntensity: { value: 1.2, min: 0, max: 2, step: 0.1 }, // 环境光强度
  //   directionalIntensity: { value: 2, min: 0, max: 3, step: 0.1 }, // 方向光强度
  //   showAxes: false // 是否显示坐标轴辅助器
  // });

  // 监听光照强度变化并更新场景
  useEffect(() => {
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = ambientIntensity;
    }
  }, [ambientIntensity]);

  // 监听方向光强度变化并更新场景
  useEffect(() => {
    if (directionalLightRef.current) {
      directionalLightRef.current.intensity = directionalIntensity;
    }
  }, [directionalIntensity]);

  // 监听是否显示坐标轴辅助器的变化
  // useEffect(() => {
  //   if (!sceneRef.current || !axesHelperRef.current) return;
    
  //   if (showAxes) {
  //     sceneRef.current.add(axesHelperRef.current);
  //   } else {
  //     sceneRef.current.remove(axesHelperRef.current);
  //   }
  // }, [showAxes]);

  // 初始化Three.js核心组件
  useEffect(() => {
    if (!containerRef.current) return;

    // 初始化 Three.js 场景
    sceneRef.current = new THREE.Scene();
    
    // 设置场景背景色（深蓝色，与项目整体风格保持一致）
    sceneRef.current.background = new THREE.Color('#131323');

    // 初始化透视相机
    cameraRef.current = new THREE.PerspectiveCamera(
      45, // 视野角度（FOV），较大的角度可以显示更多场景内容
      containerRef.current.clientWidth / containerRef.current.clientHeight, // 宽高比
      0.1, // 近裁剪平面
      10000 // 远裁剪平面
    );
    cameraRef.current.position.set(-15, 80, 15); // 设置相机初始位置（x,y,z）
    cameraRef.current.lookAt(0, 0, 0); // 相机看向原点

    // 初始化WebGL渲染器
    rendererRef.current = new THREE.WebGLRenderer({
      antialias: true, // 启用抗锯齿，使渲染更平滑
      alpha: true // 允许透明背景
    });
    rendererRef.current.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    rendererRef.current.setPixelRatio(window.devicePixelRatio); // 设置像素比例，提高高清屏幕显示效果
    rendererRef.current.shadowMap.enabled = true; // 启用阴影映射
    
    // 将渲染器DOM元素添加到容器
    containerRef.current.appendChild(rendererRef.current.domElement);
    
    // 初始化CSS2D渲染器（用于渲染HTML元素）
    cssRendererRef.current = new CSS2DRenderer();
    cssRendererRef.current.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    cssRendererRef.current.domElement.className = 'css2d-renderer';
    cssRendererRef.current.domElement.style.position = 'absolute';
    cssRendererRef.current.domElement.style.top = '0px';
    cssRendererRef.current.domElement.style.pointerEvents = 'none';
    containerRef.current.appendChild(cssRendererRef.current.domElement);

    // 初始化轨道控制器（用于交互操作）
    controlsRef.current = new OrbitControls(
      cameraRef.current,
      rendererRef.current.domElement
    );
    controlsRef.current.enablePan = true; // 允许平移
    controlsRef.current.enableZoom = true; // 允许缩放
    controlsRef.current.enableRotate = true; // 允许旋转
    controlsRef.current.minDistance = 5; // 最小缩放距离
    controlsRef.current.maxDistance = 100; // 最大缩放距离
    controlsRef.current.autoRotate = false; // 自动旋转
    controlsRef.current.autoRotateSpeed = 0.5; // 自动旋转速度
    controlsRef.current.target.set(0, 20, 0); // 控制器目标点
    
    // 添加基础光照（与项目风格保持一致）
    // 环境光 - 提供基础照明
    ambientLightRef.current = new THREE.AmbientLight(0xffffff, ambientIntensity);
    sceneRef.current.add(ambientLightRef.current);

    // 方向光 - 模拟阳光，产生阴影
    directionalLightRef.current = new THREE.DirectionalLight(0xffffff, directionalIntensity);
    directionalLightRef.current.position.set(10, 10, 5);
    directionalLightRef.current.castShadow = true;
    directionalLightRef.current.shadow.mapSize.set(2048, 2048); // 设置阴影贴图大小
    sceneRef.current.add(directionalLightRef.current);

    // 点光源 - 提供额外的蓝色高光
    const pointLight = new THREE.PointLight(0x00d4ff, 0.5);
    pointLight.position.set(0, 10, 0);
    sceneRef.current.add(pointLight);

    // 添加坐标轴辅助器（X轴红色，Y轴绿色，Z轴蓝色）
    axesHelperRef.current = new THREE.AxesHelper(5);
    // if (showAxes) {
    //   sceneRef.current.add(axesHelperRef.current);
    // }

    // 窗口大小改变时调整相机和渲染器
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height; // 更新相机宽高比
      cameraRef.current.updateProjectionMatrix(); // 更新相机投影矩阵
      cssRendererRef.current.setSize(width, height); // 调整CSS2D渲染器大小
      rendererRef.current.setSize(width, height); // 调整渲染器大小
      // 更新控制器
      controlsRef.current.update();
    };

    // 空格键按下事件处理函数
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        isSpacePressedRef.current = true;
        // 当空格键按下时，改变鼠标样式以提示用户可以拖动场景中心点
        if (containerRef.current) {
          containerRef.current.style.cursor = 'move';
        }
      }
    };

    // 空格键释放事件处理函数
    const handleKeyUp = (event) => {
      if (event.code === 'Space') {
        isSpacePressedRef.current = false;
        isDraggingRef.current = false;
        // 恢复默认鼠标样式
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default';
        }
      }
    };

    // 鼠标按下事件处理函数
    const handleMouseDown = (event) => {
      if (isSpacePressedRef.current) {
        event.preventDefault();
        isDraggingRef.current = true;
        prevMousePosRef.current = { x: event.clientX, y: event.clientY };
      }
    };

    // 鼠标移动事件处理函数
    const handleMouseMove = (event) => {
      if (isSpacePressedRef.current && isDraggingRef.current && controlsRef.current) {
        event.preventDefault();
        
        // 计算鼠标移动距离
        const deltaX = event.clientX - prevMousePosRef.current.x;
        const deltaY = event.clientY - prevMousePosRef.current.y;
        
        // 获取控制器目标点和相机
        const target = controlsRef.current.target;
        const camera = cameraRef.current;
        const distance = camera.position.distanceTo(target);
        
        // 根据相机方向和距离计算移动量
        const moveX = (deltaX * distance * 0.001);
        const moveY = -(deltaY * distance * 0.001);
        
        // 创建相机的右方向和上方向向量
        const right = new THREE.Vector3().crossVectors(camera.up, camera.getWorldDirection(new THREE.Vector3())).normalize();
        const up = new THREE.Vector3().copy(camera.up).normalize();
        
        // 应用移动到目标点
        target.add(right.multiplyScalar(moveX));
        target.add(up.multiplyScalar(moveY));
        
        // 更新控制器
        controlsRef.current.update();
        
        // 更新前一鼠标位置
        prevMousePosRef.current = { x: event.clientX, y: event.clientY };
      }
    };

    // 鼠标释放事件处理函数
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    // 添加事件监听器
    window.addEventListener('resize', handleResize); // 窗口大小改变事件
    window.addEventListener('keydown', handleKeyDown); // 键盘按下事件
    window.addEventListener('keyup', handleKeyUp); // 键盘释放事件
    if (rendererRef.current) {
      rendererRef.current.domElement.addEventListener('mousedown', handleMouseDown); // 鼠标按下事件
      window.addEventListener('mousemove', handleMouseMove); // 鼠标移动事件
      window.addEventListener('mouseup', handleMouseUp); // 鼠标释放事件
    }

    // 动画循环函数
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // 获取时间增量（自上次调用以来经过的时间）
      const mixerUpdateDelta = clock.current.getDelta();
      
      // 更新控制器
      controlsRef.current.update();
      
      // 更新动画混合器（用于模型动画）
      mixers.current.forEach((mixer) => mixer.update(mixerUpdateDelta));
      
      // 更新自定义渲染混入函数
      renderMixins.current.forEach((mixin) => {
        if (typeof mixin === 'function') mixin();
      });
      
      // 更新TWEEN动画库
      TWEEN.update();
      
      // 渲染3D场景
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // 渲染CSS2D对象（HTML元素）
      cssRendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // 渲染后处理效果
      const delta = new THREE.Clock().getDelta()
      composers.current.forEach((composer) => composer.render(delta));
    };

    // 启动动画循环
    animate();
    // 标记场景初始化完成
    setIsReady(true);

    // 清理函数 - 组件卸载时执行
    return () => {
      // 取消动画帧
      cancelAnimationFrame(animationIdRef.current);
      
      // 移除事件监听器
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // 清理DOM元素
      if (containerRef.current) {
        if (rendererRef.current) {
          rendererRef.current.domElement.removeEventListener('mousedown', handleMouseDown);
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        if (cssRendererRef.current) {
          containerRef.current.removeChild(cssRendererRef.current.domElement);
        }
        // 确保恢复默认鼠标样式
        containerRef.current.style.cursor = 'default';
      }
      
      // 清理模型资源
      models.forEach(model => {
        if (model && model.object) {
          // 释放几何体和材质资源
          if (model.object.geometry) model.object.geometry.dispose();
          if (model.object.material) {
            if (Array.isArray(model.object.material)) {
              model.object.material.forEach(material => material.dispose());
            } else {
              model.object.material.dispose();
            }
          }
          sceneRef.current.remove(model.object);
        }
      });
      
      // 清空混合器和渲染混入
      mixers.current = [];
      renderMixins.current.clear();
      composers.current.clear();
    };
  }, [containerRef]);

  // 初始化DRACO加载器（用于压缩GLB/GLTF模型）
  const dracoLoader = useRef(null);
  
  useEffect(() => {
    dracoLoader.current = new DRACOLoader();
    dracoLoader.current.setDecoderPath('/assets/draco/gltf/'); // 设置DRACO解码器路径
    dracoLoader.current.setDecoderConfig({ type: 'js' }); // 使用JavaScript解码器
  }, []);
  
  /**
   * 加载GLTF/GLB模型
   * @param {string} url - GLTF/GLB文件路径
   * @returns {Promise<Object>} 加载的GLTF对象
   */
  const loadGltf = async (url) => {
    setLoading(true);
    try {
      const loader = new GLTFLoader();
      
      // 如果有DRACO加载器，设置它（用于加载压缩的模型）
      if (dracoLoader.current) {
        loader.setDRACOLoader(dracoLoader.current);
      }
      
      // 异步加载模型
      const object = await loader.loadAsync(url);
      
      // 如果模型包含动画，添加到混合器并自动播放
      if (object.animations && object.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(object.scene);
        object.animations.forEach(animation => {
          mixer.clipAction(animation).play();
        });
        mixers.current.push(mixer);
      }
      
      // 将模型添加到场景
      sceneRef.current.add(object.scene);
      
      // 更新模型列表
      const model = { id: Date.now(), modelType: 'gltf', path: url, object: object.scene, name: url.split('/').pop() || 'GLTF Model' };
      console.log({model})
      setModels(prevModels => [...prevModels, model]);
      
      return object;
    } catch (error) {
      console.error('Error loading GLTF model:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 加载OBJ模型
   * @param {string} path - OBJ文件路径
   * @param {string} mtlPath - MTL材质文件路径（可选）
   * @param {Object} options - 加载选项
   * @param {Array} options.position - 模型位置 [x, y, z]
   * @param {Array} options.scale - 模型缩放 [x, y, z]
   * @param {Array} options.rotation - 模型旋转 [x, y, z]
   * @param {string} options.name - 模型名称
   * @returns {Promise<Object>} 加载的模型对象
   */
  const loadOBJModel = async (path, mtlPath = null, options = {}) => {
    const { position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], name = '' } = options;
    
    setLoading(true);
    try {
      const objLoader = new OBJLoader();
      
      // 如果提供了MTL文件路径，加载材质
      if (mtlPath) {
        const mtlLoader = new MTLLoader();
        const materials = await mtlLoader.loadAsync(mtlPath);
        objLoader.setMaterials(materials);
      }
      
      // 异步加载OBJ模型
      const object = await objLoader.loadAsync(path);
      
      // 设置模型属性
      object.position.set(...position); // 设置位置
      object.scale.set(...scale); // 设置缩放
      object.rotation.set(...rotation); // 设置旋转
      
      // 添加到场景
      sceneRef.current.add(object);
      
      // 更新模型列表
      const model = { id: Date.now(), path, object, name, modelType: 'obj', };
      console.log({model})
      setModels(prevModels => [...prevModels, model]);
      
      return model;
    } catch (error) {
      console.error('Error loading OBJ model:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 从场景中移除模型
   * @param {number} modelId - 模型ID
   */
  const removeModel = (modelId) => {
    setModels(prevModels => {
      const modelIndex = prevModels.findIndex(model => model.id === modelId);
      if (modelIndex !== -1) {
        const model = prevModels[modelIndex];
        if (model.object) {
          sceneRef.current.remove(model.object); // 从场景中移除模型
          // 清理模型资源
          if (model.object.geometry) model.object.geometry.dispose();
          if (model.object.material) {
            if (Array.isArray(model.object.material)) {
              model.object.material.forEach(material => material.dispose());
            } else {
              model.object.material.dispose();
            }
          }
        }
        return prevModels.filter(model => model.id !== modelId); // 从列表中移除
      }
      return prevModels;
    });
  };

  /**
   * 设置场景背景色
   * @param {string|THREE.Color} color - 颜色值（字符串或THREE.Color对象）
   */
  const setBackgroundColor = (color) => {
    if (sceneRef.current) {
      sceneRef.current.background = typeof color === 'string' ? new THREE.Color(color) : color;
    }
  };

  /**
   * 添加动画混合器（用于自定义动画控制）
   * @param {THREE.AnimationMixer} mixer - 动画混合器实例
   */
  const addMixer = (mixer) => {
    mixers.current.push(mixer);
  };
  
  /**
   * 移除动画混合器
   * @param {THREE.AnimationMixer} mixer - 要移除的动画混合器实例
   */
  const removeMixer = (mixer) => {
    const index = mixers.current.indexOf(mixer);
    if (index !== -1) {
      mixers.current.splice(index, 1);
    }
  };
  
  /**
   * 添加渲染混入函数（在每帧渲染时执行）
   * @param {string} key - 混入函数的唯一标识符
   * @param {Function} mixin - 混入函数
   */
  const addRenderMixin = (key, mixin) => {
    if (typeof mixin === 'function') {
      renderMixins.current.set(key, mixin);
    }
  };
  
  /**
   * 移除渲染混入函数
   * @param {string} key - 要移除的混入函数的标识符
   */
  const removeRenderMixin = (key) => {
    renderMixins.current.delete(key);
  };
  
  /**
   * 调整相机位置和缩放，使所有模型完全显示在可视区域内
   * @param {Array} modelsToFit - 要适配的模型数组，如果为空则使用当前所有模型
   * @param {Number} padding - 额外的边距比例，默认为0.2（20%）
   */
  const fitModelsToView = useCallback((modelsToFit = models, padding = 0.2) => {
    if (!cameraRef.current || !controlsRef.current || (!modelsToFit || modelsToFit.length === 0)) {
      console.log('FitModelsToView: 相机、控制器或模型为空，无法调整视角');
      return;
    }

    // 计算所有模型的总包围盒
    const boundingBox = new THREE.Box3();
    
    modelsToFit.forEach((model) => {
      if (model && model.object) {
        // 创建单个模型的包围盒
        const modelBox = new THREE.Box3().setFromObject(model.object);
        // 合并到总包围盒
        boundingBox.union(modelBox);
      }
    });

    // 检查包围盒是否有效
    if (boundingBox.isEmpty()) {
      console.warn('无法计算模型包围盒，可能模型尚未完全加载');
      return;
    }

    // 计算包围盒的中心
    const center = boundingBox.getCenter(new THREE.Vector3());
    
    // 计算包围盒的尺寸
    const size = boundingBox.getSize(new THREE.Vector3());
    
    // 计算包围盒的对角线长度，用于确定相机距离
    const diagonal = size.length();
    
    // 根据相机的视野角度和包围盒大小计算合适的相机距离
    const fov = cameraRef.current.fov * (Math.PI / 180); // 转换为弧度
    const distance = diagonal / (2 * Math.tan(fov / 2)) * (1 + padding);
    
    // 设置相机位置（使用固定的方向向量，从上方以45度角俯视，确保视角稳定）
    const fixedDirection = new THREE.Vector3(-1, 1, -1).normalize(); // 左上后方视角
    const newPosition = new THREE.Vector3().copy(center).add(fixedDirection.multiplyScalar(distance));
    
    console.log('FitModelsToView: 计算结果');
    console.log('  中心点:', center);
    console.log('  包围盒尺寸:', size);
    console.log('  对角线长度:', diagonal);
    console.log('  相机距离:', distance);
    console.log('  固定方向:', fixedDirection);
    console.log('  新相机位置:', newPosition);
    
    // 更新相机位置和目标点
    cameraRef.current.position.copy(newPosition);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
    
    console.log('FitModelsToView: 相机位置已更新');
    console.log('  更新后的相机位置:', cameraRef.current.position);
    console.log('  更新后的控制器目标:', controlsRef.current.target);
    
    // 更新相机近平面和远平面，确保所有内容都在视锥体内
    const near = distance - diagonal / 2;
    const far = distance + diagonal / 2;
    cameraRef.current.near = Math.max(0.1, near); // 确保近平面不小于0.1
    cameraRef.current.far = Math.max(far, 1000); // 确保远平面不小于1000
    cameraRef.current.updateProjectionMatrix(); // 更新投影矩阵
  }, [models]);

  // Hook返回值 - 提供对Three.js组件和功能的访问
  return {
    scene: sceneRef.current, // Three.js场景实例
    camera: cameraRef.current, // 透视相机实例
    renderer: rendererRef.current, // WebGL渲染器实例
    cssRenderer: cssRendererRef.current, // CSS2D渲染器实例
    controls: controlsRef.current, // 轨道控制器实例
    isReady, // 场景是否初始化完成
    loading, // 是否正在加载资源
    // showAxes, // 是否显示坐标轴辅助器
    models, // 已加载的模型列表
    composers: composers.current, // 后处理合成器映射表
    mixers: mixers.current, // 动画混合器数组
    renderMixins: renderMixins.current, // 渲染混入函数映射表
    loadOBJModel, // 加载OBJ模型的方法
    loadGltf, // 加载GLTF/GLB模型的方法
    removeModel, // 移除模型的方法
    setBackgroundColor, // 设置场景背景色的方法
    addMixer, // 添加动画混合器的方法
    removeMixer, // 移除动画混合器的方法
    addRenderMixin, // 添加渲染混入函数的方法
    removeRenderMixin, // 移除渲染混入函数的方法
    TWEEN, // TWEEN动画库
    fitModelsToView // 调整相机以适应所有模型的方法
  };
}