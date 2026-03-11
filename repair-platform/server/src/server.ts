import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  deviceTypes,
  engineers,
  generateOrderNo,
  getOrderById,
  getRepairItemById,
  orders,
  repairItems,
  users
} from './data/mockData';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-a-secure-secret';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Repair platform API is running.' });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { phone } = req.body as { phone?: string };
  const user = users.find((item) => item.phone === phone) ?? users[0];
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    data: {
      token,
      user
    }
  });
});

app.get('/api/auth/profile', (_req: Request, res: Response) => {
  res.json({ success: true, data: users[0] });
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
    return res.status(404).json({ success: false, message: 'Repair item not found' });
  }
  return res.json({ success: true, data: item });
});

app.get('/api/orders', (_req: Request, res: Response) => {
  res.json({ success: true, data: orders.slice().sort((a, b) => b.id - a.id) });
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = getOrderById(Number(req.params.id));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  return res.json({ success: true, data: order });
});

app.post('/api/orders', (req: Request, res: Response) => {
  const {
    deviceTypeId,
    repairItemId,
    deviceModel,
    problemDesc,
    address,
    appointmentTime,
    paymentMethod
  } = req.body as {
    deviceTypeId?: number;
    repairItemId?: number;
    deviceModel?: string;
    problemDesc?: string;
    address?: string;
    appointmentTime?: string;
    paymentMethod?: string;
  };

  if (!deviceTypeId || !repairItemId || !deviceModel || !problemDesc || !address || !appointmentTime || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const item = getRepairItemById(Number(repairItemId));
  if (!item) {
    return res.status(404).json({ success: false, message: 'Repair item not found' });
  }

  const order = {
    id: orders.length + 1,
    orderNo: generateOrderNo(),
    userId: 1,
    engineerId: null,
    deviceTypeId: Number(deviceTypeId),
    repairItemId: Number(repairItemId),
    deviceModel,
    problemDesc,
    address,
    appointmentTime,
    totalAmount: item.price,
    paymentMethod,
    paymentStatus: '已支付' as const,
    status: '待分配' as const,
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);
  return res.status(201).json({ success: true, data: order });
});

app.put('/api/orders/:id/cancel', (req: Request, res: Response) => {
  const order = getOrderById(Number(req.params.id));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  order.status = '已取消';
  res.json({ success: true, data: order });
});

app.post('/api/orders/:id/review', (req: Request, res: Response) => {
  const order = getOrderById(Number(req.params.id));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  order.status = '已完成';
  res.json({ success: true, data: { order, review: req.body } });
});

app.get('/api/engineers', (_req: Request, res: Response) => {
  res.json({ success: true, data: engineers });
});

app.get('/api/engineer/orders/pending', (_req: Request, res: Response) => {
  res.json({ success: true, data: orders.filter((order) => order.status === '待分配') });
});

app.get('/api/engineer/stats', (_req: Request, res: Response) => {
  const activeEngineer = engineers[0];
  const myOrders = orders.filter((order) => order.engineerId === activeEngineer.id);
  res.json({
    success: true,
    data: {
      todayOrders: myOrders.length,
      todayIncome: myOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      rating: activeEngineer.avgRating
    }
  });
});

app.post('/api/engineer/orders/:id/accept', (req: Request, res: Response) => {
  const order = getOrderById(Number(req.params.id));
  const engineerId = Number((req.body as { engineerId?: number }).engineerId || engineers[0].id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.engineerId = engineerId;
  order.status = '待上门';
  return res.json({ success: true, data: order });
});

app.put('/api/engineer/orders/:id/start', (req: Request, res: Response) => {
  const order = getOrderById(Number(req.params.id));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.status = '服务中';
  return res.json({ success: true, data: order });
});

app.put('/api/engineer/orders/:id/complete', (req: Request, res: Response) => {
  const order = getOrderById(Number(req.params.id));
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.status = '待评价';
  return res.json({ success: true, data: order });
});

app.get('/api/admin/dashboard', (_req: Request, res: Response) => {
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

app.get('/api/admin/orders', (_req: Request, res: Response) => {
  res.json({ success: true, data: orders });
});

app.put('/api/admin/orders/:id/assign', (req: Request, res: Response) => {
  const order = getOrderById(Number(req.params.id));
  const engineerId = Number((req.body as { engineerId?: number }).engineerId);
  const engineer = engineers.find((item) => item.id === engineerId);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (!engineer) {
    return res.status(404).json({ success: false, message: 'Engineer not found' });
  }

  order.engineerId = engineerId;
  order.status = '待上门';
  return res.json({ success: true, data: order });
});

app.listen(PORT, () => {
  console.log(`Repair platform API listening on http://localhost:${PORT}`);
});
