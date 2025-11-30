import { useState } from 'react'
import { message } from 'antd'
import { useGetOrdersQuery, useCreateOrderMutation } from '../services/api'

export function useMerchantOrders() {
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [sort, setSort] = useState('createdAt')
  const [searchText, setSearchText] = useState('')
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)

  const { data, isLoading, refetch } = useGetOrdersQuery({
    status,
    sort,
    order: sort === 'amount' ? 'desc' : 'desc',
  })

  const [createOrderApi] = useCreateOrderMutation()

  // 处理创建订单逻辑
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateOrder = async (values: any) => {
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
      cargo: {
        name: values.goodsName,
        weight: values.goodsWeight,
        quantity: values.goodsCount,
      },
      userId: values.userId,
    }

    try {
      await createOrderApi(payload).unwrap()
      message.success('订单创建成功！')
      setIsCreateModalVisible(false)
      refetch()
    } catch (error) {
      message.error('创建订单失败')
    }
  }

  return {
    status,
    setStatus,
    sort,
    setSort,
    searchText,
    setSearchText,
    isCreateModalVisible,
    setIsCreateModalVisible,
    orders: data?.data,
    isLoading,
    refetch,
    handleCreateOrder,
  }
}
