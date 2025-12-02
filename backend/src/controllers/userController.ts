import { Request, Response } from 'express'
import userService from '../services/userService'
import { respond } from '../utils/response'

/**
 * 用户控制器
 */
export class UserController {
  /**
   * 搜索用户
   */
  async searchUsers(req: Request, res: Response) {
    const { q } = req.query

    if (!q || typeof q !== 'string') {
      return res.json(respond([]))
    }

    try {
      const users = await userService.searchUsers(q)
      res.json(respond(users))
    } catch (error) {
      console.error(error)
      res.status(500).json(respond(null, { code: 'InternalError', message: '搜索用户失败' }))
    }
  }
}

export default new UserController()
