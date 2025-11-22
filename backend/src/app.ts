import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import type { Order, TrackPoint, ShipmentState, TrackUpdatePayload, OrderStatusPayload } from '@logistics/shared'
import { startSimulation } from './services/simulator'

const PORT = Number(process.env.PORT || 3001)
const WS_PATH = process.env.WS_PATH || '/ws'

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, { path: WS_PATH, cors: { origin: '*' } })

// in-memory data
export const orders: Order[] = [
  { id: 'O1001', status: 'pending', amount: 199, createdAt: new Date().toISOString(), recipient: { name: '张三', phone: '13800000001' }, address: { text: '上海市黄浦区', lat: 31.2304, lng: 121.4737 } },
  { id: 'O1002', status: 'pending', amount: 299, createdAt: new Date().toISOString(), recipient: { name: '李四', phone: '13800000002' }, address: { text: '北京市朝阳区', lat: 39.9042, lng: 116.4074 } },
  { id: 'O1003', status: 'pending', amount: 99, createdAt: new Date().toISOString(), recipient: { name: '王五', phone: '13800000003' }, address: { text: '广州市天河区', lat: 23.1291, lng: 113.2644 } }
]

const trackHistory: Record<string, TrackPoint[]> = {}
const statusHistory: Record<string, ShipmentState[]> = {}

function respond(data: any, error: any = null) {
  return { data, error }
}

app.get('/api/orders', (req, res) => {
  const { status, sort = 'createdAt', order = 'asc' } = req.query as any
  let list = [...orders]
  if (status) list = list.filter(o => o.status === status)
  list.sort((a: any, b: any) => {
    const va = a[sort]
    const vb = b[sort]
    if (va === vb) return 0
    return (order === 'desc' ? -1 : 1) * (va > vb ? 1 : -1)
  })
  res.json(respond(list))
})

app.get('/api/orders/:id', (req, res) => {
  const o = orders.find(x => x.id === req.params.id)
  if (!o) return res.status(404).json(respond(null, { code: 'NotFound', message: '订单不存在' }))
  res.json(respond(o))
})

app.post('/api/orders/:id/ship', (req, res) => {
  const o = orders.find(x => x.id === req.params.id)
  if (!o) return res.status(404).json(respond(null, { code: 'NotFound', message: '订单不存在' }))
  if (o.status !== 'pending') return res.status(400).json(respond(null, { code: 'BadRequest', message: '订单不可发货' }))
  
  o.status = 'in_transit'
  
  // Start Simulation
  startSimulation(o.id, io, () => {
    o.status = 'signed'
  })
  
  res.json(respond({ ok: true }))
})

app.get('/api/orders/:id/tracking', (req, res) => {
  const points = trackHistory[req.params.id] || []
  res.json(respond(points))
})

io.on('connection', (socket) => {
  socket.on('subscribe', ({ orderId }: { orderId: string }) => {
    socket.join(room(orderId))
    const recent = trackHistory[orderId] || []
    for (const p of recent.slice(-10)) {
      const payload: TrackUpdatePayload = { ...p }
      socket.emit('track:update', payload)
    }
    const sh = statusHistory[orderId] || []
    for (const s of sh.slice(-4)) {
      const payload: OrderStatusPayload = { orderId, status: s.status, ts: s.ts }
      socket.emit('order:status', payload)
    }
  })
})

function room(orderId: string) { return `order:${orderId}` }

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
  console.log(`WebSocket path ${WS_PATH}`)
})
