import React from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar'

const { Content } = Layout

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
