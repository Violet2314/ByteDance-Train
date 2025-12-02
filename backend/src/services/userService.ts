import userRepository from '../repositories/userRepository'

/**
 * 用户服务层
 */
export class UserService {
  /**
   * 搜索用户
   */
  async searchUsers(query: string, limit: number = 10) {
    if (!query || query.trim().length === 0) {
      return []
    }
    return await userRepository.searchUsers(query, limit)
  }
}

export default new UserService()
