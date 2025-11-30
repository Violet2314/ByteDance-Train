import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Tag, Spin } from 'antd'
import { ArrowLeft, Truck } from 'lucide-react'
import TrackingMap from '../components/business/TrackingMap'
import TrackingTimeline from '../components/business/TrackingTimeline'
import OrderInfo from '../components/business/OrderInfo'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { useTracking } from '../hooks/useTracking'

export default function TrackingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    order,
    isLoading,
    error,
    realtimePoints,
    currentStatus,
    currentPoint,
    routePath,
    remainingDistance,
    lastUpdateTime,
  } = useTracking(id)

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    )

  if (error || !order)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">订单不存在</h2>
        <p className="text-gray-500 mb-8">未找到编号为 {id} 的订单信息</p>
        <Button type="primary" onClick={() => navigate('/tracking')}>
          返回查询
        </Button>
      </div>
    )

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-none p-6 pb-0">
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/tracking')}
          className="pl-0 mb-4 hover:bg-transparent hover:text-primary-base"
        >
          返回查询
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              订单追踪 <span className="font-mono text-text-secondary">#{id}</span>
            </h1>
            <p className="text-text-tertiary mt-1">
              预计送达: {dayjs(order.createdAt).add(2, 'day').format('MM月DD日')}
            </p>
          </div>
          <Tag color="processing" className="text-lg px-4 py-1 rounded-full">
            {currentStatus === 'in_transit'
              ? '运输中'
              : currentStatus === 'out_for_delivery'
                ? '派送中'
                : currentStatus === 'signed'
                  ? '已签收'
                  : currentStatus === 'picked'
                    ? '已揽收'
                    : '待发货'}
          </Tag>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 px-6 pb-6 min-h-0">
        {/* 地图区域 - 占据更多空间 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-[2] bg-white rounded-2xl shadow-moderate overflow-hidden relative min-h-[400px]"
        >
          <TrackingMap
            points={realtimePoints}
            currentPoint={currentPoint}
            routePath={routePath}
            // 如果订单数据中有起点则使用，否则默认为北京
            startPoint={
              order.sender && order.sender.lat && order.sender.lng
                ? { lat: order.sender.lat, lng: order.sender.lng }
                : { lat: 39.9042, lng: 116.4074 }
            }
            endPoint={{ lat: order.address.lat, lng: order.address.lng }}
          />

          {/* Floating Info Card on Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg max-w-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-base rounded-full flex items-center justify-center text-white">
                <Truck size={20} />
              </div>
              <div>
                <p className="font-bold text-text-primary">
                  {currentStatus === 'signed' ? '已送达' : '正在配送中'}
                </p>
                <p className="text-xs text-text-secondary">
                  {currentStatus === 'signed'
                    ? '订单已完成'
                    : remainingDistance
                      ? `距离目的地约 ${remainingDistance} km`
                      : '等待位置更新...'}
                </p>
              </div>
            </div>
            <div className="text-xs text-text-tertiary">更新于: {lastUpdateTime}</div>
          </motion.div>
        </motion.div>

        {/* Timeline Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-subtle p-6 overflow-y-auto"
        >
          <h3 className="font-bold text-lg mb-6">物流详情</h3>
          <TrackingTimeline currentStatus={currentStatus} />
          <OrderInfo recipient={order.recipient} address={order.address} />
        </motion.div>
      </div>
    </div>
  )
}
