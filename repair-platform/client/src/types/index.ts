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

export type OrderStatus =
  | '待支付'
  | '待分配'
  | '待上门'
  | '服务中'
  | '待评价'
  | '已完成'
  | '已取消';

export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  engineerId?: number | null;
  repairItemId: number;
  deviceTypeId: number;
  deviceModel: string;
  problemDesc: string;
  address: string;
  appointmentTime: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: OrderStatus;
  createdAt: string;
}

export interface Review {
  id: number;
  user: string;
  rating: number;
  content: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  helper: string;
}
