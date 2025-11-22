import React, { useRef, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'antd'
import { ArrowRight, Globe, Truck, Box } from 'lucide-react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import gsap from 'gsap'

const Hero3DCard = () => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"])

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
        transformStyle: "preserve-3d",
      }}
      className="relative w-full max-w-[500px] aspect-[4/3] rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 shadow-2xl flex flex-col items-center justify-center cursor-pointer group"
    >
      <div 
        style={{ transform: "translateZ(75px)", transformStyle: "preserve-3d" }}
        className="absolute inset-4 rounded-lg bg-gray-800/50 border border-gray-600/50 backdrop-blur-md flex flex-col p-6 shadow-lg"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="text-xs text-gray-400 font-mono">LOGISTICS_DASHBOARD.EXE</div>
        </div>

        {/* Content Mockup */}
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 relative overflow-hidden group-hover:border-[#74B868]/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#74B868]/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <div className="h-2 w-1/3 bg-gray-700 rounded mb-4" />
            <div className="space-y-2">
              <div className="h-1 w-full bg-gray-800 rounded overflow-hidden">
                <div className="h-full w-[70%] bg-[#74B868]" />
              </div>
              <div className="h-1 w-full bg-gray-800 rounded overflow-hidden">
                <div className="h-full w-[45%] bg-blue-500" />
              </div>
              <div className="h-1 w-full bg-gray-800 rounded overflow-hidden">
                <div className="h-full w-[90%] bg-purple-500" />
              </div>
            </div>
          </div>
          <div className="col-span-1 bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-[#74B868] border-t-transparent animate-spin mb-2" />
            <div className="text-[10px] text-gray-400">PROCESSING</div>
          </div>
          <div className="col-span-3 bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Globe size={16} /></div>
               <div>
                 <div className="text-xs text-gray-400">Global Status</div>
                 <div className="text-sm font-bold text-white">Connected</div>
               </div>
             </div>
             <div className="text-[#74B868] text-xs font-mono">● ONLINE</div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div 
        style={{ transform: "translateZ(120px)" }}
        className="absolute -right-8 -top-8 p-4 bg-white rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce-slow"
      >
        <div className="p-2 bg-[#74B868]/10 rounded-lg text-[#74B868]"><Truck size={20} /></div>
        <div>
          <div className="text-xs text-gray-500">Delivery</div>
          <div className="text-sm font-bold text-gray-800">On Time</div>
        </div>
      </div>

      <div 
        style={{ transform: "translateZ(100px)" }}
        className="absolute -left-8 -bottom-8 p-4 bg-white rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce-slow delay-700"
      >
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Box size={20} /></div>
        <div>
          <div className="text-xs text-gray-500">Package</div>
          <div className="text-sm font-bold text-gray-800">#882910</div>
        </div>
      </div>
    </motion.div>
  )
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const brandName = "LogisticsPro"

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tl.from(".hero-char", {
        y: 100,
        opacity: 0,
        rotateX: -90,
        stagger: 0.05,
        duration: 1,
        ease: "back.out(1.7)"
      })
      .from(".hero-fade", {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.5")
      .from(".hero-visual", {
        scale: 0.9,
        opacity: 0,
        duration: 1.2,
        ease: "power2.out"
      }, "-=1")
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="min-h-screen flex flex-col items-center justify-center relative pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#74B868]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full relative z-10">
        
        {/* Left: Text */}
        <div className="space-y-8 text-center lg:text-left z-10 min-w-0">
          <div className="overflow-visible">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-gray-900 tracking-tighter leading-[1.1] whitespace-nowrap">
              {brandName.split('').map((char, i) => (
                <span key={i} className="hero-char inline-block origin-bottom">
                  {['P','r','o'].includes(char) ? <span className="text-[#74B868]">{char}</span> : char}
                </span>
              ))}
            </h1>
          </div>
          
          <div className="hero-fade space-y-6">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-800">
              EFFICIENT <span className="text-[#74B868]">LOGISTICS</span> SOLUTIONS
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
              我们提供精准的物流服务：您通往高效、可靠和快速全球航运的门户。
              <br/>
              We provide Precision Logistics: Your Gateway to Efficient, Reliable, and Rapid Global Shipping.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link to="/merchant">
                <Button type="primary" size="large" className="h-14 px-10 rounded-full bg-[#74B868] hover:bg-[#63a055] border-none text-lg shadow-xl shadow-[#74B868]/30 flex items-center gap-2">
                  开始使用 <ArrowRight size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right: 3D Card Visual */}
        <div className="hero-visual flex justify-center items-center h-[500px] w-full perspective-1000">
           <Hero3DCard />
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-400 flex flex-col items-center gap-2">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-[1px] h-12 bg-gray-300"></div>
      </div>
    </section>
  )
}
