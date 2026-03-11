import { useEffect, useMemo, useState } from 'react';
import {
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
  Rate,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Steps,
  Table,
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
  PhoneOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  UserOutlined,
  WifiOutlined
} from '@ant-design/icons';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
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
import type { DeviceType, Engineer, Order, RepairItem } from './types';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

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

function HomePage({ deviceTypes, repairItems, engineers }: { deviceTypes: DeviceType[]; repairItems: RepairItem[]; engineers: Engineer[] }) {
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
            <Space wrap size="middle">
              <Button type="primary" size="large" icon={<ToolOutlined />}>
                <Link to="/booking">立即预约维修</Link>
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
        <Paragraph type="secondary">适合作为用户端、工程师端和管理后台三端联动的业务基础。</Paragraph>
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
            <Steps
              current={4}
              responsive
              items={serviceSteps.map((step) => ({ title: step }))}
            />
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

function BookingPage({ deviceTypes, repairItems, onOrderCreated }: { deviceTypes: DeviceType[]; repairItems: RepairItem[]; onOrderCreated: () => Promise<void> }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const selectedDeviceId = Form.useWatch('deviceTypeId', form);

  const itemOptions = useMemo(
    () => repairItems.filter((item) => !selectedDeviceId || item.deviceTypeId === selectedDeviceId),
    [repairItems, selectedDeviceId]
  );

  const onFinish = async (values: Record<string, string | number>) => {
    setSubmitting(true);
    try {
      await api.post('/orders', values);
      message.success('订单已创建，工程师正在路上（至少在代码层面已经出发）。');
      form.resetFields();
      await onOrderCreated();
    } catch (error) {
      message.error('创建订单失败，请确认后端服务已启动。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card className="glass-card">
          <Title level={2}>预约下单</Title>
          <Paragraph type="secondary">
            采用多步骤表单思路，当前 MVP 合并为单页提交流程，后续可拆分为真正的 Step Wizard 并接入地图、优惠券、支付网关。
          </Paragraph>
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
                <Form.Item name="paymentMethod" label="支付方式" rules={[{ required: true, message: '请选择支付方式' }]}>
                  <Select
                    placeholder="请选择支付方式"
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
                    <Text type="secondary">当前版本为演示支付流程，实际接入时可对接微信支付 / 支付宝接口。</Text>
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
              { children: '工程师抢单或后台指派' },
              { children: '上门服务并完成订单' }
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}

function UserCenterPage({ orders, repairItems }: { orders: Order[]; repairItems: RepairItem[] }) {
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
            <Statistic title="已完成订单" value={orders.filter((order) => order.status === '已完成').length} />
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
                <Tag color={statusColors[order.status]}>{order.status}</Tag>
              </Flex>
              <Progress percent={getOrderProgress(order.status)} strokeColor="#ff7a00" showInfo={false} style={{ margin: '18px 0' }} />
              <Descriptions column={{ xs: 1, sm: 2, lg: 4 }}>
                <Descriptions.Item label="设备型号">{order.deviceModel}</Descriptions.Item>
                <Descriptions.Item label="预约时间">{order.appointmentTime}</Descriptions.Item>
                <Descriptions.Item label="支付方式">{order.paymentMethod}</Descriptions.Item>
                <Descriptions.Item label="金额">{currencyFormatter.format(order.totalAmount)}</Descriptions.Item>
                <Descriptions.Item label="地址" span={4}>
                  {order.address}
                </Descriptions.Item>
                <Descriptions.Item label="问题描述" span={4}>
                  {order.problemDesc}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          );
        })
      )}
    </Space>
  );
}

function EngineerPage({ orders, engineers, repairItems, refreshOrders }: { orders: Order[]; engineers: Engineer[]; repairItems: RepairItem[]; refreshOrders: () => Promise<void> }) {
  const activeEngineer = engineers[0];
  const pendingOrders = orders.filter((order) => ['待分配', '待上门', '服务中'].includes(order.status));

  const updateOrder = async (orderId: number, action: 'accept' | 'start' | 'complete') => {
    try {
      if (action === 'accept') {
        await api.post(`/engineer/orders/${orderId}/accept`, { engineerId: activeEngineer?.id });
      } else {
        await api.put(`/engineer/orders/${orderId}/${action}`);
      }
      message.success('操作成功');
      await refreshOrders();
    } catch {
      message.error('工程师操作失败');
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card className="glass-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Flex gap={16} align="center">
              <Avatar size={72} src={activeEngineer?.avatar} icon={<UserOutlined />} />
              <div>
                <Title level={3} style={{ marginBottom: 4 }}>
                  {activeEngineer?.realName ?? '示例工程师'} 的工作台
                </Title>
                <Text type="secondary">{activeEngineer?.skillDesc}</Text>
              </div>
            </Flex>
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={12}>
              <Col span={12}>
                <Statistic title="待处理" value={pendingOrders.length} />
              </Col>
              <Col span={12}>
                <Statistic title="累计订单" value={activeEngineer?.totalOrders ?? 0} />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {pendingOrders.map((order) => {
        const item = findRepairItem(repairItems, order.repairItemId);
        return (
          <Card className="glass-card" key={order.id}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
              <div>
                <Title level={4} style={{ marginBottom: 4 }}>
                  {item?.name ?? '服务订单'}
                </Title>
                <Text type="secondary">{order.address}</Text>
              </div>
              <Tag color={statusColors[order.status]}>{order.status}</Tag>
            </Flex>
            <Descriptions column={{ xs: 1, md: 2 }} style={{ marginTop: 16 }}>
              <Descriptions.Item label="预约时间">{order.appointmentTime}</Descriptions.Item>
              <Descriptions.Item label="设备型号">{order.deviceModel}</Descriptions.Item>
              <Descriptions.Item label="问题描述" span={2}>
                {order.problemDesc}
              </Descriptions.Item>
            </Descriptions>
            <Space wrap>
              {order.status === '待分配' && (
                <Button type="primary" onClick={() => updateOrder(order.id, 'accept')}>
                  抢单
                </Button>
              )}
              {order.status === '待上门' && <Button onClick={() => updateOrder(order.id, 'start')}>开始服务</Button>}
              {order.status === '服务中' && (
                <Button type="primary" onClick={() => updateOrder(order.id, 'complete')}>
                  完成服务
                </Button>
              )}
            </Space>
          </Card>
        );
      })}
    </Space>
  );
}

function AdminPage({ orders, engineers, repairItems, deviceTypes, refreshOrders }: { orders: Order[]; engineers: Engineer[]; repairItems: RepairItem[]; deviceTypes: DeviceType[]; refreshOrders: () => Promise<void> }) {
  const totalRevenue = orders
    .filter((order) => order.status === '已完成' || order.status === '待评价')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const assignEngineer = async (orderId: number, engineerId: number) => {
    try {
      await api.put(`/admin/orders/${orderId}/assign`, { engineerId });
      message.success('指派成功');
      await refreshOrders();
    } catch {
      message.error('指派失败');
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card"><Statistic title="总订单数" value={orders.length} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card"><Statistic title="平台收入" value={currencyFormatter.format(totalRevenue)} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card"><Statistic title="用户数" value={1360} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card"><Statistic title="工程师数" value={engineers.length} /></Card>
        </Col>
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
            {
              title: '状态',
              render: (_, order: Order) => <Tag color={statusColors[order.status]}>{order.status}</Tag>
            },
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
                  onChange={(value) => assignEngineer(order.id, value)}
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
  const [loading, setLoading] = useState(true);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>(fallbackDeviceTypes);
  const [repairItems, setRepairItems] = useState<RepairItem[]>(fallbackRepairItems);
  const [orders, setOrders] = useState<Order[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>(fallbackEngineers);

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">首页</Link> },
    { key: '/services', icon: <LaptopOutlined />, label: <Link to="/services">服务列表</Link> },
    { key: '/booking', icon: <CalendarOutlined />, label: <Link to="/booking">预约下单</Link> },
    { key: '/user', icon: <UserOutlined />, label: <Link to="/user">个人中心</Link> },
    { key: '/engineer', icon: <ToolOutlined />, label: <Link to="/engineer">工程师端</Link> },
    { key: '/admin', icon: <SafetyCertificateOutlined />, label: <Link to="/admin">管理后台</Link> }
  ];

  const selectedKey = menuItems.find((item) => item.key === location.pathname)?.key ?? '/';

  const loadPlatformData = async () => {
    try {
      setLoading(true);
      const [deviceTypeRes, repairItemRes, orderRes, engineerRes] = await Promise.all([
        api.get('/device-types'),
        api.get('/repair-items'),
        api.get('/orders'),
        api.get('/engineers')
      ]);
      setDeviceTypes(deviceTypeRes.data.data);
      setRepairItems(repairItemRes.data.data);
      setOrders(orderRes.data.data);
      setEngineers(engineerRes.data.data);
    } catch {
      message.warning('已加载本地演示数据；如需联调，请先启动后端服务。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlatformData();
  }, []);

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
            <Menu mode="horizontal" selectedKeys={[selectedKey]} items={menuItems} style={{ flex: 1, minWidth: 320, justifyContent: 'flex-end', borderBottom: 'none', background: 'transparent' }} />
          </Flex>
        </div>
      </Header>
      <Content>
        <div className="page-wrap">
          {loading ? (
            <Card className="glass-card">
              <Flex justify="center" align="center" style={{ minHeight: 300 }}>
                <Spin size="large" />
              </Flex>
            </Card>
          ) : (
            <Routes>
              <Route path="/" element={<HomePage deviceTypes={deviceTypes} repairItems={repairItems} engineers={engineers} />} />
              <Route path="/services" element={<ServicesPage deviceTypes={deviceTypes} repairItems={repairItems} />} />
              <Route path="/booking" element={<BookingPage deviceTypes={deviceTypes} repairItems={repairItems} onOrderCreated={loadPlatformData} />} />
              <Route path="/user" element={<UserCenterPage orders={orders} repairItems={repairItems} />} />
              <Route path="/engineer" element={<EngineerPage orders={orders} engineers={engineers} repairItems={repairItems} refreshOrders={loadPlatformData} />} />
              <Route path="/admin" element={<AdminPage orders={orders} engineers={engineers} repairItems={repairItems} deviceTypes={deviceTypes} refreshOrders={loadPlatformData} />} />
            </Routes>
          )}
        </div>
      </Content>
      <Footer className="footer">
        修达达 MVP · React + TypeScript + Ant Design + Express · {dayjs().format('YYYY-MM-DD')}
      </Footer>
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
