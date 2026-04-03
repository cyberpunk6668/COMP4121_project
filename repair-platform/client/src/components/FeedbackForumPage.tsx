import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  List,
  Result,
  Row,
  Select,
  Space,
  Statistic,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd';
import { CommentOutlined, MessageOutlined, NotificationOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';

import api from '../api/http';
import { useLanguage } from '../i18n';
import type { AuthUser, FeedbackScope, FeedbackThread, Order, RepairItem, UserRole } from '../types';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

type FeedbackForumPageProps = {
  currentUser: AuthUser | null;
  orders: Order[];
  repairItems: RepairItem[];
  feedbackThreads: FeedbackThread[];
  refreshData: () => Promise<void>;
};

type TabKey = 'all' | 'order' | 'platform';

function getRoleLabel(role: UserRole, tx: (zh: string, en: string) => string) {
  switch (role) {
    case 'customer':
      return tx('客户', 'Customer');
    case 'engineer':
      return tx('工程师', 'Engineer');
    case 'admin':
      return tx('管理员', 'Administrator');
    default:
      return role;
  }
}

function getRoleColor(role: UserRole) {
  switch (role) {
    case 'customer':
      return 'blue';
    case 'engineer':
      return 'green';
    case 'admin':
      return 'purple';
    default:
      return 'default';
  }
}

function getScopeLabel(scope: FeedbackScope, tx: (zh: string, en: string) => string) {
  return scope === 'order' ? tx('订单反馈', 'Order feedback') : tx('平台建议', 'Platform feedback');
}

function getOrderServiceName(order: Order, repairItems: RepairItem[]) {
  return order.repairItemName ?? repairItems.find((item) => item.id === order.repairItemId)?.name ?? '';
}

export default function FeedbackForumPage({ currentUser, orders, repairItems, feedbackThreads, refreshData }: FeedbackForumPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, tx } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [draftScope, setDraftScope] = useState<FeedbackScope>('platform');
  const [draftOrderId, setDraftOrderId] = useState<number | undefined>(undefined);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [creatingThread, setCreatingThread] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replyingThreadId, setReplyingThreadId] = useState<number | null>(null);

  const accessibleOrders = useMemo(() => orders.slice().sort((a, b) => b.id - a.id), [orders]);
  const queriedOrderId = Number(searchParams.get('orderId'));
  const selectedOrderFromQuery = useMemo(
    () => accessibleOrders.find((order) => order.id === queriedOrderId),
    [accessibleOrders, queriedOrderId]
  );

  useEffect(() => {
    if (selectedOrderFromQuery) {
      setActiveTab('order');
      setDraftScope('order');
      setDraftOrderId(selectedOrderFromQuery.id);
      return;
    }

    if (!draftOrderId && accessibleOrders[0]) {
      setDraftOrderId(accessibleOrders[0].id);
    }

    if (!accessibleOrders.length) {
      setDraftOrderId(undefined);
    }
  }, [accessibleOrders, draftOrderId, selectedOrderFromQuery]);

  const visibleThreads = useMemo(() => {
    return feedbackThreads.filter((thread) => {
      if (selectedOrderFromQuery && thread.orderId !== selectedOrderFromQuery.id) {
        return false;
      }

      if (activeTab === 'order') {
        return thread.scope === 'order';
      }

      if (activeTab === 'platform') {
        return thread.scope === 'platform';
      }

      return true;
    });
  }, [activeTab, feedbackThreads, selectedOrderFromQuery]);

  const threadStats = useMemo(
    () => ({
      total: feedbackThreads.length,
      order: feedbackThreads.filter((thread) => thread.scope === 'order').length,
      platform: feedbackThreads.filter((thread) => thread.scope === 'platform').length
    }),
    [feedbackThreads]
  );

  if (!currentUser) {
    return (
      <Card className="glass-card">
        <Result
          status="403"
          title={tx('请先登录后进入反馈论坛', 'Please sign in before entering the feedback forum')}
          subTitle={tx('论坛会根据你的身份显示平台建议和订单沟通内容。', 'The forum shows platform suggestions and order discussions based on your role.')}
          extra={
            <Button type="primary" onClick={() => navigate('/auth')}>
              {tx('前往登录', 'Go to sign in')}
            </Button>
          }
        />
      </Card>
    );
  }

  const submitThread = async () => {
    const normalizedTitle = draftTitle.trim();
    const normalizedContent = draftContent.trim();

    if (!normalizedTitle || !normalizedContent) {
      const nextError = tx('请输入反馈标题和内容。', 'Please enter a feedback title and content.');
      message.error(nextError);
      return;
    }

    if (draftScope === 'order' && !draftOrderId) {
      const nextError = tx('请选择需要反馈的订单。', 'Please choose the order you want to discuss.');
      message.error(nextError);
      return;
    }

    setCreatingThread(true);
    try {
      await api.post('/feedback', {
        scope: draftScope,
        orderId: draftScope === 'order' ? draftOrderId : undefined,
        title: normalizedTitle,
        content: normalizedContent
      });
      message.success(tx('反馈主题已发布', 'Feedback thread posted successfully'));
      setDraftTitle('');
      setDraftContent('');
      await refreshData();
      setActiveTab(draftScope);
      if (draftScope === 'order' && draftOrderId) {
        setSearchParams(new URLSearchParams({ orderId: String(draftOrderId) }));
      }
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error((errorMessage && t(errorMessage)) || tx('提交反馈失败', 'Failed to submit the feedback'));
    } finally {
      setCreatingThread(false);
    }
  };

  const submitReply = async (threadId: number) => {
    const normalizedContent = (replyDrafts[threadId] ?? '').trim();
    if (!normalizedContent) {
      const nextError = tx('请输入回复内容。', 'Please enter a reply.');
      message.error(nextError);
      return;
    }

    setReplyingThreadId(threadId);
    try {
      await api.post(`/feedback/${threadId}/replies`, { content: normalizedContent });
      message.success(tx('回复已发送', 'Reply sent successfully'));
      setReplyDrafts((current) => ({ ...current, [threadId]: '' }));
      await refreshData();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error((errorMessage && t(errorMessage)) || tx('回复失败', 'Failed to send the reply'));
    } finally {
      setReplyingThreadId(null);
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card className="glass-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={2} style={{ marginBottom: 6 }}>
              {tx('反馈论坛', 'Feedback forum')}
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {tx('客户可以提交订单问题或平台建议，工程师与客户都能在这里继续沟通。订单反馈只对相关订单参与方可见，平台建议则对已登录用户开放。', 'Customers can submit order issues or platform suggestions here, and both engineers and customers can continue the conversation. Order feedback is only visible to the related participants, while platform suggestions are open to signed-in users.')}
            </Paragraph>
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={[12, 12]}>
              <Col span={8}><Statistic title={tx('全部主题', 'All threads')} value={threadStats.total} /></Col>
              <Col span={8}><Statistic title={tx('订单反馈', 'Order threads')} value={threadStats.order} /></Col>
              <Col span={8}><Statistic title={tx('平台建议', 'Platform posts')} value={threadStats.platform} /></Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {selectedOrderFromQuery ? (
        <Alert
          type="info"
          showIcon
          message={tx(`当前正在查看订单 ${selectedOrderFromQuery.orderNo} 的反馈讨论`, `Showing feedback for order ${selectedOrderFromQuery.orderNo}`)}
          description={
            <Space wrap>
              <Text>{t(getOrderServiceName(selectedOrderFromQuery, repairItems))}</Text>
              <Button type="link" style={{ paddingInline: 0 }} onClick={() => setSearchParams(new URLSearchParams())}>
                {tx('查看全部反馈', 'View all feedback')}
              </Button>
            </Space>
          }
        />
      ) : null}

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={8}>
          <Card className="glass-card" title={tx('发布新反馈', 'Post new feedback')}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Select<FeedbackScope>
                value={draftScope}
                onChange={setDraftScope}
                options={[
                  { value: 'platform', label: tx('平台建议 / 问题', 'Platform suggestion / issue') },
                  { value: 'order', label: tx('订单问题反馈', 'Order issue feedback') }
                ]}
              />

              {draftScope === 'order' ? (
                <>
                  {!accessibleOrders.length ? (
                    <Alert
                      type="warning"
                      showIcon
                      message={tx('你当前没有可关联的订单', 'You do not have an order available to link yet')}
                      description={tx('先创建订单或等待订单进入你的可见范围后，再提交订单反馈。', 'Create an order first or wait until the order becomes visible to you before posting order feedback.')}
                    />
                  ) : (
                    <Select<number>
                      value={draftOrderId}
                      placeholder={tx('选择订单', 'Choose an order')}
                      onChange={setDraftOrderId}
                      options={accessibleOrders.map((order) => ({
                        value: order.id,
                        label: `${order.orderNo} · ${t(getOrderServiceName(order, repairItems))}`
                      }))}
                    />
                  )}
                </>
              ) : null}

              <Input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder={tx('例如：想补充设备故障细节 / 希望新增通知功能', 'Example: Need to add more device details / Hope to add notification support')}
                maxLength={120}
              />

              <TextArea
                rows={6}
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                placeholder={tx('把问题、建议、补充说明写在这里。写得越清楚，后续沟通越顺滑。', 'Describe the problem, suggestion, or extra details here. The clearer it is, the smoother the follow-up discussion will be.')}
                maxLength={1000}
                showCount
              />

              <Button type="primary" icon={<MessageOutlined />} loading={creatingThread} onClick={() => void submitThread()} disabled={draftScope === 'order' && !accessibleOrders.length}>
                {tx('发布反馈主题', 'Post feedback thread')}
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={16}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as TabKey)}
            items={[
              { key: 'all', label: tx(`全部 (${feedbackThreads.length})`, `All (${feedbackThreads.length})`) },
              { key: 'order', label: tx(`订单反馈 (${threadStats.order})`, `Order threads (${threadStats.order})`) },
              { key: 'platform', label: tx(`平台建议 (${threadStats.platform})`, `Platform posts (${threadStats.platform})`) }
            ]}
          />

          {visibleThreads.length === 0 ? (
            <Card className="glass-card">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  selectedOrderFromQuery
                    ? tx('当前订单还没有反馈记录，欢迎发布第一条讨论。', 'There are no feedback threads for this order yet. Feel free to start the first discussion.')
                    : tx('论坛暂时还没有内容，快发布第一条反馈吧。', 'The forum is still empty. Go ahead and post the first feedback thread.')
                }
              />
            </Card>
          ) : (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {visibleThreads.map((thread) => (
                <Card className="glass-card" key={thread.id}>
                  <Space direction="vertical" size={14} style={{ width: '100%' }}>
                    <Flex justify="space-between" align="start" gap={12} wrap="wrap">
                      <div>
                        <Title level={4} style={{ marginBottom: 6 }}>{thread.title}</Title>
                        <Space wrap>
                          <Tag color={thread.scope === 'order' ? 'geekblue' : 'gold'}>{getScopeLabel(thread.scope, tx)}</Tag>
                          {thread.orderNo ? <Tag color="cyan">{tx('订单号', 'Order number')}: {thread.orderNo}</Tag> : null}
                          {thread.repairItemName ? <Tag>{t(thread.repairItemName)}</Tag> : null}
                          <Tag color={getRoleColor(thread.authorRole)}>{getRoleLabel(thread.authorRole, tx)}</Tag>
                        </Space>
                      </div>
                      <Text type="secondary">{dayjs(thread.updatedAt).format('YYYY-MM-DD HH:mm')}</Text>
                    </Flex>

                    <Card bordered={false} style={{ background: '#fffaf0' }}>
                      <Space align="start">
                        <Avatar style={{ background: '#ff7a00' }}>{(thread.authorName ? t(thread.authorName) : tx('用户', 'User')).slice(0, 1)}</Avatar>
                        <div>
                          <Space wrap>
                            <Text strong>{thread.authorName ? t(thread.authorName) : tx('匿名用户', 'Unknown user')}</Text>
                            <Tag color={getRoleColor(thread.authorRole)}>{getRoleLabel(thread.authorRole, tx)}</Tag>
                          </Space>
                          <Paragraph style={{ marginTop: 8, marginBottom: 0, whiteSpace: 'pre-wrap' }}>{thread.content}</Paragraph>
                        </div>
                      </Space>
                    </Card>

                    {thread.scope === 'order' ? (
                      <Alert
                        type="info"
                        showIcon
                        message={tx('订单关联信息', 'Order context')}
                        description={
                          <Space wrap>
                            {thread.customerNickname ? <Tag color="blue">{tx('客户', 'Customer')}: {t(thread.customerNickname)}</Tag> : null}
                            {thread.engineerName ? <Tag color="green">{tx('工程师', 'Engineer')}: {t(thread.engineerName)}</Tag> : <Tag>{tx('暂未指派工程师', 'No engineer assigned yet')}</Tag>}
                            {thread.orderId ? (
                              <Button type="link" style={{ paddingInline: 0 }} onClick={() => navigate(`/forum?orderId=${thread.orderId}`)}>
                                {tx('仅查看该订单讨论', 'View only this order discussion')}
                              </Button>
                            ) : null}
                          </Space>
                        }
                      />
                    ) : (
                      <Alert
                        type="success"
                        showIcon
                        message={tx('平台建议主题', 'Platform discussion thread')}
                        description={tx('所有已登录用户都可以在这里查看和回复平台层面的建议、问题或优化想法。', 'All signed-in users can view and reply to platform-level suggestions, issues, and improvement ideas here.')}
                      />
                    )}

                    <div>
                      <Flex align="center" gap={8} style={{ marginBottom: 10 }}>
                        <CommentOutlined style={{ color: '#ff7a00' }} />
                        <Text strong>{tx(`回复 (${thread.replies.length})`, `Replies (${thread.replies.length})`)}</Text>
                      </Flex>
                      {thread.replies.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tx('还没有回复，欢迎留下你的补充说明。', 'No replies yet. Feel free to add the next update.')} />
                      ) : (
                        <List
                          dataSource={thread.replies}
                          renderItem={(reply) => (
                            <List.Item>
                              <Space align="start" style={{ width: '100%' }}>
                                <Avatar>{(reply.authorName ? t(reply.authorName) : tx('用户', 'User')).slice(0, 1)}</Avatar>
                                <div style={{ width: '100%' }}>
                                  <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                                    <Space wrap>
                                      <Text strong>{reply.authorName ? t(reply.authorName) : tx('匿名用户', 'Unknown user')}</Text>
                                      <Tag color={getRoleColor(reply.authorRole)}>{getRoleLabel(reply.authorRole, tx)}</Tag>
                                    </Space>
                                    <Text type="secondary">{dayjs(reply.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
                                  </Flex>
                                  <Paragraph style={{ marginTop: 6, marginBottom: 0, whiteSpace: 'pre-wrap' }}>{reply.content}</Paragraph>
                                </div>
                              </Space>
                            </List.Item>
                          )}
                        />
                      )}
                    </div>

                    <Card bordered={false} style={{ background: '#f8fafc' }}>
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Flex align="center" gap={8}>
                          <NotificationOutlined style={{ color: '#1677ff' }} />
                          <Text strong>{tx('继续讨论', 'Continue the discussion')}</Text>
                        </Flex>
                        <TextArea
                          rows={3}
                          value={replyDrafts[thread.id] ?? ''}
                          onChange={(event) => setReplyDrafts((current) => ({ ...current, [thread.id]: event.target.value }))}
                          placeholder={tx('输入你的补充说明、处理进展或平台回复。', 'Add your clarification, progress update, or platform reply here.')}
                          maxLength={1000}
                          showCount
                        />
                        <Flex justify="flex-end">
                          <Button type="primary" loading={replyingThreadId === thread.id} onClick={() => void submitReply(thread.id)}>
                            {tx('发送回复', 'Send reply')}
                          </Button>
                        </Flex>
                      </Space>
                    </Card>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Col>
      </Row>
    </Space>
  );
}
