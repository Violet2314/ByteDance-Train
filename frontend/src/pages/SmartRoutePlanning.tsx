import React, { useEffect, useRef, useState, useMemo, memo } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'
import { api } from '../services/api'
import { Card, Table, Button, Space, Tag, Alert, Switch, Select, App } from 'antd'
import {
  CarOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  SendOutlined,
} from '@ant-design/icons'
import type { Order } from '@logistics/shared'

const SmartRoutePlanning = memo(function SmartRoutePlanning() {
  const { message } = App.useApp()
  // Refs 用于持有地图实例和 DOM 元素，避免重渲染时丢失
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const drivingInstance = useRef<any>(null)
  const startMarker = useRef<any>(null)

  // 获取待处理订单和配送规则
  const { data: ordersData, isLoading, refetch } = api.useGetMyOrdersQuery({ status: 'pending' })
  const { data: rulesData } = api.useGetDeliveryRulesQuery()
  const [batchShipOrdersOptimized, { isLoading: isShipping }] =
    api.useBatchShipOrdersOptimizedMutation()

  const allOrders = useMemo(() => ordersData?.data || [], [ordersData])
  const rules = rulesData?.data || []

  // 状态管理
  const [selectedSender, setSelectedSender] = useState<string | null>(null)
  const [selectedRule, setSelectedRule] = useState<number | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isPlanning, setIsPlanning] = useState(false)
  const [routeInfo, setRouteInfo] = useState<{ distance: number; time: number } | null>(null)
  const [showTraffic, setShowTraffic] = useState(false)
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[]>([])
  const trafficLayer = useRef<any>(null)

  // 逻辑：按发货人分组订单
  // 因为通常一次配送任务是从同一个发货点出发的
  const senders = useMemo(() => {
    const map = new Map<
      string,
      { name: string; address: string; lat: number; lng: number; count: number }
    >()
    allOrders.forEach((o) => {
      if (o.sender && o.sender.name) {
        const key = o.sender.name
        if (!map.has(key)) {
          map.set(key, {
            name: o.sender.name,
            address: o.sender.address,
            lat: o.sender.lat || 39.90923,
            lng: o.sender.lng || 116.397428,
            count: 0,
          })
        }
        map.get(key)!.count++
      }
    })
    return Array.from(map.values())
  }, [allOrders])

  // 根据选中的发货人过滤订单
  const filteredOrders = useMemo(() => {
    if (!selectedSender) return []
    return allOrders.filter((o) => o.sender?.name === selectedSender)
  }, [selectedSender, allOrders])

  // 如果有发货人，自动选择第一个
  useEffect(() => {
    if (senders.length > 0 && !selectedSender) {
      setSelectedSender(senders[0].name)
    }
  }, [senders, selectedSender])

  // 发货人变更时重置选择和地图状态
  useEffect(() => {
    setSelectedRowKeys([])
    setRouteInfo(null)
    if (drivingInstance.current) {
      drivingInstance.current.clear()
    }
  }, [selectedSender])

  // 初始化高德地图
  useEffect(() => {
    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Driving', 'AMap.TileLayer.Traffic'], // 加载驾车规划和实时路况插件
    })
      .then((AMap) => {
        if (!mapContainer.current) return

        if (!mapInstance.current) {
          mapInstance.current = new AMap.Map(mapContainer.current, {
            zoom: 11,
            center: [116.397428, 39.90923],
            viewMode: '2D',
          })

          trafficLayer.current = new AMap.TileLayer.Traffic({
            zIndex: 10,
            autoRefresh: true,
            interval: 180,
          })
          trafficLayer.current.setMap(null)
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
  }, [])

  // 发货人变更时更新起点标记
  useEffect(() => {
    if (!mapInstance.current || !selectedSender) return

    const AMap = (window as any).AMap
    const sender = senders.find((s) => s.name === selectedSender)

    if (sender && AMap) {
      const position = [sender.lng, sender.lat]

      if (startMarker.current) {
        startMarker.current.setPosition(position)
      } else {
        startMarker.current = new AMap.Marker({
          position: position,
          title: '发货点: ' + sender.name,
          label: { content: '发货点: ' + sender.name, direction: 'top' },
          icon: new AMap.Icon({
            size: new AMap.Size(25, 34),
            image: '//a.amap.com/jsapi_demos/static/demo-center/icons/dir-marker.png',
            imageSize: new AMap.Size(135, 40),
            imageOffset: new AMap.Pixel(-9, -3),
          }),
          offset: new AMap.Pixel(-13, -34), // 图标宽度一半和图标高度，让底部尖端对准坐标
          map: mapInstance.current,
        })
      }
      mapInstance.current.setCenter(position)
    }
  }, [selectedSender, senders])

  // 切换路况图层
  useEffect(() => {
    if (trafficLayer.current && mapInstance.current) {
      if (showTraffic) {
        trafficLayer.current.setMap(mapInstance.current)
      } else {
        trafficLayer.current.setMap(null)
      }
    }
  }, [showTraffic])

  const handlePlanRoute = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一个订单进行规划')
      return
    }
    if (selectedRowKeys.length > 10) {
      message.warning('单次配送建议不超过10个订单')
      return
    }

    const sender = senders.find((s) => s.name === selectedSender)
    if (!sender) return

    setIsPlanning(true)
    setRouteInfo(null)

    // 获取选中的订单
    const selectedOrders = filteredOrders.filter((o) => selectedRowKeys.includes(o.id))

    // 简单的 TSP (最近邻) 排序
    // 从发货点开始
    let currentPoint = { lng: sender.lng, lat: sender.lat }
    const remainingOrders = [...selectedOrders]
    const sortedOrders: Order[] = []

    while (remainingOrders.length > 0) {
      let nearestIndex = -1
      let minDistance = Infinity

      remainingOrders.forEach((order, index) => {
        const d = Math.sqrt(
          Math.pow(Number(order.address.lng) - currentPoint.lng, 2) +
            Math.pow(Number(order.address.lat) - currentPoint.lat, 2)
        )
        if (d < minDistance) {
          minDistance = d
          nearestIndex = index
        }
      })

      if (nearestIndex !== -1) {
        const nextOrder = remainingOrders[nearestIndex]
        sortedOrders.push(nextOrder)
        currentPoint = { lng: Number(nextOrder.address.lng), lat: Number(nextOrder.address.lat) }
        remainingOrders.splice(nearestIndex, 1)
      }
    }

    // 准备途经点
    const endOrder = sortedOrders[sortedOrders.length - 1]
    const waypoints = sortedOrders
      .slice(0, sortedOrders.length - 1)
      .map((o) => [Number(o.address.lng), Number(o.address.lat)])
    const endPoint = [Number(endOrder.address.lng), Number(endOrder.address.lat)]
    const startPoint = [sender.lng, sender.lat]

    const AMap = (window as any).AMap

    // 清除之前的路线
    if (drivingInstance.current) {
      drivingInstance.current.clear()
    }

    drivingInstance.current = new AMap.Driving({
      map: mapInstance.current,
      policy: AMap.DrivingPolicy.LEAST_TIME,
      panel: 'panel',
      hideMarkers: false,
    })

    drivingInstance.current.search(
      startPoint,
      endPoint,
      {
        waypoints: waypoints,
      },

      (status: string, result: any) => {
        setIsPlanning(false)
        if (status === 'complete') {
          message.success('路线规划成功')

          const routes = result.routes[0]
          setRouteInfo({
            distance: routes.distance,
            time: routes.time,
          })

          // 提取完整路径用于后端模拟
          const fullPath: { lat: number; lng: number }[] = []

          routes.steps.forEach((step: any) => {
            step.path.forEach((p: any) => {
              fullPath.push({ lat: p.lat, lng: p.lng })
            })
          })
          setRoutePath(fullPath)
        } else {
          message.error('路线规划失败: ' + result)
        }
      }
    )
  }

  const handleDispatch = async () => {
    if (!routeInfo || routePath.length === 0) return
    if (!selectedRule) {
      message.warning('请选择配送规则')
      return
    }
    try {
      await batchShipOrdersOptimized({
        orderIds: selectedRowKeys as string[],
        routePath: routePath,
        ruleId: selectedRule,
      }).unwrap()
      message.success('已按规划路线发货，订单已加入追踪系统')
      setSelectedRowKeys([])
      setRouteInfo(null)
      setRoutePath([])
      if (drivingInstance.current) drivingInstance.current.clear()
      refetch()
    } catch (error) {
      message.error('发货失败')
    }
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => text.slice(0, 8),
    },
    {
      title: '收货地址',
      dataIndex: ['address', 'text'],
      key: 'address',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'pending' ? 'orange' : 'green'}>
          {status === 'pending' ? '待配送' : status}
        </Tag>
      ),
    },
  ]

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col p-4 gap-4">
      <Card title="智能路线规划 (Smart Route Planning)" className="flex-shrink-0">
        <div className="flex flex-col gap-4">
          <Alert
            message="请先选择发货人，再勾选订单进行路线规划。规划完成后可一键发货。"
            type="info"
            showIcon
          />

          <div className="flex flex-wrap gap-4 items-center justify-between">
            <Space size="large" wrap>
              <Space>
                <span>发货人:</span>
                <Select
                  style={{ width: 200 }}
                  value={selectedSender}
                  onChange={setSelectedSender}
                  options={senders.map((s) => ({
                    label: `${s.name} (${s.count}单)`,
                    value: s.name,
                  }))}
                  placeholder="请选择发货人"
                />
              </Space>

              <Space>
                <span>配送规则:</span>
                <Select
                  style={{ width: 200 }}
                  value={selectedRule}
                  onChange={setSelectedRule}
                  options={rules.map((r: any) => ({
                    label: `${r.company} (${r.inter_province || r.days})`,
                    value: r.id,
                  }))}
                  placeholder="请选择配送规则"
                  allowClear
                />
              </Space>

              <Switch
                checkedChildren="实时路况开启"
                unCheckedChildren="实时路况关闭"
                checked={showTraffic}
                onChange={setShowTraffic}
              />
            </Space>

            <Space wrap>
              {routeInfo && (
                <div className="flex flex-wrap gap-2">
                  <Tag icon={<EnvironmentOutlined />} color="blue">
                    总里程: {(routeInfo.distance / 1000).toFixed(1)} km
                  </Tag>
                </div>
              )}
              <Button
                icon={<CarOutlined />}
                onClick={handlePlanRoute}
                loading={isPlanning}
                disabled={selectedRowKeys.length === 0}
              >
                开始规划
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleDispatch}
                loading={isShipping}
                disabled={!routeInfo}
              >
                确认发货
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Order List */}
        <Card
          className="w-1/3 flex flex-col overflow-hidden"
          styles={{ body: { padding: 0, flex: 1, overflow: 'auto' } }}
        >
          <Table
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            columns={columns}
            dataSource={filteredOrders}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            scroll={{ y: 500 }}
          />
        </Card>

        {/* Map */}
        <Card
          className="flex-1 flex flex-col relative"
          styles={{ body: { padding: 0, height: '100%' } }}
        >
          <div ref={mapContainer} className="w-full h-full" />
          <div id="panel" className="hidden" />
        </Card>
      </div>
    </div>
  )
})

export default SmartRoutePlanning
