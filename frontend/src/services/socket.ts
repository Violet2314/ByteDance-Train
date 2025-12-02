import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@logistics/shared'

const URL = 'http://localhost:3001'

// 初始化 Socket.IO 客户端
// Socket 用于实现实时通信（如订单状态更新、位置推送）
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  path: '/ws', // 指定 WebSocket 路径，需与后端一致
  autoConnect: false, // 禁止自动连接，我们需要在用户登录后手动调用 socket.connect()
})
