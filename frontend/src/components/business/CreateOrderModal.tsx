import React, { useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  InputNumber,
  Divider,
  Space,
  message,
  Spin,
} from 'antd'
import { Plus, MapPin, Save, Trash2, User } from 'lucide-react'
import {
  useGetAddressBookQuery,
  useAddAddressMutation,
  useDeleteAddressMutation,
  useGeocodeMutation,
  useSearchUsersMutation,
} from '../../services/api'

interface CreateOrderModalProps {
  visible: boolean
  onCancel: () => void
  onCreate: (values: any) => void
}

interface Address {
  id: string
  name: string
  contactName: string
  contactPhone: string
  address: string
  lat?: number
  lng?: number
}

// 使用 React.memo 优化性能，避免父组件重渲染导致 Modal 闪烁
const CreateOrderModal = React.memo(({ visible, onCancel, onCreate }: CreateOrderModalProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [newSenderName, setNewSenderName] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [senderSelectKey, setSenderSelectKey] = useState(0) // 用于强制重置 Select

  // API Hooks
  const { data: addressBookData } = useGetAddressBookQuery({ merchantId: 1 }) // 默认商户 ID
  const [addAddress] = useAddAddressMutation()
  const [deleteAddress] = useDeleteAddressMutation()
  const [geocode] = useGeocodeMutation() // 地理编码服务（地址 -> 坐标）
  const [searchUsers, { isLoading: isSearchingUsers }] = useSearchUsersMutation() // 用户搜索

  const [userOptions, setUserOptions] = useState<{ label: string; value: number }[]>([])

  const savedSenders: Address[] = addressBookData?.data || []

  // 搜索用户（防抖逻辑通常在 Input 组件中处理，这里直接调用）
  const handleSearchUsers = async (value: string) => {
    if (!value) return
    try {
      const result = await searchUsers(value).unwrap()
      setUserOptions(
        result.data.map((u: any) => ({
          label: `${u.username} (${u.real_name || '未实名'} - ${u.phone || '无电话'})`,
          value: u.id,
        }))
      )
    } catch (e) {
      console.error(e)
    }
  }

  // 保存常用发货地址到地址簿
  const handleSaveSender = async () => {
    const values = form.getFieldsValue([
      'senderName',
      'senderPhone',
      'senderAddress',
      'senderLat',
      'senderLng',
    ])
    if (!values.senderName || !values.senderAddress) {
      message.warning('请填写完整的发货人信息')
      return
    }
    try {
      await addAddress({
        merchantId: 1,
        name: newSenderName || values.senderName,
        contactName: values.senderName,
        contactPhone: values.senderPhone,
        address: values.senderAddress,
        lat: values.senderLat,
        lng: values.senderLng,
      }).unwrap()
      setNewSenderName('')
      message.success('发货地址已保存')
    } catch (e) {
      message.error('保存失败')
    }
  }

  const handleDeleteSender = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteAddress(id).unwrap()
      message.success('地址已删除')
    } catch (e) {
      message.error('删除失败')
    }
  }

  const handleSenderChange = (id: string) => {
    // 允许重复选择同一个地址（重新加载数据）
    // eslint-disable-next-line eqeqeq
    const sender = savedSenders.find((s) => s.id == id)
    if (sender) {
      form.setFieldsValue({
        senderName: sender.contactName,
        senderPhone: sender.contactPhone,
        senderAddress: sender.address,
        senderLat: sender.lat,
        senderLng: sender.lng,
      })
      // 填充完毕后，重置 Select 以允许再次选择同一项
      setSenderSelectKey((prev) => prev + 1)
    }
  }

  const geocodeAddress = async (
    addressField: string,
    latField: string,
    lngField: string,
    label: string
  ) => {
    const address = form.getFieldValue(addressField)
    if (!address) {
      message.warning(`请输入${label}`)
      return
    }

    setIsGeocoding(true)
    try {
      const result = await geocode(address).unwrap()
      if (result && result.data) {
        const { lat, lng } = result.data
        form.setFieldsValue({
          [latField]: lat,
          [lngField]: lng,
        })
        message.success(`${label}已定位: ${lng}, ${lat}`)
      }
    } catch (error) {
      message.error('地址解析失败，请检查地址是否正确')
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      // 模拟 API 调用延迟
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onCreate(values)
      setLoading(false)
      form.resetFields()
      onCancel()
    } catch (error) {
      // 验证失败
    }
  }

  return (
    <Modal
      title="创建新订单"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
      okText="立即下单"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" initialValues={{ goodsWeight: 1, goodsCount: 1 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 关联用户区域 */}
          <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <User size={16} className="text-purple-500" /> 关联用户 (可选)
            </h3>
            <Form.Item name="userId" label="搜索用户" help="输入用户名、姓名或电话搜索注册用户">
              <Select
                showSearch
                placeholder="输入关键词搜索..."
                defaultActiveFirstOption={false}
                filterOption={false}
                onSearch={handleSearchUsers}
                notFoundContent={isSearchingUsers ? <Spin size="small" /> : null}
                options={userOptions}
                allowClear
              />
            </Form.Item>
          </div>

          {/* 发货人信息区域 */}
          <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <MapPin size={16} className="text-blue-500" /> 发货信息
              </h3>
              <Select
                key={senderSelectKey}
                placeholder="选择常用地址"
                style={{ width: 200 }}
                onChange={handleSenderChange}
                popupRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: '8px 0' }} />
                    <Space style={{ padding: '0 8px 4px' }}>
                      <Input
                        placeholder="新地址别名"
                        value={newSenderName}
                        onChange={(e) => setNewSenderName(e.target.value)}
                        size="small"
                      />
                      <Button type="text" icon={<Plus size={14} />} onClick={handleSaveSender}>
                        保存当前
                      </Button>
                    </Space>
                  </>
                )}
              >
                {savedSenders.map((addr) => (
                  <Select.Option key={addr.id} value={addr.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{addr.name}</span>
                      <Trash2
                        size={14}
                        className="text-gray-400 hover:text-red-500"
                        onClick={(e: React.MouseEvent) => handleDeleteSender(addr.id, e)}
                      />
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="senderName"
                label="发货人姓名"
                rules={[{ required: true, message: '请输入发货人姓名' }]}
              >
                <Input placeholder="姓名" />
              </Form.Item>
              <Form.Item
                name="senderPhone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="电话" />
              </Form.Item>
              <div className="col-span-2">
                <Form.Item
                  label="发货地址"
                  required
                  className="mb-0"
                  help="输入地址后点击定位图标获取经纬度"
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item
                      name="senderAddress"
                      noStyle
                      rules={[{ required: true, message: '请输入发货地址' }]}
                    >
                      <Input.TextArea placeholder="详细地址" rows={1} style={{ resize: 'none' }} />
                    </Form.Item>
                    <Button
                      icon={isGeocoding ? <Spin size="small" /> : <MapPin size={16} />}
                      onClick={() =>
                        geocodeAddress('senderAddress', 'senderLat', 'senderLng', '发货地址')
                      }
                      title="定位获取经纬度"
                      style={{ height: 'auto' }}
                    />
                  </Space.Compact>
                </Form.Item>
                <div className="flex gap-4 mt-2">
                  <Form.Item
                    name="senderLng"
                    noStyle
                    rules={[{ required: true, message: '请点击定位按钮获取经度' }]}
                  >
                    <Input placeholder="经度" disabled className="bg-gray-100" />
                  </Form.Item>
                  <Form.Item
                    name="senderLat"
                    noStyle
                    rules={[{ required: true, message: '请点击定位按钮获取纬度' }]}
                  >
                    <Input placeholder="纬度" disabled className="bg-gray-100" />
                  </Form.Item>
                </div>
              </div>
            </div>
          </div>

          {/* 收货人信息区域 */}
          <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-green-500" /> 收货信息
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="recipientName"
                label="收货人姓名"
                rules={[{ required: true, message: '请输入收货人姓名' }]}
              >
                <Input placeholder="姓名" />
              </Form.Item>
              <Form.Item
                name="recipientPhone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="电话" />
              </Form.Item>
              <div className="col-span-2">
                <Form.Item
                  label="收货地址"
                  required
                  className="mb-0"
                  help="输入地址后点击定位图标获取经纬度"
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item
                      name="recipientAddress"
                      noStyle
                      rules={[{ required: true, message: '请输入收货地址' }]}
                    >
                      <Input placeholder="请输入详细地址，如：深圳市南山区深南大道9966号" />
                    </Form.Item>
                    <Button
                      icon={isGeocoding ? <Spin size="small" /> : <MapPin size={16} />}
                      onClick={() =>
                        geocodeAddress(
                          'recipientAddress',
                          'recipientLat',
                          'recipientLng',
                          '收货地址'
                        )
                      }
                      title="定位获取经纬度"
                    />
                  </Space.Compact>
                </Form.Item>
                <div className="flex gap-4 mt-2">
                  <Form.Item
                    name="recipientLng"
                    noStyle
                    rules={[{ required: true, message: '请点击定位按钮获取经度' }]}
                  >
                    <Input placeholder="经度" disabled className="bg-gray-100" />
                  </Form.Item>
                  <Form.Item
                    name="recipientLat"
                    noStyle
                    rules={[{ required: true, message: '请点击定位按钮获取纬度' }]}
                  >
                    <Input placeholder="纬度" disabled className="bg-gray-100" />
                  </Form.Item>
                </div>
              </div>
            </div>
          </div>

          {/* 货物信息区域 */}
          <div className="md:col-span-2">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Save size={16} className="text-orange-500" /> 货物信息
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <Form.Item
                name="goodsName"
                label="物品名称"
                rules={[{ required: true, message: '请输入物品名称' }]}
              >
                <Input placeholder="例如：电子产品" />
              </Form.Item>
              <Form.Item name="goodsWeight" label="重量 (kg)">
                <InputNumber min={0.1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="goodsCount" label="数量">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="amount"
                label="订单金额"
                rules={[{ required: true, message: '请输入订单金额' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  prefix="¥"
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              </Form.Item>
            </div>
          </div>
        </div>
      </Form>
    </Modal>
  )
})

export default CreateOrderModal
