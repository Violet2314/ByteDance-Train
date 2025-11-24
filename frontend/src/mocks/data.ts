import Mock from 'mockjs'

// Mock User
export const mockUser = Mock.mock({
  id: '@guid',
  username: '@name',
  'role|1': ['user', 'merchant', 'admin'],
  avatar: '@image("100x100", "#50B347", "#FFF", "Avatar")',
})

// Mock Merchant
export const mockMerchant = Mock.mock({
  id: '@guid',
  name: '@company',
  contact: '@name',
  phone: /^1[3-9]\d{9}$/,
  address: '@county(true)',
})

// Mock Delivery Rules
export const generateMockRules = (count = 3) => {
  return Mock.mock({
    [`list|${count}`]: [
      {
        'id|+1': 1,
        'company|1': ['顺丰速运', '中通快递', '京东物流', '圆通速递', '韵达快递'],
        'days|1': ['1天', '1-2天', '2-3天', '3-5天'],
        area: '@city(true)',
        'color|1': ['blue', 'green', 'red', 'orange', 'purple'],
        isEnabled: false, // Default to false, we'll manage this in component
        // Generate a simple polygon path around Beijing center with some random offset
        path: () => {
          const center = [116.397428, 39.90923]
          const offset = (Math.random() - 0.5) * 0.1
          return [
            [center[0] - 0.02 + offset, center[1] + 0.02 + offset],
            [center[0] + 0.02 + offset, center[1] + 0.02 + offset],
            [center[0] + 0.02 + offset, center[1] - 0.02 + offset],
            [center[0] - 0.02 + offset, center[1] - 0.02 + offset],
          ]
        },
      },
    ],
  }).list
}

// Mock Orders (Hardcoded for consistency)
export const mockOrders = [
  {
    id: 'O1001',
    recipient: { name: '张三', phone: '13800138000' },
    amount: 128.5,
    status: 'pending',
    createdAt: '2023-10-20 10:30:00',
    origin: { text: '北京市海淀区中关村软件园', lat: 40.040528, lng: 116.293863 },
    address: { text: '北京市朝阳区建国路88号', lat: 39.90923, lng: 116.397428 },
  },
  {
    id: 'O1002',
    recipient: { name: '李四', phone: '13900139000' },
    amount: 356.0,
    status: 'in_transit',
    createdAt: '2023-10-19 14:20:00',
    origin: { text: '杭州市余杭区阿里巴巴西溪园区', lat: 30.27415, lng: 120.026208 },
    address: { text: '上海市浦东新区世纪大道1号', lat: 31.230416, lng: 121.473701 },
  },
  {
    id: 'O1003',
    recipient: { name: '王五', phone: '13700137000' },
    amount: 89.9,
    status: 'signed',
    createdAt: '2023-10-18 09:15:00',
    origin: { text: '深圳市南山区腾讯大厦', lat: 22.540517, lng: 113.934528 },
    address: { text: '广州市天河区天河路208号', lat: 23.129162, lng: 113.264434 },
  },
  {
    id: 'O1004',
    recipient: { name: '赵六', phone: '13600136000' },
    amount: 1299.0,
    status: 'pending',
    createdAt: '2023-10-21 11:00:00',
    origin: { text: '北京市大兴区京东总部', lat: 39.786547, lng: 116.562546 },
    address: { text: '深圳市南山区深南大道9966号', lat: 22.543099, lng: 114.057868 },
  },
  {
    id: 'O1005',
    recipient: { name: '孙七', phone: '13500135000' },
    amount: 45.0,
    status: 'in_transit',
    createdAt: '2023-10-20 16:45:00',
    origin: { text: '重庆市渝北区顺丰产业园', lat: 29.718129, lng: 106.63088 },
    address: { text: '成都市武侯区人民南路四段3号', lat: 30.658601, lng: 104.064856 },
  },
]

export const generateMockOrders = (_count = 10) => {
  // Return exactly the hardcoded orders, ignoring count to ensure consistency
  // This ensures O1001 is always O1001, without suffixes
  return [...mockOrders]
}
