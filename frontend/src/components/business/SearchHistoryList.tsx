import React from 'react'
import { Button } from 'antd'
import { Clock, X } from 'lucide-react'

interface SearchHistoryItem {
  id: string
  timestamp: number
}

interface SearchHistoryListProps {
  history: SearchHistoryItem[]
  onHistoryClick: (id: string) => void
  onRemoveHistory: (e: React.MouseEvent, id: string) => void
  onClearHistory: () => void
}

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return '更早以前'
}

/**
 * 搜索历史列表组件
 *
 * 展示用户的最近搜索记录，支持点击快速搜索和删除记录。
 */
export const SearchHistoryList = React.memo(
  ({ history, onHistoryClick, onRemoveHistory, onClearHistory }: SearchHistoryListProps) => {
    if (history.length === 0) return null

    return (
      <div className="mt-12 w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
            最近查询
          </h3>
          <Button
            type="text"
            size="small"
            className="text-gray-400 hover:text-red-500"
            onClick={onClearHistory}
          >
            清空记录
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => onHistoryClick(item.id)}
              className="bg-white/60 p-4 rounded-xl border border-gray-100 cursor-pointer hover:bg-white hover:shadow-md transition-all flex items-center justify-between group relative"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary-lighter/20 group-hover:text-primary-base transition-colors">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{item.id}</p>
                  <p className="text-xs text-text-tertiary">{formatTime(item.timestamp)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="text"
                  size="small"
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => onRemoveHistory(e, item.id)}
                  icon={<X size={14} />}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)
