import React from 'react'
import Navbar from '../components/Navbar'
import HeroSection from './home/HeroSection'
import AdvantagesSection from './home/AdvantagesSection'
import FooterSection from './home/FooterSection'
import { useScrollToHash } from '../hooks/useScrollToHash'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  useScrollToHash()
  const { user } = useAuth()

  return (
    <div className="bg-[#F8F9FB] overflow-x-hidden w-full">
      <Navbar role={user ? user.role : 'guest'} />
      <HeroSection />
      <AdvantagesSection />
      <FooterSection />
    </div>
  )
}
