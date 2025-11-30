import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import type { TrackPoint, ShipmentState } from '@logistics/shared'
import { useGetOrderByIdQuery, useGetOrderTrackingQuery } from '../services/api'
import { socket } from '../services/socket'

export function useTracking(id: string | undefined) {
  const {
    data: orderData,
    isLoading: isOrderLoading,
    error: orderError,
  } = useGetOrderByIdQuery(id!, { skip: !id })

  const { data: trackingData, isLoading: isTrackingLoading } = useGetOrderTrackingQuery(id!, {
    skip: !id,
    refetchOnMountOrArgChange: true,
  })

  const [realtimePoints, setRealtimePoints] = useState<TrackPoint[]>([])
  const [currentStatus, setCurrentStatus] = useState<string>('')

  const order = orderData?.data

  // 从获取的数据初始化状态
  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status)
    }
  }, [order])

  useEffect(() => {
    if (trackingData?.data) {
      setRealtimePoints(trackingData.data)
    }
  }, [trackingData])

  // Socket 连接与事件监听
  useEffect(() => {
    if (!id) return

    socket.connect()
    socket.emit('subscribe', { orderId: id })

    const handleTrackUpdate = (point: TrackPoint) => {
      setRealtimePoints((prev) => {
        if (prev.some((p) => p.ts === point.ts)) return prev
        return [...prev, point]
      })
    }

    const handleStatusUpdate = (payload: ShipmentState) => {
      if (payload.orderId === id) {
        setCurrentStatus(payload.status)
      }
    }

    socket.on('track:update', handleTrackUpdate)
    socket.on('status:update', handleStatusUpdate)

    return () => {
      socket.off('track:update', handleTrackUpdate)
      socket.off('status:update', handleStatusUpdate)
      socket.disconnect()
    }
  }, [id])

  const currentPoint =
    realtimePoints.length > 0 ? realtimePoints[realtimePoints.length - 1] : undefined

  const routePath = useMemo(() => {
    if (trackingData?.data && trackingData.data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = trackingData.data.find((p: any) => p.routePath)
      if (p?.routePath) return p.routePath
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return realtimePoints.find((p: any) => p.routePath)?.routePath
  }, [trackingData, realtimePoints])

  const remainingDistance = useMemo(() => {
    if (!currentPoint || !order) return null
    const R = 6371
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
