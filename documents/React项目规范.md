# React 项目规范（基于《React 前端框架和组件化》）
声明式UI + 组件化 + 虚拟DOM + 单向数据流
## 技术选型与基础规范
- 组件范式：统一使用函数组件 + Hooks；避免类组件与 this 绑定；遵循 UI = f(props, state)。
- 构建工具：优先选择 Vite（或 Rspack）初始化项目，获得快速冷启动与构建。
- 核心 Hooks：
  - `useState` 管理局部状态；保持不可变更新（创建新对象或配合 Immer）。
  - `useEffect` 处理副作用（请求、订阅、事件）；明确依赖数组与清理函数。
  - `useMemo`/`useCallback` 缓存昂贵计算与函数引用，降低子组件重渲染。
- 代码组织：统一使用 ES Modules 与 TypeScript；类型尽可能面向接口与领域模型。

## 架构设计与组件划分
- 原子设计思想（按复用粒度分层）：
  - 原子组件（Atoms）：基础 UI 元素（如 Button、Input）。
  - 基础组件：通用的中等复杂度组件（如 Menu、Table）。
  - 复合组件：由基础组件组合（如 Sidebar、AsyncSelect）。
  - 业务容器组件（Organisms）：承载特定业务逻辑的模块。
  - 应用层（Pages）：路由对应的页面入口。
- 容器/展示分离：
  - 展示组件只负责渲染，数据经 Props 传入，不包含业务逻辑。
  - 容器组件负责数据获取、状态管理与交互逻辑，将处理好的数据传给展示组件。
- 逻辑复用：将通用副作用/业务逻辑抽为自定义 Hook（以 `use` 开头），提升可读性与复用度。

## 状态管理策略
- 局部状态：组件内使用 `useState`；对复杂对象采用不可变更新策略。
- 轻量全局状态：使用 React Context 管理主题、用户信息等简单低频数据，避免 Prop Drilling。
- 复杂全局状态：推荐 Redux Toolkit（或 Zustand）。
  - RTK 实践：`configureStore` 初始化、`createSlice` 自动生成 Action/Reducer，内置 Immer 简化更新。
  - 领域切片：按业务域划分 Slice（如 `Theme`、`Notification`、`WizardForm`），降低耦合。
- 服务端缓存：推荐 RTK Query 管理数据获取与缓存，统一请求生命周期、去重与失效策略。

## 路由管理
- SPA 路由：使用 React Router。
  - 基础：`BrowserRouter` 包裹应用，`Routes` + `Route` 定义路由表。
  - 导航与参数：`Link`/`useNavigate` 跳转；`useParams` 获取路径参数（如 `/user/:id`）。
  - 嵌套路由：通过 `<Outlet />` 实现布局与子页面渲染。
  - 代码分割：结合 `React.lazy` + `Suspense` 按路由懒加载。

## 样式与 UI 规范
- UI 组件库：推荐采用成熟 UI 库（如 ArcoDesign）；项目可根据既有生态选用 Ant Design，保持一致的视觉与交互规范。
- 定制策略：优先使用组件库 Props 或 Token 变量进行定制；减少手写样式成本。
- CSS 方案：必要时使用 CSS Modules（`.module.css`）实现样式隔离，避免全局类名冲突。
- 备选：Tailwind（原子化 CSS）与 CSS-in-JS 可在特定场景采用，但默认方案以“UI 库 + CSS Modules”为主。

## 性能优化
- 渲染控制：
  - 使用 `React.memo` 包裹纯展示组件，避免父组件更新导致的无意义重渲染。
  - 使用 `useMemo` 缓存昂贵计算；使用 `useCallback` 缓存回调函数引用。
- 列表与 Key：理解虚拟 DOM Diff，同层比较与稳定 `key` 的重要性，避免列表渲染抖动。
- 地图/动画场景（如本项目物流追踪）：插值动画使用 `requestAnimationFrame`，限制点数与节流重绘，分层渲染提升性能。

## 实战落地建议
- 初始化：使用 Vite 创建项目；安装 React Router、Redux Toolkit（或 Zustand）、UI 组件库（ArcoDesign/Ant Design）。
- 组件拆分：
  - 通用：导航栏、分页器。
  - 业务：商品卡片、购物车弹窗（或物流订单卡片、订单详情）。
  - 页面：列表页、详情页、查询页。
- 数据流设计：
  - 将列表、筛选条件、购物车/订单数据放入全局 Store；按业务域切分 Slice。
  - 使用 RTK Query 管理服务端数据与缓存，统一错误与重试策略。
- 交互实现：开发响应式 UI；对接真实或 Mock 数据；实现筛选、排序、分页与基本表单交互。

## 代码与协作规范（补充）
- 代码风格与质量：集成 ESLint、Prettier、Husky + lint-staged；统一提交与格式化。
- 目录约定：按“features/pages/components/services/utils/types”分层组织；逻辑与视图分离。
- 类型约束：领域模型统一在 `types`，前后端共享可抽至独立包（如 `@logistics/shared`）。
- 环境管理：区分 `DEV/PROD`；通过 `.env`/环境注入管理 API 与 WS 地址、第三方 Key。

## 与当前项目的对应关系（说明）
- 当前项目已采用 Vite + React + TypeScript，路由为 React Router；UI 库选 Ant Design，符合“成熟 UI 库 + 组件化”原则。
- 后续按规范可逐步接入 Redux Toolkit/RTK Query、自定义 Hook、CSS Modules 与懒加载，完善工程化与性能优化。
