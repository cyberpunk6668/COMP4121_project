import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  addFeedbackReply,
  canAccessOrder,
  canAccessFeedbackThread,
  createFeedbackThread,
  createEngineerProfile,
  createOrder,
  createUser,
  deviceTypes,
  engineers,
  FeedbackReply,
  FeedbackThread,
  FeedbackScope,
  getFeedbackThreadById,
  getFeedbackThreadsForUser,
  getEngineerById,
  getEngineerByUserId,
  getOrderById,
  getOrderByOrderNo,
  getOrdersForUser,
  getRepairItemById,
  getUserById,
  getUserByPhone,
  initializeMockData,
  markOrderAsPaid,
  markOrderAsPendingPayment,
  markOrderPaymentFailed,
  Order,
  orders,
  repairItems,
  normalizePhone,
  sanitizeUser,
  setOrderPaymentQrCode,
  User,
  UserRole,
  users,
  verifyPassword
} from './data/mockData';
import {
  createNativeWechatPayment,
  getWechatPayReadiness,
  parseWechatPayNotification,
  queryWechatPaymentByOrderNo
} from './services/wechatPay';

dotenv.config();

type RawBodyRequest = Request & { rawBody?: string; authUser?: User };

type OrderView = Order & {
  customerNickname?: string;
  customerPhone?: string;
  engineerName?: string;
  repairItemName?: string;
  deviceTypeName?: string;
};

type FeedbackReplyView = FeedbackReply & {
  authorName?: string;
  authorRole?: UserRole;
};

type FeedbackThreadView = FeedbackThread & {
  authorName?: string;
  authorRole?: UserRole;
  orderNo?: string;
  repairItemName?: string;
  customerNickname?: string;
  engineerName?: string;
  replies: FeedbackReplyView[];
};

type TokenPayload = {
  userId: number;
  role: UserRole;
  iat: number;
  exp: number;
};

type PaymentMode = 'live' | 'manual';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-a-secure-secret';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(
  express.json({
    verify: (req, _res, buffer) => {
      (req as RawBodyRequest).rawBody = buffer.toString('utf8');
    }
  })
);

function issueToken(user: User) {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function readBearerToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length);
}

function requireAuth(roles?: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = readBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
      const user = getUserById(payload.userId);
      if (!user || user.status !== 'active') {
        return res.status(401).json({ success: false, message: 'User session is invalid.' });
      }

      if (roles && !roles.includes(user.role)) {
        return res.status(403).json({ success: false, message: 'You do not have permission for this action.' });
      }

      (req as RawBodyRequest).authUser = user;
      return next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
  };
}

function getPaymentMode() {
  const configuredProvider = (process.env.PAYMENT_PROVIDER || 'wechat-static-qr').trim();
  const readiness = getWechatPayReadiness();

  if (configuredProvider === 'wechat-native' && readiness.configured) {
    return { mode: 'live' as PaymentMode, readiness };
  }

  const manualMessage =
    configuredProvider === 'wechat-native'
      ? '当前未完成微信商户直连配置，已切换为微信收款码支付。用户扫码完成后，请在页面点击“我已完成支付”。'
      : '当前使用微信收款码支付。用户扫码完成后，请在页面点击“我已完成支付”。';

  return {
    mode: 'manual' as PaymentMode,
    readiness: {
      enabled: true,
      configured: true,
      message: manualMessage
    }
  };
}

function buildManualWechatCodeUrl(orderNo: string) {
  return `weixin://wxpay/manual/${orderNo}`;
}

function presentOrder(order: Order): OrderView {
  const customer = getUserById(order.userId);
  const assignedEngineer = order.engineerId ? getEngineerById(order.engineerId) : undefined;
  const repairItem = getRepairItemById(order.repairItemId);
  const deviceType = deviceTypes.find((item) => item.id === order.deviceTypeId);

  return {
    ...order,
    customerNickname: customer?.nickname,
    customerPhone: customer?.phone,
    engineerName: assignedEngineer?.realName,
    repairItemName: repairItem?.name,
    deviceTypeName: deviceType?.name
  };
}

function presentOrders(items: Order[]) {
  return items.map((item) => presentOrder(item));
}

function getUserDisplayName(user?: User) {
  if (!user) {
    return undefined;
  }
  return getEngineerByUserId(user.id)?.realName ?? user.nickname;
}

function presentFeedbackReply(reply: FeedbackReply): FeedbackReplyView {
  const author = getUserById(reply.authorUserId);
  return {
    ...reply,
    authorName: getUserDisplayName(author),
    authorRole: author?.role
  };
}

function presentFeedbackThread(thread: FeedbackThread): FeedbackThreadView {
  const author = getUserById(thread.authorUserId);
  const linkedOrder = thread.orderId ? getOrderById(thread.orderId) : undefined;
  const customer = linkedOrder ? getUserById(linkedOrder.userId) : undefined;
  const assignedEngineer = linkedOrder?.engineerId ? getEngineerById(linkedOrder.engineerId) : undefined;
  const repairItem = linkedOrder ? getRepairItemById(linkedOrder.repairItemId) : undefined;

  return {
    ...thread,
    authorName: getUserDisplayName(author),
    authorRole: author?.role,
    orderNo: linkedOrder?.orderNo,
    repairItemName: repairItem?.name,
    customerNickname: customer?.nickname,
    engineerName: assignedEngineer?.realName,
    replies: thread.replies.map((reply) => presentFeedbackReply(reply))
  };
}

function presentFeedbackThreads(items: FeedbackThread[]) {
  return items.map((item) => presentFeedbackThread(item));
}

app.get('/api/health', (_req: Request, res: Response) => {
  const { mode } = getPaymentMode();
  res.json({ success: true, message: 'Repair platform API is running.', data: { paymentMode: mode } });
});

app.get('/api/auth/demo-accounts', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { role: 'customer', phone: '13800000000', password: 'demo123' },
      { role: 'engineer', phone: '13900000000', password: 'demo123' },
      { role: 'admin', phone: '13700000000', password: 'admin123' }
    ]
  });
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { phone, password, nickname, role, realName, skillDesc, serviceArea } = req.body as {
    phone?: string;
    password?: string;
    nickname?: string;
    role?: UserRole;
    realName?: string;
    skillDesc?: string;
    serviceArea?: string;
  };

  const normalizedPhone = normalizePhone(phone ?? '');

  if (!normalizedPhone || !password || !nickname || !role) {
    return res.status(400).json({ success: false, message: 'Phone, password, nickname, and role are required.' });
  }

  if (!/^\d{6,20}$/.test(normalizedPhone)) {
    return res.status(400).json({ success: false, message: 'Phone number format is invalid.' });
  }

  if (!['customer', 'engineer'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be customer or engineer.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  if (getUserByPhone(normalizedPhone)) {
    return res.status(409).json({ success: false, message: 'This phone number has already been registered.' });
  }

  try {
    const user = await createUser({ phone: normalizedPhone, password, nickname, role: role as 'customer' | 'engineer' });

    if (role === 'engineer') {
      await createEngineerProfile({
        userId: user.id,
        realName: realName || nickname,
        skillDesc: skillDesc || '新入驻工程师，等待完善技能简介。',
        serviceArea: serviceArea || '待设置服务区域'
      });
    }

    const token = issueToken(user);
    return res.status(201).json({ success: true, data: { token, user: sanitizeUser(user) } });
  } catch (error) {
    if (error instanceof Error && error.message === 'This phone number has already been registered.') {
      return res.status(409).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to create account.' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { phone, password } = req.body as { phone?: string; password?: string };
  const normalizedPhone = normalizePhone(phone ?? '');

  if (!normalizedPhone || !password) {
    return res.status(400).json({ success: false, message: 'Phone and password are required.' });
  }

  const user = getUserByPhone(normalizedPhone);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ success: false, message: 'Phone or password is incorrect.' });
  }

  const token = issueToken(user);
  return res.json({ success: true, data: { token, user: sanitizeUser(user) } });
});

app.get('/api/auth/profile', requireAuth(), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  return res.json({ success: true, data: sanitizeUser(currentUser) });
});

app.get('/api/device-types', (_req: Request, res: Response) => {
  res.json({ success: true, data: deviceTypes });
});

app.get('/api/device-types/:id/items', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const items = repairItems.filter((item) => item.deviceTypeId === id);
  res.json({ success: true, data: items });
});

app.get('/api/repair-items', (_req: Request, res: Response) => {
  res.json({ success: true, data: repairItems });
});

app.get('/api/repair-items/:id', (req: Request, res: Response) => {
  const item = getRepairItemById(Number(req.params.id));
  if (!item) {
    return res.status(404).json({ success: false, message: 'Repair item not found.' });
  }
  return res.json({ success: true, data: item });
});

app.get('/api/orders', requireAuth(), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  res.json({ success: true, data: presentOrders(getOrdersForUser(currentUser)) });
});

app.get('/api/orders/:id', requireAuth(), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const order = getOrderById(Number(req.params.id));

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (!canAccessOrder(currentUser, order)) {
    return res.status(403).json({ success: false, message: 'You cannot access this order.' });
  }

  return res.json({ success: true, data: presentOrder(order) });
});

app.post('/api/orders', requireAuth(['customer', 'admin']), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const { deviceTypeId, repairItemId, deviceModel, problemDesc, address, appointmentTime, paymentMethod, creditCardNumber, creditCardSecret } = req.body as {
    deviceTypeId?: number;
    repairItemId?: number;
    deviceModel?: string;
    problemDesc?: string;
    address?: string;
    appointmentTime?: string;
    paymentMethod?: string;
    creditCardNumber?: string;
    creditCardSecret?: string;
  };

  if (!deviceTypeId || !repairItemId || !deviceModel || !problemDesc || !address || !appointmentTime || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  const repairItem = getRepairItemById(Number(repairItemId));
  if (!repairItem) {
    return res.status(404).json({ success: false, message: 'Repair item not found.' });
  }

  if (paymentMethod === '信用卡') {
    const normalizedCreditCardNumber = (creditCardNumber ?? '').replace(/\s|-/g, '');
    if (!/^\d{13,19}$/.test(normalizedCreditCardNumber)) {
      return res.status(400).json({ success: false, message: 'Credit card number must be 13 to 19 digits.' });
    }

    if (!/^\d{3,4}$/.test(creditCardSecret ?? '')) {
      return res.status(400).json({ success: false, message: 'Credit card security code must be 3 or 4 digits.' });
    }
  }

  const order = createOrder({
    userId: currentUser.id,
    engineerId: null,
    deviceTypeId: Number(deviceTypeId),
    repairItemId: Number(repairItemId),
    deviceModel,
    problemDesc,
    address,
    appointmentTime,
    totalAmount: repairItem.price,
    paymentMethod,
    paymentStatus: '待支付',
    status: '待支付'
  });

  if (paymentMethod === '微信支付') {
    markOrderAsPendingPayment(order, paymentMethod);
  } else if (paymentMethod === '信用卡') {
    const normalizedCreditCardNumber = (creditCardNumber ?? '').replace(/\s|-/g, '');
    markOrderAsPaid(order, `credit-card-${normalizedCreditCardNumber.slice(-4)}`);
  } else {
    markOrderAsPaid(order, `offline-${order.orderNo}`);
  }

  return res.status(201).json({ success: true, data: presentOrder(order) });
});

app.put('/api/orders/:id/cancel', requireAuth(), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const order = getOrderById(Number(req.params.id));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (!canAccessOrder(currentUser, order)) {
    return res.status(403).json({ success: false, message: 'You cannot cancel this order.' });
  }

  order.status = '已取消';
  return res.json({ success: true, data: presentOrder(order) });
});

app.post('/api/orders/:id/review', requireAuth(['customer', 'admin']), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const order = getOrderById(Number(req.params.id));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (!canAccessOrder(currentUser, order)) {
    return res.status(403).json({ success: false, message: 'You cannot review this order.' });
  }

  order.status = '已完成';
  return res.json({ success: true, data: { order: presentOrder(order), review: req.body } });
});

app.get('/api/feedback', requireAuth(), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  return res.json({ success: true, data: presentFeedbackThreads(getFeedbackThreadsForUser(currentUser)) });
});

app.post('/api/feedback', requireAuth(), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const { scope, orderId, title, content } = req.body as {
    scope?: FeedbackScope;
    orderId?: number;
    title?: string;
    content?: string;
  };

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ success: false, message: 'Feedback title and content are required.' });
  }

  if (scope !== 'order' && scope !== 'platform') {
    return res.status(400).json({ success: false, message: 'Feedback scope must be order or platform.' });
  }

  let linkedOrder: Order | undefined;
  if (scope === 'order') {
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order feedback must be linked to an order.' });
    }

    linkedOrder = getOrderById(Number(orderId));
    if (!linkedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (!canAccessOrder(currentUser, linkedOrder)) {
      return res.status(403).json({ success: false, message: 'You cannot create feedback for this order.' });
    }
  }

  const thread = createFeedbackThread({
    scope,
    orderId: scope === 'order' ? Number(orderId) : null,
    authorUserId: currentUser.id,
    title: title.trim(),
    content: content.trim()
  });

  return res.status(201).json({ success: true, data: presentFeedbackThread(thread) });
});

app.post('/api/feedback/:id/replies', requireAuth(), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const thread = getFeedbackThreadById(Number(req.params.id));
  const { content } = req.body as { content?: string };

  if (!thread) {
    return res.status(404).json({ success: false, message: 'Feedback thread not found.' });
  }

  if (!canAccessFeedbackThread(currentUser, thread)) {
    return res.status(403).json({ success: false, message: 'You do not have permission to view this feedback thread.' });
  }

  if (!content?.trim()) {
    return res.status(400).json({ success: false, message: 'Reply content is required.' });
  }

  addFeedbackReply(thread, {
    authorUserId: currentUser.id,
    content: content.trim()
  });

  return res.status(201).json({ success: true, data: presentFeedbackThread(thread) });
});

app.get('/api/payments/wechat/readiness', requireAuth(), (_req: Request, res: Response) => {
  const { mode, readiness } = getPaymentMode();
  res.json({ success: true, data: { ...readiness, mode } });
});

app.post('/api/payments/wechat/native/:orderId', requireAuth(['customer', 'admin']), async (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const order = getOrderById(Number(req.params.orderId));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (!canAccessOrder(currentUser, order)) {
    return res.status(403).json({ success: false, message: 'You cannot pay this order.' });
  }

  if (order.paymentMethod !== '微信支付') {
    return res.status(400).json({ success: false, message: 'This order is not using WeChat Pay.' });
  }

  if (order.paymentStatus === '已支付') {
    return res.json({
      success: true,
      data: {
        order: presentOrder(order),
        codeUrl: order.paymentQrCode,
        paymentMode: getPaymentMode().mode,
        canManualConfirm: false
      }
    });
  }

  const { mode, readiness } = getPaymentMode();

  try {
    const codeUrl =
      mode === 'live'
        ? (await createNativeWechatPayment(order)).code_url
        : order.paymentQrCode || buildManualWechatCodeUrl(order.orderNo);

    setOrderPaymentQrCode(order, codeUrl);

    return res.json({
      success: true,
      data: {
        order: presentOrder(order),
        codeUrl,
        paymentMode: mode,
        canManualConfirm: mode === 'manual',
        readiness
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create WeChat payment.'
    });
  }
});

app.post('/api/payments/wechat/confirm/:orderId', requireAuth(['customer', 'admin']), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const order = getOrderById(Number(req.params.orderId));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (!canAccessOrder(currentUser, order)) {
    return res.status(403).json({ success: false, message: 'You cannot pay this order.' });
  }

  const { mode } = getPaymentMode();
  if (mode !== 'manual') {
    return res.status(400).json({ success: false, message: 'Manual confirmation is only available when using the static WeChat QR payment channel.' });
  }

  markOrderAsPaid(order, `manual-${order.orderNo}`);
  return res.json({ success: true, data: presentOrder(order) });
});

app.get('/api/payments/wechat/status/:orderId', requireAuth(), async (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const order = getOrderById(Number(req.params.orderId));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (!canAccessOrder(currentUser, order)) {
    return res.status(403).json({ success: false, message: 'You cannot access this payment.' });
  }

  const { mode, readiness } = getPaymentMode();

  if (mode === 'live' && order.paymentMethod === '微信支付' && order.paymentStatus !== '已支付') {
    try {
      const transaction = await queryWechatPaymentByOrderNo(order.orderNo);
      if (transaction.trade_state === 'SUCCESS') {
        markOrderAsPaid(order, transaction.transaction_id, transaction.success_time);
      } else if (transaction.trade_state === 'PAYERROR') {
        markOrderPaymentFailed(order);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to query WeChat payment status.'
      });
    }
  }

  return res.json({ success: true, data: { order: presentOrder(order), paymentMode: mode, readiness } });
});

app.post('/api/payments/wechat/notify', (req: Request, res: Response) => {
  const rawBody = (req as RawBodyRequest).rawBody ?? '';

  try {
    const notification = parseWechatPayNotification(rawBody, req.headers);
    const order = getOrderByOrderNo(notification.outTradeNo);

    if (!order) {
      return res.status(404).json({ code: 'FAIL', message: 'Order not found.' });
    }

    if (notification.tradeState === 'SUCCESS') {
      markOrderAsPaid(order, notification.transactionId, notification.successTime);
    }

    return res.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    return res.status(400).json({
      code: 'FAIL',
      message: error instanceof Error ? error.message : 'Invalid WeChat Pay notification.'
    });
  }
});

app.get('/api/engineers', (_req: Request, res: Response) => {
  res.json({ success: true, data: engineers });
});

app.get('/api/engineer/orders/pending', requireAuth(['engineer', 'admin']), (_req: Request, res: Response) => {
  res.json({ success: true, data: presentOrders(orders.filter((order) => order.status === '待分配')) });
});

app.get('/api/engineer/stats', requireAuth(['engineer', 'admin']), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const engineerProfile = getEngineerByUserId(currentUser.id);
  const myOrders = engineerProfile ? orders.filter((order) => order.engineerId === engineerProfile.id) : [];

  res.json({
    success: true,
    data: {
      todayOrders: myOrders.length,
      todayIncome: myOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      rating: engineerProfile?.avgRating ?? 0,
      engineer: engineerProfile
    }
  });
});

app.post('/api/engineer/orders/:id/accept', requireAuth(['engineer', 'admin']), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const order = getOrderById(Number(req.params.id));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const fallbackEngineer = currentUser.role === 'engineer' ? getEngineerByUserId(currentUser.id) : undefined;
  const requestedEngineerId = Number((req.body as { engineerId?: number }).engineerId);
  const engineer = currentUser.role === 'admin' ? getEngineerById(requestedEngineerId) : fallbackEngineer;

  if (!engineer) {
    return res.status(400).json({ success: false, message: 'Engineer profile is not available.' });
  }

  order.engineerId = engineer.id;
  order.status = '待上门';
  return res.json({ success: true, data: presentOrder(order) });
});

app.put('/api/engineer/orders/:id/start', requireAuth(['engineer', 'admin']), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const order = getOrderById(Number(req.params.id));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (currentUser.role === 'engineer') {
    const engineer = getEngineerByUserId(currentUser.id);
    if (order.engineerId !== engineer?.id) {
      return res.status(403).json({ success: false, message: 'You can only start your own assigned orders.' });
    }
  }

  order.status = '服务中';
  return res.json({ success: true, data: presentOrder(order) });
});

app.put('/api/engineer/orders/:id/complete', requireAuth(['engineer', 'admin']), (req: Request, res: Response) => {
  const currentUser = (req as RawBodyRequest).authUser!;
  const order = getOrderById(Number(req.params.id));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (currentUser.role === 'engineer') {
    const engineer = getEngineerByUserId(currentUser.id);
    if (order.engineerId !== engineer?.id) {
      return res.status(403).json({ success: false, message: 'You can only complete your own assigned orders.' });
    }
  }

  order.status = '待评价';
  return res.json({ success: true, data: presentOrder(order) });
});

app.get('/api/admin/dashboard', requireAuth(['admin']), (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      orders: orders.length,
      revenue: orders.filter((order) => order.status !== '已取消').reduce((sum, order) => sum + order.totalAmount, 0),
      users: users.length,
      engineers: engineers.length
    }
  });
});

app.get('/api/admin/orders', requireAuth(['admin']), (_req: Request, res: Response) => {
  res.json({ success: true, data: presentOrders(orders.slice().sort((a, b) => b.id - a.id)) });
});

app.put('/api/admin/orders/:id/assign', requireAuth(['admin']), (req: Request, res: Response) => {
  const order = getOrderById(Number(req.params.id));
  const engineerId = Number((req.body as { engineerId?: number }).engineerId);
  const engineer = getEngineerById(engineerId);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (!engineer) {
    return res.status(404).json({ success: false, message: 'Engineer not found.' });
  }

  order.engineerId = engineer.id;
  order.status = '待上门';
  return res.json({ success: true, data: presentOrder(order) });
});

async function startServer() {
  try {
    await initializeMockData();
    app.listen(PORT, () => {
      console.log(`Repair platform API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize the account database.', error);
    process.exit(1);
  }
}

void startServer();
