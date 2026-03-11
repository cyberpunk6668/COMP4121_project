export interface User {
  id: number;
  phone: string;
  nickname: string;
  role: 'user' | 'engineer' | 'admin';
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
  paymentStatus: '待支付' | '已支付';
  status: '待支付' | '待分配' | '待上门' | '服务中' | '待评价' | '已完成' | '已取消';
  createdAt: string;
}

export const users: User[] = [
  { id: 1, phone: '13800000000', nickname: '演示用户', role: 'user' },
  { id: 2, phone: '13900000000', nickname: '工程师账号', role: 'engineer' },
  { id: 3, phone: '13700000000', nickname: '管理员', role: 'admin' }
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
  },
  {
    id: 2,
    userId: 4,
    realName: '刘工',
    skillDesc: '电脑清灰、系统重装、硬件更换',
    serviceArea: 'Chatswood / North Sydney',
    avgRating: 4.8,
    totalOrders: 620,
    status: 1,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
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
    createdAt: '2026-03-11 09:00:00'
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
    paymentMethod: '支付宝',
    paymentStatus: '已支付',
    status: '待分配',
    createdAt: '2026-03-11 10:30:00'
  },
  {
    id: 3,
    orderNo: 'RP202603110003',
    userId: 1,
    engineerId: 2,
    deviceTypeId: 3,
    repairItemId: 4,
    deviceModel: 'iPad Air',
    problemDesc: '续航下降严重，使用一小时自动关机。',
    address: 'Chatswood Victoria Ave 5 号',
    appointmentTime: '2026-03-10 13:00-15:00',
    totalAmount: 259,
    paymentMethod: '银行卡',
    paymentStatus: '已支付',
    status: '待评价',
    createdAt: '2026-03-09 18:20:00'
  }
];

export function generateOrderNo() {
  return `RP${Date.now()}${Math.floor(Math.random() * 90 + 10)}`;
}

export function getRepairItemById(id: number) {
  return repairItems.find((item) => item.id === id);
}

export function getOrderById(id: number) {
  return orders.find((order) => order.id === id);
}
