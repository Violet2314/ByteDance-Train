import React from 'react'
import { Truck, Globe, Zap, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export const LoginLeftPanel = React.memo(() => {
  return (
    <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12">
      {/* 抽象形状背景 (局部) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="art-shape absolute top-[10%] left-[10%] w-64 h-64 bg-gradient-to-br from-[#74B868]/10 to-transparent rounded-full blur-3xl" />
        <div className="art-shape absolute bottom-[20%] right-[10%] w-96 h-96 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* 内容容器 */}
      <div className="relative z-10 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-[#74B868]/10 flex items-center justify-center mb-8 brand-pulse border border-white/50">
            <Truck size={32} className="text-[#74B868]" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            重塑
            <br />
            <span className="text-[#74B868]">物流体验</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-12">
            通过我们的下一代可视化平台无缝连接您的供应链。
          </p>

          {/* 特性列表 */}
          <div className="space-y-6">
            {[
              { title: '实时追踪', desc: '精确到米', icon: <Globe size={20} /> },
              { title: '智能分析', desc: 'AI 驱动的洞察', icon: <Zap size={20} /> },
              { title: '安全交付', desc: '银行级加密', icon: <Shield size={20} /> },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#74B868] group-hover:border-[#74B868] transition-all shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <div className="font-bold text-gray-800">{item.title}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
})
