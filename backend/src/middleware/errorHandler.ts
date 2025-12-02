import { Request, Response, NextFunction } from 'express'

/**
 * 自定义错误类基类
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * 常见错误类型
 */
export class BadRequestError extends AppError {
  constructor(message: string = '请求参数错误') {
    super(400, 'BadRequest', message)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问') {
    super(401, 'Unauthorized', message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '禁止访问') {
    super(403, 'Forbidden', message)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super(404, 'NotFound', message)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '数据冲突') {
    super(409, 'Conflict', message)
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = '服务器内部错误') {
    super(500, 'InternalError', message)
  }
}

/**
 * 统一错误处理中间件
 * 捕获所有错误并返回统一格式的响应
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('[Error]', err)

  // 自定义应用错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      data: null,
      error: {
        code: err.code,
        message: err.message
      }
    })
  }

  // MySQL 错误
  if ('code' in err) {
    const mysqlError = err as any
    
    // 重复键错误
    if (mysqlError.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        data: null,
        error: {
          code: 'Conflict',
          message: '数据已存在'
        }
      })
    }

    // 外键约束错误
    if (mysqlError.code === 'ER_NO_REFERENCED_ROW' || mysqlError.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({
        data: null,
        error: {
          code: 'BadRequest',
          message: '数据关联错误'
        }
      })
    }
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({
      data: null,
      error: {
        code: 'Forbidden',
        message: '无效的身份验证令牌'
      }
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      data: null,
      error: {
        code: 'Unauthorized',
        message: '身份验证令牌已过期'
      }
    })
  }

  // 默认 500 错误
  res.status(500).json({
    data: null,
    error: {
      code: 'InternalError',
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message
    }
  })
}

/**
 * 异步路由处理器包装器
 * 自动捕获异步函数中的错误并传递给错误处理中间件
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
