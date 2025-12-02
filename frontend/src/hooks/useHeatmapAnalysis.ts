import { useState, useEffect, useRef, useMemo, useReducer } from 'react'
import { api } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import type { TrackPoint } from '@logistics/shared'

// 轨迹数据的 reducer
interface NormalizedTrackPoint {
  orderId: string
  lat: number
  lng: number
  ts: number
}

type TrackingAction =
  | { type: 'SET_INITIAL'; payload: Record<string, NormalizedTrackPoint> }
  | { type: 'UPDATE_BATCH'; payload: Record<string, NormalizedTrackPoint> }

function trackingReducer(
  state: Record<string, NormalizedTrackPoint>,
  action: TrackingAction
): Record<string, NormalizedTrackPoint> {
  switch (action.type) {
    case 'SET_INITIAL':
      return { ...action.payload }
    case 'UPDATE_BATCH': {
      const updated = { ...state }
      Object.entries(action.payload).forEach(([orderId, point]) => {
        // 只更新时间戳更新的数据，避免旧数据覆盖新数据导致"倒退"
        const existingPoint = updated[orderId]
        if (!existingPoint || point.ts >= existingPoint.ts) {
          updated[orderId] = { ...point }
        }
      })
      return updated
    }
    default:
      return state
  }
}

export interface HeatMapData {
  lng: number
  lat: number
  count: number
}

/**
 * 热力图分析业务逻辑 Hook
 *
 * 职责：
 * - 获取订单数据
 * - 管理实时轨迹更新（WebSocket）
 * - 计算热力图数据
 * - 处理数据变化检测
 */
export function useHeatmapAnalysis() {
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [trackingData, dispatchTracking] = useReducer(trackingReducer, {})
  const pendingUpdatesRef = useRef<Record<string, NormalizedTrackPoint>>({})
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 使用统一的 Socket 连接
  const { socket } = useSocket()

  // API 数据获取
  const {
    data: ordersData,
    isLoading,
    refetch,
  } = api.useGetOrdersQuery(
    {},
    {
      pollingInterval: 10000, // 每10秒重新获取订单数据
    }
  )

  const orders = useMemo(() => ordersData?.data || [], [ordersData?.data])

  // WebSocket 实时更新轨迹数据（批量累积，到时间一次性更新，避免闪烁）
  useEffect(() => {
    // 确保Socket已连接
    if (!socket.connected) {
      socket.connect()
      if (import.meta.env.DEV) {
        console.log('[Heatmap] Connecting socket...')
      }
    }

    // 批量flush函数：将累积的更新一次性应用
    const flushPendingUpdates = () => {
      if (Object.keys(pendingUpdatesRef.current).length > 0) {
        const updates = { ...pendingUpdatesRef.current }
        dispatchTracking({ type: 'UPDATE_BATCH', payload: updates })
        pendingUpdatesRef.current = {}
        if (import.meta.env.DEV) {
          console.log(`[Heatmap] Flushed ${Object.keys(updates).length} tracking updates`)
        }
      }
      flushTimerRef.current = null
    }

    // 调度flush：收到第一个更新后，等待100ms收集更多更新，然后一次性flush
    const scheduleFlush = () => {
      if (flushTimerRef.current === null) {
        flushTimerRef.current = setTimeout(flushPendingUpdates, 100)
      }
    }

    const handleTrackUpdate = (point: TrackPoint) => {
      const normalizedPoint: NormalizedTrackPoint = {
        orderId: point.orderId,
        lat: point.lat,
        lng: point.lng,
        ts: point.ts,
      }
      pendingUpdatesRef.current[point.orderId] = normalizedPoint
      scheduleFlush()
    }

    const handleNewOrder = () => {
      if (ordersData) {
        refetch()
      }
    }

    const handleStatusUpdate = () => {
      if (ordersData) {
        refetch()
      }
    }

    // 批量tracking更新（后端每5秒推送一次）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('track:batch-update' as any, (points: TrackPoint[]) => {
      if (import.meta.env.DEV) {
        console.log(`[Heatmap] Received ${points.length} tracking updates`)
      }
      points.forEach((p) => {
        pendingUpdatesRef.current[p.orderId] = {
          orderId: p.orderId,
          lat: p.lat,
          lng: p.lng,
          ts: p.ts,
        }
      })
      scheduleFlush()
    })

    socket.on('track:update', handleTrackUpdate)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('order:created' as any, handleNewOrder)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('status:update' as any, handleStatusUpdate)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('status:broadcast' as any, handleStatusUpdate)

    return () => {
      // 清理定时器
      if (flushTimerRef.current !== null) {
        clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }
      // 清空待处理更新
      pendingUpdatesRef.current = {}

      socket.off('track:update', handleTrackUpdate)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off('track:batch-update' as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off('order:created' as any, handleNewOrder)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off('status:update' as any, handleStatusUpdate)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off('status:broadcast' as any, handleStatusUpdate)
    }
  }, [socket, ordersData, refetch])

  // 获取所有订单的轨迹数据（仅首次加载，避免覆盖实时数据）
  const initializedRef = useRef(false)
  useEffect(() => {
    // 只在首次有订单数据时初始化，避免后续覆盖Socket实时数据
    if (orders.length > 0 && !initializedRef.current) {
      initializedRef.current = true

      const fetchTracking = async () => {
        const trackingPromises = orders.map(async (order) => {
          try {
            const response = await fetch(`http://localhost:3001/api/orders/${order.id}/tracking`)
            const data = await response.json()
            // 修正：后端返回的是单个对象，不是数组
            const latestTracking = data.data
            return {
              orderId: order.id,
              tracking: latestTracking
                ? {
                    orderId: order.id,
                    lat: latestTracking.lat,
                    lng: latestTracking.lng,
                    ts: latestTracking.ts || Date.now(),
                  }
                : null,
            }
          } catch {
            return { orderId: order.id, tracking: null }
          }
        })
        const results = await Promise.all(trackingPromises)
        const trackingMap: Record<string, NormalizedTrackPoint> = {}
        results.forEach((r) => {
          if (r.tracking) {
            trackingMap[r.orderId] = {
              orderId: r.tracking.orderId,
              lat: r.tracking.lat,
              lng: r.tracking.lng,
              ts: r.tracking.ts,
            }
          }
        })
        dispatchTracking({ type: 'SET_INITIAL', payload: trackingMap })
      }

      fetchTracking()
    }
  }, [orders])

  // 准备热力图数据：根据订单状态显示当前位置
  const heatmapData = useMemo(() => {
    const result = orders
      .map((o) => {
        let lng: number, lat: number

        // 根据订单状态决定显示位置
        if (o.status === 'pending') {
          // 待发货：显示发货地
          lng = o.sender?.lng || 0
          lat = o.sender?.lat || 0
        } else if (o.status === 'signed') {
          // 已签收：显示目的地
          lng = o.address.lng
          lat = o.address.lat
        } else if (['picked', 'in_transit', 'out_for_delivery'].includes(o.status)) {
          // 运输中的各个状态：优先使用实时tracking位置
          const tracking = trackingData[o.id]
          if (tracking && tracking.lat && tracking.lng) {
            lng = tracking.lng
            lat = tracking.lat
          } else {
            // 如果没有tracking数据，使用发货地（而不是目的地）
            // 避免订单在地图上"跳跃"
            lng = o.sender?.lng || 0
            lat = o.sender?.lat || 0
          }
        } else {
          // 其他状态：显示目的地
          lng = o.address.lng
          lat = o.address.lat
        }

        return lng && lat ? { lng, lat, count: 1 } : null
      })
      .filter((item): item is { lng: number; lat: number; count: number } => item !== null)

    // 计算数据哈希，用于检测变化
    const dataHash = JSON.stringify(result.map((r) => `${r.lng},${r.lat}`))

    return { data: result, hash: dataHash }
  }, [orders, trackingData])

  return {
    orders,
    isLoading,
    isMapLoaded,
    setIsMapLoaded,
    heatmapData,
  }
}
