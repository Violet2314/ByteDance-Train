import React from 'react'
import { Card, Row, Col, Statistic, Select, Button, Table, Tag } from 'antd'
import { ArrowUp, ArrowDown, RefreshCw, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'

const dataBar = [
  { name: '0-12h', value: 400 },
  { name: '12-24h', value: 300 },
  { name: '1-2天', value: 300 },
  { name: '2-3天', value: 200 },
  { name: '3天+', value: 100 },
];

const dataLine = [
  { name: 'Mon', sf: 24, yd: 30 },
  { name: 'Tue', sf: 22, yd: 28 },
  { name: 'Wed', sf: 25, yd: 32 },
  { name: 'Thu', sf: 23, yd: 29 },
  { name: 'Fri', sf: 21, yd: 27 },
  { name: 'Sat', sf: 20, yd: 25 },
  { name: 'Sun', sf: 24, yd: 30 },
];

const dataPie = [
  { name: '配送超时', value: 400 },
  { name: '包裹滞留', value: 300 },
  { name: '客户投诉', value: 100 },
];

const COLORS = ['#D9B3AD', '#EED8B5', '#7CAA6D'];

export default function DataDashboard() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">数据看板</h1>
          <p className="text-text-tertiary mt-1">更新于: {new Date().toLocaleString()}</p>
        </div>
        <div className="flex gap-3">
          <Select defaultValue="week" className="w-32" options={[
            { value: 'today', label: '今日' },
            { value: 'week', label: '本周' },
            { value: 'month', label: '本月' },
          ]} />
          <Button icon={<RefreshCw size={16} />} />
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-subtle hover:shadow-moderate transition-all">
            <Statistic 
              title={<span className="text-text-secondary">总订单量</span>}
              value={12893} 
              prefix={<span className="w-2 h-2 rounded-full bg-primary-base inline-block mr-2 mb-1"></span>}
            />
            <div className="mt-2 flex items-center text-sm text-primary-base">
              <ArrowUp size={14} className="mr-1" />
              <span>12.5% 环比增长</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-subtle hover:shadow-moderate transition-all">
            <Statistic 
              title={<span className="text-text-secondary">平均配送时长</span>}
              value={2.4} 
              suffix="天"
            />
            <div className="mt-2 flex items-center text-sm text-primary-base">
              <ArrowDown size={14} className="mr-1" />
              <span>0.3天 效率提升</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-subtle hover:shadow-moderate transition-all">
            <Statistic 
              title={<span className="text-text-secondary">配送完成率</span>}
              value={98.5} 
              suffix="%"
              valueStyle={{ color: '#7CAA6D' }}
            />
            <div className="mt-2 text-sm text-text-tertiary">
              目标完成率 98%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-subtle hover:shadow-moderate transition-all">
            <Statistic 
              title={<span className="text-text-secondary">异常订单</span>}
              value={42} 
              valueStyle={{ color: '#D9B3AD' }}
            />
            <div className="mt-2 flex items-center text-sm text-error-default">
              <ArrowUp size={14} className="mr-1" />
              <span>5 单 新增异常</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Section 1 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="配送时效分布" bordered={false} className="shadow-subtle h-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataBar}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E8E3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F9EDCF', opacity: 0.3 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#7CAA6D" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="异常类型分布" bordered={false} className="shadow-subtle h-full">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {dataPie.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[index] }}></span>
                  {entry.name}
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Section 2 */}
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card 
            title="快递公司时效对比" 
            extra={<Button type="text" icon={<Download size={16} />}>导出报告</Button>}
            bordered={false} 
            className="shadow-subtle"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dataLine}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E8E3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="sf" stroke="#7CAA6D" strokeWidth={3} dot={{ r: 4, fill: '#7CAA6D', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="顺丰" />
                <Line type="monotone" dataKey="yd" stroke="#EED8B5" strokeWidth={3} dot={{ r: 4, fill: '#EED8B5', strokeWidth: 2, stroke: '#fff' }} name="韵达" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </motion.div>
  )
}
