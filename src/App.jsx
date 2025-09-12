
import React, { useState } from 'react'
import SencePowerPlant from './SencePowerPlant'
import SenceWindPower from './SenceWindPower'
// import Model1Img from '@/assetsFile/images/model1.png'
// import Model2Img from '@/assetsFile/images/model2.png'
import CanvasBackground from './components/CanvasBackground'
import './App.css'

function App() {
  // 状态管理：当前视图模式 'preview' | 'powerPlant' | 'windPower'
  const [viewMode, setViewMode] = useState('preview')
  // 动画状态
  const [animating, setAnimating] = useState(false)

  // 处理模型卡片点击
  const handleModelClick = (modelType) => {
    if (animating) return
    setAnimating(true)
    
    // 开始退出动画
    setTimeout(() => {
      setViewMode(modelType)
      // 重置动画状态
      setTimeout(() => setAnimating(false), 500)
    }, 500)
  }

  // 处理返回预览页
  const handleBackToPreview = () => {
    if (animating) return
    setAnimating(true)
    
    // 开始退出动画
    setTimeout(() => {
      setViewMode('preview')
      // 重置动画状态
      setTimeout(() => setAnimating(false), 500)
    }, 500)
  }

  // 渲染预览页面
  const renderPreviewPage = () => (
    <div className="preview-page min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-16 animate-pulse">
        3D模型展示平台
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 w-full max-w-5xl">
        {/* 电站模型卡片 */}
        <div 
          className="model-card relative overflow-hidden group cursor-pointer transform transition-all duration-700 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
          onClick={() => handleModelClick('powerPlant')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-800/20 z-10 group-hover:opacity-70 transition-opacity duration-300"></div>
          <img 
            src={'/assets/model1.png'} 
            alt="电站模型" 
            className="w-full h-96 object-cover transform transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 z-20">
            <h3 className="text-2xl font-bold text-white mb-2">电站3D模型</h3>
            <p className="text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
              点击查看详细电站3D场景
            </p>
          </div>
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400/80 rounded-lg transition-all duration-500 z-30"></div>
        </div>
        
        {/* 风电模型卡片 */}
        <div 
          className="model-card relative overflow-hidden group cursor-pointer transform transition-all duration-700 hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
          onClick={() => handleModelClick('windPower')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-fuchsia-800/20 z-10 group-hover:opacity-70 transition-opacity duration-300"></div>
          <img 
            // src={Model2Img} 
            src={'/assets/model2.png'} 
            alt="风电模型" 
            className="w-full h-96 object-cover transform transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 z-20">
            <h3 className="text-2xl font-bold text-white mb-2">风电3D模型</h3>
            <p className="text-violet-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
              点击查看详细风电3D场景
            </p>
          </div>
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-violet-400/80 rounded-lg transition-all duration-500 z-30"></div>
        </div>
      </div>
    </div>
  )

  // 渲染主场景页面
  const renderScenePage = () => {
    const isPowerPlant = viewMode === 'powerPlant'
    
    return (
      <div className={`scene-container w-full h-screen relative overflow-hidden transition-all duration-500 transform ${animating ? 'opacity-0' : 'opacity-100'}`}>
        {/* 场景内容 */}
        <div className="scene-content h-full relative">
          {/* Canvas动态背景 - 放置在场景内容容器内 */}
          <CanvasBackground colorTheme={isPowerPlant ? 'blue' : 'purple'} />
          
          {/* 返回按钮 */}
          <button 
            className="absolute top-6 left-6 z-50 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 border border-white/20"
            onClick={handleBackToPreview}
            style={{zIndex: 1000}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* 场景标题 */}
          <div className="absolute top-6 left-20 z-50 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full text-white font-semibold">
            {isPowerPlant ? '电站3D可视化场景' : '风电3D可视化场景'}
          </div>
          
          {/* 渲染对应的场景组件 */}
          <div className="relative z-10 w-full h-full">
            {isPowerPlant ? <SencePowerPlant /> : <SenceWindPower />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`App transition-all duration-500 ${animating ? 'opacity-0' : 'opacity-100'}`}>
      {viewMode === 'preview' ? renderPreviewPage() : renderScenePage()}
    </div>
  )
}

export default App
