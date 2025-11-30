import React from 'react'
import Navbar from '../components/Navbar'
import HeroSection from './home/HeroSection'
import AdvantagesSection from './home/AdvantagesSection'
import FooterSection from './home/FooterSection'
import { useScrollToHash } from '../hooks/useScrollToHash'

export default function Home() {
  useScrollToHash()

  return (
    <div className="bg-[#F8F9FB] overflow-x-hidden w-full">
      <Navbar />
      <HeroSection />
      <AdvantagesSection />
      <FooterSection />
    </div>
  )
}
