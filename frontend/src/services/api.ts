import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type {
  Order,
  TrackPoint,
  DeliveryRule,
  AddressBook,
  LoginResponse,
  User,
} from '@logistics/shared'

// 自定义 baseQuery，自动添加 JWT Token
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  // 获取存储的 token
  const token = localStorage.getItem('token')

  // 创建基础 query
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: '/api', // 使用相对路径，通过 Vite 代理转发
    prepareHeaders: (headers) => {
      // 如果有 token，添加到 Authorization header
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return headers
    },
  })

  // 执行请求
  const result = await rawBaseQuery(args, api, extraOptions)

  // 只处理 401 未授权（Token 失效/未认证），清除本地存储并跳转到登录页
  // 403 是无权限（角色不匹配），不应该登出
  // 但不要在登录页面本身进行重定向，避免死循环
  if (result.error && result.error.status === 401) {
    const currentPath = window.location.pathname
    if (currentPath !== '/login') {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
  }
  // 403 错误不做处理，由组件自己处理

  return result
}

// 创建 API 服务
// createApi 是 RTK Query 的核心函数，它会自动生成 Hooks (如 useGetOrdersQuery)
export const api = createApi({
  reducerPath: 'api', // 在 Redux Store 中的挂载点
  baseQuery: baseQueryWithAuth, // 使用自定义的 baseQuery
  tagTypes: ['Order', 'AddressBook', 'DeliveryRule'], // 定义缓存标签，用于自动刷新数据
  endpoints: (builder) => ({
    // --- 订单相关接口 ---

    // 获取订单列表
    // 获取所有订单（公开接口，用于热力图）
    getOrders: builder.query<{ data: Order[] }, { status?: string; sort?: string; order?: string }>(
      {
        query: (params) => ({
          url: 'orders',
          params,
        }),
        providesTags: ['Order'],
      }
    ),

    // 获取当前用户的订单（需要认证）
    getMyOrders: builder.query<
      { data: Order[] },
      { status?: string; sort?: string; order?: string }
    >({
      query: (params) => ({
        url: 'orders/my',
        params,
      }),
      providesTags: ['Order'],
    }),

    // 获取单个订单详情
    getOrderById: builder.query<{ data: Order }, string>({
      query: (id) => `orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),

    // 创建新订单
    createOrder: builder.mutation<{ data: Order }, Partial<Order>>({
      query: (body) => ({
        url: 'orders',
        method: 'POST',
        body,
      }),
      // invalidatesTags: 使得 'Order' 标签失效，触发 getOrders 重新请求
      invalidatesTags: ['Order'],
    }),

    // 发货
    shipOrder: builder.mutation<{ data: { ok: boolean } }, { id: string; ruleId?: number }>({
      query: ({ id, ruleId }) => ({
        url: `orders/${id}/ship`,
        method: 'POST',
        body: { ruleId },
      }),
      // 失效特定 ID 的订单缓存和整个列表缓存
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }, 'Order'],
    }),

    // 批量发货
    batchShipOrders: builder.mutation<
      { data: { shipped: number } },
      { orderIds: string[]; ruleId?: number }
    >({
      query: (body) => ({
        url: 'orders/batch-ship',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order'],
    }),

    // 获取订单轨迹
    getOrderTracking: builder.query<{ data: TrackPoint[] }, string>({
      query: (id) => `orders/${id}/tracking`,
    }),

    // --- 用户认证接口 ---
    login: builder.mutation<
      { data: LoginResponse },
      { username: string; password?: string; role: string }
    >({
      query: (body) => ({
        url: 'login',
        method: 'POST',
        body,
      }),
    }),

    // --- 配送规则接口 ---
    getDeliveryRules: builder.query<{ data: DeliveryRule[] }, void>({
      query: () => 'delivery-rules',
      providesTags: ['DeliveryRule'],
    }),
    createDeliveryRule: builder.mutation<{ data: DeliveryRule }, Partial<DeliveryRule>>({
      query: (body) => ({
        url: 'delivery-rules',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeliveryRule'],
    }),
    updateDeliveryRule: builder.mutation<
      { data: DeliveryRule },
      { id: number; data: Partial<DeliveryRule> }
    >({
      query: ({ id, data }) => ({
        url: `delivery-rules/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['DeliveryRule'],
    }),
    deleteDeliveryRule: builder.mutation<{ data: { ok: boolean } }, number>({
      query: (id) => ({
        url: `delivery-rules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DeliveryRule'],
    }),

    // --- 地址簿接口 ---
    getAddressBook: builder.query<{ data: AddressBook[] }, { merchantId?: number }>({
      query: (params) => ({
        url: 'address-book',
        params,
      }),
      providesTags: ['AddressBook'],
    }),
    addAddress: builder.mutation<{ data: AddressBook }, Partial<AddressBook>>({
      query: (body) => ({
        url: 'address-book',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AddressBook'],
    }),
    deleteAddress: builder.mutation<{ data: { ok: boolean } }, string>({
      query: (id) => ({
        url: `address-book/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AddressBook'],
    }),

    // --- 通用工具接口 ---
    geocode: builder.mutation<{ data: { lat: number; lng: number } }, string>({
      query: (address) => ({
        url: 'geocode',
        params: { address },
      }),
    }),
    searchUsers: builder.mutation<{ data: User[] }, string>({
      query: (q) => ({
        url: 'users/search',
        params: { q },
      }),
    }),
  }),
})

export const {
  useGetOrdersQuery,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useShipOrderMutation,
  useBatchShipOrdersMutation,
  useGetOrderTrackingQuery,
  useLoginMutation,
  useGetDeliveryRulesQuery,
  useCreateDeliveryRuleMutation,
  useUpdateDeliveryRuleMutation,
  useDeleteDeliveryRuleMutation,
  useGetAddressBookQuery,
  useAddAddressMutation,
  useDeleteAddressMutation,
  useGeocodeMutation,
  useSearchUsersMutation,
} = api
