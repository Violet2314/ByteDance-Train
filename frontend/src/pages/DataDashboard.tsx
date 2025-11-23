import React, { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { TrendingUp, Package, Users, DollarSign, Activity, Truck, ArrowUpRight, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

const data = [
  { name: '周一', orders: 4000, amount: 2400 },
  { name: '周二', orders: 3000, amount: 1398 },
  { name: '周三', orders: 2000, amount: 9800 },
  { name: '周四', orders: 2780, amount: 3908 },
  { name: '周五', orders: 1890, amount: 4800 },
  { name: '周六', orders: 2390, amount: 3800 },
  { name: '周日', orders: 3490, amount: 4300 },
]

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
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
        <div className="p-3 rounded-2xl bg-gray-50 group-hover:bg-gray-100 transition-colors" style={{ color }}>
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
              +{trend}% <ArrowUpRight size={12} className="ml-1"/>
            </span>
            <span className="text-xs text-gray-400 font-medium">较上周</span>
          </div>
        )}
      </div>
    </div>
    
    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-30"></div>
    <div className="absolute bottom-0 left-0 h-1 w-full" style={{ backgroundColor: color }}></div>
  </motion.div>
)

export default function DataDashboard() {
  const [timeRange, setTimeRange] = useState('周')

  return (
    <div className="space-y-8 p-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#74B868] mb-2">
             <Activity size={20} className="animate-pulse"/>
             <span className="font-mono text-xs tracking-widest uppercase font-bold">实时分析</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#0B0F19] tracking-tight">
            数据<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B0F19] to-gray-500">概览</span>
          </h1>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
           {['日', '周', '月'].map((t) => (
             <button 
               key={t} 
               onClick={() => setTimeRange(t)}
               className={`relative px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                 timeRange === t ? 'bg-[#0B0F19] text-white shadow-lg shadow-[#0B0F19]/20' : 'text-gray-400 hover:text-gray-600'
               }`}
             >
               <span className="relative z-10">{t}</span>
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="总收入" value="¥128,930" icon={DollarSign} color="#74B868" trend="12.5" />
        <StatCard title="总订单" value="8,432" icon={Package} color="#3B82F6" trend="8.2" />
        <StatCard title="活跃用户" value="2,341" icon={Users} color="#F59E0B" trend="5.3" />
        <StatCard title="平均配送时间" value="1.2 天" icon={Truck} color="#EC4899" trend="2.1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-[#0B0F19]">收入趋势</h3>
              <p className="text-sm text-gray-400 mt-1">每日收入表现</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
               <span className="w-2 h-2 rounded-full bg-[#74B868] animate-pulse"></span>
               <span className="text-xs text-[#74B868] font-bold">实时</span>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#74B868" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#74B868" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 500}} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 500}} 
                  tickFormatter={(value) => `¥${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0F19', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ stroke: '#74B868', strokeWidth: 2, strokeDasharray: '5 5' }}
                  formatter={(value: number) => [`¥${value}`, '收入']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#74B868" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-[#0B0F19]">订单量</h3>
              <p className="text-sm text-gray-400 mt-1">每周订单统计</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-xl">
              <Calendar size={20} className="text-gray-400" />
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 500}} 
                  dy={10} 
                />
                <Tooltip 
                  cursor={{fill: '#F3F4F6', radius: 8}}
                  contentStyle={{ backgroundColor: '#0B0F19', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="orders" radius={[8, 8, 8, 8]} animationDuration={1500}>
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index % 2 === 0 ? '#0B0F19' : '#E5E7EB'} 
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
