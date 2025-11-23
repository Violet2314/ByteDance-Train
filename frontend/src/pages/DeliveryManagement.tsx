import React, { useEffect, useRef, useState } from 'react'
import { Button, Input, Tag, Tooltip } from 'antd'
import { Search, Plus, Map as MapIcon, Trash2, Edit2, Layers, Navigation, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import AMapLoader from '@amap/amap-jsapi-loader'
import { motion, AnimatePresence } from 'framer-motion'

export default function DeliveryManagement() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    AMapLoader.load({
      key: 'YOUR_AMAP_KEY', // Replace with your key
      version: '2.0',
      plugins: ['AMap.Polygon', 'AMap.MouseTool'],
    }).then((AMap) => {
      if (!mapContainer.current) return

      if (!mapInstance.current) {
        mapInstance.current = new AMap.Map(mapContainer.current, {
          zoom: 11,
          center: [116.397428, 39.90923],
          viewMode: '3D',
          mapStyle: 'amap://styles/whitesmoke', // Use a cleaner map style
        })
      }

      // Mock Polygon
      const path = [
        [116.368904, 39.913423],
        [116.382122, 39.901176],
        [116.387271, 39.912501],
        [116.398258, 39.904600]
      ];
      const polygon = new AMap.Polygon({
        path: path,
        strokeColor: "#74B868", 
        strokeWeight: 2,
        strokeOpacity: 1,
        fillOpacity: 0.2,
        fillColor: '#74B868',
        zIndex: 50,
      })
      mapInstance.current.add(polygon)
      mapInstance.current.setFitView([polygon])

    }).catch(e => {
      console.error(e)
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
      }
    }
  }, [])

  const rules = [
    { id: 1, company: '顺丰速运', days: '1-2 天', area: '朝阳核心商圈', color: 'blue' },
    { id: 2, company: '中通快递', days: '2-3 天', area: '海淀区', color: 'green' },
    { id: 3, company: '京东物流', days: '1 天', area: '五环内', color: 'red' },
  ]

  const sidebarVariants = {
    open: { width: 384, opacity: 1, x: 0 },
    closed: { width: 0, opacity: 0, x: -20 }
  }

  return (
    <div className="h-[calc(100vh-100px)] flex relative overflow-hidden rounded-3xl border border-gray-300 shadow-2xl bg-white">
      {/* Left Sidebar - Tools */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div 
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col border-r border-gray-200 bg-white z-10 h-full"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Settings size={20} />
                配送规则
              </h2>
              <p className="text-sm text-gray-400 mt-1">管理配送区域和承运商</p>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">启用区域</h3>
                  <Button type="link" size="small" className="text-blue-500 p-0">查看全部</Button>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 group hover:border-blue-200 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">朝阳核心区</span>
                    <Tag color="success" className="border-0 rounded-full px-2">已启用</Tag>
                  </div>
                  <div className="flex gap-2">
                    <Button size="small" icon={<MapIcon size={14} />} className="flex-1 rounded-lg bg-white shadow-sm border-gray-200">编辑区域</Button>
                    <Button size="small" danger icon={<Trash2 size={14} />} className="rounded-lg bg-white shadow-sm border-gray-200"></Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">承运商</h3>
                  <Button type="primary" shape="circle" icon={<Plus size={16} />} size="small" className="bg-black" />
                </div>
                <Input prefix={<Search size={16} className="text-gray-400" />} placeholder="搜索规则..." className="rounded-xl bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white transition-all" />
                
                <div className="space-y-3">
                  {rules.map((item, i) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-2xl border border-gray-200 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer bg-white group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-900">{item.company}</span>
                        <Button type="text" size="small" icon={<Edit2 size={14} />} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Tag className="mr-0 border-0 bg-gray-100 rounded-lg text-gray-600">{item.days}</Tag>
                        <Tag className="mr-0 border-0 bg-blue-50 text-blue-600 rounded-lg truncate max-w-[150px]">{item.area}</Tag>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-1/2 left-0 z-20 -translate-y-1/2 bg-white shadow-lg border border-gray-200 p-1 rounded-r-xl hover:bg-gray-50 transition-colors"
        style={{ left: isSidebarOpen ? 384 : 0 }}
      >
        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Right - Map */}
      <div className="flex-1 bg-gray-50 relative">
        <div ref={mapContainer} className="w-full h-full" />
        
        <div className="absolute top-6 right-6 flex flex-col gap-3">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 space-y-3 min-w-[200px]">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">地图图例</h4>
            <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
              <span>可配送 (124)</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"></span>
              <span>超出范围 (12)</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></span>
              <span>配送中 (56)</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/50 flex flex-col gap-2">
            <Tooltip title="图层" placement="left">
              <Button type="text" icon={<Layers size={20} />} className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100" />
            </Tooltip>
            <Tooltip title="导航" placement="left">
              <Button type="text" icon={<Navigation size={20} />} className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100" />
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}
