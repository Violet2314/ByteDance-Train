import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Package, LayoutDashboard, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const useNavbar = (role: 'guest' | 'user' | 'merchant' = 'guest') => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 监听滚动事件，控制导航栏样式
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 退出登录处理：清除 token 和用户信息，跳转到登录页
  const handleLogout = () => {
    logout() // 调用 AuthContext 的 logout
    navigate('/login', { replace: true })
  }

  // 导航链接配置
  const navLinks: Record<string, Array<{ name: string; path: string; icon?: React.ReactNode }>> = {
    guest: [
      { name: '首页', path: '/' },
      { name: '解决方案', path: '/#solutions' },
      { name: '关于我们', path: '/#about' },
      { name: '区域热力图', path: '/heatmap' },
    ],
    user: [
      { name: '首页', path: '/' },
      { name: '包裹查询', path: '/tracking', icon: <Package size={18} /> },
      { name: '我的订单', path: '/tracking/orders', icon: <LayoutDashboard size={18} /> },
    ],
    merchant: [
      { name: '首页', path: '/' },
      { name: '订单管理', path: '/merchant', icon: <LayoutDashboard size={18} /> },
      { name: '配送管理', path: '/merchant/delivery', icon: <Package size={18} /> },
      { name: '智能规划', path: '/merchant/route-planning', icon: <Package size={18} /> },
      { name: '数据看板', path: '/merchant/dashboard', icon: <BarChart3 size={18} /> },
    ],
  }

  const currentLinks = navLinks[role] || navLinks.guest

  // 处理链接点击，支持锚点跳转
  const handleLinkClick = (path: string) => {
    setMobileMenuOpen(false)
    if (path.startsWith('/#')) {
      const hash = path.substring(1)
      if (location.pathname === '/') {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
    } else if (path === '/' && location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return {
    scrolled,
    mobileMenuOpen,
    setMobileMenuOpen,
    handleLogout,
    currentLinks,
    handleLinkClick,
  }
}
