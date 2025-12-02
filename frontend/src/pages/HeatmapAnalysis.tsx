import React, { useEffect, useRef, memo } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'
import { Spin, Card, Statistic } from 'antd'
import { FireOutlined, EnvironmentOutlined, BarChartOutlined } from '@ant-design/icons'
import { useHeatmapAnalysis, type HeatMapData } from '../hooks/useHeatmapAnalysis'
import './HeatmapAnalysis.css'

// AMap 类型声明
interface AMapOptions {
  zoom: number
  center: [number, number]
  viewMode: string
  pitch: number
  mapStyle: string
}

interface HeatMapOptions {
  radius: number
  opacity: [number, number]
  gradient: Record<number, string>
  blur: number
  zooms: [number, number]
}

interface AMapMap {
  on(event: string, callback: () => void): void
  destroy(): void
}

interface AMapHeatMap {
  setDataSet(data: { data: HeatMapData[]; max: number }): void
  hide(): void
  show(): void
}

// 扩展全局变量类型
declare global {
  const AMap: {
    Map: new (container: HTMLDivElement, options: AMapOptions) => AMapMap
    HeatMap: new (map: AMapMap, options: HeatMapOptions) => AMapHeatMap
  }
}

/**
 * 热力图分析页面
 *
 * 展示订单的地理分布密度，支持实时更新
 */
const HeatmapAnalysis = memo(function HeatmapAnalysis() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<AMapMap | null>(null)
  const heatmapInstance = useRef<AMapHeatMap | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const updateTimeoutRef = useRef<number | null>(null)
  const lastDataHashRef = useRef<string>('')

  // 使用自定义 Hook 获取业务数据
  const { orders, isLoading, isMapLoaded, setIsMapLoaded, heatmapData } = useHeatmapAnalysis()

  // 初始化地图
  useEffect(() => {
    // 在地图加载前就设置容器背景色
    if (mapContainer.current) {
      mapContainer.current.style.backgroundColor = '#0B0F19'
    }

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
            // 设置地图容器背景色
            layers: [],
          })

          // 立即设置为已加载，不等待地图完成事件
          setIsMapLoaded(true)
        }

        if (!heatmapInstance.current) {
          heatmapInstance.current = new AMap.HeatMap(mapInstance.current, {
            radius: 35, // 增大半径，让移动更明显
            opacity: [0.1, 0.9], // 提高对比度
            gradient: {
              0.3: 'blue',
              0.5: 'cyan',
              0.7: 'lime',
              0.85: 'yellow',
              0.95: 'orange',
              1.0: 'red',
            },
            blur: 0.85, // 增加模糊度，让热力更明显
            zooms: [3, 18], // 支持更大的缩放范围
          })
        }
      })
      .catch((e) => {
        console.error(e)
      })

    return () => {
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current)
      }
      if (mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
        heatmapInstance.current = null
      }
    }
  }, [])

  // 更新热力图数据（优化 Canvas 更新频率，添加数据变化检测）
  useEffect(() => {
    if (isMapLoaded && heatmapInstance.current && heatmapData.data.length > 0) {
      // 检查数据是否真的变化了
      if (heatmapData.hash === lastDataHashRef.current) {
        return // 数据没有变化，跳过更新
      }
      const now = Date.now()
      // 节流：至少间隔 800ms 才更新（增加间隔减少 Canvas 操作）
      if (now - lastUpdateRef.current < 800) {
        // 清除之前的延迟更新
        if (updateTimeoutRef.current) {
          window.clearTimeout(updateTimeoutRef.current)
        }
        // 设置新的延迟更新
        updateTimeoutRef.current = window.setTimeout(
          () => {
            updateHeatmap()
          },
          800 - (now - lastUpdateRef.current)
        )
        return
      }

      updateHeatmap()
    }

    function updateHeatmap() {
      if (heatmapInstance.current && heatmapData.hash !== lastDataHashRef.current) {
        lastUpdateRef.current = Date.now()
        lastDataHashRef.current = heatmapData.hash
        // 使用原子更新，避免频繁的 hide/show 操作
        heatmapInstance.current.setDataSet({
          data: heatmapData.data,
          max: 5,
        })
      }
    }

    return () => {
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [isMapLoaded, heatmapData])

  return (
    <div className="heatmap-container w-full h-screen relative flex flex-col bg-[#0B0F19]">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 pointer-events-none">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 drop-shadow-lg">
              <FireOutlined className="text-orange-500" />
              区域订单密度热力图
            </h1>
            <p className="text-gray-400 mt-2 font-mono text-sm bg-black/30 backdrop-blur-md inline-block px-3 py-1 rounded-full border border-white/10">
              基于全平台 {orders.length} 条订单数据的实时地理分布分析（显示订单当前位置）
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
                value={(() => {
                  const cities = new Set<string>()
                  orders.forEach((o) => {
                    const addr = o.address.text
                    let city = ''
                    // 解析城市：优先匹配"XX市"
                    if (addr.includes('市')) {
                      const parts = addr.split('市')
                      if (parts[0].includes('省')) {
                        // "广东省广州市" -> "广州市"
                        city = parts[0].split('省')[1] + '市'
                      } else {
                        // "北京市" -> "北京市"
                        city = parts[0] + '市'
                      }
                    } else if (addr.includes('省')) {
                      // "广东省" -> "广东省"
                      city = addr.split('省')[0] + '省'
                    } else {
                      // 兜底：取前3个字符
                      city = addr.substring(0, 3)
                    }
                    if (city) cities.add(city)
                  })
                  return cities.size
                })()}
                prefix={<EnvironmentOutlined />}
                valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainer}
        className="flex-1 w-full h-full bg-[#0B0F19]"
        style={{
          backgroundColor: '#0B0F19',
          background: '#0B0F19',
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-50 backdrop-blur-sm gap-4">
          <Spin size="large" />
          <span className="text-white font-medium">正在加载海量数据...</span>
        </div>
      )}
    </div>
  )
})

export default HeatmapAnalysis
