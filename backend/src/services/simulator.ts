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

function resampleRoute(route: {lat: number, lng: number}[], targetCount: number) {
  if (route.length <= targetCount) return route;
  const result = [];
  const step = (route.length - 1) / (targetCount - 1);
  for (let i = 0; i < targetCount; i++) {
    const index = Math.min(Math.round(i * step), route.length - 1);
    result.push(route[index]);
  }
  return result;
}

const MOCK_SMOOTH_ROUTE = interpolateRoute(MOCK_ROUTE, 20);

interface SimulationState {
  orderId: string;
  route: {lat: number, lng: number}[];
  step: number;
  onUpdate: (point: TrackPoint) => void;
  onComplete?: () => void;
  onStatusChange?: (status: ShipmentState) => void;
}

class SimulationManager {
  private simulations: Map<string, SimulationState> = new Map();
  private io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startLoop();
  }

  setIO(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  startSimulation(
    orderId: string, 
    onUpdate: (point: TrackPoint) => void,
    onComplete?: () => void,
    customRoute?: {lat: number, lng: number}[],
    onStatusChange?: (status: ShipmentState) => void,
    startTime?: number,
    deliveryDaysStr: string = '3-5天'
  ) {
    console.log(`Starting simulation for ${orderId} with promise ${deliveryDaysStr}`);
    
    // Parse delivery days to determine speed
    // "次日达" -> 1 day
    // "1-2天" -> 1.5 days
    // "3-5天" -> 4 days
    let days = 3;
    if (deliveryDaysStr.includes('次日')) days = 1;
    else if (deliveryDaysStr.includes('天')) {
      const nums = deliveryDaysStr.match(/\d+/g);
      if (nums) {
        if (nums.length === 1) days = parseInt(nums[0]);
        else if (nums.length >= 2) days = (parseInt(nums[0]) + parseInt(nums[1])) / 2;
      }
    }

    // Logic: 5 seconds real time = 2 hours simulation time
    // Total hours = days * 24
    // Total steps = Total hours / 2
    const totalSteps = Math.ceil((days * 24) / 2);
    // Ensure at least 10 steps for smoothness
    const steps = Math.max(totalSteps, 10);

    let route = customRoute ? resampleRoute(customRoute, steps) : MOCK_SMOOTH_ROUTE;
    
    let step = 0;
    if (startTime) {
      const elapsed = Date.now() - startTime;
      // Each step takes 5000ms
      step = Math.floor(elapsed / 5000);
      // If we are resuming, we shouldn't exceed the route length immediately if it's just a restart
      // But if enough time passed, it might be finished.
    }

    if (step >= route.length) {
       // Already finished
       if (onComplete) onComplete();
       return;
    }

    console.log(`Simulation ${orderId}: ${days} days delivery -> ${steps} steps. Starting at ${step}.`);

    // Initial Status
    if (step === 0 && this.io) {
      const initialStatus: ShipmentState = {
        orderId,
        status: 'picked',
        ts: Date.now()
      };
      this.io.to(`order:${orderId}`).emit('status:update', initialStatus);
      if (onStatusChange) onStatusChange(initialStatus);
    }

    this.simulations.set(orderId, {
      orderId,
      route,
      step,
      onUpdate,
      onComplete,
      onStatusChange
    });
  }

  private startLoop() {
    if (this.intervalId) return;

    // Global Heartbeat: 5 seconds
    this.intervalId = setInterval(() => {
      if (this.simulations.size === 0) return;

      const updates: TrackPoint[] = [];
      const finishedIds: string[] = [];

      this.simulations.forEach((sim, orderId) => {
        if (sim.step >= sim.route.length) {
          finishedIds.push(orderId);
          return;
        }

        const point = sim.route[sim.step];
        const trackUpdate: TrackPoint = {
          orderId,
          lat: point.lat,
          lng: point.lng,
          ts: Date.now()
        };

        // Add to batch
        updates.push(trackUpdate);

        // Individual Room Update (Legacy support & specific subscriptions)
        if (this.io) {
          this.io.to(`order:${orderId}`).emit('track:update', trackUpdate);
        }
        
        // DB Callback
        sim.onUpdate(trackUpdate);

        // Status Changes
        if (this.io) {
          if (sim.step === Math.floor(sim.route.length * 0.1)) {
             const status: ShipmentState = { orderId, status: 'in_transit', ts: Date.now() };
             this.io.to(`order:${orderId}`).emit('status:update', status);
             this.io.emit('status:broadcast', status); // Broadcast for merchant dashboard
             if (sim.onStatusChange) sim.onStatusChange(status);
          }
          if (sim.step === Math.floor(sim.route.length * 0.9)) {
             const status: ShipmentState = { orderId, status: 'out_for_delivery', ts: Date.now() };
             this.io.to(`order:${orderId}`).emit('status:update', status);
             this.io.emit('status:broadcast', status); // Broadcast for merchant dashboard
             if (sim.onStatusChange) sim.onStatusChange(status);
          }
        }

        sim.step++;
      });

      // Batch Emit
      if (updates.length > 0 && this.io) {
        // Emit to a global room or just broadcast if needed. 
        // For now, let's emit a new event 'track:batch-update' to everyone or a specific 'merchant' room.
        // Assuming merchants subscribe to 'merchant-updates' room or similar, but 'io.emit' is fine for this scale.
        // Casting to any because we haven't defined batch-update in the shared types yet, 
        // but it's fine for the implementation.
        this.io.emit('track:batch-update' as any, updates);
      }

      // Handle Finished
      finishedIds.forEach(orderId => {
        const sim = this.simulations.get(orderId);
        if (sim) {
          if (this.io) {
            const finalStatus: ShipmentState = {
              orderId,
              status: 'signed',
              ts: Date.now()
            };
            this.io.to(`order:${orderId}`).emit('status:update', finalStatus);
            this.io.emit('status:broadcast', finalStatus);
            if (sim.onStatusChange) sim.onStatusChange(finalStatus);
          }
          if (sim.onComplete) sim.onComplete();
          this.simulations.delete(orderId);
        }
      });

    }, 5000);
  }
}

export const simulationManager = new SimulationManager();

export function startSimulation(
  orderId: string, 
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  onUpdate: (point: TrackPoint) => void,
  onComplete?: () => void,
  customRoute?: {lat: number, lng: number}[],
  onStatusChange?: (status: ShipmentState) => void,
  startTime?: number,
  deliveryDaysStr?: string
) {
  simulationManager.setIO(io);
  simulationManager.startSimulation(orderId, onUpdate, onComplete, customRoute, onStatusChange, startTime, deliveryDaysStr);
}


