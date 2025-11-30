import React from 'react'

/**
 * 登录页背景组件
 *
 * 包含动态模糊光球效果的背景装饰。
 */
export const LoginBackground = React.memo(() => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="bg-orb absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#74B868]/5 blur-[120px]" />
      <div className="bg-orb absolute top-[40%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#74B868]/10 blur-[100px]" />
      <div className="bg-orb absolute bottom-[-20%] left-[30%] w-[700px] h-[700px] rounded-full bg-[#74B868]/5 blur-[150px]" />
    </div>
  )
})
