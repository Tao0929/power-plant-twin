import React, { useState } from 'react'
import FBXModelViewer from './FBXModelViewer'
import OBJModelWithMTLViewer from './OBJModelWithMTLViewer'
import GLBModelViewer from './GLBModelViewer'
import UniversalModelViewer from './UniversalModelViewer'

// 测试组件 - 展示所有模型查看器
const ModelViewerTest = () => {
  const [activeTab, setActiveTab] = useState('universal')
  
  // 示例模型路径配置
  const modelPaths = {
    fbx: '/assets/Air_Jordan_Fusion_Sne_0324095217_texture.fbx',
    obj: '/assets/train_nt_0001.obj',
    mtl: '/assets/train_nt_0001.mtl',
    glb: '/assets/Car_Charger_Speaker_C_0319091353_texture.glb',
    gltf: '/assets/scene.gltf'
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#111'
    }}>
      {/* 顶部导航标签 */}
      <div style={{
        display: 'flex',
        background: 'rgba(0, 0, 0, 0.8)',
        borderBottom: '1px solid #333',
        padding: '10px 20px',
        gap: '5px'
      }}>
        {[
          { id: 'universal', label: '通用查看器' },
          { id: 'obj_mtl', label: 'OBJ+MTL' },
          { id: 'fbx', label: 'FBX' },
          { id: 'glb', label: 'GLB' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.id ? '#00d4ff' : 'rgba(255, 255, 255, 0.1)',
              color: activeTab === tab.id ? '#000' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* 信息面板 */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.6)',
        color: '#fff',
        padding: '10px 20px',
        fontSize: '14px',
        borderBottom: '1px solid #333'
      }}>
        <h3 style={{ margin: '0 0 5px 0', color: '#00d4ff' }}>模型查看器测试页面</h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#ccc' }}>
          测试不同格式3D模型的加载和渲染效果
        </p>
      </div>
      
      {/* 主内容区域 - 模型查看器 */}
      <div style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'universal' && (
          <UniversalModelViewer 
            modelPath={modelPaths.obj}
            mtlPath={modelPaths.mtl}
          />
        )}
        
        {activeTab === 'obj_mtl' && (
          <OBJModelWithMTLViewer 
            objPath={modelPaths.obj}
            mtlPath={modelPaths.mtl}
          />
        )}
        
        {activeTab === 'fbx' && (
          <FBXModelViewer fbxPath={modelPaths.fbx} />
        )}
        
        {activeTab === 'glb' && (
          <GLBModelViewer modelPath={modelPaths.glb} />
        )}
      </div>
      
      {/* 底部信息 */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#aaa',
        padding: '10px 20px',
        fontSize: '12px',
        borderTop: '1px solid #333',
        textAlign: 'center'
      }}>
        当前活动标签: {activeTab} | 支持格式: FBX, GLB, GLTF, OBJ+MTL
      </div>
    </div>
  )
}

export default ModelViewerTest