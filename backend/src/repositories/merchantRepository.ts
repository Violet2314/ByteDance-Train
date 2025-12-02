import pool from '../db'
import { RowDataPacket } from 'mysql2'

/**
 * 商家数据访问层
 */
export class MerchantRepository {
  /**
   * 根据用户名和密码查找商家
   */
  async findByCredentials(username: string, password: string): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM merchants WHERE username = ? AND password = ?',
      [username, password]
    )
    return rows.length > 0 ? rows[0] : null
  }

  /**
   * 根据 ID 查找商家
   */
  async findById(id: number): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, shop_name FROM merchants WHERE id = ?',
      [id]
    )
    return rows.length > 0 ? rows[0] : null
  }
}

export default new MerchantRepository()
