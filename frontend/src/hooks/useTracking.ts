import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import type { TrackPoint, ShipmentState } from '@logistics/shared'
import { useGetOrderByIdQuery, useGetOrderTrackingQuery } from '../services/api'
import { socket } from '../services/socket'

export function useTracking(id: string | undefined) {
  // 获取订单详情
  const {
    data: orderData,
    isLoading: isOrderLoading,
    error: orderError,
  } = useGetOrderByIdQuery(id!, { skip: !id })

  // 获取历史轨迹数据
  const { data: trackingData, isLoading: isTrackingLoading } = useGetOrderTrackingQuery(id!, {
    skip: !id,
    refetchOnMountOrArgChange: true,
  })

  // 实时轨迹点和状态
  const [realtimePoints, setRealtimePoints] = useState<TrackPoint[]>([])
  const [currentStatus, setCurrentStatus] = useState<string>('')

  const order = orderData?.data

  // 初始化状态：当订单数据加载完成后，设置当前状态
  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status)
    }
  }, [order])

  // 初始化轨迹：当历史轨迹加载完成后，设置到 realtimePoints
  useEffect(() => {
    if (trackingData?.data && id) {
      // 后端返回的是单个对象，包含最新的tracking信息
      const data = trackingData.data as any
      // 将单个对象转换为数组格式，使用实际的当前位置坐标
      setRealtimePoints([
        {
          orderId: id,
          lat: data.lat,
          lng: data.lng,
          ts: data.ts || Date.now(),
          routePath: data.path, // path字段包含完整路线
        },
      ])
    }
  }, [trackingData, id])

  // Socket 连接与事件监听
  useEffect(() => {
    if (!id) return

    // 连接 Socket 并订阅特定订单的更新
    socket.connect()
    socket.emit('subscribe', { orderId: id })

    // 处理实时位置更新
    const handleTrackUpdate = (point: TrackPoint) => {
      setRealtimePoints((prev) => {
        // 避免重复添加相同时间戳的点
        if (prev.some((p) => p.ts === point.ts)) return prev

        // 保留第一个点的routePath（完整路线规划）
        const routePath = prev.length > 0 ? prev[0].routePath : undefined

        // 添加新的位置点，保留routePath
        return [...prev, { ...point, routePath }]
      })
    }

    // 处理订单状态更新 (如：已发货 -> 运输中)
    const handleStatusUpdate = (payload: ShipmentState) => {
      if (payload.orderId === id) {
        setCurrentStatus(payload.status)
      }
    }

    socket.on('track:update', handleTrackUpdate)
    socket.on('status:update', handleStatusUpdate)

    // 清理函数：组件卸载时取消订阅并断开连接
    return () => {
      socket.off('track:update', handleTrackUpdate)
      socket.off('status:update', handleStatusUpdate)
      socket.disconnect()
    }
  }, [id])

  const currentPoint =
    realtimePoints.length > 0 ? realtimePoints[realtimePoints.length - 1] : undefined

  // 提取预规划的路径（如果有）
  const routePath = useMemo(() => {
    // 后端返回的是单个对象，包含path字段
    if (trackingData?.data) {
      const data = trackingData.data as any
      if (data.path) return data.path
    }
    return realtimePoints.find((p: any) => p.routePath)?.routePath
  }, [trackingData, realtimePoints])

  // 计算剩余距离 (Haversine 公式)
  const remainingDistance = useMemo(() => {
    if (!currentPoint || !order) return null
    const R = 6371 // 地球半径 (km)
    const dLat = ((order.address.lat - currentPoint.lat) * Math.PI) / 180
    const dLon = ((order.address.lng - currentPoint.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((currentPoint.lat * Math.PI) / 180) *
        Math.cos((order.address.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return (R * c).toFixed(1)
  }, [currentPoint, order])

  const lastUpdateTime = useMemo(() => {
    if (currentStatus === 'signed') {
      if (realtimePoints.length > 0) {
        return dayjs(realtimePoints[realtimePoints.length - 1].ts).format('MM-DD HH:mm:ss')
      }
      return dayjs().format('MM-DD HH:mm:ss')
    }
    if (currentPoint) {
      return dayjs(currentPoint.ts).format('HH:mm:ss')
    }
    return dayjs().format('HH:mm:ss')
  }, [currentStatus, realtimePoints, currentPoint])

  return {
    order,
    isLoading: isOrderLoading || isTrackingLoading,
    error: orderError,
    realtimePoints,
    currentStatus,
    currentPoint,
    routePath,
    remainingDistance,
    lastUpdateTime,
  }
}
