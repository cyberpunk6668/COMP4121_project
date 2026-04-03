# 电子设备上门维修平台（MVP）

这是一个基于你的需求文档搭建的全栈项目脚手架，采用：

- 前端：React 18 + TypeScript + Vite + Ant Design
- 后端：Node.js + Express + TypeScript
- 数据层：客户与工程师账号信息使用本地 SQLite 持久化存储，订单等演示数据仍使用内存 Mock，便于快速演示

## 已实现的 MVP 页面与能力

- 首页：品牌介绍、服务流程、热门服务、工程师风采、用户评价
- 服务列表：设备类型筛选、维修项目展示
- 预约下单：多步骤表单，可提交订单到后端 API
- 用户中心：查看订单状态与订单列表
- 工程师工作台：查看待接单、开始服务、完成服务
- 管理后台：查看仪表盘与订单列表，支持指派工程师
- 后端 API：认证、设备类型、维修项目、订单、工程师、管理员等基础接口
- 微信支付：已接入 **WeChat Pay v3 Native 二维码支付** 后端签名、状态查询与回调处理流程

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
3. 先把账号体系落到本地 SQLite，后续再把订单/消息等数据迁移到真实数据库时成本更低
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

后端首次启动时会自动在 `repair-platform/server/storage/repair-platform.sqlite` 创建本地数据库文件，用来持久保存客户和工程师账号信息。

### 3. 启动前端

新开一个终端：

- `npm run dev:client`

默认地址：`http://localhost:5173`

## 下一步建议

后续你可以继续把以下模块接进来：

- MySQL + Prisma / Sequelize
- Redis 缓存与会话
- 把订单、论坛反馈、支付记录也迁移到数据库
- JWT + RBAC 权限系统完善
- 高德地图地址选择与附近工程师匹配
- 支付接口（微信 / 支付宝）
- 文件上传（头像、评价图片）
- WebSocket 在线客服与消息通知
- GitHub Actions 自动部署

## 微信支付接入说明

当前项目已经加入了**真实微信支付 Native 支付流程代码**，适合 PC Web 场景：

1. 用户下单并选择“微信支付”
2. 后端调用微信支付 v3 Native 下单接口
3. 前端展示二维码
4. 用户用微信扫码付款
5. 前端轮询支付状态，后端也支持微信回调通知更新订单

### 你需要准备的内容

要让它真的收款，你还需要把你的商户资料填进去：

- 微信支付商户号
- AppID
- 商户证书序列号
- API v3 Key
- 商户私钥文件 `apiclient_key.pem`
- 微信支付平台公钥文件
- 一个公网可访问的回调地址（本地开发可用内网穿透，如 ngrok、cpolar）

### 证书放置位置

把证书文件放到：

```text
repair-platform/server/certs/
```

例如：

- `repair-platform/server/certs/apiclient_key.pem`
- `repair-platform/server/certs/wechatpay_platform_public_key.pem`

### 环境变量

编辑 `repair-platform/server/.env`：

- `WECHAT_PAY_ENABLED=true`
- `WECHAT_PAY_APP_ID=你的AppID`
- `WECHAT_PAY_MCH_ID=你的商户号`
- `WECHAT_PAY_SERIAL_NO=你的商户证书序列号`
- `WECHAT_PAY_API_V3_KEY=你的32位APIv3密钥`
- `WECHAT_PAY_PRIVATE_KEY_PATH=server/certs/apiclient_key.pem`
- `WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH=server/certs/wechatpay_platform_public_key.pem`
- `WECHAT_PAY_NOTIFY_URL=https://你的公网域名/api/payments/wechat/notify`

### 已提供的接口

- `GET /api/payments/wechat/readiness`：检查是否完成微信支付配置
- `POST /api/payments/wechat/native/:orderId`：为订单创建微信 Native 二维码支付
- `GET /api/payments/wechat/status/:orderId`：查询订单支付状态
- `POST /api/payments/wechat/notify`：微信支付异步通知回调

### 重要说明

如果你现在直接运行项目但没有填商户信息，界面会提示“微信支付尚未完成配置”。这不是 bug，而是系统在阻止你拿占位符去和微信服务器硬碰硬。
