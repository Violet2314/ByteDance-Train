import React, { useState, useMemo } from 'react'
import { Table, Button, Tag, Input, Select, Modal, App } from 'antd'
import { ChevronUp, ChevronDown, Package, Search, Filter, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Order, DeliveryRule } from '@logistics/shared'
import { useShipOrderMutation, useBatchShipOrdersMutation } from '../../services/api'

interface DeliveryOrdersTableProps {
  orders: Order[]
  allOrders: Order[]
  activeRule: DeliveryRule | null
  isOpen: boolean
  onToggle: () => void
}

export default function DeliveryOrdersTable({
  orders, // Deliverable orders
  allOrders, // All orders
  activeRule,
  isOpen,
  onToggle,
}: DeliveryOrdersTableProps) {
  const { message } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [viewMode, setViewMode] = useState<'deliverable' | 'all'>('all')

  const [shipOrder] = useShipOrderMutation()
  const [batchShipOrders] = useBatchShipOrdersMutation()

  const sourceOrders = viewMode === 'all' ? allOrders : orders

  const filteredOrders = useMemo(() => {
    return sourceOrders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchText.toLowerCase()) ||
        order.recipient.name.toLowerCase().includes(searchText.toLowerCase()) ||
        order.recipient.phone.includes(searchText)

      const matchesStatus = statusFilter ? order.status === statusFilter : true

      return matchesSearch && matchesStatus
    })
  }, [sourceOrders, searchText, statusFilter])

  const handleShip = (order: Order) => {
    if (!activeRule) {
      message.error('请先选择配送规则')
      return
    }
    Modal.confirm({
      title: '确认发货',
      content: `确定使用规则 "${activeRule.company} - ${activeRule.area}" 发货订单 ${order.id} 吗？`,
      onOk: async () => {
        try {
          await shipOrder({ id: order.id, ruleId: activeRule.id }).unwrap()
          message.success('发货成功')
        } catch (e) {
          message.error('发货失败')
        }
      },
    })
  }

  const handleBatchShip = () => {
    if (!isSelectionMode) {
      setIsSelectionMode(true)
      return
    }

    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一个订单')
      return
    }

    if (!activeRule) {
      message.error('请先选择配送规则')
      return
    }

    Modal.confirm({
      title: '批量发货',
      content: `确定使用规则 "${activeRule.company} - ${activeRule.area}" 发货选中的 ${selectedRowKeys.length} 个订单吗？`,
      onOk: async () => {
        try {
          await batchShipOrders({
            orderIds: selectedRowKeys as string[],
            ruleId: activeRule.id,
          }).unwrap()
          message.success('批量发货成功')
          setIsSelectionMode(false)
          setSelectedRowKeys([])
        } catch (e) {
          message.error('批量发货失败')
        }
      },
    })
  }

  const bottomPanelVariants = {
    open: { height: '55%', opacity: 1, y: 0 },
    closed: { height: 48, opacity: 1, y: 0 },
  }

  return (
    <motion.div
      initial="open"
      animate={isOpen ? 'open' : 'closed'}
      variants={bottomPanelVariants}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 flex flex-col absolute bottom-0 left-0 right-0"
    >
      {/* Header / Toggle Bar */}
      <div
        className="h-12 flex-none flex items-center justify-between px-6 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Package size={18} className="text-blue-500" />
          <span className="font-bold text-gray-800">订单配送管理</span>

          <div
            className="flex bg-gray-100 p-1 rounded-lg ml-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={`px-3 py-0.5 text-xs font-bold rounded-md transition-all ${viewMode === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setViewMode('all')}
            >
              全部 ({allOrders.length})
            </button>
            <button
              className={`px-3 py-0.5 text-xs font-bold rounded-md transition-all ${viewMode === 'deliverable' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setViewMode('deliverable')}
            >
              区域内 ({orders.length})
            </button>
          </div>
        </div>
        <Button
          type="text"
          size="small"
          icon={isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-gray-100 flex gap-4 items-center bg-gray-50/50 justify-between">
          <div className="flex gap-4 items-center">
            <Input
              prefix={<Search size={14} className="text-gray-400" />}
              placeholder="搜索订单号、姓名、电话"
              className="w-64 rounded-lg"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="订单状态"
              allowClear
              className="w-32"
              value={statusFilter}
              onChange={setStatusFilter}
              suffixIcon={<Filter size={14} className="text-gray-400" />}
              options={[
                { label: '待处理', value: 'pending' },
                { label: '已揽收', value: 'picked' },
                { label: '运输中', value: 'in_transit' },
                { label: '到达中转站', value: 'arrived_at_hub' },
                { label: '派送中', value: 'out_for_delivery' },
                { label: '已送达', value: 'signed' },
              ]}
            />
          </div>
          <div className="flex gap-2">
            {isSelectionMode && (
              <Button
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedRowKeys([])
                }}
              >
                取消
              </Button>
            )}
            <Button
              type={isSelectionMode && selectedRowKeys.length > 0 ? 'primary' : 'default'}
              icon={<Truck size={16} />}
              onClick={handleBatchShip}
            >
              {isSelectionMode
                ? selectedRowKeys.length > 0
                  ? `确认发货 (${selectedRowKeys.length})`
                  : '请选择订单'
                : '批量发货'}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden p-4">
          <Table
            key={isSelectionMode ? 'selection' : 'normal'}
            dataSource={filteredOrders}
            rowKey="id"
            size="small"
            scroll={{ y: 'calc(55vh - 280px)', x: 'max-content' }}
            rowSelection={
              isSelectionMode
                ? {
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                    getCheckboxProps: (record) => ({
                      disabled: record.status !== 'pending',
                    }),
                  }
                : undefined
            }
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条订单`,
              position: ['bottomRight'],
            }}
            columns={[
              {
                title: '订单号',
                dataIndex: 'id',
                key: 'id',
                width: 120,
                render: (t) => <span className="font-mono font-bold">{t}</span>,
              },
              {
                title: '收件人',
                key: 'recipient',
                width: 180,
                render: (_, r) => (
                  <span>
                    {r.recipient.name}{' '}
                    <span className="text-gray-400 text-xs ml-1">{r.recipient.phone}</span>
                  </span>
                ),
              },
              {
                title: '地址',
                key: 'address',
                render: (_, r) => (
                  <span className="text-xs text-gray-500 truncate block" title={r.address.text}>
                    {r.address.text}
                  </span>
                ),
              },
              {
                title: '金额',
                dataIndex: 'amount',
                key: 'amount',
                width: 100,
                render: (t) => `¥${t}`,
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 150,
                render: (s, r) => {
                  const map: Record<string, { text: string; color: string }> = {
                    pending: { text: '待处理', color: 'orange' },
                    picked: { text: '已揽收', color: 'cyan' },
                    in_transit: { text: '运输中', color: 'blue' },
                    arrived_at_hub: { text: '到达中转站', color: 'purple' },
                    out_for_delivery: { text: '派送中', color: 'geekblue' },
                    signed: { text: '已签收', color: 'green' },
                  }
                  const conf = map[s] || { text: s, color: 'default' }
                  const isDeliverable = orders.some((o) => o.id === r.id)

                  return (
                    <div className="flex items-center gap-2">
                      <Tag color={conf.color}>{conf.text}</Tag>
                      {s === 'pending' && !isSelectionMode && (
                        <Button
                          type="link"
                          size="small"
                          className="p-0 h-auto"
                          disabled={!isDeliverable}
                          onClick={() => handleShip(r)}
                        >
                          发货
                        </Button>
                      )}
                    </div>
                  )
                },
              },
            ]}
          />
        </div>
      </div>
    </motion.div>
  )
}
