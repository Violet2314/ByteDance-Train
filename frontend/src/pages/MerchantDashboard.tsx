import React from 'react'
import { Button, Input, Select } from 'antd'
import { Search, Truck, Package, RefreshCw, Plus } from 'lucide-react'
import CreateOrderModal from '../components/business/CreateOrderModal'
import OrdersTable from '../components/business/OrdersTable'
import { useMerchantOrders } from '../hooks/useMerchantOrders'

const STATUS_OPTIONS = [
  { value: 'pending', label: '待处理' },
  { value: 'in_transit', label: '运输中' },
  { value: 'signed', label: '已送达' },
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: '最新优先' },
  { value: 'amount', label: '金额最高' },
]

export default function MerchantDashboard() {
  const {
    setStatus,
    setSort,
    searchText,
    setSearchText,
    isCreateModalVisible,
    setIsCreateModalVisible,
    orders,
    isLoading,
    refetch,
    handleCreateOrder,
  } = useMerchantOrders()

  return (
    <div className="space-y-8">
      {/* 头部区域 */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#74B868] mb-2">
            <Package size={20} />
            <span className="font-mono text-xs tracking-widest uppercase">物流控制台</span>
          </div>
          <h1 className="text-4xl font-black text-[#0B0F19] tracking-tight">订单管理</h1>
        </div>
        <div className="flex gap-3">
          <Button
            icon={<RefreshCw size={16} />}
            className="rounded-xl border-gray-300 hover:border-[#74B868] hover:text-[#74B868]"
            onClick={() => refetch()}
          />
          <Button
            type="primary"
            icon={<Plus size={16} />}
            className="bg-[#74B868] hover:!bg-[#5da052] border-none h-10 px-6 rounded-xl font-bold shadow-lg shadow-[#74B868]/20"
            onClick={() => setIsCreateModalVisible(true)}
          >
            创建订单
          </Button>
          <Button
            type="primary"
            icon={<Truck size={16} />}
            className="bg-[#0B0F19] hover:!bg-[#2a3142] border-none h-10 px-6 rounded-xl font-bold shadow-lg shadow-[#0B0F19]/20"
          >
            批量发货
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
        <Input
          prefix={<Search size={16} className="text-gray-400" />}
          placeholder="搜索订单号 / 姓名"
          className="w-64 h-10 rounded-xl bg-gray-50 border-transparent hover:bg-white hover:border-[#74B868] focus:bg-white focus:border-[#74B868] transition-all"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Select
          placeholder="状态"
          allowClear
          className="w-40 h-10"
          onChange={setStatus}
          options={STATUS_OPTIONS}
        />
        <Select
          defaultValue="createdAt"
          className="w-40 h-10"
          onChange={setSort}
          options={SORT_OPTIONS}
        />
      </div>

      {/* 数据表格 */}
      <OrdersTable orders={orders} loading={isLoading} actionPathPrefix="/merchant/orders" />

      <CreateOrderModal
        visible={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onCreate={handleCreateOrder}
      />
    </div>
  )
}
