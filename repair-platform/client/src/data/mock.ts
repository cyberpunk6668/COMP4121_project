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
  { id: 4, name: '相机', icon: '📷', status: 1 },
  { id: 5, name: '智能手表', icon: '⌚', status: 1 },
  { id: 6, name: '游戏机', icon: '🎮', status: 1 }
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
    deviceTypeId: 1,
    name: '手机电池更换',
    description: '解决续航变差、自动关机、充电发热等高频问题。',
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
    description: '深度清理散热模组，改善卡顿与过热问题。',
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
    description: '续航下降、自动关机等问题的一站式解决方案。',
    price: 259,
    duration: 75,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    sales: 530
  },
  {
    id: 5,
    deviceTypeId: 1,
    name: '手机进水检测与除潮',
    description: '适用于进水、受潮、扬声器异常、不开机等应急维修场景。',
    price: 239,
    duration: 80,
    image: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    sales: 610
  },
  {
    id: 6,
    deviceTypeId: 1,
    name: '手机后盖 / 中框修复',
    description: '处理后盖碎裂、边框磕碰变形、摄像头外圈损伤等问题。',
    price: 169,
    duration: 50,
    image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    sales: 420
  },
  {
    id: 7,
    deviceTypeId: 2,
    name: '笔记本系统重装与优化',
    description: '系统重装、驱动补齐、常用软件安装与开机加速一站完成。',
    price: 149,
    duration: 70,
    image: 'https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    sales: 690
  },
  {
    id: 8,
    deviceTypeId: 2,
    name: '笔记本键盘 / 触控板维修',
    description: '适用于按键失灵、连击、触控漂移、排线松动等故障。',
    price: 269,
    duration: 95,
    image: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    sales: 360
  },
  {
    id: 9,
    deviceTypeId: 3,
    name: '平板屏幕更换',
    description: '解决平板碎屏、显示异常、触摸失效等常见问题。',
    price: 329,
    duration: 100,
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    sales: 450
  },
  {
    id: 10,
    deviceTypeId: 3,
    name: '平板充电口维修',
    description: '针对充电接触不良、无法充电、尾插松动等故障快速处理。',
    price: 189,
    duration: 55,
    image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=900&q=80',
    rating: 4.6,
    sales: 310
  },
  {
    id: 11,
    deviceTypeId: 4,
    name: '相机镜头 / 快门检测',
    description: '适用于镜头报错、快门卡滞、无法对焦等精密故障检测。',
    price: 359,
    duration: 120,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    sales: 180
  },
  {
    id: 12,
    deviceTypeId: 4,
    name: '相机传感器清洁保养',
    description: '清理灰尘污渍，减少照片黑点，适合日常保养与换季维护。',
    price: 219,
    duration: 45,
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    sales: 260
  },
  {
    id: 13,
    deviceTypeId: 5,
    name: '智能手表屏幕更换',
    description: '适用于表盘碎裂、触控异常、显示偏色等维修需求。',
    price: 279,
    duration: 80,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    sales: 240
  },
  {
    id: 14,
    deviceTypeId: 5,
    name: '智能手表电池更换',
    description: '改善手表待机时间短、充不满电、运动中自动关机等问题。',
    price: 189,
    duration: 50,
    image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=900&q=80',
    rating: 4.6,
    sales: 195
  },
  {
    id: 15,
    deviceTypeId: 6,
    name: '游戏机散热清洁与性能优化',
    description: '清理积灰、改善高温降频、降低风扇噪音并检查运行状态。',
    price: 229,
    duration: 75,
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    sales: 280
  },
  {
    id: 16,
    deviceTypeId: 6,
    name: '游戏机 HDMI / 接口维修',
    description: '针对无信号、接口松动、无法连接电视等问题进行快速检修。',
    price: 299,
    duration: 90,
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    sales: 210
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
