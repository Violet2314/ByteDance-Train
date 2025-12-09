/**
 * Web Worker Hook - 轨迹数据处理
 *
 * 封装 Worker 通信逻辑，提供简洁的 API
 */

import { useEffect, useRef, useState } from 'react'
import type { TrackPoint } from '@logistics/shared'

interface NormalizedTrackPoint {
  orderId: string
  lat: number
  lng: number
  ts: number
  distance?: number
  speed?: number
  eta?: number
}

interface WorkerMessage {
  type: 'INIT' | 'PROCESS_BATCH' | 'PROCESS_SINGLE' | 'CLEAR_OLD_DATA' | 'AGGREGATE_TO_GRID'
  payload?: any
}

interface WorkerResponse {
  type: 'PROCESSED_BATCH' | 'PROCESSED_SINGLE' | 'CLEARED' | 'AGGREGATED_GRID' | 'ERROR'
  data?: any
  error?: string
}

interface GridBucket {
  lat: number
  lng: number
  count: number
  weight: number
}

export function useTrackingWorker() {
  const workerRef = useRef<Worker | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [trackingData, setTrackingData] = useState<Record<string, NormalizedTrackPoint>>({})
  const [gridBuckets, setGridBuckets] = useState<GridBucket[]>([])

  // 初始化 Worker
  useEffect(() => {
    // 创建 Worker 实例
    const worker = new Worker(new URL('../workers/tracking.worker.ts', import.meta.url), {
      type: 'module',
    })

    // 监听 Worker 消息
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { type, data, error } = e.data

      switch (type) {
        case 'PROCESSED_BATCH':
          // 批量处理完成，更新状态
          setTrackingData(data)
          if (!isReady) setIsReady(true)
          break

        case 'PROCESSED_SINGLE':
          // 单个点处理完成，更新状态
          setTrackingData((prev) => ({
            ...prev,
            [data.orderId]: data,
          }))
          break

        case 'CLEARED':
          console.log(`[Worker Hook] 清理完成：移除 ${data.removedCount} 个订单`)
          break

        case 'AGGREGATED_GRID':
          // 网格聚合完成
          setGridBuckets(data)
          console.log(`[Worker Hook] 网格聚合完成：${data.length} 个桶`)
          break

        case 'ERROR':
          console.error('[Worker Hook] Worker 错误:', error)
          break

        default:
          console.warn('[Worker Hook] 未知响应类型:', type)
      }
    }

    worker.onerror = (error) => {
      console.error('[Worker Hook] Worker 运行错误:', error)
    }

    workerRef.current = worker

    // 初始化 Worker
    const initMessage: WorkerMessage = { type: 'INIT' }
    worker.postMessage(initMessage)

    // 清理函数
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  // 批量处理轨迹数据
  const processBatch = (points: TrackPoint[]) => {
    if (!workerRef.current) {
      console.warn('[Worker Hook] Worker 未就绪')
      return
    }

    const message: WorkerMessage = {
      type: 'PROCESS_BATCH',
      payload: points,
    }
    workerRef.current.postMessage(message)
  }

  // 处理单个轨迹点
  const processSingle = (point: TrackPoint) => {
    if (!workerRef.current) {
      console.warn('[Worker Hook] Worker 未就绪')
      return
    }

    const message: WorkerMessage = {
      type: 'PROCESS_SINGLE',
      payload: point,
    }
    workerRef.current.postMessage(message)
  }

  // 清理过期数据
  const clearOldData = () => {
    if (!workerRef.current) {
      console.warn('[Worker Hook] Worker 未就绪')
      return
    }

    const message: WorkerMessage = { type: 'CLEAR_OLD_DATA' }
    workerRef.current.postMessage(message)
  }

  // 网格聚合（热力图专用）
  const aggregateToGrid = (points: TrackPoint[], gridSize?: number) => {
    if (!workerRef.current) {
      console.warn('[Worker Hook] Worker 未就绪')
      return Promise.reject(new Error('Worker 未就绪'))
    }

    return new Promise<GridBucket[]>((resolve, reject) => {
      const handler = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.type === 'AGGREGATED_GRID') {
          workerRef.current?.removeEventListener('message', handler)
          resolve(e.data.data)
        } else if (e.data.type === 'ERROR') {
          workerRef.current?.removeEventListener('message', handler)
          reject(new Error(e.data.error))
        }
      }

      workerRef.current?.addEventListener('message', handler)

      const message: WorkerMessage = {
        type: 'AGGREGATE_TO_GRID',
        payload: { points, gridSize },
      }
      workerRef.current?.postMessage(message)
    })
  }

  return {
    isReady,
    trackingData,
    gridBuckets,
    processBatch,
    processSingle,
    clearOldData,
    aggregateToGrid,
  }
}
