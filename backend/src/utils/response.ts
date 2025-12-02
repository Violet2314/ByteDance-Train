/**
 * 统一响应格式
 */
export interface ApiResponse<T = any> {
  data: T | null
  error: {
    code: string
    message: string
  } | null
}

/**
 * 成功响应
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    error: null
  }
}

/**
 * 错误响应
 */
export function errorResponse(code: string, message: string): ApiResponse {
  return {
    data: null,
    error: {
      code,
      message
    }
  }
}

/**
 * 兼容旧代码的 respond 函数
 */
export function respond(data: any, error: any = null): ApiResponse {
  if (error) {
    return errorResponse(error.code || 'Error', error.message || '未知错误')
  }
  return successResponse(data)
}
