import React from 'react'
import { Button, Input, Tag, Switch } from 'antd'
import {
  Search,
  Plus,
  Map as MapIcon,
  Trash2,
  Edit2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DeliverySidebarProps {
  isOpen: boolean
  onToggle: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rules: any[]
  activeRuleId: number | null
  onActivateRule: (id: number) => void
  onAddRule: () => void
  onDeleteRule: (id: number) => void
  isEditingArea: boolean
  onToggleEditArea: () => void
  onStartEditInfo: () => void
  searchText: string
  setSearchText: (text: string) => void
}

export default function DeliverySidebar({
  isOpen,
  onToggle,
  rules,
  activeRuleId,
  onActivateRule,
  onAddRule,
  onDeleteRule,
  isEditingArea,
  onToggleEditArea,
  onStartEditInfo,
  searchText,
  setSearchText,
}: DeliverySidebarProps) {
  const activeRule = rules.find((r) => r.id === activeRuleId)
  const filteredRules = rules.filter(
    (r) =>
      r.company.toLowerCase().includes(searchText.toLowerCase()) ||
      r.area.toLowerCase().includes(searchText.toLowerCase())
  )

  const sidebarVariants = {
    open: { width: 384, opacity: 1, x: 0 },
    closed: { width: 0, opacity: 0, x: -20 },
  }

  return (
    <>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
                  <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
                    当前编辑区域
                  </h3>
                </div>

                {activeRule ? (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 group hover:border-blue-200 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">
                        {activeRule.company} - {activeRule.area}
                      </span>
                      {isEditingArea && (
                        <Tag color="processing" className="border-0 rounded-full px-2">
                          区域编辑中
                        </Tag>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        icon={<Edit2 size={14} />}
                        className="flex-1 rounded-lg shadow-sm border-gray-200 bg-white"
                        onClick={onStartEditInfo}
                      >
                        编辑信息
                      </Button>
                      <Button
                        size="small"
                        icon={<MapIcon size={14} />}
                        className={`flex-1 rounded-lg shadow-sm border-gray-200 ${isEditingArea ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white'}`}
                        onClick={onToggleEditArea}
                      >
                        {isEditingArea ? '保存区域' : '编辑区域'}
                      </Button>
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
                  <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
                    承运商列表
                  </h3>
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<Plus size={16} />}
                    size="small"
                    className="bg-black"
                    onClick={onAddRule}
                  />
                </div>
                <Input
                  prefix={<Search size={16} className="text-gray-400" />}
                  placeholder="搜索规则..."
                  className="rounded-xl bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white transition-all"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />

                <div className="space-y-3">
                  {filteredRules.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white group ${activeRuleId === item.id ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200 hover:shadow-md hover:border-gray-300'}`}
                      onClick={() => onActivateRule(item.id)}
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
                              onDeleteRule(item.id)
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Tag className="mr-0 border-0 bg-gray-100 rounded-lg text-gray-600">
                          {item.days}
                        </Tag>
                        <Tag className="mr-0 border-0 bg-blue-50 text-blue-600 rounded-lg truncate max-w-[150px]">
                          {item.area}
                        </Tag>
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
        onClick={onToggle}
        className="absolute top-1/2 left-0 z-20 -translate-y-1/2 bg-white shadow-lg border border-gray-200 p-1 rounded-r-xl hover:bg-gray-50 transition-colors"
        style={{ left: isOpen ? 384 : 0 }}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </>
  )
}
