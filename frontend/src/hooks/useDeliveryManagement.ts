import { useState, useEffect, useMemo, useCallback } from 'react'
import { Form, message, Modal } from 'antd'
import {
  useGetDeliveryRulesQuery,
  useGetOrdersQuery,
  useCreateDeliveryRuleMutation,
  useUpdateDeliveryRuleMutation,
  useDeleteDeliveryRuleMutation,
} from '../services/api'

// 辅助函数：射线法判断点是否在多边形内 (Point in Polygon)
const isPointInPolygon = (point: [number, number], vs: [number, number][]) => {
  const x = point[0],
    y = point[1]
  let inside = false
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0],
      yi = vs[i][1]
    const xj = vs[j][0],
      yj = vs[j][1]
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export const useDeliveryManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true)

  const [activeRuleId, setActiveRuleId] = useState<number | null>(null)
  const [isEditingArea, setIsEditingArea] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [isMapReady, setIsMapReady] = useState(false)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [form] = Form.useForm()

  const { data: rulesData } = useGetDeliveryRulesQuery()
  const { data: ordersData } = useGetOrdersQuery({})

  const [createDeliveryRule] = useCreateDeliveryRuleMutation()
  const [updateDeliveryRule] = useUpdateDeliveryRuleMutation()
  const [deleteDeliveryRule] = useDeleteDeliveryRuleMutation()

  // 使用查询数据的派生状态，而不是本地状态
  const rules = useMemo(() => rulesData?.data || [], [rulesData])

  // 初始化 activeRuleId
  useEffect(() => {
    if (rules.length > 0 && !activeRuleId) {
      setActiveRuleId(rules[0].id)
    }
  }, [rules, activeRuleId])

  // 根据当前选中的规则区域计算可配送订单
  const deliverableOrders = useMemo(() => {
    const activeRule = rules.find((r) => r.id === activeRuleId)
    if (!activeRule || !activeRule.path || !ordersData?.data) return []

    return ordersData.data.filter((order) => {
      // 检查订单地址是否在多边形内
      // 注意：订单坐标是 [lat, lng] 或对象，我们需要 [lng, lat] 进行计算
      const point: [number, number] = [order.address.lng, order.address.lat]
      return isPointInPolygon(point, activeRule.path)
    })
  }, [activeRuleId, rules, ordersData])

  const activeRule = rules.find((r) => r.id === activeRuleId)

  // 计算地图图例统计数据
  const mapStats = useMemo(() => {
    if (!ordersData?.data) return { deliverable: 0, outOfRange: 0, inTransit: 0 }

    const total = ordersData.data.length
    const deliverable = deliverableOrders.length
    const outOfRange = total - deliverable
    const inTransit = deliverableOrders.filter(
      (o) => (o.status as string) === 'in_transit' || (o.status as string) === 'out_for_delivery'
    ).length

    return { deliverable, outOfRange, inTransit }
  }, [ordersData, deliverableOrders])

  // 事件处理函数
  const handleToggleEditArea = () => {
    if (!isMapReady) {
      message.error('地图组件尚未加载完成')
      return
    }
    if (isEditingArea) {
      // 用户点击“保存”
      setIsEditingArea(false)
      message.success('区域编辑已保存')
    } else {
      // 用户点击“编辑”
      setIsEditingArea(true)
      message.info('开始编辑区域，拖动节点修改范围')
    }
  }

  const handlePolygonChange = useCallback(
    async (newPath: [number, number][]) => {
      if (activeRuleId) {
        try {
          await updateDeliveryRule({ id: activeRuleId, data: { path: newPath } }).unwrap()
        } catch (e) {
          message.error('更新区域失败')
        }
      }
    },
    [activeRuleId, updateDeliveryRule]
  )

  const handleOpenAddModal = () => {
    setModalMode('add')
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleOpenEditModal = () => {
    if (!activeRule) return
    setModalMode('edit')
    form.setFieldsValue({
      company: activeRule.company,
      area: activeRule.area,
      intraCity: activeRule.intraCity || '次日达',
      inProvince: activeRule.inProvince || '次日达',
      interProvince: activeRule.interProvince || '1-2天',
      remote: activeRule.remote || '3-5天',
    })
    setIsModalOpen(true)
  }

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      const daysDisplay = `${values.intraCity} / ${values.inProvince}`
      try {
        if (modalMode === 'add') {
          const center = [116.397428, 39.90923]
          const offset = (Math.random() - 0.5) * 0.1
          const newPath = [
            [center[0] - 0.02 + offset, center[1] + 0.02 + offset],
            [center[0] + 0.02 + offset, center[1] + 0.02 + offset],
            [center[0] + 0.02 + offset, center[1] - 0.02 + offset],
            [center[0] - 0.02 + offset, center[1] - 0.02 + offset],
          ]

          const result = await createDeliveryRule({
            company: values.company,
            days: daysDisplay,
            intraCity: values.intraCity,
            inProvince: values.inProvince,
            interProvince: values.interProvince,
            remote: values.remote,
            area: values.area || '自定义区域',
            path: newPath,
          }).unwrap()
          setActiveRuleId(result.data.id)
          message.success('规则已添加')
        } else {
          if (activeRuleId) {
            await updateDeliveryRule({
              id: activeRuleId,
              data: { ...values, days: daysDisplay },
            }).unwrap()
            message.success('信息已更新')
          }
        }
        setIsModalOpen(false)
      } catch (e) {
        message.error('操作失败')
      }
    })
  }

  const handleDeleteRule = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条配送规则吗？',
      onOk: async () => {
        try {
          await deleteDeliveryRule(id).unwrap()
          if (activeRuleId === id) {
            setActiveRuleId(null)
          }
          message.success('规则已删除')
        } catch (e) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleActivateRule = (id: number) => {
    setActiveRuleId(id)
    setIsEditingArea(false) // Stop editing if switching rules
    message.success('已切换当前编辑区域')
  }

  return {
    isSidebarOpen,
    setIsSidebarOpen,
    isBottomPanelOpen,
    setIsBottomPanelOpen,
    activeRuleId,
    isEditingArea,
    searchText,
    setSearchText,
    isMapReady,
    setIsMapReady,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    form,
    rules,
    deliverableOrders,
    allOrders: ordersData?.data || [],
    activeRule,
    mapStats,
    handleToggleEditArea,
    handlePolygonChange,
    handleOpenAddModal,
    handleOpenEditModal,
    handleModalOk,
    handleDeleteRule,
    handleActivateRule,
  }
}
