import React, { useState, useRef, useLayoutEffect } from 'react'
import { Button, Input, Checkbox, Form, message } from 'antd'
import { User, Lock, Eye, EyeOff, ArrowRight, Truck, Globe, Zap, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import Navbar from '../components/Navbar'

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState<'user' | 'merchant'>('user')
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Global Background Orbs Animation
      gsap.to(".bg-orb", {
        x: "random(-100, 100)",
        y: "random(-50, 50)",
        scale: "random(0.8, 1.2)",
        duration: "random(10, 20)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 2
      })

      // Artistic Background Animation (Left Side Elements)
      gsap.to(".art-shape", {
        y: "random(-30, 30)",
        rotation: "random(-15, 15)",
        duration: "random(4, 7)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2
      })
      
      // Subtle pulse for the brand color elements
      gsap.to(".brand-pulse", {
        boxShadow: "0 0 30px rgba(116, 184, 104, 0.4)",
        duration: 2,
        repeat: -1,
        yoyo: true
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      console.log('Login values:', { ...values, role })
      await new Promise(resolve => setTimeout(resolve, 800))
      message.success('登录成功')
      if (role === 'merchant') {
        navigate('/merchant')
      } else {
        navigate('/tracking')
      }
    } catch (error) {
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="min-h-screen w-full bg-white relative overflow-hidden flex flex-col font-sans selection:bg-[#74B868] selection:text-white">
      
      {/* Global Ambient Background (Green Orbs) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="bg-orb absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#74B868]/5 blur-[120px]" />
         <div className="bg-orb absolute top-[40%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#74B868]/10 blur-[100px]" />
         <div className="bg-orb absolute bottom-[-20%] left-[30%] w-[700px] h-[700px] rounded-full bg-[#74B868]/5 blur-[150px]" />
      </div>

      <Navbar role="guest" enableEntranceAnimation={true} />
      
      <div className="flex-1 flex pt-16 relative z-10">
        {/* Left Side - Artistic Visual */}
        <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12">
           {/* Abstract Shapes (Local) */}
           <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="art-shape absolute top-[10%] left-[10%] w-64 h-64 bg-gradient-to-br from-[#74B868]/10 to-transparent rounded-full blur-3xl" />
              <div className="art-shape absolute bottom-[20%] right-[10%] w-96 h-96 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl" />
           </div>

           {/* Content Container */}
           <div className="relative z-10 max-w-lg">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-[#74B868]/10 flex items-center justify-center mb-8 brand-pulse border border-white/50">
                   <Truck size={32} className="text-[#74B868]" />
                </div>
                <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                  Logistics<br/>
                  <span className="text-[#74B868]">Reimagined.</span>
                </h1>
                <p className="text-gray-500 text-lg leading-relaxed mb-12">
                  Seamlessly connect your supply chain with our next-generation visualization platform.
                </p>
                
                {/* Feature List */}
                <div className="space-y-6">
                   {[
                     { title: "Real-time Tracking", desc: "Precision down to the meter", icon: <Globe size={20} /> },
                     { title: "Smart Analytics", desc: "AI-driven insights", icon: <Zap size={20} /> },
                     { title: "Secure Delivery", desc: "Bank-grade encryption", icon: <Shield size={20} /> }
                   ].map((item, idx) => (
                     <motion.div 
                       key={idx}
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: 0.4 + idx * 0.1 }}
                       className="flex items-center gap-4 group"
                     >
                        <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#74B868] group-hover:border-[#74B868] transition-all shadow-sm">
                           {item.icon}
                        </div>
                        <div>
                           <div className="font-bold text-gray-800">{item.title}</div>
                           <div className="text-xs text-gray-400">{item.desc}</div>
                        </div>
                     </motion.div>
                   ))}
                </div>
              </motion.div>
           </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.2 }}
             className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-gray-200 shadow-2xl shadow-gray-200/50"
           >
              <div className="text-center mb-10">
                 <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                 <p className="text-gray-500">Please enter your details to sign in</p>
              </div>

              {/* Role Tabs */}
              <div className="bg-gray-100/50 p-1 rounded-xl flex mb-8">
                 {(['user', 'merchant'] as const).map((r) => (
                   <button
                     key={r}
                     onClick={() => setRole(r)}
                     className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${
                       role === r 
                         ? 'bg-white text-[#74B868] shadow-sm' 
                         : 'text-gray-400 hover:text-gray-600'
                     }`}
                   >
                     {r === 'user' ? 'User Portal' : 'Merchant Portal'}
                   </button>
                 ))}
              </div>

              <Form
                name="login"
                onFinish={onFinish}
                layout="vertical"
                size="large"
                className="space-y-4"
              >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: 'Please input your username!' }]}
                >
                  <Input 
                    prefix={<User size={18} className="text-gray-400" />} 
                    placeholder="Username" 
                    className="h-12 rounded-xl bg-white/50 border-gray-200 hover:bg-white hover:border-[#74B868] focus:bg-white focus:border-[#74B868] transition-all"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Please input your password!' }]}
                >
                  <Input.Password 
                    prefix={<Lock size={18} className="text-gray-400" />} 
                    placeholder="Password" 
                    iconRender={(visible) => (visible ? <Eye size={18} className="text-gray-400" /> : <EyeOff size={18} className="text-gray-400" />)}
                    className="h-12 rounded-xl bg-white/50 border-gray-200 hover:bg-white hover:border-[#74B868] focus:bg-white focus:border-[#74B868] transition-all"
                  />
                </Form.Item>

                <div className="flex items-center justify-between">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox className="text-gray-500">Remember me</Checkbox>
                  </Form.Item>
                  <a className="text-[#74B868] font-medium hover:underline" href="#">Forgot password?</a>
                </div>

                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block 
                  className="h-12 rounded-xl bg-[#74B868] hover:!bg-[#63a055] border-none text-lg font-bold shadow-lg shadow-[#74B868]/20 mt-4"
                >
                  Sign In
                </Button>
              </Form>
           </motion.div>
        </div>
      </div>
    </div>
  )
}

