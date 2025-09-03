import React, { useState, useEffect } from 'react';

/**
 * 数字孪生-科幻风格3D边框组件
 * 具有绚丽灯光效果、3D交互和动态变化的高级边框组件
 */
const Border1 = ({
  title = "数据面板",
  children,
  color = "#00f3ff",
  glowIntensity = 1,
  pulseEffect = true,
  rotateOnHover = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [pulseScale, setPulseScale] = useState(1);

  // 处理鼠标移动，创建视差效果
  const handleMouseMove = (e) => {
    if (!rotateOnHover) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
    
    setRotation({ x, y });
  };

  // 脉冲动画效果
  useEffect(() => {
    if (!pulseEffect) return;
    
    const interval = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.02 : 1);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [pulseEffect]);

  return (
    <div 
      className="border-material"
      style={{
        // perspective: '1000px',
        // margin: '10px',
        display: 'inline-block',
        width: '100%',
        height: '100%'

      }}
    >
      {/* 主容器 */}
      <div 
        className="border-main"
        style={{
          position: 'relative',
          padding: '2px',
          borderRadius: '8px',
          background: `linear-gradient(45deg, transparent 30%, ${color}20 50%, transparent 70%)`,
          backgroundSize: '200% 200%',
          transition: 'all 0.3s ease',
          transform: isHovered ? `scale(${pulseScale})` : `scale(1)`,
          animation: pulseEffect ? 'borderFlow 3s ease infinite' : 'none'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setRotation({ x: 0, y: 0 });
        }}
        onMouseMove={handleMouseMove}
      >
        {/* 内发光效果 */}
        <div 
          className="border-glow"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '8px',
            background: `radial-gradient(circle at center, ${color}${Math.floor(glowIntensity * 30)} 0%, transparent 70%)`,
            filter: 'blur(10px)',
            zIndex: -1,
            transform: `scale(${1 + glowIntensity * 0.2})`
          }}
        />
        
        {/* 框架装饰 */}
        <div className="border-frame">
          {/* 四角装饰 */}
          <div className="border-corner top-left" style={{ borderColor: color }} />
          <div className="border-corner top-right" style={{ borderColor: color }} />
          <div className="border-corner bottom-left" style={{ borderColor: color }} />
          <div className="border-corner bottom-right" style={{ borderColor: color }} />
          
          {/* 边框线条 */}
          <div className="border-line top" style={{ background: color }} />
          <div className="border-line bottom" style={{ background: color }} />
          <div className="border-line left" style={{ background: color }} />
          <div className="border-line right" style={{ background: color }} />
        </div>
        
        {/* 内容容器 */}
        <div 
          className="border-content"
          style={{
            padding: '20px',
            background: 'rgba(10, 15, 30, 0.85)',
            borderRadius: '6px',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${color}30`,
            transform: `rotateX(${rotation.y}deg) rotateY(${rotation.x}deg)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          {/* 标题栏 */}
          {title && (
            <div className="border-title" style={{ color }}>
              <div className="title-line" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600', textShadow: `0 0 8px ${color}` }}>
                {title}
              </h3>
              <div className="title-line" style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }} />
            </div>
          )}
          
          {/* 子内容 */}
          <div className="border-inner-content">
            {children || (
              <div style={{ color: '#aaa', fontSize: '14px' }}>
                <p>数据加载中...</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 3D立体效果层 */}
        <div 
          className="border-3d-layer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${color}10, transparent 70%)`,
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
};

// 添加全局样式
const styleElementId = 'border1-animation-style';
let styleElement = document.getElementById(styleElementId);

if (!styleElement) {
  styleElement = document.createElement('style');
  styleElement.id = styleElementId;
  styleElement.textContent = `
    @keyframes borderFlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;
  document.head.appendChild(styleElement);
}

export default Border1;