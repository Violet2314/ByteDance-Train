export interface Order {
  id: string
  status: 'pending' | 'picked' | 'in_transit' | 'out_for_delivery' | 'signed'
  amount: number
  createdAt: string // ISO
  deliveryDays: number | string // Promised delivery days (e.g. 1, 3, "1-2天")
  shippedAt?: string // ISO
  lastTrackTime?: number // Timestamp
  
  // Sender Info
  sender: {
    name: string
    phone: string
    address: string
    lat?: number
    lng?: number
  }

  // Recipient Info
  recipient: { 
    name: string
    phone: string 
  }
  address: { 
    text: string
    lat: number
    lng: number 
  }

  // Cargo Info
  cargo?: {
    name: string
    weight: number
    quantity: number
  }
}

export interface TrackPoint {
  orderId: string
  lat: number
  lng: number
  ts: number
  shippedAt?: string
  deliveryDays?: string
  routePath?: { lat: number; lng: number }[]
}

export type ShipmentStatus = 'picked' | 'in_transit' | 'out_for_delivery' | 'signed'

export interface ShipmentState {
  orderId: string
  status: ShipmentStatus
  ts: number
}

export interface TrackUpdatePayload extends TrackPoint {
  speed?: number
  remainingDistance?: number
}

export interface OrderStatusPayload {
  orderId: string
  status: ShipmentStatus
  ts: number
}

export interface User {
  id: string
  username: string
  role: 'user' | 'merchant' | 'admin'
  avatar?: string
}

export interface Merchant {
  id: string
  name: string
  contact: string
  address: string
}

// WebSocket Events
export interface ServerToClientEvents {
  'track:update': (payload: TrackPoint) => void;
  'status:update': (payload: ShipmentState) => void;
  'status:broadcast': (payload: ShipmentState) => void;
  'track:batch-update': (payload: TrackPoint[]) => void;
}

export interface ClientToServerEvents {
  'subscribe': (payload: { orderId: string }) => void;
  'unsubscribe': (payload: { orderId: string }) => void;
}

// 配送规则接口
export interface DeliveryRule {
  id: number
  merchantId: string
  company: string
  area: string
  deliveryDays: string
  days?: string // 兼容字段（某些地方使用 days 而不是 deliveryDays）
  pricePerKm: number
  basePrice: number
  path: [number, number][] // [lng, lat]
  createdAt?: string
  updatedAt?: string
}
// 地址簿接口
export interface AddressBook {
  id: string
  merchantId: number
  name: string
  phone: string
  address: string
  contactName?: string // 兼容某些表单使用 contactName
  contactPhone?: string // 兼容某些表单使用 contactPhone
  lat?: number
  lng?: number
  createdAt?: string
}

// 登录响应（后端实际返回的是扁平结构，id 是数字类型）
export interface LoginResponse {
  id: number
  username: string
  role: 'user' | 'merchant'
  name?: string
  token: string
}

// 创建订单表单（与实际表单字段对应）
export interface CreateOrderForm {
  senderName: string
  senderPhone: string
  senderAddress: string
  senderLat?: number
  senderLng?: number
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  recipientLat?: number
  recipientLng?: number
  goodsName?: string
  goodsWeight?: number
  goodsCount?: number
  amount: number
  userId?: string
}

// 地理编码结果
export interface GeocodeResult {
  lat: number
  lng: number
  formattedAddress?: string
}
