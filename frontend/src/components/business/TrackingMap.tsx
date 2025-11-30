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
  const isFirstUpdate = useRef(true)
  const [isMapReady, setIsMapReady] = React.useState(false)

  // 仅初始化一次地图
  useEffect(() => {
    let AMap: any = null

    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY, // 替换为你的高德地图 Key
      version: '2.0',
      plugins: ['AMap.MoveAnimation', 'AMap.Polyline'],
    })
      .then((AMapLoaded) => {
        AMap = AMapLoaded
        if (!mapContainer.current) return

        // 默认中心点（北京）
        const center = [116.397428, 39.90923]

        if (!mapInstance.current) {
          mapInstance.current = new AMap.Map(mapContainer.current, {
            zoom: 11,
            center: center,
            viewMode: '3D',
          })
        }

        // 初始化折线
        if (!polylineInstance.current) {
          polylineInstance.current = new AMap.Polyline({
            path: [],
            strokeColor: '#7CAA6D',
            strokeWeight: 6,
            strokeOpacity: 0.9,
            zIndex: 50,
            bubble: true,
            lineJoin: 'round',
            lineCap: 'round',
          })
          mapInstance.current.add(polylineInstance.current)
        }

        // 初始化标记（默认图标）
        if (!markerInstance.current) {
          // 确定初始位置
          let initialPos = center
          if (currentPoint) {
            initialPos = [currentPoint.lng, currentPoint.lat]
          } else if (startPoint) {
            initialPos = [startPoint.lng, startPoint.lat]
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
  }, []) // Empty dependency array to prevent re-initialization

  // Update Start/End Markers
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !(window as any).AMap) return
    const AMap = (window as any).AMap

    // Start Marker
    if (startPoint) {
      if (!startMarkerInstance.current) {
        startMarkerInstance.current = new AMap.Marker({
          position: [startPoint.lng, startPoint.lat],
          content:
            '<div style="background:#3B82F6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>',
          offset: new AMap.Pixel(-8, -8),
          zIndex: 100,
        })
        mapInstance.current.add(startMarkerInstance.current)
      } else {
        startMarkerInstance.current.setPosition([startPoint.lng, startPoint.lat])
      }
    }

    // End Marker
    if (endPoint) {
      if (!endMarkerInstance.current) {
        endMarkerInstance.current = new AMap.Marker({
          position: [endPoint.lng, endPoint.lat],
          content:
            '<div style="background:#EF4444;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>',
          offset: new AMap.Pixel(-8, -8),
          zIndex: 100,
        })
        mapInstance.current.add(endMarkerInstance.current)
      } else {
        endMarkerInstance.current.setPosition([endPoint.lng, endPoint.lat])
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

      // Only fit view if we haven't done it yet or if it's the initial load of the path
      // We can check if the map center is still the default or if we want to force it
      // For now, let's fit view when path length changes significantly or on first load
      const overlays = [
        polylineInstance.current,
        startMarkerInstance.current,
        endMarkerInstance.current,
      ].filter(Boolean)

      if (overlays.length > 0) {
        mapInstance.current.setFitView(overlays, false, [50, 50, 50, 50])
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

    // If it's the first update (or first valid point after init), snap to position
    if (isFirstUpdate.current) {
      markerInstance.current.setPosition([end.lng, end.lat])
      isFirstUpdate.current = false
      return
    }

    // Animate using GSAP
    tweenRef.current = gsap.to(start, {
      lng: end.lng,
      lat: end.lat,
      duration: 4, // 4 seconds (slightly less than 5s update interval)
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
  }, [isMapReady, currentPoint])

  return (
    <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden shadow-inner" />
  )
})

export default TrackingMap
