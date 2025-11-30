import React, { useEffect, useRef, useState, useMemo } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'
import { api } from '../services/api'
import { Spin, Card, Statistic } from 'antd'
import { FireOutlined, EnvironmentOutlined, BarChartOutlined } from '@ant-design/icons'

export default function HeatmapAnalysis() {
  const mapContainer = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatmapInstance = useRef<any>(null)

  const { data: ordersData, isLoading } = api.useGetOrdersQuery({})
  const orders = ordersData?.data || []

  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // 准备热力图数据
  const heatmapData = useMemo(() => {
    return orders
      .filter((o) => o.address && o.address.lat && o.address.lng)
      .map((o) => ({
        lng: o.address.lng,
        lat: o.address.lat,
        count: 1, // 权重，可以是金额或其他指标
      }))
  }, [orders])

  // 初始化地图
  useEffect(() => {
    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.HeatMap'],
    })
      .then((AMap) => {
        if (!mapContainer.current) return

        if (!mapInstance.current) {
          mapInstance.current = new AMap.Map(mapContainer.current, {
            zoom: 5,
            center: [105.0, 35.0], // 中国大致中心
            viewMode: '2D',
            pitch: 45,
            mapStyle: 'amap://styles/dark', // 暗色模式更适合热力图
          })

          mapInstance.current.on('complete', () => {
            setIsMapLoaded(true)
          })
        }

        if (!heatmapInstance.current) {
          heatmapInstance.current = new AMap.HeatMap(mapInstance.current, {
            radius: 25, // 给定半径
            opacity: [0, 0.8],
            gradient: {
              0.5: 'blue',
              0.65: 'rgb(117,211,248)',
              0.7: 'rgb(0, 255, 0)',
              0.9: '#ffea00',
              1.0: 'red',
            },
          })
        }
      })
      .catch((e) => {
        console.error(e)
      })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
        heatmapInstance.current = null
      }
    }
  }, [])

  // 更新热力图数据
  useEffect(() => {
    if (isMapLoaded && heatmapInstance.current && heatmapData.length > 0) {
      heatmapInstance.current.setDataSet({
        data: heatmapData,
        max: 5, // 根据密度调整
      })
      // 如果需要，可以调整视图以适应数据点
      // mapInstance.current.setFitView() // 如果点稀疏，可能会缩放过大
    }
  }, [isMapLoaded, heatmapData])

  return (
    <div className="w-full h-screen relative flex flex-col bg-[#0B0F19]">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 pointer-events-none">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 drop-shadow-lg">
              <FireOutlined className="text-orange-500" />
              区域订单密度热力图
            </h1>
            <p className="text-gray-400 mt-2 font-mono text-sm bg-black/30 backdrop-blur-md inline-block px-3 py-1 rounded-full border border-white/10">
              基于全平台 {orders.length} 条订单数据的实时地理分布分析
            </p>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-4 pointer-events-auto">
            <Card className="w-48 bg-black/40 backdrop-blur-md border-white/10 shadow-2xl">
              <Statistic
                title={<span className="text-gray-400">总订单数</span>}
                value={orders.length}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
            </Card>
            <Card className="w-48 bg-black/40 backdrop-blur-md border-white/10 shadow-2xl">
              <Statistic
                title={<span className="text-gray-400">覆盖城市</span>}
                value={new Set(orders.map((o) => o.address.text.substring(0, 2))).size}
                prefix={<EnvironmentOutlined />}
                valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="flex-1 w-full h-full" />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-50 backdrop-blur-sm gap-4">
          <Spin size="large" />
          <span className="text-white font-medium">正在加载海量数据...</span>
        </div>
      )}
    </div>
  )
}
