import { Response } from 'express'
import addressBookService from '../services/addressBookService'
import { respond } from '../utils/response'
import { AuthRequest } from '../middleware/auth'

/**
 * 地址簿控制器
 */
export class AddressBookController {
  /**
   * 获取地址簿
   */
  async getAddresses(req: AuthRequest, res: Response) {
    const user = req.user!
    const merchantId = Number(user.id)

    try {
      const addresses = await addressBookService.getAddresses(merchantId)
      res.json(respond(addresses))
    } catch (error) {
      console.error(error)
      res.status(500).json(respond(null, { code: 'InternalError', message: '获取地址簿失败' }))
    }
  }

  /**
   * 创建地址
   */
  async createAddress(req: AuthRequest, res: Response) {
    const user = req.user!
    const merchantId = Number(user.id)
    const body = req.body

    try {
      const address = await addressBookService.createAddress(merchantId, body)
      res.json(respond(address))
    } catch (error: any) {
      console.error(error)
      if (error.message === '请填写完整信息') {
        return res.status(400).json(respond(null, { code: 'BadRequest', message: error.message }))
      }
      res.status(500).json(respond(null, { code: 'InternalError', message: '创建地址失败' }))
    }
  }

  /**
   * 删除地址
   */
  async deleteAddress(req: AuthRequest, res: Response) {
    const user = req.user!
    const merchantId = Number(user.id)
    const { id } = req.params

    try {
      const result = await addressBookService.deleteAddress(Number(id), merchantId)
      res.json(respond(result))
    } catch (error) {
      console.error(error)
      res.status(500).json(respond(null, { code: 'InternalError', message: '删除地址失败' }))
    }
  }
}

export default new AddressBookController()
