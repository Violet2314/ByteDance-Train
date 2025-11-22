import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Tag, Steps, message, Spin } from 'antd'
import { ArrowLeft, Package, MapPin, User, Truck, CheckCircle } from 'lucide-react'
import { useGetOrderByIdQuery, useShipOrderMutation } from '../services/api'
import dayjs from 'dayjs'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useGetOrderByIdQuery(id!)
  const [shipOrder, { isLoading: isShipping }] = useShipOrderMutation()

  const order = data?.data

  const handleShip = async () => {
    try {
      await shipOrder(id!).unwrap()
      message.success('发货成功')
    } catch (err) {
      message.error('发货失败')
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>
  if (!order) return <div>订单不存在</div>

  const stepStatus = {
    pending: 0,
    in_transit: 1,
    signed: 2,
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} className="pl-0 hover:bg-transparent hover:text-primary-base">
        返回列表
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-text-primary">订单 #{order.id}</h1>
          <Tag color={order.status === 'pending' ? 'warning' : order.status === 'in_transit' ? 'processing' : 'success'} className="text-sm px-3 py-1">
            {order.status === 'pending' ? '待发货' : order.status === 'in_transit' ? '运输中' : '已签收'}
          </Tag>
        </div>
        {order.status === 'pending' && (
          <Button 
            type="primary" 
            size="large" 
            icon={<Truck size={18} />} 
            loading={isShipping}
            onClick={handleShip}
            className="bg-primary-base hover:bg-primary-darker border-none shadow-lg shadow-primary-base/30"
          >
            立即发货
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="物流进度" className="shadow-subtle border-none">
            <Steps
              current={stepStatus[order.status]}
              items={[
                { title: '已下单', description: dayjs(order.createdAt).format('MM-DD HH:mm'), icon: <Package size={20} /> },
                { title: '运输中', description: order.status !== 'pending' ? '物流配送中' : '等待发货', icon: <Truck size={20} /> },
                { title: '已签收', description: order.status === 'signed' ? '客户已签收' : '等待送达', icon: <CheckCircle size={20} /> },
              ]}
            />
          </Card>

          <Card title="商品信息" className="shadow-subtle border-none">
            <div className="flex items-center gap-4 p-4 bg-bg-page rounded-xl">
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                <Package size={32} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-lg">示例商品</h3>
                <p className="text-text-tertiary">规格: 标准版</p>
              </div>
              <div className="text-right">
                <p className="font-medium">¥{order.amount.toFixed(2)}</p>
                <p className="text-text-tertiary">x1</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
              <span className="text-text-secondary mr-4">共 1 件商品</span>
              <span className="font-bold text-lg">合计: ¥{order.amount.toFixed(2)}</span>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="收货信息" className="shadow-subtle border-none">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="text-primary-base mt-1" size={18} />
                <div>
                  <p className="font-medium">{order.recipient.name}</p>
                  <p className="text-text-secondary">{order.recipient.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-primary-base mt-1" size={18} />
                <div>
                  <p className="text-text-secondary">{order.address.text}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="订单信息" className="shadow-subtle border-none">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-tertiary">订单编号</span>
                <span className="font-mono">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">创建时间</span>
                <span>{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">支付方式</span>
                <span>在线支付</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
