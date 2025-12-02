import { Request, Response } from 'express'
import { respond } from '../utils/response'

/**
 * 地理编码控制器
 */
export class GeocodeController {
  /**
   * 地址解析（地理编码）
   */
  async getGeocode(req: Request, res: Response) {
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
  }
}

export default new GeocodeController()
