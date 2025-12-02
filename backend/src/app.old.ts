import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import type { Order, TrackPoint, ShipmentState, TrackUpdatePayload, OrderStatusPayload } from '@logistics/shared'
import { startSimulation } from './services/simulator'
import { getDrivingPath } from './services/amap'
import pool from './db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { generateToken, authenticateToken, requireRole, AuthRequest } from './middleware/auth'
import { errorHandler } from './middleware/errorHandler'
import { respond } from './utils/response'
import { isPointInPolygon } from './utils/geo'

const PORT = Number(process.env.PORT || 3001)
const WS_PATH = process.env.WS_PATH || '/ws'

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

const server = http.createServer(app)
const io = new Server(server, { path: WS_PATH, cors: { origin: '*' } })

app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body
  console.log('Login attempt:', { username, password, role })
  
  try {
    let user = null
    let userRole = 'user'

    if (role === 'merchant') {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM merchants WHERE username = ? AND password = ?', [username, password])
      if (rows.length > 0) {
        user = rows[0]
        userRole = 'merchant'
      }
    } else {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE username = ? AND password = ?', [username, password])
      if (rows.length > 0) {
        user = rows[0]
        userRole = 'user'
      }
    }
    
    if (user) {
      // 生成 JWT Token
      const token = generateToken({
        id: user.id,
        username: user.username,
        role: userRole as 'user' | 'merchant'
      })

      return res.json(respond({
        id: user.id,
        username: user.username,
        role: userRole,
        name: userRole === 'merchant' ? user.shop_name : user.real_name,
        token // 返回 JWT Token
      }))
    }
    
    return res.status(401).json(respond(null, { code: 'Unauthorized', message: '用户名或密码错误' }))
  } catch (error) {
    console.error(error)
    return res.status(500).json(respond(null, { code: 'InternalError', message: '数据库错误' }))
  }
})

// 搜索用户（商家专用）
app.get('/api/users/search', authenticateToken, requireRole('merchant'), async (req, res) => {
  const { q } = req.query
  if (!q || typeof q !== 'string') return res.json(respond([]))
  
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, real_name, phone FROM users WHERE (username LIKE ? OR real_name LIKE ? OR phone LIKE ?) LIMIT 10',
      [`%${q}%`, `%${q}%`, `%${q}%`]
    )
    res.json(respond(rows))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '搜索用户失败' }))
  }
})

// 地址簿 API
app.get('/api/address-book', authenticateToken, requireRole('merchant'), async (req, res) => {
  const user = (req as AuthRequest).user!
  const merchantId = user.id // 从 token 中获取商家 ID
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM address_book WHERE merchant_id = ? ORDER BY created_at DESC', [merchantId])
    const list = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      contactName: r.contact_name,
      contactPhone: r.contact_phone,
      address: r.address_text,
      lat: r.lat,
      lng: r.lng
    }))
    res.json(respond(list))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '获取地址簿失败' }))
  }
})

app.post('/api/address-book', authenticateToken, requireRole('merchant'), async (req, res) => {
  const user = (req as AuthRequest).user!
  const body = req.body
  const merchantId = user.id // 从 token 中获取商家 ID
  
  if (!body.name || !body.contactName || !body.contactPhone || !body.address) {
    return res.status(400).json(respond(null, { code: 'BadRequest', message: '请填写完整信息' }))
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO address_book (merchant_id, name, contact_name, contact_phone, address_text, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [merchantId, body.name, body.contactName, body.contactPhone, body.address, body.lat || 0, body.lng || 0]
    )
    
    res.json(respond({ id: result.insertId, ...body }))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '保存地址失败' }))
  }
})

app.delete('/api/address-book/:id', authenticateToken, requireRole('merchant'), async (req, res) => {
  try {
    await pool.query('DELETE FROM address_book WHERE id = ?', [req.params.id])
    res.json(respond({ ok: true }))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '删除地址失败' }))
  }
})

app.get('/api/delivery-rules', authenticateToken, requireRole('merchant'), async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM delivery_rules')
    // 如果需要，解析 JSON path，mysql2 可能会将其返回为对象（如果列类型为 JSON）
    const rules = rows.map((r: any) => ({
      id: r.id,
      company: r.company,
      days: r.days,
      intraCity: r.intra_city,
      inProvince: r.in_province,
      interProvince: r.inter_province,
      remote: r.remote,
      area: r.area,
      color: 'blue', // 默认颜色（数据库已移除此字段）
      isEnabled: true, // 默认启用（数据库已移除此字段）
      // 确保 path 是数组
      path: typeof r.path === 'string' ? JSON.parse(r.path) : r.path
    }))
    res.json(respond(rules))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '获取规则失败' }))
  }
})

app.post('/api/delivery-rules', authenticateToken, requireRole('merchant'), async (req, res) => {
  const user = (req as AuthRequest).user!
  const body = req.body
  const merchantId = user.id // 从 token 中获取商家 ID
  
  try {
    const pathStr = JSON.stringify(body.path || [])
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO delivery_rules 
      (merchant_id, company, days, intra_city, in_province, inter_province, remote, area, path) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        merchantId, 
        body.company, 
        body.days, 
        body.intraCity, 
        body.inProvince, 
        body.interProvince, 
        body.remote, 
        body.area, 
        pathStr
      ]
    )
    res.json(respond({ id: result.insertId, ...body }))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '创建规则失败' }))
  }
})

app.put('/api/delivery-rules/:id', authenticateToken, requireRole('merchant'), async (req, res) => {
  const { id } = req.params
  const body = req.body
  
  try {
    const updates: string[] = []
    const params: any[] = []
    
    if (body.company) { updates.push('company = ?'); params.push(body.company) }
    if (body.days) { updates.push('days = ?'); params.push(body.days) }
    if (body.intraCity) { updates.push('intra_city = ?'); params.push(body.intraCity) }
    if (body.inProvince) { updates.push('in_province = ?'); params.push(body.inProvince) }
    if (body.interProvince) { updates.push('inter_province = ?'); params.push(body.interProvince) }
    if (body.remote) { updates.push('remote = ?'); params.push(body.remote) }
    if (body.area) { updates.push('area = ?'); params.push(body.area) }
    if (body.path) { updates.push('path = ?'); params.push(JSON.stringify(body.path)) }
    
    if (updates.length === 0) return res.json(respond({ ok: true }))
    
    params.push(id)
    await pool.query(`UPDATE delivery_rules SET ${updates.join(', ')} WHERE id = ?`, params)
    
    res.json(respond({ ok: true }))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '更新规则失败' }))
  }
})

app.delete('/api/delivery-rules/:id', authenticateToken, requireRole('merchant'), async (req, res) => {
  try {
    await pool.query('DELETE FROM delivery_rules WHERE id = ?', [req.params.id])
    res.json(respond({ ok: true }))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '删除规则失败' }))
  }
})

app.get('/api/orders', authenticateToken, async (req, res) => {
  const user = (req as AuthRequest).user!
  const { status, sort = 'created_at', order = 'asc' } = req.query as any
  
  // 根据角色过滤订单
  const userId = user.role === 'user' ? user.id : undefined
  
  try {
    let query = `
      SELECT o.*, 
             ot.shipped_at, 
             ot.delivery_days, 
             ot.ts as tracking_ts 
      FROM orders o
      LEFT JOIN order_tracking ot ON o.id = ot.order_id
    `
    const params: any[] = []
    const conditions: string[] = []
    
    if (status) {
      conditions.push('o.status = ?')
      params.push(status)
    }

    if (userId) {
      conditions.push('o.user_id = ?')
      params.push(userId)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    // 验证排序字段以防止 SQL 注入
    const allowedSorts = ['created_at', 'amount', 'id']
    const sortCol = allowedSorts.includes(sort) ? `o.${sort}` : 'o.created_at'
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC'
    
    query += ` ORDER BY ${sortCol} ${sortOrder}`
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params)
    
    const list = rows.map((r: any) => ({
      id: r.id,
      status: r.status,
      amount: Number(r.amount),
      createdAt: r.created_at,
      deliveryDays: r.delivery_days || '3天', // 从轨迹表获取或使用默认值
      shippedAt: r.shipped_at, // 从轨迹表获取
      lastTrackTime: r.tracking_ts, // 从轨迹表获取
      sender: {
        name: r.sender_name,
        phone: r.sender_phone,
        address: r.sender_address,
        lat: r.sender_lat,
        lng: r.sender_lng,
      },
      recipient: {
        name: r.recipient_name,
        phone: r.recipient_phone,
      },
      address: {
        text: r.address_text,
        lat: r.address_lat,
        lng: r.address_lng,
      },
      cargo: {
        name: r.item_name,
        weight: r.weight,
        quantity: r.quantity,
      }
    }))
    
    res.json(respond(list))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '获取订单失败' }))
  }
})

app.post('/api/orders', authenticateToken, requireRole('merchant'), async (req, res) => {
  const user = (req as AuthRequest).user!
  const body = req.body
  if (!body.recipient || !body.recipient.name || !body.recipient.phone || !body.recipient.address) {
    return res.status(400).json(respond(null, { code: 'BadRequest', message: '缺少收件人信息' }))
  }

  // 验证发货人信息（数据库 schema 要求）
  if (!body.sender || !body.sender.lat || !body.sender.lng) {
    return res.status(400).json(respond(null, { code: 'BadRequest', message: '缺少发货人地址坐标' }))
  }

  const merchantId = user.id // 从 token 中获取商家 ID
  const userId = body.userId || null

  // 生成简短 ID: O + 时间戳后 11 位
  const newOrder = {
    id: `O${Date.now().toString().slice(-11)}`,
    status: 'pending',
    amount: body.amount || 0,
    
    sender_name: body.sender?.name || '',
    sender_phone: body.sender?.phone || '',
    sender_address: body.sender?.address || '',
    sender_lat: body.sender?.lat || 0,
    sender_lng: body.sender?.lng || 0,

    recipient_name: body.recipient.name,
    recipient_phone: body.recipient.phone,
    address_text: body.recipient.address,
    address_lat: body.recipient.lat || 0,
    address_lng: body.recipient.lng || 0,

    item_name: body.cargo?.name || '',
    weight: body.cargo?.weight || 0,
    quantity: body.cargo?.quantity || 1,

    created_at: new Date()
  }
  
  try {
    await pool.query(
      `INSERT INTO orders (
        id, merchant_id, user_id, status, amount, 
        sender_name, sender_phone, sender_address, sender_lat, sender_lng,
        recipient_name, recipient_phone, address_text, address_lat, address_lng, 
        item_name, weight, quantity, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newOrder.id, merchantId, userId, newOrder.status, newOrder.amount,
        newOrder.sender_name, newOrder.sender_phone, newOrder.sender_address, newOrder.sender_lat, newOrder.sender_lng,
        newOrder.recipient_name, newOrder.recipient_phone, newOrder.address_text, newOrder.address_lat, newOrder.address_lng,
        newOrder.item_name, newOrder.weight, newOrder.quantity, newOrder.created_at
      ]
    )
    
    // 返回前端格式的订单数据
    const responseOrder: Order = {
      id: newOrder.id,
      status: 'pending',
      amount: newOrder.amount,
      createdAt: newOrder.created_at.toISOString(),
      sender: {
        name: newOrder.sender_name,
        phone: newOrder.sender_phone,
        address: newOrder.sender_address,
        lat: newOrder.sender_lat,
        lng: newOrder.sender_lng,
      },
      recipient: {
        name: newOrder.recipient_name,
        phone: newOrder.recipient_phone,
      },
      address: {
        text: newOrder.address_text,
        lat: newOrder.address_lat,
        lng: newOrder.address_lng,
      },
      cargo: {
        name: newOrder.item_name,
        weight: newOrder.weight,
        quantity: newOrder.quantity,
      }
    }
    
    res.json(respond(responseOrder))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '创建订单失败' }))
  }
})

app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM orders WHERE id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json(respond(null, { code: 'NotFound', message: '订单不存在' }))
    }
    
    const r = rows[0]
    const order: Order = {
      id: r.id,
      status: r.status,
      amount: Number(r.amount),
      createdAt: r.created_at,
      sender: {
        name: r.sender_name,
        phone: r.sender_phone,
        address: r.sender_address,
        lat: r.sender_lat,
        lng: r.sender_lng,
      },
      recipient: {
        name: r.recipient_name,
        phone: r.recipient_phone,
      },
      address: {
        text: r.address_text,
        lat: r.address_lat,
        lng: r.address_lng,
      },
      cargo: {
        name: r.item_name,
        weight: r.weight,
        quantity: r.quantity,
      }
    }
    
    res.json(respond(order))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '获取订单失败' }))
  }
})

app.post('/api/orders/:id/ship', authenticateToken, requireRole('merchant'), async (req, res) => {
  const { id } = req.params
  const { ruleId } = req.body
  
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM orders WHERE id = ?', [id])
    if (rows.length === 0) return res.status(404).json(respond(null, { code: 'NotFound', message: '订单不存在' }))
    
    const order = rows[0]
    if (order.status !== 'pending') return res.status(400).json(respond(null, { code: 'BadRequest', message: '订单不可发货' }))
    
    // 根据规则确定配送时效
    let deliveryPromise = '3-5天' // 默认值
    if (ruleId) {
      const [ruleRows] = await pool.query<RowDataPacket[]>('SELECT * FROM delivery_rules WHERE id = ?', [ruleId])
      if (ruleRows.length > 0) {
        const rule = ruleRows[0]
        // 验证发货地和收货地是否在规则区域内
        const rulePath = typeof rule.path === 'string' ? JSON.parse(rule.path) : rule.path
        if (Array.isArray(rulePath) && rulePath.length > 0) {
          // 注意：rulePath 通常是 [[lng, lat], ...]
          // 订单坐标是 lat, lng 列
          const senderPoint: [number, number] = [order.sender_lng, order.sender_lat]
          const recipientPoint: [number, number] = [order.address_lng, order.address_lat]
          
          const isSenderIn = isPointInPolygon(senderPoint, rulePath)
          const isRecipientIn = isPointInPolygon(recipientPoint, rulePath)
          
          if (!isSenderIn || !isRecipientIn) {
             return res.status(400).json(respond(null, { 
               code: 'BadRequest', 
               message: `该配送规则不覆盖${!isSenderIn ? '发货地' : ''}${!isSenderIn && !isRecipientIn ? '和' : ''}${!isRecipientIn ? '收货地' : ''}` 
             }))
          }
        }

        // 简单逻辑：如果同城使用 intra_city，否则使用 inter_province
        // 目前只是选择一个或使用通用值
        deliveryPromise = ruleRows[0].inter_province || '3-5天'
      }
    }

    // 更新数据库中的订单状态
    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?', 
      ['in_transit', id]
    )
    
    console.log(`Shipping order ${id} with rule ${ruleId}, promise: ${deliveryPromise}`)
    
    // 计划路线
    const sender = { lat: order.sender_lat, lng: order.sender_lng }
    const recipient = { lat: order.address_lat, lng: order.address_lng }
    console.log(`[Ship] Planning route for Order ${id} from ${sender.lat},${sender.lng} to ${recipient.lat},${recipient.lng}`)
    
    const routePath = await getDrivingPath(sender, recipient)
    console.log(`[Ship] Route planned with ${routePath.length} points`)
    
    const routePathJson = JSON.stringify(routePath)

    // 立即保存初始轨迹信息，确保前端可以看到
    try {
      await pool.query(
        `INSERT INTO order_tracking (order_id, lat, lng, ts, shipped_at, delivery_days, route_path) 
         VALUES (?, ?, ?, ?, NOW(), ?, ?)
         ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng), ts = VALUES(ts), route_path = VALUES(route_path)`, 
        [id, sender.lat, sender.lng, Date.now(), deliveryPromise, routePathJson]
      )
    } catch (e) {
      console.error('Failed to save initial track point', e)
    }

    // Start Simulation
    startSimulation(
      id,
      io,
      routePath, // 高德地图路线
      async (point) => {
        // Save track point to DB
        try {
          await pool.query(
            `INSERT INTO order_tracking (order_id, lat, lng, ts, shipped_at, delivery_days, route_path) 
             VALUES (?, ?, ?, ?, NOW(), ?, ?)
             ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng), ts = VALUES(ts), route_path = VALUES(route_path)`, 
            [point.orderId, point.lat, point.lng, point.ts, deliveryPromise, routePathJson]
          )
        } catch (e) {
          console.error('Failed to save track point', e)
        }
      },
      async () => {
        // 更新状态为已签收
        try {
          await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['signed', id])
        } catch (e) {
          console.error('Failed to update order status to signed', e)
        }
      },
      async (statusState) => {
        try {
          await pool.query('UPDATE orders SET status = ? WHERE id = ?', [statusState.status, statusState.orderId])
        } catch (e) {
          console.error('Failed to update order status', e)
        }
      },
      undefined,
      deliveryPromise
    )
    
    res.json(respond({ ok: true }))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '发货失败' }))
  }
})

app.post('/api/orders/batch-ship-optimized', authenticateToken, requireRole('merchant'), async (req, res) => {
  const { orderIds, routePath, ruleId } = req.body
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json(respond(null, { code: 'BadRequest', message: '请选择订单' }))
  }
  if (!routePath || !Array.isArray(routePath) || routePath.length < 2) {
    return res.status(400).json(respond(null, { code: 'BadRequest', message: '缺少有效路径信息' }))
  }

  try {
    // 根据规则确定配送时效
    let deliveryPromise = '智能规划'
    if (ruleId) {
      const [ruleRows] = await pool.query<RowDataPacket[]>('SELECT * FROM delivery_rules WHERE id = ?', [ruleId])
      if (ruleRows.length > 0) {
        // 目前使用 inter_province 作为默认时效文本，或使用 days
        deliveryPromise = ruleRows[0].inter_province || ruleRows[0].days || '3-5天'
      }
    }

    // 1. 更新所有订单为 '运输中'
    const placeholders = orderIds.map(() => '?').join(',')
    await pool.query(
      `UPDATE orders SET status = ? WHERE id IN (${placeholders})`, 
      ['in_transit', ...orderIds]
    )

    // 2. 查询订单以获取他们的目的地坐标
    const [orders] = await pool.query<RowDataPacket[]>(
      `SELECT id, address_lat, address_lng FROM orders WHERE id IN (${placeholders})`,
      orderIds
    )

    // 3. 启动批量模拟
    // 我们需要将每个订单映射到 routePath 上的“下车索引”
    // 找到 routePath 中与每个订单目的地最近的点
    const orderDropOffIndices = new Map<string, number>()
    
    orders.forEach((order: any) => {
      let minDist = Infinity
      let closestIndex = -1
      
      routePath.forEach((point, index) => {
        // 简单的欧几里得距离足以匹配
        const d = Math.pow(point.lng - order.address_lng, 2) + Math.pow(point.lat - order.address_lat, 2)
        if (d < minDist) {
          minDist = d
          closestIndex = index
        }
      })
      orderDropOffIndices.set(order.id, closestIndex)
    })

    // 为每个订单启动模拟，但他们共享同一条“卡车”时间线
    // 理想情况下，我们应该有一个 "TruckManager"，但为了适应现有架构，
    // 我们为每个订单生成一个模拟，但给他们同一条路线（截断的）。
    
    // 对于订单 A（在索引 50 下车）：路线 = routePath.slice(0, 51)
    // 对于订单 B（在索引 100 下车）：路线 = routePath.slice(0, 101)
    // 这确保他们一起行驶直到下车点。

    for (const order of orders) {
      const dropOffIndex = orderDropOffIndices.get(order.id) || routePath.length - 1
      // 为此订单创建特定路线：从起点 -> ... -> 下车点
      // 我们添加一个小缓冲以确保它视觉上到达目的地
      const orderRoute = routePath.slice(0, dropOffIndex + 1)
      
      // 如果路线太短（例如起点），添加终点
      if (orderRoute.length < 2) orderRoute.push(routePath[dropOffIndex])

      const orderRouteJson = JSON.stringify(orderRoute)

      startSimulation(
        order.id,
        io,
        orderRoute, // 截取后的路线
        async (point) => {
          try {
            await pool.query(
              `INSERT INTO order_tracking (order_id, lat, lng, ts, shipped_at, delivery_days, route_path) 
               VALUES (?, ?, ?, ?, NOW(), ?, ?)
               ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng), ts = VALUES(ts), route_path = VALUES(route_path)`, 
              [point.orderId, point.lat, point.lng, point.ts, deliveryPromise, orderRouteJson]
            )
          } catch (e) { console.error(e) }
        },
        async () => {
          try {
            await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['signed', order.id])
          } catch (e) { console.error(e) }
        },
        async (statusState) => {
            try {
              await pool.query('UPDATE orders SET status = ? WHERE id = ?', [statusState.status, statusState.orderId])
            } catch (e) { console.error(e) }
        },
        undefined,
        deliveryPromise // 使用真实的规则时效
      )
    }

    res.json(respond({ shipped: orderIds.length }))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '智能发货失败' }))
  }
})

app.post('/api/orders/batch-ship', authenticateToken, requireRole('merchant'), async (req, res) => {
  const { orderIds, ruleId } = req.body
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json(respond(null, { code: 'BadRequest', message: '请选择订单' }))
  }

  try {
    const results = []
    for (const id of orderIds) {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM orders WHERE id = ?', [id])
      if (rows.length > 0 && rows[0].status === 'pending') {
        // 确定配送时效（批量发货的简化版）
        let deliveryPromise = '3-5天'
        if (ruleId) {
          const [ruleRows] = await pool.query<RowDataPacket[]>('SELECT * FROM delivery_rules WHERE id = ?', [ruleId])
          if (ruleRows.length > 0) deliveryPromise = ruleRows[0].inter_province || '3-5天'
        }

        await pool.query(
          'UPDATE orders SET status = ? WHERE id = ?', 
          ['in_transit', id]
        )
        
        // 计划路线
        const sender = { lat: rows[0].sender_lat, lng: rows[0].sender_lng }
        const recipient = { lat: rows[0].address_lat, lng: rows[0].address_lng }
        const routePath = await getDrivingPath(sender, recipient)
        const routePathJson = JSON.stringify(routePath)

        startSimulation(
          id,
          io,
          routePath, // 高德地图路线
          async (point) => {
            try {
              await pool.query(
                `INSERT INTO order_tracking (order_id, lat, lng, ts, shipped_at, delivery_days, route_path) 
                 VALUES (?, ?, ?, ?, NOW(), ?, ?)
                 ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng), ts = VALUES(ts), route_path = VALUES(route_path)`, 
                [point.orderId, point.lat, point.lng, point.ts, deliveryPromise, routePathJson]
              )
            } catch (e) { console.error(e) }
          },
          async () => {
            try {
              await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['signed', id])
            } catch (e) { console.error(e) }
          },
          async (statusState) => {
            try {
              await pool.query('UPDATE orders SET status = ? WHERE id = ?', [statusState.status, statusState.orderId])
            } catch (e) { console.error(e) }
          },
          undefined,
          deliveryPromise
        )
        results.push(id)
      }
    }
    res.json(respond({ shipped: results.length, total: orderIds.length }))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '批量发货失败' }))
  }
})

app.get('/api/orders/:id/tracking', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM order_tracking WHERE order_id = ? ORDER BY ts ASC', [req.params.id])
    const points = rows.map((r: any) => ({
      orderId: r.order_id,
      lat: r.lat,
      lng: r.lng,
      ts: r.ts,
      shippedAt: r.shipped_at,
      deliveryDays: r.delivery_days,
      routePath: typeof r.route_path === 'string' ? JSON.parse(r.route_path) : r.route_path
    }))
    res.json(respond(points))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '获取轨迹失败' }))
  }
})

io.on('connection', (socket) => {
  socket.on('subscribe', async ({ orderId }: { orderId: string }) => {
    socket.join(room(orderId))
    
    // 从数据库获取最近的历史记录
    try {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM order_tracking WHERE order_id = ? ORDER BY ts DESC LIMIT 10', [orderId])
      const recent = rows.reverse().map((r: any) => ({
        orderId: r.order_id,
        lat: r.lat,
        lng: r.lng,
        ts: r.ts
      }))
      
      for (const p of recent) {
        const payload: TrackUpdatePayload = { ...p }
        socket.emit('track:update', payload)
      }
    } catch (e) {
      console.error(e)
    }
  })
})

function room(orderId: string) { return `order:${orderId}` }

app.get('/api/geocode', async (req, res) => {
  const { address } = req.query
  if (!address || typeof address !== 'string') {
    return res.status(400).json(respond(null, { code: 'BadRequest', message: '请输入地址' }))
  }

  const key = process.env.AMAP_WEB_KEY
  if (!key) {
    return res.status(500).json(respond(null, { code: 'InternalError', message: '服务未配置地图Key' }))
  }

  try {
    const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&key=${key}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      const location = data.geocodes[0].location // "lng,lat"
      const [lng, lat] = location.split(',').map(Number)
      return res.json(respond({ lat, lng }))
    } else {
      return res.status(404).json(respond(null, { code: 'NotFound', message: '地址解析失败' }))
    }
  } catch (error) {
    console.error('Geocode error:', error)
    return res.status(500).json(respond(null, { code: 'InternalError', message: '地图服务请求失败' }))
  }
})

// 启动时恢复活跃的模拟
async function resumeSimulations() {
  console.log('Checking for active simulations to resume...')
  try {
    const [orders] = await pool.query<RowDataPacket[]>('SELECT * FROM orders WHERE status IN (?, ?)', ['in_transit', 'out_for_delivery'])
    
    for (const order of orders) {
      const [tracks] = await pool.query<RowDataPacket[]>('SELECT * FROM order_tracking WHERE order_id = ?', [order.id])
      if (tracks.length > 0) {
        const track = tracks[0]
        // 安全地解析路线路径
        let routePath = []
        try {
           routePath = typeof track.route_path === 'string' ? JSON.parse(track.route_path) : track.route_path
        } catch (e) {
           console.error(`Failed to parse route for order ${order.id}`, e)
           continue
        }
        
        if (!routePath || !Array.isArray(routePath) || routePath.length === 0) continue

        const shippedAt = new Date(track.shipped_at).getTime()
        const deliveryPromise = track.delivery_days || '3-5天'
        const routePathJson = JSON.stringify(routePath)

        console.log(`Resuming simulation for Order ${order.id}`)

        startSimulation(
          order.id,
          io,
          routePath, // 恢复模拟的路线
          async (point) => {
            try {
              await pool.query(
                `INSERT INTO order_tracking (order_id, lat, lng, ts, shipped_at, delivery_days, route_path) 
                 VALUES (?, ?, ?, ?, NOW(), ?, ?)
                 ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng), ts = VALUES(ts), route_path = VALUES(route_path)`, 
                [point.orderId, point.lat, point.lng, point.ts, deliveryPromise, routePathJson]
              )
            } catch (e) { console.error(e) }
          },
          async () => {
            try {
              await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['signed', order.id])
            } catch (e) { console.error(e) }
          },
          async (statusState) => {
            try {
              await pool.query('UPDATE orders SET status = ? WHERE id = ?', [statusState.status, statusState.orderId])
            } catch (e) { console.error(e) }
          },
          shippedAt,
          deliveryPromise
        )
      }
    }
    if (orders.length > 0) {
        console.log(`Resumed ${orders.length} active simulations`)
    }
  } catch (e) {
    console.error('Failed to resume simulations:', e)
  }
}

resumeSimulations()

// 应用错误处理中间件（必须在所有路由之后）
app.use(errorHandler)

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
  console.log(`WebSocket path ${WS_PATH}`)
})
