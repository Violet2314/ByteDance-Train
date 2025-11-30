import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ConfigProvider, Spin, App as AntdApp } from 'antd'
import { antTheme } from './design-system/tokens'
import MerchantLayout from './components/layout/MerchantLayout'
import UserLayout from './components/layout/UserLayout'
import { AuthProvider } from './contexts/AuthContext'

// 懒加载页面
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const MerchantDashboard = lazy(() => import('./pages/MerchantDashboard'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const DataDashboard = lazy(() => import('./pages/DataDashboard'))
const DeliveryManagement = lazy(() => import('./pages/DeliveryManagement'))
const TrackingSearch = lazy(() => import('./pages/TrackingSearch'))
const TrackingDetail = lazy(() => import('./pages/TrackingDetail'))
const UserOrders = lazy(() => import('./pages/UserOrders'))
const HeatmapAnalysis = lazy(() => import('./pages/HeatmapAnalysis'))
const SmartRoutePlanning = lazy(() => import('./pages/SmartRoutePlanning'))

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <Spin size="large" />
  </div>
)

export default function App() {
  return (
    <ConfigProvider theme={antTheme}>
      <AntdApp>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/heatmap" element={<HeatmapAnalysis />} />

              {/* 商家路由 */}
              <Route path="/merchant" element={<MerchantLayout />}>
                <Route index element={<MerchantDashboard />} />
                <Route path="dashboard" element={<DataDashboard />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="delivery" element={<DeliveryManagement />} />
                <Route path="route-planning" element={<SmartRoutePlanning />} />
              </Route>

              {/* 用户路由 */}
              <Route path="/tracking" element={<UserLayout />}>
                <Route index element={<TrackingSearch />} />
                <Route path="orders" element={<UserOrders />} />
                <Route path=":id" element={<TrackingDetail />} />
              </Route>

              {/* 兜底路由 */}
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  )
}
