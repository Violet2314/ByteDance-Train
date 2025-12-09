import React, { memo } from 'react'
import { Package, Truck, MapPin, CheckCircle } from 'lucide-react'
import dayjs from 'dayjs'

interface TrackingTimelineProps {
  currentStatus: string
  order?: {
    createdAt?: string
    shippedAt?: string
    inTransitAt?: string
    arrivedAtHubAt?: string
    outForDeliveryAt?: string
    signedAt?: string
  }
}

const TrackingTimeline = memo(function TrackingTimeline({
  currentStatus,
  order,
}: TrackingTimelineProps) {
  // 将状态映射到步骤索引
  const getStepIndex = (status: string) => {
    if (status === 'signed') return 5
    if (status === 'out_for_delivery') return 4
    if (status === 'arrived_at_hub') return 3
    if (status === 'in_transit') return 2
    if (status === 'picked') return 1
    return 0 // pending
  }

  const steps = [
    {
      title: '待发货',
      description: '订单已创建，等待揽收',
      icon: <Package size={16} />,
      status: getStepIndex(currentStatus) >= 0 ? 'finish' : 'wait',
      time: order?.createdAt,
    },
    {
      title: '已揽收',
      description: '包裹已由物流公司揽收',
      icon: <Package size={16} />,
      status: getStepIndex(currentStatus) >= 1 ? 'finish' : 'wait',
      time: order?.shippedAt,
    },
    {
      title: '运输中',
      description: '包裹正在发往目的地',
      icon: <Truck size={16} />,
      status: getStepIndex(currentStatus) >= 2 ? 'finish' : 'wait',
      time: order?.inTransitAt,
    },
    {
      title: '到达中转站',
      description: '包裹已到达分拨中心',
      icon: <MapPin size={16} />,
      status: getStepIndex(currentStatus) >= 3 ? 'finish' : 'wait',
      time: order?.arrivedAtHubAt,
    },
    {
      title: '派送中',
      description: '快递员正在为您派送',
      icon: <MapPin size={16} />,
      status: getStepIndex(currentStatus) >= 4 ? 'finish' : 'wait',
      time: order?.outForDeliveryAt,
    },
    {
      title: '已签收',
      description: '客户已签收，感谢使用',
      icon: <CheckCircle size={16} />,
      status: getStepIndex(currentStatus) >= 5 ? 'finish' : 'wait',
      time: order?.signedAt,
    },
  ]

  return (
    <div className="pr-4">
      <div className="flex flex-col">
        {steps.map((step, index, arr) => {
          const isFinished = step.status === 'finish'
          const isLast = index === arr.length - 1

          return (
            <div key={index} className="flex gap-4">
              {/* 左侧列：图标 + 连接线 */}
              <div className="flex flex-col items-center">
                <div
                  className={`z-10 flex items-center justify-center w-8 h-8 rounded-full border transition-colors duration-300 ${
                    isFinished
                      ? 'bg-primary-base border-primary-base text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-300'
                  }`}
                >
                  {step.icon}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 my-1 rounded-full ${
                      isFinished ? 'bg-primary-base/30' : 'bg-gray-100'
                    }`}
                  />
                )}
              </div>

              {/* 右侧列：内容 */}
              <div className="pb-8 pt-1.5 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4
                      className={`font-bold text-sm mb-1 ${
                        isFinished ? 'text-text-primary' : 'text-text-tertiary'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-text-secondary">{step.description}</p>
                  </div>
                  {/* 显示时间（如果存在） */}
                  {step.time && (
                    <div className="text-xs text-text-tertiary whitespace-nowrap ml-4">
                      {dayjs(step.time).format('MM-DD HH:mm')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default TrackingTimeline
