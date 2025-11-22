import React, { useState } from 'react'
import { Table, Tag, Button, Input, Select, Space, Card } from 'antd'
import { Search, Filter, Eye, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGetOrdersQuery } from '../services/api'
import type { Order } from '@logistics/shared'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'

export default function MerchantDashboard() {
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [sort, setSort] = useState('createdAt')
  const { data, isLoading } = useGetOrdersQuery({ status, sort, order: 'desc' })

  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-medium text-text-primary">{text}</span>,
    },
    {
      title: '收货人',
      key: 'recipient',
      render: (_: any, record: Order) => (
        <div className="flex flex-col">
          <span className="text-text-primary font-medium">{record.recipient.name}</span>
          <span className="text-text-tertiary text-xs">{record.recipient.phone}</span>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <span className="font-medium">¥{amount.toFixed(2)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'warning',
          in_transit: 'processing',
          signed: 'success',
        }
        const labels: Record<string, string> = {
          pending: '待发货',
          in_transit: '运输中',
          signed: '已签收',
        }
        return <Tag color={colors[status]}>{labels[status]}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <span className="text-text-secondary">{dayjs(date).format('YYYY-MM-DD HH:mm')}</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Link to={`/merchant/orders/${record.id}`}>
            <Button type="text" icon={<Eye size={16} />} className="text-primary-base hover:text-primary-darker">详情</Button>
          </Link>
        </Space>
      ),
    },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">订单管理</h1>
          <p className="text-text-tertiary mt-1">查看和管理所有订单发货状态</p>
        </div>
        <Button type="primary" icon={<Truck size={16} />} className="bg-primary-base hover:bg-primary-darker border-none shadow-lg shadow-primary-base/30">
          批量发货
        </Button>
      </div>

      <Card className="border-none shadow-subtle bg-white/80 backdrop-blur-sm">
        <div className="flex flex-wrap gap-4 mb-6">
          <Input 
            prefix={<Search size={16} className="text-gray-400" />} 
            placeholder="搜索订单号/收货人" 
            className="w-64" 
          />
          <Select 
            placeholder="订单状态" 
            allowClear 
            className="w-40"
            onChange={setStatus}
            options={[
              { value: 'pending', label: '待发货' },
              { value: 'in_transit', label: '运输中' },
              { value: 'signed', label: '已签收' },
            ]}
          />
          <Select 
            defaultValue="createdAt" 
            className="w-40"
            onChange={setSort}
            options={[
              { value: 'createdAt', label: '按时间排序' },
              { value: 'amount', label: '按金额排序' },
            ]}
          />
        </div>

        <Table 
          columns={columns} 
          dataSource={data?.data} 
          rowKey="id" 
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </motion.div>
  )
}
