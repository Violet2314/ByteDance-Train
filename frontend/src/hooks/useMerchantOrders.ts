import { useState, useMemo, useCallback } from 'react'
import { message } from 'antd'
import { useGetMyOrdersQuery, useCreateOrderMutation } from '../services/api'
import type { CreateOrderForm } from '@logistics/shared'

export function useMerchantOrders() {
  // 筛选和排序状态
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [sort, setSort] = useState('createdAt')
  const [searchText, setSearchText] = useState('')
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)

  // 获取当前商家的订单列表
  // RTK Query 会自动处理缓存和重新请求
  const { data, isLoading, refetch } = useGetMyOrdersQuery({
    status,
    sort,
    order: sort === 'amount' ? 'desc' : 'desc', // 金额按降序，其他按降序
  })

  // 前端搜索过滤（使用 useMemo 优化）
  const orders = useMemo(() => {
    return (data?.data || []).filter((order) => {
      if (!searchText) return true
      const lowerText = searchText.toLowerCase()
      return (
        order.id.toLowerCase().includes(lowerText) ||
        order.recipient.name.toLowerCase().includes(lowerText) ||
        order.sender.name.toLowerCase().includes(lowerText)
      )
    })
  }, [data?.data, searchText])

  const [createOrderApi] = useCreateOrderMutation()

  // 处理创建订单逻辑（使用 useCallback 优化）
  const handleCreateOrder = useCallback(
    async (values: CreateOrderForm) => {
      const payload = {
        amount: values.amount,
        sender: {
          name: values.senderName,
          phone: values.senderPhone,
          address: values.senderAddress,
          lat: values.senderLat,
          lng: values.senderLng,
        },
        recipient: {
          name: values.recipientName,
          phone: values.recipientPhone,
          address: values.recipientAddress,
          lat: values.recipientLat,
          lng: values.recipientLng,
        },
        ...(values.goodsName && {
          cargo: {
            name: values.goodsName,
            weight: values.goodsWeight || 0,
            quantity: values.goodsCount || 1,
          },
        }),
        userId: Number(values.userId),
      }

      try {
        // unwrap() 用于获取原始 Promise 结果，以便捕获错误
        await createOrderApi(payload).unwrap()
        message.success('订单创建成功！')
        setIsCreateModalVisible(false)
        refetch() // 手动刷新列表（虽然 invalidatesTags 通常会自动处理）
      } catch (error) {
        message.error('创建订单失败')
      }
    },
    [createOrderApi, refetch, setIsCreateModalVisible]
  )

  return {
    status,
    setStatus,
    sort,
    setSort,
    searchText,
    setSearchText,
    isCreateModalVisible,
    setIsCreateModalVisible,
    orders,
    isLoading,
    refetch,
    handleCreateOrder,
  }
}
