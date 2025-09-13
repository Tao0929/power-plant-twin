import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react'
import ReactDOM from 'react-dom/client';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import TWEEN from 'three/examples/jsm/libs/tween.module.js'
import { useThreeReactOrWind } from './hook/useThreeReactOrWind';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { forEach, random } from 'lodash-es'
// 图表组件引入
import WidgetPanel04 from './layout/WidgetPanel04'
import WidgetPanel02 from './layout/WidgetPanel02'
import WidgetPanel03 from './layout/WidgetPanel03'
import WidgetPanel06 from './layout/WidgetPanel06'
import WidgetPanel01 from './layout/WidgetPanel01';
import WidgetPanel05 from './layout/WidgetPanel05';
import WidgetPanel07 from './layout/WidgetPanel07';
import LayoutHeader from './layout/LayoutHeader';
// 设备分组组件
import WidgetLabel from './layout/WidgetLabel';


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

  const currentRef = useRef();
  const [curModelName, setCurModelName] = useState(null);
  const outlinePassRef = useRef();
  const hexPassRef = useRef(); 
  // 设备数组缓存
  const moduleDevices = useRef([]);
  const labelGroup = useRef([]);

  const warningTimer = useRef();
  const [isWarning, setIsWarning] = useState(false);

  const skeletons = useRef({
    color: {},
    wireframe: {},
  })
  
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
    labelGroup.current = new THREE.Group();
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
        console.log('planeClippingAnimation--objects', mesh)
        if (!(mesh instanceof THREE.Mesh)) return ;
        mesh.material.clippingPlanes = [clippingPlane]
      })
    })
    return transitionAnimation({
      from: { constant: from },
      to: { constant: to },
      duration: during || 1000,
      easing: easing || TWEEN.Easing.Quadratic.Out,
      onUpdate: (object) => {
        clippingPlane.constant = object.constant
      },
      onComplete: () => {
        if (typeof onComplete === 'function') onComplete()
      },
    })
  }

  //添加outline效果
  const addHexEffect = (color) => {
    let selected = []
    hexPassRef.current = {
      get selectedObjects() {
        return selected
      },
      set selectedObjects(val) {
        //先清空之前的
        selected.forEach((mesh) => {
          if (mesh.material) mesh.material.emissive.setHex(mesh.hex)
        })
        val.forEach((mesh) => {
          mesh.material = mesh.material.clone()
          mesh.hex = mesh.material.emissive.getHex()
          mesh.material.emissive.setHex(color ?? 0x888888)
        })
        selected = [...val]
      },
    }
  }
  

  // 模型拾取
  const addModelPick = (object, callback) => { 
    const handler = (event) => {
      const el = containerRef.current;
      const rect = el.getBoundingClientRect(); 
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObject(object, true)
      if (typeof callback === 'function') callback(intersects);
    };
    document.addEventListener('click', handler)
  }

  // 模型悬浮拾取
  const addModelHoverPick = (object, callback) => {
    const handler = (event) => {
      const el = containerRef.current;
      const rect = el.getBoundingClientRect(); 
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObject(object, true)
      if (typeof callback === 'function') callback(intersects);
      // if (intersects.length <= 0) return void 0
    }
    document.addEventListener('mousemove', handler) 
  }

  //开场动画
  const openingAnimation = () => {
    return new Promise((resolve, reject) => { 
      isAnimation.current = true;
      // 风机白色外壳平面削切动画
      planeClippingAnimation({
        objects: [skeletons.current.color],
        from: 4,
        to: 2,
        during: 1000 * 4,
        onComplete() {
          isAnimation.current = false
          skeletons.current.color.visible = false
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
          isAnimation.current = false
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


  // 加载模型
  const handleLoadModel = async () => { 
    const loadEquipment = async () => { 
      const gltf = await loadGltf(CONFIG.MODEL_SOURCES.EQUIPMENT)
      const model = gltf.scene
      model.scale.set(...CONFIG.MODEL_SCALES)
      models.equipment = model
      moduleDevices.current = model
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
      skeletons.current.color = models.skeleton.getObjectByName('颜色材质')
      skeletons.current.wireframe = models.skeleton.getObjectByName('线框材质')
      console.log('skeletons.wireframe', skeletons.current.wireframe)
    }
    // loadEquipment()
    //  loadSkeleton()
    await Promise.all([loadEquipment(), loadSkeleton()])
    console.log('加载模型完成了~~~');
    console.log('models', models)
    console.log('models', models.equipment)
    loadLights();
    // 开场动画
    await openingAnimation() 
    addModelPick(models.equipment, (intersects) => {
      if (intersects.length > 0) {
        const obj = intersects[0]['object']
        currentRef.current = obj.name
        setCurModelName(obj.name)
        outlinePassRef.current.selectedObjects = [obj]
      } else {
        currentRef.current = ''
        setCurModelName(null)
        outlinePassRef.current.selectedObjects = []
      }
    })
    addModelHoverPick(models.equipment, (intersects) => {
      if (intersects.length > 0) {
        const obj = intersects[0]['object']
        hexPassRef.current.selectedObjects = [obj]
      } else {
        hexPassRef.current.selectedObjects = []
      }
    })

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

  //添加outline效果
  const addOutlineEffect = (config) => { 
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass)
    outlinePassRef.current = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera)
    const deafultConfig = {
      edgeStrength: 3,
      edgeGlow: 0,
      edgeThickness: 1,
      pulsePeriod: 0,
      usePatternTexture: false,
      visibleEdgeColor: '#fff',
      hiddenEdgeColor: '#fff',
    }
    const op = Object.assign({}, deafultConfig, config)
    outlinePassRef.current.edgeStrength = op.edgeStrength
    outlinePassRef.current.edgeGlow = op.edgeGlow
    outlinePassRef.current.edgeThickness = op.edgeThickness
    outlinePassRef.current.visibleEdgeColor.set(op.visibleEdgeColor)
    outlinePassRef.current.hiddenEdgeColor.set(op.hiddenEdgeColor)
    outlinePassRef.current.selectedObjects = []
    composer.addPass(outlinePassRef.current)
    const outputPass = new OutputPass()
    composer.addPass(outputPass)
    composers.current.set('outline', composer)
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

    // // 添加坐标轴
    // if (!axesHelperRef.current) {
    //   axesHelperRef.current = new THREE.AxesHelper(10);
    //   scene.add(axesHelperRef.current);
    // }

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
    addOutlineEffect();
    addHexEffect();
    // console.log('开始加载模型了');
    handleLoadModel();
  }, [isReady])
/**
 * 加载 React 组件作为 CSS2DObject
 * @param {React.ComponentType} Component - React 组件
 * @param {Object} props - 传递给组件的属性
 * @returns {CSS2DObject} 包含渲染组件的 CSS2DObject
 */
const loadCSS2DByReact = (Component, props) => {
  // 创建一个容器 div
  const container = document.createElement('div');
  container.style.display = 'inline-block';
  
  // 创建 React 根节点
  const root = ReactDOM.createRoot(container);
  
  // 渲染 React 组件到容器
  root.render(React.createElement(Component, props));
  
  // 创建 CSS2DObject
  const css2dObject = new CSS2DObject(container);
  
  return css2dObject;
};

  //生成设备标签
const createEquipmentLabel = () =>{
  forEach(CONFIG.EQUIPMENT_POSITION, (point, name) => { 
    const label = loadCSS2DByReact(WidgetLabel, { name })
    label.position.set(point.LABEL.x, point.LABEL.y, point.LABEL.z)
    labelGroup.current.add(label)
  })
  console.log('labelGroup', labelGroup.current)
  scene.add(labelGroup.current)
}

  //设备分解动画: 外壳削切 => 设备分离 => 显示标签/摄像头转动
  const eqDecomposeAnimation = () => {
    return new Promise((resolve, reject) => {
      skeletons.current.color.visible = false
      isAnimation.current = true
      console.log('设备分解动画开始', skeletons.current.wireframe)

      const skeletonAnimate = planeClippingAnimation({
        objects: [skeletons.current.wireframe],
        from: 4,
        to: 2,
        during: 1000 * 2,
        onComplete: () => {
          skeletons.current.wireframe.visible = false
          cameraAnimate.start()
          console.log('设备分解动画结束')
        },
      })
      //可以每个部件创建一个动画，这里为了更好控制进程避免使用settimeout，只使用一个动画(更麻烦)
      const from = {}
      const to = {}
      // 由models.equipment 换成 moduleDevices.current因为在加载时把数据用变量缓存了
      moduleDevices.current.children.forEach((mesh, index) => {
        const name = mesh.name;
        console.log('eqDecomposeAnimation--name', name);
        const decompose = CONFIG.EQUIPMENT_POSITION[name]['DECOMPOSE']
        const compose = CONFIG.EQUIPMENT_POSITION[name]['COMPOSE']
        console.log('eqDecomposeAnimation--mesh--decompose', decompose);
        console.log('eqDecomposeAnimation--mesh--compose', compose);
        from[`x${index}`] = compose.x
        from[`y${index}`] = compose.y
        from[`z${index}`] = compose.z
        to[`x${index}`] = decompose.x
        to[`y${index}`] = decompose.y
        to[`z${index}`] = decompose.z
      })

      const eqAnimate = transitionAnimation({
        from: from,
        to: to,
        duration: 1000*2,
        easing: TWEEN.Easing.Quintic.InOut,
        onUpdate: (data) => {
          // 由models.equipment 换成 moduleDevices.current因为在加载时把数据用变量缓存了
          forEach(moduleDevices.current.children, (mesh, index) => {
            console.log('eqAnimate--onUpdate--mesh', mesh);
             mesh.position.set(
              data[`x${index}`],
              data[`y${index}`],
              data[`z${index}`]
            )
          })
        },
        onComplete: () => {
          isAnimation.current = false
          createEquipmentLabel()
          console.log('eqAnimate--onComplete--mesh');
          resolve(true)
        },
      })

      const cameraAnimate = transitionAnimation({
        from: camera.position,
        to: { x: 0.7, y: 2.8, z: 0 },
        duration: 1000 * 2,
        easing: TWEEN.Easing.Linear.None,
        onUpdate(data) {
          console.log('cameraAnimate', data)
          camera.position.set(data.x, data.y, data.z)
          controls.update()
        },
      })

      console.log('skeletonAnimate', skeletonAnimate)
      console.log('skeletonAnimate--chain', skeletonAnimate.chain())
      console.log('skeletonAnimate--eqAnimate', skeletonAnimate.chain(eqAnimate))
      console.log('eqAnimate', eqAnimate)
      console.log('cameraAnimate', cameraAnimate)
      skeletonAnimate.chain(eqAnimate).start()
      

    })
  }

  //开始模拟设备告警
  const startWarning = () => {
    const equipmentChildren = moduleDevices.current.children;
    equipmentChildren.forEach((mesh) => {
      console.log('startWarning--mesh', mesh)
      mesh.material = mesh.material.clone()
      mesh.hex = mesh.material.emissive.getHex()
    })

    const handle = () => {
      const currentIndex = random(0, equipmentChildren.length - 1)
      const currentName = equipmentChildren[currentIndex].name
      equipmentChildren.forEach((mesh, index) => {
        if (index === currentIndex) {
          mesh.material.emissive.setHex(0xff0000)
        } else {
          mesh.material.emissive.setHex(mesh.hex)
        }
      })
      transitionAnimation({
        from: camera.position,
        to: { x: 0.7, y: 2.8, z: 0 },
        duration: 1000 * 2,
        easing: TWEEN.Easing.Linear.None,
        onUpdate(data) {
          camera.position.set(data.x, data.y, data.z)
          controls.update()
        },
      }).start()
    }
    handle()
    warningTimer.current = setInterval(handle, 1000 * 2)

  }

  //结束模拟设备告警
  const stopWarning = () => {
    const equipmentChildren = moduleDevices.current.children;
    clearInterval(warningTimer.current)
    equipmentChildren.forEach((mesh) => {
      mesh.material.emissive.setHex(mesh.hex)
    })

    transitionAnimation({
      from: camera.position,
      to: { x: 0.5, y: 2.8, z: 0.5 },
      duration: 1000 * 2,
      easing: TWEEN.Easing.Linear.None, 
      onUpdate(data) {
        camera.position.set(data.x, data.y, data.z)
        controls.update()
      },
    }).start()
  }


  const WidgetPanelSixOrSeven = useMemo(() => {
    if (currentRef.current || curModelName) {
      return <WidgetPanel07 title={`${currentRef.current || curModelName}详情`} currentName={currentRef.current || curModelName} />
    }
    return <WidgetPanel06 title={'运行监测'} />
  }, [currentRef.current, curModelName])

  /** 点击告警 */
  const clickWarning = () => {
    if (isWarning) {
      stopWarning()
    } else {
      startWarning()
    }
    setIsWarning(!isWarning)
  }
  
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <LayoutHeader />
      <div className='windLayoutMain'>
        {/* 左侧图标 */}
        <div className='windMainLeft'>
          <WidgetPanel04 title={'参数监测'} />
          <WidgetPanel02 title={'历史功率'} />
          <WidgetPanel03 title={'日发电量监测'} />
        </div>
        {/* 右侧图标 */}
        <div className='windMainRight'>
          {
            WidgetPanelSixOrSeven
          }
          <WidgetPanel01 title={'故障对比'} />
          <WidgetPanel05 title={'偏航角度监测'} />
        </div>
        <div ref={containerRef} className='windMainMiddle' style={{}}></div>
      </div>
      <div className='layoutFooter'>
        <div className='layoutFooterBtn' onClick={clickWarning}>{isWarning ?'取消告警':'设备告警'}</div>
        {/* <div className='layoutFooterBtn' onClick={eqDecomposeAnimation}>设备拆解</div> */}
      </div>
    </div>
  )

  
  
}

// GLTFLoader会自动处理资源缓存，不需要额外的预加载配置
// 移除了useGLTF相关的预加载代码

export default SenceWindPower