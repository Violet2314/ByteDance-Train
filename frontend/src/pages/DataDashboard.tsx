import React, { memo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Package, Users, DollarSign, Activity, Truck, AlertTriangle } from 'lucide-react'
import { StatCard } from '../components/business/StatCard'
import { useDataDashboard } from '../hooks/useDataDashboard'
import { Table, Tag, DatePicker } from 'antd'

const { RangePicker } = DatePicker

const DataDashboard = memo(function DataDashboard() {
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

export default DataDashboard
