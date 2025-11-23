import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Tag, Steps, message, Spin } from 'antd'
import { ArrowLeft, Package, MapPin, User, Truck, CheckCircle, Clock, CreditCard, ShieldCheck } from 'lucide-react'
import { useGetOrderByIdQuery, useShipOrderMutation } from '../services/api'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useGetOrderByIdQuery(id!)
  const [shipOrder, { isLoading: isShipping }] = useShipOrderMutation()

  const order = data?.data

  const handleShip = async () => {
    try {
      await shipOrder(id!).unwrap()
      message.success('发货成功')
    } catch (err) {
      message.error('发货失败')
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>
  if (!order) return <div>订单不存在</div>

  const stepStatus = {
    pending: 0,
    in_transit: 1,
    signed: 2,
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-6xl mx-auto p-4"
    >
      <div>
        <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} className="pl-0 hover:bg-transparent hover:text-primary-base mb-4">
          返回订单列表
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Package size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">订单号 #{order.id}</h1>
              <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                <Clock size={14} />
                <span>下单时间 {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Tag 
               color={order.status === 'pending' ? 'warning' : order.status === 'in_transit' ? 'processing' : 'success'} 
               className="text-sm px-4 py-1.5 rounded-full border-0 font-medium text-base m-0"
             >
              {order.status === 'pending' ? '待处理' : order.status === 'in_transit' ? '运输中' : '已送达'}
            </Tag>
            {order.status === 'pending' && (
              <Button 
                type="primary" 
                size="large" 
                icon={<Truck size={18} />} 
                loading={isShipping}
                onClick={handleShip}
                className="bg-[#0B0F19] hover:bg-gray-800 border-none shadow-lg shadow-gray-900/20 rounded-xl h-12 px-6"
              >
                发货
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Truck size={20} className="text-blue-500"/>
              订单状态
            </h3>
            <Steps
              current={stepStatus[order.status]}
              items={[
                { title: '已下单', description: dayjs(order.createdAt).format('MM-DD HH:mm'), icon: <Package size={20} /> },
                { title: '运输中', description: order.status !== 'pending' ? '运输途中' : '等待发货', icon: <Truck size={20} /> },
                { title: '已送达', description: order.status === 'signed' ? '客户已签收' : '预计即将送达', icon: <CheckCircle size={20} /> },
              ]}
              className="custom-steps"
            />
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package size={20} className="text-orange-500"/>
              商品信息
            </h3>
            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-200 transition-colors duration-300">
              <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center text-gray-300 shadow-sm">
                <Package size={40} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">高级物流服务</h3>
                    <p className="text-gray-500 mt-1">标准配送包裹</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-gray-900">¥{order.amount.toFixed(2)}</p>
                    <p className="text-gray-500">数量: 1</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end items-center gap-4 pt-6 border-t border-gray-200">
              <span className="text-gray-500">共 1 件商品:</span>
              <span className="font-black text-2xl text-gray-900">¥{order.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-purple-500"/>
              客户信息
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">联系方式</p>
                  <p className="font-bold text-gray-900">{order.recipient.name}</p>
                  <p className="text-gray-500">{order.recipient.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">收货地址</p>
                  <p className="text-gray-700 leading-relaxed">{order.address.text}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-green-500"/>
              支付信息
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 flex items-center gap-2"><CreditCard size={16}/> 支付方式</span>
                <span className="font-bold text-gray-900">在线支付</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">订单编号</span>
                <span className="font-mono text-sm font-medium">{order.id}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">日期</span>
                <span className="font-medium">{dayjs(order.createdAt).format('YYYY-MM-DD')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
