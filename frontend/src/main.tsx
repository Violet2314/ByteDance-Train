import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './services/store'
import App from './App'
import './index.css'

// 高德地图安全配置
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any)._AMapSecurityConfig = {
  securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE,
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
