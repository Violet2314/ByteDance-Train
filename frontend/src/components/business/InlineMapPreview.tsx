import React, { useEffect, useRef } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'

interface InlineMapPreviewProps {
  address: string
  lat: number
  lng: number
  visible: boolean
}

const InlineMapPreview: React.FC<InlineMapPreviewProps> = ({ address, lat, lng, visible }) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)

  useEffect(() => {
    if (!visible || !mapContainer.current || !lat || !lng) {
      // 当 visible 变为 false 时，销毁地图实例
      if (!visible && mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
        markerInstance.current = null
      }
      return
    }

    // 加载高德地图
    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Marker'],
    })
      .then((AMap) => {
        if (!mapContainer.current) return

        // 如果地图实例不存在，创建新的
        if (!mapInstance.current) {
          mapInstance.current = new AMap.Map(mapContainer.current, {
            zoom: 15,
            center: [lng, lat],
            viewMode: '2D',
          })
        } else {
          // 如果地图实例存在，更新中心点
          mapInstance.current.setCenter([lng, lat])
        }

        // 清除旧标记
        if (markerInstance.current) {
          mapInstance.current.remove(markerInstance.current)
        }

        // 添加标记
        markerInstance.current = new AMap.Marker({
          position: [lng, lat],
          title: address,
          content: `
            <div style="
              background: #1890ff;
              width: 20px;
              height: 20px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 6px;
                height: 6px;
                background: white;
                border-radius: 50%;
                transform: rotate(45deg);
              "></div>
            </div>
          `,
          offset: new AMap.Pixel(-10, -20),
        })

        mapInstance.current.add(markerInstance.current)
      })
      .catch((e) => {
        console.error('地图加载失败', e)
      })

    // 清理函数：组件卸载时销毁地图
    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
        markerInstance.current = null
      }
    }
  }, [visible, lat, lng, address])

  if (!visible) return null

  return (
    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '200px',
        }}
      />
      <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 border-t border-gray-200">
        <span className="font-medium">定位结果：</span>
        {address}
      </div>
    </div>
  )
}

export default InlineMapPreview
