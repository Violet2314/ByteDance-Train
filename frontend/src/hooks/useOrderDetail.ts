import { useState } from 'react'
import { message } from 'antd'
import {
  useGetOrderByIdQuery,
  useShipOrderMutation,
  useGetDeliveryRulesQuery,
} from '../services/api'

export function useOrderDetail(id: string | undefined) {
  const { data: orderData, isLoading, error } = useGetOrderByIdQuery(id!, { skip: !id })
  const { data: rulesData } = useGetDeliveryRulesQuery()
  const [shipOrder, { isLoading: isShipping }] = useShipOrderMutation()

  const [isShipModalOpen, setIsShipModalOpen] = useState(false)
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null)

  // 获取订单详情和配送规则
  const order = orderData?.data
  const rules = rulesData?.data || []

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
