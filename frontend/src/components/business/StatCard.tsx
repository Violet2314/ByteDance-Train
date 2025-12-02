import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  color: string
  trend?: string
}

/**
 * 统计卡片组件
 *
 * 展示关键业务指标，如总订单数、收入等。
 * 支持显示趋势变化。
 */
export const StatCard = React.memo(({ title, value, icon: Icon, color, trend }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="relative overflow-hidden bg-white p-6 rounded-3xl border border-gray-200 shadow-sm group hover:shadow-md transition-shadow"
  >
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300 transform group-hover:scale-110">
      <Icon size={80} color={color} />
    </div>

    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="p-3 rounded-2xl bg-gray-50 group-hover:bg-gray-100 transition-colors"
          style={{ color }}
        >
          <Icon size={24} />
        </div>
        <span className="text-gray-500 text-sm font-bold tracking-wider uppercase">{title}</span>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span className="flex items-center text-xs font-bold px-2 py-1 rounded-full bg-green-50 text-green-600">
              +{trend}% <ArrowUpRight size={12} className="ml-1" />
            </span>
            <span className="text-xs text-gray-400 font-medium">较上周</span>
          </div>
        )}
      </div>
    </div>

    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-30"></div>
    <div className="absolute bottom-0 left-0 h-1 w-full" style={{ backgroundColor: color }}></div>
  </motion.div>
))
