import { Router } from 'express'
import deliveryRuleController from '../controllers/deliveryRuleController'
import { authenticateToken, requireRole } from '../middleware/auth'

const router = Router()

// GET /api/delivery-rules - 获取配送规则
router.get('/', authenticateToken, requireRole('merchant'), (req, res) =>
  deliveryRuleController.getRules(req as any, res)
)

// POST /api/delivery-rules - 创建配送规则
router.post('/', authenticateToken, requireRole('merchant'), (req, res) =>
  deliveryRuleController.createRule(req as any, res)
)

// PUT /api/delivery-rules/:id - 更新配送规则
router.put('/:id', authenticateToken, requireRole('merchant'), (req, res) =>
  deliveryRuleController.updateRule(req as any, res)
)

// DELETE /api/delivery-rules/:id - 删除配送规则
router.delete('/:id', authenticateToken, requireRole('merchant'), (req, res) =>
  deliveryRuleController.deleteRule(req as any, res)
)

export default router
