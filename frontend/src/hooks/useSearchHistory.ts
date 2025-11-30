import { useState, useEffect } from 'react'

interface SearchHistory {
  id: string
  timestamp: number
}

export function useSearchHistory(maxItems = 6) {
  const [history, setHistory] = useState<SearchHistory[]>([])

  // 从 localStorage 加载历史记录
  useEffect(() => {
    const saved = localStorage.getItem('tracking_history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse history', e)
      }
    }
  }, [])

  // 添加记录到历史
  const addToHistory = (id: string) => {
    const trimmedId = id.trim()
    if (!trimmedId) return

    const newHistory = [
      { id: trimmedId, timestamp: Date.now() },
      ...history.filter((h) => h.id !== trimmedId),
    ].slice(0, maxItems)

    setHistory(newHistory)
    localStorage.setItem('tracking_history', JSON.stringify(newHistory))
  }

  // 从历史中移除
  const removeFromHistory = (id: string) => {
    const newHistory = history.filter((h) => h.id !== id)
    setHistory(newHistory)
    localStorage.setItem('tracking_history', JSON.stringify(newHistory))
  }

  // 清空历史
  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('tracking_history')
  }

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  }
}
