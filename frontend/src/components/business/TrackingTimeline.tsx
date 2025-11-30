import React, { memo } from 'react'
import { Package, Truck, MapPin, CheckCircle } from 'lucide-react'

interface TrackingTimelineProps {
  currentStatus: string
}

const TrackingTimeline = memo(function TrackingTimeline({ currentStatus }: TrackingTimelineProps) {
  // 将状态映射到步骤索引
  const getStepIndex = (status: string) => {
    if (status === 'signed') return 4
    if (status === 'out_for_delivery') return 3
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
    },
    {
      title: '已揽收',
      description: '包裹已由物流公司揽收',
      icon: <Package size={16} />,
      status: getStepIndex(currentStatus) >= 1 ? 'finish' : 'wait',
    },
    {
      title: '运输中',
      description: '包裹正在发往目的地',
      icon: <Truck size={16} />,
      status: getStepIndex(currentStatus) >= 2 ? 'finish' : 'wait',
    },
    {
      title: '派送中',
      description: '快递员正在为您派送',
      icon: <MapPin size={16} />,
      status: getStepIndex(currentStatus) >= 3 ? 'finish' : 'wait',
    },
    {
      title: '已签收',
      description: '客户已签收，感谢使用',
      icon: <CheckCircle size={16} />,
      status: getStepIndex(currentStatus) >= 4 ? 'finish' : 'wait',
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
              <div className="pb-8 pt-1.5">
                <h4
                  className={`font-bold text-sm mb-1 ${
                    isFinished ? 'text-text-primary' : 'text-text-tertiary'
                  }`}
                >
                  {step.title}
                </h4>
                <p className="text-xs text-text-secondary">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default TrackingTimeline
