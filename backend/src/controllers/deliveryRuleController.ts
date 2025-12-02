import { Response } from 'express'
import deliveryRuleService from '../services/deliveryRuleService'
import { respond } from '../utils/response'
import { AuthRequest } from '../middleware/auth'

/**
 * 配送规则控制器
 */
export class DeliveryRuleController {
  /**
   * 获取配送规则
   */
  async getRules(req: AuthRequest, res: Response) {
    const user = req.user!
    const merchantId = Number(user.id)

    try {
      const rules = await deliveryRuleService.getRules(merchantId)
      res.json(respond(rules))
    } catch (error) {
      console.error(error)
      res.status(500).json(respond(null, { code: 'InternalError', message: '获取规则失败' }))
    }
  }

  /**
   * 创建配送规则
   */
  async createRule(req: AuthRequest, res: Response) {
    const user = req.user!
    const merchantId = Number(user.id)
    const body = req.body

    try {
      const rule = await deliveryRuleService.createRule(merchantId, body)
      res.json(respond(rule))
    } catch (error) {
      console.error(error)
      res.status(500).json(respond(null, { code: 'InternalError', message: '创建规则失败' }))
    }
  }

  /**
   * 更新配送规则
   */
  async updateRule(req: AuthRequest, res: Response) {
    const user = req.user!
    const merchantId = Number(user.id)
    const { id } = req.params
    const body = req.body

    try {
      const result = await deliveryRuleService.updateRule(Number(id), merchantId, body)
      res.json(respond(result))
    } catch (error) {
      console.error(error)
      res.status(500).json(respond(null, { code: 'InternalError', message: '更新规则失败' }))
    }
  }

  /**
   * 删除配送规则
   */
  async deleteRule(req: AuthRequest, res: Response) {
    const user = req.user!
    const merchantId = Number(user.id)
    const { id } = req.params

    try {
      const result = await deliveryRuleService.deleteRule(Number(id), merchantId)
      res.json(respond(result))
    } catch (error) {
      console.error(error)
      res.status(500).json(respond(null, { code: 'InternalError', message: '删除规则失败' }))
    }
  }
}

export default new DeliveryRuleController()
