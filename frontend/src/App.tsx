import { Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { antTheme } from './design-system/tokens'
import MerchantLayout from './components/layout/MerchantLayout'
import UserLayout from './components/layout/UserLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import MerchantDashboard from './pages/MerchantDashboard'
import OrderDetail from './pages/OrderDetail'
import DataDashboard from './pages/DataDashboard'
import DeliveryManagement from './pages/DeliveryManagement'
import TrackingSearch from './pages/TrackingSearch'
import TrackingDetail from './pages/TrackingDetail'

export default function App() {
  return (
    <ConfigProvider theme={antTheme}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Merchant Routes */}
        <Route path="/merchant" element={<MerchantLayout />}>
          <Route index element={<MerchantDashboard />} />
          <Route path="dashboard" element={<DataDashboard />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="delivery" element={<DeliveryManagement />} />
        </Route>

        {/* User Routes */}
        <Route path="/tracking" element={<UserLayout />}>
          <Route index element={<TrackingSearch />} />
          <Route path=":id" element={<TrackingDetail />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </ConfigProvider>
  )
}
