import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react'
import { socket } from '../services/socket'

interface SocketContextValue {
  socket: typeof socket
  isConnected: boolean
}

const SocketContext = createContext<SocketContextValue | null>(null)

interface SocketProviderProps {
  children: ReactNode
}

/**
 * Socket 连接管理 Provider
 *
 * 统一管理 WebSocket 连接，避免每个组件独立连接
 * 提供全局单例的 socket 实例
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const [isConnected, setIsConnected] = React.useState(false)

  useEffect(() => {
    // 连接 Socket
    socket.connect()

    // 监听连接状态
    socket.on('connect', () => {
      console.log('[SocketProvider] Connected')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('[SocketProvider] Disconnected')
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('[SocketProvider] Connection error:', error)
      setIsConnected(false)
    })

    // 清理函数
    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.disconnect()
    }
  }, [])

  const value = useMemo(
    () => ({
      socket,
      isConnected,
    }),
    [isConnected]
  )

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

/**
 * 使用 Socket 连接的 Hook
 *
 * @returns Socket 实例和连接状态
 * @example
 * ```tsx
 * const { socket, isConnected } = useSocket()
 *
 * useEffect(() => {
 *   socket.on('track:update', handleUpdate)
 *   return () => socket.off('track:update', handleUpdate)
 * }, [])
 * ```
 */
export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
