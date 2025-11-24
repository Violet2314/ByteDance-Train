import React, { useRef, useLayoutEffect, useEffect } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Globe, Lock, BarChart3, Crosshair, Cpu, Signal } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

// Interactive Grid Background
const GridBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeCells = useRef<Array<{ x: number; y: number; life: number }>>([])
  const lastGridPos = useRef({ x: -1, y: -1 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const parent = canvas.parentElement

    const cellSize = 40
    let animationFrameId: number

    const resize = () => {
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }
    window.addEventListener('resize', resize)
    resize()

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw base grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x <= canvas.width; x += cellSize) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
      }
      for (let y = 0; y <= canvas.height; y += cellSize) {
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
      }
      ctx.stroke()

      // Update and draw active cells
      activeCells.current = activeCells.current.filter((cell) => cell.life > 0)

      activeCells.current.forEach((cell) => {
        cell.life -= 0.02 // Decay rate
        const alpha = Math.max(0, cell.life)

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`
        ctx.lineWidth = 1.5
        ctx.strokeRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize)

        // Optional: Fill
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.05})`
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize)
      })

      animationFrameId = requestAnimationFrame(draw)
    }
    draw()

    const handleMouseMove = (e: MouseEvent) => {
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const gridX = Math.floor(x / cellSize)
      const gridY = Math.floor(y / cellSize)

      // Only trigger if moved to a NEW cell
      if (gridX !== lastGridPos.current.x || gridY !== lastGridPos.current.y) {
        lastGridPos.current = { x: gridX, y: gridY }

        // Trigger 3x3 area effect
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            // Randomly light up cells in 3x3 area
            if (Math.random() > 0.4) {
              activeCells.current.push({
                x: gridX + i,
                y: gridY + j,
                life: 1.0, // Start with full life
              })
            }
          }
        }
      }
    }

    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      window.removeEventListener('resize', resize)
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove)
      }
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
}

export default function AdvantagesSection() {
  const horizontalSectionRef = useRef<HTMLDivElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  const rightFadeRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsContainerRef.current
      const section = horizontalSectionRef.current

      if (cards && section) {
        const getScrollAmount = () => -(cards.scrollWidth - window.innerWidth)

        const tween = gsap.to(cards, {
          x: getScrollAmount,
          ease: 'none',
        })

        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: () => `+=${cards.scrollWidth - window.innerWidth}`,
          pin: true,
          animation: tween,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (rightFadeRef.current) {
              // Fade out the right edge indicator when reaching the end
              gsap.to(rightFadeRef.current, {
                opacity: self.progress > 0.95 ? 0 : 1,
                duration: 0.3,
              })
            }
          },
        })

        // Background Text Animation
        gsap.from('.bg-text-char', {
          scrollTrigger: {
            trigger: section,
            start: 'top center',
            toggleActions: 'play reverse play reverse',
          },
          y: 200,
          opacity: 0,
          rotateX: -90,
          stagger: 0.05,
          duration: 1,
          ease: 'back.out(1.7)',
        })
      }
    }, horizontalSectionRef)

    return () => ctx.revert()
  }, [])

  const features = [
    {
      id: '01',
      title: '全球网络',
      subtitle: 'COVERAGE_MAP_V2.0',
      desc: '连接全球 200+ 个地区。针对跨境延迟进行了优化。',
      icon: <Globe size={24} />,
      tech_spec: 'LATENCY < 200ms',
    },
    {
      id: '02',
      title: '智能调度',
      subtitle: 'NEURAL_CORE_ACTIVE',
      desc: '预测算法降低 30% 成本。实时路径重规划。',
      icon: <Cpu size={24} />,
      tech_spec: 'OPS/SEC: 1.2T',
    },
    {
      id: '03',
      title: '实时追踪',
      subtitle: 'TELEMETRY_STREAM',
      desc: '毫秒级包裹遥测。从仓库到家门口的全程可视化。',
      icon: <Signal size={24} />,
      tech_spec: 'REFRESH: 60Hz',
    },
    {
      id: '04',
      title: '安全金库',
      subtitle: 'ENCRYPTION_L5',
      desc: '银行级数据保护协议。所有交接环节的多重身份验证。',
      icon: <Lock size={24} />,
      tech_spec: 'AES-256-GCM',
    },
    {
      id: '05',
      title: '数据矩阵',
      subtitle: 'ANALYTICS_ENGINE',
      desc: '多维报告工具。为战略决策提供可操作的洞察。',
      icon: <BarChart3 size={24} />,
      tech_spec: 'DEPTH: L3',
    },
  ]

  return (
    <section
      id="solutions"
      ref={horizontalSectionRef}
      className="h-screen bg-[#0B0F19] relative overflow-hidden flex items-center font-mono"
    >
      <GridBackground />

      {/* Right Fade / White Edge Indicator */}
      <div
        ref={rightFadeRef}
        className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white/10 to-transparent z-20 pointer-events-none"
      />

      {/* Technical Overlay UI */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-start pointer-events-none z-20 opacity-50">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] text-[#74B868]">SYS.STATUS: NORMAL</div>
          <div className="w-32 h-[1px] bg-[#74B868]" />
          <div className="text-[10px] text-white">SEC.ADVANTAGES</div>
        </div>
        <div className="flex gap-2">
          <Crosshair size={20} className="text-white/30" />
          <div className="text-[10px] text-white/30">COORDS: 45.22, 12.01</div>
        </div>
      </div>

      {/* Background Text - Increased Opacity to 75% */}
      <div className="absolute top-20 left-20 z-0 pointer-events-none select-none opacity-75">
        <h3 className="text-white text-[12rem] font-black tracking-tighter leading-none">
          <div className="flex overflow-hidden">
            {'CORE'.split('').map((char, i) => (
              <span key={i} className="bg-text-char inline-block origin-bottom">
                {char}
              </span>
            ))}
          </div>
          <div className="flex overflow-hidden">
            {'SPECS'.split('').map((char, i) => (
              <span key={i} className="bg-text-char inline-block origin-bottom">
                {char}
              </span>
            ))}
          </div>
        </h3>
      </div>

      <div
        ref={cardsContainerRef}
        className="flex gap-8 px-24 items-center h-full w-max relative z-10"
      >
        {/* Intro Block */}
        <div className="w-[400px] shrink-0 pr-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-[#74B868] animate-pulse" />
            <span className="text-[#74B868] text-xs tracking-[0.2em]">SYSTEM_CAPABILITIES</span>
          </div>
          <h2 className="text-5xl font-bold text-white mb-6 tracking-tighter leading-tight">
            专为
            <br /> <span className="text-[#74B868]">规模化</span> 设计
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed border-l border-white/20 pl-4">
            LogisticsPro 架构建立在工业级标准之上。 精确、可靠和速度已写入我们的基因。
          </p>
        </div>

        {/* Industrial Cards */}
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            className="w-[360px] h-[480px] shrink-0 relative group bg-[#131825] border border-white/10 hover:border-[#74B868]/50 transition-colors duration-500"
            whileHover={{ y: -10 }}
          >
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30 group-hover:border-[#74B868] transition-colors" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 group-hover:border-[#74B868] transition-colors" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30 group-hover:border-[#74B868] transition-colors" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30 group-hover:border-[#74B868] transition-colors" />

            <div className="relative h-full p-8 flex flex-col">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-12">
                <div className="text-4xl font-black text-white/10 group-hover:text-[#74B868]/20 transition-colors">
                  {feature.id}
                </div>
                <div className="p-3 bg-white/5 rounded-sm text-white group-hover:text-[#74B868] group-hover:bg-[#74B868]/10 transition-all">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <div className="mt-auto">
                <div className="text-[10px] text-[#74B868] mb-2 tracking-widest">
                  {feature.subtitle}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">{feature.desc}</p>

                {/* Tech Spec Footer */}
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">SPECIFICATION</span>
                  <span className="text-xs font-bold text-white group-hover:text-[#74B868] transition-colors">
                    {feature.tech_spec}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="w-[200px] shrink-0 flex items-center justify-center opacity-20">
          <div className="text-white text-xs tracking-[0.5em] -rotate-90 whitespace-nowrap">
            END OF STREAM
          </div>
        </div>
      </div>
    </section>
  )
}
