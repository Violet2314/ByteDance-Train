import React from 'react'
import { Modal, Form, Input } from 'antd'
import DeliverySidebar from './delivery/DeliverySidebar'
import DeliveryMap from './delivery/DeliveryMap'
import DeliveryOrdersTable from './delivery/DeliveryOrdersTable'
import { TimeInput } from '../components/business/TimeInput'
import { useDeliveryManagement } from '../hooks/useDeliveryManagement'

/**
 * 配送管理页面
 *
 * 包含配送区域划分、规则管理、订单分配等功能。
 * 主要由侧边栏(DeliverySidebar)、地图(DeliveryMap)和底部订单列表(DeliveryOrdersTable)组成。
 */
export default function DeliveryManagement() {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isBottomPanelOpen,
    setIsBottomPanelOpen,
    activeRuleId,
    isEditingArea,
    searchText,
    setSearchText,
    setIsMapReady,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    form,
    rules,
    deliverableOrders,
    allOrders,
    activeRule,
    mapStats,
    handleToggleEditArea,
    handlePolygonChange,
    handleOpenAddModal,
    handleOpenEditModal,
    handleModalOk,
    handleDeleteRule,
    handleActivateRule,
  } = useDeliveryManagement()

  return (
    <div className="h-[calc(100vh-100px)] flex relative overflow-hidden rounded-3xl border border-gray-300 shadow-2xl bg-white">
      <DeliverySidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        rules={rules}
        activeRuleId={activeRuleId}
        onActivateRule={handleActivateRule}
        onAddRule={handleOpenAddModal}
        onDeleteRule={handleDeleteRule}
        isEditingArea={isEditingArea}
        onToggleEditArea={handleToggleEditArea}
        onStartEditInfo={handleOpenEditModal}
        searchText={searchText}
        setSearchText={setSearchText}
      />

      <div className="flex-1 bg-gray-50 relative flex flex-col">
        <DeliveryMap
          activeRule={activeRule}
          isEditingArea={isEditingArea}
          onPolygonChange={handlePolygonChange}
          onMapReady={setIsMapReady}
          stats={mapStats}
        />

        <DeliveryOrdersTable
          orders={deliverableOrders}
          allOrders={allOrders}
          activeRule={activeRule}
          isOpen={isBottomPanelOpen}
          onToggle={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
        />
      </div>

      <Modal
        title={modalMode === 'add' ? '添加配送规则' : '编辑规则信息'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="company"
            label="承运商名称"
            rules={[{ required: true, message: '请输入承运商名称' }]}
          >
            <Input placeholder="例如：顺丰速运" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="intraCity"
              label="同城时效"
              rules={[
                { required: true, message: '请输入' },
                { pattern: /^(次日达|\d+-\d+天)$/, message: '格式错误，应为"次日达"或"N-M天"' },
              ]}
              initialValue="次日达"
            >
              <TimeInput placeholder="例: 次日达" />
            </Form.Item>
            <Form.Item
              name="inProvince"
              label="省内时效"
              rules={[
                { required: true, message: '请输入' },
                { pattern: /^(次日达|\d+-\d+天)$/, message: '格式错误，应为"次日达"或"N-M天"' },
              ]}
              initialValue="次日达"
            >
              <TimeInput placeholder="例: 次日达" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="interProvince"
              label="跨省(非偏远)"
              rules={[
                { required: true, message: '请输入' },
                { pattern: /^(次日达|\d+-\d+天)$/, message: '格式错误，应为"次日达"或"N-M天"' },
              ]}
              initialValue="1-2天"
            >
              <TimeInput placeholder="例: 1-2天" />
            </Form.Item>
            <Form.Item
              name="remote"
              label="跨省(偏远)"
              rules={[
                { required: true, message: '请输入' },
                { pattern: /^(次日达|\d+-\d+天)$/, message: '格式错误，应为"次日达"或"N-M天"' },
              ]}
              initialValue="3-5天"
            >
              <TimeInput placeholder="例: 3-5天" />
            </Form.Item>
          </div>

          <Form.Item
            name="area"
            label="区域名称"
            rules={[{ required: true, message: '请输入区域名称' }]}
          >
            <Input placeholder="例如：核心商务区" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
