import React, { useRef, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'antd'
import { ArrowRight, Globe, Truck, Box, BarChart3 } from 'lucide-react'
import { motion, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion'
import gsap from 'gsap'

// --- 3D Floating Element Component ---
const FloatingElement = ({
  children,
  depth = 1,
  className = '',
}: {
  children: React.ReactNode
  depth?: number
  className?: string
}) => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Smooth spring animation for mouse movement
  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 })
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 20 })

  // Transform based on depth (parallax effect)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [10 * depth, -10 * depth])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-10 * depth, 10 * depth])
  const translateX = useTransform(mouseXSpring, [-0.5, 0.5], [-20 * depth, 20 * depth])
  const translateY = useTransform(mouseYSpring, [-0.5, 0.5], [-20 * depth, 20 * depth])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        x: translateX,
        y: translateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative perspective-1000 ${className}`}
    >
      {children}
    </motion.div>
  )
}

// --- Background Grid Animation (Light Mode) ---
const AnimatedGrid = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Moving Grid Overlay */}
      <motion.div
        animate={{
          backgroundPosition: ['0px 0px', '40px 40px'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,#74B86815_1px,transparent_1px),linear-gradient(to_bottom,#74B86815_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"
      />
    </div>
  )
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 100])
  const y2 = useTransform(scrollY, [0, 500], [0, -80])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // 1. Background Text Reveal
      tl.from('.bg-text-char', {
        y: 200,
        opacity: 0,
        rotateX: -90,
        stagger: 0.05,
        duration: 1.2,
        ease: 'power4.out',
      })

        // 2. Main Content Reveal
        .from(
          '.hero-content-item',
          {
            y: 50,
            opacity: 0,
            stagger: 0.1,
            duration: 1,
            ease: 'power3.out',
          },
          '-=0.8'
        )

        // 3. Floating Elements Pop In
        .from(
          '.floating-card',
          {
            scale: 0,
            opacity: 0,
            rotate: -10,
            stagger: 0.1,
            duration: 0.8,
            ease: 'back.out(1.7)',
          },
          '-=0.8'
        )
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      className="min-h-[110vh] relative flex flex-col items-center justify-center overflow-hidden"
    >
      <AnimatedGrid />

      {/* Ambient Light (Light Mode) */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#74B868]/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

      {/* Huge Background Typography (Light Mode) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none z-0 select-none">
        <div className="text-[18vw] font-black text-gray-900/[0.03] leading-[0.8] tracking-tighter">
          {'LOGISTICS'.split('').map((char, i) => (
            <span key={i} className="bg-text-char inline-block">
              {char}
            </span>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full pt-20">
        {/* Left Content (Text) */}
        <div className="lg:col-span-6 space-y-8 relative">
          <div className="hero-content-item inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-[#74B868] text-xs font-mono tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#74B868] animate-pulse" />
            系统在线
          </div>

          <h1 className="hero-content-item text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9]">
            物流配送 <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#74B868] to-emerald-600">
              可视化平台
            </span>
          </h1>

          <p className="hero-content-item text-xl text-gray-500 max-w-lg leading-relaxed font-light">
            可视化物流管理。
            <strong className="text-gray-800 font-semibold"> 更快、更智能。</strong>
          </p>

          <div className="hero-content-item flex flex-wrap gap-4 pt-4">
            <Link to="/login">
              <Button
                type="primary"
                size="large"
                className="h-14 px-10 rounded-full bg-[#74B868] hover:bg-[#63a055] border-none text-lg font-bold shadow-xl shadow-[#74B868]/20 flex items-center gap-2 group transition-all hover:scale-105"
              >
                立即开始
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Button>
            </Link>
            <div className="flex items-center gap-4 px-6">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gray-200"
                  />
                ))}
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">2k+</span> 活跃用户
              </div>
            </div>
          </div>
        </div>

        {/* Right Content (3D Visuals - Light Mode) */}
        <div className="lg:col-span-6 h-[600px] relative flex items-center justify-center perspective-1000">
          <FloatingElement depth={1.2} className="w-full h-full flex items-center justify-center">
            {/* Main Glass Card (Light) */}
            <motion.div
              style={{ y: y1 }}
              className="floating-card relative w-[420px] bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2rem] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] z-20"
            >
              {/* Card Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#74B868]/10 rounded-xl text-[#74B868]">
                    <Truck size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">车队状态</div>
                    <div className="text-[10px] text-gray-400 font-mono">实时追踪</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                </div>
              </div>

              {/* Visualization Area */}
              <div className="relative h-[240px] w-full bg-gray-50 rounded-2xl mb-6 overflow-hidden border border-gray-100 group">
                {/* Abstract Map/Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Animated Path */}
                <svg className="absolute inset-0 w-full h-full overflow-visible">
                  <motion.path
                    d="M 40 200 Q 150 100 380 120"
                    fill="none"
                    stroke="#74B868"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 2,
                      ease: 'easeInOut',
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                  <motion.circle
                    cx="40"
                    cy="200"
                    r="6"
                    fill="#74B868"
                    animate={{ offsetDistance: '100%' }}
                  >
                    <animateMotion
                      dur="3s"
                      repeatCount="indefinite"
                      path="M 40 200 Q 150 100 380 120"
                    />
                  </motion.circle>
                </svg>

                {/* Floating Info Tag */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-1/3 left-1/2 bg-white shadow-lg rounded-lg p-3 border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Box size={12} className="text-[#74B868]" />
                    <span className="text-[10px] font-bold text-gray-800">包裹 #8291</span>
                  </div>
                  <div className="text-[10px] text-gray-400">25分钟后送达</div>
                </motion.div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-gray-400 text-xs mb-1">效率</div>
                  <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    98%{' '}
                    <span className="text-[10px] text-[#74B868] bg-[#74B868]/10 px-1.5 py-0.5 rounded">
                      +2.4%
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-gray-400 text-xs mb-1">配送量</div>
                  <div className="text-xl font-bold text-gray-900">1,284</div>
                </div>
              </div>
            </motion.div>

            {/* Floating Widget 1 (Top Right) */}
            <motion.div
              style={{ y: y2, x: 40 }}
              className="floating-card absolute top-10 -right-4 w-48 p-4 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl z-30"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-500 bg-blue-50">
                  <Globe size={18} />
                </div>
                <span className="text-xs font-bold text-gray-800">物流管理</span>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-mono"
                  >
                    {['US', 'CN', 'EU', 'JP'][i - 1]}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Floating Widget 2 (Bottom Left) */}
            <motion.div
              style={{ y: y2, x: -40 }}
              className="floating-card absolute bottom-20 -left-8 w-44 p-4 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl z-10"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800">营收</span>
                <BarChart3 size={14} className="text-gray-400" />
              </div>
              <div className="h-16 flex items-end gap-1">
                {[40, 70, 50, 90, 60, 80].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#74B868]"
                    style={{ height: `${h}%`, opacity: i === 5 ? 1 : 0.3, borderRadius: '2px' }}
                  />
                ))}
              </div>
            </motion.div>
          </FloatingElement>
        </div>
      </div>
    </section>
  )
}
