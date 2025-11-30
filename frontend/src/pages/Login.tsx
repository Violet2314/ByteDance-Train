import React from 'react'
import { Button, Input, Checkbox, Form } from 'antd'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import { useLogin } from '../hooks/useLogin'
import { LoginBackground } from '../components/business/LoginBackground'
import { LoginLeftPanel } from '../components/business/LoginLeftPanel'

export default function Login() {
  const { role, setRole, containerRef, isLoading, handleLogin } = useLogin()

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-white relative overflow-hidden flex flex-col font-sans selection:bg-[#74B868] selection:text-white"
    >
      <LoginBackground />

      <Navbar role="guest" enableEntranceAnimation={true} />

      <div className="flex-1 flex pt-16 relative z-10">
        <LoginLeftPanel />

        {/* 右侧 - 登录表单 */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-gray-200 shadow-2xl shadow-gray-200/50"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来</h2>
              <p className="text-gray-500">请输入您的详细信息以登录</p>
            </div>

            {/* 角色切换标签 */}
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
                  {r === 'user' ? '用户入口' : '商家入口'}
                </button>
              ))}
            </div>

            <Form
              name="login"
              onFinish={handleLogin}
              layout="vertical"
              size="large"
              className="space-y-4"
            >
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名！' }]}>
                <Input
                  prefix={<User size={18} className="text-gray-400" />}
                  placeholder="用户名"
                  className="h-12 rounded-xl bg-white/50 border-gray-200 hover:bg-white hover:border-[#74B868] focus:bg-white focus:border-[#74B868] transition-all"
                />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: '请输入密码！' }]}>
                <Input.Password
                  prefix={<Lock size={18} className="text-gray-400" />}
                  placeholder="密码"
                  iconRender={(visible) =>
                    visible ? (
                      <Eye size={18} className="text-gray-400" />
                    ) : (
                      <EyeOff size={18} className="text-gray-400" />
                    )
                  }
                  className="h-12 rounded-xl bg-white/50 border-gray-200 hover:bg-white hover:border-[#74B868] focus:bg-white focus:border-[#74B868] transition-all"
                />
              </Form.Item>

              <div className="flex items-center justify-between">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="text-gray-500">记住我</Checkbox>
                </Form.Item>
                <a className="text-[#74B868] font-medium hover:underline" href="#">
                  忘记密码？
                </a>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                className="h-12 rounded-xl bg-[#74B868] hover:!bg-[#63a055] border-none text-lg font-bold shadow-lg shadow-[#74B868]/20 mt-4"
              >
                登录
              </Button>
            </Form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
