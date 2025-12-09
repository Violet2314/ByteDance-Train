import React, { useMemo } from 'react'
import { Table, Button, ConfigProvider } from 'antd'
import { Link } from 'react-router-dom'
import type { Order } from '@logistics/shared'
import dayjs from 'dayjs'

interface OrdersTableProps {
  orders?: Order[]
  loading?: boolean
  actionPathPrefix: string // 路径前缀，例如 '/merchant/orders' 或 '/tracking'
}

/**
 * 订单列表表格组件
 *
 * 展示订单的详细信息，包括订单号、收件人、金额、状态和日期。
 * 支持点击查看详情。
 */
const OrdersTable = React.memo(({ orders, loading, actionPathPrefix }: OrdersTableProps) => {
  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string; bg: string }> = {
      pending: { color: '#F59E0B', label: '待处理', bg: '#FEF3C7' },
      picked: { color: '#3B82F6', label: '已揽收', bg: '#DBEAFE' },
      in_transit: { color: '#3B82F6', label: '运输中', bg: '#DBEAFE' },
      arrived_at_hub: { color: '#8B5CF6', label: '到达中转站', bg: '#EDE9FE' },
      out_for_delivery: { color: '#3B82F6', label: '派送中', bg: '#DBEAFE' },
      signed: { color: '#10B981', label: '已送达', bg: '#D1FAE5' },
    }
    const conf = config[status] || { color: '#9CA3AF', label: '未知', bg: '#F3F4F6' }
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
        style={{ color: conf.color, backgroundColor: conf.bg }}
      >
        {conf.label}
      </span>
    )
  }

  const columns = useMemo(
    () => [
      {
        title: '订单号',
        dataIndex: 'id',
        key: 'id',
        render: (text: string) => (
          <span className="font-mono font-bold text-[#0B0F19]">{text}</span>
        ),
      },
      {
        title: '收件人',
        key: 'recipient',
        render: (_: unknown, record: Order) => (
          <div className="flex flex-col">
            <span className="font-bold text-gray-800">{record.recipient.name}</span>
            <span className="text-gray-400 text-xs font-mono">{record.recipient.phone}</span>
          </div>
        ),
      },
      {
        title: '金额',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: number) => (
          <span className="font-mono font-medium">¥{amount.toFixed(2)}</span>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => getStatusBadge(status),
      },
      {
        title: '日期',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date: string) => (
          <span className="text-gray-400 font-mono text-xs">
            {dayjs(date).format('YYYY-MM-DD HH:mm')}
          </span>
        ),
      },
      {
        title: '操作',
        key: 'action',
        render: (_: unknown, record: Order) => (
          <Link to={`${actionPathPrefix}/${record.id}`}>
            <Button
              type="text"
              size="small"
              className="text-[#74B868] hover:text-[#5da052] hover:bg-[#74B868]/10 font-medium"
            >
              查看
            </Button>
          </Link>
        ),
      },
    ],
    [actionPathPrefix]
  )

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {orders?.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-mono font-bold text-gray-900 text-lg">{order.id}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
              {getStatusBadge(order.status)}
            </div>

            <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 mb-1">收件人</span>
                <span className="font-medium text-gray-800">{order.recipient.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-400 mb-1">金额</span>
                <span className="font-mono font-medium text-gray-900">
                  ¥{order.amount.toFixed(2)}
                </span>
              </div>
            </div>

            <Link to={`${actionPathPrefix}/${order.id}`} className="block">
              <Button
                block
                className="bg-white border-gray-200 text-gray-600 hover:text-primary-base hover:border-primary-base h-10 rounded-lg"
              >
                查看详情
              </Button>
            </Link>
          </div>
        ))}
        {!loading && orders?.length === 0 && (
          <div className="text-center py-10 text-gray-400">暂无订单</div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-200 overflow-hidden">
        <ConfigProvider
          theme={{
            components: {
              Table: {
                headerBg: '#F8F9FB',
                headerColor: '#6B7280',
                headerSplitColor: 'transparent',
                rowHoverBg: '#F0FDF4',
              },
            },
          }}
        >
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            loading={loading}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            className="[&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!text-xs [&_.ant-table-thead_th]:!tracking-wider"
          />
        </ConfigProvider>
      </div>
    </>
  )
})

export default OrdersTable
