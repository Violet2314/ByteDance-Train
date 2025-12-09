import pool from '../db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import type { Order } from '@logistics/shared'

/**
 * 订单数据访问层
 */
export class OrderRepository {
  /**
   * 获取订单列表
   */
  async findAll(filters: {
    status?: string
    userId?: number
    sort?: string
    order?: string
  }): Promise<any[]> {
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
    
    if (filters.status) {
      conditions.push('o.status = ?')
      params.push(filters.status)
    }

    if (filters.userId) {
      conditions.push('o.user_id = ?')
      params.push(filters.userId)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    // 验证排序字段以防止 SQL 注入
    const allowedSorts = ['created_at', 'amount', 'id']
    const sortCol = allowedSorts.includes(filters.sort || '') ? `o.${filters.sort}` : 'o.created_at'
    const sortOrder = filters.order === 'desc' ? 'DESC' : 'ASC'
    
    query += ` ORDER BY ${sortCol} ${sortOrder}`
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params)
    
    return rows.map((r: any) => ({
      id: r.id,
      status: r.status,
      amount: Number(r.amount),
      createdAt: r.created_at,
      shippedAt: r.shipped_at,
      inTransitAt: r.in_transit_at,
      arrivedAtHubAt: r.arrived_at_hub_at,
      outForDeliveryAt: r.out_for_delivery_at,
      signedAt: r.signed_at,
      deliveryDays: r.delivery_days || '3天',
      lastTrackTime: r.tracking_ts,
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
  }

  /**
   * 获取商家的订单列表
   */
  async findByMerchant(filters: {
    merchantId: number
    status?: string
    sort?: string
    order?: string
  }): Promise<any[]> {
    let query = `
      SELECT o.*, 
             ot.shipped_at, 
             ot.delivery_days, 
             ot.ts as tracking_ts 
      FROM orders o
      LEFT JOIN order_tracking ot ON o.id = ot.order_id
      WHERE o.merchant_id = ?
    `
    const params: any[] = [filters.merchantId]
    
    if (filters.status) {
      query += ' AND o.status = ?'
      params.push(filters.status)
    }
    
    // 验证排序字段以防止 SQL 注入
    const allowedSorts = ['created_at', 'amount', 'id']
    const sortCol = allowedSorts.includes(filters.sort || '') ? `o.${filters.sort}` : 'o.created_at'
    const sortOrder = filters.order === 'desc' ? 'DESC' : 'ASC'
    
    query += ` ORDER BY ${sortCol} ${sortOrder}`
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params)
    
    return rows.map((r: any) => ({
      id: r.id,
      status: r.status,
      amount: Number(r.amount),
      createdAt: r.created_at,
      deliveryDays: r.delivery_days || '3天',
      shippedAt: r.shipped_at,
      lastTrackTime: r.tracking_ts,
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
  }

  /**
   * 创建订单
   */
  async create(data: {
    id: string
    merchantId: number
    userId: number | null
    sender: any
    recipient: any
    cargo: any
    amount: number
  }): Promise<string> {
    await pool.query(
      `INSERT INTO orders (
        id, merchant_id, user_id, status, amount,
        sender_name, sender_phone, sender_address, sender_lat, sender_lng,
        recipient_name, recipient_phone, address_text, address_lat, address_lng,
        item_name, weight, quantity
      ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.merchantId,
        data.userId,
        data.amount,
        data.sender.name || '',
        data.sender.phone || '',
        data.sender.address || '',
        data.sender.lat || 0,
        data.sender.lng || 0,
        data.recipient.name,
        data.recipient.phone,
        data.recipient.address,
        data.recipient.lat || 0,
        data.recipient.lng || 0,
        data.cargo?.name || '',
        data.cargo?.weight || 0,
        data.cargo?.quantity || 1
      ]
    )
    return data.id
  }

  /**
   * 根据 ID 查找订单
   */
  async findById(id: string): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.*, 
              ot.delivery_days,
              ot.ts as tracking_ts
       FROM orders o
       LEFT JOIN order_tracking ot ON o.id = ot.order_id
       WHERE o.id = ?`,
      [id]
    )

    if (rows.length === 0) return null

    const r = rows[0]
    return {
      id: r.id,
      status: r.status,
      amount: Number(r.amount),
      createdAt: r.created_at,
      shippedAt: r.shipped_at,
      inTransitAt: r.in_transit_at,
      arrivedAtHubAt: r.arrived_at_hub_at,
      outForDeliveryAt: r.out_for_delivery_at,
      signedAt: r.signed_at,
      deliveryDays: r.delivery_days || '3天',
      lastTrackTime: r.tracking_ts,
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
  }

  /**
   * 更新订单状态（同时记录状态变更时间）
   */
  async updateStatus(id: string, status: string): Promise<boolean> {
    // 根据状态确定要更新的时间字段
    let timeField = ''
    switch (status) {
      case 'in_transit':
        timeField = 'in_transit_at'
        break
      case 'arrived_at_hub':
        timeField = 'arrived_at_hub_at'
        break
      case 'out_for_delivery':
        timeField = 'out_for_delivery_at'
        break
      case 'signed':
        timeField = 'signed_at'
        break
      case 'picked':
        timeField = 'shipped_at' // 已揽收使用 shipped_at
        break
      default:
        // 其他状态（如 pending）不需要额外的时间字段
        break
    }

    let query = 'UPDATE orders SET status = ?'
    const params: any[] = [status]
    
    if (timeField) {
      query += `, ${timeField} = NOW()`
    }
    
    query += ' WHERE id = ?'
    params.push(id)

    const [result] = await pool.query<ResultSetHeader>(query, params)
    return result.affectedRows > 0
  }

  /**
   * 创建订单追踪记录
   */
  async createTracking(data: {
    orderId: string
    shippedAt: Date
    deliveryDays: string
    pathJson: string
  }): Promise<void> {
    await pool.query(
      `INSERT INTO order_tracking (
        order_id, shipped_at, delivery_days, route_path
      ) VALUES (?, ?, ?, ?)`,
      [
        data.orderId,
        data.shippedAt,
        data.deliveryDays,
        data.pathJson
      ]
    )
  }

  /**
   * 获取订单追踪信息
   */
  async findTracking(orderId: string): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM order_tracking WHERE order_id = ? ORDER BY ts DESC LIMIT 1`,
      [orderId]
    )
    
    if (rows.length === 0) return null
    
    const r = rows[0]
    return {
      orderId: r.order_id,
      lat: r.lat,
      lng: r.lng,
      shippedAt: r.shipped_at,
      deliveryDays: r.delivery_days,
      path: typeof r.route_path === 'string' ? JSON.parse(r.route_path) : r.route_path,
      ts: r.ts
    }
  }

  /**
   * 批量查询订单
   */
  async findByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return []
    
    const placeholders = ids.map(() => '?').join(',')
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM orders WHERE id IN (${placeholders})`,
      ids
    )
    
    return rows
  }
}

export default new OrderRepository()
