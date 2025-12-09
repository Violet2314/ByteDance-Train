import { useState, useEffect, useMemo, useRef } from 'react'
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
  // 本地订单状态（用于实时更新时间戳）
  const [localOrder, setLocalOrder] = useState<any>(null)

  // 最新路径缓存（用于确保新点继承正确路径）
  const latestRoutePathRef = useRef<{ lat: number; lng: number }[] | undefined>(undefined)

  // 渲染节流：避免过度重渲染（30fps）
  const lastRenderTimeRef = useRef<number>(0)
  const RENDER_THROTTLE_MS = 33 // 约30fps，配合RAF动画已经足够流畅

  // 使用本地订单状态或 API 数据
  const order = localOrder || orderData?.data

  // 初始化本地订单状态
  useEffect(() => {
    if (orderData?.data) {
      setLocalOrder(orderData.data)
      setCurrentStatus(orderData.data.status)
    }
  }, [orderData])

  // 初始化轨迹：当历史轨迹加载完成后，设置到 realtimePoints
  useEffect(() => {
    if (trackingData?.data && id && order) {
      const data = trackingData.data as any

      // 调试：打印后端返回的数据
      // console.log('[Tracking] 从 API 获取的 trackingData:', {
      //   fullData: trackingData,
      //   lat: data.lat,
      //   lng: data.lng,
      //   path: data.path,
      // })

      // 优先使用 order_tracking 表中的实际位置
      let displayLat = data.lat
      let displayLng = data.lng

      // 只有在没有 tracking 数据时，才根据订单状态使用默认位置
      if (!data.lat || !data.lng) {
        console.warn('[Tracking] ⚠️ tracking 数据中没有经纬度，使用默认位置')
        if (order.status === 'pending') {
          // 待发货：显示在起点（发货地址）
          displayLat = order.sender?.lat || 0
          displayLng = order.sender?.lng || 0
        } else if (order.status === 'signed') {
          // 已签收：显示在终点（收货地址）
          displayLat = order.address.lat
          displayLng = order.address.lng
        } else {
          // 其他状态但没有 tracking 数据：显示起点
          displayLat = order.sender?.lat || 0
          displayLng = order.sender?.lng || 0
        }
      }

      // console.log('[Tracking] 最终显示位置:', { lat: displayLat, lng: displayLng })

      // 【关键修复】只在缓存为空时才初始化路径，避免覆盖 WebSocket 更新的路径
      if (data.path && data.path.length > 0) {
        // 如果缓存中已经有更长的路径（WebSocket 更新的），不要覆盖
        if (!latestRoutePathRef.current || latestRoutePathRef.current.length < data.path.length) {
          latestRoutePathRef.current = data.path
          // console.log('[Tracking] 初始化路径缓存:', data.path.length, '个点')
        } else {
          // console.log('[Tracking] 跳过路径初始化（缓存中已有更新的路径）:', {
          //   cached: latestRoutePathRef.current.length,
          //   api: data.path.length
          // })
        }
      }

      // 将单个对象转换为数组格式
      setRealtimePoints([
        {
          orderId: id,
          lat: displayLat,
          lng: displayLng,
          ts: data.ts || Date.now(),
          // 【关键修复】使用缓存中的路径（可能已被 WebSocket 更新）
          routePath: latestRoutePathRef.current || data.path,
        },
      ])
    }
  }, [trackingData, id, order])

  // Socket 连接与事件监听
  useEffect(() => {
    if (!id) return

    // 连接 Socket 并订阅特定订单的更新
    socket.connect()
    socket.emit('subscribe', { orderId: id })

    // 处理实时位置更新
    const handleTrackUpdate = (point: TrackPoint) => {
      // 严格过滤：只处理当前订单的更新
      if (point.orderId !== id) return

      // 如果订单已签收，不再接受位置更新
      if (currentStatus === 'signed') return

      // 渲染节流：限制为30fps，减少React重渲染压力
      const now = Date.now()
      if (now - lastRenderTimeRef.current < RENDER_THROTTLE_MS) {
        return
      }
      lastRenderTimeRef.current = now

      setRealtimePoints((prev) => {
        // 避免重复添加相同时间戳的点
        if (prev.length > 0 && prev[prev.length - 1].ts === point.ts) return prev

        // 性能优化：限制数组最大长度，避免长时间运行导致内存溢出和渲染卡顿
        // 保留最近 5000 个点 (约 80秒的高频数据，或者更长时间的低频数据)
        // 对于轨迹绘制，通常不需要无限的历史点
        const newPrev = prev.length > 5000 ? prev.slice(-5000) : prev

        // 使用最新路径缓存（来自 route_update 事件），而不是继承旧点路径
        // 这样可以确保进入派送中状态后，所有新点都使用更新后的完整路径
        const routePathToUse = latestRoutePathRef.current || point.routePath

        // 添加新的位置点，使用最新路径
        return [...newPrev, { ...point, routePath: routePathToUse }]
      })
    }

    // 处理订单状态更新 (如：已发货 -> 运输中)
    const handleStatusUpdate = (payload: any) => {
      // console.log('[Tracking] ===== Status Update Received =====')
      // console.log('[Tracking] Payload:', payload)

      if (payload.orderId === id) {
        // console.log('[Tracking] ✓ Order ID matches, updating state')

        // 更新状态
        setCurrentStatus(payload.status)

        // 更新本地订单数据（包含时间戳）
        setLocalOrder((prev: any) => {
          if (!prev) {
            // console.warn('[Tracking] ✗ No previous order state')
            return prev
          }

          const updated = {
            ...prev,
            status: payload.status,
            shippedAt: payload.shippedAt ?? prev.shippedAt,
            inTransitAt: payload.inTransitAt ?? prev.inTransitAt,
            arrivedAtHubAt: payload.arrivedAtHubAt ?? prev.arrivedAtHubAt,
            outForDeliveryAt: payload.outForDeliveryAt ?? prev.outForDeliveryAt,
            signedAt: payload.signedAt ?? prev.signedAt,
          }

          // console.log('[Tracking] ✓ Updated order:', {
          //   status: updated.status,
          //   shippedAt: updated.shippedAt,
          //   inTransitAt: updated.inTransitAt,
          // })

          return updated
        })
      } else {
        console.log('[Tracking] ✗ Order ID mismatch:', payload.orderId, 'vs', id)
      }
    }

    // 处理路线更新 (中转站 -> 用户)
    const handleRouteUpdate = (payload: {
      orderId: string
      routePath: { lat: number; lng: number }[]
    }) => {
      if (payload.orderId === id) {
        // console.log('[Tracking] 🔄 Route Update - 收到新路线:', {
        //   routePathLength: payload.routePath?.length || 0,
        //   firstPoint: payload.routePath?.[0],
        //   lastPoint: payload.routePath?.[payload.routePath.length - 1],
        //   timestamp: new Date().toISOString()
        // })

        // 【关键修复】更新路径缓存，确保后续所有 track:update 都使用新路径
        latestRoutePathRef.current = payload.routePath

        // console.log('[Tracking] 更新路径缓存完成', {
        //   cacheLength: latestRoutePathRef.current?.length || 0
        // })

        setRealtimePoints((prev) => {
          if (prev.length === 0) return prev
          // 更新最后一个点的 routePath
          const lastPoint = prev[prev.length - 1]
          const updatedLastPoint = { ...lastPoint, routePath: payload.routePath }
          // 替换最后一个点（而不是追加），避免重复点
          const updated = [...prev.slice(0, -1), updatedLastPoint]

          // console.log('[Tracking] 更新 realtimePoints', {
          //   prevLength: prev.length,
          //   updatedLength: updated.length,
          //   lastPointHasRoutePath: !!updated[updated.length - 1].routePath,
          //   lastPointRoutePathLength: updated[updated.length - 1].routePath?.length || 0
          // })

          return updated
        })
      }
    }

    socket.on('track:update', handleTrackUpdate)
    socket.on('status:update', handleStatusUpdate)
    socket.on('order:route_update', handleRouteUpdate)

    // 清理函数：组件卸载时取消订阅并断开连接
    return () => {
      socket.off('track:update', handleTrackUpdate)
      socket.off('status:update', handleStatusUpdate)
      socket.off('order:route_update', handleRouteUpdate)
      socket.disconnect()
    }
  }, [id])

  const currentPoint = useMemo(() => {
    // 如果订单已签收，强制返回终点坐标
    if (currentStatus === 'signed' && order) {
      return {
        orderId: id!,
        lat: order.address.lat,
        lng: order.address.lng,
        ts: Date.now(),
        routePath:
          realtimePoints.length > 0
            ? realtimePoints[realtimePoints.length - 1].routePath
            : undefined,
      }
    }

    // 如果是待发货，返回起点坐标
    if (currentStatus === 'pending' && order) {
      return {
        orderId: id!,
        lat: order.sender.lat,
        lng: order.sender.lng,
        ts: Date.now(),
        routePath:
          realtimePoints.length > 0
            ? realtimePoints[realtimePoints.length - 1].routePath
            : undefined,
      }
    }

    // 其他状态返回实际位置
    return realtimePoints.length > 0 ? realtimePoints[realtimePoints.length - 1] : undefined
  }, [realtimePoints, currentStatus, order, id])

  // 提取预规划的路径（如果有）
  const routePath = useMemo(() => {
    // 优先查找实时点中最新的 routePath (支持中转后路线变更)
    for (let i = realtimePoints.length - 1; i >= 0; i--) {
      if (realtimePoints[i].routePath && realtimePoints[i].routePath!.length > 0) {
        // console.log('[useTracking routePath] 从 realtimePoints 提取路径', {
        //   index: i,
        //   routePathLength: realtimePoints[i].routePath!.length,
        //   totalPoints: realtimePoints.length
        // })
        return realtimePoints[i].routePath
      }
    }

    // 后端返回的是单个对象，包含path字段
    if (trackingData?.data) {
      const data = trackingData.data as any
      if (data.path) {
        // console.log('[useTracking routePath] 从 trackingData 提取路径', {
        //   pathLength: data.path.length
        // })
        return data.path
      }
    }

    const fallbackPath = realtimePoints.find((p: any) => p.routePath)?.routePath
    // console.log('[useTracking routePath] 最终路径', {
    //   hasPath: !!fallbackPath,
    //   pathLength: fallbackPath?.length || 0
    // })

    return fallbackPath
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

  const hubPoint = useMemo(() => {
    if (trackingData?.data) {
      const data = trackingData.data as any
      if (data.hub) return data.hub
    }
    return undefined
  }, [trackingData])

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
    hubPoint,
  }
}
