import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@logistics/shared'

const URL = 'http://localhost:3001'

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  path: '/ws',
  autoConnect: false,
})
