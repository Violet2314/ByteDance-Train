import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Order, TrackPoint } from '@logistics/shared'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3001/api' }),
  tagTypes: ['Order', 'AddressBook', 'DeliveryRule'],
  endpoints: (builder) => ({
    // --- 订单相关接口 ---
    getOrders: builder.query<
      { data: Order[] },
      { status?: string; sort?: string; order?: string; userId?: string }
    >({
      query: (params) => ({
        url: 'orders',
        params,
      }),
      providesTags: ['Order'],
    }),
    getOrderById: builder.query<{ data: Order }, string>({
      query: (id) => `orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    createOrder: builder.mutation<{ data: Order }, Partial<Order>>({
      query: (body) => ({
        url: 'orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order'],
    }),
    shipOrder: builder.mutation<{ data: { ok: boolean } }, { id: string; ruleId?: number }>({
      query: ({ id, ruleId }) => ({
        url: `orders/${id}/ship`,
        method: 'POST',
        body: { ruleId },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }, 'Order'],
    }),
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
    batchShipOrdersOptimized: builder.mutation<
      { data: { shipped: number } },
      { orderIds: string[]; routePath: { lat: number; lng: number }[]; ruleId?: number }
    >({
      query: (body) => ({
        url: 'orders/batch-ship-optimized',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order'],
    }),
    getOrderTracking: builder.query<{ data: TrackPoint[] }, string>({
      query: (id) => `orders/${id}/tracking`,
    }),

    // --- 用户认证接口 ---
    login: builder.mutation<{ data: any }, { username: string; password?: string; role: string }>({
      query: (body) => ({
        url: 'login',
        method: 'POST',
        body,
      }),
    }),

    // --- 配送规则接口 ---
    getDeliveryRules: builder.query<{ data: any[] }, void>({
      query: () => 'delivery-rules',
      providesTags: ['DeliveryRule'],
    }),
    createDeliveryRule: builder.mutation<{ data: any }, any>({
      query: (body) => ({
        url: 'delivery-rules',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeliveryRule'],
    }),
    updateDeliveryRule: builder.mutation<{ data: any }, { id: number; data: any }>({
      query: ({ id, data }) => ({
        url: `delivery-rules/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['DeliveryRule'],
    }),
    deleteDeliveryRule: builder.mutation<{ data: any }, number>({
      query: (id) => ({
        url: `delivery-rules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DeliveryRule'],
    }),

    // --- 地址簿接口 ---
    getAddressBook: builder.query<{ data: any[] }, { merchantId?: number }>({
      query: (params) => ({
        url: 'address-book',
        params,
      }),
      providesTags: ['AddressBook'],
    }),
    addAddress: builder.mutation<{ data: any }, any>({
      query: (body) => ({
        url: 'address-book',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AddressBook'],
    }),
    deleteAddress: builder.mutation<{ data: any }, string>({
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
    searchUsers: builder.mutation<{ data: any[] }, string>({
      query: (q) => ({
        url: 'users/search',
        params: { q },
      }),
    }),
  }),
})

export const {
  useGetOrdersQuery,
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
