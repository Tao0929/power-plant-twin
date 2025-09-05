import React, { useRef, useState, useEffect } from 'react';
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
 */
export function useThreeReact(containerRef) {
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const cssRendererRef = useRef();
  const controlsRef = useRef();
  const animationIdRef = useRef();
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  // 用于控制中心点拖动的状态
  const isSpacePressedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
    
  // 新增功能：与Vue版本对齐
  const composers = useRef(new Map());
  const mixers = useRef([]);
  const clock = useRef(new THREE.Clock());
  const renderMixins = useRef(new Map());
  const ambientLightRef = useRef();
  const directionalLightRef = useRef();
  const axesHelperRef = useRef();

  // 光照和坐标轴控制参数
  const { ambientIntensity, directionalIntensity, showAxes } = useControls({
    ambientIntensity: { value: 0.6, min: 0, max: 2, step: 0.1 },
    directionalIntensity: { value: 1, min: 0, max: 3, step: 0.1 },
    showAxes: false
  });

  // 监听控制参数变化并应用到场景
  useEffect(() => {
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = ambientIntensity;
    }
  }, [ambientIntensity]);

  useEffect(() => {
    if (directionalLightRef.current) {
      directionalLightRef.current.intensity = directionalIntensity;
    }
  }, [directionalIntensity]);

  useEffect(() => {
    if (!sceneRef.current || !axesHelperRef.current) return;
    
    if (showAxes) {
      sceneRef.current.add(axesHelperRef.current);
    } else {
      sceneRef.current.remove(axesHelperRef.current);
    }
  }, [showAxes]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 初始化 Three.js 场景、相机、渲染器等
    sceneRef.current = new THREE.Scene();
    
    // 设置场景背景色（与项目风格保持一致）
    sceneRef.current.background = new THREE.Color('#131323');

    // 初始化相机
    cameraRef.current = new THREE.PerspectiveCamera(
      60, // 视野角度
      containerRef.current.clientWidth / containerRef.current.clientHeight, // 宽高比
      0.1, // 近平面
      1000 // 远平面
    );
    cameraRef.current.position.set(-20, 20, 15); // 初始位置
    cameraRef.current.lookAt(0, 0, 0); // 看向原点

    // 初始化渲染器
    rendererRef.current = new THREE.WebGLRenderer({
      antialias: true, // 抗锯齿
      alpha: true // 允许透明
    });
    rendererRef.current.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.shadowMap.enabled = true;
    
    // 将渲染器DOM元素添加到容器
    containerRef.current.appendChild(rendererRef.current.domElement);
    
    // 初始化CSS2DRenderer
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

    // 初始化控制器
    controlsRef.current = new OrbitControls(
      cameraRef.current,
      rendererRef.current.domElement
    );
    controlsRef.current.enablePan = true;
    controlsRef.current.enableZoom = true;
    controlsRef.current.enableRotate = true;
    controlsRef.current.minDistance = 5;
    controlsRef.current.maxDistance = 100;
    controlsRef.current.autoRotate = false;
    controlsRef.current.autoRotateSpeed = 0.5;
    controlsRef.current.target.set(0, 0, 0);
    
    // 添加基础光照（与项目风格保持一致）
    ambientLightRef.current = new THREE.AmbientLight(0xffffff, ambientIntensity);
    sceneRef.current.add(ambientLightRef.current);

    directionalLightRef.current = new THREE.DirectionalLight(0xffffff, directionalIntensity);
    directionalLightRef.current.position.set(10, 10, 5);
    directionalLightRef.current.castShadow = true;
    directionalLightRef.current.shadow.mapSize.set(2048, 2048);
    sceneRef.current.add(directionalLightRef.current);

    const pointLight = new THREE.PointLight(0x00d4ff, 0.5);
    pointLight.position.set(0, 10, 0);
    sceneRef.current.add(pointLight);

    // 添加坐标轴辅助器
    axesHelperRef.current = new THREE.AxesHelper(5);
    if (showAxes) {
      sceneRef.current.add(axesHelperRef.current);
    }

    // 窗口大小改变时调整相机和渲染器
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    // 空格键按下事件
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        isSpacePressedRef.current = true;
        // 当空格键按下时，改变鼠标样式以提示用户可以拖动
        if (containerRef.current) {
          containerRef.current.style.cursor = 'move';
        }
      }
    };

    // 空格键释放事件
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

    // 鼠标按下事件
    const handleMouseDown = (event) => {
      if (isSpacePressedRef.current) {
        event.preventDefault();
        isDraggingRef.current = true;
        prevMousePosRef.current = { x: event.clientX, y: event.clientY };
      }
    };

    // 鼠标移动事件
    const handleMouseMove = (event) => {
      if (isSpacePressedRef.current && isDraggingRef.current && controlsRef.current) {
        event.preventDefault();
        
        const deltaX = event.clientX - prevMousePosRef.current.x;
        const deltaY = event.clientY - prevMousePosRef.current.y;
        
        // 计算移动距离对目标点的影响
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

    // 鼠标释放事件
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    // 添加事件监听器
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (rendererRef.current) {
      rendererRef.current.domElement.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    // 动画循环
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // 获取时间增量
      const delta = clock.current.getDelta();
      
      // 更新控制器
      controlsRef.current.update();
      
      // 更新动画混合器
      mixers.current.forEach((mixer) => mixer.update(delta));
      
      // 更新自定义渲染混入
      renderMixins.current.forEach((mixin) => {
        if (typeof mixin === 'function') mixin();
      });
      
      // 更新TWEEN动画
      TWEEN.update();
      
      // 渲染场景
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // 渲染CSS2D对象
      cssRendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // 渲染后处理效果
      composers.current.forEach((composer) => composer.render(delta));
    };

    animate();
    setIsReady(true);

    // 清理函数
    return () => {
      cancelAnimationFrame(animationIdRef.current);
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
      
      // 清理模型
      models.forEach(model => {
        if (model && model.object) {
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

  // 初始化DRACO加载器
  const dracoLoader = useRef(null);
  
  useEffect(() => {
    dracoLoader.current = new DRACOLoader();
    dracoLoader.current.setDecoderPath('/assets/draco/gltf/');
    dracoLoader.current.setDecoderConfig({ type: 'js' });
  }, []);
  
  /**
   * 加载GLTF模型
   * @param {string} url - GLTF文件路径
   * @returns {Promise<THREE.Group>} 加载的模型对象
   */
  const loadGltf = async (url) => {
    setLoading(true);
    try {
      const loader = new GLTFLoader();
      if (dracoLoader.current) {
        loader.setDRACOLoader(dracoLoader.current);
      }
      
      const object = await loader.loadAsync(url);
      
      // 如果模型包含动画，添加到混合器
      if (object.animations && object.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(object.scene);
        object.animations.forEach(animation => {
          mixer.clipAction(animation).play();
        });
        mixers.current.push(mixer);
      }
      
      // 添加到场景
      sceneRef.current.add(object.scene);
      
      // 更新模型列表
      const model = { id: Date.now(), path: url, object: object.scene, name: url.split('/').pop() || 'GLTF Model' };
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
   * @param {string} mtlPath - MTL文件路径（可选）
   * @param {Object} options - 加载选项
   * @returns {Promise<Object>} 加载的模型对象
   */
  const loadOBJModel = async (path, mtlPath = null, options = {}) => {
    const { position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], name = '' } = options;
    
    setLoading(true);
    try {
      const objLoader = new OBJLoader();
      
      if (mtlPath) {
        const mtlLoader = new MTLLoader();
        const materials = await mtlLoader.loadAsync(mtlPath);
        objLoader.setMaterials(materials);
      }
      
      const object = await objLoader.loadAsync(path);
      
      // 设置模型属性
      object.position.set(...position);
      object.scale.set(...scale);
      object.rotation.set(...rotation);
      
      // 添加到场景
      sceneRef.current.add(object);
      
      // 更新模型列表
      const model = { id: Date.now(), path, object, name };
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
          sceneRef.current.remove(model.object);
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
        return prevModels.filter(model => model.id !== modelId);
      }
      return prevModels;
    });
  };

  /**
   * 设置场景背景色
   * @param {string|THREE.Color} color - 颜色值
   */
  const setBackgroundColor = (color) => {
    if (sceneRef.current) {
      sceneRef.current.background = typeof color === 'string' ? new THREE.Color(color) : color;
    }
  };

  /**
   * 添加动画混合器
   * @param {THREE.AnimationMixer} mixer - 动画混合器
   */
  const addMixer = (mixer) => {
    mixers.current.push(mixer);
  };
  
  /**
   * 移除动画混合器
   * @param {THREE.AnimationMixer} mixer - 动画混合器
   */
  const removeMixer = (mixer) => {
    const index = mixers.current.indexOf(mixer);
    if (index !== -1) {
      mixers.current.splice(index, 1);
    }
  };
  
  /**
   * 添加渲染混入
   * @param {string} key - 唯一标识
   * @param {Function} mixin - 混入函数
   */
  const addRenderMixin = (key, mixin) => {
    if (typeof mixin === 'function') {
      renderMixins.current.set(key, mixin);
    }
  };
  
  /**
   * 移除渲染混入
   * @param {string} key - 唯一标识
   */
  const removeRenderMixin = (key) => {
    renderMixins.current.delete(key);
  };
  
  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    cssRenderer: cssRendererRef.current,
    controls: controlsRef.current,
    isReady,
    loading,
    showAxes,
    models,
    composers: composers.current,
    mixers: mixers.current,
    renderMixins: renderMixins.current,
    loadOBJModel,
    loadGltf,
    removeModel,
    setBackgroundColor,
    addMixer,
    removeMixer,
    addRenderMixin,
    removeRenderMixin,
    TWEEN
  };
}