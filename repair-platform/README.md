# 电子设备上门维修平台（MVP）

这是一个基于你的需求文档搭建的全栈项目脚手架，采用：

- 前端：React 18 + TypeScript + Vite + Ant Design
- 后端：Node.js + Express + TypeScript
- 数据层：当前使用内存 Mock 数据，便于快速演示；后续可替换为 MySQL + Redis

## 已实现的 MVP 页面与能力

- 首页：品牌介绍、服务流程、热门服务、工程师风采、用户评价
- 服务列表：设备类型筛选、维修项目展示
- 预约下单：多步骤表单，可提交订单到后端 API
- 用户中心：查看订单状态与订单列表
- 工程师工作台：查看待接单、开始服务、完成服务
- 管理后台：查看仪表盘与订单列表，支持指派工程师
- 后端 API：认证、设备类型、维修项目、订单、工程师、管理员等基础接口

## 项目结构

```text
repair-platform/
├── client/      # React 前端
├── server/      # Express 后端
├── .gitignore
├── package.json
└── README.md
```

## 为什么先做 MVP

因为你的需求很完整，直接一次性把支付、短信、地图、Redis、MySQL、OSS、WebSocket 全部落地，会让开发周期和复杂度瞬间起飞。先做 MVP 的原因：

1. 先验证页面流程和业务闭环是否合理
2. 先把接口结构、页面结构、角色结构定下来
3. 后续替换 Mock 数据为真实数据库时成本更低
4. 更容易演示、答辩、继续扩展并推送到 GitHub

## 本地运行

### 1. 安装依赖

在 `repair-platform` 目录执行：

- `npm install`
- `npm install --workspace client`
- `npm install --workspace server`

### 2. 启动后端

- `npm run dev:server`

默认地址：`http://localhost:4000`

### 3. 启动前端

新开一个终端：

- `npm run dev:client`

默认地址：`http://localhost:5173`

## 下一步建议

后续你可以继续把以下模块接进来：

- MySQL + Prisma / Sequelize
- Redis 缓存与会话
- JWT + RBAC 权限系统完善
- 高德地图地址选择与附近工程师匹配
- 支付接口（微信 / 支付宝）
- 文件上传（头像、评价图片）
- WebSocket 在线客服与消息通知
- GitHub Actions 自动部署
