import { Router } from 'express'
import authController from '../controllers/authController'

const router = Router()

// POST /api/login - 用户登录
router.post('/login', (req, res) => authController.login(req, res))

export default router
