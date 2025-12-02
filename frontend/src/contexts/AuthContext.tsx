import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// 定义用户类型
interface User {
  id: string
  username: string
  role: 'user' | 'merchant'
  name?: string
  token: string // JWT Token
}

// 定义 Context 的形状
interface AuthContextType {
  user: User | null // 当前登录的用户信息
  token: string | null // JWT Token
  isAuthenticated: boolean // 是否已登录
  isLoading: boolean // 是否正在加载认证状态
  login: (user: User) => void // 登录函数
  logout: () => void // 登出函数
}

// 创建 Context，初始值为 undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// AuthProvider 组件：包裹整个应用，提供认证状态
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初始化时从 localStorage 读取用户信息和 token
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')

    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser)
        setUser({ ...userData, token: storedToken })
      } catch (error) {
        console.error('Failed to parse user from localStorage', error)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    setIsLoading(false)
  }, [])

  // 登录逻辑：更新状态并写入 localStorage
  const login = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', userData.token) // 单独存储 token
  }

  // 登出逻辑：清除状态和 localStorage
  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token: user?.token || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// 自定义 Hook：方便子组件获取 AuthContext
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
