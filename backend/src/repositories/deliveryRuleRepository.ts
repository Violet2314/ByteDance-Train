import pool from '../db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

/**
 * 配送规则数据访问层
 */
export class DeliveryRuleRepository {
  /**
   * 获取商家的配送规则列表
   */
  async findByMerchantId(merchantId: number): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM delivery_rules WHERE merchant_id = ? ORDER BY created_at DESC',
      [merchantId]
    )
    return rows.map((r: any) => ({
      id: r.id,
      company: r.company,
      days: r.days,
      intraCity: r.intra_city,
      inProvince: r.in_province,
      interProvince: r.inter_province,
      remote: r.remote,
      area: r.area,
      color: 'blue', // 默认颜色
      isEnabled: true, // 默认启用
      path: typeof r.path === 'string' ? JSON.parse(r.path) : r.path
    }))
  }

  /**
   * 创建配送规则
   */
  async create(merchantId: number, data: any): Promise<number> {
    const pathStr = JSON.stringify(data.path || [])
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO delivery_rules 
      (merchant_id, company, days, intra_city, in_province, inter_province, remote, area, path) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        merchantId,
        data.company,
        data.days,
        data.intraCity,
        data.inProvince,
        data.interProvince,
        data.remote,
        data.area,
        pathStr
      ]
    )
    return result.insertId
  }

  /**
   * 更新配送规则
   */
  async update(id: number, merchantId: number, data: any): Promise<boolean> {
    try {
      // 构建动态SQL，只更新提供的字段
      const updates: string[] = []
      const values: any[] = []

      if (data.company !== undefined) {
        updates.push('company = ?')
        values.push(data.company)
      }
      if (data.days !== undefined) {
        updates.push('days = ?')
        values.push(data.days)
      }
      if (data.intraCity !== undefined) {
        updates.push('intra_city = ?')
        values.push(data.intraCity)
      }
      if (data.inProvince !== undefined) {
        updates.push('in_province = ?')
        values.push(data.inProvince)
      }
      if (data.interProvince !== undefined) {
        updates.push('inter_province = ?')
        values.push(data.interProvince)
      }
      if (data.remote !== undefined) {
        updates.push('remote = ?')
        values.push(data.remote)
      }
      if (data.area !== undefined) {
        updates.push('area = ?')
        const areaValue = typeof data.area === 'object' && data.area !== null 
          ? JSON.stringify(data.area) 
          : (data.area || '')
        values.push(areaValue)
      }
      if (data.path !== undefined) {
        updates.push('path = ?')
        values.push(JSON.stringify(data.path || []))
      }

      if (updates.length === 0) {
        return false // 没有字段需要更新
      }

      values.push(id, merchantId)

      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE delivery_rules SET ${updates.join(', ')} WHERE id = ? AND merchant_id = ?`,
        values
      )
      return result.affectedRows > 0
    } catch (error) {
      console.error('Update delivery rule error:', error)
      console.error('Data received:', JSON.stringify(data, null, 2))
      throw error
    }
  }

  /**
   * 删除配送规则
   */
  async delete(id: number, merchantId: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM delivery_rules WHERE id = ? AND merchant_id = ?',
      [id, merchantId]
    )
    return result.affectedRows > 0
  }

  /**
   * 根据 ID 查找规则
   */
  async findById(id: number): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM delivery_rules WHERE id = ?',
      [id]
    )
    if (rows.length === 0) return null
    
    const r = rows[0]
    return {
      id: r.id,
      company: r.company,
      days: r.days,
      path: typeof r.path === 'string' ? JSON.parse(r.path) : r.path
    }
  }
}

export default new DeliveryRuleRepository()
