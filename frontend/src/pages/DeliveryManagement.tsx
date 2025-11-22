import React, { useEffect, useRef } from 'react'
import { Card, Button, Input, Select, List, Tag, Space } from 'antd'
import { Search, Plus, Map as MapIcon, Trash2, Edit2 } from 'lucide-react'
import AMapLoader from '@amap/amap-jsapi-loader'

export default function DeliveryManagement() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

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
        strokeColor: "#7CAA6D", 
        strokeWeight: 2,
        strokeOpacity: 1,
        fillOpacity: 0.2,
        fillColor: '#7CAA6D',
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
    { id: 1, company: '顺丰速运', days: '1-2天', area: '北京市朝阳区核心商圈' },
    { id: 2, company: '中通快递', days: '2-3天', area: '北京市海淀区全境' },
    { id: 3, company: '京东物流', days: '1天', area: '北京市五环内' },
  ]

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6">
      {/* Left Sidebar - Tools */}
      <div className="w-96 flex flex-col gap-4">
        <Card title="配送区域设置" bordered={false} className="shadow-subtle flex-none">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button icon={<MapIcon size={16} />} className="flex-1">绘制区域</Button>
              <Button danger icon={<Trash2 size={16} />}>清除</Button>
            </div>
            <div className="p-3 bg-bg-page rounded-xl border border-gray-100">
              <p className="text-xs text-text-tertiary mb-2">当前选中区域</p>
              <div className="flex items-center justify-between">
                <span className="font-medium">朝阳区核心商圈</span>
                <Tag color="success">已生效</Tag>
              </div>
            </div>
          </div>
        </Card>

        <Card title="配送规则" bordered={false} className="shadow-subtle flex-1 overflow-hidden flex flex-col">
          <div className="mb-4 flex gap-2">
            <Input prefix={<Search size={16} />} placeholder="搜索规则" />
            <Button type="primary" icon={<Plus size={16} />} className="bg-primary-base" />
          </div>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <List
              dataSource={rules}
              renderItem={item => (
                <List.Item actions={[<Button type="text" size="small" icon={<Edit2 size={14} />} />]}>
                  <List.Item.Meta
                    title={<span className="font-medium">{item.company}</span>}
                    description={
                      <div className="space-y-1 mt-1">
                        <Tag className="mr-0">{item.days}</Tag>
                        <div className="text-xs text-text-tertiary truncate">{item.area}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </Card>
      </div>

      {/* Right - Map */}
      <div className="flex-1 bg-white rounded-2xl shadow-moderate overflow-hidden relative">
        <div ref={mapContainer} className="w-full h-full" />
        
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>可配送 (124)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span>超区 (12)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-blue-400"></span>
            <span>配送中 (56)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
