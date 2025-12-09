import { useState, useEffect, useRef, useMemo } from 'react'
import { api } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import { useTrackingWorker } from './useTrackingWorker'
import type { TrackPoint } from '@logistics/shared'

// 使用 Web Worker 处理轨迹数据，避免主线程阻塞

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

  // 使用 Web Worker 处理数据
  const {
    isReady: isWorkerReady,
    trackingData,
    processBatch,
    processSingle,
    aggregateToGrid,
  } = useTrackingWorker()

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

  // WebSocket 实时更新轨迹数据（使用 Web Worker 处理）
  useEffect(() => {
    if (!isWorkerReady) return

    // 确保Socket已连接
    if (!socket.connected) {
      socket.connect()
      if (import.meta.env.DEV) {
        console.log('[Heatmap] Connecting socket...')
      }
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

    // 批量tracking更新（后端推送）- 直接发送给 Worker 处理
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('track:batch-update' as any, (points: TrackPoint[]) => {
      if (import.meta.env.DEV) {
        console.log(`[Heatmap] 收到 ${points.length} 个轨迹更新，发送给 Worker 处理`)
      }
      // 在 Worker 线程中处理大量数据，主线程不阻塞
      processBatch(points)
    })

    // 单个轨迹更新
    socket.on('track:update', (point: TrackPoint) => {
      processSingle(point)
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('order:created' as any, handleNewOrder)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('status:update' as any, handleStatusUpdate)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('status:broadcast' as any, handleStatusUpdate)

    return () => {
      socket.off('track:update')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off('track:batch-update' as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off('order:created' as any, handleNewOrder)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off('status:update' as any, handleStatusUpdate)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off('status:broadcast' as any, handleStatusUpdate)
    }
  }, [socket, ordersData, refetch, isWorkerReady, processBatch, processSingle])

  // 初始化订单轨迹数据（首次加载）
  const initializedRef = useRef(false)
  useEffect(() => {
    if (orders.length > 0 && !initializedRef.current && isWorkerReady) {
      initializedRef.current = true

      const fetchTracking = async () => {
        const deliveringOrders = orders.filter(
          (order) => order.status === 'delivering' || order.status === 'in_transit'
        )

        if (deliveringOrders.length === 0) {
          console.log('[Heatmap] 没有配送中的订单')
          return
        }

        const trackingPromises = deliveringOrders.map(async (order) => {
          try {
            const response = await fetch(`/api/orders/${order.id}/tracking`)
            const data = await response.json()

            if (data.success && data.data) {
              const trackData = data.data
              return {
                orderId: order.id,
                lat: trackData.lat,
                lng: trackData.lng,
                ts: trackData.ts || Date.now(),
              }
            }
          } catch (error) {
            console.error(`获取订单 ${order.id} 轨迹失败:`, error)
          }
          return null
        })

        const results = await Promise.all(trackingPromises)
        const validTracking = results.filter((item): item is TrackPoint => item !== null)

        if (validTracking.length > 0) {
          // 将初始数据发送给 Worker 处理
          processBatch(validTracking)
          console.log('[Heatmap] 初始化轨迹数据:', validTracking.length)
        }
      }

      fetchTracking()
    }
  }, [orders, isWorkerReady, processBatch])

  // 准备热力图数据：使用网格聚合优化性能
  const [aggregatedData, setAggregatedData] = useState<HeatMapData[]>([])
  const [dataHash, setDataHash] = useState<string>('')

  useEffect(() => {
    const rawData = orders
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

        return lng && lat ? { orderId: o.id, lng, lat, ts: Date.now() } : null
      })
      .filter((item): item is TrackPoint => item !== null)

    // 计算数据哈希，用于检测变化
    const newHash = JSON.stringify(rawData.map((r) => `${r.lng},${r.lat}`))

    // 只有数据真正变化时才进行聚合（避免无效计算）
    if (newHash !== dataHash && rawData.length > 0 && isWorkerReady) {
      setDataHash(newHash)

      // 使用 Worker 进行网格聚合
      aggregateToGrid(rawData, 0.01)
        .then((buckets) => {
          // 将桶转换为热力图数据格式
          const heatData: HeatMapData[] = buckets.map((bucket) => ({
            lng: bucket.lng,
            lat: bucket.lat,
            count: bucket.count,
          }))
          setAggregatedData(heatData)
          console.log(`[Heatmap] 网格聚合完成：${rawData.length} 个点 → ${heatData.length} 个桶`)
        })
        .catch((error) => {
          console.error('[Heatmap] 网格聚合失败:', error)
          // 降级：直接使用原始数据
          const fallbackData: HeatMapData[] = rawData.map((r) => ({
            lng: r.lng,
            lat: r.lat,
            count: 1,
          }))
          setAggregatedData(fallbackData)
        })
    }
  }, [orders, trackingData, isWorkerReady, aggregateToGrid, dataHash])

  const heatmapData = useMemo(() => {
    return { data: aggregatedData, hash: dataHash }
  }, [aggregatedData, dataHash])

  return {
    orders,
    isLoading,
    isMapLoaded,
    setIsMapLoaded,
    heatmapData,
  }
}
