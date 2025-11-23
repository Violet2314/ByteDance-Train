import React, { useState } from 'react'
import { Table, Button, Input, Select, ConfigProvider } from 'antd'
import { Search, Truck, Package, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGetOrdersQuery } from '../services/api'
import type { Order } from '@logistics/shared'
import dayjs from 'dayjs'

export default function MerchantDashboard() {
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [sort, setSort] = useState('createdAt')
  const { data, isLoading } = useGetOrdersQuery({ status, sort, order: 'desc' })

  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-mono font-bold text-[#0B0F19]">{text}</span>,
    },
    {
      title: '收件人',
      key: 'recipient',
      render: (_: any, record: Order) => (
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
      render: (amount: number) => <span className="font-mono font-medium">¥{amount.toFixed(2)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { color: string; label: string; bg: string }> = {
          pending: { color: '#F59E0B', label: '待处理', bg: '#FEF3C7' },
          in_transit: { color: '#3B82F6', label: '运输中', bg: '#DBEAFE' },
          signed: { color: '#10B981', label: '已送达', bg: '#D1FAE5' },
        }
        const conf = config[status]
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider" style={{ color: conf.color, backgroundColor: conf.bg }}>
            {conf.label}
          </span>
        )
      },
    },
    {
      title: '日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <span className="text-gray-400 font-mono text-xs">{dayjs(date).format('YYYY-MM-DD HH:mm')}</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <Link to={`/merchant/orders/${record.id}`}>
          <Button type="text" size="small" className="text-[#74B868] hover:text-[#5da052] hover:bg-[#74B868]/10 font-medium">
            查看
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#74B868] mb-2">
             <Package size={20} />
             <span className="font-mono text-xs tracking-widest uppercase">物流控制台</span>
          </div>
          <h1 className="text-4xl font-black text-[#0B0F19] tracking-tight">订单管理</h1>
        </div>
        <div className="flex gap-3">
           <Button icon={<RefreshCw size={16} />} className="rounded-xl border-gray-300 hover:border-[#74B868] hover:text-[#74B868]" />
           <Button type="primary" icon={<Truck size={16} />} className="bg-[#0B0F19] hover:!bg-[#2a3142] border-none h-10 px-6 rounded-xl font-bold shadow-lg shadow-[#0B0F19]/20">
             批量发货
           </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
          <Input 
            prefix={<Search size={16} className="text-gray-400" />} 
            placeholder="搜索订单号 / 姓名" 
            className="w-64 h-10 rounded-xl bg-gray-50 border-transparent hover:bg-white hover:border-[#74B868] focus:bg-white focus:border-[#74B868] transition-all" 
          />
          <Select 
            placeholder="状态" 
            allowClear 
            className="w-40 h-10"
            onChange={setStatus}
            options={[
              { value: 'pending', label: '待处理' },
              { value: 'in_transit', label: '运输中' },
              { value: 'signed', label: '已送达' },
            ]}
          />
          <Select 
            defaultValue="createdAt" 
            className="w-40 h-10"
            onChange={setSort}
            options={[
              { value: 'createdAt', label: '最新优先' },
              { value: 'amount', label: '金额最高' },
            ]}
          />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-200 overflow-hidden">
        <ConfigProvider
          theme={{
            components: {
              Table: {
                headerBg: '#F8F9FB',
                headerColor: '#6B7280',
                headerSplitColor: 'transparent',
                rowHoverBg: '#F0FDF4',
              }
            }
          }}
        >
          <Table 
            columns={columns} 
            dataSource={data?.data} 
            rowKey="id" 
            loading={isLoading}
            pagination={{ pageSize: 8 }}
            className="[&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!text-xs [&_.ant-table-thead_th]:!tracking-wider"
          />
        </ConfigProvider>
      </div>
    </div>
  )
}
