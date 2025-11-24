export interface Order {
  id: string
  status: 'pending' | 'in_transit' | 'signed'
  amount: number
  createdAt: string // ISO
  recipient: { name: string; phone: string }
  address: { text: string; lat: number; lng: number }
}

export interface TrackPoint {
  orderId: string
  lat: number
  lng: number
  ts: number
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
}

export interface ClientToServerEvents {
  'subscribe': (payload: { orderId: string }) => void;
  'unsubscribe': (payload: { orderId: string }) => void;
}
