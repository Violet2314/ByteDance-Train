import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Button, Card } from 'antd'
import { Search, Package } from 'lucide-react'

export default function TrackingSearch() {
  const [orderId, setOrderId] = useState('')
  const navigate = useNavigate()

  const handleSearch = () => {
    if (orderId.trim()) {
      navigate(`/tracking/${orderId}`)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-text-primary mb-4">追踪您的包裹</h1>
        <p className="text-text-secondary text-lg">输入订单号，实时掌握物流动态</p>
      </div>

      <Card className="w-full shadow-pronounced border-none rounded-2xl overflow-hidden">
        <div className="p-2 flex items-center gap-2">
          <Input
            size="large"
            placeholder="请输入订单号 (例如: O1001)"
            prefix={<Package className="text-gray-400" />}
            className="border-none text-lg h-14 bg-transparent focus:shadow-none"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Button
            type="primary"
            size="large"
            className="h-12 px-8 rounded-xl bg-primary-base hover:bg-primary-darker border-none font-semibold text-lg"
            onClick={handleSearch}
          >
            查询
          </Button>
        </div>
      </Card>

      <div className="mt-12 w-full">
        <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
          最近查询
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['O1001', 'O1002'].map((id) => (
            <div
              key={id}
              onClick={() => navigate(`/tracking/${id}`)}
              className="bg-white/60 p-4 rounded-xl border border-gray-100 cursor-pointer hover:bg-white hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-lighter/20 flex items-center justify-center text-primary-base">
                  <Package size={20} />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{id}</p>
                  <p className="text-xs text-text-tertiary">刚刚查询</p>
                </div>
              </div>
              <Search
                size={18}
                className="text-gray-300 group-hover:text-primary-base transition-colors"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
