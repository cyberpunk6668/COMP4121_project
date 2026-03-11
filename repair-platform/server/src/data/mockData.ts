import { createHash } from 'crypto';

export type UserRole = 'customer' | 'engineer' | 'admin';
export type UserStatus = 'active' | 'disabled';
export type OrderPaymentStatus = '待支付' | '已支付' | '支付失败';
export type OrderStatus = '待支付' | '待分配' | '待上门' | '服务中' | '待评价' | '已完成' | '已取消';

export interface User {
  id: number;
  phone: string;
  nickname: string;
  role: UserRole;
  passwordHash: string;
  status: UserStatus;
  createdAt: string;
}

export interface PublicUser {
  id: number;
  phone: string;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  engineerProfile?: Engineer;
}

export interface DeviceType {
  id: number;
  name: string;
  icon: string;
  status: number;
}

export interface RepairItem {
  id: number;
  deviceTypeId: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  rating: number;
  sales: number;
}

export interface Engineer {
  id: number;
  userId: number;
  realName: string;
  skillDesc: string;
  serviceArea: string;
  avgRating: number;
  totalOrders: number;
  status: number;
  avatar: string;
}

export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  engineerId: number | null;
  deviceTypeId: number;
  repairItemId: number;
  deviceModel: string;
  problemDesc: string;
  address: string;
  appointmentTime: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: OrderPaymentStatus;
  status: OrderStatus;
  createdAt: string;
  transactionId?: string;
  paidAt?: string;
  paymentQrCode?: string;
}

interface CreateUserInput {
  phone: string;
  nickname: string;
  password: string;
  role: Exclude<UserRole, 'admin'>;
}

interface CreateEngineerInput {
  userId: number;
  realName: string;
  skillDesc: string;
  serviceArea: string;
}

const AUTH_SALT = 'repair-platform-demo-salt';

function nowIso() {
  return new Date().toISOString();
}

export function hashPassword(password: string) {
  return createHash('sha256').update(`${password}:${AUTH_SALT}`).digest('hex');
}

export function verifyPassword(password: string, passwordHash: string) {
  return hashPassword(password) === passwordHash;
}

export const users: User[] = [
  {
    id: 1,
    phone: '13800000000',
    nickname: '演示客户',
    role: 'customer',
    passwordHash: hashPassword('demo123'),
    status: 'active',
    createdAt: '2026-03-01T09:00:00.000Z'
  },
  {
    id: 2,
    phone: '13900000000',
    nickname: '工程师账号',
    role: 'engineer',
    passwordHash: hashPassword('demo123'),
    status: 'active',
    createdAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 3,
    phone: '13700000000',
    nickname: '管理员',
    role: 'admin',
    passwordHash: hashPassword('admin123'),
    status: 'active',
    createdAt: '2026-03-01T11:00:00.000Z'
  }
];

export const deviceTypes: DeviceType[] = [
  { id: 1, name: '手机', icon: '📱', status: 1 },
  { id: 2, name: '电脑', icon: '💻', status: 1 },
  { id: 3, name: '平板', icon: '🧾', status: 1 },
  { id: 4, name: '相机', icon: '📷', status: 1 }
];

export const repairItems: RepairItem[] = [
  {
    id: 1,
    deviceTypeId: 1,
    name: '手机屏幕更换',
    description: '适用于碎屏、花屏、触控失灵等常见问题。',
    price: 299,
    duration: 90,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    sales: 1280
  },
  {
    id: 2,
    deviceTypeId: 1,
    name: '手机电池更换',
    description: '解决续航差、自动关机、充电异常等问题。',
    price: 199,
    duration: 60,
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    sales: 940
  },
  {
    id: 3,
    deviceTypeId: 2,
    name: '笔记本清灰保养',
    description: '降低温度与风扇噪音，提升性能稳定性。',
    price: 199,
    duration: 60,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    sales: 860
  },
  {
    id: 4,
    deviceTypeId: 3,
    name: '平板电池更换',
    description: '适用于电池鼓包、掉电快、充电慢等故障。',
    price: 259,
    duration: 75,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    sales: 530
  }
];

export const engineers: Engineer[] = [
  {
    id: 1,
    userId: 2,
    realName: '张工',
    skillDesc: '手机主板、屏幕、电池、进水维修',
    serviceArea: 'Sydney CBD / Zetland',
    avgRating: 4.9,
    totalOrders: 860,
    status: 1,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  }
];

export const orders: Order[] = [
  {
    id: 1,
    orderNo: 'RP202603110001',
    userId: 1,
    engineerId: 1,
    deviceTypeId: 1,
    repairItemId: 1,
    deviceModel: 'iPhone 14 Pro',
    problemDesc: '屏幕碎裂，左侧触控不灵敏。',
    address: 'Sydney CBD George St 188 号',
    appointmentTime: '2026-03-12 14:00-16:00',
    totalAmount: 299,
    paymentMethod: '微信支付',
    paymentStatus: '已支付',
    status: '待上门',
    createdAt: '2026-03-11T09:00:00.000Z',
    transactionId: '420000202603110001',
    paidAt: '2026-03-11T09:05:00.000Z'
  },
  {
    id: 2,
    orderNo: 'RP202603110002',
    userId: 1,
    engineerId: null,
    deviceTypeId: 2,
    repairItemId: 3,
    deviceModel: 'MacBook Air M2',
    problemDesc: '风扇异响，机身发热明显。',
    address: 'North Sydney Miller St 66 号',
    appointmentTime: '2026-03-13 10:00-12:00',
    totalAmount: 199,
    paymentMethod: '微信支付',
    paymentStatus: '待支付',
    status: '待支付',
    createdAt: '2026-03-11T10:30:00.000Z'
  }
];

export function sanitizeUser(user: User): PublicUser {
  const engineerProfile = getEngineerByUserId(user.id);
  return {
    id: user.id,
    phone: user.phone,
    nickname: user.nickname,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    engineerProfile
  };
}

export function getUserById(id: number) {
  return users.find((user) => user.id === id);
}

export function getUserByPhone(phone: string) {
  return users.find((user) => user.phone === phone);
}

export function getEngineerByUserId(userId: number) {
  return engineers.find((engineer) => engineer.userId === userId);
}

export function getEngineerById(id: number) {
  return engineers.find((engineer) => engineer.id === id);
}

export function createUser(input: CreateUserInput) {
  const user: User = {
    id: users.length + 1,
    phone: input.phone,
    nickname: input.nickname,
    role: input.role,
    passwordHash: hashPassword(input.password),
    status: 'active',
    createdAt: nowIso()
  };
  users.push(user);
  return user;
}

export function createEngineerProfile(input: CreateEngineerInput) {
  const engineer: Engineer = {
    id: engineers.length + 1,
    userId: input.userId,
    realName: input.realName,
    skillDesc: input.skillDesc,
    serviceArea: input.serviceArea,
    avgRating: 5,
    totalOrders: 0,
    status: 0,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'
  };
  engineers.push(engineer);
  return engineer;
}

export function generateOrderNo() {
  return `RP${Date.now()}${Math.floor(Math.random() * 90 + 10)}`;
}

export function getRepairItemById(id: number) {
  return repairItems.find((item) => item.id === id);
}

export function getOrderById(id: number) {
  return orders.find((order) => order.id === id);
}

export function getOrderByOrderNo(orderNo: string) {
  return orders.find((order) => order.orderNo === orderNo);
}

export function getOrdersForUser(user: User) {
  if (user.role === 'admin') {
    return orders.slice().sort((a, b) => b.id - a.id);
  }

  if (user.role === 'engineer') {
    const engineer = getEngineerByUserId(user.id);
    return orders
      .filter((order) => order.engineerId === engineer?.id || order.status === '待分配')
      .sort((a, b) => b.id - a.id);
  }

  return orders.filter((order) => order.userId === user.id).sort((a, b) => b.id - a.id);
}

export function createOrder(input: Omit<Order, 'id' | 'orderNo' | 'createdAt'>) {
  const order: Order = {
    ...input,
    id: orders.length + 1,
    orderNo: generateOrderNo(),
    createdAt: nowIso()
  };
  orders.unshift(order);
  return order;
}

export function canAccessOrder(user: User, order: Order) {
  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'customer') {
    return order.userId === user.id;
  }

  const engineer = getEngineerByUserId(user.id);
  return order.engineerId === engineer?.id || order.status === '待分配';
}

export function markOrderAsPendingPayment(order: Order, paymentMethod: string) {
  order.paymentMethod = paymentMethod;
  order.paymentStatus = '待支付';
  order.status = '待支付';
  order.transactionId = undefined;
  order.paidAt = undefined;
}

export function markOrderAsPaid(order: Order, transactionId?: string, paidAt?: string) {
  order.paymentStatus = '已支付';
  order.status = '待分配';
  order.transactionId = transactionId;
  order.paidAt = paidAt ?? nowIso();
}

export function markOrderPaymentFailed(order: Order) {
  order.paymentStatus = '支付失败';
  order.status = '待支付';
}

export function setOrderPaymentQrCode(order: Order, codeUrl: string) {
  order.paymentQrCode = codeUrl;
}
