import { Server } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents, TrackPoint, ShipmentState } from '@logistics/shared';

/**
 * 重采样路线点，调整到目标数量
 * @param route 原始路线点数组
 * @param targetCount 目标点数量
 * @returns 重采样后的路线点数组
 */
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
    route: {lat: number, lng: number}[], // 必填参数：高德地图 API 返回的真实路线
    onUpdate: (point: TrackPoint) => void,
    onComplete?: () => void,
    onStatusChange?: (status: ShipmentState) => void,
    startTime?: number,
    deliveryDaysStr: string = '3-5天'
  ) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`开始模拟订单 ${orderId}，配送时效：${deliveryDaysStr}`);
    }
    
    // 解析配送时效字符串，确定模拟速度
    // "次日达" -> 1 天
    // "1-2天" -> 1.5 天
    // "3-5天" -> 4 天
    let days = 3;
    if (deliveryDaysStr.includes('次日')) days = 1;
    else if (deliveryDaysStr.includes('天')) {
      const nums = deliveryDaysStr.match(/\d+/g);
      if (nums) {
        if (nums.length === 1) days = parseInt(nums[0]);
        else if (nums.length >= 2) days = (parseInt(nums[0]) + parseInt(nums[1])) / 2;
      }
    }

    // 逻辑：现实 5 秒 = 模拟 2 小时
    // 总小时数 = 天数 * 24
    // 总步数 = 总小时数 / 2
    const totalSteps = Math.ceil((days * 24) / 2);
    // 确保至少 10 步以保证平滑度
    const steps = Math.max(totalSteps, 10);

    // 重采样路线到目标步数
    const resampledRoute = resampleRoute(route, steps);
    
    let step = 0;
    if (startTime) {
      const elapsed = Date.now() - startTime;
      // 每步耗时 5000ms
      step = Math.floor(elapsed / 5000);
      // 如果是恢复模拟，不应立即超出路线长度
    }

    if (step >= resampledRoute.length) {
       // 已完成
       if (onComplete) onComplete();
       return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`模拟订单 ${orderId}：${days} 天配送 -> ${steps} 步。从第 ${step} 步开始。`);
    }

    // 初始状态：已揽收
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
      route: resampledRoute,
      step,
      onUpdate,
      onComplete,
      onStatusChange
    });
  }

  private startLoop() {
    if (this.intervalId) return;

    // 全局心跳：每 5 秒触发一次
    this.intervalId = setInterval(() => {
      if (this.simulations.size === 0) return;

      const updates: TrackPoint[] = [];
      const finishedIds: string[] = [];

      this.simulations.forEach((sim, orderId) => {
        // 先推进step
        const currentStep = sim.step;
        
        // 检查是否已完成（到达最后一个点）
        if (currentStep >= sim.route.length) {
          finishedIds.push(orderId);
          return;
        }

        const point = sim.route[currentStep];
        const trackUpdate: TrackPoint = {
          orderId,
          lat: point.lat,
          lng: point.lng,
          ts: Date.now()
        };

        // 添加到批量更新数组
        updates.push(trackUpdate);

        // 单独房间更新（兼容旧逻辑和特定订阅）
        if (this.io) {
          this.io.to(`order:${orderId}`).emit('track:update', trackUpdate);
        }
        
        // 数据库回调：保存轨迹点
        sim.onUpdate(trackUpdate);

        // 状态变更逻辑
        if (this.io) {
          // 10% 进度：运输中
          if (currentStep === Math.floor(sim.route.length * 0.1)) {
             const status: ShipmentState = { orderId, status: 'in_transit', ts: Date.now() };
             this.io.to(`order:${orderId}`).emit('status:update', status);
             this.io.emit('status:broadcast' as any, status); // 广播给商家仪表盘
             if (sim.onStatusChange) sim.onStatusChange(status);
          }
          // 90% 进度：派送中
          if (currentStep === Math.floor(sim.route.length * 0.9)) {
             const status: ShipmentState = { orderId, status: 'out_for_delivery', ts: Date.now() };
             this.io.to(`order:${orderId}`).emit('status:update', status);
             this.io.emit('status:broadcast' as any, status); // 广播给商家仪表盘
             if (sim.onStatusChange) sim.onStatusChange(status);
          }
        }

        // 最后才推进step
        sim.step++;
      });

      // 批量推送轨迹更新
      if (updates.length > 0 && this.io) {
        // 向所有客户端广播批量轨迹更新（用于热力图等场景）
        this.io.emit('track:batch-update' as any, updates);
      }

      // 处理已完成的订单
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
            this.io.emit('status:broadcast' as any, finalStatus); // 广播最终状态
            if (sim.onStatusChange) sim.onStatusChange(finalStatus);
          }
          if (sim.onComplete) sim.onComplete(); // 触发完成回调
          this.simulations.delete(orderId); // 从模拟列表中移除
        }
      });

    }, 5000);
  }
}

export const simulationManager = new SimulationManager();

/**
 * 启动订单物流模拟
 * @param orderId 订单 ID
 * @param io Socket.IO 服务器实例
 * @param route 高德地图 API 返回的真实路线点数组（必填）
 * @param onUpdate 轨迹点更新回调（用于保存到数据库）
 * @param onComplete 模拟完成回调
 * @param onStatusChange 状态变更回调
 * @param startTime 开始时间戳（用于恢复模拟）
 * @param deliveryDaysStr 配送时效字符串（如 "次日达"、"3-5天"）
 */
export function startSimulation(
  orderId: string, 
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  route: {lat: number, lng: number}[], // 必填参数
  onUpdate: (point: TrackPoint) => void,
  onComplete?: () => void,
  onStatusChange?: (status: ShipmentState) => void,
  startTime?: number,
  deliveryDaysStr?: string
) {
  simulationManager.setIO(io);
  simulationManager.startSimulation(orderId, route, onUpdate, onComplete, onStatusChange, startTime, deliveryDaysStr);
}


