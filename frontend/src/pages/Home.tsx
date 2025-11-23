import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import HeroSection from './home/HeroSection'
import AdvantagesSection from './home/AdvantagesSection'
import FooterSection from './home/FooterSection'

export default function Home() {
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // Add a small delay to ensure DOM is ready after navigation
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [hash])

  return (
    <div className="bg-[#F8F9FB] overflow-x-hidden w-full">
      <Navbar />
      <HeroSection />
      <AdvantagesSection />
      <FooterSection />
    </div>
  )
}
