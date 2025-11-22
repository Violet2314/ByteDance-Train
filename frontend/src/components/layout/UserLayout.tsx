import React from 'react'
import { Layout } from 'antd'
import { Outlet, Link } from 'react-router-dom'
import { Package, Search } from 'lucide-react'

const { Header, Content } = Layout

export default function UserLayout() {
  return (
    <Layout className="min-h-screen bg-bg-page">
      <Header className="fixed top-0 z-50 w-full px-6 h-16 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-base rounded-lg flex items-center justify-center text-white font-bold text-xl">L</div>
          <span className="text-xl font-bold text-text-primary">Logistics<span className="text-primary-base">Pro</span></span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/tracking" className="text-sm font-medium text-text-secondary hover:text-primary-base transition-colors">
            查询订单
          </Link>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
            U
          </div>
        </div>
      </Header>

      <Content className="pt-16 min-h-screen flex flex-col">
        <Outlet />
      </Content>
    </Layout>
  )
}
