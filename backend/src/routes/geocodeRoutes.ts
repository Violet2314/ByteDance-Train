import { Router } from 'express'
import geocodeController from '../controllers/geocodeController'

const router = Router()

// GET /api/geocode - 地址解析
router.get('/', (req, res) => geocodeController.getGeocode(req, res))

export default router
