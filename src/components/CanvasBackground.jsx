import React, { useRef, useEffect, useState } from 'react'

const CanvasBackground = ({ colorTheme = 'blue' }) => {
  const canvasRef = useRef(null)
  const animationIdRef = useRef(null)
  const [particles, setParticles] = useState([])
  const [mouse, setMouse] = useState({ x: null, y: null })

  // 根据主题设置颜色
  const getColor = () => {
    switch (colorTheme) {
      case 'purple':
        return { bg: '#0a001a', particles: ['#a855f7', '#d946ef', '#c026d3'], glow: '#8b5cf6' }
      case 'blue':
      default:
        return { bg: '#000814', particles: ['#2563eb', '#3b82f6', '#60a5fa'], glow: '#3b82f6' }
    }
  }

  // 初始化粒子
  const initParticles = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const newParticles = []
    const particleCount = Math.floor((canvas.width * canvas.height) / 10000)
    const color = getColor()

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: color.particles[Math.floor(Math.random() * color.particles.length)]
      })
    }
    
    setParticles(newParticles)
  }

  // 更新粒子位置
  const updateParticles = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setParticles(prevParticles => 
      prevParticles.map(particle => {
        // 更新位置
        let newX = particle.x + particle.speedX
        let newY = particle.y + particle.speedY

        // 边界检测
        if (newX < 0 || newX > canvas.width) particle.speedX *= -1
        if (newY < 0 || newY > canvas.height) particle.speedY *= -1

        newX = Math.max(0, Math.min(canvas.width, newX))
        newY = Math.max(0, Math.min(canvas.height, newY))

        return { ...particle, x: newX, y: newY }
      })
    )
  }

  // 绘制粒子
  const drawParticles = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const color = getColor()

    // 清除画布
    ctx.fillStyle = color.bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制连接线
    ctx.strokeStyle = color.glow
    ctx.lineWidth = 0.5

    particles.forEach((particle, index) => {
      for (let j = index + 1; j < particles.length; j++) {
        const dx = particle.x - particles[j].x
        const dy = particle.y - particles[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // 根据距离绘制连接线
        if (distance < 100) {
          ctx.globalAlpha = 1 - distance / 100
          ctx.beginPath()
          ctx.moveTo(particle.x, particle.y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }

      // 鼠标吸引力
      if (mouse.x !== null && mouse.y !== null) {
        const dx = particle.x - mouse.x
        const dy = particle.y - mouse.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 150) {
          const force = (150 - distance) / 150
          particle.x += dx * force * 0.01
          particle.y += dy * force * 0.01
        }
      }

      // 绘制粒子
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()

      // 添加光晕效果
      ctx.shadowColor = particle.color
      ctx.shadowBlur = 10
      ctx.fill()
      ctx.shadowBlur = 0
    })
  }

  // 动画循环
  const animate = () => {
    updateParticles()
    drawParticles()
    animationIdRef.current = requestAnimationFrame(animate)
  }

  // 处理窗口大小变化
  const handleResize = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const container = canvas.parentElement
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
    
    // 重新初始化粒子
    initParticles()
  }

  // 处理鼠标移动
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    setMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  // 处理鼠标离开
  const handleMouseLeave = () => {
    setMouse({ x: null, y: null })
  }

  // 组件挂载时初始化
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 设置画布大小
    handleResize()
    
    // 开始动画
    animate()

    // 添加事件监听
    window.addEventListener('resize', handleResize)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    // 清理函数
    return () => {
      cancelAnimationFrame(animationIdRef.current)
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0"
      style={{ pointerEvents: 'none' }}
    />
  )
}

export default CanvasBackground