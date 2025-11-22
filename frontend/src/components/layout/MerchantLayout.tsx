import React from 'react'
import { Layout, Menu, Avatar, Badge, Input } from 'antd'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Package, Truck, BarChart3, Bell, Search, Settings, Home } from 'lucide-react'
import { clsx } from 'clsx'

const { Header, Sider, Content } = Layout

export default function MerchantLayout() {
  const location = useLocation()
  
  const menuItems = [
    { key: '/merchant', icon: <Package size={20} />, label: <Link to="/merchant">订单管理</Link> },
    { key: '/merchant/delivery', icon: <Truck size={20} />, label: <Link to="/merchant/delivery">配送管理</Link> },
    { key: '/merchant/dashboard', icon: <BarChart3 size={20} />, label: <Link to="/merchant/dashboard">数据看板</Link> },
  ]

  return (
    <Layout className="min-h-screen bg-bg-page">
      <Header className="fixed top-0 z-50 w-full px-6 h-16 flex items-center justify-between bg-bg-nav-primary/80 backdrop-blur-md border-b border-primary-base/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-base rounded-lg flex items-center justify-center text-white font-bold text-xl">L</div>
          <span className="text-xl font-bold text-text-primary">Logistics<span className="text-primary-base">Pro</span></span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <input 
              type="text" 
              placeholder="搜索..." 
              className="pl-10 pr-4 py-2 rounded-full bg-white/60 border border-gray-200 focus:outline-none focus:border-primary-base/50 focus:bg-white transition-all w-64 text-sm"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-black/5 text-text-secondary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error-default rounded-full border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary-lighter/30 border border-primary-base/20 flex items-center justify-center text-primary-darker font-semibold text-sm">
              M
            </div>
          </div>
        </div>
      </Header>

      <Layout className="pt-16">
        <Sider width={240} className="fixed left-0 h-[calc(100vh-64px)] bg-bg-nav-secondary border-r border-primary-base/5 overflow-y-auto" theme="light">
          <div className="p-4">
            <div className="mb-6 px-4">
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Menu</p>
              <nav className="space-y-1">
                <Link to="/" className={clsx(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  "text-text-secondary hover:text-primary-base hover:bg-primary-base/5"
                )}>
                  <Home size={18} />
                  首页
                </Link>
                {menuItems.map(item => (
                  <div key={item.key} className={clsx(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
                    location.pathname === item.key || location.pathname.startsWith(item.key + '/') 
                      ? "bg-primary-base text-white shadow-lg shadow-primary-base/20" 
                      : "text-text-secondary hover:text-primary-base hover:bg-primary-base/5"
                  )}>
                    {/* Hack to make the whole div clickable via the Link inside label */}
                    <span className="[&>a]:text-inherit [&>a]:flex [&>a]:items-center [&>a]:gap-3 [&>a]:w-full">
                      {item.label}
                    </span>
                  </div>
                ))}
              </nav>
            </div>
            
            <div className="px-4 mt-auto">
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Settings</p>
              <nav className="space-y-1">
                <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-primary-base hover:bg-primary-base/5 transition-all">
                  <Settings size={18} />
                  设置
                </a>
              </nav>
            </div>
          </div>
        </Sider>
        
        <Layout className="ml-[240px] bg-transparent p-8">
          <Content className="max-w-7xl mx-auto w-full">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
