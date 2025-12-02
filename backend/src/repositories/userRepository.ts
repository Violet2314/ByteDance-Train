import pool from '../db'
import { RowDataPacket } from 'mysql2'

/**
 * 用户数据访问层
 */
export class UserRepository {
  /**
   * 根据用户名和密码查找用户
   */
  async findByCredentials(username: string, password: string): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    )
    return rows.length > 0 ? rows[0] : null
  }

  /**
   * 搜索用户（模糊查询）
   */
  async searchUsers(query: string, limit: number = 10): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, real_name, phone FROM users WHERE (username LIKE ? OR real_name LIKE ? OR phone LIKE ?) LIMIT ?',
      [`%${query}%`, `%${query}%`, `%${query}%`, limit]
    )
    return rows
  }

  /**
   * 根据 ID 查找用户
   */
  async findById(id: number): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, real_name, phone FROM users WHERE id = ?',
      [id]
    )
    return rows.length > 0 ? rows[0] : null
  }
}

export default new UserRepository()
