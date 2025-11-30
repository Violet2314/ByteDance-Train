import React from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar'

const { Content } = Layout

/**
 * 用户端布局组件
 *
 * 包含顶部导航栏和主要内容区域。
 * 适用于用户端的所有页面。
 */
export default function UserLayout() {
  return (
    <Layout className="min-h-screen bg-bg-page">
      <Navbar role="user" />

      <Content className="pt-24 px-4 md:px-8 pb-8 max-w-[1600px] mx-auto w-full min-h-screen flex flex-col">
        <Outlet />
      </Content>
    </Layout>
  )
}
