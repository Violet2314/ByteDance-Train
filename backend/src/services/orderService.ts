import orderRepository from '../repositories/orderRepository'
import deliveryRuleRepository from '../repositories/deliveryRuleRepository'
import { getDrivingPath } from './amap'
import { isPointInPolygon } from '../utils/geo'
import { startSimulation } from './simulator'
import type { Server } from 'socket.io'
import pool from '../db'
import { RowDataPacket } from 'mysql2'

import { getDistance } from '../utils/geo'

/**
 * 订单服务层
 */
export class OrderService {
  /**
   * 获取订单列表
   */
  async getOrders(filters: {
    status?: string
    userId?: number
    sort?: string
    order?: string
  }) {
    return await orderRepository.findAll(filters)
  }

  /**
   * 获取商家的订单列表
   */
  async getOrdersByMerchant(filters: {
    merchantId: number
    status?: string
    sort?: string
    order?: string
  }) {
    return await orderRepository.findByMerchant(filters)
  }

  /**
   * 创建订单
   */
  async createOrder(data: {
    merchantId: number
    userId: number | null
    sender: any
    recipient: any
    cargo: any
    amount: number
  }) {
    // 验证收件人信息
    if (!data.recipient || !data.recipient.name || !data.recipient.phone || !data.recipient.address) {
      throw new Error('缺少收件人信息')
    }

    // 验证收件人坐标（必须有效）
    if (!data.recipient.lat || !data.recipient.lng || data.recipient.lat === 0 || data.recipient.lng === 0) {
      throw new Error('请先对收货地址进行定位')
    }

    // 验证发货人信息
    if (!data.sender || !data.sender.name || !data.sender.phone || !data.sender.address) {
      throw new Error('缺少发货人信息')
    }

    // 验证发货人坐标（必须有效）
    if (!data.sender.lat || !data.sender.lng || data.sender.lat === 0 || data.sender.lng === 0) {
      throw new Error('请先对发货地址进行定位')
    }

    // 生成订单 ID
    const orderId = `O${Date.now().toString().slice(-11)}`

    await orderRepository.create({
      id: orderId,
      merchantId: data.merchantId,
      userId: data.userId,
      sender: data.sender,
      recipient: data.recipient,
      cargo: data.cargo,
      amount: data.amount
    })

    return await orderRepository.findById(orderId)
  }

  /**
   * 获取订单详情
   */
  async getOrderById(id: string) {
    const order = await orderRepository.findById(id)
    if (!order) {
      throw new Error('订单不存在')
    }
    return order
  }

  /**
   * 根据距离智能选择配送时效
   * @param rule 配送规则
   * @param distance 配送距离（米）
   * @returns 配送时效字符串
   */
  private selectDeliveryTime(rule: any, distance: number): string {
    // 距离阈值（单位：米）
    const INTRA_CITY_THRESHOLD = 50000 // 50公里内：同城
    const IN_PROVINCE_THRESHOLD = 500000 // 500公里内：省内
    const INTER_PROVINCE_THRESHOLD = 2000000 // 2000公里内：跨省
    // 超过2000公里：偏远

    if (distance <= INTRA_CITY_THRESHOLD) {
      return rule.intraCity || rule.inProvince || rule.interProvince || '次日达'
    } else if (distance <= IN_PROVINCE_THRESHOLD) {
      return rule.inProvince || rule.interProvince || '1-2天'
    } else if (distance <= INTER_PROVINCE_THRESHOLD) {
      return rule.interProvince || rule.remote || '2-3天'
    } else {
      return rule.remote || '3-5天'
    }
  }

  /**
   * 发货
   */
  async shipOrder(orderId: string, ruleId: number | undefined, io: Server) {
    const order = await orderRepository.findById(orderId)
    if (!order) {
      throw new Error('订单不存在')
    }

    if (order.status !== 'pending') {
      throw new Error('订单不可发货')
    }

    // 确定配送时效
    let deliveryDays = '3-5天'  // 默认值
    let deliveryCompany = '默认快递'
    
    if (ruleId) {
      const rule = await deliveryRuleRepository.findById(ruleId)
      if (rule) {
        // 验证发货地和收货地是否在规则区域内
        if (Array.isArray(rule.path) && rule.path.length > 0) {
          const senderPoint: [number, number] = [order.sender.lng, order.sender.lat]
          const recipientPoint: [number, number] = [order.address.lng, order.address.lat]
          
          const isSenderIn = isPointInPolygon(senderPoint, rule.path)
          const isRecipientIn = isPointInPolygon(recipientPoint, rule.path)
          
          if (!isSenderIn || !isRecipientIn) {
            throw new Error(
              `该配送规则不覆盖${!isSenderIn ? '发货地' : ''}${!isSenderIn && !isRecipientIn ? '和' : ''}${!isRecipientIn ? '收货地' : ''}`
            )
          }
        }

        // ✅ 计算发货地到收货地的距离
        const senderPoint: [number, number] = [order.sender.lng, order.sender.lat]
        const recipientPoint: [number, number] = [order.address.lng, order.address.lat]
        const distance = getDistance(senderPoint, recipientPoint)

        // ✅ 根据距离智能选择配送时效
        deliveryDays = this.selectDeliveryTime(rule, distance)
        deliveryCompany = rule.company || '默认快递'

        if (process.env.NODE_ENV !== 'production') {
          console.log(`[Ship] Order ${orderId}: Distance=${(distance / 1000).toFixed(2)}km, DeliveryTime=${deliveryDays}, Company=${deliveryCompany}`);
        }
      }
    }

    // 先更新状态为已揽收
    await orderRepository.updateStatus(orderId, 'picked')
    
    // 同时更新 shipped_at 字段
    await pool.query(
      'UPDATE orders SET shipped_at = NOW() WHERE id = ?',
      [orderId]
    )

    // 发送已揽收状态
    let updatedOrder = await orderRepository.findById(orderId)
    io.to(`order:${orderId}`).emit('status:update', {
      orderId,
      status: 'picked',
      ts: Date.now(),
      shippedAt: updatedOrder?.shippedAt,
      inTransitAt: updatedOrder?.inTransitAt,
      arrivedAtHubAt: updatedOrder?.arrivedAtHubAt,
      outForDeliveryAt: updatedOrder?.outForDeliveryAt,
      signedAt: updatedOrder?.signedAt
    })

    // 短暂延迟后更新为运输中
    await new Promise(resolve => setTimeout(resolve, 500))
    await orderRepository.updateStatus(orderId, 'in_transit')
    updatedOrder = await orderRepository.findById(orderId)
    
    const statusUpdatePayload = {
      orderId,
      status: 'in_transit',
      ts: Date.now(),
      shippedAt: updatedOrder?.shippedAt,
      inTransitAt: updatedOrder?.inTransitAt,
      arrivedAtHubAt: updatedOrder?.arrivedAtHubAt,
      outForDeliveryAt: updatedOrder?.outForDeliveryAt,
      signedAt: updatedOrder?.signedAt
    }
    
    console.log('[OrderService] ===== Sending Initial Status Update =====')
    console.log('[OrderService] Order ID:', orderId)
    console.log('[OrderService] Status:', statusUpdatePayload.status)
    console.log('[OrderService] shippedAt:', statusUpdatePayload.shippedAt, 'type:', typeof statusUpdatePayload.shippedAt)
    console.log('[OrderService] inTransitAt:', statusUpdatePayload.inTransitAt, 'type:', typeof statusUpdatePayload.inTransitAt)
    console.log('[OrderService] Full payload:', JSON.stringify(statusUpdatePayload, null, 2))
    
    io.to(`order:${orderId}`).emit('status:update', statusUpdatePayload)
    
    console.log('[OrderService] ===== Status Update Sent =====')

    if (process.env.NODE_ENV !== 'production') {
      console.log(`Shipping order ${orderId} with rule ${ruleId}, delivery days: ${deliveryDays}`);
    }

    // 规划路线
    const sender = { lat: order.sender.lat, lng: order.sender.lng }
    const recipient = { lat: order.address.lat, lng: order.address.lng }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Ship] Planning route for Order ${orderId} from ${sender.lat},${sender.lng} to ${recipient.lat},${recipient.lng}`);
    }

    let routePath: {lat: number, lng: number}[] = []
    let hub: any = null

    // 检查是否需要经过中转站 (北京、广州)
    try {
      const [hubs] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM transit_hubs WHERE ? LIKE CONCAT('%', city_keyword, '%') LIMIT 1`,
        [order.address.text]
      )

      if (hubs.length > 0) {
        hub = hubs[0]
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[Ship] Order ${orderId} routing through hub: ${hub.name}`);
        }
        
        // 第一程：发货地 -> 中转站
        routePath = await getDrivingPath(sender, { lat: hub.lat, lng: hub.lng })
      } else {
        routePath = await getDrivingPath(sender, recipient)
      }
    } catch (error) {
      console.error('Error checking transit hubs:', error)
      // 降级处理：直接规划
      routePath = await getDrivingPath(sender, recipient)
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Ship] Route planned with ${routePath.length} points`);
    }

    const routePathJson = JSON.stringify(routePath)

    // 保存初始追踪信息
    try {
      await pool.query(
        `INSERT INTO order_tracking (
          order_id, lat, lng, ts, shipped_at, delivery_days, route_path
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?)
        ON DUPLICATE KEY UPDATE 
          lat = VALUES(lat), 
          lng = VALUES(lng), 
          ts = VALUES(ts), 
          route_path = VALUES(route_path)`,
        [orderId, sender.lat, sender.lng, Date.now(), deliveryDays, routePathJson]
      )
    } catch (e) {
      console.error('Failed to save initial track point', e)
    }

    // 启动模拟
    startSimulation(
      orderId,
      io,
      routePath,
      async (point) => {
        // 保存轨迹点
        try {
          await pool.query(
            `INSERT INTO order_tracking (order_id, lat, lng, ts, shipped_at, delivery_days, route_path) 
             VALUES (?, ?, ?, ?, NOW(), ?, ?)
             ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng), ts = VALUES(ts), route_path = VALUES(route_path)`,
            [point.orderId, point.lat, point.lng, point.ts, deliveryDays, routePathJson]
          )
        } catch (e) {
          console.error('Failed to save track point', e)
        }
      },
      async () => {
        // 如果有中转站，且当前是第一程
        if (hub) {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[Ship] Order ${orderId} arrived at hub ${hub.name}. Waiting 10s for processing...`);
          }
          
          // 增加 10秒 延迟，模拟卸货/入库等待
          setTimeout(async () => {
            // 1. 更新状态为 arrived_at_hub
            await orderRepository.updateStatus(orderId, 'arrived_at_hub')
            // 查询更新后的订单数据,获取最新时间戳
            const updatedOrder = await orderRepository.findById(orderId)
            // 修正事件名称为 status:update 以匹配前端 useTracking.ts
            io.to(`order:${orderId}`).emit('status:update', { 
              orderId, 
              status: 'arrived_at_hub', 
              ts: Date.now(),
              shippedAt: updatedOrder?.shippedAt,
              inTransitAt: updatedOrder?.inTransitAt,
              arrivedAtHubAt: updatedOrder?.arrivedAtHubAt,
              outForDeliveryAt: updatedOrder?.outForDeliveryAt,
              signedAt: updatedOrder?.signedAt
            })

            // 2. 检查堆积数量
            // 这里简单通过城市关键字来匹配同属该中转站的订单
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT o.id FROM orders o 
                 JOIN transit_hubs th ON o.address_text LIKE CONCAT('%', th.city_keyword, '%')
                 WHERE o.status = 'arrived_at_hub' AND th.id = ?`,
                [hub.id]
            )
            
            const pendingOrders = rows.map(r => r.id)
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[Hub] ${hub.name} has ${pendingOrders.length} orders pending.`);
            }

            if (pendingOrders.length >= 3) {
                console.log(`[Hub] Triggering batch dispatch for ${pendingOrders.length} orders.`);
                // 批量派送 (智能规划)
                this.dispatchBatch(hub, pendingOrders, io)
            }
          }, 10000)

        } else {
          // 直发模式：到达即签收
          await orderRepository.updateStatus(orderId, 'signed')
          // 确保位置更新为终点
          await pool.query(
            `UPDATE order_tracking SET lat = ?, lng = ?, ts = ? WHERE order_id = ?`,
            [recipient.lat, recipient.lng, Date.now(), orderId]
          )
          // 查询更新后的订单数据,获取最新时间戳
          const updatedOrder = await orderRepository.findById(orderId)
          io.to(`order:${orderId}`).emit('status:update', { 
            orderId, 
            status: 'signed', 
            ts: Date.now(),
            shippedAt: updatedOrder?.shippedAt,
            inTransitAt: updatedOrder?.inTransitAt,
            arrivedAtHubAt: updatedOrder?.arrivedAtHubAt,
            outForDeliveryAt: updatedOrder?.outForDeliveryAt,
            signedAt: updatedOrder?.signedAt
          })
        }
      },
      async (statusState) => {
        // 查询最新订单数据以获取所有时间戳
        const updatedOrder = await orderRepository.findById(orderId)
        io.to(`order:${orderId}`).emit('status:update', { 
          ...statusState, 
          orderId,
          shippedAt: updatedOrder?.shippedAt,
          inTransitAt: updatedOrder?.inTransitAt,
          arrivedAtHubAt: updatedOrder?.arrivedAtHubAt,
          outForDeliveryAt: updatedOrder?.outForDeliveryAt,
          signedAt: updatedOrder?.signedAt
        })
      },
      undefined,
      deliveryDays 
    )

    return { ok: true }
  }

  /**
   * 批量智能调度 (TSP 贪心算法)
   */
  async dispatchBatch(hub: any, orderIds: string[], io: Server) {
    try {
      // 1. 获取所有订单详情
      const orders = []
      for (const oid of orderIds) {
        const o = await orderRepository.findById(oid)
        if (o) orders.push(o)
      }

      if (orders.length === 0) return

      // 2. 贪心算法规划顺序
      // 起点是 Hub
      let currentPoint: [number, number] = [hub.lng, hub.lat]
      const sortedOrders: any[] = []
      const remainingOrders = [...orders]

      while (remainingOrders.length > 0) {
        let nearestIndex = -1
        let minDistance = Infinity

        for (let i = 0; i < remainingOrders.length; i++) {
          const o = remainingOrders[i]
          const dist = getDistance(currentPoint, [o.address.lng, o.address.lat])
          if (dist < minDistance) {
            minDistance = dist
            nearestIndex = i
          }
        }

        if (nearestIndex !== -1) {
          const nextOrder = remainingOrders[nearestIndex]
          sortedOrders.push(nextOrder)
          currentPoint = [nextOrder.address.lng, nextOrder.address.lat]
          remainingOrders.splice(nearestIndex, 1)
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Batch] Optimized route order: ${sortedOrders.map(o => o.id).join(' -> ')}`)
      }

      // 3. 预先规划所有航段 (Segments)
      // Segment 0: Hub -> Order 1
      // Segment 1: Order 1 -> Order 2
      // ...
      const segments: { lat: number, lng: number }[][] = []
      let start = { lat: hub.lat, lng: hub.lng }
      
      for (const order of sortedOrders) {
          const end = { lat: order.address.lat, lng: order.address.lng }
          let path = await getDrivingPath(start, end)
          
          // 容错处理：如果规划失败，生成直线路径
          if (path.length === 0) {
             console.warn(`[Batch] Failed to plan path for order ${order.id}, using straight line.`)
             path = [start, end]
          }
          
          segments.push(path)
          start = end
      }

      // 4. 更新每个订单的完整路线 (Full Route)
      // 必须保留第一程 (Sender -> Hub) 的路线，否则用户会发现之前的路线消失了
      // 我们假设所有订单的第一程都是类似的 (Sender -> Hub)，或者我们需要分别获取
      // 为了准确，我们读取每个订单当前的 route_path
      
      for (let i = 0; i < sortedOrders.length; i++) {
          const order = sortedOrders[i]
          const segment = segments[i]
          
          // 获取当前已有的路径 (Sender -> Hub)
          let existingPath: { lat: number, lng: number }[] = []
          try {
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT route_path FROM order_tracking WHERE order_id = ?`,
                [order.id]
            )
            if (rows.length > 0 && rows[0].route_path) {
                existingPath = typeof rows[0].route_path === 'string' 
                    ? JSON.parse(rows[0].route_path) 
                    : rows[0].route_path
            }
          } catch (e) {
            console.error(`[Batch] Failed to fetch existing path for order ${order.id}`, e)
          }

          // 拼接：第一程 + (Hub -> A -> ... -> Current)
          // 注意：accumulatedPath 是从 Hub 开始的累积路径
          // 我们需要为当前订单构建：Existing(Sender->Hub) + Segment(Hub->Order)
          // 但对于后续订单，比如 B，它需要 Existing(Sender->Hub) + Segment(Hub->A) + Segment(A->B)
          
          // 重新构建累积逻辑：
          // 对于 sortedOrders[i]，它的完整路径 = 它的第一程 + segments[0] + ... + segments[i]
          
          let fullPath = [...existingPath]
          for (let j = 0; j <= i; j++) {
              fullPath = [...fullPath, ...segments[j]]
          }
          
          // 更新数据库
          const routePathJson = JSON.stringify(fullPath)
          await pool.query(`UPDATE order_tracking SET route_path = ? WHERE order_id = ?`, [routePathJson, order.id])
          
          // 推送路线更新给前端 (使用房间推送，避免广播)
          io.to(`order:${order.id}`).emit('order:route_update', { orderId: order.id, routePath: fullPath })
      }

      // 模拟中转站分拣耗时 (5秒)，让前端有时间显示 "到达中转站" 状态
      setTimeout(async () => {
          // 5. 更新状态为 out_for_delivery
          for (const o of sortedOrders) {
            await orderRepository.updateStatus(o.id, 'out_for_delivery')
            // 查询更新后的订单数据,获取最新时间戳
            const updatedOrder = await orderRepository.findById(o.id)
            // 修正事件名称为 status:update
            io.to(`order:${o.id}`).emit('status:update', { 
              orderId: o.id, 
              status: 'out_for_delivery', 
              ts: Date.now(),
              shippedAt: updatedOrder?.shippedAt,
              inTransitAt: updatedOrder?.inTransitAt,
              arrivedAtHubAt: updatedOrder?.arrivedAtHubAt,
              outForDeliveryAt: updatedOrder?.outForDeliveryAt,
              signedAt: updatedOrder?.signedAt
            })
          }

          // 6. 开始执行链式模拟
          this.runChainSimulation(sortedOrders, segments, 0, io)
      }, 5000)

    } catch (error) {
      console.error('[Batch] Dispatch failed', error)
    }
  }

  /**
   * 执行链式模拟 (递归)
   */
  private async runChainSimulation(
    sortedOrders: any[], 
    segments: { lat: number, lng: number }[][],
    currentIndex: number, 
    io: Server
  ) {
    if (currentIndex >= sortedOrders.length) return

    const currentOrder = sortedOrders[currentIndex]
    const currentSegment = segments[currentIndex]

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Batch] Simulating leg ${currentIndex + 1} for Order ${currentOrder.id}`);
    }

    // 启动模拟
    startSimulation(
      currentOrder.id,
      io,
      currentSegment,
      async (point) => {
        // 回调：更新当前订单位置
        try {
            await pool.query(
              `UPDATE order_tracking SET lat = ?, lng = ?, ts = ? WHERE order_id = ?`,
              [point.lat, point.lng, point.ts, currentOrder.id]
            )
            
            // 关键：同时更新后续所有订单的位置！让它们也能看到车在动
            // 比如车在送 A 的路上，B 和 C 的用户也应该看到车的位置更新
            for (let i = currentIndex + 1; i < sortedOrders.length; i++) {
                const nextOrder = sortedOrders[i]
                await pool.query(
                  `UPDATE order_tracking SET lat = ?, lng = ?, ts = ? WHERE order_id = ?`,
                  [point.lat, point.lng, point.ts, nextOrder.id]
                )
                // 推送实时位置给后续订单的前端 (使用房间推送)
                // 注意：只推送位置更新，不推送状态更新，保持后续订单处于 out_for_delivery 状态
                io.to(`order:${nextOrder.id}`).emit('track:update', { 
                  orderId: nextOrder.id,
                  lat: point.lat, 
                  lng: point.lng, 
                  ts: point.ts 
                })
            }
            
        } catch (e) {
            console.error(e)
        }
      },
      async () => {
        // 当前段结束
        // 增加一个缓冲时间，确保车辆到达动画播放完毕后再签收
        setTimeout(async () => {
            // 1. 签收当前订单
            await orderRepository.updateStatus(currentOrder.id, 'signed')
            // 确保位置更新为该订单的终点
            await pool.query(
              `UPDATE order_tracking SET lat = ?, lng = ?, ts = ? WHERE order_id = ?`,
              [currentOrder.address.lat, currentOrder.address.lng, Date.now(), currentOrder.id]
            )
            // 查询更新后的订单数据,获取最新时间戳
            const updatedOrder = await orderRepository.findById(currentOrder.id)
            // 修正事件名称为 status:update
            io.to(`order:${currentOrder.id}`).emit('status:update', { 
              orderId: currentOrder.id, 
              status: 'signed', 
              ts: Date.now(),
              shippedAt: updatedOrder?.shippedAt,
              inTransitAt: updatedOrder?.inTransitAt,
              arrivedAtHubAt: updatedOrder?.arrivedAtHubAt,
              outForDeliveryAt: updatedOrder?.outForDeliveryAt,
              signedAt: updatedOrder?.signedAt
            })
            
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[Batch] Order ${currentOrder.id} delivered. Moving to next.`);
            }

            // 2. 递归执行下一段
            this.runChainSimulation(sortedOrders, segments, currentIndex + 1, io)
        }, 2000)
      },
      async (statusState) => {
         // 查询最新订单数据以获取所有时间戳
         const updatedOrder = await orderRepository.findById(currentOrder.id)
         io.to(`order:${currentOrder.id}`).emit('status:update', { 
           ...statusState, 
           orderId: currentOrder.id,
           shippedAt: updatedOrder?.shippedAt,
           inTransitAt: updatedOrder?.inTransitAt,
           arrivedAtHubAt: updatedOrder?.arrivedAtHubAt,
           outForDeliveryAt: updatedOrder?.outForDeliveryAt,
           signedAt: updatedOrder?.signedAt
         })
      },
      undefined,
      '1.5天' // 第二段配送固定使用3天时效 (3天 * 10秒/天 = 30秒)
    )
  }

  /**
   * 获取订单追踪信息
   */
  async getOrderTracking(orderId: string) {
    const tracking = await orderRepository.findTracking(orderId)
    if (!tracking) {
      throw new Error('暂无物流信息')
    }

    // 补充中转站信息
    const order = await orderRepository.findById(orderId)
    if (order && order.address && order.address.text) {
       const [hubs] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM transit_hubs WHERE ? LIKE CONCAT('%', city_keyword, '%') LIMIT 1`,
        [order.address.text]
      )
      if (hubs.length > 0) {
        tracking.hub = {
          lat: hubs[0].lat,
          lng: hubs[0].lng,
          name: hubs[0].name
        }
      }
    }

    return tracking
  }

  /**
   * 批量发货
   */
  async batchShipOrders(orderIds: string[], ruleId: number | undefined, io: Server) {
    const results: any[] = []

    for (const orderId of orderIds) {
      try {
        await this.shipOrder(orderId, ruleId, io)
        results.push({ orderId, success: true })
      } catch (error: any) {
        results.push({ orderId, success: false, error: error.message })
      }
    }

    return results
  }
}

export default new OrderService()
