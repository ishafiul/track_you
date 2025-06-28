'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Space,
  message,
  Popconfirm,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Tooltip,
  Descriptions,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  subscriptionService,
  type UserSubscription,
  type InitiateSubscriptionRequest,
  type SubscriptionPlan,
} from '@/api/subscription';

const { Title, Text } = Typography;

const statusColors = {
  active: 'success',
  canceled: 'default',
  past_due: 'warning',
  unpaid: 'error',
  incomplete: 'processing',
  incomplete_expired: 'error',
  trialing: 'blue',
} as const;

export function UserSubscriptionsTab() {
  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [initiateForm] = Form.useForm();

  const queryClient = useQueryClient();

  // Fetch user subscriptions
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['user-subscriptions'],
    queryFn: () => subscriptionService.subscriptions.getAll(),
  });

  // Fetch subscription plans for the dropdown
  const { data: plansResponse } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionService.plans.getAll(),
  });

  const plans = plansResponse?.plans || [];

  // Initiate subscription mutation
  const initiateSubscriptionMutation = useMutation({
    mutationFn: (data: InitiateSubscriptionRequest) =>
      subscriptionService.subscriptions.initiate(data),
    onSuccess: (response) => {
      message.success('Subscription initiated successfully');
      if (response.checkoutUrl) {
        message.info('Checkout URL copied to clipboard');
        navigator.clipboard.writeText(response.checkoutUrl);
      }
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      setIsInitiateModalOpen(false);
      initiateForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.error || 'Failed to initiate subscription');
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: ({ id, cancelAtPeriodEnd }: { id: string; cancelAtPeriodEnd: boolean }) =>
      subscriptionService.subscriptions.cancel(id, cancelAtPeriodEnd),
    onSuccess: () => {
      message.success('Subscription canceled successfully');
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
    },
    onError: (error: any) => {
      message.error(error?.error || 'Failed to cancel subscription');
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.subscriptions.reactivate(id),
    onSuccess: () => {
      message.success('Subscription reactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
    },
    onError: (error: any) => {
      message.error(error?.error || 'Failed to reactivate subscription');
    },
  });

  // Delete subscription mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.subscriptions.delete(id),
    onSuccess: () => {
      message.success('Subscription deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
    },
    onError: (error: any) => {
      message.error(error?.error || 'Failed to delete subscription');
    },
  });

  // Sync with Stripe mutation
  const syncWithStripeMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.subscriptions.syncWithStripe(id),
    onSuccess: () => {
      message.success('Subscription synced with Stripe successfully');
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
    },
    onError: (error: any) => {
      message.error(error?.error || 'Failed to sync with Stripe');
    },
  });

  const handleInitiateSubscription = (values: any) => {
    const subscriptionData: InitiateSubscriptionRequest = {
      userId: values.userId,
      planId: values.planId,
      billingCycle: values.billingCycle,
      userEmail: values.userEmail,
      successUrl: values.successUrl || `${window.location.origin}/subscription/success`,
      cancelUrl: values.cancelUrl || `${window.location.origin}/subscription/cancel`,
    };
    initiateSubscriptionMutation.mutate(subscriptionData);
  };

  const openViewModal = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setIsViewModalOpen(true);
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : planId;
  };

  const getPlanPricing = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    const plan = plans.find(p => p.id === planId);
    if (!plan?.pricing) return null;
    return plan.pricing.find(p => p.billingCycle === billingCycle);
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string, record: UserSubscription) => (
        <Space direction="vertical" size={0}>
          <Text strong>{userId}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.id}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'planId',
      key: 'planId',
      render: (planId: string, record: UserSubscription) => {
        const pricing = getPlanPricing(planId, record.billingCycle);
        return (
          <Space direction="vertical" size={0}>
            <Text>{getPlanName(planId)}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {pricing ? `$${pricing.price}/${record.billingCycle}` : record.billingCycle}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>
          {status.toUpperCase().replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      render: (record: UserSubscription) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            Start: {dayjs(record.currentPeriodStart).format('MMM DD, YYYY')}
          </Text>
          <Text style={{ fontSize: '12px' }}>
            End: {dayjs(record.currentPeriodEnd).format('MMM DD, YYYY')}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Cancel at Period End',
      dataIndex: 'cancelAtPeriodEnd',
      key: 'cancelAtPeriodEnd',
      render: (cancelAtPeriodEnd: boolean) => (
        <Tag color={cancelAtPeriodEnd ? 'orange' : 'green'}>
          {cancelAtPeriodEnd ? 'YES' : 'NO'}
        </Tag>
      ),
    },
    {
      title: 'Stripe Info',
      key: 'stripe',
      render: (record: UserSubscription) => (
        <Space direction="vertical" size={0}>
          {record.stripeSubscriptionId && (
            <Text style={{ fontSize: '12px' }}>
              Sub: {record.stripeSubscriptionId.substring(0, 20)}...
            </Text>
          )}
          {record.stripeCustomerId && (
            <Text style={{ fontSize: '12px' }}>
              Cust: {record.stripeCustomerId.substring(0, 20)}...
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: UserSubscription) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openViewModal(record)}
            />
          </Tooltip>
          
          {record.status === 'active' && (
            <Tooltip title="Cancel Subscription">
              <Popconfirm
                title="Cancel this subscription?"
                description="Choose whether to cancel immediately or at period end."
                onConfirm={() => cancelSubscriptionMutation.mutate({ 
                  id: record.id, 
                  cancelAtPeriodEnd: true 
                })}
                okText="At Period End"
                cancelText="Immediately"
                onCancel={() => cancelSubscriptionMutation.mutate({ 
                  id: record.id, 
                  cancelAtPeriodEnd: false 
                })}
              >
                <Button
                  type="text"
                  icon={<StopOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}

          {record.status === 'canceled' && (
            <Tooltip title="Reactivate Subscription">
              <Popconfirm
                title="Reactivate this subscription?"
                onConfirm={() => reactivateSubscriptionMutation.mutate(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  icon={<PlayCircleOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}

          {record.stripeSubscriptionId && (
            <Tooltip title="Sync with Stripe">
              <Button
                type="text"
                icon={<SyncOutlined />}
                onClick={() => syncWithStripeMutation.mutate(record.id)}
                loading={syncWithStripeMutation.isPending}
              />
            </Tooltip>
          )}

          <Tooltip title="Delete Subscription">
            <Popconfirm
              title="Delete this subscription?"
              description="This action cannot be undone."
              onConfirm={() => deleteSubscriptionMutation.mutate(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={4}>User Subscriptions</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsInitiateModalOpen(true)}
        >
          Initiate Subscription
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={subscriptions}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1200 }}
      />

      {/* Initiate Subscription Modal */}
      <Modal
        title="Initiate New Subscription"
        open={isInitiateModalOpen}
        onCancel={() => {
          setIsInitiateModalOpen(false);
          initiateForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={initiateForm}
          layout="vertical"
          onFinish={handleInitiateSubscription}
        >
          <Form.Item
            name="userId"
            label="User ID"
            rules={[{ required: true, message: 'Please enter user ID' }]}
          >
            <Input placeholder="user-123" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            name="userEmail"
            label="User Email"
            rules={[
              { required: true, message: 'Please enter user email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Form.Item
            name="planId"
            label="Subscription Plan"
            rules={[{ required: true, message: 'Please select a plan' }]}
          >
            <Select placeholder="Select a subscription plan">
              {plans.filter(plan => plan.active).map(plan => (
                <Select.Option key={plan.id} value={plan.id}>
                  {plan.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="billingCycle"
            label="Billing Cycle"
            rules={[{ required: true, message: 'Please select billing cycle' }]}
          >
            <Select placeholder="Select billing cycle">
              <Select.Option value="monthly">Monthly</Select.Option>
              <Select.Option value="yearly">Yearly</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="successUrl"
            label="Success URL"
            initialValue={`${typeof window !== 'undefined' ? window.location.origin : ''}/subscription/success`}
          >
            <Input placeholder="https://yoursite.com/success" />
          </Form.Item>

          <Form.Item
            name="cancelUrl"
            label="Cancel URL"
            initialValue={`${typeof window !== 'undefined' ? window.location.origin : ''}/subscription/cancel`}
          >
            <Input placeholder="https://yoursite.com/cancel" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={initiateSubscriptionMutation.isPending}
              >
                Initiate Subscription
              </Button>
              <Button onClick={() => setIsInitiateModalOpen(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Subscription Details Modal */}
      <Modal
        title="Subscription Details"
        open={isViewModalOpen}
        onCancel={() => {
          setIsViewModalOpen(false);
          setSelectedSubscription(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedSubscription && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Subscription ID">
                {selectedSubscription.id}
              </Descriptions.Item>
              <Descriptions.Item label="User ID">
                {selectedSubscription.userId}
              </Descriptions.Item>
              <Descriptions.Item label="Plan">
                {getPlanName(selectedSubscription.planId)}
              </Descriptions.Item>
              <Descriptions.Item label="Billing Cycle">
                <Tag color="blue">{selectedSubscription.billingCycle.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selectedSubscription.status as keyof typeof statusColors]}>
                  {selectedSubscription.status.toUpperCase().replace('_', ' ')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Current Period Start">
                {dayjs(selectedSubscription.currentPeriodStart).format('MMMM DD, YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Current Period End">
                {dayjs(selectedSubscription.currentPeriodEnd).format('MMMM DD, YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Cancel at Period End">
                <Tag color={selectedSubscription.cancelAtPeriodEnd ? 'orange' : 'green'}>
                  {selectedSubscription.cancelAtPeriodEnd ? 'YES' : 'NO'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {dayjs(selectedSubscription.createdAt).format('MMMM DD, YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {dayjs(selectedSubscription.updatedAt).format('MMMM DD, YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            {(selectedSubscription.stripeSubscriptionId || 
              selectedSubscription.stripeCustomerId || 
              selectedSubscription.stripePaymentLinkId) && (
              <Card title="Stripe Information" style={{ marginTop: 16 }}>
                <Descriptions column={1} size="small">
                  {selectedSubscription.stripeSubscriptionId && (
                    <Descriptions.Item label="Stripe Subscription ID">
                      <Text copyable>{selectedSubscription.stripeSubscriptionId}</Text>
                    </Descriptions.Item>
                  )}
                  {selectedSubscription.stripeCustomerId && (
                    <Descriptions.Item label="Stripe Customer ID">
                      <Text copyable>{selectedSubscription.stripeCustomerId}</Text>
                    </Descriptions.Item>
                  )}
                  {selectedSubscription.stripePaymentLinkId && (
                    <Descriptions.Item label="Stripe Payment Link ID">
                      <Text copyable>{selectedSubscription.stripePaymentLinkId}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
} 