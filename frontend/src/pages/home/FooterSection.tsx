import React, { useRef, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
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
      // Create a mechanical ticking effect with elastic recoil
      // 360 degrees / 12 steps = 30 degrees per step
      for (let i = 0; i < 12; i++) {
        tl.to(containerRef.current, {
          rotation: `+=${30}`, 
          duration: 1.5,
          ease: "elastic.out(1, 0.3)", // Strong recoil
        })
      }
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="relative w-[300px] h-[300px] opacity-80 pointer-events-none select-none">
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
      // Animate "READY?" text
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
    <section ref={sectionRef} className="min-h-screen bg-[#74B868] relative flex flex-col justify-between overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-white rounded-full blur-[150px]" />
         <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900 rounded-full blur-[120px]" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        
        {/* Rotating Text Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[2] md:scale-[3] pointer-events-none">
           <CircularText text="GLOBAL LOGISTICS • SMART TRACKING • SECURE DELIVERY • " />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8 relative z-20"
        >
          {/* Noise Texture Overlay for Art Feel */}
          <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none mix-blend-overlay" 
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
          />

          <h2 className="text-[13vw] leading-none font-black text-white tracking-tighter select-none drop-shadow-2xl">
            {"READY?".split('').map((char, i) => (
              <span key={i} className="footer-title-char inline-block origin-bottom">
                {char}
              </span>
            ))}
          </h2>
          
          <div className="relative inline-block">
             <Link to="/register">
                <button className="group relative px-16 py-8 bg-white rounded-full overflow-hidden shadow-2xl shadow-emerald-900/20 hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center gap-4 text-2xl md:text-4xl font-black text-[#74B868] group-hover:text-white transition-colors duration-300">
                    立即开始 <ArrowRight size={32} />
                  </span>
                </button>
             </Link>
          </div>
        </motion.div>

        {/* Floating Quotes (Minimalist) */}
        <div className="absolute bottom-32 w-full px-8 flex justify-between pointer-events-none">
           <motion.div 
             initial={{ opacity: 0, x: -50 }}
             whileInView={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.5 }}
             className="hidden md:block max-w-xs text-white/60 text-sm font-mono"
           >
             "LogisticsPro transformed our workflow entirely. It's not just a tool, it's art."
             <br/>— JIEJOE, CEO
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, x: 50 }}
             whileInView={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.7 }}
             className="hidden md:block max-w-xs text-right text-white/60 text-sm font-mono"
           >
             "Unprecedented smoothness. Every detail is handled perfectly."
             <br/>— SARAH, OPS
           </motion.div>
        </div>
      </div>

      {/* Footer Links */}
      <footer className="relative z-10 border-t border-white/10 py-8 bg-black/5 backdrop-blur-sm">
          <div className="container mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="text-white/60 text-sm font-medium">© 2025 LogisticsPro.</div>
             <div className="flex gap-8 text-white/60 text-sm font-medium">
               <a href="#" className="hover:text-white transition-colors">Privacy</a>
               <a href="#" className="hover:text-white transition-colors">Terms</a>
               <a href="#" className="hover:text-white transition-colors">Contact</a>
             </div>
          </div>
      </footer>
    </section>
  )
}
