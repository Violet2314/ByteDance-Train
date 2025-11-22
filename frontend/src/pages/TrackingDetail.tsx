import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Steps, Button, Tag, Spin } from 'antd'
import { ArrowLeft, Package, Truck, CheckCircle, MapPin } from 'lucide-react'
import { useGetOrderByIdQuery, useGetOrderTrackingQuery } from '../services/api'
import { socket } from '../services/socket'
import TrackingMap from '../components/business/TrackingMap'
import type { TrackPoint, ShipmentState } from '@logistics/shared'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'

export default function TrackingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: orderData, isLoading: isOrderLoading } = useGetOrderByIdQuery(id!)
  const { data: historyData, isLoading: isHistoryLoading } = useGetOrderTrackingQuery(id!)
  
  const [realtimePoints, setRealtimePoints] = useState<TrackPoint[]>([])
  const [currentStatus, setCurrentStatus] = useState<string>('')

  useEffect(() => {
    if (historyData?.data) {
      setRealtimePoints(historyData.data)
    }
  }, [historyData])

  useEffect(() => {
    if (orderData?.data) {
      setCurrentStatus(orderData.data.status)
    }
  }, [orderData])

  useEffect(() => {
    if (!id) return

    socket.connect()
    socket.emit('subscribe', { orderId: id })

    const handleTrackUpdate = (point: TrackPoint) => {
      setRealtimePoints(prev => [...prev, point])
    }

    const handleStatusUpdate = (state: ShipmentState) => {
      setCurrentStatus(state.status)
    }

    socket.on('track:update', handleTrackUpdate)
    socket.on('status:update', handleStatusUpdate)
    
    return () => {
      socket.off('track:update', handleTrackUpdate)
      socket.off('status:update', handleStatusUpdate)
      socket.emit('unsubscribe', { orderId: id })
      socket.disconnect()
    }
  }, [id])

  if (isOrderLoading || isHistoryLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>
  if (!orderData?.data) return <div>订单不存在</div>

  const order = orderData.data
  const currentPoint = realtimePoints.length > 0 ? realtimePoints[realtimePoints.length - 1] : undefined

  // Map status to step index
  const getStepIndex = (status: string) => {
    if (status === 'signed') return 3
    if (status === 'out_for_delivery') return 2
    if (status === 'in_transit') return 1
    return 0
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-none p-6 pb-0">
        <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate('/tracking')} className="pl-0 mb-4 hover:bg-transparent hover:text-primary-base">
          返回查询
        </Button>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              订单追踪 <span className="font-mono text-text-secondary">#{id}</span>
            </h1>
            <p className="text-text-tertiary mt-1">预计送达: {dayjs().add(2, 'day').format('MM月DD日')}</p>
          </div>
          <Tag color="processing" className="text-lg px-4 py-1 rounded-full">
            {currentStatus === 'in_transit' ? '运输中' : currentStatus === 'out_for_delivery' ? '派送中' : currentStatus === 'signed' ? '已签收' : '待发货'}
          </Tag>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 px-6 pb-6 min-h-0">
        {/* Map Section - Takes more space */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-[2] bg-white rounded-2xl shadow-moderate overflow-hidden relative min-h-[400px]"
        >
          <TrackingMap 
            points={realtimePoints} 
            currentPoint={currentPoint}
            // Mock start/end for demo if not in order data (order data has address but not lat/lng for start)
            // Assuming start is Beijing (from simulator) and end is order address
            startPoint={{ lat: 39.9042, lng: 116.4074 }} 
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
                <p className="font-bold text-text-primary">正在配送中</p>
                <p className="text-xs text-text-secondary">距离目的地 12km</p>
              </div>
            </div>
            <div className="text-xs text-text-tertiary">
              更新于: {dayjs().format('HH:mm:ss')}
            </div>
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
          <Steps
            direction="vertical"
            current={getStepIndex(currentStatus)}
            items={[
              { 
                title: '已揽收', 
                description: '包裹已由物流公司揽收', 
                icon: <Package size={18} />,
                status: getStepIndex(currentStatus) >= 0 ? 'finish' : 'wait'
              },
              { 
                title: '运输中', 
                description: '包裹正在发往目的地', 
                icon: <Truck size={18} />,
                status: getStepIndex(currentStatus) >= 1 ? 'finish' : 'wait'
              },
              { 
                title: '派送中', 
                description: '快递员正在为您派送', 
                icon: <MapPin size={18} />,
                status: getStepIndex(currentStatus) >= 2 ? 'finish' : 'wait'
              },
              { 
                title: '已签收', 
                description: '客户已签收，感谢使用', 
                icon: <CheckCircle size={18} />,
                status: getStepIndex(currentStatus) >= 3 ? 'finish' : 'wait'
              },
            ]}
          />
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="font-semibold mb-3">收货信息</h4>
            <div className="space-y-2 text-sm text-text-secondary">
              <p><span className="text-text-tertiary w-16 inline-block">收货人:</span> {order.recipient.name}</p>
              <p><span className="text-text-tertiary w-16 inline-block">电话:</span> {order.recipient.phone}</p>
              <p><span className="text-text-tertiary w-16 inline-block">地址:</span> {order.address.text}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
