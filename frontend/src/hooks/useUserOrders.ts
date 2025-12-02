import { useState, useMemo } from 'react'
import { useGetMyOrdersQuery } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export const useUserOrders = () => {
  const { user } = useAuth()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')

  const { data: ordersData, isLoading } = useGetMyOrdersQuery({}, { skip: !user?.id })

  const filteredOrders = useMemo(() => {
    if (!ordersData?.data) return []

    let result = [...ordersData.data]

    // 1. 搜索过滤
    if (searchText) {
      const lowerText = searchText.toLowerCase()
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(lowerText) ||
          order.recipient.name.toLowerCase().includes(lowerText) ||
          order.sender.name.toLowerCase().includes(lowerText)
      )
    }

    // 2. 状态过滤
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        result = result.filter((o) => o.status === 'pending')
      } else if (statusFilter === 'in_transit') {
        result = result.filter((o) =>
          ['picked', 'in_transit', 'out_for_delivery'].includes(o.status)
        )
      } else if (statusFilter === 'signed') {
        result = result.filter((o) => o.status === 'signed')
      }
    }

    // 3. 排序
    result.sort((a, b) => {
      if (sortBy === 'amount_desc') {
        return b.amount - a.amount
      }
      // 默认：最新优先
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  }, [ordersData, searchText, statusFilter, sortBy])

  return {
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredOrders,
    isLoading,
  }
}
