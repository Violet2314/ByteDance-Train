import { Router } from 'express'
import addressBookController from '../controllers/addressBookController'
import { authenticateToken, requireRole } from '../middleware/auth'

const router = Router()

// GET /api/address-book - 获取地址簿
router.get('/', authenticateToken, requireRole('merchant'), (req, res) =>
  addressBookController.getAddresses(req as any, res)
)

// POST /api/address-book - 创建地址
router.post('/', authenticateToken, requireRole('merchant'), (req, res) =>
  addressBookController.createAddress(req as any, res)
)

// DELETE /api/address-book/:id - 删除地址
router.delete('/:id', authenticateToken, requireRole('merchant'), (req, res) =>
  addressBookController.deleteAddress(req as any, res)
)

export default router
