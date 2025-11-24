import React, { useRef, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Settings, Cpu, Radio } from 'lucide-react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const CircularText = ({ text }: { text: string }) => {
  const characters = text.split('')
  const containerRef = useRef<HTMLDivElement>(null)
  
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1 })
      for (let i = 0; i < 12; i++) {
        tl.to(containerRef.current, {
          rotation: `+=${30}`, 
          duration: 1.5,
          ease: "elastic.out(1, 0.3)", 
        })
      }
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="relative w-[300px] h-[300px] opacity-80 pointer-events-none select-none">
      {/* Gear Teeth Decoration */}
      <div className="absolute inset-[-20px] border-2 border-dashed border-white/20 rounded-full animate-spin-slow" />
      
      {characters.map((char, i) => {
        const angle = (i / characters.length) * 360
        return (
          <span
            key={i}
            className="absolute left-1/2 top-0 text-white font-mono font-bold text-sm origin-[0_150px]"
            style={{
              transform: `rotate(${angle}deg)`,
            }}
          >
            {char}
          </span>
        )
      })}
    </div>
  )
}

export default function FooterSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".footer-title-char", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          toggleActions: "play none none reverse"
        },
        y: 100,
        opacity: 0,
        rotateX: -90,
        stagger: 0.1,
        duration: 1,
        ease: "back.out(1.7)"
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section id="about" ref={sectionRef} className="min-h-screen bg-[#74B868] relative flex flex-col justify-between overflow-hidden font-mono">
      
      {/* Industrial Blueprint Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:100px_100px]" />
         <div className="absolute top-0 left-0 w-full h-full border-[20px] border-white/10" />
         
         {/* Technical Markings */}
         <div className="absolute top-8 left-8 text-white text-xs font-bold tracking-widest">
            SECTOR: FOOTER_CTRL
            <br/>
            STATUS: STANDBY
         </div>
         <div className="absolute bottom-8 right-8 text-white text-xs font-bold tracking-widest text-right">
            SYS_ID: 8829-X
            <br/>
            PWR: 100%
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        
        {/* Rotating Text Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[2] md:scale-[3] pointer-events-none">
           <CircularText text="SYSTEM READY • INITIATE LAUNCH • SEQUENCE START • " />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-12 relative z-20"
        >
          {/* Noise Texture */}
          <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none mix-blend-overlay" 
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
          />

          <h2 className="text-[13vw] leading-none font-black text-white tracking-tighter select-none drop-shadow-2xl">
            {"准备好了吗?".split('').map((char, i) => (
              <span key={i} className="footer-title-char inline-block origin-bottom">
                {char}
              </span>
            ))}
          </h2>
          
          <div className="relative inline-block">
             <Link to="/login">
                <button className="group relative px-16 py-8 bg-white border-4 border-white hover:border-black transition-colors duration-300 overflow-hidden shadow-[10px_10px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[5px] hover:translate-y-[5px]">
                  <span className="relative flex items-center gap-4 text-2xl md:text-4xl font-black text-[#74B868] group-hover:text-black transition-colors duration-300 uppercase tracking-tighter">
                    立即启动 <ArrowRight size={32} strokeWidth={3} />
                  </span>
                </button>
             </Link>
          </div>
        </motion.div>

        {/* Industrial Status Indicators */}
        <div className="absolute bottom-32 w-full px-12 flex justify-between pointer-events-none">
           <div className="hidden md:flex items-center gap-4 text-white/80 bg-black/10 backdrop-blur-sm p-4 border border-white/20">
             <Settings className="animate-spin-slow" />
             <div className="text-xs font-mono">
               <div>SYSTEM_CHECK</div>
               <div className="text-[#fff] font-bold">ALL SYSTEMS GO</div>
             </div>
           </div>

           <div className="hidden md:flex items-center gap-4 text-white/80 bg-black/10 backdrop-blur-sm p-4 border border-white/20">
             <div className="text-right text-xs font-mono">
               <div>NETWORK_LATENCY</div>
               <div className="text-[#fff] font-bold">12ms (STABLE)</div>
             </div>
             <Radio className="animate-pulse" />
           </div>
        </div>
      </div>

      {/* Footer Links */}
      <footer className="relative z-10 border-t border-white/20 py-8 bg-black/10 backdrop-blur-sm">
          <div className="container mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="text-white/80 text-xs font-mono tracking-widest">
               © 2025 LOGISTICS_PRO_CORP // EST. 2024
             </div>
             <div className="flex gap-8 text-white/80 text-xs font-mono font-bold tracking-widest uppercase">
               <a href="#" className="hover:text-white hover:underline decoration-2 underline-offset-4 transition-all">隐私协议</a>
               <a href="#" className="hover:text-white hover:underline decoration-2 underline-offset-4 transition-all">使用条款</a>
               <a href="#" className="hover:text-white hover:underline decoration-2 underline-offset-4 transition-all">沟通渠道</a>
             </div>
          </div>
      </footer>
    </section>
  )
}
