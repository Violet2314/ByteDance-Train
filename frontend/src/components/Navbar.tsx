import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'antd'
import { Truck } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full px-8 py-6 flex justify-between items-center z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#74B868] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[#74B868]/20">
          <Truck size={16} />
        </div>
        <span className="font-bold text-gray-800 text-lg tracking-tight">LogisticsPro</span>
      </div>
      <div className="flex gap-4">
         <Link to="/login">
           <Button type="text" className="text-gray-500 hover:text-gray-800 font-medium">登录</Button>
         </Link>
         <Link to="/register">
           <Button className="rounded-full bg-[#74B868] text-white hover:bg-[#63a055] border-none font-medium px-6">注册</Button>
         </Link>
      </div>
    </nav>
  )
}
