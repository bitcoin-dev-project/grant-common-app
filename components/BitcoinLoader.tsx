'use client'

import { useEffect, useRef } from 'react'

type BitcoinLoaderProps = {
  size?: number
  color?: string
  bgColor?: string
  duration?: number
  text?: string
}

export default function BitcoinLoader({
  size = 60,
  color = '#F2A900',
  bgColor = 'rgba(0, 0, 0, 0.05)',
  duration = 1.5,
  text
}: BitcoinLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set actual size in memory (scaled to account for extra pixel density)
    const scale = window.devicePixelRatio
    canvas.width = size * scale
    canvas.height = size * scale
    
    // Normalize coordinate system to use CSS pixels
    ctx.scale(scale, scale)
    
    let frameCount = 0
    let animationFrameId: number
    
    const render = () => {
      frameCount++
      draw(ctx, frameCount, size, color, bgColor, duration)
      animationFrameId = window.requestAnimationFrame(render)
    }
    render()
    
    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [size, color, bgColor, duration])
  
  function draw(
    ctx: CanvasRenderingContext2D,
    frameCount: number,
    size: number,
    color: string,
    bgColor: string,
    duration: number
  ) {
    ctx.clearRect(0, 0, size, size)
    
    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.35
    
    // Draw circle background
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = bgColor
    ctx.fill()
    
    // Draw Bitcoin symbol
    const progress = (frameCount % (60 * duration)) / (60 * duration)
    const startAngle = Math.PI * 0.5
    const endAngle = Math.PI * 2 * progress + startAngle
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.strokeStyle = color
    ctx.lineWidth = size * 0.08
    ctx.lineCap = 'round'
    ctx.stroke()
    
    // Draw Bitcoin "B" symbol
    ctx.font = `bold ${size * 0.35}px 'Arial', sans-serif`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('₿', centerX, centerY)
  }
  
  return (
    <div className="flex flex-col items-center space-y-3">
      <canvas 
        ref={canvasRef}
        style={{
          width: size,
          height: size
        }}
        className="block"
      />
      {text && <p className="text-gray-500 text-sm">{text}</p>}
    </div>
  )
} 