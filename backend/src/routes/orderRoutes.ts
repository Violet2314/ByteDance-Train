import { Router } from 'express'
import { createOrderController } from '../controllers/orderController'
import { authenticateToken, requireRole } from '../middleware/auth'
import type { Server } from 'socket.io'

// 导出工厂函数创建路由
export const createOrderRoutes = (io: Server) => {
  const router = Router()
  const orderController = createOrderController(io)

  // GET /api/orders - 获取订单列表（公开接口，仅用于热力图，返回所有订单）
  router.get('/', (req, res) =>
    orderController.getAllOrders(req as any, res)
  )

  // GET /api/orders/my - 获取当前用户的订单（需要认证，有权限控制）
  router.get('/my', authenticateToken, (req, res) =>
    orderController.getMyOrders(req as any, res)
  )

  // POST /api/orders - 创建订单
  router.post('/', authenticateToken, requireRole('merchant'), (req, res) =>
    orderController.createOrder(req as any, res)
  )

  // GET /api/orders/:id - 获取订单详情（公开接口，任何人可通过订单号查询）
  router.get('/:id', (req, res) =>
    orderController.getOrderById(req as any, res)
  )

  // POST /api/orders/:id/ship - 发货
  router.post('/:id/ship', authenticateToken, requireRole('merchant'), (req, res) =>
    orderController.shipOrder(req as any, res)
  )

  // GET /api/orders/:id/tracking - 获取订单追踪信息（公开接口，任何人可查询）
  router.get('/:id/tracking', (req, res) =>
    orderController.getOrderTracking(req as any, res)
  )

  // POST /api/orders/batch-ship-optimized - 批量发货（优化版）
  router.post('/batch-ship-optimized', authenticateToken, requireRole('merchant'), (req, res) =>
    orderController.batchShipOptimized(req as any, res)
  )

  // POST /api/orders/batch-ship - 批量发货
  router.post('/batch-ship', authenticateToken, requireRole('merchant'), (req, res) =>
    orderController.batchShip(req as any, res)
  )

  return router
}
