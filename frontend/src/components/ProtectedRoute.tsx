import { Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../contexts/AuthContext'

// 受保护路由组件：根据用户角色和登录状态进行访问控制
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'merchant' // 需要的角色
  requireAuth?: boolean // 是否需要登录（默认 true）
}

export function ProtectedRoute({
  children,
  requiredRole,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  // 正在加载认证状态时，显示loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    )
  }

  // 如果需要登录但未登录，跳转到登录页
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 如果指定了角色要求，但用户角色不匹配
  // 直接重定向到该用户角色对应的首页
  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'user') {
      return <Navigate to="/" replace />
    } else if (user?.role === 'merchant') {
      return <Navigate to="/" replace />
    }
  }

  // 通过所有检查，渲染子组件
  return <>{children}</>
}
