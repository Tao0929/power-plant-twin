
import React, { useEffect, useRef, useState } from 'react'
import GLTFSceneViewer from './components/GLTFSceneViewer'
import FBXModelViewer from './components/FBXModelViewer'
// import OBJModelWithMTLViewer from './components/OBJModelWithMTLViewer'
import OBJModelWithMTLViewer from './components/RealOBJModelViewer'
import GLBModelViewer from './components/GLBModelViewer'
import UniversalModelViewer from './components/UniversalModelViewer'
import { FullScreenContainer, BorderBox1, BorderBox11, BorderBox10, BorderBox13, BorderBox8, BorderBox5, BorderBox7, BorderBox9, Decoration1, Decoration5, ActiveRingChart, ScrollRankingBoard, ConicalColumnChart, Decoration3, FlylineChart, FlylineChartEnhanced, ScrollBoard, CapsuleChart, DigitalFlop, BorderBox2, Decoration9, } from '@jiaminghi/data-view-react'
import MultModelViewer from './components/MultModelViewer'
import UseThreeReactExample from './components/UseThreeReactExample'
import MultModelViewerToHook from './components/MultModelViewerToHook'
import GLTFViewerExample from './components/GLTFViewerExample'
import Border1 from './components/material/border1'
import img1 from '@/assetsFile/img/1st.png'
import img2 from '@/assetsFile/img/2st.png'
import img3 from '@/assetsFile/img/3st.png'
import img4 from '@/assetsFile/img/4st.png'
import img5 from '@/assetsFile/img/5st.png'
import img6 from '@/assetsFile/img/6st.png'
import img7 from '@/assetsFile/img/7st.png'
import mapCenterPoint from '@/assetsFile/img/mapCenterPoint.png'
import mapPoint from '@/assetsFile/img/mapPoint.png'
import mapImg from '@/assetsFile/img/mapImg.jpg'

function App() {
  // const [selectedViewer, setSelectedViewer] = useState('mult')
  const [selectedViewer, setSelectedViewer] = useState('gltf')
  const [modelPath, setModelPath] = useState('/assets/train_1005_01.obj')
  const [mtlPath, setMtlPath] = useState('/assets/train_1005_01.mtl')
  const [isFlipping, setIsFlipping] = useState(false)
  
  const objModelList =  [
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
      position: [-3, -0.5, -29],
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
      position: [100, 20, 100],
      scale: [5, 5, 5],
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

  const multModels = [
    // obj
    ...objModelList.map(item => {
      return {
        ...item,
        type: 'obj_mtl',
      }
    }),
    // glb
    {
      type: 'glb',
      path: '/assets/base.glb',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [0.5, 0.5, 0.5],
    },
    {
      type: 'glb',
      path: '/assets/devices.glb',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    // lines.gltf 
    {
      type: 'gltf',
      path: '/assets/lines.gltf',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [0.02, 0.05, 0.05],
    },
    {
      type: 'fbx',
      path: '/assets/Air_Jordan_Fusion_Sne_0324095426_texture.fbx',
      position: [0, 10, 0],
      rotation: [0, 0, 0],
      scale: [0.08, 0.08, 0.08],
    }
  ]

  // modelPath = '/assets/base.glb'
  // 渲染选定的查看器
  const renderSelectedViewer = () => {
    switch (selectedViewer) {
      case 'gltf':
        return <GLTFSceneViewer />
      case 'fbx':
        return <FBXModelViewer />
      case 'obj_mtl':
        return <OBJModelWithMTLViewer objPath={modelPath} mtlPath={mtlPath} />
      case 'glb':
        return <GLBModelViewer modelPath={'/assets/devices.glb'} />
      case 'mult':
        return <MultModelViewer models={multModels} orbitControls={true} />
      case 'gltfEnhanced':
        return <GLTFViewerExample />
      case 'universal':
      default:
        return <UniversalModelViewer modelPath={modelPath} mtlPath={mtlPath} />
    }
  }

  /**模型选择 - 优化版 */
  const ModelSelector = () => {
    // 模型类型配置
    const modelTypes = [
      { value: 'universal', label: '自动检测', recommended: true },
      { value: 'gltf', label: 'GLTF场景' },
      { value: 'fbx', label: 'FBX模型' },
      { value: 'obj_mtl', label: 'OBJ+MTL' },
      { value: 'glb', label: 'GLB模型' },
      { value: 'mult', label: '多模型' },
      { value: 'gltfEnhanced', label: '增强版GLTF查看器 (useThreeReact)' },
    ];

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        position: 'relative'
      }}>
        <span style={{
          color: '#00d4ff',
          fontWeight: 'bold',
          fontSize: '14px',
          textShadow: '0 0 8px rgba(0, 212, 255, 0.5)'
        }}>
          更换模型：
        </span>
        
        <div className="model-select-container" style={{
          position: 'relative',
          minWidth: '180px'
        }}>
          <select
            value={selectedViewer}
            onChange={(e) => {
              setSelectedViewer(e.target.value);
              // setIsFlipping(true);
              // setTimeout(() => {
              //   setSelectedViewer(e.target.value);
              //   setTimeout(() => setIsFlipping(false), 200);
              // }, 300);
            }}
            style={{
              width: '100%',
              padding: '10px 40px 10px 16px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              color: '#ffffff',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              outline: 'none',
              appearance: 'none',
              textShadow: '0 0 4px rgba(0, 212, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'rgba(0, 212, 255, 0.6)';
              e.target.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(0, 212, 255, 0.3)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {modelTypes.map((type) => (
              <option 
                key={type.value} 
                value={type.value}
                style={{
                  background: 'rgba(10, 10, 30, 0.95)',
                  color: '#ffffff',
                  padding: '10px',
                  fontWeight: type.recommended ? 'bold' : 'normal',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                {type.label}
              </option>
            ))}
          </select>
          
          {/* 自定义下拉箭头 */}
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#00d4ff'
          }}>
            ▼
          </div>
          
          {/* 装饰光效 */}
          <div style={{
            position: 'absolute',
            top: '-1px',
            left: '-1px',
            right: '-1px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.6), transparent)',
            pointerEvents: 'none'
          }} />
        </div>
      </div>
    );
  }

  const right1Config = {
    radius: '50%',
    activeRadius: '55%',
    data: [
      {
        name: '周口',
        value: 55
      },
      {
        name: '南阳',
        value: 120
      },
      {
        name: '西峡',
        value: 78
      },
      {
        name: '驻马店',
        value: 66
      },
      {
        name: '新乡',
        value: 80
      }
    ],
    digitalFlopStyle: {
      fontSize: 20
    },
    showOriginValue: true
  } 

  const right2Config = {
    data: [
      {
        name: '周口',
        value: 55
      },
      {
        name: '南阳',
        value: 120
      },
      {
        name: '西峡',
        value: 78
      },
      {
        name: '驻马店',
        value: 66
      },
      {
        name: '新乡',
        value: 80
      },
      {
        name: '三门峡',
        value: 80
      },
      {
        name: '洛阳',
        value: 80
      }
    ],
    carousel: 'single',
    unit: '单位'
  }

  const right3Config = {
    data: [
      {
        name: '周口',
        value: 55
      },
      {
        name: '南阳',
        value: 120
      },
      {
        name: '西峡',
        value: 71
      },
      {
        name: '驻马店',
        value: 66
      },
      {
        name: '新乡',
        value: 80
      },
      {
        name: '信阳',
        value: 35
      },
      {
        name: '漯河',
        value: 15
      }
    ],
    img: [
      img1,
      img2,
      img3,
      img4,
      img5,
      img6,
      img7,
    ],
    showValue: true
  }

  const left1Config = {
    data: [
      {
        name: '南阳',
        value: 167
      },
      {
        name: '周口',
        value: 123
      },
      {
        name: '漯河',
        value: 98
      },
      {
        name: '郑州',
        value: 75
      },
      {
        name: '西峡',
        value: 66
      },
    ],
    colors: ['#e062ae', '#fb7293', '#e690d1', '#32c5e9', '#96bfff'],
    unit: '单位',
    showValue: true
  }

  const left2Config = {
    points: [
      {
        name: '郑州',
        coordinate: [0.48, 0.35],
        halo: {
          show: true,
        },
        icon: {
          src: mapCenterPoint,
          width: 30,
          height: 30
        },
        text: {
          show: false
        }
      },
      {
        name: '新乡',
        coordinate: [0.52, 0.23]
      },
      {
        name: '焦作',
        coordinate: [0.43, 0.29]
      },
      {
        name: '开封',
        coordinate: [0.59, 0.35]
      },
      {
        name: '许昌',
        coordinate: [0.53, 0.47]
      },
      {
        name: '平顶山',
        coordinate: [0.45, 0.54]
      },
      {
        name: '洛阳',
        coordinate: [0.36, 0.38]
      },
      {
        name: '周口',
        coordinate: [0.62, 0.55]
      },
      {
        name: '漯河',
        coordinate: [0.56, 0.56]
      },
      {
        name: '南阳',
        coordinate: [0.37, 0.66]
      },
      {
        name: '信阳',
        coordinate: [0.55, 0.81]
      },
      {
        name: '驻马店',
        coordinate: [0.55, 0.67]
      },
      {
        name: '济源',
        coordinate: [0.37, 0.29]
      },
      {
        name: '三门峡',
        coordinate: [0.20, 0.36]
      },
      {
        name: '商丘',
        coordinate: [0.76, 0.41]
      },
      {
        name: '鹤壁',
        coordinate: [0.59, 0.18]
      },
      {
        name: '濮阳',
        coordinate: [0.68, 0.17]
      },
      {
        name: '安阳',
        coordinate: [0.59, 0.10]
      }
    ],
    lines: [
      {
        source: '新乡',
        target: '郑州'
      },
      {
        source: '焦作',
        target: '郑州'
      },
      {
        source: '开封',
        target: '郑州'
      },
      {
        source: '许昌',
        target: '郑州'
      },
      {
        source: '平顶山',
        target: '郑州'
      },
      {
        source: '洛阳',
        target: '郑州'
      },
      {
        source: '周口',
        target: '郑州'
      },
      {
        source: '漯河',
        target: '郑州'
      },
      {
        source: '南阳',
        target: '郑州'
      },
      {
        source: '信阳',
        target: '郑州'
      },
      {
        source: '驻马店',
        target: '郑州'
      },
      {
        source: '济源',
        target: '郑州'
      },
      {
        source: '三门峡',
        target: '郑州'
      },
      {
        source: '商丘',
        target: '郑州'
      },
      {
        source: '鹤壁',
        target: '郑州'
      },
      {
        source: '濮阳',
        target: '郑州'
      },
      {
        source: '安阳',
        target: '郑州'
      }
    ],
    icon: {
      show: true,
      src: mapPoint
    },
    text: {
      show: true,
    },
    k: 0.5,
    bgImgSrc: mapImg
  }

  const left3Config = {
    header: ['列1', '列2', '列3'],
    data: [
      ['<span style="color:#37a2da;">行1列1</span>', '行1列2', '行1列3'],
      ['行2列1', '<span style="color:#32c5e9;">行2列2</span>', '行2列3'],
      ['行3列1', '行3列2', '<span style="color:#67e0e3;">行3列3</span>'],
      ['行4列1', '<span style="color:#9fe6b8;">行4列2</span>', '行4列3'],
      ['<span style="color:#ffdb5c;">行5列1</span>', '行5列2', '行5列3'],
      ['行6列1', '<span style="color:#ff9f7f;">行6列2</span>', '行6列3'],
      ['行7列1', '行7列2', '<span style="color:#fb7293;">行7列3</span>'],
      ['行8列1', '<span style="color:#e062ae;">行8列2</span>', '行8列3'],
      ['<span style="color:#e690d1;">行9列1</span>', '行9列2', '行9列3'],
      ['行10列1', '<span style="color:#e7bcf3;">行10列2</span>', '行10列3']
    ],
    index: true,
    columnWidth: [50],
    align: ['center']
  }

  const [center1Config, setCenter1Config] = useState({
    number: [999],
    content: '用电量采集：{nt}度'
  })
  let intervalRef = useRef()
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCenter1Config((val) => {
        return {
          ...val,
          number: [val.number[0] + 252]
        }
      })
    }, 5000)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="App">
      <FullScreenContainer  style={{ backgroundColor: '#131323'}}>
        <BorderBox11 title="多格式3D模型查看器" backgroundColor='#131323'>
          <div style={{ 
            width: '100vw', height: '100vh', 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center', 
            background: 'transparent',
            padding: '20px 24px',
            boxSizing: 'border-box',
          }}>
            <div style={{width: '20vw', height: 'calc(100% - 24px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-around'}}>
              <BorderBox13 style={{height: '30%'}}>
                {/* <Border1> */}
                  <CapsuleChart config={left1Config} style={{width: '100%', height: '100%'}} />
                {/* </Border1> */}
              </BorderBox13>
              <BorderBox10 style={{height: '30%', padding: 12, boxSizing: 'border-box'}}>
                <FlylineChartEnhanced config={left2Config} style={{width: '100%', height: '100%'}} />
              </BorderBox10>
              <BorderBox13 style={{height: '30%'}}>
                <ScrollBoard config={left3Config} style={{width: '100%', height: '100%'}} />
              </BorderBox13>
            </div>
            <div style={{width: '50vw', height: 'calc(100% - 48px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-around'}}>
              <BorderBox8 style={{width: '100%', height: 120, padding: 48, boxSizing: 'border-box',}}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
                  <Decoration5 style={{width: '20%', height: '40px'}} />
                  {/* <DigitalFlop config={center1Config} style={{width: '60%', height: 50, fontSize: 24}} /> */}
                  <Decoration9 config={center1Config} style={{width: '60%', height: 60, fontSize: 24}}>
                    <span style={{fontSize: 14}}>采集用电：{center1Config.number[0]}度</span>
                  </Decoration9>
                  <Decoration5 style={{width: '20%', height: '40px'}} />
                  {/* <ChangeModel /> */}
                </div>
              </BorderBox8>
              <BorderBox2 style={{height: '66%',}}>
                <div style={{width: '100%', height: '100%', padding: '24px', boxSizing: 'border-box'}}>
                    {renderSelectedViewer()}
                    {/* <UseThreeReactExample /> */}
                  </div>
              </BorderBox2>
              <BorderBox8 reverse={true} style={{width: '100%', height: 120}}>
                <ModelSelector />
              </BorderBox8>
            </div>
            <div style={{ padding: 12, boxSizing: 'border-box', width: '20vw', height: 'calc(100% - 24px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-around'}}>
              <BorderBox5 reverse={true} style={{height: '30%',}} className="flex-center customer-ring">
                <ActiveRingChart config={right1Config} style={{ width: '20vw', height: '100%'}} />
              </BorderBox5>
              <BorderBox10 style={{height: '30%'}} className="flex-center">
                <ScrollRankingBoard config={right2Config} style={{ width: 'calc(20vw - 24px)', height: '100%', padding: 12, boxSizing: 'border-box'}} />
              </BorderBox10>
              <BorderBox5 style={{height: '30%',}} className="flex-center">
                <Decoration3 style={{width: '120px', height: '30px', position: 'relative', top: 37, right: '-55%'}} />
                <ConicalColumnChart config={right3Config} style={{ width: 'calc(20vw - 128px)', position: 'relative', top: -25, height: '80%', padding: 24, boxSizing: 'border-box'}} />
              </BorderBox5>
            </div>
          </div>
        </BorderBox11>
      </FullScreenContainer>
    </div>
  )
}

export default App
