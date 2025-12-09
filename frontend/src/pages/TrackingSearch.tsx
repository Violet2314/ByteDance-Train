import React from 'react'
import { Input, Button, Card } from 'antd'
import { Package } from 'lucide-react'
import { useTrackingSearchPage } from '../hooks/useTrackingSearchPage'
import { SearchHistoryList } from '../components/business/SearchHistoryList'

export default function TrackingSearch() {
  const {
    orderId,
    setOrderId,
    history,
    clearHistory,
    handleSearch,
    handleHistoryClick,
    removeHistory,
  } = useTrackingSearchPage()

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 max-w-2xl mx-auto w-full">
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary mb-2 md:mb-4">
          追踪您的包裹
        </h1>
        <p className="text-text-secondary text-base md:text-lg">输入订单号，实时掌握物流动态</p>
      </div>

      <Card className="w-full shadow-pronounced border-none rounded-2xl overflow-hidden">
        <div className="p-2 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-2">
          <Input
            size="large"
            placeholder="请输入订单号 (例如: O1001)"
            prefix={<Package className="text-gray-400" />}
            className="border-none text-base md:text-lg h-12 md:h-14 bg-transparent focus:shadow-none"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Button
            type="primary"
            size="large"
            className="h-12 md:h-12 px-8 rounded-xl bg-primary-base hover:bg-primary-darker border-none font-semibold text-base md:text-lg w-full md:w-auto"
            onClick={handleSearch}
          >
            查询
          </Button>
        </div>
      </Card>

      <SearchHistoryList
        history={history}
        onHistoryClick={handleHistoryClick}
        onRemoveHistory={removeHistory}
        onClearHistory={clearHistory}
      />
    </div>
  )
}
