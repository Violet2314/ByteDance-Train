import React from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar'

const { Content } = Layout

/**
 * 商家端布局组件
 *
 * 包含顶部导航栏和主要内容区域。
 * 适用于商家后台的所有页面。
 */
export default function MerchantLayout() {
  return (
    <Layout className="min-h-screen bg-[#F8F9FB]">
      <Navbar role="merchant" />
      <Content className="pt-24 px-8 pb-8 max-w-[1600px] mx-auto w-full">
        <Outlet />
      </Content>
    </Layout>
  )
}
