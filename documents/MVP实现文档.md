我将新建文档并写入以下内容，文件路径建议：`.trae/documents/MVP实现文档.md`（若需改至 `docs/` 目录也可）。请确认后我开始创建。

# MVP实现文档

## 文档目的

* 指导在 11-20 至 11-30 完成可交付 MVP，打通“商家发货→轨迹推送→用户实时追踪→确认收货”闭环

* 明确架构、数据模型、API、事件协议、页面组件、地图与动画实现、测试与验收标准

## 范围与目标

* 商家端：订单列表/筛选/排序、订单详情、模拟发货

* 用户端：订单号查询、地图实时追踪、基础物流时间线

* 后端服务：订单 REST API、轨迹模拟器（预置路线）、WebSocket 推送坐标

* 工程化：单仓库、ESLint/Prettier/Husky、基本 CI、环境区分

## 时间安排与里程碑（11-20 ～ 11-30）

* 11-20 ～ 11-22：项目初始化（仓库、工程化）、后端骨架与数据模型、前端框架与路由

* 11-23 ～ 11-25：订单 API 与发货流程、轨迹模拟器、Socket.IO 推送、前端订阅与基础地图渲染

* 11-26 ～ 11-28：平滑动画与时间线、列表筛选/排序、订单详情完善、错误与重连机制

* 11-29 ～ 11-30：联调与端到端测试、性能基础优化、MVP 验收与问题修复

## 架构设计

* 前端：React + TypeScript；`Redux Toolkit + RTK Query`；UI 库选 `Ant Design`

* 地图：高德地图 JS API；抽象地图适配层，便于更换供应商

* 后端：Node.js（Express + TypeScript），分层结构（路由/控制器/服务/数据访问）

* 实时通信：Socket.IO（服务端+客户端），心跳与重连机制基础版

* 存储：MVP 可用内存或 SQLite（后续可接入 Prisma + SQLite/PostgreSQL）

## 数据模型（MVP）

```ts
// Order
interface Order {
  id: string
  status: 'pending' | 'in_transit' | 'signed'
  amount: number
  createdAt: string // ISO
  recipient: { name: string; phone: string }
  address: { text: string; lat: number; lng: number }
}

// 轨迹点
interface TrackPoint {
  orderId: string
  lat: number
  lng: number
  ts: number
}

// 物流状态时间线
interface ShipmentState {
  orderId: string
  status: 'picked' | 'in_transit' | 'out_for_delivery' | 'signed'
  ts: number
}
```

## 术语与状态映射

* `Order.status`：`pending`→“待发货”，“in\_transit”→“运输中”，“signed”→“已签收（等同已完成）”

* `ShipmentState.status`：`picked`→“已揽收”，“in\_transit”→“运输中”，“out\_for\_delivery”→“派送中”，“signed”→“已签收”

* 终态统一：`signed` ≡ `delivered` ≡ “已完成/已签收”，接口与UI统一展示为“已签收”。

## 列表筛选枚举对齐

* `status`：`pending | in_transit | signed`

* `sort`：`createdAt | amount`

* `order`：`asc | desc`

## 时间同步约束

* 全部事件时间采用UTC时间戳`ts`；客户端以本地时区渲染。

* 允许客户端时钟漂移±1秒，超过时进行本地校正并标注刷新。

## REST API 规范

* `GET /api/orders?status=&sort=createdAt|amount&order=asc|desc`

* `GET /api/orders/:id`

* `POST /api/orders/:id/ship`

* `GET /api/orders/:id/tracking`

* 响应约定：

```json
{"data": {...}, "error": null}
{"data": null, "error": {"code": "BadRequest", "message": "..."}}
```

## WebSocket 事件协议

* 订阅：客户端以 `orderId` 订阅轨迹与状态

* 事件：

```json
// Order
interface Order {
  id: string
  status: 'pending' | 'in_transit' | 'signed'
  amount: number
  createdAt: string // ISO
  recipient: { name: string; phone: string }
  address: { text: string; lat: number; lng: number }
}

// 轨迹点
interface TrackPoint {
  orderId: string
  lat: number
  lng: number
  ts: number
}

// 物流状态时间线
interface ShipmentState {
  orderId: string
  status: 'picked' | 'in_transit' | 'out_for_delivery' | 'signed'
  ts: number
}
```

* 可靠性：心跳（ping/pong）、自动重连与订阅恢复

## 轨迹模拟（MVP）

* 预置多条路线坐标数组；发货后选取路线并以 500–1000ms 推送下一个点

* 基础 ETA：`remainingDistance / avgSpeed` 简化估算

* 状态推进：发货→已揽收→运输中→派送中→已签收（终点触发签收）

## 前端页面与组件

* `MerchantDashboard`：订单列表（筛选/排序/跳详情）

* `OrderDetail`：显示详情与发货按钮（调用 `POST /ship`）

* `TrackingSearch`：输入订单号，查询详情并订阅 WebSocket

* `TrackingMap`：高德地图初始化，车辆图标+轨迹 polyline + 当前位置

* `Timeline`：四态节点与时间戳，随 `order:status` 更新

## 地图与动画实现细节

* 渲染策略：轨迹线分段绘制、当前点单独图层；限制保留点数（如最近 500 点）

* 插值：线性插值相邻坐标，`requestAnimationFrame` 控制过渡；节流重绘

## 工程化与环境

* 规范：`ESLint + Prettier + Husky`；`lint-staged`

* 环境变量：`DEV/PROD` 区分后端地址、WebSocket 端点、地图 Key

* 常用脚本：

```bash
# frontend
npm run dev
npm run build

# backend
npm run dev
npm run build
npm run start
```

## 测试计划

* 单测：轨迹生成、状态推进；RTK slice

* 集成：发货→推送→订阅→地图更新→时间线更新

* 验收：100–200 订单、断线重连、无效订单号提示

## 验收标准

* 商家发货后状态变更与轨迹推送生效

* 用户地图车辆平滑移动，无明显跳变；时间线同步更新直至签收

* 端到端流程稳定，无阻塞性错误

## 风险与应对

* 地图卡顿：控制点数/抽样/节流，图层拆分

* 推送稳定：心跳与重连、订阅恢复、服务端缓冲

* 数据一致性：有限状态机，统一事件源

## 后续扩展（非MVP）

* 圈选与时效策略、路线规划接入、数据看板（热力图/时效/异常）

