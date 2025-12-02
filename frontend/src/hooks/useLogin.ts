import { useState, useRef, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import gsap from 'gsap'
import { useLoginMutation } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export const useLogin = () => {
  const navigate = useNavigate()
  const [role, setRole] = useState<'user' | 'merchant'>('user')
  const containerRef = useRef<HTMLDivElement>(null)
  const [loginApi, { isLoading }] = useLoginMutation()
  const { login } = useAuth()

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 全局背景光球动画
      gsap.to('.bg-orb', {
        x: 'random(-100, 100)',
        y: 'random(-50, 50)',
        scale: 'random(0.8, 1.2)',
        duration: 'random(10, 20)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 2,
      })

      // 艺术背景动画（左侧元素）
      gsap.to('.art-shape', {
        y: 'random(-30, 30)',
        rotation: 'random(-15, 15)',
        duration: 'random(4, 7)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.2,
      })

      // 品牌色元素的微弱脉冲效果
      gsap.to('.brand-pulse', {
        boxShadow: '0 0 30px rgba(116, 184, 104, 0.4)',
        duration: 2,
        repeat: -1,
        yoyo: true,
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  const handleLogin = async (values: any) => {
    try {
      const result = await loginApi({
        username: values.username,
        password: values.password,
        role,
      }).unwrap()

      // 后端返回的数据结构: { data: { id, username, role, name, token } }
      const userData = result.data

      // 调用 AuthContext 的 login 方法，存储用户信息和 token
      login(userData)

      message.success(`${role === 'merchant' ? '商家' : '用户'}登录成功`)

      // 根据角色跳转到对应页面
      if (role === 'merchant') {
        navigate('/merchant')
      } else {
        navigate('/tracking')
      }
    } catch (error) {
      message.error('登录失败，请检查用户名和密码')
      console.error('Login error:', error)
    }
  }

  return {
    role,
    setRole,
    containerRef,
    isLoading,
    handleLogin,
  }
}
