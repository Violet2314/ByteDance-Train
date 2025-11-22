import { Server } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents, TrackPoint, ShipmentState } from '@logistics/shared';

// Mock Route: Beijing to Shanghai (Simplified)
const MOCK_ROUTE = [
  { lat: 39.9042, lng: 116.4074 }, // Beijing
  { lat: 39.1, lng: 117.2 }, // Tianjin
  { lat: 36.6, lng: 117.0 }, // Jinan
  { lat: 34.7, lng: 113.6 }, // Zhengzhou (Detour for demo)
  { lat: 32.0, lng: 118.7 }, // Nanjing
  { lat: 31.2304, lng: 121.4737 } // Shanghai
];

// Interpolate points to make it smoother
function interpolateRoute(route: {lat: number, lng: number}[], steps: number) {
  const result = [];
  for (let i = 0; i < route.length - 1; i++) {
    const start = route[i];
    const end = route[i+1];
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      result.push({
        lat: start.lat + (end.lat - start.lat) * t,
        lng: start.lng + (end.lng - start.lng) * t
      });
    }
  }
  result.push(route[route.length - 1]);
  return result;
}

const SMOOTH_ROUTE = interpolateRoute(MOCK_ROUTE, 20); // 20 steps between cities

export function startSimulation(
  orderId: string, 
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  onComplete?: () => void
) {
  console.log(`Starting simulation for ${orderId}`);
  
  let step = 0;
  
  // Initial Status
  const initialStatus: ShipmentState = {
    orderId,
    status: 'picked',
    ts: Date.now()
  };
  io.to(`order:${orderId}`).emit('status:update', initialStatus);

  const interval = setInterval(() => {
    if (step >= SMOOTH_ROUTE.length) {
      clearInterval(interval);
      // Final Status
      const finalStatus: ShipmentState = {
        orderId,
        status: 'signed',
        ts: Date.now()
      };
      io.to(`order:${orderId}`).emit('status:update', finalStatus);
      
      if (onComplete) onComplete();
      
      return;
    }

    const point = SMOOTH_ROUTE[step];
    const trackUpdate: TrackPoint = {
      orderId,
      lat: point.lat,
      lng: point.lng,
      ts: Date.now()
    };

    io.to(`order:${orderId}`).emit('track:update', trackUpdate);
    
    // Simulate status changes based on progress
    if (step === 5) {
       io.to(`order:${orderId}`).emit('status:update', { orderId, status: 'in_transit', ts: Date.now() });
    }
    if (step === SMOOTH_ROUTE.length - 5) {
       io.to(`order:${orderId}`).emit('status:update', { orderId, status: 'out_for_delivery', ts: Date.now() });
    }

    step++;
  }, 1000); // Update every 1 second
}
