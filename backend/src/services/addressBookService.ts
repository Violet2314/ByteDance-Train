import addressBookRepository from '../repositories/addressBookRepository'

/**
 * 地址簿服务层
 */
export class AddressBookService {
  /**
   * 获取商家的地址簿
   */
  async getAddresses(merchantId: number) {
    return await addressBookRepository.findByMerchantId(merchantId)
  }

  /**
   * 创建地址
   */
  async createAddress(merchantId: number, data: {
    name: string
    contactName: string
    contactPhone: string
    address: string
    lat?: number
    lng?: number
  }) {
    // 验证必填字段
    if (!data.name || !data.contactName || !data.contactPhone || !data.address) {
      throw new Error('请填写完整信息')
    }

    const id = await addressBookRepository.create({
      merchantId,
      ...data
    })

    return {
      id,
      ...data
    }
  }

  /**
   * 删除地址
   */
  async deleteAddress(id: number, merchantId: number) {
    const success = await addressBookRepository.delete(id, merchantId)
    if (!success) {
      throw new Error('删除失败或地址不存在')
    }
    return { ok: true }
  }
}

export default new AddressBookService()
