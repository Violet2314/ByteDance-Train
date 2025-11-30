import React from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, User, Menu, X, ChevronRight, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { useNavbar } from '../hooks/useNavbar'

type NavbarProps = {
  role?: 'guest' | 'user' | 'merchant'
  enableEntranceAnimation?: boolean
}

export default function Navbar({ role = 'guest', enableEntranceAnimation = true }: NavbarProps) {
  const {
    scrolled,
    mobileMenuOpen,
    setMobileMenuOpen,
    handleLogout,
    currentLinks,
    handleLinkClick,
  } = useNavbar(role)

  return (
    <>
      <motion.nav
        initial={enableEntranceAnimation ? { y: -100 } : { y: 0 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
          scrolled
            ? 'bg-white/80 backdrop-blur-md py-4 border-gray-200/50 shadow-sm'
            : 'bg-transparent py-6 border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo 区域 */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
            onClick={() => handleLinkClick('/')}
          >
            <div className="relative w-10 h-10 bg-[#0B0F19] rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#74B868]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Truck
                size={20}
                className="text-white relative z-10 group-hover:scale-110 transition-transform duration-300"
              />

              {/* 科技感装饰 */}
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#74B868] rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none text-[#0B0F19]">
                Logistics<span className="text-[#74B868]">Pro</span>
              </span>
              <span className="text-[10px] text-gray-400 tracking-[0.2em] uppercase leading-none mt-1 group-hover:text-[#74B868] transition-colors">
                System v2.0
              </span>
            </div>
          </Link>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-full border border-gray-200/50 backdrop-blur-sm">
              {currentLinks.map((link) => {
                const isActive = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => handleLinkClick(link.path)}
                    className={clsx(
                      'relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2',
                      isActive ? 'text-[#0B0F19]' : 'text-gray-500 hover:text-[#0B0F19]'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white rounded-full shadow-sm border border-gray-100"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {link.icon}
                      {link.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {role === 'guest' ? (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-[#0B0F19] transition-colors"
                >
                  登录
                </Link>
                <Link to="/register">
                  <button className="group relative px-6 py-2.5 bg-[#0B0F19] text-white rounded-lg overflow-hidden transition-all hover:shadow-lg hover:shadow-[#74B868]/20">
                    <div className="absolute inset-0 bg-[#74B868] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative flex items-center gap-2 text-sm font-medium">
                      立即注册 <ChevronRight size={14} />
                    </span>
                  </button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="text-right hidden lg:block">
                    <div className="text-xs font-bold text-[#0B0F19]">
                      {role === 'merchant' ? 'MERCHANT_ID: 8821' : 'USER_ID: 9921'}
                    </div>
                    <div className="text-[10px] text-[#74B868] tracking-wider">ONLINE</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#74B868] hover:text-white hover:border-[#74B868] transition-all cursor-pointer group">
                    <User size={20} />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                    title="退出登录"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {currentLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => handleLinkClick(link.path)}
                  className="text-2xl font-bold text-[#0B0F19] py-4 border-b border-gray-100 flex items-center gap-3"
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              {role === 'guest' && (
                <div className="mt-8 flex flex-col gap-4">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full py-4 text-center font-bold border border-gray-200 rounded-xl">
                      登录
                    </button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full py-4 text-center font-bold bg-[#0B0F19] text-white rounded-xl">
                      注册账户
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
