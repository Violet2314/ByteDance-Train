import React, { useEffect, useRef, memo } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'
import type { TrackPoint } from '@logistics/shared'

interface TrackingMapProps {
  points: TrackPoint[]
  currentPoint?: TrackPoint
  startPoint?: { lat: number; lng: number }
  endPoint?: { lat: number; lng: number }
  routePath?: { lat: number; lng: number }[]
  hubPoint?: { lat: number; lng: number; name: string }
  status?: string // 新增 status 属性
}

const TrackingMap = memo(function TrackingMap({
  points,
  currentPoint,
  startPoint,
  endPoint,
  routePath,
  hubPoint,
  status,
}: TrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const polylineInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)
  const startMarkerInstance = useRef<any>(null)
  const endMarkerInstance = useRef<any>(null)
  const hubMarkerInstance = useRef<any>(null)
  const requestAnimationFrameRef = useRef<number | null>(null)
  const lastOrderIdRef = useRef<string | null>(null)
  const [isMapReady, setIsMapReady] = React.useState(false)
  const hasInitialFitViewRef = useRef(false) // 标记是否已经执行过首次视图适配

  // 检测订单是否变化，如果是新订单则需要重置标志
  const currentOrderId = currentPoint?.orderId
  const isFirstPointOfNewOrder = currentOrderId !== lastOrderIdRef.current

  // 如果订单变化了，重置视图适配标志
  if (isFirstPointOfNewOrder && currentOrderId) {
    hasInitialFitViewRef.current = false
  }

  // 初始化地图 (仅执行一次)
  useEffect(() => {
    let AMap: any = null

    // 异步加载高德地图 JS API
    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY, // 从环境变量获取 Key
      version: '2.0',
      plugins: ['AMap.MoveAnimation', 'AMap.Polyline'], // 加载所需插件
      Loca: {
        version: '2.0.0',
      },
    })
      .then((AMapLoaded) => {
        AMap = AMapLoaded
        if (!mapContainer.current) return

        // 默认中心点（北京）
        const center = [116.397428, 39.90923]

        // 创建地图实例
        if (!mapInstance.current) {
          mapInstance.current = new AMap.Map(mapContainer.current, {
            zoom: 11,
            center: center,
            viewMode: '3D',
          })
        }

        // 初始化折线（轨迹）
        if (!polylineInstance.current) {
          // 使用起点和终点作为初始路径，避免空数组错误
          const initialPath =
            startPoint && endPoint
              ? [
                  [startPoint.lng, startPoint.lat],
                  [endPoint.lng, endPoint.lat],
                ]
              : [[center[0], center[1]]]

          polylineInstance.current = new AMap.Polyline({
            path: initialPath,
            strokeColor: '#7CAA6D', // 绿色轨迹
            strokeWeight: 6,
            strokeOpacity: 0.9,
            zIndex: 50,
            bubble: true,
            lineJoin: 'round',
            lineCap: 'round',
          })
          mapInstance.current.add(polylineInstance.current)
        }

        // 初始化车辆标记
        if (!markerInstance.current) {
          // 确定初始位置（确保使用数字并保持 [lng, lat] 顺序）
          let initialPos: [number, number] = [Number(center[0]), Number(center[1])]
          if (currentPoint) {
            initialPos = [Number(currentPoint.lng), Number(currentPoint.lat)]
          } else if (startPoint) {
            initialPos = [Number(startPoint.lng), Number(startPoint.lat)]
          }

          markerInstance.current = new AMap.Marker({
            position: initialPos,
            zIndex: 200,
          })
          mapInstance.current.add(markerInstance.current)
        }

        setIsMapReady(true)
      })
      .catch((e) => {
        console.error(e)
      })

    // 清理函数：组件卸载时销毁地图实例
    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
        polylineInstance.current = null
        markerInstance.current = null
        startMarkerInstance.current = null
        endMarkerInstance.current = null
      }
    }
  }, []) // 空依赖数组，确保只执行一次 // Empty dependency array to prevent re-initialization

  // Update Start/End Markers
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !(window as any).AMap) return
    const AMap = (window as any).AMap

    // Start Marker
    if (startPoint) {
      if (!startMarkerInstance.current) {
        startMarkerInstance.current = new AMap.Marker({
          position: [Number(startPoint.lng), Number(startPoint.lat)],
          content:
            '<div style="background:#3B82F6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>',
          offset: new AMap.Pixel(-8, -8),
          zIndex: 100,
        })
        mapInstance.current.add(startMarkerInstance.current)
      } else {
        startMarkerInstance.current.setPosition([Number(startPoint.lng), Number(startPoint.lat)])
      }
    }

    // End Marker
    if (endPoint) {
      if (!endMarkerInstance.current) {
        endMarkerInstance.current = new AMap.Marker({
          position: [Number(endPoint.lng), Number(endPoint.lat)],
          content:
            '<div style="background:#EF4444;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>',
          offset: new AMap.Pixel(-8, -8),
          zIndex: 100,
        })
        mapInstance.current.add(endMarkerInstance.current)
      } else {
        endMarkerInstance.current.setPosition([Number(endPoint.lng), Number(endPoint.lat)])
      }
    }
  }, [isMapReady, startPoint, endPoint])

  // 处理中转站标记
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !hubPoint) return

    // 如果已经存在，先移除
    if (hubMarkerInstance.current) {
      mapInstance.current.remove(hubMarkerInstance.current)
    }

    const AMap = (window as any).AMap

    // 创建中转站标记
    const content = `
      <div style="position: relative;">
        <div style="
          background-color: #1890ff; 
          width: 16px; 
          height: 16px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 4px 8px;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          font-size: 12px;
          color: #1890ff;
          white-space: nowrap;
          font-weight: bold;
        ">${hubPoint.name}</div>
      </div>
    `

    hubMarkerInstance.current = new AMap.Marker({
      position: [Number(hubPoint.lng), Number(hubPoint.lat)],
      content: content,
      offset: new AMap.Pixel(-8, -8),
      zIndex: 150,
    })

    mapInstance.current.add(hubMarkerInstance.current)

    return () => {
      if (mapInstance.current && hubMarkerInstance.current) {
        mapInstance.current.remove(hubMarkerInstance.current)
      }
    }
  }, [isMapReady, hubPoint])

  // Update Polyline
  useEffect(() => {
    // console.log('[TrackingMap useEffect] 触发路径更新', {
    //   status,
    //   routePathLength: routePath?.length || 0,
    //   pointsLength: points.length,
    //   isMapReady,
    //   timestamp: new Date().toISOString()
    // })

    if (!isMapReady || !mapInstance.current || !polylineInstance.current) return

    let path: [number, number][] = []
    if (routePath && routePath.length > 0) {
      path = routePath.map((p) => [p.lng, p.lat])
      // console.log('[TrackingMap] 使用 routePath', {
      //   routePathLength: routePath.length,
      //   pathLength: path.length,
      //   firstPoint: routePath[0],
      //   lastPoint: routePath[routePath.length - 1]
      // })
    } else if (points.length > 0) {
      path = points.map((p) => [p.lng, p.lat])
      // console.log('[TrackingMap] 使用 points', {
      //   pointsLength: points.length,
      //   pathLength: path.length,
      //   firstPoint: points[0],
      //   lastPoint: points[points.length - 1]
      // })
    }

    // Only update if path has points
    if (path.length > 0) {
      // console.log('[TrackingMap] 调用 setPath', {
      //   pathLength: path.length,
      //   status
      // })
      polylineInstance.current.setPath(path)

      // 自动调整视图逻辑
      // 1. 首次加载
      // 2. 订单切换
      // 3. 进入第二程配送 (out_for_delivery) - 由 lastStatusRef 触发重置 hasInitialFitViewRef
      const shouldFitView = !hasInitialFitViewRef.current

      if (shouldFitView) {
        // 如果是第二程，我们希望聚焦在当前位置(中转站)和终点之间，而不是全程
        let overlaysToFit = []

        // 关键修复：确保 markerInstance 已经更新到中转站位置
        // 如果 status 是 out_for_delivery，我们强制聚焦于 [当前车位置, 终点]
        if (status === 'out_for_delivery' && markerInstance.current && endMarkerInstance.current) {
          overlaysToFit = [markerInstance.current, endMarkerInstance.current]
        } else {
          // 聚焦：全程轨迹 + 起终点
          overlaysToFit = [
            polylineInstance.current,
            startMarkerInstance.current,
            endMarkerInstance.current,
          ].filter(Boolean)
        }

        if (overlaysToFit.length > 0) {
          // 如果是第二程，使用更紧凑的 padding
          const padding = status === 'out_for_delivery' ? [100, 100, 100, 100] : [50, 50, 50, 50]
          mapInstance.current.setFitView(overlaysToFit, false, padding)
          hasInitialFitViewRef.current = true
        }
      }
    }
  }, [routePath, points, status, isMapReady]) // 添加 status 和 isMapReady 依赖

  // 记录上一次的状态，用于检测状态跳变
  const lastStatusRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (status !== lastStatusRef.current) {
      // 仅当状态变为 out_for_delivery 时，或者首次加载时，允许重新 fitView
      if (status === 'out_for_delivery') {
        // 强制触发 fitView
        hasInitialFitViewRef.current = false

        // 额外逻辑：如果此时地图已经就绪，立即尝试一次 fitView
        // 因为上面的 useEffect 依赖 routePath，可能 routePath 还没变，但 status 变了
        // 我们需要手动触发一次视图更新
        if (mapInstance.current && markerInstance.current && endMarkerInstance.current) {
          const overlays = [markerInstance.current, endMarkerInstance.current]
          mapInstance.current.setFitView(overlays, false, [100, 100, 100, 100])
          hasInitialFitViewRef.current = true
        }
      }
      lastStatusRef.current = status
    }
  }, [status])

  const pendingPointsRef = useRef<TrackPoint[]>([])
  const isAnimatingRef = useRef(false)
  const currentSegmentRef = useRef<{
    start: [number, number]
    end: [number, number]
    startTime: number
    duration: number
  } | null>(null)
  const lastProcessedTsRef = useRef<number>(0)
  const interpolatedPointsRef = useRef<{ lng: number; lat: number }[]>([]) // 插值点队列

  // 监听 points 变化，将新点加入队列
  useEffect(() => {
    if (!points || points.length === 0) return

    // 1. 初始化/重置逻辑
    if (isFirstPointOfNewOrder || pendingPointsRef.current.length > 200) {
      pendingPointsRef.current = []
      interpolatedPointsRef.current = []
      lastProcessedTsRef.current = points[points.length - 1].ts
      lastOrderIdRef.current = currentOrderId || null

      if (markerInstance.current && currentPoint) {
        markerInstance.current.setPosition([currentPoint.lng, currentPoint.lat])
      }
      return
    }

    // 2. 增量添加逻辑
    const newPoints = points.filter((p) => p.ts > lastProcessedTsRef.current)
    if (newPoints.length > 0) {
      pendingPointsRef.current.push(...newPoints)
      lastProcessedTsRef.current = newPoints[newPoints.length - 1].ts
    }
  }, [points, currentOrderId, isFirstPointOfNewOrder, currentPoint])

  // 核心动画循环 (独立于 React Render)
  useEffect(() => {
    let animationFrameId: number

    const tryStartNextSegment = (startTime: number) => {
      // 如果插值队列有点，优先消费插值点
      if (interpolatedPointsRef.current.length > 0) {
        const nextInterpolated = interpolatedPointsRef.current.shift()!
        const currentPos = markerInstance.current.getPosition()
        const start: [number, number] = [currentPos.getLng(), currentPos.getLat()]
        const end: [number, number] = [nextInterpolated.lng, nextInterpolated.lat]

        currentSegmentRef.current = {
          start,
          end,
          startTime,
          duration: 16, // 每个插值点都是16ms
        }
        return true
      }

      // 插值队列空了，从原始点队列取新点并生成插值
      if (pendingPointsRef.current.length === 0) return false

      const nextPoint = pendingPointsRef.current.shift()!
      const currentPos = markerInstance.current.getPosition()
      const start: [number, number] = [currentPos.getLng(), currentPos.getLat()]
      const end: [number, number] = [nextPoint.lng, nextPoint.lat]

      const dist = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2))

      // 数据错误，直接跳过
      if (dist > 2.0) {
        markerInstance.current.setPosition(end)
        return tryStartNextSegment(startTime)
      }

      // 关键：根据距离生成插值点
      if (status === 'out_for_delivery') {
        // 第二段：每10米生成一个插值点，保证动画细腻
        // 0.0001度 ≈ 10米
        const steps = Math.max(Math.ceil(dist / 0.0001), 1)

        for (let i = 1; i <= steps; i++) {
          const ratio = i / steps
          interpolatedPointsRef.current.push({
            lng: start[0] + (end[0] - start[0]) * ratio,
            lat: start[1] + (end[1] - start[1]) * ratio,
          })
        }
      } else {
        // 第一段：正常处理，不生成额外插值
        interpolatedPointsRef.current.push({ lng: end[0], lat: end[1] })
      }

      // 递归启动第一个插值点
      return tryStartNextSegment(startTime)
    }

    const loop = (time: number) => {
      if (!markerInstance.current) {
        animationFrameId = requestAnimationFrame(loop)
        return
      }

      if (!currentSegmentRef.current) {
        tryStartNextSegment(time)
      }

      if (currentSegmentRef.current) {
        isAnimatingRef.current = true

        let seg = currentSegmentRef.current
        let elapsed = time - seg.startTime

        while (elapsed >= seg.duration) {
          const overflow = elapsed - seg.duration
          const previousEnd = seg.end

          markerInstance.current.setPosition(previousEnd)
          currentSegmentRef.current = null

          const started = tryStartNextSegment(time - overflow)

          if (!started) {
            isAnimatingRef.current = false
            break
          }

          seg = currentSegmentRef.current!
          elapsed = time - seg.startTime
        }

        if (currentSegmentRef.current) {
          const progress = elapsed / seg.duration
          const lng = seg.start[0] + (seg.end[0] - seg.start[0]) * progress
          const lat = seg.start[1] + (seg.end[1] - seg.start[1]) * progress
          markerInstance.current.setPosition([lng, lat])
        }
      }

      animationFrameId = requestAnimationFrame(loop)
    }

    animationFrameId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [status, endPoint])

  // Update Truck Position - 已废弃，由上面的 Loop 接管
  // 保留此 Effect 仅用于处理 "首次加载瞬移" 的边界情况 (虽然上面的 useEffect 已经处理了部分)
  // 但为了保险，我们保留一个简单的监听器来处理非动画状态下的位置同步?
  // 不，上面的 Loop 已经涵盖了所有情况。我们删除旧的 useEffect。

  return (
    <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden shadow-inner" />
  )
})

export default TrackingMap
