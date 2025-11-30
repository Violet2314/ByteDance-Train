import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const useScrollToHash = () => {
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // 添加短暂延迟以确保导航后 DOM 已准备就绪
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [hash])
}
