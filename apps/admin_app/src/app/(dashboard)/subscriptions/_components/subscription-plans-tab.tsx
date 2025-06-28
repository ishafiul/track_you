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
  InputNumber,
  Switch,
  Card,
  Tooltip,
  Tabs,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  StopOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import {
  subscriptionService,
  type SubscriptionPlan,
  type PlanPricing,
  type UpdateSubscriptionPlanRequest,
  type UpdatePlanPricingRequest,
} from '@/api/subscription';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface CreatePlanRequest {
  name: string;
  description?: string;
  featuresJson: string;
  apiRateLimit: number;
  maxRequestsPerMonth: number;
  monthlyPrice: number;
  yearlyPrice: number;
}

interface PlanWithPricing extends SubscriptionPlan {
  pricing: PlanPricing[];
}

export function SubscriptionPlansTab() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentLinkModalOpen, setIsPaymentLinkModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanWithPricing | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [paymentLinkForm] = Form.useForm();

  const queryClient = useQueryClient();

  // Fetch subscription plans
  const { data: plansResponse, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionService.plans.getAll(),
  });

  const plans = plansResponse?.plans || [];

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (data: CreatePlanRequest) =>
      subscriptionService.plans.create(data),
    onSuccess: () => {
      message.success('Subscription plan created successfully');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setIsCreateModalOpen(false);
      createForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.error || 'Failed to create subscription plan');
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubscriptionPlanRequest }) =>
      subscriptionService.plans.update(id, data),
    onSuccess: () => {
      message.success('Subscription plan updated successfully');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setIsEditModalOpen(false);
      editForm.resetFields();
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      message.error(error?.error || 'Failed to update subscription plan');
    },
  });

  // Update plan pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanPricingRequest }) =>
      subscriptionService.plans.updatePricing(id, data),
    onSuccess: () => {
      message.success('Subscription plan pricing updated successfully');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setIsEditModalOpen(false);
      editForm.resetFields();
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      message.error(error?.error || 'Failed to update subscription plan pricing');
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.plans.delete(id),
    onSuccess: (response) => {
      if (response.success) {
        message.success(response.message || 'Subscription plan deleted successfully');
      } else {
        message.error(response.message || 'Failed to delete subscription plan');
      }
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error: any) => {
      message.error(error?.message || 'Failed to delete subscription plan');
    },
  });

  // Create payment link mutation
  const createPaymentLinkMutation = useMutation({
    mutationFn: (data: { planId: string; billingCycle: 'monthly' | 'yearly'; successUrl: string; cancelUrl: string }) =>
      subscriptionService.plans.createPaymentLink(data),
    onSuccess: (response) => {
      if (response.paymentLink) {
        navigator.clipboard.writeText(response.paymentLink);
        message.success('Payment link created and copied to clipboard');
      }
      setIsPaymentLinkModalOpen(false);
      paymentLinkForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.error || 'Failed to create payment link');
    },
  });

  const handleCreatePlan = (values: any) => {
    const planData: CreatePlanRequest = {
      name: values.name,
      description: values.description || '',
      monthlyPrice: values.monthlyPrice,
      yearlyPrice: values.yearlyPrice,
      apiRateLimit: values.apiRateLimit,
      maxRequestsPerMonth: values.maxRequestsPerMonth,
      featuresJson: JSON.stringify(values.features ? values.features.split('\n').filter(Boolean) : []),
    };
    createPlanMutation.mutate(planData);
  };

  const handleUpdatePlan = (values: any) => {
    if (!selectedPlan) return;
    
    // Check if pricing has changed
    const monthlyPricing = getPricingForCycle(selectedPlan, 'monthly');
    const yearlyPricing = getPricingForCycle(selectedPlan, 'yearly');
    const currentMonthlyPrice = monthlyPricing?.price || 0;
    const currentYearlyPrice = yearlyPricing?.price || 0;
    
    const pricingChanged = 
      values.monthlyPrice !== currentMonthlyPrice || 
      values.yearlyPrice !== currentYearlyPrice;
    
    if (pricingChanged) {
      // Update pricing through Stripe
      const pricingData: UpdatePlanPricingRequest = {
        monthlyPrice: values.monthlyPrice,
        yearlyPrice: values.yearlyPrice,
      };
      updatePricingMutation.mutate({ id: selectedPlan.id, data: pricingData });
    } else {
      // Update plan details only
      const updateData: UpdateSubscriptionPlanRequest = {
        name: values.name,
        description: values.description || '',
        apiRateLimit: values.apiRateLimit,
        maxRequestsPerMonth: values.maxRequestsPerMonth,
        featuresJson: JSON.stringify(values.features ? values.features.split('\n').filter(Boolean) : []),
        active: values.active,
      };
      updatePlanMutation.mutate({ id: selectedPlan.id, data: updateData });
    }
  };

  const handleCreatePaymentLink = (values: any) => {
    if (!selectedPlan) return;
    
    createPaymentLinkMutation.mutate({
      planId: selectedPlan.id,
      billingCycle: values.billingCycle,
      successUrl: values.successUrl,
      cancelUrl: values.cancelUrl,
    });
  };

  const openEditModal = (plan: PlanWithPricing) => {
    setSelectedPlan(plan);
    
    // Parse features from JSON
    let featuresText = '';
    try {
      const features = JSON.parse(plan.featuresJson);
      featuresText = Array.isArray(features) ? features.join('\n') : '';
    } catch {
      featuresText = '';
    }

    // Get current pricing
    const monthlyPricing = getPricingForCycle(plan, 'monthly');
    const yearlyPricing = getPricingForCycle(plan, 'yearly');
    
    editForm.setFieldsValue({
      name: plan.name,
      description: plan.description || '',
      apiRateLimit: plan.apiRateLimit,
      maxRequestsPerMonth: plan.maxRequestsPerMonth,
      features: featuresText,
      active: plan.active,
      monthlyPrice: monthlyPricing?.price || 0,
      yearlyPrice: yearlyPricing?.price || 0,
    });
    setIsEditModalOpen(true);
  };

  const openPaymentLinkModal = (plan: PlanWithPricing) => {
    setSelectedPlan(plan);
    paymentLinkForm.setFieldsValue({
      billingCycle: 'monthly',
      successUrl: `${window.location.origin}/subscription/success`,
      cancelUrl: `${window.location.origin}/subscription/cancel`,
    });
    setIsPaymentLinkModalOpen(true);
  };

  const getPricingForCycle = (plan: PlanWithPricing, cycle: 'monthly' | 'yearly') => {
    return plan.pricing?.find(p => p.billingCycle === cycle && p.active);
  };

  const columns = [
    {
      title: 'Plan Details',
      key: 'details',
      render: (record: PlanWithPricing) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          {record.description && <Text type="secondary">{record.description}</Text>}
          <Space>
            <Tag color={record.active ? 'green' : 'red'}>
              {record.active ? 'Active' : 'Inactive'}
            </Tag>
            {record.stripeProductId && (
              <Tag color="blue">Stripe: {record.stripeProductId.slice(-8)}</Tag>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Pricing',
      key: 'pricing',
      render: (record: PlanWithPricing) => {
        const monthlyPricing = getPricingForCycle(record, 'monthly');
        const yearlyPricing = getPricingForCycle(record, 'yearly');
        
        // Fallback: if no pricing data, show placeholder
        if (!monthlyPricing && !yearlyPricing) {
          return (
            <Space direction="vertical" size={0}>
              <Text type="secondary">No pricing configured</Text>
              <Text style={{ fontSize: '12px', color: '#999' }}>
                Create plan to set pricing
              </Text>
            </Space>
          );
        }
        
        return (
          <Space direction="vertical" size={0}>
            {monthlyPricing && (
              <Text>
                <DollarOutlined /> ${monthlyPricing.price}/month
                {monthlyPricing.stripePriceId && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    Stripe
                  </Tag>
                )}
              </Text>
            )}
            {yearlyPricing && (
              <Text>
                <DollarOutlined /> ${yearlyPricing.price}/year
                {yearlyPricing.stripePriceId && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    Stripe
                  </Tag>
                )}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Limits',
      key: 'limits',
      render: (record: PlanWithPricing) => (
        <Space direction="vertical" size={0}>
          <Text>Rate: {record.apiRateLimit}/min</Text>
          <Text>Monthly: {record.maxRequestsPerMonth.toLocaleString()}</Text>
        </Space>
      ),
    },
    {
      title: 'Features',
      dataIndex: 'featuresJson',
      key: 'features',
      render: (featuresJson: string) => {
        try {
          const features = JSON.parse(featuresJson);
          return (
            <Space direction="vertical" size={0}>
              {features.slice(0, 3).map((feature: string, index: number) => (
                <Text key={index} style={{ fontSize: '12px' }}>• {feature}</Text>
              ))}
              {features.length > 3 && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  +{features.length - 3} more...
                </Text>
              )}
            </Space>
          );
        } catch {
          return <Text type="secondary">Invalid features format</Text>;
        }
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: PlanWithPricing) => (
        <Space>
          <Tooltip title="Edit Plan">
            <Button
              type="default"
              icon={<EditOutlined />}
              size="small"
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Create Payment Link">
            <Button
              type="primary"
              icon={<LinkOutlined />}
              size="small"
              onClick={() => openPaymentLinkModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this plan?"
            description="This action cannot be undone. Make sure no active subscriptions use this plan."
            onConfirm={() => deletePlanMutation.mutate(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okType="danger"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={deletePlanMutation.isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>Subscription Plans</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Plan
        </Button>
      </div>

      <Table
        dataSource={plans}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      {/* Create Plan Modal */}
      <Modal
        title="Create Subscription Plan"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreatePlan}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Plan Name"
                rules={[{ required: true, message: 'Please enter plan name' }]}
              >
                <Input placeholder="e.g., Basic Plan" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="description"
                label="Description"
              >
                <Input placeholder="Brief description of the plan" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="monthlyPrice"
                label="Monthly Price ($)"
                rules={[{ required: true, message: 'Please enter monthly price' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="10.00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="yearlyPrice"
                label="Yearly Price ($)"
                rules={[{ required: true, message: 'Please enter yearly price' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="100.00"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="apiRateLimit"
                label="API Rate Limit (per minute)"
                rules={[{ required: true, message: 'Please enter rate limit' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="100"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxRequestsPerMonth"
                label="Max Requests Per Month"
                rules={[{ required: true, message: 'Please enter monthly limit' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="10000"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="features"
            label="Features (one per line)"
            rules={[{ required: true, message: 'Please enter features' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createPlanMutation.isPending}
              >
                Create Plan
              </Button>
              <Button onClick={() => {
                setIsCreateModalOpen(false);
                createForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        title={`Edit Plan - ${selectedPlan?.name}`}
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          editForm.resetFields();
          setSelectedPlan(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdatePlan}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Plan Name"
                rules={[{ required: true, message: 'Please enter plan name' }]}
              >
                <Input placeholder="e.g., Basic Plan" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="description"
                label="Description"
              >
                <Input placeholder="Brief description of the plan" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="apiRateLimit"
                label="API Rate Limit (per minute)"
                rules={[{ required: true, message: 'Please enter rate limit' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="100"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxRequestsPerMonth"
                label="Max Requests Per Month"
                rules={[{ required: true, message: 'Please enter monthly limit' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="10000"
                />
              </Form.Item>
            </Col>
          </Row>

          <Card 
            title="Pricing (Editable through Stripe)" 
            size="small" 
            style={{ marginBottom: 16, backgroundColor: '#f0f8ff' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="monthlyPrice"
                  label="Monthly Price ($)"
                  rules={[{ required: true, message: 'Please enter monthly price' }]}
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                    placeholder="10.00"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="yearlyPrice"
                  label="Yearly Price ($)"
                  rules={[{ required: true, message: 'Please enter yearly price' }]}
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                    placeholder="100.00"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              💡 Pricing changes will update Stripe prices and create new price IDs. Old prices will be archived.
            </Text>
          </Card>

          <Form.Item
            name="features"
            label="Features (one per line)"
            rules={[{ required: true, message: 'Please enter features' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
            />
          </Form.Item>

          <Form.Item
            name="active"
            label="Active Status"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={updatePlanMutation.isPending || updatePricingMutation.isPending}
              >
                Update Plan
              </Button>
              <Button onClick={() => {
                setIsEditModalOpen(false);
                editForm.resetFields();
                setSelectedPlan(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Payment Link Modal */}
      <Modal
        title={`Create Payment Link - ${selectedPlan?.name}`}
        open={isPaymentLinkModalOpen}
        onCancel={() => {
          setIsPaymentLinkModalOpen(false);
          paymentLinkForm.resetFields();
          setSelectedPlan(null);
        }}
        footer={null}
      >
        <Form
          form={paymentLinkForm}
          layout="vertical"
          onFinish={handleCreatePaymentLink}
        >
          <Form.Item
            name="billingCycle"
            label="Billing Cycle"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="monthly">Monthly</Select.Option>
              <Select.Option value="yearly">Yearly</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="successUrl"
            label="Success URL"
            rules={[
              { required: true, message: 'Please enter success URL' },
              { type: 'url', message: 'Please enter a valid URL' }
            ]}
          >
            <Input placeholder="https://yoursite.com/success" />
          </Form.Item>

          <Form.Item
            name="cancelUrl"
            label="Cancel URL"
            rules={[
              { required: true, message: 'Please enter cancel URL' },
              { type: 'url', message: 'Please enter a valid URL' }
            ]}
          >
            <Input placeholder="https://yoursite.com/cancel" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createPaymentLinkMutation.isPending}
              >
                Create & Copy Link
              </Button>
              <Button onClick={() => {
                setIsPaymentLinkModalOpen(false);
                paymentLinkForm.resetFields();
                setSelectedPlan(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 