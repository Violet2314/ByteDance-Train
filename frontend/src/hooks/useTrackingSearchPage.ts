import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchHistory } from './useSearchHistory'

export const useTrackingSearchPage = () => {
  const [orderId, setOrderId] = useState('')
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const navigate = useNavigate()

  const handleSearch = () => {
    const trimmedId = orderId.trim()
    if (!trimmedId) return
    addToHistory(trimmedId)
    navigate(`/tracking/${trimmedId}`)
  }

  const handleHistoryClick = (id: string) => {
    addToHistory(id)
    navigate(`/tracking/${id}`)
  }

  const removeHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    removeFromHistory(id)
  }

  return {
    orderId,
    setOrderId,
    history,
    clearHistory,
    handleSearch,
    handleHistoryClick,
    removeHistory,
  }
}
