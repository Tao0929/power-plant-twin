import React, { Suspense, useRef, useEffect, useState } from 'react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import TWEEN from 'three/examples/jsm/libs/tween.module.js'
import { useThreeReactOrWind } from './hook/useThreeReactOrWind';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// 图表组件引入
import WidgetPanel04 from './layout/WidgetPanel04'
import WidgetPanel02 from './layout/WidgetPanel02'
import WidgetPanel03 from './layout/WidgetPanel03'
import WidgetPanel06 from './layout/WidgetPanel06'
import WidgetPanel01 from './layout/WidgetPanel01';
import WidgetPanel05 from './layout/WidgetPanel05';


//基础配置 用于快速的初始化参数修改
const CONFIG = {
  CAMERA_POSITION: [0.2, 2.8, 0.4],
  // CAMERA_POSITION: [-15, 80, 15],
  CONTROL_TARGET: [0, 2.65, 0],
  DECODER_PATH: `/assets/windPower/js/draco/gltf/`,
  MODEL_SOURCES: {
    EQUIPMENT: `/assets/windPower/models/equipment.glb`,
    PLANE: `/assets/windPower/models/plane.glb`,
    SKELETON: `/assets/windPower/models/skeleton.glb`,
  },
  MODEL_SCALES: [0.0001 * 3, 0.0001 * 3, 0.0001 * 3],
  EQUIPMENT_POSITION: {
    变桨系统: {
      LABEL: { x: 0.0291, y: 2.6277, z: 0.2308 },
      COMPOSE: { x: 2519.0795, y: 29288.6777, z: 0 },
      DECOMPOSE: { x: 2519.0795, y: 29000.6777, z: 300 },
    },
    转子: {
      LABEL: { x: 0.0632, y: 2.7692, z: 0.1746 },
      COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
      DECOMPOSE: { x: 20437.7851, y: 8850, z: 300 },
    },
    主轴: {
      LABEL: { x: 0.0183, y: 2.6193, z: 0.0815 },
      COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
      DECOMPOSE: { x: 20437.7851, y: 8350, z: 200 },
    },
    齿轮箱: {
      LABEL: { x: 0.0319, y: 2.6239, z: -0.0402 },
      COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
      DECOMPOSE: { x: 20437.7851, y: 8350, z: 100 },
    },
    油冷装置: {
      LABEL: { x: 0.0364, y: 2.7995, z: 0.0593 },
      COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
      DECOMPOSE: { x: 20437.7851, y: 8650, z: 600 },
    },
    偏航电机: {
      LABEL: { x: -0.0122, y: 2.75662, z: -0.0305 },
      COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
      DECOMPOSE: { x: 20437.7851, y: 8850, z: 400 },
    },
    风冷装置: {
      LABEL: { x: -0.001, y: 2.7643, z: -0.1305 },
      COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
      DECOMPOSE: { x: 20437.7851, y: 8750, z: 300 },
    },
    发电机: {
      LABEL: { x: 0.0047, y: 2.6156, z: -0.2045 },
      COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
      DECOMPOSE: { x: 20437.7851, y: 8350, z: 0 },
    },
    控制柜: {
      LABEL: { x: 0.0249, y: 2.7605, z: -0.2521 },
      COMPOSE: { x: 20437.7851, y: 8650, z: 0 },
      DECOMPOSE: { x: 20437.7851, y: 8850, z: 0 },
    },
  },
};


// 主要的3D模型展示组件
function SenceWindPower() {
  const containerRef = useRef(null);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const gridHelperRef = useRef();
  const mixers = useRef([]) //动画混合器

  const sceneRef = useRef(); // 3D场景引用
  const cameraRef = useRef(); // 相机引用
  const rendererRef = useRef(); // WebGL渲染器引用
  const cssRendererRef = useRef(); // CSS2D渲染器引用
  const controlsRef = useRef(); // 轨道控制器引用
  const animationIdRef = useRef(); // 动画帧ID引用

  // 光照和辅助器引用
  const ambientLightRef = useRef(); // 环境光引用
  const directionalLightRef = useRef(); // 方向光引用
  const axesHelperRef = useRef(); // 坐标轴辅助器引用

  const composers = useRef(new Map());
  const clock = useRef(new THREE.Clock()); // 用于动画计时的时钟
  const renderMixins = useRef(new Map()); // 自定义渲染混入函数映射表

  const isAnimation = useRef(false)

  // 初始化DRACO加载器（用于压缩GLB/GLTF模型）
  const dracoLoader = useRef(null);

  const [loading, setLoading] = useState(false);

  const skeletons = {
    color: null ,
    wireframe: null ,
  }
  
   // 使用我们完善的 useThreeReact hook
  const {
    scene,
    camera,
    renderer,
    controls,
    isReady,
    models,
    loadGltf,
    cssRenderer,
    removeModel,
    setBackgroundColor
  } = useThreeReactOrWind(containerRef);

  useEffect(() => {
    dracoLoader.current = new DRACOLoader();
    dracoLoader.current.setDecoderPath(CONFIG.DECODER_PATH)
    dracoLoader.current.setDecoderConfig({ type: 'js' })
  }, []);

  //过渡动画
  const transitionAnimation = (props) => {
    const {
      from,
      to,
      duration,
      easing = TWEEN.Easing.Quadratic.Out,
      onUpdate,
      onComplete,
    } = props
    return new TWEEN.Tween(from)
      .to(to, duration)
      .easing(easing)
      .onUpdate((object) => {
        if (typeof object === 'function')  onUpdate(object);
      })
      .onComplete((object) => {
        if (typeof onComplete === 'function') onComplete(object);
      })
  }

  //平面削切动画
  const planeClippingAnimation = (config) => {
    const { objects, during, easing, from, to, onComplete } = config

    const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), from)
    objects.forEach((object) => {
      object?.traverse((mesh) => {
        if (!(mesh instanceof THREE.Mesh)) return void 0
        mesh.material.clippingPlanes = [clippingPlane]
      })
    })
    return transitionAnimation({
      from: { constant: from },
      to: { constant: to },
      duration: during ?? 1000,
      easing: easing ?? TWEEN.Easing.Quadratic.Out,
      onUpdate: (object) => {
        clippingPlane.constant = object.constant
      },
      onComplete: () => {
        if (typeof onComplete === 'function') onComplete()
      },
    })
  }

  //开场动画
  const openingAnimation = () => {
    return new Promise((resolve, reject) => { 
      isAnimation.current = true;
      // 风机白色外壳平面削切动画
      planeClippingAnimation({
        objects: [skeletons.color],
        from: 4,
        to: 2,
        during: 1000 * 4,
        onComplete() {
          isAnimation.value = false
          skeletons.color.visible = false
        },
      }).start()
      // 镜头移动
      transitionAnimation({
        from: camera.position,
        to: { x: 0.5, y: 2.8, z: 0.5 },
        duration: 1000 * 2,
        easing: TWEEN.Easing.Quintic.InOut,
        onUpdate: ({ x, y, z }) => {
          camera.position.set(x, y, z)
          controls.update()
        },
        onComplete() {
          isAnimation.value = false
          resolve(void 0)
        },
      }).start()
    })
  }
  
  const loadLights = () => {
    const LIGHT_LIST = [
      [0, 0, 0],
      [-100, 100, 100],
      [100, -100, 100],
      [100, 100, -100],
    ]
    LIGHT_LIST.forEach(([x, y, z]) => {
      const directionalLight = new THREE.DirectionalLight(0xffffff, 5)
      directionalLight.position.set(x, y, z)
      scene.add(directionalLight)
    });
  }

  const handleResize = () => {
      const { clientWidth, clientHeight } = containerRef.current
      cameraRef.current.aspect = clientWidth / clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(clientWidth, clientHeight)
      controlsRef.current.update()
    }

  //窗口大小变化时重新设置渲染器大小
  const onWindowResize = () => {
    
    window.addEventListener('resize', handleResize)
    
  }


  //加载动画混合器(用于启动模型自带的动画)
  const loadAnimationMixer = (
    mesh,
    animations,
    animationName
  ) => {
    const mixer = new THREE.AnimationMixer(mesh)
    const clip = THREE.AnimationClip.findByName(animations, animationName)
    if (!clip) return undefined
    const action = mixer.clipAction(clip)
    action.play()
    mixers.current.push(mixer)
    return undefined
  }

  /**
   * 加载GLTF/GLB模型
   * @param {string} url - GLTF/GLB文件路径
   * @returns {Promise<Object>} 加载的GLTF对象
   */
  // const loadGltf = async (url) => {
  //   setLoading(true);
  //   try {
  //     const loader = new GLTFLoader();
      
  //     // 如果有DRACO加载器，设置它（用于加载压缩的模型）
  //     if (dracoLoader.current) {
  //       loader.setDRACOLoader(dracoLoader.current);
  //     }
      
  //     // 异步加载模型
  //     const object = await loader.loadAsync(url);
      
  //     // 如果模型包含动画，添加到混合器并自动播放
  //     if (object.animations && object.animations.length > 0) {
  //       const mixer = new THREE.AnimationMixer(object.scene);
  //       object.animations.forEach(animation => {
  //         mixer.clipAction(animation).play();
  //       });
  //       mixers.current.push(mixer);
  //     }
      
  //     // 将模型添加到场景
  //     scene.add(object.scene);
      
  //     // 更新模型列表
  //     const model = { id: Date.now(), modelType: 'gltf', path: url, object: object.scene, name: url.split('/').pop() || 'GLTF Model' };
  //     console.log({model})
  //     // setModels(prevModels => [...prevModels, model]);
      
  //     return object;
  //   } catch (error) {
  //     console.error('Error loading GLTF model:', error);
  //     throw error;
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // 加载模型
  const handleLoadModel = async () => { 
    const loadEquipment = async () => { 
      const gltf = await loadGltf(CONFIG.MODEL_SOURCES.EQUIPMENT)
      const model = gltf.scene
      model.scale.set(...CONFIG.MODEL_SCALES)
      models.equipment = model
      // loading.loaded += 1
      model.name = 'equipment'
      scene.add(model)
    }

    const loadSkeleton = async () => {
      const gltf = await loadGltf(CONFIG.MODEL_SOURCES.SKELETON)
      const model = gltf.scene
      loadAnimationMixer(model, gltf.animations, gltf.animations[0].name)
      model.scale.set(...CONFIG.MODEL_SCALES)
      models.skeleton = model
      // loading.loaded += 1
      model.name = 'skeleton'
      scene.add(model)
      skeletons.color = models.skeleton.getObjectByName('颜色材质')
      skeletons.wireframe = models.skeleton.getObjectByName('线框材质')
    }
    // loadEquipment()
    //  loadSkeleton()
    await Promise.all([loadEquipment(), loadSkeleton()])
    console.log('加载模型完成了~~~');
    loadLights();
    // 开场动画
    await openingAnimation() 

  }

  //Lights
  const boostrapLights = () => {
    const ambientLight = new THREE.AmbientLight(0x999999, 10)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(20, 20, 20)
    directionalLight.position.multiplyScalar(1)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize = new THREE.Vector2(1024, 1024)
    scene.add(directionalLight)
  }

  

  useEffect(() => {
    if (!isReady || !scene) return;
    // 添加网格地面
    // if (!gridHelperRef.current) {
    //   gridHelperRef.current = new THREE.GridHelper(100, 100, '#00d4ff', '#333333');
    //   gridHelperRef.current.position.set(0, -0.01, 0); // 略微低于地面
    //   scene.add(gridHelperRef.current);
    // }

    // 取消hooks中的场景背景
    scene.background = null;

    // 添加坐标轴
    if (!axesHelperRef.current) {
      axesHelperRef.current = new THREE.AxesHelper(10);
      // scene.add(axesHelperRef.current);
    }

    renderer.shadowMap.enabled = false;
    renderer.localClippingEnabled = true;
    renderer.setClearAlpha = 0.5;
    renderer.domElement.className = 'webgl-renderer'
    containerRef.current.appendChild(renderer.domElement);

    // 设置自动旋转
    if (controls) {
      controls.autoRotate = autoRotate;
      controls.minPolarAngle = 0
      controls.enableDamping = true
      controls.dampingFactor = 0.1
      controls.target.set(0, 2.65, 0)
      controls.maxPolarAngle = THREE.MathUtils.degToRad(90) // 最大夹角 60 度
      controls.minPolarAngle = THREE.MathUtils.degToRad(45) // 最小夹角 0 度
      controls.minDistance = 0.5
      controls.maxDistance = 2
      controls.update()
    }
    boostrapLights();
    // console.log('开始加载模型了');
    handleLoadModel();
  }, [isReady])
  
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <div className='windLayoutMain'>
        {/* 左侧图标 */}
        <div className='windMainLeft'>
          <WidgetPanel04 title={'参数监测'} />
          <WidgetPanel02 title={'历史功率'} />
          <WidgetPanel03 title={'日发电量监测'} />
        </div>
        {/* 右侧图标 */}
        <div className='windMainRight'>
          <WidgetPanel06 title={'运行监测'} />
          <WidgetPanel01 title={'故障对比'} />
          <WidgetPanel05 title={'偏航角度监测'} />
        </div>
        <div ref={containerRef} className='windMainMiddle' style={{}}></div>
      </div>
    </div>
  )

  
  
}

// GLTFLoader会自动处理资源缓存，不需要额外的预加载配置
// 移除了useGLTF相关的预加载代码

export default SenceWindPower