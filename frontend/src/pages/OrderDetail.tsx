import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Tag, Steps, Spin, Modal, Radio, Space, App } from 'antd'
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Truck,
  CheckCircle,
  Clock,
  CreditCard,
  ShieldCheck,
} from 'lucide-react'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { useOrderDetail } from '../hooks/useOrderDetail'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    order,
    isLoading,
    error,
    rules,
    isShipping,
    isShipModalOpen,
    setIsShipModalOpen,
    selectedRuleId,
    setSelectedRuleId,
    handleShipClick,
    handleConfirmShip,
  } = useOrderDetail(id)

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    )
  if (error || !order) return <div>订单不存在</div>

  // 添加详细调试日志
  console.log('[OrderDetail Render] ===== Component Re-render =====')
  console.log('[OrderDetail Render] Order ID:', order.id)
  console.log('[OrderDetail Render] Status:', order.status)
  console.log('[OrderDetail Render] shippedAt:', order.shippedAt, 'type:', typeof order.shippedAt)
  console.log(
    '[OrderDetail Render] inTransitAt:',
    order.inTransitAt,
    'type:',
    typeof order.inTransitAt
  )
  console.log('[OrderDetail Render] arrivedAtHubAt:', order.arrivedAtHubAt)
  console.log('[OrderDetail Render] outForDeliveryAt:', order.outForDeliveryAt)
  console.log('[OrderDetail Render] signedAt:', order.signedAt)
  console.log('[OrderDetail Render] ===== Render Info End =====')

  const stepStatus: Record<string, number> = {
    pending: 0,
    picked: 1,
    in_transit: 2,
    arrived_at_hub: 3,
    out_for_delivery: 4,
    signed: 5,
  }

  const statusTextMap: Record<string, string> = {
    pending: '待处理',
    picked: '已揽收',
    in_transit: '运输中',
    arrived_at_hub: '到达中转站',
    out_for_delivery: '派送中',
    signed: '已送达',
  }

  const statusColorMap: Record<string, string> = {
    pending: 'warning',
    signed: 'success',
    picked: 'processing',
    in_transit: 'processing',
    arrived_at_hub: 'processing',
    out_for_delivery: 'processing',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 md:space-y-6 max-w-6xl mx-auto p-4"
    >
      <div>
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate(-1)}
          className="pl-0 hover:bg-transparent hover:text-primary-base mb-2 md:mb-4"
        >
          返回订单列表
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Package size={24} className="md:hidden" />
              <Package size={32} className="hidden md:block" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">订单号 #{order.id}</h1>
              <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm mt-1">
                <Clock size={14} />
                <span>下单时间 {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 self-end md:self-auto">
            <Tag
              color={statusColorMap[order.status] || 'default'}
              className="text-xs md:text-sm px-3 md:px-4 py-1 md:py-1.5 rounded-full border-0 font-medium m-0"
            >
              {statusTextMap[order.status] || '未知状态'}
            </Tag>
            {order.status === 'pending' && (
              <Button
                type="primary"
                size="large"
                icon={<Truck size={18} />}
                onClick={handleShipClick}
                className="bg-[#0B0F19] hover:bg-gray-800 border-none shadow-lg shadow-gray-900/20 rounded-xl h-10 md:h-12 px-4 md:px-6 text-sm md:text-base"
              >
                发货
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
              <Truck size={20} className="text-blue-500" />
              订单状态
            </h3>
            <style>{`
              .custom-steps .ant-steps-item-container {
                display: flex !important;
                flex-direction: column !important;
              }
              @media (max-width: 768px) {
                .custom-steps .ant-steps-item-container {
                  flex-direction: row !important;
                  align-items: center;
                }
                .custom-steps .ant-steps-item-content {
                  margin-left: 8px;
                }
              }
            `}</style>
            <div className="overflow-x-auto pb-2 md:pb-0">
              <Steps
                current={stepStatus[order.status]}
                direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}
                items={[
                  {
                    title: '待发货',
                    description: order.createdAt
                      ? dayjs(order.createdAt).format('MM-DD HH:mm')
                      : '订单已创建',
                    icon: <Package size={20} />,
                  },
                  {
                    title: '已揽收',
                    description: order.shippedAt
                      ? dayjs(order.shippedAt).format('MM-DD HH:mm')
                      : '包裹已由物流公司揽收',
                    icon: <Package size={20} />,
                  },
                  {
                    title: '运输中',
                    description: order.inTransitAt
                      ? dayjs(order.inTransitAt).format('MM-DD HH:mm')
                      : '包裹正在发往目的地',
                    icon: <Truck size={20} />,
                  },
                  {
                    title: '到达中转站',
                    description: order.arrivedAtHubAt
                      ? dayjs(order.arrivedAtHubAt).format('MM-DD HH:mm')
                      : '包裹已到达分拨中心',
                    icon: <MapPin size={20} />,
                  },
                  {
                    title: '派送中',
                    description: order.outForDeliveryAt
                      ? dayjs(order.outForDeliveryAt).format('MM-DD HH:mm')
                      : '快递员正在为您派送',
                    icon: <MapPin size={20} />,
                  },
                  {
                    title: '已签收',
                    description: order.signedAt
                      ? dayjs(order.signedAt).format('MM-DD HH:mm')
                      : order.status === 'signed'
                        ? '客户已签收'
                        : '预计即将送达',
                    icon: <CheckCircle size={20} />,
                  },
                ]}
                className="custom-steps min-w-[600px] md:min-w-0"
              />
            </div>
          </div>

          <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
              <Package size={20} className="text-orange-500" />
              商品信息
            </h3>
            <div className="flex items-center gap-4 md:gap-6 p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-200 transition-colors duration-300">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-xl flex items-center justify-center text-gray-300 shadow-sm shrink-0">
                <Package size={32} className="md:hidden" />
                <Package size={40} className="hidden md:block" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start gap-2 md:gap-0">
                  <div>
                    <h3 className="font-bold text-base md:text-xl text-gray-900">高级物流服务</h3>
                    <p className="text-gray-500 mt-1 text-xs md:text-base">标准配送包裹</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-bold text-base md:text-xl text-gray-900">
                      ¥{order.amount.toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-xs md:text-base">数量: 1</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-6 flex justify-end items-center gap-4 pt-4 md:pt-6 border-t border-gray-200">
              <span className="text-gray-500 text-sm md:text-base">共 1 件商品:</span>
              <span className="font-black text-xl md:text-2xl text-gray-900">
                ¥{order.amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
              <User size={20} className="text-purple-500" />
              客户信息
            </h3>
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <User size={16} className="md:hidden" />
                  <User size={20} className="hidden md:block" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">
                    联系方式
                  </p>
                  <p className="font-bold text-sm md:text-base text-gray-900">
                    {order.recipient.name}
                  </p>
                  <p className="text-gray-500 text-sm md:text-base">{order.recipient.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <MapPin size={16} className="md:hidden" />
                  <MapPin size={20} className="hidden md:block" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">
                    收货地址
                  </p>
                  <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                    {order.address.text}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-green-500" />
              支付信息
            </h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 flex items-center gap-2 text-sm md:text-base">
                  <CreditCard size={16} /> 支付方式
                </span>
                <span className="font-bold text-gray-900 text-sm md:text-base">在线支付</span>
              </div>
              <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-sm md:text-base">订单编号</span>
                <span className="font-mono text-sm font-medium">{order.id}</span>
              </div>
              <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-sm md:text-base">日期</span>
                <span className="font-medium text-sm md:text-base">
                  {dayjs(order.createdAt).format('YYYY-MM-DD')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="选择配送规则"
        open={isShipModalOpen}
        onOk={handleConfirmShip}
        onCancel={() => setIsShipModalOpen(false)}
        confirmLoading={isShipping}
      >
        <div className="py-4">
          <p className="mb-4 text-gray-500">请选择用于此订单的配送服务：</p>
          <Radio.Group
            onChange={(e) => setSelectedRuleId(e.target.value)}
            value={selectedRuleId}
            className="w-full"
          >
            <Space direction="vertical" className="w-full">
              {rules.map((rule: any) => (
                <Radio
                  key={rule.id}
                  value={rule.id}
                  className="w-full border border-gray-200 p-3 rounded-xl hover:border-blue-500 transition-colors"
                >
                  <div className="flex justify-between w-full items-center">
                    <span className="font-bold">{rule.company}</span>
                    <Tag>{rule.area}</Tag>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 pl-6">时效: {rule.days}</div>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>
      </Modal>
    </motion.div>
  )
}
