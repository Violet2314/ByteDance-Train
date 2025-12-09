import { useState, useEffect } from 'react'
import { App } from 'antd'
import {
  useGetOrderByIdQuery,
  useShipOrderMutation,
  useGetDeliveryRulesQuery,
} from '../services/api'
import { socket } from '../services/socket'

export function useOrderDetail(id: string | undefined) {
  const { message } = App.useApp()
  const { data: orderData, isLoading, error, refetch } = useGetOrderByIdQuery(id!, { skip: !id })
  const { data: rulesData } = useGetDeliveryRulesQuery()
  const [shipOrder, { isLoading: isShipping }] = useShipOrderMutation()

  const [isShipModalOpen, setIsShipModalOpen] = useState(false)
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null)

  // 本地订单状态（用于实时更新）
  const [localOrder, setLocalOrder] = useState<any>(null)

  // 获取订单详情和配送规则
  const order = localOrder || orderData?.data
  const rules = rulesData?.data || []

  // 初始化本地订单状态
  useEffect(() => {
    if (orderData?.data) {
      setLocalOrder(orderData.data)
    }
  }, [orderData])

  // WebSocket 监听状态更新
  useEffect(() => {
    if (!id) return

    console.log('[OrderDetail] Setting up WebSocket for order:', id)
    socket.connect()
    socket.emit('subscribe', { orderId: id })

    const handleStatusUpdate = (payload: any) => {
      console.log('[OrderDetail] ===== WebSocket Event Received =====')
      console.log('[OrderDetail] Raw payload:', payload)
      console.log('[OrderDetail] Payload keys:', Object.keys(payload))
      console.log(
        '[OrderDetail] shippedAt type:',
        typeof payload.shippedAt,
        'value:',
        payload.shippedAt
      )
      console.log(
        '[OrderDetail] inTransitAt type:',
        typeof payload.inTransitAt,
        'value:',
        payload.inTransitAt
      )

      if (payload.orderId === id) {
        console.log('[OrderDetail] ✓ Order ID matches, processing update')

        setLocalOrder((prev: any) => {
          if (!prev) {
            console.warn('[OrderDetail] ✗ No previous order state, skipping update')
            return prev
          }

          console.log('[OrderDetail] Previous state:', {
            status: prev.status,
            shippedAt: prev.shippedAt,
            inTransitAt: prev.inTransitAt,
          })

          // 使用 ?? 而不是 || 以正确处理空字符串和 falsy 值
          const updated = {
            ...prev,
            status: payload.status,
            shippedAt: payload.shippedAt ?? prev.shippedAt,
            inTransitAt: payload.inTransitAt ?? prev.inTransitAt,
            arrivedAtHubAt: payload.arrivedAtHubAt ?? prev.arrivedAtHubAt,
            outForDeliveryAt: payload.outForDeliveryAt ?? prev.outForDeliveryAt,
            signedAt: payload.signedAt ?? prev.signedAt,
          }

          console.log('[OrderDetail] ✓ New state after update:', {
            status: updated.status,
            shippedAt: updated.shippedAt,
            inTransitAt: updated.inTransitAt,
            arrivedAtHubAt: updated.arrivedAtHubAt,
            outForDeliveryAt: updated.outForDeliveryAt,
            signedAt: updated.signedAt,
          })
          console.log('[OrderDetail] ===== Update Complete =====')

          return updated
        })
      } else {
        console.log('[OrderDetail] ✗ Order ID mismatch:', payload.orderId, 'vs', id)
      }
    }

    socket.on('status:update', handleStatusUpdate)

    return () => {
      console.log('[OrderDetail] Cleaning up WebSocket for order:', id)
      socket.off('status:update', handleStatusUpdate)
      socket.disconnect()
    }
  }, [id])

  // 打开“发货”弹窗，默认选中第一条规则
  const handleShipClick = () => {
    if (rules.length > 0) {
      setSelectedRuleId(rules[0].id)
    }
    setIsShipModalOpen(true)
  }

  // 确认发货逻辑
  const handleConfirmShip = async () => {
    if (!selectedRuleId) {
      message.error('请选择配送规则')
      return
    }
    try {
      await shipOrder({ id: id!, ruleId: selectedRuleId }).unwrap()
      message.success('发货成功')
      setIsShipModalOpen(false)
    } catch (err) {
      message.error('发货失败')
    }
  }

  return {
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
  }
}
