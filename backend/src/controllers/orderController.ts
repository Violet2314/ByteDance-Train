import { Response } from 'express'
import orderService from '../services/orderService'
import { respond } from '../utils/response'
import { AuthRequest } from '../middleware/auth'
import type { Server } from 'socket.io'

/**
 * 订单控制器
 */
export class OrderController {
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  /**
   * 获取所有订单（公开接口）
   * 注意：此接口为公开接口，仅用于热力图等数据展示，始终返回所有订单
   */
  async getAllOrders(req: AuthRequest, res: Response) {
    const { status, sort = 'created_at', order = 'asc' } = req.query as any

    try {
      const orders = await orderService.getOrders({
        status,
        userId: undefined, // 不过滤用户，返回所有订单
        sort,
        order
      })
      res.json(respond(orders))
    } catch (error) {
      console.error(error)
      res.status(500).json(respond(null, { code: 'InternalError', message: '获取订单失败' }))
    }
  }

  /**
   * 获取当前用户的订单（需要认证）
   * 商家只能看到自己创建的订单，用户只能看到自己的订单
   */
  async getMyOrders(req: AuthRequest, res: Response) {
    const user = req.user!
    const { status, sort = 'created_at', order = 'asc' } = req.query as any

    if (process.env.NODE_ENV !== 'production') {
      console.log('[getMyOrders] User:', user)
    }

    try {
      let userId: number | undefined
      
      // 商家：查询merchant_id
      if (user.role === 'merchant') {
        // 需要修改service支持merchantId过滤
        const orders = await orderService.getOrdersByMerchant({
          merchantId: Number(user.id),
          status,
          sort,
          order
        })
        if (process.env.NODE_ENV !== 'production') {
          console.log('[getMyOrders] Merchant orders count:', orders.length)
        }
        return res.json(respond(orders))
      }
      
      // 用户：查询user_id
      if (user.role === 'user') {
        userId = Number(user.id)
        if (process.env.NODE_ENV !== 'production') {
          console.log('[getMyOrders] User ID:', userId)
        }
      }
      
      const orders = await orderService.getOrders({
        status,
        userId,
        sort,
        order
      })
      if (process.env.NODE_ENV !== 'production') {
        console.log('[getMyOrders] User orders count:', orders.length)
      }
      res.json(respond(orders))
    } catch (error) {
      console.error(error)
      res.status(500).json(respond(null, { code: 'InternalError', message: '获取订单失败' }))
    }
  }

  /**
   * 创建订单
   */
  async createOrder(req: AuthRequest, res: Response) {
    const user = req.user!
    const merchantId = Number(user.id)
    const body = req.body

    try {
      const order = await orderService.createOrder({
        merchantId,
        userId: body.userId || null,
        sender: body.sender,
        recipient: body.recipient,
        cargo: body.cargo,
        amount: body.amount || 0
      })
      res.json(respond(order))
    } catch (error: any) {
      console.error(error)
      if (error.message.includes('缺少')) {
        return res.status(400).json(respond(null, { code: 'BadRequest', message: error.message }))
      }
      res.status(500).json(respond(null, { code: 'InternalError', message: '创建订单失败' }))
    }
  }

  /**
   * 获取订单详情
   */
  async getOrderById(req: AuthRequest, res: Response) {
    const { id } = req.params

    try {
      const order = await orderService.getOrderById(id)
      res.json(respond(order))
    } catch (error: any) {
      console.error(error)
      if (error.message === '订单不存在') {
        return res.status(404).json(respond(null, { code: 'NotFound', message: error.message }))
      }
      res.status(500).json(respond(null, { code: 'InternalError', message: '获取订单失败' }))
    }
  }

  /**
   * 发货
   */
  async shipOrder(req: AuthRequest, res: Response) {
    const { id } = req.params
    const { ruleId } = req.body

    try {
      const result = await orderService.shipOrder(id, ruleId, this.io)
      res.json(respond(result))
    } catch (error: any) {
      console.error('Ship order error:', error.message)
      if (error.message === '订单不存在') {
        return res.status(404).json(respond(null, { code: 'NotFound', message: error.message }))
      }
      if (error.message === '订单不可发货' || error.message.includes('不覆盖')) {
        return res.status(400).json(respond(null, { code: 'BadRequest', message: error.message }))
      }
      res.status(500).json(respond(null, { code: 'InternalError', message: '发货失败' }))
    }
  }

  /**
   * 获取订单追踪信息
   */
  async getOrderTracking(req: AuthRequest, res: Response) {
    const { id } = req.params

    try {
      const tracking = await orderService.getOrderTracking(id)
      res.json(respond(tracking))
    } catch (error: any) {
      console.error(error)
      if (error.message === '暂无物流信息') {
        return res.status(404).json(respond(null, { code: 'NotFound', message: error.message }))
      }
      res.status(500).json(respond(null, { code: 'InternalError', message: '获取物流信息失败' }))
    }
  }

  /**
   * 批量发货
   */
  async batchShipOrders(req: AuthRequest, res: Response) {
    const { orderIds, ruleId } = req.body

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json(respond(null, { code: 'BadRequest', message: '无效的订单列表' }))
    }

    try {
      const results = await orderService.batchShipOrders(orderIds, ruleId, this.io)
      res.json(respond(results))
    } catch (error) {
      console.error(error)
      res.status(500).json(respond(null, { code: 'InternalError', message: '批量发货失败' }))
    }
  }
}

// 导出工厂函数
export const createOrderController = (io: Server) => new OrderController(io)
