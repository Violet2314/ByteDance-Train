import deliveryRuleRepository from '../repositories/deliveryRuleRepository'

/**
 * 配送规则服务层
 */
export class DeliveryRuleService {
  /**
   * 获取商家的配送规则
   */
  async getRules(merchantId: number) {
    return await deliveryRuleRepository.findByMerchantId(merchantId)
  }

  /**
   * 创建配送规则
   */
  async createRule(merchantId: number, data: any) {
    const id = await deliveryRuleRepository.create(merchantId, data)
    return {
      id,
      ...data
    }
  }

  /**
   * 更新配送规则
   */
  async updateRule(id: number, merchantId: number, data: any) {
    const success = await deliveryRuleRepository.update(id, merchantId, data)
    if (!success) {
      throw new Error('更新失败或规则不存在')
    }
    return { ok: true }
  }

  /**
   * 删除配送规则
   */
  async deleteRule(id: number, merchantId: number) {
    const success = await deliveryRuleRepository.delete(id, merchantId)
    if (!success) {
      throw new Error('删除失败或规则不存在')
    }
    return { ok: true }
  }
}

export default new DeliveryRuleService()
