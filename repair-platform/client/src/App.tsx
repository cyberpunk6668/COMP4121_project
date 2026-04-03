import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
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
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import api from './api/http';
import { useLanguage } from './i18n';
import {
  fallbackDeviceTypes,
  fallbackEngineers,
  fallbackRepairItems,
  heroStats,
  marketingHighlights,
  serviceSteps,
  testimonials
} from './data/mock';
import InteractiveMapPreview from './components/InteractiveMapPreview';
import AnimatedCharactersLoginPage from './components/ui/animated-characters-login-page';
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

const manualWechatPayQrImage = '/images/payments/wechat-pay-qr.png';

function findRepairItem(items: RepairItem[], id: number) {
  return items.find((item) => item.id === id);
}

function findDeviceName(deviceTypes: DeviceType[], id: number) {
  return deviceTypes.find((item) => item.id === id)?.name ?? '未知设备';
}

function getOrderServiceName(order: Order, repairItems: RepairItem[]) {
  return order.repairItemName ?? findRepairItem(repairItems, order.repairItemId)?.name ?? '未知服务';
}

function getOrderDeviceTypeName(order: Order, deviceTypes: DeviceType[]) {
  return order.deviceTypeName ?? findDeviceName(deviceTypes, order.deviceTypeId);
}

function normalizeCardNumber(value: string) {
  return value.replace(/[\s-]/g, '');
}

function buildNumberRange(start: number, end: number) {
  return Array.from({ length: Math.max(end - start, 0) }, (_, index) => start + index);
}

function disablePastAppointmentDates(current: Dayjs) {
  return current.endOf('day').isBefore(dayjs());
}

function getDisabledAppointmentTime(selectedDate?: Dayjs | null) {
  const now = dayjs();
  if (!selectedDate || !selectedDate.isSame(now, 'day')) {
    return {};
  }

  const currentHour = now.hour();
  const roundedMinute = now.minute() <= 30 ? 30 : 60;

  return {
    disabledHours: () => buildNumberRange(0, roundedMinute >= 60 ? currentHour + 1 : currentHour),
    disabledMinutes: (selectedHour: number) => {
      if (selectedHour !== currentHour || roundedMinute >= 60) {
        return [];
      }
      return buildNumberRange(0, roundedMinute);
    }
  };
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
  const navigate = useNavigate();
  const { tx } = useLanguage();

  return (
    <Card className="glass-card">
      <Result
        status="403"
        title={title}
        subTitle={description}
        extra={
          <Button type="primary" onClick={() => navigate('/auth')}>
            {tx('前往登录', 'Go to sign in')}
          </Button>
        }
      />
    </Card>
  );
}

function HomePage({ currentUser, deviceTypes, repairItems, engineers }: { currentUser: AuthUser | null; deviceTypes: DeviceType[]; repairItems: RepairItem[]; engineers: Engineer[] }) {
  const navigate = useNavigate();
  const { t, tx } = useLanguage();
  const topServices = useMemo(() => repairItems.slice(0, 3), [repairItems]);
  const displayNickname = currentUser ? t(currentUser.nickname) : '';

  return (
    <Space direction="vertical" size={28} style={{ width: '100%' }}>
      <Card className="hero-card" bordered={false}>
        <Row gutter={[28, 28]} align="middle">
          <Col xs={24} lg={14}>
            <div className="hero-chip">
              <SafetyCertificateOutlined /> {tx('认证工程师上门，价格透明可追踪', 'Certified engineers onsite with transparent, trackable pricing')}
            </div>
            <Title className="hero-title" style={{ fontSize: 42, marginTop: 0, marginBottom: 16 }}>
              {tx('修达达：把电子设备维修做成一键下单的服务体验', 'Repair+ turns electronics repair into a smooth one-tap booking experience')}
            </Title>
            <Paragraph className="hero-subtitle" style={{ fontSize: 16, opacity: 0.92 }}>
              {tx('支持手机、电脑、平板、相机等多类设备。用户在线预约，平台智能派单，工程师上门维修，管理员统一运营管理。', 'Support for phones, computers, tablets, cameras, and more. Customers book online, the platform dispatches intelligently, engineers repair onsite, and admins keep everything running.')}
            </Paragraph>
            {currentUser ? (
              <Alert
                type="success"
                showIcon
                message={tx(`欢迎回来，${displayNickname}`, `Welcome back, ${displayNickname}`)}
                description={tx(`当前身份：${getRoleLabel(currentUser.role)}。系统会根据你的注册身份自动展示对应工作台。`, `Current role: ${t(getRoleLabel(currentUser.role))}. The platform automatically opens the workspace that matches your account type.`)}
                style={{ marginBottom: 18 }}
              />
            ) : null}
            <Space wrap size="middle">
              <Button
                type="primary"
                size="large"
                icon={<ToolOutlined />}
                onClick={() => navigate(currentUser ? '/booking' : '/auth')}
              >
                {currentUser ? tx('立即预约维修', 'Book a repair now') : tx('登录后预约', 'Sign in to book')}
              </Button>
              <Button size="large" ghost icon={<WifiOutlined />} onClick={() => navigate('/services')}>
                {tx('查看热门服务', 'Browse popular services')}
              </Button>
            </Space>
          </Col>
          <Col xs={24} lg={10}>
            <Card className="glass-card" bordered={false}>
              <Space direction="vertical" size={18} style={{ width: '100%' }}>
                <Title level={4} style={{ margin: 0 }}>
                  {tx('热门服务速览', 'Popular service snapshot')}
                </Title>
                {topServices.map((item) => (
                  <Flex key={item.id} justify="space-between" align="center">
                    <div>
                      <Text strong>{t(item.name)}</Text>
                      <div>
                        <Text type="secondary">{tx(`约 ${item.duration} 分钟 · 评分 ${item.rating}`, `About ${item.duration} mins · Rated ${item.rating}`)}</Text>
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
          {tx('平台数据概览', 'Platform snapshot')}
        </Title>
        <Paragraph type="secondary">{tx('现在支持角色注册、登录、订单归属与支付页入口，终于不是“谁都能看谁的订单”的自由市场了。', 'The platform now supports role-based sign-up, sign-in, order ownership, and payment entry points—so it is no longer the wild west of everyone seeing everyone else’s orders.')}</Paragraph>
        <Row gutter={[16, 16]}>
          {heroStats.map((stat) => (
            <Col xs={24} sm={12} lg={6} key={stat.label}>
              <Card className="glass-card metric-card">
                <Statistic title={t(stat.label)} value={stat.value} />
                <Text type="secondary">{t(stat.helper)}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          <Card className="glass-card">
            <Title level={3}>{tx('服务流程', 'Service journey')}</Title>
            <Steps current={4} responsive items={serviceSteps.map((step) => ({ title: t(step) }))} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card className="glass-card">
            <Title level={3}>{tx('平台优势', 'Platform highlights')}</Title>
            <List
              dataSource={marketingHighlights}
              renderItem={(item) => (
                <List.Item>
                  <Text>{t(item)}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <div className="section-block">
        <Title level={2} className="section-title">
          {tx('热门设备类型', 'Popular device types')}
        </Title>
        <Paragraph type="secondary">{tx('点击设备卡片即可查看该设备对应的维修服务，像逛分类页一样丝滑。', 'Click a device card to jump straight into the matching repair services, just like browsing a polished category page.')}</Paragraph>
        <Row gutter={[16, 16]}>
          {deviceTypes.map((device) => (
            <Col xs={12} sm={8} lg={6} key={device.id}>
              <button
                type="button"
                className="device-card-button"
                onClick={() => navigate(`/services?deviceTypeId=${device.id}`)}
                aria-label={tx(`查看${device.name}的维修服务`, `View repair services for ${t(device.name)}`)}
              >
                <Card className="glass-card" hoverable>
                  <Space direction="vertical" align="center" style={{ width: '100%' }}>
                    <div style={{ fontSize: 42 }}>{device.icon}</div>
                    <Title level={4} style={{ margin: 0 }}>
                      {t(device.name)}
                    </Title>
                    <Text type="secondary">{t('常见故障快速预约')}</Text>
                  </Space>
                </Card>
              </button>
            </Col>
          ))}
        </Row>
      </div>

      <div className="section-block">
        <Title level={2} className="section-title">
          {tx('金牌工程师', 'Top engineers')}
        </Title>
        <Row gutter={[16, 16]}>
          {engineers.map((engineer) => (
            <Col xs={24} md={12} key={engineer.id}>
              <Card className="glass-card">
                <Flex gap={16}>
                  <Avatar src={engineer.avatar} size={72} icon={<UserOutlined />} />
                  <div>
                    <Title level={4} style={{ marginTop: 0, marginBottom: 6 }}>
                      {t(engineer.realName)}
                    </Title>
                    <Paragraph style={{ marginBottom: 8 }}>{t(engineer.skillDesc)}</Paragraph>
                    <Space wrap>
                      <Tag color="blue">{t(engineer.serviceArea)}</Tag>
                      <Tag color="green">{tx(`评分 ${engineer.avgRating}`, `Rating ${engineer.avgRating}`)}</Tag>
                      <Tag color="purple">{tx(`累计 ${engineer.totalOrders} 单`, `${engineer.totalOrders} orders completed`)}</Tag>
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
          {tx('用户评价', 'Customer reviews')}
        </Title>
        <Row gutter={[16, 16]}>
          {testimonials.map((review) => (
            <Col xs={24} md={8} key={review.id}>
              <Card bordered={false}>
                <Space direction="vertical">
                  <Rate disabled defaultValue={review.rating} />
                  <Paragraph>{t(review.content)}</Paragraph>
                  <Text type="secondary">— {t(review.user)}</Text>
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
  const navigate = useNavigate();
  const { t, tx } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawDeviceTypeId = searchParams.get('deviceTypeId');
  const parsedDeviceTypeId = rawDeviceTypeId ? Number(rawDeviceTypeId) : Number.NaN;
  const hasValidDeviceType = deviceTypes.some((device) => device.id === parsedDeviceTypeId);
  const activeType: number | 'all' = hasValidDeviceType ? parsedDeviceTypeId : 'all';

  const selectedDevice = useMemo(
    () => deviceTypes.find((device) => device.id === parsedDeviceTypeId),
    [deviceTypes, parsedDeviceTypeId]
  );

  useEffect(() => {
    if (!rawDeviceTypeId || hasValidDeviceType) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('deviceTypeId');
    setSearchParams(nextSearchParams, { replace: true });
  }, [hasValidDeviceType, rawDeviceTypeId, searchParams, setSearchParams]);

  const handleActiveTypeChange = (value: number | 'all') => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      nextSearchParams.delete('deviceTypeId');
    } else {
      nextSearchParams.set('deviceTypeId', String(value));
    }
    setSearchParams(nextSearchParams);
  };

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
              {tx('服务列表', 'Service catalogue')}
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {tx(`按设备类型浏览常见故障与维修方案，当前共上架 ${repairItems.length} 项高频维修服务，点击“预约”后会自动带入填写页。`, `Browse common issues and repair plans by device type. There are currently ${repairItems.length} popular services available, and clicking “Book” will prefill the booking form for you.`)}
            </Paragraph>
            <Space wrap style={{ marginTop: 12 }}>
              {selectedDevice ? <Tag color="geekblue">{tx('当前设备：', 'Current device: ')}{selectedDevice.icon} {t(selectedDevice.name)}</Tag> : null}
              <Tag color="orange">{tx(`当前显示 ${filteredItems.length} 项服务`, `Showing ${filteredItems.length} services`)}</Tag>
              {selectedDevice ? (
                <Button type="link" style={{ paddingInline: 0 }} onClick={() => handleActiveTypeChange('all')}>
                  {tx('清除设备筛选', 'Clear device filter')}
                </Button>
              ) : null}
            </Space>
          </div>
          <Select
            value={activeType}
            style={{ minWidth: 220 }}
            onChange={handleActiveTypeChange}
            options={[
              { label: tx('全部设备', 'All devices'), value: 'all' },
              ...deviceTypes.map((device) => ({ label: `${device.icon} ${t(device.name)}`, value: device.id }))
            ]}
          />
        </Flex>
      </Card>

      {filteredItems.length === 0 ? (
        <Card className="glass-card">
          <Empty description={selectedDevice ? tx(`${selectedDevice.name} 暂无可展示服务`, `No services are currently listed for ${t(selectedDevice.name)}`) : tx('暂无可展示服务', 'No services available yet')} />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {filteredItems.map((item) => (
            <Col xs={24} md={12} xl={8} key={item.id}>
              <Card className="glass-card" hoverable>
                <img className="service-image" src={item.image} alt={t(item.name)} />
                <Space direction="vertical" size={10} style={{ marginTop: 18, width: '100%' }}>
                  <Flex justify="space-between" align="center">
                    <Tag color="geekblue">{t(findDeviceName(deviceTypes, item.deviceTypeId))}</Tag>
                    <Tag color="orange">{tx(`销量 ${item.sales}`, `${item.sales} sold`)}</Tag>
                  </Flex>
                  <Title level={4} style={{ margin: 0 }}>
                    {t(item.name)}
                  </Title>
                  <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ minHeight: 44, marginBottom: 0 }}>
                    {t(item.description)}
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
                    <Text type="secondary">{tx(`预计耗时 ${item.duration} 分钟`, `Estimated ${item.duration} mins`)}</Text>
                    <Button type="primary" onClick={() => navigate(`/booking?deviceTypeId=${item.deviceTypeId}&repairItemId=${item.id}`)}>
                      {tx('预约', 'Book')}
                    </Button>
                  </Flex>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Space>
  );
}

function AuthPage({ onAuthSuccess }: { onAuthSuccess: (token: string, user: AuthUser) => Promise<void> }) {
  return <AnimatedCharactersLoginPage onAuthSuccess={onAuthSuccess} />;
}

function BookingPage({ currentUser, deviceTypes, repairItems, refreshData }: { currentUser: AuthUser | null; deviceTypes: DeviceType[]; repairItems: RepairItem[]; refreshData: () => Promise<void> }) {
  const navigate = useNavigate();
  const { t, tx } = useLanguage();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const selectedDeviceId = Form.useWatch('deviceTypeId', form) as number | undefined;
  const selectedRepairItemId = Form.useWatch('repairItemId', form) as number | undefined;
  const selectedPaymentMethod = Form.useWatch('paymentMethod', form) as string | undefined;
  const typedAddress = Form.useWatch('address', form) as string | undefined;

  const itemOptions = useMemo(
    () => repairItems.filter((item) => !selectedDeviceId || item.deviceTypeId === selectedDeviceId),
    [repairItems, selectedDeviceId]
  );

  const selectedRepairItem = useMemo(
    () => repairItems.find((item) => item.id === selectedRepairItemId),
    [repairItems, selectedRepairItemId]
  );

  useEffect(() => {
    const deviceTypeId = Number(searchParams.get('deviceTypeId'));
    const repairItemId = Number(searchParams.get('repairItemId'));
    const matchedRepairItem = repairItems.find((item) => item.id === repairItemId);

    if (matchedRepairItem) {
      form.setFieldsValue({
        deviceTypeId: matchedRepairItem.deviceTypeId,
        repairItemId: matchedRepairItem.id
      });
      return;
    }

    if (deviceTypes.some((device) => device.id === deviceTypeId)) {
      form.setFieldsValue({ deviceTypeId });
    }
  }, [deviceTypes, form, repairItems, searchParams]);

  useEffect(() => {
    const currentRepairItemId = form.getFieldValue('repairItemId') as number | undefined;
    if (!currentRepairItemId || !selectedDeviceId) {
      return;
    }

    const repairItemStillMatches = repairItems.some(
      (item) => item.id === currentRepairItemId && item.deviceTypeId === selectedDeviceId
    );

    if (!repairItemStillMatches) {
      form.setFieldValue('repairItemId', undefined);
    }
  }, [form, repairItems, selectedDeviceId]);

  if (!currentUser) {
    return <AccessDeniedCard title={tx('请先登录后下单', 'Please sign in before placing an order')} description={tx('维修预约需要绑定账户，这样订单才知道该归谁，不然平台就像捡到匿名手机一样尴尬。', 'Repair bookings must be tied to an account so the order has a real owner—otherwise the platform ends up holding an anonymous broken phone like a confused lost-and-found desk.')} />;
  }

  if (currentUser.role !== 'customer' && currentUser.role !== 'admin') {
    return <AccessDeniedCard title={tx('当前身份不能下单', 'This role cannot place orders')} description={tx('工程师账号默认进入接单工作台；如需体验客户端，请注册客户身份。', 'Engineer accounts go straight to the job workspace. If you want to try the customer flow, please register as a customer.')} />;
  }

  const onFinish = async (values: {
    deviceTypeId: number;
    repairItemId: number;
    deviceModel: string;
    problemDesc: string;
    address: string;
    appointmentTime: Dayjs;
    paymentMethod: string;
    creditCardNumber?: string;
    creditCardSecret?: string;
  }) => {
    setSubmitting(true);
    try {
      const createOrderResponse = await api.post('/orders', {
        ...values,
        creditCardNumber: values.creditCardNumber ? normalizeCardNumber(values.creditCardNumber) : undefined,
        appointmentTime: values.appointmentTime.format('YYYY-MM-DD HH:mm')
      });
      const createdOrder = createOrderResponse.data.data as Order;
      await refreshData();

      if (values.paymentMethod === '微信支付') {
        message.success(tx('订单已创建，请进入支付页完成微信支付。', 'Order created. Please continue to the payment page to finish WeChat Pay.'));
        navigate(`/payment/${createdOrder.id}`);
      } else if (values.paymentMethod === '信用卡') {
        message.success(tx('信用卡支付成功，订单已创建并进入待分配状态。', 'Credit card payment succeeded. Your order has been created and is now waiting for assignment.'));
        navigate('/user');
      } else {
        message.success(tx('订单已创建，非微信支付方式按演示逻辑自动完成支付。', 'Order created. In this demo, non-WeChat payment methods are completed automatically.'));
        navigate('/user');
      }

      form.resetFields();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error((errorMessage && t(errorMessage)) || tx('创建订单失败，请确认后端服务已启动。', 'Failed to create the order. Please make sure the backend server is running.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card className="glass-card">
          <Title level={2}>{tx('预约下单', 'Book a repair')}</Title>
          <Paragraph type="secondary">{tx('客户账号下单后，如果选择微信支付，将跳转到专门的支付页继续完成付款；如果你是从服务列表点进来的，对应服务也会自动带入。预约时间现在也支持日历与时间选择，不用再手打了。', 'After a customer places an order, choosing WeChat Pay sends them to the dedicated payment page. If you entered from the service catalogue, the selected service is prefilled automatically. Appointment time now supports calendar and time picking too—so no more manual typing gymnastics.')}</Paragraph>
          <Steps
            current={3}
            style={{ marginBottom: 28 }}
            items={[
              { title: tx('设备信息', 'Device info') },
              { title: tx('服务选择', 'Service selection') },
              { title: tx('预约信息', 'Booking details') },
              { title: tx('确认支付', 'Confirm payment') }
            ]}
          />
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="deviceTypeId" label={tx('设备类型', 'Device type')} rules={[{ required: true, message: tx('请选择设备类型', 'Please choose a device type') }]}>
                  <Select
                    placeholder={tx('请选择设备类型', 'Choose a device type')}
                    options={deviceTypes.map((device) => ({ label: `${device.icon} ${t(device.name)}`, value: device.id }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="repairItemId" label={tx('维修项目', 'Repair service')} rules={[{ required: true, message: tx('请选择维修项目', 'Please choose a repair service') }]}>
                  <Select
                    placeholder={tx('请选择维修项目', 'Choose a repair service')}
                    options={itemOptions.map((item) => ({ label: `${t(item.name)} · ${currencyFormatter.format(item.price)}`, value: item.id }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            {selectedRepairItem ? (
              <Card bordered={false} style={{ marginBottom: 20, background: '#fff7e8' }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    <Title level={4} style={{ margin: 0 }}>
                      {t(selectedRepairItem.name)}
                    </Title>
                    <Tag color="orange">{currencyFormatter.format(selectedRepairItem.price)}</Tag>
                  </Flex>
                  <Text type="secondary">{t(selectedRepairItem.description)}</Text>
                  <Space wrap>
                    <Tag color="geekblue">{t(findDeviceName(deviceTypes, selectedRepairItem.deviceTypeId))}</Tag>
                    <Tag color="green">{tx(`预计 ${selectedRepairItem.duration} 分钟`, `Estimated ${selectedRepairItem.duration} mins`)}</Tag>
                    <Tag color="purple">{tx(`评分 ${selectedRepairItem.rating}`, `Rating ${selectedRepairItem.rating}`)}</Tag>
                    <Tag color="cyan">{tx(`销量 ${selectedRepairItem.sales}`, `${selectedRepairItem.sales} sold`)}</Tag>
                  </Space>
                </Space>
              </Card>
            ) : null}
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="deviceModel" label={tx('设备型号', 'Device model')} rules={[{ required: true, message: tx('请输入设备型号', 'Please enter the device model') }]}>
                  <Input placeholder={tx('例如：iPhone 14 Pro / MacBook Air M2', 'Example: iPhone 14 Pro / MacBook Air M2')} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="appointmentTime" label={tx('预约时间', 'Appointment time')} rules={[{ required: true, message: tx('请输入预约时间', 'Please choose an appointment time') }]}>
                  <DatePicker
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD HH:mm"
                    placeholder={tx('请选择上门日期与时间', 'Choose the visit date and time')}
                    showTime={{
                      format: 'HH:mm',
                      minuteStep: 30,
                      hideDisabledOptions: true,
                      disabledTime: getDisabledAppointmentTime
                    }}
                    disabledDate={disablePastAppointmentDates}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="problemDesc" label={tx('问题描述', 'Issue description')} rules={[{ required: true, message: tx('请描述问题', 'Please describe the issue') }]}>
              <TextArea rows={4} placeholder={tx('请描述设备故障情况，例如碎屏、无法开机、电池鼓包等。', 'Describe the device issue, such as a cracked screen, no power, or battery swelling.')} />
            </Form.Item>
            <Form.Item name="address" label={tx('上门地址', 'Service address')} rules={[{ required: true, message: tx('请输入上门地址', 'Please enter the service address') }]}>
              <Input placeholder={tx('例如：Sydney CBD George St 100 号 1802 室', 'Example: Room 1802, 100 George St, Sydney CBD')} />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="paymentMethod" label={tx('支付方式', 'Payment method')} rules={[{ required: true, message: tx('请选择支付方式', 'Please choose a payment method') }]} initialValue="微信支付">
                  <Select
                    options={[
                      { label: t('微信支付'), value: '微信支付' },
                      { label: t('支付宝'), value: '支付宝' },
                      { label: t('信用卡'), value: '信用卡' }
                    ]}
                  />
                </Form.Item>
                {selectedPaymentMethod === '信用卡' ? (
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Form.Item
                      name="creditCardNumber"
                      label={tx('信用卡号', 'Credit card number')}
                      rules={[
                        { required: true, message: tx('请输入信用卡号', 'Please enter the credit card number') },
                        {
                          validator: async (_rule, value?: string) => {
                            if (!value) {
                              return;
                            }

                            const normalized = normalizeCardNumber(value);
                            if (!/^\d{13,19}$/.test(normalized)) {
                              throw new Error(tx('请输入 13 到 19 位信用卡号', 'Please enter a credit card number with 13 to 19 digits'));
                            }
                          }
                        }
                      ]}
                    >
                      <Input prefix={<CreditCardOutlined />} placeholder={tx('例如：4242 4242 4242 4242', 'Example: 4242 4242 4242 4242')} maxLength={23} />
                    </Form.Item>
                    <Form.Item
                      name="creditCardSecret"
                      label={tx('信用卡安全码', 'Card security code')}
                      rules={[
                        { required: true, message: tx('请输入信用卡安全码', 'Please enter the card security code') },
                        { pattern: /^\d{3,4}$/, message: tx('安全码一般为 3 或 4 位数字', 'Security code should usually be 3 or 4 digits') }
                      ]}
                    >
                      <Password placeholder={tx('请输入卡背面 3 或 4 位安全码', 'Enter the 3 or 4 digit security code from the back of the card')} maxLength={4} visibilityToggle={false} />
                    </Form.Item>
                  </Space>
                ) : null}
              </Col>
              <Col xs={24} md={12}>
                <Card bordered={false} style={{ background: '#fff7e8', marginTop: 30 }}>
                  <Space align="start">
                    <CreditCardOutlined style={{ color: '#ff7a00', fontSize: 20, marginTop: 6 }} />
                    <Text type="secondary">
                      {selectedPaymentMethod === '信用卡'
                        ? tx('信用卡支付会在提交时校验卡号与安全码，并按演示流程立即完成付款。', 'Credit card payments are validated on submit and then completed immediately in this demo flow.')
                        : tx('微信支付订单将进入专属支付页，展示你的微信收款码；用户扫码后可点击“我已完成支付”通知平台。', 'WeChat Pay orders move to a dedicated payment page that shows your QR code. After scanning, the user can click “I have completed payment” to notify the platform.')}
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
            <Button htmlType="submit" type="primary" size="large" loading={submitting}>
              {tx('提交订单', 'Submit order')}
            </Button>
          </Form>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card className="glass-card">
          <Title level={4}>{tx('下单说明', 'Booking notes')}</Title>
          <Timeline
            items={[
              { children: tx('填写设备、故障与地址信息', 'Fill in device, issue, and address details') },
              { children: tx('平台确认价格并创建订单', 'The platform confirms pricing and creates the order') },
              { children: tx('根据支付方式完成微信扫码、信用卡支付或其他方式付款', 'Finish payment via WeChat scan, credit card, or another demo payment method') },
              { children: tx('工程师抢单或后台指派', 'An engineer accepts the job or an admin assigns it') },
              { children: tx('上门服务并完成订单', 'The engineer visits onsite and completes the order') }
            ]}
          />
        </Card>
        <InteractiveMapPreview
          title={tx('上门地址地图预览', 'Service address map preview')}
          query={typedAddress}
          helperText={tx('根据你填写的地址生成演示地图，方便确认大致位置即可。', 'A demo map is generated from the address you enter, so you can quickly confirm the general location.')}
          emptyText={tx('在左侧输入上门地址后，这里会显示地图预览。', 'Enter the service address on the left to preview it here on the map.')}
        />
      </Col>
    </Row>
  );
}

function PaymentPage({ currentUser, refreshData }: { currentUser: AuthUser | null; refreshData: () => Promise<void> }) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t, tx } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [readiness, setReadiness] = useState<PaymentReadiness | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('manual');
  const [codeUrl, setCodeUrl] = useState<string>();
  const [customQrImageUnavailable, setCustomQrImageUnavailable] = useState(false);

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
      message.error((errorMessage && t(errorMessage)) || tx('加载支付信息失败', 'Failed to load payment details'));
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
      message.error((errorMessage && t(errorMessage)) || tx('生成支付二维码失败', 'Failed to generate the payment QR code'));
    } finally {
      setPreparing(false);
    }
  };

  const confirmManualPayment = async () => {
    if (!orderId) {
      return;
    }

    setPreparing(true);
    try {
      const response = await api.post(`/payments/wechat/confirm/${orderId}`);
      setOrder(response.data.data as Order);
      message.success(tx('支付已确认，订单已进入待分配状态。', 'Payment confirmed. The order is now waiting for assignment.'));
      await refreshData();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error((errorMessage && t(errorMessage)) || tx('确认支付失败', 'Failed to confirm payment'));
    } finally {
      setPreparing(false);
    }
  };

  useEffect(() => {
    setCustomQrImageUnavailable(false);
  }, [orderId]);

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
          message.success(tx('支付成功，订单已更新。', 'Payment successful. The order has been updated.'));
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
    return <AccessDeniedCard title={tx('请先登录后支付', 'Please sign in before paying')} description={tx('支付页需要识别当前订单的归属用户。', 'The payment page needs to know which user owns the order.')} />;
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
    return <AccessDeniedCard title={tx('订单不存在', 'Order not found')} description={tx('可能订单号无效，或者你没有权限查看这个支付页面。', 'The order number may be invalid, or you may not have permission to view this payment page.')} />;
  }

  if (order.paymentMethod !== '微信支付') {
    return (
      <Card className="glass-card">
        <Result
          status="info"
          title={tx('该订单不需要微信支付', 'This order does not use WeChat Pay')}
          subTitle={tx('当前订单使用的不是微信支付方式。', 'The current order is using another payment method.')}
          extra={<Button type="primary" onClick={() => navigate('/user')}>{tx('返回个人中心', 'Back to my orders')}</Button>}
        />
      </Card>
    );
  }

  const isPaid = order.paymentStatus === '已支付';
  const shouldShowManualWechatQr = paymentMode === 'manual' && !customQrImageUnavailable;

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card className="glass-card">
          {isPaid ? (
            <Result
              status="success"
              title={tx('支付成功', 'Payment successful')}
              subTitle={tx(`订单 ${order.orderNo} 已完成付款，工程师和系统都能看到它了。`, `Order ${order.orderNo} has been paid successfully and is now visible to both engineers and the platform.`)}
              extra={[
                <Button key="user" type="primary" onClick={() => navigate('/user')}>
                  {tx('查看我的订单', 'View my orders')}
                </Button>,
                <Button key="booking" onClick={() => navigate('/booking')}>
                  {tx('再下一单', 'Place another order')}
                </Button>
              ]}
            />
          ) : (
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <div>
                  <Title level={2} style={{ marginBottom: 4 }}>{tx('支付订单', 'Pay for order')}</Title>
                  <Text type="secondary">{tx('专属客户支付界面：可生成二维码、继续支付、查看支付状态。', 'Customer payment page: generate QR codes, continue payment, and monitor status updates.')}</Text>
                </div>
                <Tag color={paymentStatusColors[order.paymentStatus]}>{t(order.paymentStatus)}</Tag>
              </Flex>

              <Descriptions column={{ xs: 1, md: 2 }} bordered>
                <Descriptions.Item label={tx('订单号', 'Order number')}>{order.orderNo}</Descriptions.Item>
                <Descriptions.Item label={tx('金额', 'Amount')}>{currencyFormatter.format(order.totalAmount)}</Descriptions.Item>
                <Descriptions.Item label={tx('设备型号', 'Device model')}>{order.deviceModel}</Descriptions.Item>
                <Descriptions.Item label={tx('预约时间', 'Appointment time')}>{order.appointmentTime}</Descriptions.Item>
                <Descriptions.Item label={tx('支付方式', 'Payment method')}>{t(order.paymentMethod)}</Descriptions.Item>
                <Descriptions.Item label={tx('支付模式', 'Payment mode')}>
                  <Tag color={paymentMode === 'live' ? 'green' : 'gold'}>{t(paymentMode === 'live' ? '微信商户直连支付' : '微信收款码支付')}</Tag>
                </Descriptions.Item>
              </Descriptions>

              {readiness ? (
                <Alert
                  type={paymentMode === 'live' ? 'success' : 'info'}
                  showIcon
                  message={paymentMode === 'live' ? tx('已连接微信支付商户配置', 'WeChat merchant configuration detected') : tx('当前使用微信收款码支付', 'Using static WeChat QR payment')}
                  description={t(readiness.message)}
                />
              ) : null}

              {paymentMode === 'manual' && customQrImageUnavailable ? (
                <Alert
                  type="warning"
                  showIcon
                  message={tx('未检测到本地微信收款码图片', 'Local WeChat QR image not found')}
                  description={tx('请将你的微信收款码图片放到 client/public/images/payments/wechat-pay-qr.png，支付页就会使用这张图片作为微信支付方式展示。', 'Place your WeChat QR image at client/public/images/payments/wechat-pay-qr.png and the payment page will display it as the WeChat payment method.')}
                />
              ) : null}

              <Flex vertical align="center" gap={16}>
                {shouldShowManualWechatQr ? (
                  <img
                    className="payment-qr-image"
                    src={manualWechatPayQrImage}
                    alt={tx('微信支付收款二维码', 'WeChat payment QR code')}
                    onError={() => setCustomQrImageUnavailable(true)}
                  />
                ) : paymentMode === 'live' && codeUrl ? (
                  <QRCode value={codeUrl} size={220} />
                ) : (
                  <Alert type="info" showIcon message={paymentMode === 'live' ? tx('尚未生成支付二维码', 'Payment QR code has not been generated yet') : tx('请先放入微信收款码图片', 'Please add the WeChat QR image first')} />
                )}
                <Space wrap>
                  {paymentMode === 'live' ? (
                    <Button type="primary" icon={<QrcodeOutlined />} loading={preparing} onClick={() => void preparePayment()}>
                      {codeUrl ? tx('重新获取二维码', 'Refresh QR code') : tx('生成支付二维码', 'Generate QR code')}
                    </Button>
                  ) : null}
                  {paymentMode === 'manual' ? (
                    <Button type="primary" loading={preparing} onClick={() => void confirmManualPayment()}>
                      {tx('我已完成支付', 'I have completed payment')}
                    </Button>
                  ) : null}
                  <Button onClick={() => void fetchPaymentData()}>{tx('刷新支付状态', 'Refresh payment status')}</Button>
                </Space>
                <Text type="secondary">
                  {paymentMode === 'live'
                    ? tx('请使用微信扫一扫完成支付，支付成功后页面会自动更新。', 'Please use WeChat Scan to pay. The page will update automatically after payment succeeds.')
                    : shouldShowManualWechatQr
                      ? tx('当前展示的是你放在 public 目录下的微信收款码图片；用户完成扫码支付后，请点击“我已完成支付”通知平台。', 'The image shown here is the WeChat QR code from your public directory. After the user scans and pays, click “I have completed payment” to notify the platform.')
                      : tx('请先将微信收款码图片放到 public 目录，之后用户即可通过该二维码进行微信支付。', 'Please place the WeChat QR image in the public directory first. After that, users can pay with that QR code.')}
                </Text>
              </Flex>
            </Space>
          )}
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card className="glass-card">
          <Title level={4}>{tx('支付流程说明', 'Payment flow')}</Title>
          <Timeline
            items={[
              { children: tx('订单创建后进入待支付状态', 'After creation, the order enters pending payment status') },
              { children: tx('客户进入支付页查看微信收款码', 'The customer opens the payment page and views the WeChat QR code') },
              { children: tx('微信扫码支付并点击“我已完成支付”', 'The customer scans with WeChat and then clicks “I have completed payment”') },
              { children: tx('支付成功后订单进入待分配状态', 'After payment, the order moves to awaiting assignment') }
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}

function UserCenterPage({ currentUser, orders, repairItems, refreshData }: { currentUser: AuthUser | null; orders: Order[]; repairItems: RepairItem[]; refreshData: () => Promise<void> }) {
  const navigate = useNavigate();
  const { t, tx } = useLanguage();

  if (!currentUser) {
    return <AccessDeniedCard title={tx('请先登录后查看订单', 'Please sign in to view your orders')} description={tx('个人中心只展示当前登录客户自己的订单。', 'The personal center only shows orders that belong to the currently signed-in customer.')} />;
  }

  if (currentUser.role !== 'customer' && currentUser.role !== 'admin') {
    return <AccessDeniedCard title={tx('当前身份没有个人订单中心', 'This role does not have a customer order center')} description={tx('工程师账号请前往工程师端查看待接单与我的服务单。', 'Engineer accounts should use the engineer console to view open jobs and assigned service orders.')} />;
  }

  const cancelOrder = async (orderId: number) => {
    try {
      await api.put(`/orders/${orderId}/cancel`);
      message.success(tx('订单已取消', 'Order cancelled'));
      await refreshData();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error((errorMessage && t(errorMessage)) || tx('取消订单失败', 'Failed to cancel the order'));
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card className="glass-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Statistic title={tx('我的订单', 'My orders')} value={orders.length} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title={tx('待处理订单', 'Open orders')} value={orders.filter((order) => order.status !== '已完成' && order.status !== '已取消').length} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title={tx('待支付订单', 'Pending payment orders')} value={orders.filter((order) => order.paymentStatus !== '已支付').length} />
          </Col>
        </Row>
      </Card>

      {orders.length === 0 ? (
        <Card className="glass-card">
          <Empty description={tx('暂无订单，快去预约一台受伤的电子设备吧。', 'No orders yet—go book a repair for a slightly battle-damaged device.')} />
        </Card>
      ) : (
        orders.map((order) => {
          const item = findRepairItem(repairItems, order.repairItemId);
          return (
            <Card className="glass-card" key={order.id}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <div>
                  <Title level={4} style={{ marginBottom: 0 }}>
                    {item ? t(item.name) : tx('维修订单', 'Repair order')}
                  </Title>
                  <Text type="secondary">{tx('订单号：', 'Order number: ')}{order.orderNo}</Text>
                </div>
                <Space wrap>
                  <Tag color={statusColors[order.status]}>{t(order.status)}</Tag>
                  <Tag color={paymentStatusColors[order.paymentStatus]}>{t(order.paymentStatus)}</Tag>
                </Space>
              </Flex>
              <Progress percent={getOrderProgress(order.status)} strokeColor="#ff7a00" showInfo={false} style={{ margin: '18px 0' }} />
              <Descriptions column={{ xs: 1, sm: 2, lg: 4 }}>
                <Descriptions.Item label={tx('设备型号', 'Device model')}>{order.deviceModel}</Descriptions.Item>
                <Descriptions.Item label={tx('预约时间', 'Appointment time')}>{order.appointmentTime}</Descriptions.Item>
                <Descriptions.Item label={tx('支付方式', 'Payment method')}>{t(order.paymentMethod)}</Descriptions.Item>
                <Descriptions.Item label={tx('金额', 'Amount')}>{currencyFormatter.format(order.totalAmount)}</Descriptions.Item>
                <Descriptions.Item label={tx('地址', 'Address')} span={4}>{order.address}</Descriptions.Item>
                <Descriptions.Item label={tx('问题描述', 'Issue description')} span={4}>{order.problemDesc}</Descriptions.Item>
              </Descriptions>
              <Space wrap style={{ marginTop: 16 }}>
                {order.paymentMethod === '微信支付' && order.paymentStatus !== '已支付' ? (
                  <Button type="primary" onClick={() => navigate(`/payment/${order.id}`)}>
                    {tx('继续支付', 'Continue payment')}
                  </Button>
                ) : null}
                {order.status !== '已取消' && order.status !== '已完成' ? (
                  <Button danger onClick={() => void cancelOrder(order.id)}>{tx('取消订单', 'Cancel order')}</Button>
                ) : null}
              </Space>
            </Card>
          );
        })
      )}
    </Space>
  );
}

function EngineerPage({ currentUser, orders, refreshOrders, deviceTypes, repairItems }: { currentUser: AuthUser | null; orders: Order[]; refreshOrders: () => Promise<void>; deviceTypes: DeviceType[]; repairItems: RepairItem[] }) {
  const { t, tx } = useLanguage();

  if (!currentUser) {
    return <AccessDeniedCard title={tx('请先登录工程师账号', 'Please sign in with an engineer account')} description={tx('工程师端需要登录后才能查看待接单和我的服务单。', 'The engineer console requires sign-in before you can view open jobs and assigned service orders.')} />;
  }

  if (currentUser.role !== 'engineer' && currentUser.role !== 'admin') {
    return <AccessDeniedCard title={tx('当前身份无法进入工程师端', 'This role cannot access the engineer console')} description={tx('请使用工程师身份注册或登录。', 'Please sign in or register using an engineer account.')} />;
  }

  const activeEngineer = currentUser.engineerProfile ?? fallbackEngineers[0];
  const activeEngineerName = t(activeEngineer.realName);
  const availableOrders = orders.filter((order) => order.status === '待分配');
  const myOrders = orders.filter((order) => order.engineerId === activeEngineer.id);
  const activeOrders = myOrders.filter((order) => ['待上门', '服务中'].includes(order.status));
  const followUpOrders = myOrders.filter((order) => ['待评价', '已完成', '已取消'].includes(order.status));

  const updateOrder = async (orderId: number, action: 'accept' | 'start' | 'complete') => {
    try {
      if (action === 'accept') {
        await api.post(`/engineer/orders/${orderId}/accept`, { engineerId: activeEngineer.id });
      } else {
        await api.put(`/engineer/orders/${orderId}/${action}`);
      }
      message.success(tx('操作成功', 'Action completed successfully'));
      await refreshOrders();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error((errorMessage && t(errorMessage)) || tx('工程师操作失败', 'Engineer action failed'));
    }
  };

  const renderOrderCard = (order: Order) => {
    const serviceName = getOrderServiceName(order, repairItems);
    const deviceTypeName = getOrderDeviceTypeName(order, deviceTypes);

    return (
      <Card className="glass-card" key={order.id}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <div>
            <Title level={4} style={{ marginBottom: 4 }}>{t(serviceName)}</Title>
            <Text type="secondary">{tx('订单号：', 'Order number: ')}{order.orderNo} · {t(deviceTypeName)} / {order.deviceModel}</Text>
          </div>
          <Space wrap>
            <Tag color={statusColors[order.status]}>{t(order.status)}</Tag>
            <Tag color={paymentStatusColors[order.paymentStatus]}>{t(order.paymentStatus)}</Tag>
            <Tag color="orange">{currencyFormatter.format(order.totalAmount)}</Tag>
          </Space>
        </Flex>

        <Progress percent={getOrderProgress(order.status)} strokeColor="#ff7a00" showInfo={false} style={{ margin: '18px 0' }} />

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label={tx('服务项目', 'Service')}>{t(serviceName)}</Descriptions.Item>
              <Descriptions.Item label={tx('设备类型', 'Device type')}>{t(deviceTypeName)}</Descriptions.Item>
              <Descriptions.Item label={tx('设备型号', 'Device model')}>{order.deviceModel}</Descriptions.Item>
              <Descriptions.Item label={tx('预约时间', 'Appointment time')}>{order.appointmentTime}</Descriptions.Item>
              <Descriptions.Item label={tx('客户昵称', 'Customer name')}>{order.customerNickname ? t(order.customerNickname) : t('平台用户')}</Descriptions.Item>
              <Descriptions.Item label={tx('联系电话', 'Phone number')}>{order.customerPhone ?? t('平台统一协调')}</Descriptions.Item>
              <Descriptions.Item label={tx('订单金额', 'Order amount')}>{currencyFormatter.format(order.totalAmount)}</Descriptions.Item>
              <Descriptions.Item label={tx('支付状态', 'Payment status')}>{t(order.paymentStatus)}</Descriptions.Item>
              <Descriptions.Item label={tx('上门地址', 'Service address')} span={2}>{order.address}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} xl={8}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Card bordered={false} style={{ background: '#fff7e8', height: '100%' }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text strong>{tx('维修需求', 'Repair request')}</Text>
                  <Text>{order.problemDesc}</Text>
                  <Text type="secondary">{tx('建议工程师提前确认故障范围、所需工具及上门路线，避免现场“带错装备”的经典剧情。', 'Engineers should confirm the fault scope, required tools, and visit route in advance to avoid the classic onsite plot twist of bringing the wrong gear.')}</Text>
                </Space>
              </Card>
              <InteractiveMapPreview
                title={tx('订单位置地图', 'Order location map')}
                query={order.address}
                helperText={tx('根据客户填写的上门地址展示演示级地图位置。', 'Shows a demo-level map location based on the customer’s service address.')}
                emptyText={tx('该订单暂未填写上门地址。', 'This order does not have a service address yet.')}
                height={260}
              />
            </Space>
          </Col>
        </Row>

        <Space wrap style={{ marginTop: 18 }}>
          {order.status === '待分配' ? <Button type="primary" onClick={() => void updateOrder(order.id, 'accept')}>{tx('抢单', 'Accept order')}</Button> : null}
          {order.status === '待上门' ? <Button onClick={() => void updateOrder(order.id, 'start')}>{tx('开始服务', 'Start service')}</Button> : null}
          {order.status === '服务中' ? <Button type="primary" onClick={() => void updateOrder(order.id, 'complete')}>{tx('完成服务', 'Complete service')}</Button> : null}
        </Space>
      </Card>
    );
  };

  const renderOrderSection = (list: Order[], emptyDescription: string) =>
    list.length === 0 ? (
      <Card className="glass-card">
        <Empty description={emptyDescription} />
      </Card>
    ) : (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {list.map((order) => renderOrderCard(order))}
      </Space>
    );

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card className="glass-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Flex gap={16} align="center">
              <Avatar size={72} src={activeEngineer.avatar} icon={<UserOutlined />} />
              <div>
                <Title level={3} style={{ marginBottom: 4 }}>{tx(`${activeEngineerName} 的工作台`, `${activeEngineerName}'s workbench`)}</Title>
                <Text type="secondary">{t(activeEngineer.skillDesc)}</Text>
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary">{tx('本页只保留工程师最关心的订单信息：客户需求、地址、时间、支付状态与处理动作。', 'This page keeps only the information engineers care about most: customer needs, address, time, payment status, and action buttons.')}</Text>
                </div>
              </div>
            </Flex>
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={[12, 12]}>
              <Col span={12}><Statistic title={tx('待抢单', 'Open orders')} value={availableOrders.length} /></Col>
              <Col span={12}><Statistic title={tx('进行中', 'In progress')} value={activeOrders.length} /></Col>
              <Col span={12}><Statistic title={tx('待评价', 'Awaiting review')} value={followUpOrders.filter((order) => order.status === '待评价').length} /></Col>
              <Col span={12}><Statistic title={tx('累计订单', 'Total orders')} value={activeEngineer.totalOrders} /></Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <InteractiveMapPreview
        title={tx('工程师服务区域地图', 'Engineer service area map')}
        query={activeEngineer.serviceArea}
        helperText={tx('根据工程师填写的服务区域展示一个演示级地图位置，方便快速判断接单范围。', 'Shows a demo-level map based on the engineer’s service area so coverage can be assessed quickly.')}
        emptyText={tx('工程师尚未填写服务区域，因此暂时无法展示地图。', 'The engineer has not filled in a service area yet, so no map can be shown for now.')}
      />

      <Tabs
        items={[
          {
            key: 'available',
            label: tx(`待抢单 (${availableOrders.length})`, `Open orders (${availableOrders.length})`),
            children: renderOrderSection(availableOrders, tx('当前暂无待抢单订单。', 'There are no open orders right now.'))
          },
          {
            key: 'active',
            label: tx(`我的进行中 (${activeOrders.length})`, `My active orders (${activeOrders.length})`),
            children: renderOrderSection(activeOrders, tx('当前没有进行中的服务订单。', 'There are no active service orders right now.'))
          },
          {
            key: 'follow-up',
            label: tx(`待评价 / 历史 (${followUpOrders.length})`, `Review / History (${followUpOrders.length})`),
            children: renderOrderSection(followUpOrders, tx('当前没有待跟进或历史订单。', 'There are no follow-up or historical orders right now.'))
          }
        ]}
      />
    </Space>
  );
}

function AdminPage({ currentUser, orders, engineers, repairItems, deviceTypes, refreshOrders }: { currentUser: AuthUser | null; orders: Order[]; engineers: Engineer[]; repairItems: RepairItem[]; deviceTypes: DeviceType[]; refreshOrders: () => Promise<void> }) {
  const { t, tx } = useLanguage();
  if (!currentUser || currentUser.role !== 'admin') {
    return <AccessDeniedCard title={tx('需要管理员权限', 'Administrator access required')} description={tx('管理后台只对管理员账号开放。', 'The admin panel is only available to administrator accounts.')} />;
  }

  const totalRevenue = orders.filter((order) => order.status !== '已取消').reduce((sum, order) => sum + order.totalAmount, 0);

  const assignEngineer = async (orderId: number, engineerId: number) => {
    try {
      await api.put(`/admin/orders/${orderId}/assign`, { engineerId });
      message.success(tx('指派成功', 'Engineer assigned successfully'));
      await refreshOrders();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error((errorMessage && t(errorMessage)) || tx('指派失败', 'Failed to assign engineer'));
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}><Card className="glass-card"><Statistic title={tx('总订单数', 'Total orders')} value={orders.length} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card className="glass-card"><Statistic title={tx('平台收入', 'Platform revenue')} value={currencyFormatter.format(totalRevenue)} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card className="glass-card"><Statistic title={tx('客户数', 'Customers')} value={orders.map((order) => order.userId).filter((value, index, array) => array.indexOf(value) === index).length} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card className="glass-card"><Statistic title={tx('工程师数', 'Engineers')} value={engineers.length} /></Card></Col>
      </Row>

      <Card className="glass-card">
        <Title level={3}>{tx('订单管理', 'Order management')}</Title>
        <Table
          rowKey="id"
          dataSource={orders}
          pagination={{ pageSize: 5 }}
          columns={[
            { title: tx('订单号', 'Order number'), dataIndex: 'orderNo' },
            {
              title: tx('设备', 'Device'),
              render: (_, order: Order) => `${t(findDeviceName(deviceTypes, order.deviceTypeId))} / ${t(findRepairItem(repairItems, order.repairItemId)?.name ?? '未知服务')}`
            },
            { title: tx('预约时间', 'Appointment time'), dataIndex: 'appointmentTime' },
            { title: tx('支付状态', 'Payment status'), render: (_, order: Order) => <Tag color={paymentStatusColors[order.paymentStatus]}>{t(order.paymentStatus)}</Tag> },
            { title: tx('订单状态', 'Order status'), render: (_, order: Order) => <Tag color={statusColors[order.status]}>{t(order.status)}</Tag> },
            {
              title: tx('工程师', 'Engineer'),
              render: (_, order: Order) => {
                const engineerName = engineers.find((engineer) => engineer.id === order.engineerId)?.realName;
                return engineerName ? t(engineerName) : t('未分配');
              }
            },
            {
              title: tx('指派', 'Assign'),
              render: (_, order: Order) => (
                <Select
                  placeholder={tx('选择工程师', 'Choose an engineer')}
                  style={{ minWidth: 140 }}
                  onChange={(value) => void assignEngineer(order.id, value)}
                  options={engineers.map((engineer) => ({ label: t(engineer.realName), value: engineer.id }))}
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
  const { language, setLanguage, t, tx } = useLanguage();
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
        message.warning(tx('已加载本地演示数据；如需联调，请先启动后端服务。', 'Loaded local demo data. If you want full integration, please start the backend server first.'));
      } else {
        message.error(tx('加载用户数据失败，请重新登录。', 'Failed to load user data. Please sign in again.'));
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
    message.success(tx('已退出登录', 'Signed out successfully'));
    navigate('/');
  };

  const isEngineerOnly = currentUser?.role === 'engineer';

  const navigationItems = isEngineerOnly
    ? [{ key: '/engineer', icon: <ToolOutlined />, label: <Link to="/engineer">{tx('订单工作台', 'Order workbench')}</Link> }]
    : [
        { key: '/', icon: <DashboardOutlined />, label: <Link to="/">{tx('首页', 'Home')}</Link> },
        { key: '/services', icon: <LaptopOutlined />, label: <Link to="/services">{tx('服务列表', 'Services')}</Link> },
        ...(currentUser && (currentUser.role === 'customer' || currentUser.role === 'admin')
          ? [{ key: '/booking', icon: <CalendarOutlined />, label: <Link to="/booking">{tx('预约下单', 'Book service')}</Link> }]
          : []),
        ...(currentUser && (currentUser.role === 'customer' || currentUser.role === 'admin')
          ? [{ key: '/user', icon: <UserOutlined />, label: <Link to="/user">{tx('个人中心', 'My orders')}</Link> }]
          : []),
        ...(currentUser && (currentUser.role === 'engineer' || currentUser.role === 'admin')
          ? [{ key: '/engineer', icon: <ToolOutlined />, label: <Link to="/engineer">{tx('工程师端', 'Engineer console')}</Link> }]
          : []),
        ...(currentUser?.role === 'admin'
          ? [{ key: '/admin', icon: <SafetyCertificateOutlined />, label: <Link to="/admin">{tx('管理后台', 'Admin panel')}</Link> }]
          : []),
        ...(!currentUser ? [{ key: '/auth', icon: <LoginOutlined />, label: <Link to="/auth">{tx('登录 / 注册', 'Sign in / Register')}</Link> }] : [])
      ];

  const selectedKey = useMemo(() => {
    if (isEngineerOnly) {
      return '/engineer';
    }
    if (location.pathname.startsWith('/payment')) {
      return '/user';
    }
    if (location.pathname.startsWith('/auth')) {
      return '/auth';
    }
    return navigationItems.find((item) => item.key === location.pathname)?.key ?? '/';
  }, [isEngineerOnly, location.pathname, navigationItems]);

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="page-wrap" style={{ paddingTop: 12, paddingBottom: 12 }}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={14}>
            <div className="brand">
              <div className="brand-badge">
                <PhoneOutlined />
              </div>
              {tx('修达达 Repair+ 平台', 'Repair+ / 修达达 Platform')}
            </div>
            <Flex align="center" gap={14} style={{ flex: 1, minWidth: 340 }}>
              <Menu mode="horizontal" selectedKeys={[selectedKey]} items={navigationItems} style={{ flex: 1, borderBottom: 'none', background: 'transparent' }} />
              <Select
                value={language}
                onChange={setLanguage}
                style={{ minWidth: 110 }}
                options={[
                  { label: '中文', value: 'zh' },
                  { label: 'English', value: 'en' }
                ]}
              />
              {currentUser ? (
                <Space>
                  <Tag color="blue">{t(getRoleLabel(currentUser.role))}</Tag>
                  <Text>{t(currentUser.nickname)}</Text>
                  <Button icon={<LogoutOutlined />} onClick={logout}>{tx('退出', 'Sign out')}</Button>
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
              <Route path="/" element={isEngineerOnly ? <Navigate to="/engineer" replace /> : <HomePage currentUser={currentUser} deviceTypes={deviceTypes} repairItems={repairItems} engineers={engineers} />} />
              <Route path="/services" element={isEngineerOnly ? <Navigate to="/engineer" replace /> : <ServicesPage deviceTypes={deviceTypes} repairItems={repairItems} />} />
              <Route path="/auth" element={<AuthPage onAuthSuccess={persistSession} />} />
              <Route path="/booking" element={isEngineerOnly ? <Navigate to="/engineer" replace /> : <BookingPage currentUser={currentUser} deviceTypes={deviceTypes} repairItems={repairItems} refreshData={refreshData} />} />
              <Route path="/payment/:orderId" element={<PaymentPage currentUser={currentUser} refreshData={refreshData} />} />
              <Route path="/user" element={isEngineerOnly ? <Navigate to="/engineer" replace /> : <UserCenterPage currentUser={currentUser} orders={orders} repairItems={repairItems} refreshData={refreshData} />} />
              <Route path="/engineer" element={<EngineerPage currentUser={currentUser} orders={orders} refreshOrders={refreshData} deviceTypes={deviceTypes} repairItems={repairItems} />} />
              <Route path="/admin" element={<AdminPage currentUser={currentUser} orders={orders} engineers={engineers} repairItems={repairItems} deviceTypes={deviceTypes} refreshOrders={refreshData} />} />
            </Routes>
          )}
        </div>
      </Content>
      <Footer className="footer">{tx('修达达 MVP', 'Repair+ MVP')} · React + TypeScript + Ant Design + Express · {dayjs().format('YYYY-MM-DD')}</Footer>
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
