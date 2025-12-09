import { useState, useMemo, useCallback } from 'react'
import { api } from '../services/api'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import 'dayjs/locale/zh-cn'

// 扩展 dayjs 插件，用于判断日期是否在范围内
dayjs.extend(isBetween)
dayjs.locale('zh-cn')

export const useDataDashboard = () => {
  // 状态管理：时间范围筛选
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'custom'>('week')
  const [customRange, setCustomRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  // 从 API 获取当前商家的订单数据（需要权限控制）
  const { data: ordersData, isLoading } = api.useGetMyOrdersQuery({})

  // 使用 useMemo 缓存订单列表，避免每次渲染都重新计算
  const orders = useMemo(() => ordersData?.data || [], [ordersData])

  // 辅助函数：根据选择的时间范围（日/周/月）计算具体的开始和结束日期
  // offset 参数用于计算“上一周期”，比如 offset=1 表示上周/上月
  const getDateRange = useCallback(
    (range: 'day' | 'week' | 'month' | 'custom', offset = 0) => {
      const now = dayjs()

      if (range === 'custom' && customRange) {
        // 对于自定义范围，我们暂时不支持通用的“上一周期”比较
        // 所以为了简单起见，如果 offset > 0，我们可能会返回相同的范围或计算偏移量
        if (offset > 0) {
          const diff = customRange[1].diff(customRange[0], 'day') + 1
          return {
            start: customRange[0].subtract(diff, 'day'),
            end: customRange[1].subtract(diff, 'day'),
          }
        }
        return {
          start: customRange[0].startOf('day'),
          end: customRange[1].endOf('day'),
        }
      }

      if (range === 'day') {
        return {
          start: now.subtract(offset, 'day').startOf('day'),
          end: now.subtract(offset, 'day').endOf('day'),
        }
      }
      if (range === 'week') {
        // 如果需要，调整为从周一开始，但默认是周日
        return {
          start: now.subtract(offset, 'week').startOf('week'),
          end: now.subtract(offset, 'week').endOf('week'),
        }
      }
      // 月
      return {
        start: now.subtract(offset, 'month').startOf('month'),
        end: now.subtract(offset, 'month').endOf('month'),
      }
    },
    [customRange]
  )

  // 核心逻辑：计算统计数据（收入、订单量、活跃用户等）
  const stats = useMemo(() => {
    // 1. 获取当前周期和上一周期的日期范围
    const currentRange = getDateRange(timeRange, 0)
    const prevRange = getDateRange(timeRange, 1)

    // 2. 筛选出当前周期的订单
    const currentOrders = orders.filter((o) =>
      dayjs(o.createdAt).isBetween(currentRange.start, currentRange.end, null, '[]')
    )
    // 3. 筛选出上一周期的订单（用于计算环比增长）
    const prevOrders = orders.filter((o) =>
      dayjs(o.createdAt).isBetween(prevRange.start, prevRange.end, null, '[]')
    )

    // 辅助函数：计算增长率
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    // 4. 计算各项指标
    const totalRevenue = currentOrders.reduce((acc, order) => acc + order.amount, 0)
    const prevRevenue = prevOrders.reduce((acc, order) => acc + order.amount, 0)

    const totalOrders = currentOrders.length
    const prevTotalOrders = prevOrders.length

    // 计算活跃用户数（不同的 userId）
    const activeUsers = new Set(currentOrders.map((o) => o.userId)).size
    const prevActiveUsers = new Set(prevOrders.map((o) => o.userId)).size

    // 计算平均配送时效（基于 deliveryDays）
    const parseDeliveryDays = (deliveryDays: any): number => {
      if (typeof deliveryDays === 'number') return deliveryDays
      if (typeof deliveryDays === 'string') {
        if (deliveryDays.includes('次日')) return 1
        const nums = deliveryDays.match(/\d+/g)
        if (nums && nums.length > 0) {
          // 取最大值，例如 "2-3天" 取 3
          return Math.max(...nums.map(Number))
        }
      }
      return 3 // 默认 3 天
    }

    const totalDeliveryDays = currentOrders.reduce(
      (sum, o) => sum + parseDeliveryDays(o.deliveryDays),
      0
    )
    const avgDeliveryDays = currentOrders.length > 0 ? totalDeliveryDays / currentOrders.length : 0
    const avgDeliveryTime = avgDeliveryDays > 0 ? `${avgDeliveryDays.toFixed(1)} 天` : '0 天'

    // 计算上周期的平均配送时效用于趋势
    const prevTotalDeliveryDays = prevOrders.reduce(
      (sum, o) => sum + parseDeliveryDays(o.deliveryDays),
      0
    )
    const prevAvgDeliveryDays =
      prevOrders.length > 0 ? prevTotalDeliveryDays / prevOrders.length : 0

    return {
      totalRevenue,
      totalOrders,
      activeUsers,
      avgDeliveryTime,
      revenueTrend: calculateGrowth(totalRevenue, prevRevenue),
      ordersTrend: calculateGrowth(totalOrders, prevTotalOrders),
      usersTrend: calculateGrowth(activeUsers, prevActiveUsers),
      deliveryTrend: calculateGrowth(prevAvgDeliveryDays, avgDeliveryDays), // 注意：时效越短越好，所以反向
    }
  }, [orders, timeRange, getDateRange])

  // 图表 1：订单量趋势（折线图）- 根据时间范围调整
  const orderTrendData = useMemo(() => {
    let dates: string[] = []
    let format = 'MM-DD'

    if (timeRange === 'day') {
      // 当天按小时统计
      format = 'HH:00'
      dates = Array.from({ length: 24 }, (_, i) =>
        dayjs().startOf('day').add(i, 'hour').format(format)
      )
    } else if (timeRange === 'week') {
      // 自然周（周一到周日）
      const startOfWeek = dayjs().startOf('week')
      dates = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day').format(format))
    } else if (timeRange === 'month') {
      // 当月按天统计（简化为过去30天）
      dates = Array.from({ length: 30 }, (_, i) =>
        dayjs()
          .subtract(29 - i, 'day')
          .format(format)
      )
    } else if (timeRange === 'custom' && customRange) {
      const start = customRange[0]
      const end = customRange[1]
      const diffDays = end.diff(start, 'day') + 1

      if (diffDays <= 1) {
        // 如果是1天或更少，按小时显示
        format = 'HH:00'
        dates = Array.from({ length: 24 }, (_, i) =>
          start.startOf('day').add(i, 'hour').format(format)
        )
      } else {
        // 按天显示
        dates = Array.from({ length: diffDays }, (_, i) => start.add(i, 'day').format(format))
      }
    } else {
      // 兜底逻辑
      dates = Array.from({ length: 7 }, (_, i) =>
        dayjs()
          .subtract(6 - i, 'day')
          .format(format)
      )
    }

    const counts = dates.map((date) => {
      return orders.filter((o) => {
        if (
          timeRange === 'day' ||
          (timeRange === 'custom' && customRange && customRange[1].diff(customRange[0], 'day') < 1)
        ) {
          // 按小时比较
          const orderDate = dayjs(o.createdAt)
          const isSameDay =
            timeRange === 'day'
              ? orderDate.isSame(dayjs(), 'day')
              : orderDate.isSame(customRange![0], 'day')
          return orderDate.format('HH:00') === date && isSameDay
        }
        return dayjs(o.createdAt).format('MM-DD') === date
      }).length
    })

    return {
      dates,
      counts,
    }
  }, [orders, timeRange, customRange])

  // 图表 2：收入趋势（柱状图）
  const revenueChartData = useMemo(() => {
    let dates: string[] = []
    let format = 'MM-DD'

    // 复用日期生成逻辑 (为了保持一致性，这里重复一遍逻辑)
    if (timeRange === 'day') {
      format = 'HH:00'
      dates = Array.from({ length: 24 }, (_, i) =>
        dayjs().startOf('day').add(i, 'hour').format(format)
      )
    } else if (timeRange === 'week') {
      const startOfWeek = dayjs().startOf('week')
      dates = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day').format(format))
    } else if (timeRange === 'month') {
      dates = Array.from({ length: 30 }, (_, i) =>
        dayjs()
          .subtract(29 - i, 'day')
          .format(format)
      )
    } else if (timeRange === 'custom' && customRange) {
      const start = customRange[0]
      const end = customRange[1]
      const diffDays = end.diff(start, 'day') + 1

      if (diffDays <= 1) {
        format = 'HH:00'
        dates = Array.from({ length: 24 }, (_, i) =>
          start.startOf('day').add(i, 'hour').format(format)
        )
      } else {
        dates = Array.from({ length: diffDays }, (_, i) => start.add(i, 'day').format(format))
      }
    } else {
      dates = Array.from({ length: 7 }, (_, i) =>
        dayjs()
          .subtract(6 - i, 'day')
          .format(format)
      )
    }

    const values = dates.map((date) => {
      const dayOrders = orders.filter((o) => {
        if (
          timeRange === 'day' ||
          (timeRange === 'custom' && customRange && customRange[1].diff(customRange[0], 'day') < 1)
        ) {
          const orderDate = dayjs(o.createdAt)
          const isSameDay =
            timeRange === 'day'
              ? orderDate.isSame(dayjs(), 'day')
              : orderDate.isSame(customRange![0], 'day')
          return orderDate.format('HH:00') === date && isSameDay
        }
        return dayjs(o.createdAt).format('MM-DD') === date
      })
      return dayOrders.reduce((sum, order) => sum + order.amount, 0)
    })

    return {
      categories: dates,
      values,
    }
  }, [orders, timeRange, customRange])

  // 图表 3：异常原因分布（饼图）
  const abnormalStats = useMemo(() => {
    // 逻辑：配送时间 > 承诺时间（deliveryDays）
    const abnormalList = orders.filter((o: any) => {
      // 解析承诺时效，例如 "1-2天" -> 2, "次日达" -> 1
      let promiseDays = 3
      if (o.deliveryDays) {
        if (typeof o.deliveryDays === 'number') {
          promiseDays = o.deliveryDays
        } else if (typeof o.deliveryDays === 'string') {
          if (o.deliveryDays.includes('次日')) promiseDays = 1
          else {
            const nums = o.deliveryDays.match(/\d+/g)
            if (nums && nums.length > 0) {
              promiseDays = Math.max(...nums.map(Number))
            }
          }
        }
      }

      // 确定计算起点：优先使用发货时间，如果没有则使用创建时间
      const startTime = o.shippedAt ? dayjs(o.shippedAt) : dayjs(o.createdAt)
      // 确定计算终点：优先使用最后轨迹时间（签收或最新状态），如果没有则使用当前时间
      const endTime = o.lastTrackTime ? dayjs(o.lastTrackTime) : dayjs()

      const elapsedDays = endTime.diff(startTime, 'day', true)
      // 这里我们主要监控未完成的超时订单，或者已完成但超时的订单
      // 用户要求：根据 order_tracking 中的信息判断
      // 修改：只要超时了，无论是否签收，都算作异常记录（历史异常+当前异常）
      const isTimeout = elapsedDays > promiseDays
      return isTimeout
    })

    const reasons = {
      配送超时: 0,
      地址无法送达: 0,
      客户拒收: 0,
      包裹破损: 0,
      其他原因: 0,
    }

    abnormalList.forEach((_) => {
      // 目前我们仅根据需求检测超时
      // 未来：当后端支持时添加其他异常逻辑
      reasons['配送超时']++
    })

    return (
      Object.entries(reasons)
        // .filter(([_, value]) => value > 0) // 即使为0也保持所有类别在图例中可见
        .map(([name, value]) => ({ name, value }))
    )
  }, [orders])

  // 异常订单列表
  const abnormalOrders = useMemo(() => {
    return orders
      .filter((order: any) => {
        let promiseDays = 3
        if (order.deliveryDays) {
          if (typeof order.deliveryDays === 'number') {
            promiseDays = order.deliveryDays
          } else if (typeof order.deliveryDays === 'string') {
            if (order.deliveryDays.includes('次日')) promiseDays = 1
            else {
              const nums = order.deliveryDays.match(/\d+/g)
              if (nums && nums.length > 0) {
                promiseDays = Math.max(...nums.map(Number))
              }
            }
          }
        }

        const startTime = order.shippedAt ? dayjs(order.shippedAt) : dayjs(order.createdAt)
        const endTime = order.lastTrackTime ? dayjs(order.lastTrackTime) : dayjs()
        const elapsedDays = endTime.diff(startTime, 'day', true)

        // 修改：只要超时了，无论是否签收，都算作异常记录
        const isTimeout = elapsedDays > promiseDays
        return isTimeout
      })
      .map((o: any) => {
        let promiseDays = 3
        if (o.deliveryDays) {
          if (typeof o.deliveryDays === 'number') {
            promiseDays = o.deliveryDays
          } else if (typeof o.deliveryDays === 'string') {
            if (o.deliveryDays.includes('次日')) promiseDays = 1
            else {
              const nums = o.deliveryDays.match(/\d+/g)
              if (nums && nums.length > 0) {
                promiseDays = Math.max(...nums.map(Number))
              }
            }
          }
        }

        const startTime = o.shippedAt ? dayjs(o.shippedAt) : dayjs(o.createdAt)
        const endTime = o.lastTrackTime ? dayjs(o.lastTrackTime) : dayjs()
        const elapsedDays = endTime.diff(startTime, 'day', true)

        return {
          ...o,
          exceptionReason: `超时 (已用${elapsedDays.toFixed(1)}天 / 限${promiseDays}天)`,
        }
      })
      .slice(0, 5)
  }, [orders])

  // 图表 4：城市分布（柱状图）
  const cityDistribution = useMemo(() => {
    const currentRange = getDateRange(timeRange, 0)
    const relevantOrders = orders.filter((o) =>
      dayjs(o.createdAt).isBetween(currentRange.start, currentRange.end, null, '[]')
    )

    const cityMap: Record<string, number> = {}
    relevantOrders.forEach((o) => {
      // 从地址中提取城市（简单启发式：前2-3个字符）
      // 例如 "北京市..." -> "北京", "Shanghai..." -> "Shanghai"
      const addr = o.address.text
      let city = '未知'
      if (addr.includes('省')) {
        city = addr.split('省')[1]?.split('市')[0] + '市' || addr.substring(0, 2)
      } else if (addr.includes('市')) {
        city = addr.split('市')[0] + '市'
      } else {
        city = addr.substring(0, 2)
      }

      if (city) cityMap[city] = (cityMap[city] || 0) + 1
    })

    const sorted = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // 前 10 名

    return {
      cities: sorted.map((s) => s[0]),
      values: sorted.map((s) => s[1]),
    }
  }, [orders, timeRange, getDateRange])

  // 图表 5：下单时间热力图（星期 x 小时）
  const timeHeatmapData = useMemo(() => {
    const currentRange = getDateRange(timeRange, 0)
    const relevantOrders = orders.filter((o) =>
      dayjs(o.createdAt).isBetween(currentRange.start, currentRange.end, null, '[]')
    )

    // 7 天 x 24 小时
    // x: 小时 (0-23), y: 天 (0-6, 周日-周六)
    const data: [number, number, number][] = [] // [y, x, 值]
    const map: Record<string, number> = {}

    relevantOrders.forEach((o) => {
      const d = dayjs(o.createdAt)
      const day = d.day() // 0 (周日) - 6 (周六)
      const hour = d.hour() // 0-23
      const key = `${day}-${hour}`
      map[key] = (map[key] || 0) + 1
    })

    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const val = map[`${d}-${h}`] || 0
        if (val > 0) data.push([h, d, val])
      }
    }
    return data
  }, [orders, timeRange, getDateRange])

  return {
    stats,
    orderTrendData,
    revenueChartData,
    abnormalStats,
    abnormalOrders,
    cityDistribution,
    timeHeatmapData,
    isLoading,
    timeRange,
    setTimeRange,
    customRange,
    setCustomRange,
  }
}
