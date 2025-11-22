import React, { useRef, useEffect, useLayoutEffect } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Globe, Zap, Activity, Lock, BarChart3 } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

// Grid Background Component
const GridBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeCells = useRef<any[]>([])
  const lastGridPos = useRef({ x: -1, y: -1 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const parent = canvas.parentElement

    const cellSize = 50 
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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)' // Increased visibility
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
      activeCells.current = activeCells.current.filter(cell => cell.life > 0)
      
      activeCells.current.forEach(cell => {
        cell.life -= 0.015
        const alpha = Math.max(0, cell.life)
        
        ctx.strokeStyle = `rgba(116, 184, 104, ${alpha})`
        ctx.lineWidth = 2
        ctx.fillStyle = `rgba(116, 184, 104, ${alpha * 0.1})`
        
        const x = cell.x * cellSize
        const y = cell.y * cellSize
        
        ctx.fillRect(x, y, cellSize, cellSize)
        ctx.strokeRect(x, y, cellSize, cellSize)
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

      if (gridX !== lastGridPos.current.x || gridY !== lastGridPos.current.y) {
        lastGridPos.current = { x: gridX, y: gridY }
        
        // Trigger 3x3 area effect
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (Math.random() > 0.5) { // Randomly light up cells in 3x3 area
               activeCells.current.push({
                 x: gridX + i,
                 y: gridY + j,
                 life: 1.0 + Math.random() * 0.5
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

  return (
    <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
  )
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
          ease: "none",
        })

        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${cards.scrollWidth - window.innerWidth}`,
          pin: true,
          animation: tween,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (rightFadeRef.current) {
              const hasOverflow = cards.scrollWidth > window.innerWidth
              const isAtEnd = self.progress > 0.98
              
              gsap.to(rightFadeRef.current, {
                opacity: (hasOverflow && !isAtEnd) ? 1 : 0,
                duration: 0.3,
                overwrite: true
              })
            }
          }
        })

        // Background Text Animation
        gsap.from(".bg-text-char", {
          scrollTrigger: {
            trigger: section,
            start: "top center",
            toggleActions: "play reverse play reverse"
          },
          y: 200,
          opacity: 0,
          rotateX: -90,
          stagger: 0.05,
          duration: 1,
          ease: "back.out(1.7)"
        })
      }
    }, horizontalSectionRef)

    return () => ctx.revert()
  }, [])

  const features = [
    { 
      title: "全球覆盖", 
      subtitle: "GLOBAL NETWORK",
      desc: "连接全球 200+ 国家和地区的物流网络，让跨境贸易畅通无阻。", 
      icon: <Globe size={32} className="text-blue-400" />, 
      gradient: "from-blue-500/20 to-blue-600/5",
      border: "group-hover:border-blue-500/50",
      text: "text-blue-400"
    },
    { 
      title: "智能调度", 
      subtitle: "AI POWERED",
      desc: "基于 AI 的路径规划算法，平均降低 30% 配送成本，提升 40% 效率。", 
      icon: <Zap size={32} className="text-[#74B868]" />, 
      gradient: "from-[#74B868]/20 to-[#74B868]/5",
      border: "group-hover:border-[#74B868]/50",
      text: "text-[#74B868]"
    },
    { 
      title: "实时追踪", 
      subtitle: "REAL-TIME TRACKING",
      desc: "毫秒级数据更新，全链路可视化监控，包裹位置实时掌握。", 
      icon: <Activity size={32} className="text-indigo-400" />, 
      gradient: "from-indigo-500/20 to-indigo-600/5",
      border: "group-hover:border-indigo-500/50",
      text: "text-indigo-400"
    },
    { 
      title: "安全交付", 
      subtitle: "SECURE DELIVERY",
      desc: "银行级数据加密，多重身份验证，确保每一次交付都安全可靠。", 
      icon: <Lock size={32} className="text-orange-400" />, 
      gradient: "from-orange-500/20 to-orange-600/5",
      border: "group-hover:border-orange-500/50",
      text: "text-orange-400"
    },
    { 
      title: "数据洞察", 
      subtitle: "DATA INSIGHTS",
      desc: "多维度数据报表，助力企业决策，把握市场先机。", 
      icon: <BarChart3 size={32} className="text-purple-400" />, 
      gradient: "from-purple-500/20 to-purple-600/5",
      border: "group-hover:border-purple-500/50",
      text: "text-purple-400"
    }
  ]

  return (
    <section ref={horizontalSectionRef} className="h-screen bg-[#0B0F19] relative overflow-hidden flex items-center">
      <GridBackground />
      
      <div className="absolute top-20 left-20 z-0 pointer-events-none select-none">
        <h3 className="text-white/50 text-[12rem] font-black tracking-tighter leading-none">
          <div className="flex overflow-hidden">
            {"CORE".split('').map((char, i) => (
              <span key={i} className="bg-text-char inline-block origin-bottom">{char}</span>
            ))}
          </div>
          <div className="flex overflow-hidden">
            {"ADVANTAGES".split('').map((char, i) => (
              <span key={i} className="bg-text-char inline-block origin-bottom">{char}</span>
            ))}
          </div>
        </h3>
      </div>

      <div ref={rightFadeRef} className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-white/10 via-white/5 to-transparent z-20 pointer-events-none" />
      
      <div ref={cardsContainerRef} className="flex gap-12 px-24 items-center h-full w-max relative z-10">
        
        <div className="w-[400px] shrink-0 pr-12">
          <div className="w-12 h-1 bg-[#74B868] mb-8" />
          <h2 className="text-6xl font-bold text-white mb-6 tracking-tight">
            核心<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#74B868] to-emerald-400">优势</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed font-light">
            LogisticsPro 不仅仅是运输工具，<br/>
            更是您连接世界的数字桥梁。
          </p>
          <div className="mt-12 flex items-center gap-4 text-white/40 text-sm uppercase tracking-widest">
            <div className="w-8 h-[1px] bg-white/20" />
            Scroll to Explore
          </div>
        </div>

        {features.map((feature, idx) => (
          <motion.div 
            key={idx} 
            className="w-[400px] h-[520px] shrink-0 relative group"
            whileHover={{ y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-[#131825]/90 backdrop-blur-xl border border-white/[0.08] rounded-[2rem] group-hover:bg-[#1A1F2E] group-hover:border-white/20 transition-all duration-500" />
            
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-b ${feature.gradient}`} />

            <div className="relative h-full p-10 flex flex-col z-10">
              <div className="flex justify-between items-start">
                <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 text-white group-hover:scale-110 transition-transform duration-500 ${feature.text}`}>
                  {feature.icon}
                </div>
                <span className="text-8xl font-black text-white/[0.02] leading-none -mt-4 -mr-4 font-mono group-hover:text-white/[0.05] transition-colors">
                  0{idx + 1}
                </span>
              </div>

              <div className="mt-auto space-y-6">
                <div>
                  <div className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-3 ${feature.text} opacity-80`}>
                    {feature.subtitle}
                  </div>
                  <h3 className="text-3xl font-bold text-white tracking-tight group-hover:translate-x-2 transition-transform duration-300">
                    {feature.title}
                  </h3>
                </div>
                
                <div className="w-full h-[1px] bg-white/10 group-hover:bg-white/20 transition-colors" />
                
                <p className="text-gray-400 text-base leading-relaxed font-light group-hover:text-gray-200 transition-colors">
                  {feature.desc}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="w-[300px] shrink-0 flex items-center justify-center opacity-20">
           <div className="text-white text-9xl font-black tracking-tighter rotate-90 origin-center whitespace-nowrap">
              NEXT LEVEL
           </div>
        </div>
      </div>
    </section>
  )
}
