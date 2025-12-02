import { Router } from 'express'
import userController from '../controllers/userController'
import { authenticateToken, requireRole } from '../middleware/auth'

const router = Router()

// GET /api/users/search - 搜索用户（商家专用）
router.get('/search', authenticateToken, requireRole('merchant'), (req, res) =>
  userController.searchUsers(req, res)
)

export default router
