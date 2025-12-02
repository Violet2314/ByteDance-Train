import userRepository from '../repositories/userRepository'
import merchantRepository from '../repositories/merchantRepository'
import { generateToken } from '../middleware/auth'

/**
 * 认证服务层
 */
export class AuthService {
  /**
   * 用户登录
   */
  async login(username: string, password: string, role: 'user' | 'merchant') {
    let user = null
    let userRole: 'user' | 'merchant' = 'user'

    if (role === 'merchant') {
      user = await merchantRepository.findByCredentials(username, password)
      if (user) {
        userRole = 'merchant'
      }
    } else {
      user = await userRepository.findByCredentials(username, password)
      if (user) {
        userRole = 'user'
      }
    }

    if (!user) {
      return null
    }

    // 生成 JWT Token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: userRole
    })

    return {
      id: user.id,
      username: user.username,
      role: userRole,
      name: userRole === 'merchant' ? user.shop_name : user.real_name,
      token
    }
  }
}

export default new AuthService()
