import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Button, Input, Tag, Tooltip, message, Modal, Switch, Table } from 'antd'
import { Search, Plus, Map as MapIcon, Trash2, Edit2, Layers, Navigation, Settings, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Package } from 'lucide-react'
import AMapLoader from '@amap/amap-jsapi-loader'
import { motion, AnimatePresence } from 'framer-motion'
import { generateMockRules, mockOrders } from '../mocks/data'

// Helper: Ray-casting algorithm for Point in Polygon
const isPointInPolygon = (point: [number, number], vs: [number, number][]) => {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

export default function DeliveryManagement() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const polygonInstance = useRef<any>(null)
  const polyEditorInstance = useRef<any>(null)
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true)
  const [rules, setRules] = useState<any[]>([])
  const [activeRuleId, setActiveRuleId] = useState<number | null>(null)
  const [isEditingArea, setIsEditingArea] = useState(false)
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [editForm, setEditForm] = useState({ company: '', area: '' })
  const [isMapReady, setIsMapReady] = useState(false)

  // Initialize Mock Data
  useEffect(() => {
    const mockData = generateMockRules(5)
    setRules(mockData)
    // Set the first one as active by default if available
    if (mockData.length > 0) {
      setActiveRuleId(mockData[0].id)
    }
  }, [])

  // Calculate deliverable orders based on active rule area
  const deliverableOrders = useMemo(() => {
    const activeRule = rules.find(r => r.id === activeRuleId);
    if (!activeRule || !activeRule.path) return [];

    return mockOrders.filter(order => {
      // Check if order address is within the polygon
      // Note: mockOrders coordinates are [lat, lng] or objects, we need [lng, lat] for calculation
      const point: [number, number] = [order.address.lng, order.address.lat];
      return isPointInPolygon(point, activeRule.path);
    });
  }, [activeRuleId, rules]);

  // Initialize Map
  useEffect(() => {
    AMapLoader.load({
      key: '6d736976336dac732baf2fe3d00c4254', // Replace with your key
      version: '2.0',
      plugins: ['AMap.Polygon', 'AMap.MouseTool', 'AMap.PolyEditor'],
    }).then((AMap) => {
      if (!mapContainer.current) return

      if (!mapInstance.current) {
        mapInstance.current = new AMap.Map(mapContainer.current, {
          zoom: 11,
          center: [116.397428, 39.90923],
          viewMode: '2D',
        })
        
        mapInstance.current.on('complete', () => {
          setIsMapReady(true)
        })
      }
    }).catch(e => {
      console.error(e)
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
      }
    }
  }, [])

  // Update Map Polygon when Active Rule Changes
  useEffect(() => {
    if (!mapInstance.current || !activeRuleId || !isMapReady) return

    const activeRule = rules.find(r => r.id === activeRuleId)
    if (!activeRule || !activeRule.path) return

    // Clear existing polygon and editor
    if (polyEditorInstance.current) {
      polyEditorInstance.current.close()
      polyEditorInstance.current = null
    }
    if (polygonInstance.current) {
      mapInstance.current.remove(polygonInstance.current)
      polygonInstance.current = null
    }
    setIsEditingArea(false)

    // Create new polygon
    const AMap = (window as any).AMap
    if (!AMap) return

    polygonInstance.current = new AMap.Polygon({
      path: activeRule.path,
      strokeColor: "#74B868", 
      strokeWeight: 2,
      strokeOpacity: 1,
      fillOpacity: 0.2,
      fillColor: '#74B868',
      zIndex: 50,
      bubble: true, // Allow events to bubble
    })

    mapInstance.current.add(polygonInstance.current)
    mapInstance.current.setFitView([polygonInstance.current])

    // Initialize Editor
    polyEditorInstance.current = new AMap.PolyEditor(mapInstance.current, polygonInstance.current)

  }, [activeRuleId, rules.length, isMapReady]) // Re-run when active rule changes

  const toggleEditArea = () => {
    if (!polyEditorInstance.current) {
      message.error('地图组件尚未加载完成')
      return
    }
    
    if (isEditingArea) {
      // Save
      polyEditorInstance.current.close()
      setIsEditingArea(false)
      
      // Update the rule's path in state
      const newPath = polygonInstance.current.getPath().map((p: any) => [p.lng, p.lat])
      setRules(prev => prev.map(r => r.id === activeRuleId ? { ...r, path: newPath } : r))
      
      message.success('区域编辑已保存')
    } else {
      // Edit
      polyEditorInstance.current.open()
      setIsEditingArea(true)
      message.info('开始编辑区域，拖动节点修改范围')
    }
  }

  const handleAddRule = () => {
    const center = [116.397428, 39.90923];
    const offset = (Math.random() - 0.5) * 0.1;
    const newPath = [
      [center[0] - 0.02 + offset, center[1] + 0.02 + offset],
      [center[0] + 0.02 + offset, center[1] + 0.02 + offset],
      [center[0] + 0.02 + offset, center[1] - 0.02 + offset],
      [center[0] - 0.02 + offset, center[1] - 0.02 + offset]
    ]

    const newRule = {
      id: Date.now(),
      company: '新增物流',
      days: '1-3 天',
      area: '自定义区域',
      color: 'purple',
      isEnabled: false,
      path: newPath
    }
    setRules([newRule, ...rules])
    message.success('规则已添加')
  }

  const handleDeleteRule = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条配送规则吗？',
      onOk: () => {
        setRules(rules.filter(r => r.id !== id))
        if (activeRuleId === id) {
          setActiveRuleId(null)
        }
        message.success('规则已删除')
      }
    })
  }

  const handleActivateRule = (id: number) => {
    setActiveRuleId(id)
    setIsEditingInfo(false)
    message.success('已切换当前编辑区域')
  }

  const handleStartEditInfo = () => {
    if (!activeRule) return
    setEditForm({ company: activeRule.company, area: activeRule.area })
    setIsEditingInfo(true)
  }

  const handleSaveInfo = () => {
    if (!activeRule) return
    setRules(prev => prev.map(r => r.id === activeRuleId ? { ...r, ...editForm } : r))
    setIsEditingInfo(false)
    message.success('信息已更新')
  }

  const activeRule = rules.find(r => r.id === activeRuleId)
  const filteredRules = rules.filter(r => 
    r.company.toLowerCase().includes(searchText.toLowerCase()) || 
    r.area.toLowerCase().includes(searchText.toLowerCase())
  )

  const sidebarVariants = {
    open: { width: 384, opacity: 1, x: 0 },
    closed: { width: 0, opacity: 0, x: -20 }
  }

  const bottomPanelVariants = {
    open: { height: 300, opacity: 1, y: 0 },
    closed: { height: 48, opacity: 1, y: 0 } // Keep header visible
  }

  return (
    <div className="h-[calc(100vh-100px)] flex relative overflow-hidden rounded-3xl border border-gray-300 shadow-2xl bg-white">
      {/* Left Sidebar - Tools */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div 
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col border-r border-gray-200 bg-white z-10 h-full shadow-xl"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Settings size={20} />
                配送规则
              </h2>
              <p className="text-sm text-gray-400 mt-1">管理配送区域和承运商</p>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Active Area Card */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">当前编辑区域</h3>
                </div>
                
                {activeRule ? (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 group hover:border-blue-200 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      {isEditingInfo ? (
                        <div className="flex gap-2 flex-1 mr-2">
                          <Input 
                            size="small" 
                            value={editForm.company} 
                            onChange={e => setEditForm({...editForm, company: e.target.value})}
                            placeholder="承运商"
                          />
                          <Input 
                            size="small" 
                            value={editForm.area} 
                            onChange={e => setEditForm({...editForm, area: e.target.value})}
                            placeholder="区域名称"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-gray-900">{activeRule.company} - {activeRule.area}</span>
                      )}
                      <Tag color="processing" className="border-0 rounded-full px-2">编辑中</Tag>
                    </div>
                    <div className="flex gap-2">
                      {isEditingInfo ? (
                        <>
                          <Button 
                            size="small" 
                            type="primary"
                            className="flex-1 rounded-lg shadow-sm"
                            onClick={handleSaveInfo}
                          >
                            保存信息
                          </Button>
                          <Button 
                            size="small" 
                            className="rounded-lg shadow-sm"
                            onClick={() => setIsEditingInfo(false)}
                          >
                            取消
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="small" 
                            icon={<Edit2 size={14} />} 
                            className="flex-1 rounded-lg shadow-sm border-gray-200 bg-white"
                            onClick={handleStartEditInfo}
                          >
                            修改命名
                          </Button>
                          <Button 
                            size="small" 
                            icon={<MapIcon size={14} />} 
                            className={`flex-1 rounded-lg shadow-sm border-gray-200 ${isEditingArea ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white'}`}
                            onClick={toggleEditArea}
                          >
                            {isEditingArea ? '保存区域' : '编辑区域'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400 text-sm">
                    请选择下方规则以编辑区域
                  </div>
                )}
              </div>

              {/* Rules List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">承运商列表</h3>
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<Plus size={16} />} 
                    size="small" 
                    className="bg-black" 
                    onClick={handleAddRule}
                  />
                </div>
                <Input 
                  prefix={<Search size={16} className="text-gray-400" />} 
                  placeholder="搜索规则..." 
                  className="rounded-xl bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white transition-all" 
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
                
                <div className="space-y-3">
                  {filteredRules.map((item, i) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white group ${activeRuleId === item.id ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200 hover:shadow-md hover:border-gray-300'}`}
                      onClick={() => handleActivateRule(item.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-900">{item.company}</span>
                        <div className="flex gap-1 items-center">
                          <Switch 
                            size="small" 
                            checked={activeRuleId === item.id} 
                            className="mr-2"
                          />
                          <Button 
                            type="text" 
                            size="small" 
                            danger 
                            icon={<Trash2 size={14} />} 
                            className="opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRule(item.id)
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Tag className="mr-0 border-0 bg-gray-100 rounded-lg text-gray-600">{item.days}</Tag>
                        <Tag className="mr-0 border-0 bg-blue-50 text-blue-600 rounded-lg truncate max-w-[150px]">{item.area}</Tag>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-1/2 left-0 z-20 -translate-y-1/2 bg-white shadow-lg border border-gray-200 p-1 rounded-r-xl hover:bg-gray-50 transition-colors"
        style={{ left: isSidebarOpen ? 384 : 0 }}
      >
        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Right - Map & Bottom Panel */}
      <div className="flex-1 bg-gray-50 relative flex flex-col">
        <div className="flex-1 relative">
            <div ref={mapContainer} className="w-full h-full" />
            
            <div className="absolute top-6 right-6 flex flex-col gap-3">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 space-y-3 min-w-[200px]">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">地图图例</h4>
                <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                <span>可配送 (124)</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <span className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"></span>
                <span>超出范围 (12)</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <span className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></span>
                <span>配送中 (56)</span>
                </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/50 flex flex-col gap-2">
                <Tooltip title="图层" placement="left">
                <Button type="text" icon={<Layers size={20} />} className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100" />
                </Tooltip>
                <Tooltip title="导航" placement="left">
                <Button type="text" icon={<Navigation size={20} />} className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100" />
                </Tooltip>
            </div>
            </div>
        </div>

        {/* Bottom Panel - Deliverable Orders */}
        <motion.div 
            initial="open"
            animate={isBottomPanelOpen ? "open" : "closed"}
            variants={bottomPanelVariants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 flex flex-col"
        >
            <div 
                className="h-12 flex items-center justify-between px-6 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
            >
                <div className="flex items-center gap-3">
                    <Package size={18} className="text-blue-500" />
                    <span className="font-bold text-gray-800">区域内可配送订单</span>
                    <Tag color="blue" className="rounded-full border-0 bg-blue-50 text-blue-600 font-bold">{deliverableOrders.length}</Tag>
                    {activeRule && (
                        <span className="text-xs text-gray-400 ml-2">
                            当前规则: {activeRule.company} ({activeRule.days})
                        </span>
                    )}
                </div>
                <Button 
                    type="text" 
                    size="small" 
                    icon={isBottomPanelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />} 
                />
            </div>
            
            <div className="flex-1 overflow-auto p-4">
                <Table 
                    dataSource={deliverableOrders}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    columns={[
                        { title: '订单号', dataIndex: 'id', key: 'id', render: (t) => <span className="font-mono font-bold">{t}</span> },
                        { title: '收件人', key: 'recipient', render: (_, r) => <span>{r.recipient.name} <span className="text-gray-400 text-xs">{r.recipient.phone}</span></span> },
                        { title: '地址', key: 'address', render: (_, r) => <span className="text-xs text-gray-500 truncate max-w-[200px] block" title={r.address.text}>{r.address.text}</span> },
                        { title: '金额', dataIndex: 'amount', key: 'amount', render: (t) => `¥${t}` },
                        { 
                            title: '预计时效', 
                            key: 'sla', 
                            render: () => (
                                <Tag color="green" className="border-0 bg-green-50 text-green-600 font-medium">
                                    {activeRule?.days || '-'}
                                </Tag>
                            ) 
                        },
                        { 
                            title: '状态', 
                            dataIndex: 'status', 
                            key: 'status',
                            render: (s) => {
                                const map: any = { pending: '待处理', in_transit: '运输中', signed: '已签收' };
                                return <span className="text-xs font-bold text-gray-500">{map[s] || s}</span>
                            }
                        }
                    ]}
                />
                {deliverableOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        当前区域内暂无匹配订单
                    </div>
                )}
            </div>
        </motion.div>
      </div>
    </div>
  )
}

