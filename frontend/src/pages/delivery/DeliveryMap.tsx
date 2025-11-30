import React, { useEffect, useRef, useState } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'

interface DeliveryMapProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeRule: any
  isEditingArea: boolean
  onPolygonChange: (path: [number, number][]) => void
  onMapReady: (ready: boolean) => void
  stats?: {
    deliverable: number
    outOfRange: number
    inTransit: number
  }
}

export default function DeliveryMap({
  activeRule,
  isEditingArea,
  onPolygonChange,
  onMapReady,
  stats,
}: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polygonInstance = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polyEditorInstance = useRef<any>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const lastRuleIdRef = useRef<number | null>(null)

  // Initialize Map
  useEffect(() => {
    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY, // Replace with your key
      version: '2.0',
      plugins: ['AMap.Polygon', 'AMap.MouseTool', 'AMap.PolyEditor'],
    })
      .then((AMap) => {
        if (!mapContainer.current) return

        if (!mapInstance.current) {
          mapInstance.current = new AMap.Map(mapContainer.current, {
            zoom: 11,
            center: [116.397428, 39.90923],
            viewMode: '2D',
          })

          mapInstance.current.on('complete', () => {
            setIsMapLoaded(true)
            onMapReady(true)
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
      }
    }
  }, [onMapReady])

  // Update Map Polygon when Active Rule Changes
  useEffect(() => {
    if (!mapInstance.current || !activeRule || !isMapLoaded) return

    if (!activeRule.path) return

    // Clear existing polygon and editor
    if (polyEditorInstance.current) {
      polyEditorInstance.current.close()
      polyEditorInstance.current = null
    }
    if (polygonInstance.current) {
      mapInstance.current.remove(polygonInstance.current)
      polygonInstance.current = null
    }

    // Create new polygon
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AMap = (window as any).AMap
    if (!AMap) return

    polygonInstance.current = new AMap.Polygon({
      path: activeRule.path,
      strokeColor: '#74B868',
      strokeWeight: 2,
      strokeOpacity: 1,
      fillOpacity: 0.2,
      fillColor: '#74B868',
      zIndex: 50,
      bubble: true, // Allow events to bubble
    })

    mapInstance.current.add(polygonInstance.current)

    // Only fit view if rule ID changed
    if (lastRuleIdRef.current !== activeRule.id) {
      mapInstance.current.setFitView([polygonInstance.current])
      lastRuleIdRef.current = activeRule.id
    }

    // Initialize Editor
    polyEditorInstance.current = new AMap.PolyEditor(mapInstance.current, polygonInstance.current)

    // Listen for adjustments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    polyEditorInstance.current.on('end', (_e: any) => {
      // This event might not be enough if we want real-time updates or save on button click
      // But for now we rely on the parent calling a save action which reads the polygon path
      // Actually, the parent calls toggleEditArea which triggers save.
      // We need to expose a way for the parent to get the current path, OR update parent on change.
      // The original code updated state on "Save" button click by reading polygonInstance.
      // Here we can keep that logic if we expose the polygonInstance or a method.
      // But better: let's use a ref or callback exposed to parent?
      // Actually, the parent controls `isEditingArea`. When it changes from true to false, we should save.
    })
  }, [activeRule, isMapLoaded])

  // Handle Edit Mode Toggle
  const prevIsEditingArea = useRef(isEditingArea)
  useEffect(() => {
    if (!polyEditorInstance.current) return

    if (isEditingArea) {
      polyEditorInstance.current.open()
    } else {
      polyEditorInstance.current.close()
      // When closing edit mode (saving), we update the parent
      // Only save if we were previously editing
      if (prevIsEditingArea.current === true && polygonInstance.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newPath = polygonInstance.current.getPath().map((p: any) => [p.lng, p.lat])
        onPolygonChange(newPath)
      }
    }
    prevIsEditingArea.current = isEditingArea
  }, [isEditingArea, onPolygonChange])

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="w-full h-full" />

      <div className="absolute top-6 right-6 flex flex-col gap-3 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 space-y-3 min-w-[200px] pointer-events-auto">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            地图图例
          </h4>
          <div className="flex items-center justify-between gap-3 text-sm font-medium text-gray-700">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
              <span>可配送</span>
            </div>
            <span className="font-bold text-green-600">{stats?.deliverable || 0}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm font-medium text-gray-700">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"></span>
              <span>超出范围</span>
            </div>
            <span className="font-bold text-red-500">{stats?.outOfRange || 0}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm font-medium text-gray-700">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></span>
              <span>配送中</span>
            </div>
            <span className="font-bold text-blue-500">{stats?.inTransit || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
