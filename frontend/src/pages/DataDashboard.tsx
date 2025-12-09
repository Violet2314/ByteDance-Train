import React, { memo, useEffect, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import AMapLoader from '@amap/amap-jsapi-loader'
import { useDataDashboard } from '../hooks/useDataDashboard'
import dayjs from 'dayjs'
import { FullscreenExitOutlined, CalendarOutlined, FullscreenOutlined } from '@ant-design/icons'
import { Button, Tooltip, DatePicker, Radio, ConfigProvider, theme, Table, Tag } from 'antd'
import { Package, Users, DollarSign, Activity, Truck, AlertTriangle } from 'lucide-react'
import { StatCard } from '../components/business/StatCard'

const { RangePicker } = DatePicker

// --- 组件：科技感边框容器 (Glassmorphism) ---
const TechPanel = ({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) => (
  <div
    className={`relative flex flex-col bg-[#0f1423]/60 border border-[#1e293b]/50 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl ${className}`}
  >
    {/* 装饰角标 */}
    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400/80 rounded-tl-md"></div>
    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400/80 rounded-tr-md"></div>
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400/80 rounded-bl-md"></div>
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400/80 rounded-br-md"></div>

    {/* 标题栏 */}
    <div className="flex items-center px-4 py-3 border-b border-[#1e293b]/50 bg-gradient-to-r from-[#1e293b]/80 to-transparent">
      <div className="w-1 h-4 bg-cyan-400 mr-3 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
      <h3 className="text-cyan-50 font-bold tracking-wider text-sm md:text-base uppercase text-shadow-sm">
        {title}
      </h3>
    </div>

    {/* 内容区 */}
    <div className="flex-1 p-4 min-h-0 overflow-hidden relative">{children}</div>
  </div>
)

// --- 组件：核心指标卡片 ---
const MetricCard = ({
  label,
  value,
  unit = '',
  trend,
}: {
  label: string
  value: string | number
  unit?: string
  trend?: string
}) => (
  <div className="flex flex-col justify-center items-center bg-[#0f1423]/70 border border-[#1e293b]/50 backdrop-blur-sm p-4 rounded-xl min-w-[140px] shadow-lg hover:bg-[#1e293b]/60 transition-all cursor-default group">
    <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider group-hover:text-cyan-300 transition-colors">
      {label}
    </div>
    <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline">
      <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
        {value}
      </span>
      <span className="text-xs text-gray-500 ml-1 font-normal">{unit}</span>
    </div>
    {trend && (
      <div
        className={`text-xs mt-2 font-mono ${Number(trend) >= 0 ? 'text-green-400' : 'text-red-400'}`}
      >
        {Number(trend) >= 0 ? '↑' : '↓'} {Math.abs(Number(trend))}% 同比
      </div>
    )}
  </div>
)

const CyberpunkDashboard = memo(function CyberpunkDashboard({ onExit }: { onExit: () => void }) {
  const {
    stats,
    orderTrendData,
    revenueChartData,
    abnormalStats,
    cityDistribution,
    timeRange,
    setTimeRange,
    customRange,
    setCustomRange,
  } = useDataDashboard()

  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'))
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 初始化地图
  useEffect(() => {
    if (!mapContainerRef.current) return

    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY,
      version: '2.0',
      plugins: [
        'AMap.Scale',
        'AMap.ToolBar',
        'AMap.ControlBar',
        'AMap.DistrictSearch',
        'AMap.MoveAnimation',
      ],
    })
      .then((AMap) => {
        if (mapInstanceRef.current) return

        const map = new AMap.Map(mapContainerRef.current, {
          viewMode: '3D',
          pitch: 50,
          zoom: 4.2,
          center: [108.0, 34.0], // 中国中心
          mapStyle: 'amap://styles/darkblue', // 深色地图样式
          skyColor: '#0f1423', // 天空颜色与背景融合
          showLabel: true, // 显示标签
          dragEnable: true, // 允许拖拽
          zoomEnable: true, // 允许缩放
          rotateEnable: true, // 允许旋转
          pitchEnable: true, // 允许倾斜
        })

        mapInstanceRef.current = map

        // --- 地图内容增强 ---

        // 1. 核心枢纽标记 (真实数据)
        const hubs = [
          { name: '北京顺义分拨中心', position: [116.606786, 40.128508] },
          { name: '广州白云分拨中心', position: [113.384472, 23.292776] },
        ]

        hubs.forEach((hub) => {
          // 中心点
          const marker = new AMap.Marker({
            position: hub.position,
            content: `<div style="position: relative; width: 20px; height: 20px;">
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; box-shadow: 0 0 10px #22d3ee;"></div>
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; border: 1px solid #22d3ee; border-radius: 50%; animation: ripple 2s infinite;"></div>
                          </div>`,
            offset: new AMap.Pixel(-10, -10),
            map: map,
          })

          // 文本标签
          const text = new AMap.Text({
            text: hub.name,
            anchor: 'bottom-center',
            position: hub.position,
            offset: new AMap.Pixel(0, -15),
            style: {
              'background-color': 'rgba(15, 20, 35, 0.8)',
              border: '1px solid #22d3ee',
              color: '#fff',
              'font-size': '12px',
              padding: '2px 5px',
              'border-radius': '4px',
            },
            map: map,
          })
        })

        // 2. 模拟飞线 (连接各枢纽)
        // 由于只有两个点，直接连接它们
        if (hubs.length >= 2) {
          new AMap.Polyline({
            path: [hubs[0].position, hubs[1].position],
            strokeColor: '#22d3ee',
            strokeWeight: 2,
            strokeOpacity: 0.6,
            strokeStyle: 'dashed',
            map: map,
          })
        }
      })
      .catch((e) => {
        console.error('Map load failed', e)
      })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // --- ECharts 配置 (深色主题增强版) ---

  // 1. 订单趋势 (折线图 - 霓虹风格)
  const trendOption = React.useMemo(
    () => ({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 20, 35, 0.9)',
        borderColor: '#22d3ee',
        textStyle: { color: '#fff' },
        axisPointer: { type: 'line', lineStyle: { color: '#22d3ee', type: 'dashed' } },
      },
      grid: { top: '15%', left: '2%', right: '4%', bottom: '0%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: orderTrendData.dates,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed', opacity: 0.5 } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      series: [
        {
          name: '订单量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#22d3ee', borderColor: '#fff', borderWidth: 2 },
          lineStyle: {
            width: 3,
            color: '#22d3ee',
            shadowColor: 'rgba(34, 211, 238, 0.5)',
            shadowBlur: 10,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(34, 211, 238, 0.4)' },
                { offset: 1, color: 'rgba(34, 211, 238, 0)' },
              ],
            },
          },
          data: orderTrendData.counts,
        },
      ],
    }),
    [orderTrendData]
  )

  // 2. 仓库发货 (横向柱状图 - 胶囊风格)
  const cityOption = React.useMemo(
    () => ({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 20, 35, 0.9)',
        borderColor: '#3b82f6',
        textStyle: { color: '#fff' },
      },
      grid: { top: '5%', left: '2%', right: '10%', bottom: '0%', containLabel: true },
      xAxis: { type: 'value', show: false },
      yAxis: {
        type: 'category',
        data: cityDistribution.cities.slice(0, 6),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#e2e8f0', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: cityDistribution.values.slice(0, 6),
          barWidth: 12,
          itemStyle: {
            borderRadius: 6,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#3b82f6' },
                { offset: 1, color: '#60a5fa' },
              ],
            },
          },
          label: { show: true, position: 'right', color: '#fff', formatter: '{c}' },
          showBackground: true,
          backgroundStyle: { color: 'rgba(255, 255, 255, 0.05)', borderRadius: 6 },
        },
      ],
    }),
    [cityDistribution]
  )

  // 3. 异常监控 (环形图 - 仪表盘风格)
  const abnormalOption = React.useMemo(
    () => ({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 20, 35, 0.9)',
        borderColor: '#ef4444',
        textStyle: { color: '#fff' },
      },
      legend: {
        bottom: '0%',
        left: 'center',
        textStyle: { color: '#94a3b8', fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          name: '异常分布',
          type: 'pie',
          radius: ['55%', '75%'],
          center: ['50%', '40%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 4, borderColor: '#0f1423', borderWidth: 3 },
          label: { show: false, position: 'center' },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold',
              color: '#fff',
              formatter: '{b}\n{d}%',
            },
            scale: true,
            scaleSize: 10,
          },
          data: abnormalStats.map((item, index) => ({
            ...item,
            itemStyle: { color: ['#ef4444', '#f59e0b', '#eab308', '#84cc16'][index % 4] },
          })),
        },
      ],
    }),
    [abnormalStats]
  )

  // 4. 收入趋势 (柱状图 - 极光风格)
  const revenueOption = React.useMemo(
    () => ({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 20, 35, 0.9)',
        borderColor: '#10b981',
        textStyle: { color: '#fff' },
      },
      grid: { top: '15%', left: '2%', right: '4%', bottom: '0%', containLabel: true },
      xAxis: {
        type: 'category',
        data: revenueChartData.categories,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed', opacity: 0.5 } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          data: revenueChartData.values,
          barWidth: '40%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#10b981' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.1)' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    }),
    [revenueChartData]
  )

  return (
    // 使用 fixed inset-0 覆盖整个屏幕，z-index 设为 50 确保在最上层
    <div className="fixed inset-0 z-50 bg-[#050505] text-white font-sans overflow-hidden flex flex-col">
      {/* 背景地图层 */}
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="w-full h-full bg-[#0f1423]" />
        {/* 径向渐变遮罩，让地图边缘变暗，突出中心 */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,#050505_100%)] opacity-80"></div>
      </div>

      {/* 顶部标题栏 (悬浮) */}
      <header className="relative z-10 h-20 flex-none flex items-center justify-between px-8 bg-gradient-to-b from-[#0f1423] to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/50 rounded flex items-center justify-center backdrop-blur">
            <div className="w-6 h-6 bg-cyan-400 rounded-sm shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-500 uppercase drop-shadow-lg">
              Logistics Pro
            </h1>
            <div className="text-[10px] text-cyan-400/70 tracking-[0.5em] uppercase">
              Global Supply Chain Command
            </div>
          </div>
        </div>

        {/* 顶部装饰线 */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

        <div className="flex items-center gap-6 pointer-events-auto">
          {/* 时间筛选器 */}
          <div className="flex items-center bg-[#0f1423]/80 border border-[#1e293b] rounded-lg p-1 backdrop-blur-sm">
            <Radio.Group
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value)
                if (e.target.value !== 'custom') setCustomRange(null)
              }}
              buttonStyle="solid"
              size="small"
              className="mr-2"
            >
              <Radio.Button
                value="day"
                className="!bg-transparent !border-none !text-gray-400 hover:!text-cyan-400 checked:!text-cyan-400 checked:!bg-cyan-900/30"
              >
                今日
              </Radio.Button>
              <Radio.Button
                value="week"
                className="!bg-transparent !border-none !text-gray-400 hover:!text-cyan-400 checked:!text-cyan-400 checked:!bg-cyan-900/30"
              >
                本周
              </Radio.Button>
              <Radio.Button
                value="month"
                className="!bg-transparent !border-none !text-gray-400 hover:!text-cyan-400 checked:!text-cyan-400 checked:!bg-cyan-900/30"
              >
                本月
              </Radio.Button>
            </Radio.Group>
            <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
              <RangePicker
                size="small"
                bordered={false}
                value={customRange}
                onChange={(dates) => {
                  if (dates) {
                    setCustomRange(dates as any)
                    setTimeRange('custom')
                  }
                }}
                className="w-48 !text-gray-300"
                suffixIcon={<CalendarOutlined className="text-gray-500" />}
              />
            </ConfigProvider>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-2xl font-mono font-bold text-white tracking-widest text-shadow">
              {currentTime.split(' ')[1]}
            </div>
            <div className="text-xs text-gray-400 font-mono">{currentTime.split(' ')[0]}</div>
          </div>
          <Tooltip title="退出大屏模式">
            <Button
              type="text"
              icon={<FullscreenExitOutlined className="text-xl text-gray-400 hover:text-white" />}
              onClick={onExit}
            />
          </Tooltip>
        </div>
      </header>

      {/* 主体内容层 (悬浮网格) */}
      <div className="relative z-10 flex-1 p-6 grid grid-cols-12 gap-6 pointer-events-none">
        {/* 左侧面板 */}
        <div className="col-span-3 flex flex-col gap-6 pointer-events-auto h-full">
          <TechPanel title="订单交付趋势" className="flex-1">
            <ReactECharts option={trendOption} style={{ height: '100%', width: '100%' }} />
          </TechPanel>
          <TechPanel title="区域发货排名" className="flex-1">
            <ReactECharts option={cityOption} style={{ height: '100%', width: '100%' }} />
          </TechPanel>
        </div>

        {/* 中间区域 (留空给地图，底部放指标) */}
        <div className="col-span-6 flex flex-col justify-end gap-6 pointer-events-none pb-6">
          {/* 核心指标卡片组 */}
          <div className="grid grid-cols-4 gap-4 pointer-events-auto">
            <MetricCard
              label="今日订单"
              value={stats.totalOrders}
              unit="单"
              trend={stats.ordersTrend.toFixed(1)}
            />
            <MetricCard
              label="实时收入"
              value={(stats.totalRevenue / 10000).toFixed(1)}
              unit="万"
              trend={stats.revenueTrend.toFixed(1)}
            />
            <MetricCard
              label="活跃用户"
              value={stats.activeUsers}
              unit="辆"
              trend={stats.usersTrend.toFixed(1)}
            />
            <MetricCard
              label="平均时效"
              value={stats.avgDeliveryTime}
              unit=""
              trend={stats.deliveryTrend.toFixed(1)}
            />
          </div>

          {/* 底部滚动消息 */}
          <div className="bg-[#0f1423]/80 border border-[#1e293b]/50 backdrop-blur rounded-lg p-3 flex items-center gap-4 pointer-events-auto">
            <div className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded animate-pulse">
              LIVE
            </div>
            <div className="flex-1 overflow-hidden whitespace-nowrap text-sm text-gray-300 font-mono">
              <span className="inline-block animate-marquee">
                [系统通知] 广州分拨中心处理能力达到峰值 (98%) ... 北京转运中心新增 3 条干线任务 ...
                订单 O20231205009 已签收 ...
              </span>
            </div>
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="col-span-3 flex flex-col gap-6 pointer-events-auto h-full">
          <TechPanel title="异常监控" className="h-1/3">
            <ReactECharts option={abnormalOption} style={{ height: '100%', width: '100%' }} />
          </TechPanel>
          <TechPanel title="收入构成" className="flex-1">
            <ReactECharts option={revenueOption} style={{ height: '100%', width: '100%' }} />
          </TechPanel>
          <TechPanel title="供应链健康度" className="h-1/4">
            <div className="flex items-center justify-center h-full relative">
              {/* 简单的 CSS 动画圆环 */}
              <div className="w-24 h-24 rounded-full border-4 border-[#1e293b] relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-t-green-500 border-r-green-500 border-b-transparent border-l-transparent rotate-45 animate-spin-slow"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white text-shadow">98</div>
                  <div className="text-[10px] text-gray-400 uppercase">Health</div>
                </div>
              </div>
            </div>
          </TechPanel>
        </div>
      </div>
    </div>
  )
})

const StandardDashboard = memo(function StandardDashboard({
  onEnterFullScreen,
}: {
  onEnterFullScreen: () => void
}) {
  // 从自定义 Hook 获取数据和状态
  const {
    stats,
    orderTrendData,
    revenueChartData,
    abnormalStats,
    abnormalOrders,
    cityDistribution,
    timeHeatmapData,
    timeRange,
    setTimeRange,
    customRange,
    setCustomRange,
  } = useDataDashboard()

  // --- ECharts 配置项 ---
  // 使用 useMemo 缓存配置对象，避免每次渲染都重新创建导致图表闪烁

  // 1. 订单量趋势图 (折线图)
  const lineOption = React.useMemo(
    () => ({
      tooltip: { trigger: 'axis' }, // 鼠标悬停显示数据
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }, // 图表边距
      xAxis: { type: 'category', boundaryGap: false, data: orderTrendData.dates },
      yAxis: { type: 'value' },
      series: [
        {
          name: '订单量',
          type: 'line',
          smooth: true, // 平滑曲线
          data: orderTrendData.counts,
          itemStyle: { color: '#74B868' },
          // 区域填充渐变色
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(116, 184, 104, 0.5)' },
                { offset: 1, color: 'rgba(116, 184, 104, 0.0)' },
              ],
            },
          },
        },
      ],
    }),
    [orderTrendData]
  )

  // 2. 收入趋势图 (柱状图)
  const barOption = React.useMemo(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: revenueChartData.categories },
      yAxis: { type: 'value' },
      series: [
        {
          name: '收入',
          type: 'bar',
          data: revenueChartData.values,
          itemStyle: { color: '#74B868', borderRadius: [4, 4, 0, 0] }, // 顶部圆角
          barWidth: '40%',
        },
      ],
    }),
    [revenueChartData]
  )

  // 3. 异常原因分布 (饼图)
  const pieOption = React.useMemo(
    () => ({
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', left: 'center' },
      series: [
        {
          name: '异常原因',
          type: 'pie',
          radius: ['40%', '70%'], // 环形图
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          labelLine: { show: false },
          data: abnormalStats,
        },
      ],
    }),
    [abnormalStats]
  )

  const cityOption = React.useMemo(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: cityDistribution.cities, inverse: true },
      series: [
        {
          name: '订单量',
          type: 'bar',
          data: cityDistribution.values,
          itemStyle: { color: '#F59E0B', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right' },
        },
      ],
    }),
    [cityDistribution]
  )

  const heatmapOption = React.useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}点`)
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return {
      tooltip: { position: 'top' },
      grid: { height: '70%', top: '10%' },
      xAxis: { type: 'category', data: hours, splitArea: { show: true } },
      yAxis: { type: 'category', data: days, splitArea: { show: true } },
      visualMap: {
        min: 0,
        max: Math.max(...timeHeatmapData.map((d) => d[2]), 5),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: { color: ['#f0f9ff', '#0ea5e9'] },
      },
      series: [
        {
          name: '下单热度',
          type: 'heatmap',
          data: timeHeatmapData,
          label: { show: false },
          itemStyle: {
            emphasis: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
          },
        },
      ],
    }
  }, [timeHeatmapData])

  return (
    <div className="space-y-8 p-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#74B868] mb-2">
            <Activity size={20} className="animate-pulse" />
            <span className="font-mono text-xs tracking-widest uppercase font-bold">实时分析</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#0B0F19] tracking-tight">
            数据
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B0F19] to-gray-500">
              概览
            </span>
          </h1>
        </div>

        {/* 时间选择器 */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Tooltip title="进入大屏模式">
            <Button
              type="primary"
              icon={<FullscreenOutlined />}
              onClick={onEnterFullScreen}
              className="bg-[#0f1423] hover:bg-[#1e293b] border-none"
            >
              大屏模式
            </Button>
          </Tooltip>

          <RangePicker
            value={customRange}
            onChange={(dates) => {
              if (dates) {
                setCustomRange(dates as any)
                setTimeRange('custom')
              } else {
                setCustomRange(null)
                setTimeRange('week')
              }
            }}
            className="h-10 rounded-xl border-gray-200 shadow-sm hover:border-[#74B868] focus:border-[#74B868]"
          />

          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range)
                  setCustomRange(null)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  timeRange === range
                    ? 'bg-white text-[#0B0F19] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range === 'day' ? '今日' : range === 'week' ? '本周' : '本月'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总收入"
          value={`¥${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="#74B868"
          trend={stats.revenueTrend.toFixed(1)}
        />
        <StatCard
          title="总订单"
          value={stats.totalOrders.toLocaleString()}
          icon={Package}
          color="#3B82F6"
          trend={stats.ordersTrend.toFixed(1)}
        />
        <StatCard
          title="活跃用户"
          value={stats.activeUsers.toLocaleString()}
          icon={Users}
          color="#F59E0B"
          trend={stats.usersTrend.toFixed(1)}
        />
        <StatCard
          title="平均配送时间"
          value={stats.avgDeliveryTime}
          icon={Truck}
          color="#EC4899"
          trend={stats.deliveryTrend.toFixed(1)}
        />
      </div>

      {/* 图表区域 1：趋势与效率 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">订单趋势分析</h3>
          <ReactECharts option={lineOption} style={{ height: '300px' }} />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">收入趋势分析</h3>
          <ReactECharts option={barOption} style={{ height: '300px' }} />
        </div>
      </div>

      {/* 图表区域 2：地理分布与热力图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">热门配送区域 (Top 10)</h3>
          <ReactECharts option={cityOption} style={{ height: '350px' }} />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">下单时间热力图</h3>
          <ReactECharts option={heatmapOption} style={{ height: '350px' }} />
        </div>
      </div>

      {/* 异常订单区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 饼图 */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-800 mb-6">异常原因分布</h3>
          <ReactECharts option={pieOption} style={{ height: '300px' }} />
        </div>

        {/* 异常订单表格 */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="text-red-500" size={24} />
            <h3 className="text-lg font-bold text-gray-800">异常订单监控</h3>
          </div>
          <Table
            dataSource={abnormalOrders}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: '订单号',
                dataIndex: 'id',
                render: (t: string) => <span className="font-mono font-bold">{t}</span>,
              },
              { title: '收件人', dataIndex: ['recipient', 'name'] },
              {
                title: '异常原因',
                dataIndex: 'exceptionReason',
                render: (t: string) => <Tag color="red">{t}</Tag>,
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                render: (t: string) => (
                  <span className="font-mono text-gray-400">{t.split('T')[0]}</span>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
})

const DataDashboard = memo(function DataDashboard() {
  const [isFullScreen, setIsFullScreen] = useState(false)

  if (isFullScreen) {
    return <CyberpunkDashboard onExit={() => setIsFullScreen(false)} />
  }

  return <StandardDashboard onEnterFullScreen={() => setIsFullScreen(true)} />
})

export default DataDashboard
