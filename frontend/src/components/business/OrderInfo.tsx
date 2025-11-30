import React, { memo } from 'react'

interface OrderInfoProps {
  recipient: {
    name: string
    phone: string
  }
  address: {
    text: string
  }
}

/**
 * 订单信息展示组件
 *
 * 展示收货人的姓名、电话和地址信息。
 */
const OrderInfo = memo(function OrderInfo({ recipient, address }: OrderInfoProps) {
  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <h4 className="font-semibold mb-3">收货信息</h4>
      <div className="space-y-2 text-sm text-text-secondary">
        <p>
          <span className="text-text-tertiary w-16 inline-block">收货人:</span> {recipient.name}
        </p>
        <p>
          <span className="text-text-tertiary w-16 inline-block">电话:</span> {recipient.phone}
        </p>
        <p>
          <span className="text-text-tertiary w-16 inline-block">地址:</span> {address.text}
        </p>
      </div>
    </div>
  )
})

export default OrderInfo
