import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from './api'

// 配置 Redux Store (全局状态管理)
export const store = configureStore({
  reducer: {
    // 将 RTK Query 的 reducer 挂载到 store
    // api.reducerPath 默认为 'api'
    [api.reducerPath]: api.reducer,
  },
  // 添加 RTK Query 的中间件
  // 中间件负责处理缓存、失效、轮询等逻辑
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
})

// 开启监听器
// 这对于 refetchOnFocus (窗口聚焦时自动刷新) 和 refetchOnReconnect (网络重连时自动刷新) 是必须的
setupListeners(store.dispatch)

// 导出 RootState 和 AppDispatch 类型，供 Hooks 使用
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
