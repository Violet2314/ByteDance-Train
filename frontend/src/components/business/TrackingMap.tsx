import React, { useEffect, useRef } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'
import type { TrackPoint } from '@logistics/shared'

interface TrackingMapProps {
  points: TrackPoint[]
  currentPoint?: TrackPoint
  startPoint?: { lat: number; lng: number }
  endPoint?: { lat: number; lng: number }
}

export default function TrackingMap({
  points,
  currentPoint,
  startPoint,
  endPoint,
}: TrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const polylineInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)
  const startMarkerInstance = useRef<any>(null)
  const endMarkerInstance = useRef<any>(null)

  // Helper to update markers
  const updateMarkers = React.useCallback(
    (AMap: any) => {
      if (!mapInstance.current || !AMap) return

      // Start Marker
      if (startPoint) {
        if (!startMarkerInstance.current) {
          startMarkerInstance.current = new AMap.Marker({
            position: [startPoint.lng, startPoint.lat],
            content:
              '<div style="background:#3B82F6;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>',
            offset: new AMap.Pixel(-6, -6),
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
              '<div style="background:#3B82F6;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>',
            offset: new AMap.Pixel(-6, -6),
            zIndex: 100,
          })
          mapInstance.current.add(endMarkerInstance.current)
        } else {
          endMarkerInstance.current.setPosition([endPoint.lng, endPoint.lat])
        }
      }
    },
    [startPoint, endPoint]
  )

  useEffect(() => {
    let AMap: any = null

    AMapLoader.load({
      key: '6d736976336dac732baf2fe3d00c4254', // 替换为你的高德地图 Key
      version: '2.0',
      plugins: ['AMap.MoveAnimation', 'AMap.Polyline'],
    })
      .then((AMapLoaded) => {
        AMap = AMapLoaded
        if (!mapContainer.current) return

        if (!mapInstance.current) {
          mapInstance.current = new AMap.Map(mapContainer.current, {
            zoom: 11,
            center: [116.397428, 39.90923], // Default Beijing
            viewMode: '3D',
          })
        }

        // Initialize Polyline
        if (!polylineInstance.current) {
          polylineInstance.current = new AMap.Polyline({
            path: [],
            strokeColor: '#7CAA6D',
            strokeWeight: 6,
            strokeOpacity: 0.9,
            zIndex: 50,
            bubble: true,
          })
          mapInstance.current.add(polylineInstance.current)
        }

        // Initialize Marker
        if (!markerInstance.current) {
          markerInstance.current = new AMap.Marker({
            position: [116.397428, 39.90923],
            icon: new AMap.Icon({
              size: new AMap.Size(40, 40),
              image: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png', // Replace with truck icon
              imageSize: new AMap.Size(40, 40),
            }),
            offset: new AMap.Pixel(-20, -40),
          })
          mapInstance.current.add(markerInstance.current)
        }

        // Start/End Markers
        updateMarkers(AMap)
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
  }, [updateMarkers])

  // Update markers when props change
  useEffect(() => {
    if ((window as any).AMap) {
      updateMarkers((window as any).AMap)
    }
  }, [updateMarkers])

  // Update Polyline and Marker when points change
  useEffect(() => {
    if (mapInstance.current && polylineInstance.current && points.length > 0) {
      const path = points.map((p) => [p.lng, p.lat])
      polylineInstance.current.setPath(path)

      // Fit view to show the whole path
      // mapInstance.current.setFitView([polylineInstance.current, startMarkerInstance.current, endMarkerInstance.current])
    }
  }, [points])

  // Update Marker position
  useEffect(() => {
    if (mapInstance.current && markerInstance.current && currentPoint) {
      const newPos = [currentPoint.lng, currentPoint.lat]
      // Use moveTo for smooth animation if available, else setPosition
      if (markerInstance.current.moveTo) {
        markerInstance.current.moveTo(newPos, {
          duration: 1000,
          autoRotation: true,
        })
      } else {
        markerInstance.current.setPosition(newPos)
      }

      // Center map on vehicle if needed, or keep fit view
      // mapInstance.current.setCenter(newPos)
    }
  }, [currentPoint])

  return (
    <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden shadow-inner" />
  )
}
