import React, { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import Navbar from '../components/Navbar'
import { useScrollToHash } from '../hooks/useScrollToHash'
import { useAuth } from '../contexts/AuthContext'

// 懒加载 Home 页面的子组件，减少初始加载体积
const HeroSection = lazy(() => import('./home/HeroSection'))
const AdvantagesSection = lazy(() => import('./home/AdvantagesSection'))
const FooterSection = lazy(() => import('./home/FooterSection'))

// 简单的加载占位符
const SectionLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Spin size="large" />
  </div>
)

export default function Home() {
  useScrollToHash()
  const { user } = useAuth()

  return (
    <div className="bg-[#F8F9FB] overflow-x-hidden w-full">
      <Navbar role={user ? user.role : 'guest'} />
      <Suspense fallback={<SectionLoader />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <AdvantagesSection />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <FooterSection />
      </Suspense>
    </div>
  )
}
