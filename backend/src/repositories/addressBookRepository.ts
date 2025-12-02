import pool from '../db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

/**
 * 地址簿数据访问层
 */
export class AddressBookRepository {
  /**
   * 获取商家的地址簿列表
   */
  async findByMerchantId(merchantId: number): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM address_book WHERE merchant_id = ? ORDER BY created_at DESC',
      [merchantId]
    )
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      contactName: r.contact_name,
      contactPhone: r.contact_phone,
      address: r.address_text,
      lat: r.lat,
      lng: r.lng
    }))
  }

  /**
   * 创建地址
   */
  async create(data: {
    merchantId: number
    name: string
    contactName: string
    contactPhone: string
    address: string
    lat?: number
    lng?: number
  }): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO address_book (merchant_id, name, contact_name, contact_phone, address_text, lat, lng) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.merchantId, data.name, data.contactName, data.contactPhone, data.address, data.lat || null, data.lng || null]
    )
    return result.insertId
  }

  /**
   * 删除地址
   */
  async delete(id: number, merchantId: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM address_book WHERE id = ? AND merchant_id = ?',
      [id, merchantId]
    )
    return result.affectedRows > 0
  }
}

export default new AddressBookRepository()
