import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OBJLoader } from 'three-stdlib';
import { MTLLoader } from 'three-stdlib';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';

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
  
  // 新增功能：与Vue版本对齐
  const composers = useRef(new Map());
  const mixers = useRef([]);
  const clock = useRef(new THREE.Clock());
  const renderMixins = useRef(new Map());

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    sceneRef.current.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00d4ff, 0.5);
    pointLight.position.set(0, 10, 0);
    sceneRef.current.add(pointLight);

    // 窗口大小改变时调整相机和渲染器
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

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
      
      // 清理DOM元素
      if (containerRef.current) {
        if (rendererRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        if (cssRendererRef.current) {
          containerRef.current.removeChild(cssRendererRef.current.domElement);
        }
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