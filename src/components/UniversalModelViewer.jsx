import React, { useMemo } from 'react'
import FBXModelViewer from './FBXModelViewer'
// import OBJModelWithMTLViewer from './OBJModelWithMTLViewer'
import OBJModelWithMTLViewer from './RealOBJModelViewer'
import GLBModelViewer from './GLBModelViewer'

// 获取文件扩展名
function getFileExtension(filename) {
  if (!filename) return ''
  const parts = filename.split('.')
  if (parts.length < 2) return ''
  return parts.pop().toLowerCase()
}

// 检测模型类型
function getModelType(filename, mtlPath = null) {
  const extension = getFileExtension(filename)
  
  if (mtlPath) {
    return 'obj_mtl'
  }
  
  switch (extension) {
    case 'fbx':
      return 'fbx'
    case 'glb':
    case 'gltf':
      return 'glb_gltf'
    case 'obj':
      return 'obj'
    default:
      return 'unknown'
  }
}

// 统一模型查看器组件
export default function UniversalModelViewer({ 
  modelPath, 
  mtlPath = null,
  modelType = null
}) {
  // 确定要使用的模型类型
  const currentModelType = useMemo(() => {
    if (modelType) {
      return modelType
    }
    return getModelType(modelPath, mtlPath)
  }, [modelPath, mtlPath, modelType])

  // 选择合适的查看器组件
  const renderViewer = () => {
    switch (currentModelType) {
      case 'fbx':
        return <FBXModelViewer fbxPath={modelPath} />
      case 'obj':
      case 'obj_mtl':
        // 如果没有MTL路径但模型是OBJ类型，使用默认MTL
        // const mtlToUse = mtlPath || (modelPath.replace('.obj', '.mtl'))
        return <OBJModelWithMTLViewer  />
      case 'glb_gltf':
        return <GLBModelViewer modelPath={modelPath} />
      default:
        return (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
            color: 'white',
            fontSize: '18px'
          }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '30px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <h2>不支持的模型格式</h2>
              <p style={{ marginTop: '10px', fontSize: '14px' }}>
                支持的格式: FBX, GLB, GLTF, OBJ+MTL
              </p>
              <p style={{ marginTop: '20px', fontSize: '14px', color: '#ff6b6b' }}>
                当前文件: {modelPath}
              </p>
            </div>
          </div>
        )
    }
  }

  return renderViewer()
}