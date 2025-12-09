import React from 'react'
import { Search } from 'lucide-react'
import { Input, Spin, Select } from 'antd'
import OrdersTable from '../components/business/OrdersTable'
import { useUserOrders } from '../hooks/useUserOrders'

const { Option } = Select

/**
 * 用户订单列表页面
 *
 * 展示用户的所有订单，支持搜索、筛选和排序。
 * 使用 OrdersTable 组件展示数据。
 */
export default function UserOrders() {
  const {
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredOrders,
    isLoading,
  } = useUserOrders()

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">我的订单</h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">查看和管理您的所有物流订单</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="flex gap-3 w-full sm:w-auto">
              <Select
                defaultValue="all"
                className="flex-1 sm:w-32 h-10 md:h-12"
                size="large"
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Option value="all">全部状态</Option>
                <Option value="pending">待处理</Option>
                <Option value="picked">已揽收</Option>
                <Option value="in_transit">运输中</Option>
                <Option value="arrived_at_hub">到达中转站</Option>
                <Option value="out_for_delivery">派送中</Option>
                <Option value="signed">已送达</Option>
              </Select>

              <Select
                defaultValue="newest"
                className="flex-1 sm:w-32 h-10 md:h-12"
                size="large"
                value={sortBy}
                onChange={setSortBy}
              >
                <Option value="newest">最新优先</Option>
                <Option value="amount_desc">金额最高</Option>
              </Select>
            </div>

            <div className="w-full sm:w-64">
              <Input
                prefix={<Search size={18} className="text-gray-400" />}
                placeholder="搜索订单号、寄件人或收件人"
                className="h-10 md:h-12 rounded-xl border-gray-200 hover:border-blue-500 focus:border-blue-500"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <OrdersTable orders={filteredOrders} loading={isLoading} actionPathPrefix="/tracking" />
        )}
      </div>
    </div>
  )
}
