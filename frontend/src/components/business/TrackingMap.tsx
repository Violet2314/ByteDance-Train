import React, { useEffect, useRef, memo } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'
import gsap from 'gsap'
import type { TrackPoint } from '@logistics/shared'

interface TrackingMapProps {
  points: TrackPoint[]
  currentPoint?: TrackPoint
  startPoint?: { lat: number; lng: number }
  endPoint?: { lat: number; lng: number }
  routePath?: { lat: number; lng: number }[]
}

const TrackingMap = memo(function TrackingMap({
  points,
  currentPoint,
  startPoint,
  endPoint,
  routePath,
}: TrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const polylineInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)
  const startMarkerInstance = useRef<any>(null)
  const endMarkerInstance = useRef<any>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)
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
          polylineInstance.current = new AMap.Polyline({
            path: [],
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

  // Update Polyline
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !polylineInstance.current) return

    let path: [number, number][] = []
    if (routePath && routePath.length > 0) {
      path = routePath.map((p) => [p.lng, p.lat])
    } else if (points.length > 0) {
      path = points.map((p) => [p.lng, p.lat])
    }

    // Only update if path has points
    if (path.length > 0) {
      polylineInstance.current.setPath(path)

      // 只在首次加载或订单切换时自动调整视图，避免用户操作后地图自动回弹
      if (!hasInitialFitViewRef.current) {
        const overlays = [
          polylineInstance.current,
          startMarkerInstance.current,
          endMarkerInstance.current,
        ].filter(Boolean)

        if (overlays.length > 0) {
          mapInstance.current.setFitView(overlays, false, [50, 50, 50, 50])
          hasInitialFitViewRef.current = true
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapReady, routePath, points.length]) // Depend on points.length to avoid excessive updates

  // Update Truck Position
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !markerInstance.current || !currentPoint) return

    const currentPos = markerInstance.current.getPosition()
    const start = { lng: currentPos.getLng(), lat: currentPos.getLat() }
    const end = { lng: currentPoint.lng, lat: currentPoint.lat }

    // Kill previous tween if exists
    if (tweenRef.current) {
      tweenRef.current.kill()
    }

    // 如果是新订单的第一个点，直接设置位置不做动画
    if (isFirstPointOfNewOrder) {
      markerInstance.current.setPosition([end.lng, end.lat])
      lastOrderIdRef.current = currentPoint.orderId
      if (import.meta.env.DEV) {
        console.log(`[TrackingMap] New order ${currentPoint.orderId}, snap to position`)
      }
      return
    }

    // 后续的点使用GSAP动画平滑移动（对应5秒的更新间隔）
    console.log(
      `[TrackingMap] Animating from [${start.lng}, ${start.lat}] to [${end.lng}, ${end.lat}]`
    )
    tweenRef.current = gsap.to(start, {
      lng: end.lng,
      lat: end.lat,
      duration: 4, // 4秒动画（略小于5秒更新间隔，留1秒缓冲）
      ease: 'linear',
      onUpdate: () => {
        if (markerInstance.current) {
          markerInstance.current.setPosition([start.lng, start.lat])
        }
      },
    })

    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill()
      }
    }
  }, [isMapReady, currentPoint, isFirstPointOfNewOrder])

  return (
    <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden shadow-inner" />
  )
})

export default TrackingMap
