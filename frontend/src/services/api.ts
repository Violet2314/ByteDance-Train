import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Order, TrackPoint } from '@logistics/shared'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3001/api' }),
  tagTypes: ['Order'],
  endpoints: (builder) => ({
    getOrders: builder.query<{ data: Order[] }, { status?: string; sort?: string; order?: string }>(
      {
        query: (params) => ({
          url: 'orders',
          params,
        }),
        providesTags: ['Order'],
      }
    ),
    getOrderById: builder.query<{ data: Order }, string>({
      query: (id) => `orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    shipOrder: builder.mutation<{ data: { ok: boolean } }, string>({
      query: (id) => ({
        url: `orders/${id}/ship`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Order', id }, 'Order'],
    }),
    getOrderTracking: builder.query<{ data: TrackPoint[] }, string>({
      query: (id) => `orders/${id}/tracking`,
    }),
  }),
})

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useShipOrderMutation,
  useGetOrderTrackingQuery,
} = api
