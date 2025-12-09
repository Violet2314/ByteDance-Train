import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import { RowDataPacket } from 'mysql2'
import pool from './db'
import { errorHandler } from './middleware/errorHandler'
import { startSimulation } from './services/simulator'

// 导入路由
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import addressBookRoutes from './routes/addressBookRoutes'
import deliveryRuleRoutes from './routes/deliveryRuleRoutes'
import { createOrderRoutes } from './routes/orderRoutes'
import geocodeRoutes from './routes/geocodeRoutes'

const PORT = Number(process.env.PORT || 3001)
const WS_PATH = process.env.WS_PATH || '/ws'

// 创建 Express 应用
const app = express()

// 中间件
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// 创建 HTTP 服务器和 WebSocket 服务器
const server = http.createServer(app)
const io = new Server(server, { path: WS_PATH, cors: { origin: '*' } })

// 注册路由
app.use('/api', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/address-book', addressBookRoutes)
app.use('/api/delivery-rules', deliveryRuleRoutes)
app.use('/api/orders', createOrderRoutes(io))
app.use('/api/geocode', geocodeRoutes)

/**
 * 启动时恢复活跃的模拟
 */
async function resumeSimulations() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Checking for active simulations to resume...');
  }
  try {
    // 1. 恢复运输中和派送中的订单
    const [orders] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM orders WHERE status IN (?, ?)',
      ['in_transit', 'out_for_delivery']
    )

    for (const order of orders) {
      const [tracks] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM order_tracking WHERE order_id = ?',
        [order.id]
      )

      if (tracks.length > 0) {
        const track = tracks[0]

        // 安全地解析路线路径
        let routePath = []
        try {
          routePath =
            typeof track.route_path === 'string' ? JSON.parse(track.route_path) : track.route_path
        } catch (e) {
          console.error(`Failed to parse route for order ${order.id}`, e)
          continue
        }

        if (!routePath || !Array.isArray(routePath) || routePath.length === 0) continue

        const shippedAt = new Date(track.shipped_at).getTime()
        const deliveryDays = track.delivery_days || '3-5天'
        const routePathJson = JSON.stringify(routePath)

        if (process.env.NODE_ENV !== 'production') {
          console.log(`Resuming simulation for Order ${order.id}`);
        }

        startSimulation(
          order.id,
          io,
          routePath,
          async (point) => {
            try {
              await pool.query(
                `INSERT INTO order_tracking (order_id, lat, lng, ts, shipped_at, delivery_days, route_path) 
                 VALUES (?, ?, ?, ?, NOW(), ?, ?)
                 ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng), ts = VALUES(ts), route_path = VALUES(route_path)`,
                [point.orderId, point.lat, point.lng, point.ts, deliveryDays, routePathJson]
              )
            } catch (e) {
              console.error(e)
            }
          },
          async () => {
            try {
              await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['signed', order.id])
            } catch (e) {
              console.error(e)
            }
          },
          async (statusState) => {
            io.emit('order:status', { ...statusState, orderId: order.id })
          },
          shippedAt,
          deliveryDays
        )
      }
    }

    if (orders.length > 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Resumed ${orders.length} active simulations`);
      }
    }

    // 2. 检查到达中转站的订单，如果达到批量阈值则启动批量派送
    const [hubOrders] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM orders WHERE status = ?',
      ['arrived_at_hub']
    )

    if (hubOrders.length > 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Found ${hubOrders.length} orders at hub, checking for batch dispatch...`);
      }

      // 按中转站分组
      const hubGroups = new Map<number, string[]>()
      
      for (const order of hubOrders) {
        const [hubs] = await pool.query<RowDataPacket[]>(
          `SELECT * FROM transit_hubs WHERE ? LIKE CONCAT('%', city_keyword, '%') LIMIT 1`,
          [order.address_text]
        )
        
        if (hubs.length > 0) {
          const hubId = hubs[0].id
          if (!hubGroups.has(hubId)) {
            hubGroups.set(hubId, [])
          }
          hubGroups.get(hubId)!.push(order.id)
        }
      }

      // 对每个中转站，如果订单数量 >= 3，启动批量派送
      const orderService = (await import('./services/orderService')).default
      
      for (const [hubId, orderIds] of hubGroups.entries()) {
        if (orderIds.length >= 3) {
          const [hubs] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM transit_hubs WHERE id = ?',
            [hubId]
          )
          
          if (hubs.length > 0) {
            const hub = hubs[0]
            if (process.env.NODE_ENV !== 'production') {
              console.log(`Resuming batch dispatch for hub ${hub.name} with ${orderIds.length} orders`);
            }
            // @ts-ignore - 访问私有方法
            await orderService.dispatchBatch(hub, orderIds, io)
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to resume simulations:', e)
  }
}

// 恢复模拟
resumeSimulations()

// Socket.IO 事件处理
io.on('connection', (socket) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Socket] Client connected: ${socket.id}`);
  }

  // 订阅特定订单的更新
  socket.on('subscribe', ({ orderId }) => {
    if (orderId) {
      socket.join(`order:${orderId}`)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Socket] ${socket.id} subscribed to order:${orderId}`);
      }
    }
  })

  // 取消订阅
  socket.on('unsubscribe', ({ orderId }) => {
    if (orderId) {
      socket.leave(`order:${orderId}`)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Socket] ${socket.id} unsubscribed from order:${orderId}`);
      }
    }
  })

  socket.on('disconnect', () => {
    if (process.env.NODE_ENV !== 'production') {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  }
  })
})

// 应用错误处理中间件（必须在所有路由之后）
app.use(errorHandler)

// 启动服务器
server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
  console.log(`WebSocket path ${WS_PATH}`)
})
