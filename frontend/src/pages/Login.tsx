import React, { useState } from 'react'
import { Button, Input, Checkbox, Form, message } from 'antd'
import { User, Lock, Eye, EyeOff, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState<'user' | 'merchant'>('user')
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      console.log('Login values:', { ...values, role })
      // 模拟登录延迟
      await new Promise(resolve => setTimeout(resolve, 800))
      
      message.success('登录成功')
      
      // 根据角色跳转
      if (role === 'merchant') {
        navigate('/merchant')
      } else {
        navigate('/tracking/search') // 用户端跳转到查询页
      }
    } catch (error) {
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Left Side - Branding & Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F8F9FB] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="z-10 flex flex-col items-center text-center max-w-lg">
          {/* Logo Area */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#74B868] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#74B868]/20">
              <Truck size={24} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-800 leading-none">物流配送</h1>
              <p className="text-xs text-gray-500 tracking-wider">可视化平台</p>
            </div>
          </div>

          {/* Slogan */}
          <div className="mb-12 space-y-2">
            <h2 className="text-xl text-gray-600 font-medium">智能物流，高效配送</h2>
            <h2 className="text-xl text-gray-600 font-medium">全程可视，实时追踪</h2>
          </div>

          {/* Dashboard Illustration Placeholder */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full aspect-[4/3] bg-[#DCE5F0] rounded-2xl shadow-2xl border-4 border-white overflow-hidden relative group"
          >
            {/* Mock UI Elements inside the illustration */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100 p-4">
               {/* Header Mock */}
               <div className="h-8 bg-white rounded-lg shadow-sm mb-4 w-full flex items-center px-3 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
               </div>
               {/* Content Mock */}
               <div className="flex gap-4 h-[calc(100%-3rem)]">
                  <div className="w-1/4 bg-white rounded-lg shadow-sm h-full p-2 space-y-2">
                    <div className="h-20 bg-blue-100 rounded w-full"></div>
                    <div className="h-8 bg-slate-100 rounded w-full"></div>
                    <div className="h-8 bg-slate-100 rounded w-full"></div>
                  </div>
                  <div className="flex-1 bg-white rounded-lg shadow-sm h-full relative overflow-hidden">
                    {/* Map Mock */}
                    <div className="absolute inset-0 bg-[#EBF1F6] flex items-center justify-center">
                      <div className="text-slate-300 font-bold text-4xl opacity-20">MAP VIEW</div>
                      {/* Dots representing locations */}
                      <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-[#74B868] rounded-full shadow-lg shadow-[#74B868]/40 animate-pulse"></div>
                      <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-orange-400 rounded-full shadow-lg shadow-orange-400/40"></div>
                      {/* Connecting line */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <path d="M 200 200 Q 400 100 600 300" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                      </svg>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-24 bg-white">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">欢迎登录</h2>
            <p className="text-gray-400 text-sm">请输入您的账号信息</p>
          </div>

          {/* Role Switcher */}
          <div className="flex justify-center gap-12 mb-10 border-b border-gray-100 pb-2">
            <button
              onClick={() => setRole('user')}
              className={`pb-2 text-sm font-medium transition-all relative ${
                role === 'user' ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              用户端
              {role === 'user' && (
                <motion.div layoutId="activeTab" className="absolute bottom-[-9px] left-0 right-0 h-[2px] bg-[#74B868]" />
              )}
            </button>
            <button
              onClick={() => setRole('merchant')}
              className={`pb-2 text-sm font-medium transition-all relative ${
                role === 'merchant' ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              商家端
              {role === 'merchant' && (
                <motion.div layoutId="activeTab" className="absolute bottom-[-9px] left-0 right-0 h-[2px] bg-[#74B868]" />
              )}
            </button>
          </div>

          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium ml-1">账号</label>
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入账号!' }]}
                className="mb-4"
              >
                <Input 
                  prefix={<User size={18} className="text-gray-400 mr-2" />} 
                  placeholder="请输入用户名或邮箱" 
                  className="rounded-full bg-gray-50 border-gray-200 hover:border-[#74B868] focus:border-[#74B868] h-12 px-4"
                />
              </Form.Item>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium ml-1">密码</label>
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码!' }]}
                className="mb-2"
              >
                <Input.Password 
                  prefix={<Lock size={18} className="text-gray-400 mr-2" />} 
                  placeholder="请输入密码" 
                  iconRender={(visible) => (visible ? <Eye size={18} className="text-gray-400" /> : <EyeOff size={18} className="text-gray-400" />)}
                  className="rounded-full bg-gray-50 border-gray-200 hover:border-[#74B868] focus:border-[#74B868] h-12 px-4"
                />
              </Form.Item>
            </div>

            <div className="flex items-center justify-between mb-8">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox className="text-gray-400 text-sm hover:text-[#74B868]">记住我</Checkbox>
              </Form.Item>
              <a className="text-[#74B868] hover:text-[#5da052] font-medium text-sm" href="#">
                忘记密码?
              </a>
            </div>

            <Form.Item className="mb-0">
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block 
                className="h-12 rounded-full bg-[#74B868] hover:!bg-[#5da052] border-none shadow-lg shadow-[#74B868]/30 font-medium text-lg tracking-wide"
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-16 text-center space-y-4">
            <p className="text-xs text-gray-400">
              © 2025 物流配送可视化平台 · 保留所有权利
            </p>
            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <a href="#" className="hover:text-gray-600 transition-colors">使用条款</a>
              <span className="text-gray-300">|</span>
              <a href="#" className="hover:text-gray-600 transition-colors">隐私政策</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

