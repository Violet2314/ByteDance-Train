import { Request, Response, NextFunction } from 'express'
import { BadRequestError } from './errorHandler'

/**
 * 验证规则类型
 */
type ValidationRule = {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

/**
 * 请求体验证中间件工厂函数
 */
export function validateBody(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = []

    for (const rule of rules) {
      const value = req.body[rule.field]

      // 必填验证
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} 是必填字段`)
        continue
      }

      // 如果字段非必填且为空，跳过后续验证
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue
      }

      // 类型验证
      if (rule.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value
        if (actualType !== rule.type) {
          errors.push(`${rule.field} 必须是 ${rule.type} 类型`)
          continue
        }
      }

      // 字符串长度验证
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} 最小长度为 ${rule.minLength}`)
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} 最大长度为 ${rule.maxLength}`)
        }
      }

      // 数字范围验证
      if (rule.type === 'number' && typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${rule.field} 最小值为 ${rule.min}`)
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${rule.field} 最大值为 ${rule.max}`)
        }
      }

      // 正则表达式验证
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push(`${rule.field} 格式不正确`)
        }
      }

      // 自定义验证
      if (rule.custom) {
        const result = rule.custom(value)
        if (result !== true) {
          errors.push(typeof result === 'string' ? result : `${rule.field} 验证失败`)
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestError(errors.join('; '))
    }

    next()
  }
}

/**
 * 常用验证规则
 */
export const ValidationRules = {
  // 手机号验证（中国）
  phone: (field: string) => ({
    field,
    type: 'string' as const,
    pattern: /^1[3-9]\d{9}$/,
  }),

  // 邮箱验证
  email: (field: string) => ({
    field,
    type: 'string' as const,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  }),

  // 必填字符串
  requiredString: (field: string, minLength?: number, maxLength?: number) => ({
    field,
    required: true,
    type: 'string' as const,
    minLength,
    maxLength,
  }),

  // 必填数字
  requiredNumber: (field: string, min?: number, max?: number) => ({
    field,
    required: true,
    type: 'number' as const,
    min,
    max,
  }),

  // 经纬度验证
  latitude: (field: string) => ({
    field,
    type: 'number' as const,
    min: -90,
    max: 90,
  }),

  longitude: (field: string) => ({
    field,
    type: 'number' as const,
    min: -180,
    max: 180,
  }),
}
