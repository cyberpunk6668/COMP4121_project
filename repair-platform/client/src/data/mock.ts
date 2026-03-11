import type { DashboardStat, DeviceType, Engineer, RepairItem, Review } from '../types';

export const heroStats: DashboardStat[] = [
  { label: '平台覆盖城市', value: '18+', helper: '持续扩张中' },
  { label: '认证工程师', value: '320+', helper: '实名认证 + 技能认证' },
  { label: '月度服务订单', value: '9,600+', helper: '支持极速上门' },
  { label: '综合满意度', value: '98.6%', helper: '真实用户评价' }
];

export const serviceSteps = [
  '选择设备与故障类型',
  '填写地址与预约时间',
  '在线支付并创建订单',
  '工程师上门维修',
  '验收并提交评价'
];

export const marketingHighlights = [
  '30 分钟内快速响应',
  '全程价格透明，先报价再维修',
  '原厂级配件可选，支持保修',
  '多角色管理，适合平台化运营'
];

export const testimonials: Review[] = [
  { id: 1, user: '王女士', rating: 5, content: '手机屏幕两小时就修好了，工程师很专业。' },
  { id: 2, user: '李先生', rating: 5, content: '下单流程很清晰，价格透明，体验非常好。' },
  { id: 3, user: '陈同学', rating: 4, content: '平板换电池很快，客服响应也及时。' }
];

export const fallbackDeviceTypes: DeviceType[] = [
  { id: 1, name: '手机', icon: '📱', status: 1 },
  { id: 2, name: '电脑', icon: '💻', status: 1 },
  { id: 3, name: '平板', icon: '🧾', status: 1 },
  { id: 4, name: '相机', icon: '📷', status: 1 }
];

export const fallbackRepairItems: RepairItem[] = [
  {
    id: 1,
    deviceTypeId: 1,
    name: '手机屏幕更换',
    description: '适用于常见碎屏、触摸失灵、显示异常等场景。',
    price: 299,
    duration: 90,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    sales: 1280
  },
  {
    id: 2,
    deviceTypeId: 2,
    name: '笔记本清灰保养',
    description: '深度清理散热模组，改善卡顿与过热问题。',
    price: 199,
    duration: 60,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    sales: 860
  },
  {
    id: 3,
    deviceTypeId: 3,
    name: '平板电池更换',
    description: '续航下降、自动关机等问题的一站式解决方案。',
    price: 259,
    duration: 75,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    sales: 530
  }
];

export const fallbackEngineers: Engineer[] = [
  {
    id: 1,
    userId: 101,
    realName: '张工',
    skillDesc: '手机主板、屏幕与电池维修专家',
    serviceArea: '悉尼 CBD / Zetland',
    avgRating: 4.9,
    totalOrders: 860,
    status: 1,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 2,
    userId: 102,
    realName: '刘工',
    skillDesc: '电脑清灰、风扇与系统故障维修',
    serviceArea: 'Chatswood / North Sydney',
    avgRating: 4.8,
    totalOrders: 620,
    status: 1,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
  }
];
