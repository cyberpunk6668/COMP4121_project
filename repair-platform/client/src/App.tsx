import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Layout,
  List,
  Menu,
  Progress,
  QRCode,
  Rate,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Steps,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
  message
} from 'antd';
import {
  CalendarOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  LaptopOutlined,
  LoginOutlined,
  LogoutOutlined,
  PhoneOutlined,
  QrcodeOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  UserAddOutlined,
  UserOutlined,
  WifiOutlined
} from '@ant-design/icons';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api from './api/http';
import {
  fallbackDeviceTypes,
  fallbackEngineers,
  fallbackRepairItems,
  heroStats,
  marketingHighlights,
  serviceSteps,
  testimonials
} from './data/mock';
import type { AuthUser, DeviceType, Engineer, Order, PaymentMode, PaymentReadiness, RepairItem, UserRole } from './types';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TextArea, Password } = Input;

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0
});

const statusColors: Record<Order['status'], string> = {
  待支付: 'gold',
  待分配: 'orange',
  待上门: 'blue',
  服务中: 'processing',
  待评价: 'purple',
  已完成: 'green',
  已取消: 'red'
};

const paymentStatusColors: Record<Order['paymentStatus'], string> = {
  待支付: 'gold',
  已支付: 'green',
  支付失败: 'red'
};

function findRepairItem(items: RepairItem[], id: number) {
  return items.find((item) => item.id === id);
}

function findDeviceName(deviceTypes: DeviceType[], id: number) {
  return deviceTypes.find((item) => item.id === id)?.name ?? '未知设备';
}

function getOrderProgress(status: Order['status']) {
  switch (status) {
    case '待支付':
      return 12;
    case '待分配':
      return 28;
    case '待上门':
      return 52;
    case '服务中':
      return 76;
    case '待评价':
      return 92;
    case '已完成':
      return 100;
    default:
      return 0;
  }
}

function getRoleLabel(role: UserRole) {
  switch (role) {
    case 'customer':
      return '客户';
    case 'engineer':
      return '工程师';
    case 'admin':
      return '管理员';
    default:
      return role;
  }
}

function getDefaultPathByRole(role: UserRole) {
  switch (role) {
    case 'engineer':
      return '/engineer';
    case 'admin':
      return '/admin';
    case 'customer':
    default:
      return '/user';
  }
}

function AccessDeniedCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="glass-card">
      <Result
        status="403"
        title={title}
        subTitle={description}
        extra={<Button type="primary"><Link to="/auth">前往登录</Link></Button>}
      />
    </Card>
  );
}

function HomePage({ currentUser, deviceTypes, repairItems, engineers }: { currentUser: AuthUser | null; deviceTypes: DeviceType[]; repairItems: RepairItem[]; engineers: Engineer[] }) {
  return (
    <Space direction="vertical" size={28} style={{ width: '100%' }}>
      <Card className="hero-card" bordered={false}>
        <Row gutter={[28, 28]} align="middle">
          <Col xs={24} lg={14}>
            <div className="hero-chip">
              <SafetyCertificateOutlined /> 认证工程师上门，价格透明可追踪
            </div>
            <Title className="hero-title" style={{ fontSize: 42, marginTop: 0, marginBottom: 16 }}>
              修达达：把电子设备维修做成一键下单的服务体验
            </Title>
            <Paragraph className="hero-subtitle" style={{ fontSize: 16, opacity: 0.92 }}>
              支持手机、电脑、平板、相机等多类设备。用户在线预约，平台智能派单，工程师上门维修，管理员统一运营管理。
            </Paragraph>
            {currentUser ? (
              <Alert
                type="success"
                showIcon
                message={`欢迎回来，${currentUser.nickname}`}
                description={`当前身份：${getRoleLabel(currentUser.role)}。系统会根据你的注册身份自动展示对应工作台。`}
                style={{ marginBottom: 18 }}
              />
            ) : null}
            <Space wrap size="middle">
              <Button type="primary" size="large" icon={<ToolOutlined />}>
                <Link to={currentUser ? '/booking' : '/auth'}>{currentUser ? '立即预约维修' : '登录后预约'}</Link>
              </Button>
              <Button size="large" ghost icon={<WifiOutlined />}>
                <Link to="/services">查看热门服务</Link>
              </Button>
            </Space>
          </Col>
          <Col xs={24} lg={10}>
            <Card className="glass-card" bordered={false}>
              <Space direction="vertical" size={18} style={{ width: '100%' }}>
                <Title level={4} style={{ margin: 0 }}>
                  热门服务速览
                </Title>
                {repairItems.slice(0, 3).map((item) => (
                  <Flex key={item.id} justify="space-between" align="center">
                    <div>
                      <Text strong>{item.name}</Text>
                      <div>
                        <Text type="secondary">约 {item.duration} 分钟 · 评分 {item.rating}</Text>
                      </div>
                    </div>
                    <Tag color="orange">{currencyFormatter.format(item.price)}</Tag>
                  </Flex>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <div className="section-block">
        <Title level={2} className="section-title">
          平台数据概览
        </Title>
        <Paragraph type="secondary">现在支持角色注册、登录、订单归属与支付页入口，终于不是“谁都能看谁的订单”的自由市场了。</Paragraph>
        <Row gutter={[16, 16]}>
          {heroStats.map((stat) => (
            <Col xs={24} sm={12} lg={6} key={stat.label}>
              <Card className="glass-card metric-card">
                <Statistic title={stat.label} value={stat.value} />
                <Text type="secondary">{stat.helper}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          <Card className="glass-card">
            <Title level={3}>服务流程</Title>
            <Steps current={4} responsive items={serviceSteps.map((step) => ({ title: step }))} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card className="glass-card">
            <Title level={3}>平台优势</Title>
            <List
              dataSource={marketingHighlights}
              renderItem={(item) => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <div className="section-block">
        <Title level={2} className="section-title">
          热门设备类型
        </Title>
        <Row gutter={[16, 16]}>
          {deviceTypes.map((device) => (
            <Col xs={12} sm={8} lg={6} key={device.id}>
              <Card className="glass-card" hoverable>
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <div style={{ fontSize: 42 }}>{device.icon}</div>
                  <Title level={4} style={{ margin: 0 }}>
                    {device.name}
                  </Title>
                  <Text type="secondary">常见故障快速预约</Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div className="section-block">
        <Title level={2} className="section-title">
          金牌工程师
        </Title>
        <Row gutter={[16, 16]}>
          {engineers.map((engineer) => (
            <Col xs={24} md={12} key={engineer.id}>
              <Card className="glass-card">
                <Flex gap={16}>
                  <Avatar src={engineer.avatar} size={72} icon={<UserOutlined />} />
                  <div>
                    <Title level={4} style={{ marginTop: 0, marginBottom: 6 }}>
                      {engineer.realName}
                    </Title>
                    <Paragraph style={{ marginBottom: 8 }}>{engineer.skillDesc}</Paragraph>
                    <Space wrap>
                      <Tag color="blue">{engineer.serviceArea}</Tag>
                      <Tag color="green">评分 {engineer.avgRating}</Tag>
                      <Tag color="purple">累计 {engineer.totalOrders} 单</Tag>
                    </Space>
                  </div>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Card className="glass-card">
        <Title level={2} className="section-title">
          用户评价
        </Title>
        <Row gutter={[16, 16]}>
          {testimonials.map((review) => (
            <Col xs={24} md={8} key={review.id}>
              <Card bordered={false}>
                <Space direction="vertical">
                  <Rate disabled defaultValue={review.rating} />
                  <Paragraph>{review.content}</Paragraph>
                  <Text type="secondary">— {review.user}</Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </Space>
  );
}

function ServicesPage({ deviceTypes, repairItems }: { deviceTypes: DeviceType[]; repairItems: RepairItem[] }) {
  const [activeType, setActiveType] = useState<number | 'all'>('all');

  const filteredItems = useMemo(
    () => (activeType === 'all' ? repairItems : repairItems.filter((item) => item.deviceTypeId === activeType)),
    [activeType, repairItems]
  );

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="glass-card">
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <div>
            <Title level={2} style={{ marginBottom: 4 }}>
              服务列表
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              按设备类型浏览常见故障与维修方案，支持后续接入动态价格、库存与评价数据。
            </Paragraph>
          </div>
          <Select
            value={activeType}
            style={{ minWidth: 220 }}
            onChange={(value) => setActiveType(value)}
            options={[
              { label: '全部设备', value: 'all' },
              ...deviceTypes.map((device) => ({ label: `${device.icon} ${device.name}`, value: device.id }))
            ]}
          />
        </Flex>
      </Card>

      <Row gutter={[20, 20]}>
        {filteredItems.map((item) => (
          <Col xs={24} md={12} xl={8} key={item.id}>
            <Card className="glass-card" hoverable>
              <img className="service-image" src={item.image} alt={item.name} />
              <Space direction="vertical" size={10} style={{ marginTop: 18, width: '100%' }}>
                <Flex justify="space-between" align="center">
                  <Tag color="geekblue">{findDeviceName(deviceTypes, item.deviceTypeId)}</Tag>
                  <Tag color="orange">销量 {item.sales}</Tag>
                </Flex>
                <Title level={4} style={{ margin: 0 }}>
                  {item.name}
                </Title>
                <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ minHeight: 44, marginBottom: 0 }}>
                  {item.description}
                </Paragraph>
                <Flex justify="space-between" align="center">
                  <Space>
                    <Rate disabled allowHalf defaultValue={item.rating} />
                    <Text type="secondary">{item.rating}</Text>
                  </Space>
                  <Text strong style={{ color: '#ff7a00', fontSize: 18 }}>
                    {currencyFormatter.format(item.price)}
                  </Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text type="secondary">预计耗时 {item.duration} 分钟</Text>
                  <Button type="primary">
                    <Link to="/booking">预约</Link>
                  </Button>
                </Flex>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}

function AuthPage({ onAuthSuccess }: { onAuthSuccess: (token: string, user: AuthUser) => Promise<void> }) {
  const navigate = useNavigate();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const registerRole = Form.useWatch('role', registerForm) as UserRole | undefined;

  const handleLogin = async (values: { phone: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', values);
      const { token, user } = response.data.data as { token: string; user: AuthUser };
      await onAuthSuccess(token, user);
      message.success('登录成功');
      navigate(getDefaultPathByRole(user.role));
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error(errorMessage || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', values);
      const { token, user } = response.data.data as { token: string; user: AuthUser };
      await onAuthSuccess(token, user);
      message.success('注册成功，已自动登录');
      navigate(getDefaultPathByRole(user.role));
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error(errorMessage || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={14}>
        <Card className="glass-card">
          <Title level={2}>登录 / 注册</Title>
          <Paragraph type="secondary">
            注册时可以直接选择身份：客户或工程师。系统会根据你的选择自动进入对应端口，终于不用“先注册后改人生”了。
          </Paragraph>
          <Tabs
            items={[
              {
                key: 'login',
                label: '登录',
                children: (
                  <Form form={loginForm} layout="vertical" onFinish={handleLogin}>
                    <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                      <Input placeholder="例如：13800000000" />
                    </Form.Item>
                    <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                      <Password placeholder="请输入密码" />
                    </Form.Item>
                    <Button htmlType="submit" type="primary" icon={<LoginOutlined />} loading={loading}>
                      登录
                    </Button>
                  </Form>
                )
              },
              {
                key: 'register',
                label: '注册',
                children: (
                  <Form form={registerForm} layout="vertical" onFinish={handleRegister}>
                    <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
                      <Input placeholder="请输入昵称" />
                    </Form.Item>
                    <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                      <Input placeholder="请输入手机号" />
                    </Form.Item>
                    <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少 6 位' }]}>
                      <Password placeholder="请输入至少 6 位密码" />
                    </Form.Item>
                    <Form.Item name="role" label="注册身份" rules={[{ required: true, message: '请选择身份' }]} initialValue="customer">
                      <Select
                        options={[
                          { label: '客户：下单维修', value: 'customer' },
                          { label: '工程师：接单维修', value: 'engineer' }
                        ]}
                      />
                    </Form.Item>
                    {registerRole === 'engineer' ? (
                      <>
                        <Form.Item name="realName" label="真实姓名" rules={[{ required: true, message: '请输入真实姓名' }]}>
                          <Input placeholder="例如：张工" />
                        </Form.Item>
                        <Form.Item name="serviceArea" label="服务区域" rules={[{ required: true, message: '请输入服务区域' }]}>
                          <Input placeholder="例如：Sydney CBD / Zetland" />
                        </Form.Item>
                        <Form.Item name="skillDesc" label="技能描述" rules={[{ required: true, message: '请输入技能描述' }]}>
                          <TextArea rows={3} placeholder="例如：擅长手机换屏、主板维修、电池更换" />
                        </Form.Item>
                      </>
                    ) : null}
                    <Button htmlType="submit" type="primary" icon={<UserAddOutlined />} loading={loading}>
                      注册并登录
                    </Button>
                  </Form>
                )
              }
            ]}
          />
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <Card className="glass-card">
          <Title level={4}>演示账号</Title>
          <List
            dataSource={[
              { role: '客户', phone: '13800000000', password: 'demo123' },
              { role: '工程师', phone: '13900000000', password: 'demo123' },
              { role: '管理员', phone: '13700000000', password: 'admin123' }
            ]}
            renderItem={(item) => (
              <List.Item>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="身份">{item.role}</Descriptions.Item>
                  <Descriptions.Item label="手机号">{item.phone}</Descriptions.Item>
                  <Descriptions.Item label="密码">{item.password}</Descriptions.Item>
                </Descriptions>
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
}

function BookingPage({ currentUser, deviceTypes, repairItems, refreshData }: { currentUser: AuthUser | null; deviceTypes: DeviceType[]; repairItems: RepairItem[]; refreshData: () => Promise<void> }) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const selectedDeviceId = Form.useWatch('deviceTypeId', form);

  const itemOptions = useMemo(
    () => repairItems.filter((item) => !selectedDeviceId || item.deviceTypeId === selectedDeviceId),
    [repairItems, selectedDeviceId]
  );

  if (!currentUser) {
    return <AccessDeniedCard title="请先登录后下单" description="维修预约需要绑定账户，这样订单才知道该归谁，不然平台就像捡到匿名手机一样尴尬。" />;
  }

  if (currentUser.role !== 'customer' && currentUser.role !== 'admin') {
    return <AccessDeniedCard title="当前身份不能下单" description="工程师账号默认进入接单工作台；如需体验客户端，请注册客户身份。" />;
  }

  const onFinish = async (values: Record<string, string | number>) => {
    setSubmitting(true);
    try {
      const createOrderResponse = await api.post('/orders', values);
      const createdOrder = createOrderResponse.data.data as Order;
      await refreshData();

      if (values.paymentMethod === '微信支付') {
        message.success('订单已创建，请进入支付页完成微信支付。');
        navigate(`/payment/${createdOrder.id}`);
      } else {
        message.success('订单已创建，非微信支付方式按演示逻辑自动完成支付。');
        navigate('/user');
      }

      form.resetFields();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error(errorMessage || '创建订单失败，请确认后端服务已启动。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card className="glass-card">
          <Title level={2}>预约下单</Title>
          <Paragraph type="secondary">客户账号下单后，如果选择微信支付，将跳转到专门的支付页继续完成付款。</Paragraph>
          <Steps
            current={3}
            style={{ marginBottom: 28 }}
            items={[
              { title: '设备信息' },
              { title: '服务选择' },
              { title: '预约信息' },
              { title: '确认支付' }
            ]}
          />
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="deviceTypeId" label="设备类型" rules={[{ required: true, message: '请选择设备类型' }]}>
                  <Select
                    placeholder="请选择设备类型"
                    options={deviceTypes.map((device) => ({ label: `${device.icon} ${device.name}`, value: device.id }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="repairItemId" label="维修项目" rules={[{ required: true, message: '请选择维修项目' }]}>
                  <Select
                    placeholder="请选择维修项目"
                    options={itemOptions.map((item) => ({ label: `${item.name} · ${currencyFormatter.format(item.price)}`, value: item.id }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="deviceModel" label="设备型号" rules={[{ required: true, message: '请输入设备型号' }]}>
                  <Input placeholder="例如：iPhone 14 Pro / MacBook Air M2" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="appointmentTime" label="预约时间" rules={[{ required: true, message: '请输入预约时间' }]}>
                  <Input prefix={<CalendarOutlined />} placeholder="例如：2026-03-12 14:00-16:00" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="problemDesc" label="问题描述" rules={[{ required: true, message: '请描述问题' }]}>
              <TextArea rows={4} placeholder="请描述设备故障情况，例如碎屏、无法开机、电池鼓包等。" />
            </Form.Item>
            <Form.Item name="address" label="上门地址" rules={[{ required: true, message: '请输入上门地址' }]}>
              <Input placeholder="例如：Sydney CBD George St 100 号 1802 室" />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="paymentMethod" label="支付方式" rules={[{ required: true, message: '请选择支付方式' }]} initialValue="微信支付">
                  <Select
                    options={[
                      { label: '微信支付', value: '微信支付' },
                      { label: '支付宝', value: '支付宝' },
                      { label: '银行卡', value: '银行卡' }
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Card bordered={false} style={{ background: '#fff7e8', marginTop: 30 }}>
                  <Space align="start">
                    <CreditCardOutlined style={{ color: '#ff7a00', fontSize: 20, marginTop: 6 }} />
                    <Text type="secondary">微信支付订单将进入专属支付页，可继续支付、轮询状态，并在 mock 模式下直接模拟扫码成功。</Text>
                  </Space>
                </Card>
              </Col>
            </Row>
            <Button htmlType="submit" type="primary" size="large" loading={submitting}>
              提交订单
            </Button>
          </Form>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card className="glass-card">
          <Title level={4}>下单说明</Title>
          <Timeline
            items={[
              { children: '填写设备、故障与地址信息' },
              { children: '平台确认价格并创建订单' },
              { children: '进入支付页继续完成微信支付' },
              { children: '工程师抢单或后台指派' },
              { children: '上门服务并完成订单' }
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}

function PaymentPage({ currentUser, refreshData }: { currentUser: AuthUser | null; refreshData: () => Promise<void> }) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [readiness, setReadiness] = useState<PaymentReadiness | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('mock');
  const [codeUrl, setCodeUrl] = useState<string>();

  const fetchPaymentData = async () => {
    if (!orderId) {
      return;
    }

    try {
      const [orderResponse, readinessResponse] = await Promise.all([
        api.get(`/orders/${orderId}`),
        api.get('/payments/wechat/readiness')
      ]);
      const nextOrder = orderResponse.data.data as Order;
      const nextReadiness = readinessResponse.data.data as PaymentReadiness;
      setOrder(nextOrder);
      setReadiness(nextReadiness);
      setPaymentMode(nextReadiness.mode);
      setCodeUrl(nextOrder.paymentQrCode);
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error(errorMessage || '加载支付信息失败');
    } finally {
      setLoading(false);
    }
  };

  const preparePayment = async () => {
    if (!orderId) {
      return;
    }

    setPreparing(true);
    try {
      const response = await api.post(`/payments/wechat/native/${orderId}`);
      setOrder(response.data.data.order as Order);
      setCodeUrl(response.data.data.codeUrl as string);
      setPaymentMode(response.data.data.paymentMode as PaymentMode);
      await refreshData();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error(errorMessage || '生成支付二维码失败');
    } finally {
      setPreparing(false);
    }
  };

  const confirmMockPayment = async () => {
    if (!orderId) {
      return;
    }

    setPreparing(true);
    try {
      const response = await api.post(`/payments/wechat/confirm/${orderId}`);
      setOrder(response.data.data as Order);
      message.success('模拟支付成功，订单已进入待分配状态。');
      await refreshData();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error(errorMessage || '模拟支付失败');
    } finally {
      setPreparing(false);
    }
  };

  useEffect(() => {
    void fetchPaymentData();
  }, [orderId]);

  useEffect(() => {
    if (!order || order.paymentMethod !== '微信支付' || order.paymentStatus === '已支付') {
      return undefined;
    }

    const timer = window.setInterval(async () => {
      try {
        const response = await api.get(`/payments/wechat/status/${order.id}`);
        const latestOrder = response.data.data.order as Order;
        setOrder(latestOrder);
        setPaymentMode(response.data.data.paymentMode as PaymentMode);

        if (latestOrder.paymentStatus === '已支付') {
          message.success('支付成功，订单已更新。');
          await refreshData();
        }
      } catch {
        // Keep polling quiet; the UI already shows readiness and action buttons.
      }
    }, 3000);

    return () => {
      window.clearInterval(timer);
    };
  }, [order, refreshData]);

  if (!currentUser) {
    return <AccessDeniedCard title="请先登录后支付" description="支付页需要识别当前订单的归属用户。" />;
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <Flex justify="center" align="center" style={{ minHeight: 280 }}>
          <Spin size="large" />
        </Flex>
      </Card>
    );
  }

  if (!order) {
    return <AccessDeniedCard title="订单不存在" description="可能订单号无效，或者你没有权限查看这个支付页面。" />;
  }

  if (order.paymentMethod !== '微信支付') {
    return (
      <Card className="glass-card">
        <Result
          status="info"
          title="该订单不需要微信支付"
          subTitle="当前订单使用的不是微信支付方式。"
          extra={<Button type="primary" onClick={() => navigate('/user')}>返回个人中心</Button>}
        />
      </Card>
    );
  }

  const isPaid = order.paymentStatus === '已支付';

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card className="glass-card">
          {isPaid ? (
            <Result
              status="success"
              title="支付成功"
              subTitle={`订单 ${order.orderNo} 已完成付款，工程师和系统都能看到它了。`}
              extra={[
                <Button key="user" type="primary" onClick={() => navigate('/user')}>
                  查看我的订单
                </Button>,
                <Button key="booking" onClick={() => navigate('/booking')}>
                  再下一单
                </Button>
              ]}
            />
          ) : (
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <div>
                  <Title level={2} style={{ marginBottom: 4 }}>支付订单</Title>
                  <Text type="secondary">专属客户支付界面：可生成二维码、继续支付、查看支付状态。</Text>
                </div>
                <Tag color={paymentStatusColors[order.paymentStatus]}>{order.paymentStatus}</Tag>
              </Flex>

              <Descriptions column={{ xs: 1, md: 2 }} bordered>
                <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
                <Descriptions.Item label="金额">{currencyFormatter.format(order.totalAmount)}</Descriptions.Item>
                <Descriptions.Item label="设备型号">{order.deviceModel}</Descriptions.Item>
                <Descriptions.Item label="预约时间">{order.appointmentTime}</Descriptions.Item>
                <Descriptions.Item label="支付方式">{order.paymentMethod}</Descriptions.Item>
                <Descriptions.Item label="支付模式">
                  <Tag color={paymentMode === 'live' ? 'green' : 'gold'}>{paymentMode === 'live' ? '真实微信支付' : 'Mock 调试支付'}</Tag>
                </Descriptions.Item>
              </Descriptions>

              {readiness ? (
                <Alert
                  type={paymentMode === 'live' ? 'success' : 'info'}
                  showIcon
                  message={paymentMode === 'live' ? '已连接微信支付商户配置' : '当前处于 Mock 支付模式'}
                  description={readiness.message}
                />
              ) : null}

              <Flex vertical align="center" gap={16}>
                {codeUrl ? <QRCode value={codeUrl} size={220} /> : <Alert type="info" showIcon message="尚未生成支付二维码" />}
                <Space wrap>
                  <Button type="primary" icon={<QrcodeOutlined />} loading={preparing} onClick={() => void preparePayment()}>
                    {codeUrl ? '重新获取二维码' : '生成支付二维码'}
                  </Button>
                  {paymentMode === 'mock' ? (
                    <Button loading={preparing} onClick={() => void confirmMockPayment()}>
                      模拟微信扫码完成支付
                    </Button>
                  ) : null}
                  <Button onClick={() => void fetchPaymentData()}>刷新支付状态</Button>
                </Space>
                <Text type="secondary">
                  {paymentMode === 'live'
                    ? '请使用微信扫一扫完成支付，支付成功后页面会自动更新。'
                    : '当前未配置真实商户信息，因此使用 mock 流程模拟扫码支付。'}
                </Text>
              </Flex>
            </Space>
          )}
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card className="glass-card">
          <Title level={4}>支付流程说明</Title>
          <Timeline
            items={[
              { children: '订单创建后进入待支付状态' },
              { children: '客户进入支付页获取二维码' },
              { children: '微信扫码支付或 mock 模拟支付' },
              { children: '支付成功后订单进入待分配状态' }
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}

function UserCenterPage({ currentUser, orders, repairItems, refreshData }: { currentUser: AuthUser | null; orders: Order[]; repairItems: RepairItem[]; refreshData: () => Promise<void> }) {
  if (!currentUser) {
    return <AccessDeniedCard title="请先登录后查看订单" description="个人中心只展示当前登录客户自己的订单。" />;
  }

  if (currentUser.role !== 'customer' && currentUser.role !== 'admin') {
    return <AccessDeniedCard title="当前身份没有个人订单中心" description="工程师账号请前往工程师端查看待接单与我的服务单。" />;
  }

  const cancelOrder = async (orderId: number) => {
    try {
      await api.put(`/orders/${orderId}/cancel`);
      message.success('订单已取消');
      await refreshData();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error(errorMessage || '取消订单失败');
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card className="glass-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Statistic title="我的订单" value={orders.length} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="待处理订单" value={orders.filter((order) => order.status !== '已完成' && order.status !== '已取消').length} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="待支付订单" value={orders.filter((order) => order.paymentStatus !== '已支付').length} />
          </Col>
        </Row>
      </Card>

      {orders.length === 0 ? (
        <Card className="glass-card">
          <Empty description="暂无订单，快去预约一台受伤的电子设备吧。" />
        </Card>
      ) : (
        orders.map((order) => {
          const item = findRepairItem(repairItems, order.repairItemId);
          return (
            <Card className="glass-card" key={order.id}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <div>
                  <Title level={4} style={{ marginBottom: 0 }}>
                    {item?.name ?? '维修订单'}
                  </Title>
                  <Text type="secondary">订单号：{order.orderNo}</Text>
                </div>
                <Space wrap>
                  <Tag color={statusColors[order.status]}>{order.status}</Tag>
                  <Tag color={paymentStatusColors[order.paymentStatus]}>{order.paymentStatus}</Tag>
                </Space>
              </Flex>
              <Progress percent={getOrderProgress(order.status)} strokeColor="#ff7a00" showInfo={false} style={{ margin: '18px 0' }} />
              <Descriptions column={{ xs: 1, sm: 2, lg: 4 }}>
                <Descriptions.Item label="设备型号">{order.deviceModel}</Descriptions.Item>
                <Descriptions.Item label="预约时间">{order.appointmentTime}</Descriptions.Item>
                <Descriptions.Item label="支付方式">{order.paymentMethod}</Descriptions.Item>
                <Descriptions.Item label="金额">{currencyFormatter.format(order.totalAmount)}</Descriptions.Item>
                <Descriptions.Item label="地址" span={4}>{order.address}</Descriptions.Item>
                <Descriptions.Item label="问题描述" span={4}>{order.problemDesc}</Descriptions.Item>
              </Descriptions>
              <Space wrap style={{ marginTop: 16 }}>
                {order.paymentMethod === '微信支付' && order.paymentStatus !== '已支付' ? (
                  <Button type="primary">
                    <Link to={`/payment/${order.id}`}>继续支付</Link>
                  </Button>
                ) : null}
                {order.status !== '已取消' && order.status !== '已完成' ? (
                  <Button danger onClick={() => void cancelOrder(order.id)}>取消订单</Button>
                ) : null}
              </Space>
            </Card>
          );
        })
      )}
    </Space>
  );
}

function EngineerPage({ currentUser, orders, refreshOrders }: { currentUser: AuthUser | null; orders: Order[]; refreshOrders: () => Promise<void> }) {
  if (!currentUser) {
    return <AccessDeniedCard title="请先登录工程师账号" description="工程师端需要登录后才能查看待接单和我的服务单。" />;
  }

  if (currentUser.role !== 'engineer' && currentUser.role !== 'admin') {
    return <AccessDeniedCard title="当前身份无法进入工程师端" description="请使用工程师身份注册或登录。" />;
  }

  const activeEngineer = currentUser.engineerProfile ?? fallbackEngineers[0];
  const pendingOrders = orders.filter((order) => ['待分配', '待上门', '服务中'].includes(order.status));

  const updateOrder = async (orderId: number, action: 'accept' | 'start' | 'complete') => {
    try {
      if (action === 'accept') {
        await api.post(`/engineer/orders/${orderId}/accept`, { engineerId: activeEngineer.id });
      } else {
        await api.put(`/engineer/orders/${orderId}/${action}`);
      }
      message.success('操作成功');
      await refreshOrders();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error(errorMessage || '工程师操作失败');
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card className="glass-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Flex gap={16} align="center">
              <Avatar size={72} src={activeEngineer.avatar} icon={<UserOutlined />} />
              <div>
                <Title level={3} style={{ marginBottom: 4 }}>{activeEngineer.realName} 的工作台</Title>
                <Text type="secondary">{activeEngineer.skillDesc}</Text>
              </div>
            </Flex>
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={12}>
              <Col span={12}><Statistic title="可处理订单" value={pendingOrders.length} /></Col>
              <Col span={12}><Statistic title="累计订单" value={activeEngineer.totalOrders} /></Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {pendingOrders.length === 0 ? (
        <Card className="glass-card"><Empty description="暂无可处理订单。" /></Card>
      ) : pendingOrders.map((order) => (
        <Card className="glass-card" key={order.id}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>{order.deviceModel}</Title>
              <Text type="secondary">{order.address}</Text>
            </div>
            <Tag color={statusColors[order.status]}>{order.status}</Tag>
          </Flex>
          <Descriptions column={{ xs: 1, md: 2 }} style={{ marginTop: 16 }}>
            <Descriptions.Item label="预约时间">{order.appointmentTime}</Descriptions.Item>
            <Descriptions.Item label="支付状态">{order.paymentStatus}</Descriptions.Item>
            <Descriptions.Item label="问题描述" span={2}>{order.problemDesc}</Descriptions.Item>
          </Descriptions>
          <Space wrap>
            {order.status === '待分配' ? <Button type="primary" onClick={() => void updateOrder(order.id, 'accept')}>抢单</Button> : null}
            {order.status === '待上门' ? <Button onClick={() => void updateOrder(order.id, 'start')}>开始服务</Button> : null}
            {order.status === '服务中' ? <Button type="primary" onClick={() => void updateOrder(order.id, 'complete')}>完成服务</Button> : null}
          </Space>
        </Card>
      ))}
    </Space>
  );
}

function AdminPage({ currentUser, orders, engineers, repairItems, deviceTypes, refreshOrders }: { currentUser: AuthUser | null; orders: Order[]; engineers: Engineer[]; repairItems: RepairItem[]; deviceTypes: DeviceType[]; refreshOrders: () => Promise<void> }) {
  if (!currentUser || currentUser.role !== 'admin') {
    return <AccessDeniedCard title="需要管理员权限" description="管理后台只对管理员账号开放。" />;
  }

  const totalRevenue = orders.filter((order) => order.status !== '已取消').reduce((sum, order) => sum + order.totalAmount, 0);

  const assignEngineer = async (orderId: number, engineerId: number) => {
    try {
      await api.put(`/admin/orders/${orderId}/assign`, { engineerId });
      message.success('指派成功');
      await refreshOrders();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error(errorMessage || '指派失败');
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}><Card className="glass-card"><Statistic title="总订单数" value={orders.length} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card className="glass-card"><Statistic title="平台收入" value={currencyFormatter.format(totalRevenue)} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card className="glass-card"><Statistic title="客户数" value={orders.map((order) => order.userId).filter((value, index, array) => array.indexOf(value) === index).length} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card className="glass-card"><Statistic title="工程师数" value={engineers.length} /></Card></Col>
      </Row>

      <Card className="glass-card">
        <Title level={3}>订单管理</Title>
        <Table
          rowKey="id"
          dataSource={orders}
          pagination={{ pageSize: 5 }}
          columns={[
            { title: '订单号', dataIndex: 'orderNo' },
            {
              title: '设备',
              render: (_, order: Order) => `${findDeviceName(deviceTypes, order.deviceTypeId)} / ${findRepairItem(repairItems, order.repairItemId)?.name ?? '未知服务'}`
            },
            { title: '预约时间', dataIndex: 'appointmentTime' },
            { title: '支付状态', render: (_, order: Order) => <Tag color={paymentStatusColors[order.paymentStatus]}>{order.paymentStatus}</Tag> },
            { title: '订单状态', render: (_, order: Order) => <Tag color={statusColors[order.status]}>{order.status}</Tag> },
            {
              title: '工程师',
              render: (_, order: Order) => engineers.find((engineer) => engineer.id === order.engineerId)?.realName ?? '未分配'
            },
            {
              title: '指派',
              render: (_, order: Order) => (
                <Select
                  placeholder="选择工程师"
                  style={{ minWidth: 140 }}
                  onChange={(value) => void assignEngineer(order.id, value)}
                  options={engineers.map((engineer) => ({ label: engineer.realName, value: engineer.id }))}
                />
              )
            }
          ]}
        />
      </Card>
    </Space>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>(fallbackDeviceTypes);
  const [repairItems, setRepairItems] = useState<RepairItem[]>(fallbackRepairItems);
  const [orders, setOrders] = useState<Order[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>(fallbackEngineers);

  const persistSession = async (token: string, user: AuthUser) => {
    window.localStorage.setItem('repair-token', token);
    window.localStorage.setItem('repair-user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const clearSession = () => {
    window.localStorage.removeItem('repair-token');
    window.localStorage.removeItem('repair-user');
    setCurrentUser(null);
    setOrders([]);
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      const commonRequests = [api.get('/device-types'), api.get('/repair-items'), api.get('/engineers')];
      const [deviceTypeRes, repairItemRes, engineerRes] = await Promise.all(commonRequests);
      setDeviceTypes(deviceTypeRes.data.data);
      setRepairItems(repairItemRes.data.data);
      setEngineers(engineerRes.data.data);

      if (currentUser) {
        const ordersResponse = await api.get('/orders');
        setOrders(ordersResponse.data.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      if (!currentUser) {
        message.warning('已加载本地演示数据；如需联调，请先启动后端服务。');
      } else {
        message.error('加载用户数据失败，请重新登录。');
        clearSession();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = window.localStorage.getItem('repair-token');
      if (!token) {
        setAuthReady(true);
        return;
      }

      try {
        const response = await api.get('/auth/profile');
        const user = response.data.data as AuthUser;
        setCurrentUser(user);
        window.localStorage.setItem('repair-user', JSON.stringify(user));
      } catch {
        clearSession();
      } finally {
        setAuthReady(true);
      }
    };

    void bootstrapAuth();
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    void refreshData();
  }, [authReady, currentUser?.id, currentUser?.role]);

  const logout = () => {
    clearSession();
    message.success('已退出登录');
    navigate('/');
  };

  const navigationItems = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">首页</Link> },
    { key: '/services', icon: <LaptopOutlined />, label: <Link to="/services">服务列表</Link> },
    ...(currentUser && (currentUser.role === 'customer' || currentUser.role === 'admin')
      ? [{ key: '/booking', icon: <CalendarOutlined />, label: <Link to="/booking">预约下单</Link> }]
      : []),
    ...(currentUser && (currentUser.role === 'customer' || currentUser.role === 'admin')
      ? [{ key: '/user', icon: <UserOutlined />, label: <Link to="/user">个人中心</Link> }]
      : []),
    ...(currentUser && (currentUser.role === 'engineer' || currentUser.role === 'admin')
      ? [{ key: '/engineer', icon: <ToolOutlined />, label: <Link to="/engineer">工程师端</Link> }]
      : []),
    ...(currentUser?.role === 'admin'
      ? [{ key: '/admin', icon: <SafetyCertificateOutlined />, label: <Link to="/admin">管理后台</Link> }]
      : []),
    ...(!currentUser ? [{ key: '/auth', icon: <LoginOutlined />, label: <Link to="/auth">登录 / 注册</Link> }] : [])
  ];

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith('/payment')) {
      return '/user';
    }
    if (location.pathname.startsWith('/auth')) {
      return '/auth';
    }
    return navigationItems.find((item) => item.key === location.pathname)?.key ?? '/';
  }, [location.pathname, navigationItems]);

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="page-wrap" style={{ paddingTop: 12, paddingBottom: 12 }}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={14}>
            <div className="brand">
              <div className="brand-badge">
                <PhoneOutlined />
              </div>
              修达达 Repair+ 平台
            </div>
            <Flex align="center" gap={14} style={{ flex: 1, minWidth: 340 }}>
              <Menu mode="horizontal" selectedKeys={[selectedKey]} items={navigationItems} style={{ flex: 1, borderBottom: 'none', background: 'transparent' }} />
              {currentUser ? (
                <Space>
                  <Tag color="blue">{getRoleLabel(currentUser.role)}</Tag>
                  <Text>{currentUser.nickname}</Text>
                  <Button icon={<LogoutOutlined />} onClick={logout}>退出</Button>
                </Space>
              ) : null}
            </Flex>
          </Flex>
        </div>
      </Header>
      <Content>
        <div className="page-wrap">
          {!authReady || loading ? (
            <Card className="glass-card">
              <Flex justify="center" align="center" style={{ minHeight: 300 }}>
                <Spin size="large" />
              </Flex>
            </Card>
          ) : (
            <Routes>
              <Route path="/" element={<HomePage currentUser={currentUser} deviceTypes={deviceTypes} repairItems={repairItems} engineers={engineers} />} />
              <Route path="/services" element={<ServicesPage deviceTypes={deviceTypes} repairItems={repairItems} />} />
              <Route path="/auth" element={<AuthPage onAuthSuccess={persistSession} />} />
              <Route path="/booking" element={<BookingPage currentUser={currentUser} deviceTypes={deviceTypes} repairItems={repairItems} refreshData={refreshData} />} />
              <Route path="/payment/:orderId" element={<PaymentPage currentUser={currentUser} refreshData={refreshData} />} />
              <Route path="/user" element={<UserCenterPage currentUser={currentUser} orders={orders} repairItems={repairItems} refreshData={refreshData} />} />
              <Route path="/engineer" element={<EngineerPage currentUser={currentUser} orders={orders} refreshOrders={refreshData} />} />
              <Route path="/admin" element={<AdminPage currentUser={currentUser} orders={orders} engineers={engineers} repairItems={repairItems} deviceTypes={deviceTypes} refreshOrders={refreshData} />} />
            </Routes>
          )}
        </div>
      </Content>
      <Footer className="footer">修达达 MVP · React + TypeScript + Ant Design + Express · {dayjs().format('YYYY-MM-DD')}</Footer>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
