import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'logistics-platform-secret-key-2024'

/**
 * 扩展 Express Request 接口，添加用户信息
 */
export interface AuthRequest extends Request {
  user?: {
    id: string
    username: string
    role: 'user' | 'merchant'
  }
}

/**
 * JWT Token 验证中间件
 * 从 Authorization header 中提取 token 并验证
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      data: null, 
      error: { code: 'Unauthorized', message: '缺少身份验证令牌' } 
    })
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        data: null, 
        error: { code: 'Forbidden', message: '无效的身份验证令牌' } 
      })
    }

    // 将用户信息添加到请求对象
    (req as AuthRequest).user = decoded as any
    next()
  })
}

/**
 * 可选的 Token 验证中间件
 * 如果有 token 则验证，没有也不报错
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return next()
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err) {
      (req as AuthRequest).user = decoded as any
    }
    next()
  })
}

/**
 * 角色验证中间件
 * 验证用户是否具有指定角色
 */
export function requireRole(role: 'user' | 'merchant') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user

    if (!user) {
      return res.status(401).json({ 
        data: null, 
        error: { code: 'Unauthorized', message: '需要身份验证' } 
      })
    }

    if (user.role !== role) {
      return res.status(403).json({ 
        data: null, 
        error: { code: 'Forbidden', message: `需要 ${role} 角色权限` } 
      })
    }

    next()
  }
}

/**
 * 生成 JWT Token
 */
export function generateToken(payload: { id: string; username: string; role: 'user' | 'merchant' }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }) // 7天有效期
}
