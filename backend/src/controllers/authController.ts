import { Request, Response } from 'express'
import authService from '../services/authService'
import { respond } from '../utils/response'

/**
 * 认证控制器
 */
export class AuthController {
  /**
   * 登录
   */
  async login(req: Request, res: Response) {
    const { username, password, role } = req.body
    if (process.env.NODE_ENV !== 'production') {
      console.log('Login attempt:', { username, password, role });
    }

    try {
      const result = await authService.login(username, password, role)

      if (!result) {
        return res.status(401).json(respond(null, { code: 'Unauthorized', message: '用户名或密码错误' }))
      }

      return res.json(respond(result))
    } catch (error) {
      console.error(error)
      return res.status(500).json(respond(null, { code: 'InternalError', message: '数据库错误' }))
    }
  }
}

export default new AuthController()
