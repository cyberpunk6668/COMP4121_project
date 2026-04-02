import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';

export type Language = 'zh' | 'en';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text?: string | null) => string;
  tx: (zh: string, en: string) => string;
  antdLocale: typeof zhCN;
};

const STORAGE_KEY = 'repair-language';

const englishDictionary: Record<string, string> = {
  '客户': 'Customer',
  '工程师': 'Engineer',
  '管理员': 'Administrator',
  '首页': 'Home',
  '服务列表': 'Services',
  '预约下单': 'Book Service',
  '个人中心': 'My Orders',
  '工程师端': 'Engineer Console',
  '管理后台': 'Admin Panel',
  '订单工作台': 'Order Workbench',
  '登录': 'Sign In',
  '注册': 'Register',
  '登录 / 注册': 'Sign In / Register',
  '退出': 'Sign Out',
  '平台数据概览': 'Platform Snapshot',
  '服务流程': 'Service Journey',
  '平台优势': 'Platform Highlights',
  '热门设备类型': 'Popular Device Types',
  '金牌工程师': 'Top Engineers',
  '用户评价': 'Customer Reviews',
  '热门服务速览': 'Popular Service Snapshot',
  '常见故障快速预约': 'Quick booking for common issues',
  '未知设备': 'Unknown device',
  '未知服务': 'Unknown service',
  '平台用户': 'Platform user',
  '平台统一协调': 'Coordinated by platform support',
  '待支付': 'Pending payment',
  '已支付': 'Paid',
  '支付失败': 'Payment failed',
  '待分配': 'Awaiting assignment',
  '待上门': 'Waiting for visit',
  '服务中': 'In service',
  '待评价': 'Awaiting review',
  '已完成': 'Completed',
  '已取消': 'Cancelled',
  '微信支付': 'WeChat Pay',
  '支付宝': 'Alipay',
  '信用卡': 'Credit card',
  '订单号': 'Order number',
  '金额': 'Amount',
  '设备型号': 'Device model',
  '预约时间': 'Appointment time',
  '支付方式': 'Payment method',
  '支付模式': 'Payment mode',
  '设备类型': 'Device type',
  '维修项目': 'Repair service',
  '服务项目': 'Service',
  '订单金额': 'Order amount',
  '支付状态': 'Payment status',
  '客户昵称': 'Customer name',
  '联系电话': 'Phone number',
  '上门地址': 'Service address',
  '地址': 'Address',
  '问题描述': 'Issue description',
  '维修需求': 'Repair request',
  '总订单数': 'Total orders',
  '平台收入': 'Platform revenue',
  '客户数': 'Customers',
  '工程师数': 'Engineers',
  '选择工程师': 'Assign engineer',
  '未分配': 'Unassigned',
  '平台覆盖城市': 'Cities covered',
  '持续扩张中': 'Still expanding',
  '认证工程师': 'Certified engineers',
  '实名认证 + 技能认证': 'Identity verified + skill certified',
  '月度服务订单': 'Monthly service orders',
  '支持极速上门': 'Fast onsite support',
  '综合满意度': 'Overall satisfaction',
  '真实用户评价': 'Based on real user reviews',
  '选择设备与故障类型': 'Choose device and issue',
  '填写地址与预约时间': 'Enter address and schedule',
  '在线支付并创建订单': 'Pay online and create order',
  '工程师上门维修': 'Engineer visits onsite',
  '验收并提交评价': 'Confirm service and leave a review',
  '30 分钟内快速响应': 'Respond within 30 minutes',
  '全程价格透明，先报价再维修': 'Transparent pricing before any repair starts',
  '原厂级配件可选，支持保修': 'OEM-grade parts available with warranty',
  '多角色管理，适合平台化运营': 'Multi-role workflow for platform operations',
  '王女士': 'Ms. Wang',
  '李先生': 'Mr. Li',
  '陈同学': 'Chris Chen',
  '手机屏幕两小时就修好了，工程师很专业。': 'My phone screen was fixed in two hours, and the engineer was very professional.',
  '下单流程很清晰，价格透明，体验非常好。': 'The booking flow was clear, pricing was transparent, and the whole experience felt great.',
  '平板换电池很快，客服响应也及时。': 'The tablet battery replacement was fast, and support responded quickly too.',
  '手机': 'Phone',
  '电脑': 'Computer',
  '平板': 'Tablet',
  '相机': 'Camera',
  '智能手表': 'Smartwatch',
  '游戏机': 'Game console',
  '手机屏幕更换': 'Phone screen replacement',
  '手机电池更换': 'Phone battery replacement',
  '笔记本清灰保养': 'Laptop deep cleaning',
  '平板电池更换': 'Tablet battery replacement',
  '手机进水检测与除潮': 'Liquid damage inspection and drying',
  '手机后盖 / 中框修复': 'Back cover / frame repair',
  '笔记本系统重装与优化': 'Laptop OS reinstall and tune-up',
  '笔记本键盘 / 触控板维修': 'Laptop keyboard / trackpad repair',
  '平板屏幕更换': 'Tablet screen replacement',
  '平板充电口维修': 'Tablet charging port repair',
  '相机镜头 / 快门检测': 'Camera lens / shutter diagnostics',
  '相机传感器清洁保养': 'Camera sensor cleaning',
  '智能手表屏幕更换': 'Smartwatch screen replacement',
  '智能手表电池更换': 'Smartwatch battery replacement',
  '游戏机散热清洁与性能优化': 'Console cooling cleanup and optimisation',
  '游戏机 HDMI / 接口维修': 'Console HDMI / port repair',
  '适用于常见碎屏、触摸失灵、显示异常等场景。': 'Ideal for cracked glass, touch failure, and display issues.',
  '解决续航变差、自动关机、充电发热等高频问题。': 'Fixes poor battery life, random shutdowns, and charging heat issues.',
  '深度清理散热模组，改善卡顿与过热问题。': 'Deep cleans the cooling system to reduce lag and overheating.',
  '续航下降、自动关机等问题的一站式解决方案。': 'A one-stop fix for battery drain and sudden shutdowns.',
  '适用于进水、受潮、扬声器异常、不开机等应急维修场景。': 'Designed for liquid damage, moisture exposure, speaker issues, and no-power emergencies.',
  '处理后盖碎裂、边框磕碰变形、摄像头外圈损伤等问题。': 'Repairs cracked back covers, bent frames, and damaged camera rings.',
  '系统重装、驱动补齐、常用软件安装与开机加速一站完成。': 'Reinstalls the OS, restores drivers, installs essentials, and speeds up boot time.',
  '适用于按键失灵、连击、触控漂移、排线松动等故障。': 'For stuck keys, repeated input, touch drift, and loose connector issues.',
  '解决平板碎屏、显示异常、触摸失效等常见问题。': 'Handles cracked screens, display faults, and touch failure on tablets.',
  '针对充电接触不良、无法充电、尾插松动等故障快速处理。': 'Quickly fixes unstable charging, charging failure, and loose ports.',
  '适用于镜头报错、快门卡滞、无法对焦等精密故障检测。': 'Diagnoses lens errors, stuck shutters, and focusing problems.',
  '清理灰尘污渍，减少照片黑点，适合日常保养与换季维护。': 'Removes dust and marks to reduce photo spots, ideal for seasonal maintenance.',
  '适用于表盘碎裂、触控异常、显示偏色等维修需求。': 'Covers cracked watch displays, touch issues, and colour distortion.',
  '改善手表待机时间短、充不满电、运动中自动关机等问题。': 'Improves standby life, charging limits, and shutdowns during workouts.',
  '清理积灰、改善高温降频、降低风扇噪音并检查运行状态。': 'Clears dust, reduces thermal throttling, lowers fan noise, and checks performance.',
  '针对无信号、接口松动、无法连接电视等问题进行快速检修。': 'Repairs no-signal issues, loose ports, and TV connection failures.',
  '张工': 'Engineer Zhang',
  '刘工': 'Engineer Liu',
  '手机主板、屏幕与电池维修专家': 'Specialist in phone logic boards, screens, and batteries',
  '电脑清灰、风扇与系统故障维修': 'Focused on computer cleaning, fan issues, and system repairs',
  '悉尼 CBD / Zetland': 'Sydney CBD / Zetland',
  '请先登录后支付': 'Please sign in before paying',
  '订单不存在': 'Order not found',
  '该订单不需要微信支付': 'This order does not require WeChat Pay',
  '查看我的订单': 'View my orders',
  '再下一单': 'Place another order',
  '刷新支付状态': 'Refresh payment status',
  '继续支付': 'Continue payment',
  '取消订单': 'Cancel order',
  '抢单': 'Accept order',
  '开始服务': 'Start service',
  '完成服务': 'Complete service',
  '待抢单': 'Open orders',
  '进行中': 'In progress',
  '累计订单': 'Total orders',
  '当前设备：': 'Current device: ',
  '微信商户直连支付': 'Direct WeChat merchant payment',
  '微信收款码支付': 'Static WeChat QR payment'
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'zh';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'en' ? 'en' : 'zh';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    dayjs.locale(language === 'en' ? 'en' : 'zh-cn');
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (text?: string | null) => {
      if (!text) {
        return '';
      }
      return language === 'en' ? englishDictionary[text] ?? text : text;
    },
    tx: (zh: string, en: string) => (language === 'en' ? en : zh),
    antdLocale: language === 'en' ? enUS : zhCN
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
