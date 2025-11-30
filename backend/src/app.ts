import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import type { Order, TrackPoint, ShipmentState, TrackUpdatePayload, OrderStatusPayload } from '@logistics/shared'
import { startSimulation } from './services/simulator'
import { getDrivingPath } from './services/amap'
import pool from './db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

const PORT = Number(process.env.PORT || 3001)
const WS_PATH = process.env.WS_PATH || '/ws'

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

const server = http.createServer(app)
const io = new Server(server, { path: WS_PATH, cors: { origin: '*' } })

function respond(data: any, error: any = null) {
  return { data, error }
}

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
      return res.json(respond({
        id: user.id,
        username: user.username,
        role: userRole,
        name: userRole === 'merchant' ? user.shop_name : user.real_name
      }))
    }
    
    return res.status(401).json(respond(null, { code: 'Unauthorized', message: '用户名或密码错误' }))
  } catch (error) {
    console.error(error)
    return res.status(500).json(respond(null, { code: 'InternalError', message: '数据库错误' }))
  }
})

app.get('/api/users/search', async (req, res) => {
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

// Address Book Endpoints
app.get('/api/address-book', async (req, res) => {
  const merchantId = req.query.merchantId || 1 // Default to 1 for now
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

app.post('/api/address-book', async (req, res) => {
  const body = req.body
  const merchantId = body.merchantId || 1
  
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

app.delete('/api/address-book/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM address_book WHERE id = ?', [req.params.id])
    res.json(respond({ ok: true }))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '删除地址失败' }))
  }
})

app.get('/api/delivery-rules', async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM delivery_rules')
    // Parse JSON path if needed, mysql2 might return it as object if column type is JSON
    // If not, we might need to JSON.parse(r.path)
    const rules = rows.map((r: any) => ({
      id: r.id,
      company: r.company,
      days: r.days,
      intraCity: r.intra_city,
      inProvince: r.in_province,
      interProvince: r.inter_province,
      remote: r.remote,
      area: r.area,
      color: 'blue', // Default color since DB column removed
      isEnabled: true, // Default enabled since DB column removed
      // Ensure path is an array
      path: typeof r.path === 'string' ? JSON.parse(r.path) : r.path
    }))
    res.json(respond(rules))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '获取规则失败' }))
  }
})

app.post('/api/delivery-rules', async (req, res) => {
  const body = req.body
  const merchantId = body.merchantId || 1 // Default merchant
  
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

app.put('/api/delivery-rules/:id', async (req, res) => {
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

app.delete('/api/delivery-rules/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM delivery_rules WHERE id = ?', [req.params.id])
    res.json(respond({ ok: true }))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '删除规则失败' }))
  }
})

app.get('/api/orders', async (req, res) => {
  const { status, sort = 'created_at', order = 'asc', userId } = req.query as any
  
  try {
    let query = 'SELECT * FROM orders'
    const params: any[] = []
    const conditions: string[] = []
    
    if (status) {
      conditions.push('status = ?')
      params.push(status)
    }

    if (userId) {
      conditions.push('user_id = ?')
      params.push(userId)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    // Validate sort column to prevent SQL injection
    const allowedSorts = ['created_at', 'amount', 'id']
    const sortCol = allowedSorts.includes(sort) ? sort : 'created_at'
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC'
    
    query += ` ORDER BY ${sortCol} ${sortOrder}`
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params)
    
    const list = rows.map((r: any) => ({
      id: r.id,
      status: r.status,
      amount: Number(r.amount),
      createdAt: r.created_at,
      deliveryDays: r.delivery_days || 3, // Default to 3 if not in DB
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

app.post('/api/orders', async (req, res) => {
  const body = req.body
  if (!body.recipient || !body.recipient.name || !body.recipient.phone || !body.recipient.address) {
    return res.status(400).json(respond(null, { code: 'BadRequest', message: '缺少收件人信息' }))
  }

  // Validate sender info (required by DB schema)
  if (!body.sender || !body.sender.lat || !body.sender.lng) {
    return res.status(400).json(respond(null, { code: 'BadRequest', message: '缺少发货人地址坐标' }))
  }

  // TODO: Get merchant_id from authenticated user session
  // For now, we'll assume a default merchant or pass it in body
  const merchantId = body.merchantId || 1 
  const userId = body.userId || null

  // Generate a shorter ID: O + last 11 digits of timestamp
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
    
    // Return in frontend format
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

app.get('/api/orders/:id', async (req, res) => {
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

// Helper: Ray-casting algorithm for Point in Polygon
function isPointInPolygon(point: [number, number], vs: [number, number][]) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

app.post('/api/orders/:id/ship', async (req, res) => {
  const { id } = req.params
  const { ruleId } = req.body
  
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM orders WHERE id = ?', [id])
    if (rows.length === 0) return res.status(404).json(respond(null, { code: 'NotFound', message: '订单不存在' }))
    
    const order = rows[0]
    if (order.status !== 'pending') return res.status(400).json(respond(null, { code: 'BadRequest', message: '订单不可发货' }))
    
    // Determine delivery promise based on rule
    let deliveryPromise = '3-5天' // Default
    if (ruleId) {
      const [ruleRows] = await pool.query<RowDataPacket[]>('SELECT * FROM delivery_rules WHERE id = ?', [ruleId])
      if (ruleRows.length > 0) {
        const rule = ruleRows[0]
        // Validate if sender and recipient are in the rule area
        const rulePath = typeof rule.path === 'string' ? JSON.parse(rule.path) : rule.path
        if (Array.isArray(rulePath) && rulePath.length > 0) {
          // Note: rulePath is usually [[lng, lat], ...]
          // order coordinates are lat, lng columns
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

        // Simple logic: use intra_city if same city, else inter_province
        // For now, just pick one or use a generic one
        deliveryPromise = ruleRows[0].inter_province || '3-5天'
      }
    }

    // Update status in DB
    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?', 
      ['in_transit', id]
    )
    
    console.log(`Shipping order ${id} with rule ${ruleId}, promise: ${deliveryPromise}`)
    
    // Plan Route
    const sender = { lat: order.sender_lat, lng: order.sender_lng }
    const recipient = { lat: order.address_lat, lng: order.address_lng }
    console.log(`[Ship] Planning route for Order ${id} from ${sender.lat},${sender.lng} to ${recipient.lat},${recipient.lng}`)
    
    const routePath = await getDrivingPath(sender, recipient)
    console.log(`[Ship] Route planned with ${routePath.length} points`)
    
    const routePathJson = JSON.stringify(routePath)

    // Save initial tracking info immediately to ensure frontend can see it
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
        // Update status to signed
        try {
          await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['signed', id])
        } catch (e) {
          console.error('Failed to update order status to signed', e)
        }
      },
      routePath,
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

app.post('/api/orders/batch-ship-optimized', async (req, res) => {
  const { orderIds, routePath, ruleId } = req.body
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json(respond(null, { code: 'BadRequest', message: '请选择订单' }))
  }
  if (!routePath || !Array.isArray(routePath) || routePath.length < 2) {
    return res.status(400).json(respond(null, { code: 'BadRequest', message: '缺少有效路径信息' }))
  }

  try {
    // Determine delivery promise based on rule
    let deliveryPromise = '智能规划'
    if (ruleId) {
      const [ruleRows] = await pool.query<RowDataPacket[]>('SELECT * FROM delivery_rules WHERE id = ?', [ruleId])
      if (ruleRows.length > 0) {
        // Use inter_province as the default promise text for now, or days
        deliveryPromise = ruleRows[0].inter_province || ruleRows[0].days || '3-5天'
      }
    }

    // 1. Update all orders to 'in_transit'
    const placeholders = orderIds.map(() => '?').join(',')
    await pool.query(
      `UPDATE orders SET status = ? WHERE id IN (${placeholders})`, 
      ['in_transit', ...orderIds]
    )

    // 2. Fetch orders to get their destination coordinates
    const [orders] = await pool.query<RowDataPacket[]>(
      `SELECT id, address_lat, address_lng FROM orders WHERE id IN (${placeholders})`,
      orderIds
    )

    // 3. Start Batch Simulation
    // We need to map each order to a "drop-off index" on the routePath
    // Find the point in routePath closest to each order's destination
    const orderDropOffIndices = new Map<string, number>()
    
    orders.forEach((order: any) => {
      let minDist = Infinity
      let closestIndex = -1
      
      routePath.forEach((point, index) => {
        // Simple Euclidean distance is enough for matching
        const d = Math.pow(point.lng - order.address_lng, 2) + Math.pow(point.lat - order.address_lat, 2)
        if (d < minDist) {
          minDist = d
          closestIndex = index
        }
      })
      orderDropOffIndices.set(order.id, closestIndex)
    })

    // Start simulation for each order, but they share the same "Truck" timeline
    // Ideally, we should have a "TruckManager", but to fit existing architecture,
    // we spawn a simulation for each order, but give them the SAME route path (truncated).
    
    // For Order A (dropped at index 50): Route = routePath.slice(0, 51)
    // For Order B (dropped at index 100): Route = routePath.slice(0, 101)
    // This ensures they travel together until drop-off.

    for (const order of orders) {
      const dropOffIndex = orderDropOffIndices.get(order.id) || routePath.length - 1
      // Create a specific route for this order: From Start -> ... -> DropOff
      // We add a small buffer to ensure it reaches the destination visually
      const orderRoute = routePath.slice(0, dropOffIndex + 1)
      
      // If route is too short (e.g. start point), add end point
      if (orderRoute.length < 2) orderRoute.push(routePath[dropOffIndex])

      const orderRouteJson = JSON.stringify(orderRoute)

      startSimulation(
        order.id,
        io,
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
        orderRoute, // Pass the truncated route!
        async (statusState) => {
            try {
              await pool.query('UPDATE orders SET status = ? WHERE id = ?', [statusState.status, statusState.orderId])
            } catch (e) { console.error(e) }
        },
        undefined,
        deliveryPromise // Use the real rule promise
      )
    }

    res.json(respond({ shipped: orderIds.length }))
  } catch (error) {
    console.error(error)
    res.status(500).json(respond(null, { code: 'InternalError', message: '智能发货失败' }))
  }
})

app.post('/api/orders/batch-ship', async (req, res) => {
  const { orderIds, ruleId } = req.body
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json(respond(null, { code: 'BadRequest', message: '请选择订单' }))
  }

  try {
    const results = []
    for (const id of orderIds) {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM orders WHERE id = ?', [id])
      if (rows.length > 0 && rows[0].status === 'pending') {
        // Determine delivery promise (simplified for batch)
        let deliveryPromise = '3-5天'
        if (ruleId) {
          const [ruleRows] = await pool.query<RowDataPacket[]>('SELECT * FROM delivery_rules WHERE id = ?', [ruleId])
          if (ruleRows.length > 0) deliveryPromise = ruleRows[0].inter_province || '3-5天'
        }

        await pool.query(
          'UPDATE orders SET status = ? WHERE id = ?', 
          ['in_transit', id]
        )
        
        // Plan Route
        const sender = { lat: rows[0].sender_lat, lng: rows[0].sender_lng }
        const recipient = { lat: rows[0].address_lat, lng: rows[0].address_lng }
        const routePath = await getDrivingPath(sender, recipient)
        const routePathJson = JSON.stringify(routePath)

        startSimulation(
          id,
          io,
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
          routePath,
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

app.get('/api/orders/:id/tracking', async (req, res) => {
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
    
    // Fetch recent history from DB
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

// Resume active simulations on startup
async function resumeSimulations() {
  console.log('Checking for active simulations to resume...')
  try {
    const [orders] = await pool.query<RowDataPacket[]>('SELECT * FROM orders WHERE status IN (?, ?)', ['in_transit', 'out_for_delivery'])
    
    for (const order of orders) {
      const [tracks] = await pool.query<RowDataPacket[]>('SELECT * FROM order_tracking WHERE order_id = ?', [order.id])
      if (tracks.length > 0) {
        const track = tracks[0]
        // Parse route path safely
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
          routePath,
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

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
  console.log(`WebSocket path ${WS_PATH}`)
})
