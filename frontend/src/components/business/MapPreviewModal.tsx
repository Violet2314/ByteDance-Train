import React, { useEffect, useRef } from 'react'
import { Modal } from 'antd'
import AMapLoader from '@amap/amap-jsapi-loader'

interface MapPreviewModalProps {
  visible: boolean
  onClose: () => void
  address: string
  lat: number
  lng: number
}

const MapPreviewModal: React.FC<MapPreviewModalProps> = ({
  visible,
  onClose,
  address,
  lat,
  lng,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)

  useEffect(() => {
    if (!visible || !mapContainer.current) return

    // 加载高德地图
    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Marker'],
    })
      .then((AMap) => {
        if (!mapContainer.current) return

        // 创建地图实例
        if (!mapInstance.current) {
          mapInstance.current = new AMap.Map(mapContainer.current, {
            zoom: 15,
            center: [lng, lat],
            viewMode: '2D',
          })
        } else {
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
              width: 24px;
              height: 24px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
                transform: rotate(45deg);
              "></div>
            </div>
          `,
          offset: new AMap.Pixel(-12, -24),
        })

        mapInstance.current.add(markerInstance.current)
      })
      .catch((e) => {
        console.error('地图加载失败', e)
      })

    return () => {
      // 组件卸载时清理
      if (mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
        markerInstance.current = null
      }
    }
  }, [visible, lat, lng, address])

  return (
    <Modal
      title={
        <div>
          <div className="text-lg font-bold">定位结果预览</div>
          <div className="text-sm text-gray-500 font-normal mt-1">{address}</div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '450px',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
      <div className="mt-4 text-center text-gray-500 text-sm">
        请确认地图标记位置是否与实际地址相符
      </div>
    </Modal>
  )
}

export default MapPreviewModal
