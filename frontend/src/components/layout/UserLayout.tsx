import React from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar'

const { Content } = Layout

export default function UserLayout() {
  return (
    <Layout className="min-h-screen bg-bg-page">
      <Navbar role="user" />

      <Content className="pt-24 min-h-screen flex flex-col">
        <Outlet />
      </Content>
    </Layout>
  )
}
