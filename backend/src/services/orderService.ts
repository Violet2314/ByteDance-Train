import orderRepository from '../repositories/orderRepository'
import deliveryRuleRepository from '../repositories/deliveryRuleRepository'
import { getDrivingPath } from './amap'
import { isPointInPolygon } from '../utils/geo'
import { startSimulation } from './simulator'
import type { Server } from 'socket.io'
import pool from '../db'

/**
 * 订单服务层
 */
export class OrderService {
  /**
   * 获取订单列表
   */
  async getOrders(filters: {
    status?: string
    userId?: number
    sort?: string
    order?: string
  }) {
    return await orderRepository.findAll(filters)
  }

  /**
   * 获取商家的订单列表
   */
  async getOrdersByMerchant(filters: {
    merchantId: number
    status?: string
    sort?: string
    order?: string
  }) {
    return await orderRepository.findByMerchant(filters)
  }

  /**
   * 创建订单
   */
  async createOrder(data: {
    merchantId: number
    userId: number | null
    sender: any
    recipient: any
    cargo: any
    amount: number
  }) {
    // 验证收件人信息
    if (!data.recipient || !data.recipient.name || !data.recipient.phone || !data.recipient.address) {
      throw new Error('缺少收件人信息')
    }

    // 验证发货人坐标
    if (!data.sender || !data.sender.lat || !data.sender.lng) {
      throw new Error('缺少发货人地址坐标')
    }

    // 生成订单 ID
    const orderId = `O${Date.now().toString().slice(-11)}`

    await orderRepository.create({
      id: orderId,
      merchantId: data.merchantId,
      userId: data.userId,
      sender: data.sender,
      recipient: data.recipient,
      cargo: data.cargo,
      amount: data.amount
    })

    return await orderRepository.findById(orderId)
  }

  /**
   * 获取订单详情
   */
  async getOrderById(id: string) {
    const order = await orderRepository.findById(id)
    if (!order) {
      throw new Error('订单不存在')
    }
    return order
  }

  /**
   * 发货
   */
  async shipOrder(orderId: string, ruleId: number | undefined, io: Server) {
    const order = await orderRepository.findById(orderId)
    if (!order) {
      throw new Error('订单不存在')
    }

    if (order.status !== 'pending') {
      throw new Error('订单不可发货')
    }

    // 确定配送时效
    let deliveryPromise = '3-5天'
    let deliveryCompany = '默认快递'
    
    if (ruleId) {
      const rule = await deliveryRuleRepository.findById(ruleId)
      if (rule) {
        // 验证发货地和收货地是否在规则区域内
        if (Array.isArray(rule.path) && rule.path.length > 0) {
          const senderPoint: [number, number] = [order.sender.lng, order.sender.lat]
          const recipientPoint: [number, number] = [order.address.lng, order.address.lat]
          
          const isSenderIn = isPointInPolygon(senderPoint, rule.path)
          const isRecipientIn = isPointInPolygon(recipientPoint, rule.path)
          
          if (!isSenderIn || !isRecipientIn) {
            throw new Error(
              `该配送规则不覆盖${!isSenderIn ? '发货地' : ''}${!isSenderIn && !isRecipientIn ? '和' : ''}${!isRecipientIn ? '收货地' : ''}`
            )
          }
        }

        deliveryPromise = rule.days || '3-5天'
        deliveryCompany = rule.company || '默认快递'
      }
    }

    // 更新订单状态
    await orderRepository.updateStatus(orderId, 'in_transit')

    if (process.env.NODE_ENV !== 'production') {
      console.log(`Shipping order ${orderId} with rule ${ruleId}, promise: ${deliveryPromise}`);
    }

    // 规划路线
    const sender = { lat: order.sender.lat, lng: order.sender.lng }
    const recipient = { lat: order.address.lat, lng: order.address.lng }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Ship] Planning route for Order ${orderId} from ${sender.lat},${sender.lng} to ${recipient.lat},${recipient.lng}`);
    }

    const routePath = await getDrivingPath(sender, recipient)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Ship] Route planned with ${routePath.length} points`);
    }

    const routePathJson = JSON.stringify(routePath)

    // 保存初始追踪信息
    try {
      await pool.query(
        `INSERT INTO order_tracking (
          order_id, lat, lng, ts, shipped_at, delivery_days, route_path
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?)
        ON DUPLICATE KEY UPDATE 
          lat = VALUES(lat), 
          lng = VALUES(lng), 
          ts = VALUES(ts), 
          route_path = VALUES(route_path)`,
        [orderId, sender.lat, sender.lng, Date.now(), deliveryPromise, routePathJson]
      )
    } catch (e) {
      console.error('Failed to save initial track point', e)
    }

    // 启动模拟
    startSimulation(
      orderId,
      io,
      routePath,
      async (point) => {
        // 保存轨迹点
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
        // 更新为已签收
        try {
          await orderRepository.updateStatus(orderId, 'signed')
        } catch (e) {
          console.error('Failed to update order status to signed', e)
        }
      },
      async (statusState) => {
        io.emit('order:status', { ...statusState, orderId })
      }
    )

    return { ok: true }
  }

  /**
   * 获取订单追踪信息
   */
  async getOrderTracking(orderId: string) {
    const tracking = await orderRepository.findTracking(orderId)
    if (!tracking) {
      throw new Error('暂无物流信息')
    }
    return tracking
  }

  /**
   * 批量发货（优化版）
   */
  async batchShipOptimized(orderIds: string[], ruleId: number | undefined, io: Server) {
    const results: any[] = []

    for (const orderId of orderIds) {
      try {
        await this.shipOrder(orderId, ruleId, io)
        results.push({ orderId, success: true })
      } catch (error: any) {
        results.push({ orderId, success: false, error: error.message })
      }
    }

    return results
  }

  /**
   * 批量发货（普通版）
   */
  async batchShip(orderIds: string[], ruleId: number | undefined, io: Server) {
    return await this.batchShipOptimized(orderIds, ruleId, io)
  }
}

export default new OrderService()
