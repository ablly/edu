/**
 * 会员管理页面
 * 管理会员套餐、早鸟优惠、会员记录，分析会员数据
 */

import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Progress,
  Statistic,
  message,
  Tabs,
  App,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CrownOutlined,
  BarChartOutlined,
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
  FireOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { GlassCard, PageHeader, CyberButton, StatCard, DataGrid } from '../../components';
import CreateTierWizard from '../../components/CreateTierWizard';
import {
  getMembershipTiers,
  getMembershipStats,
  getEarlyBirdStatus,
  getMembershipRecords,
  createMembershipTier,
  updateMembershipTier,
  deleteMembershipTier,
  getTierSalesStats,
  type MembershipTier,
  type MembershipStats,
  type EarlyBirdStatus,
} from '../../api/memberships';
import './index.css';

const { TabPane } = Tabs;

const Memberships: React.FC = () => {
  const { modal } = App.useApp();
  const queryClient = useQueryClient();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [salesModalVisible, setSalesModalVisible] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();

  // 获取会员统计数据
  const { data: stats } = useQuery<MembershipStats>({
    queryKey: ['membership-stats'],
    queryFn: getMembershipStats,
  });

  // 获取会员套餐列表
  const { data: tiers } = useQuery<MembershipTier[]>({
    queryKey: ['membership-tiers'],
    queryFn: getMembershipTiers,
  });


  // 获取早鸟优惠状态
  const { data: earlyBird } = useQuery<EarlyBirdStatus>({
    queryKey: ['early-bird-status'],
    queryFn: getEarlyBirdStatus,
  });

  // 获取会员开通记录
  const { data: records } = useQuery({
    queryKey: ['membership-records'],
    queryFn: () => getMembershipRecords({ page: 1, per_page: 10 }),
  });

  // 获取套餐销售统计
  const { data: salesStats } = useQuery({
    queryKey: ['tier-sales-stats', selectedTierId],
    queryFn: () => selectedTierId ? getTierSalesStats(selectedTierId) : null,
    enabled: !!selectedTierId,
  });

  // 创建套餐
  const createTierMutation = useMutation({
    mutationFn: createMembershipTier,
    onSuccess: () => {
      message.success('套餐创建成功');
      setAddModalVisible(false);
      addForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['membership-tiers'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '创建失败');
    },
  });

  // 更新套餐
  const updateTierMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MembershipTier> }) =>
      updateMembershipTier(id, data),
    onSuccess: () => {
      message.success('套餐更新成功');
      setEditModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['membership-tiers'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '更新失败');
    },
  });

  // 删除套餐
  const deleteTierMutation = useMutation({
    mutationFn: deleteMembershipTier,
    onSuccess: () => {
      message.success('套餐删除成功');
      queryClient.invalidateQueries({ queryKey: ['membership-tiers'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '删除失败');
    },
  });

  // 处理新增套餐
  const handleAddTier = () => {
    addForm.resetFields();
    setAddModalVisible(true);
  };

  // 处理编辑套餐
  const handleEditTier = (tier: MembershipTier) => {
    setEditingTier(tier);
    form.setFieldsValue(tier);
    setEditModalVisible(true);
  };

  // 处理删除套餐
  const handleDeleteTier = (tier: MembershipTier) => {
    modal.confirm({
      title: '确认删除套餐',
      content: `确定要删除套餐 "${tier.name}" 吗？此操作不可撤销。`,
      icon: <ExclamationCircleOutlined />,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        deleteTierMutation.mutate(tier.id);
      },
    });
  };

  // 处理查看销售统计
  const handleViewSales = (tierId: number) => {
    setSelectedTierId(tierId);
    setSalesModalVisible(true);
  };

  // 提交新增表单
  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      createTierMutation.mutate(values);
    } catch (error: any) {
      console.error('表单验证失败:', error);
      if (error.errorFields && error.errorFields.length > 0) {
        const firstError = error.errorFields[0];
        message.error(`请填写${firstError.name.join('.')}: ${firstError.errors[0]}`);
      } else {
        message.error('请检查表单必填项');
      }
    }
  };

  // 提交编辑表单
  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingTier) {
        updateTierMutation.mutate({ id: editingTier.id, data: values });
      }
    } catch (error: any) {
      console.error('表单验证失败:', error);
      if (error.errorFields && error.errorFields.length > 0) {
        const firstError = error.errorFields[0];
        message.error(`请填写${firstError.name.join('.')}: ${firstError.errors[0]}`);
      } else {
        message.error('请检查表单必填项');
      }
    }
  };

  // 套餐卡片组件
  const TierCard: React.FC<{ tier: MembershipTier }> = ({ tier }) => {
    const tierColors = {
      1: '#6B7280', // 免费版 - 灰色
      2: '#3B82F6', // 周卡 - 蓝色
      3: '#8B5CF6', // 月卡 - 紫色
      4: '#F59E0B', // 年卡 - 金色
    };

    const color = tierColors[tier.level as keyof typeof tierColors] || '#6B7280';

    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className="tier-card"
          style={{
            background: `linear-gradient(135deg, ${color}20, ${color}10)`,
            border: `1px solid ${color}40`,
            boxShadow: `0 4px 20px ${color}20`,
          }}
          hoverable
        >
          <div className="tier-header">
            <div className="tier-icon">
              <CrownOutlined style={{ color, fontSize: 24 }} />
            </div>
            <div className="tier-info">
              <h3 className="tier-name">{tier.name}</h3>
              <p className="tier-code">{tier.code}</p>
            </div>
            {tier.is_limited && (
              <Tag color="red" className="limited-tag">
                <FireOutlined /> 限量
              </Tag>
            )}
          </div>

          <div className="tier-price">
            <div className="current-price">
              <CountUp
                end={tier.price}
                duration={1.5}
                prefix="¥"
                separator=","
              />
            </div>
            {tier.is_early_bird && tier.original_price && (
              <div className="original-price">
                原价 ¥{tier.original_price}
              </div>
            )}
            <div className="tier-duration">
              {tier.duration_days === 0 ? '永久' : `${tier.duration_days}天`}
            </div>
          </div>

          {tier.is_limited && (
            <div className="tier-quota">
              <div className="quota-info">
                <span>已售: {tier.sold_count || 0}</span>
                <span>总量: {tier.total_quota || 0}</span>
              </div>
              <Progress
                percent={((tier.sold_count || 0) / (tier.total_quota || 1)) * 100}
                strokeColor={color}
                size="small"
              />
            </div>
          )}

          <div className="tier-features">
            {tier.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="feature-item">
                ✓ {feature}
              </div>
            ))}
            {tier.features.length > 3 && (
              <div className="more-features">
                +{tier.features.length - 3} 更多功能
              </div>
            )}
          </div>

          <div className="tier-actions">
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditTier(tier)}
              >
                编辑套餐
              </Button>
              <Button
                size="small"
                icon={<BarChartOutlined />}
                onClick={() => handleViewSales(tier.id)}
              >
                销售统计
              </Button>
              {tier.code !== 'free' && (
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteTier(tier)}
                >
                  删除
                </Button>
              )}
            </Space>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="memberships-page">
      <PageHeader
        title="会员管理"
        subtitle="管理会员套餐、早鸟优惠、会员记录，分析会员数据"
        breadcrumb={[{ title: '会员管理' }]}
        extra={
          <Space>
            <CyberButton icon={<SettingOutlined />}>
              早鸟设置
            </CyberButton>
            <CyberButton type="primary" icon={<PlusOutlined />} onClick={handleAddTier}>
              新增套餐
            </CyberButton>
          </Space>
        }
      />

      {/* 第一行：会员统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="总会员数"
              value={stats?.total_members || 0}
              color="var(--primary-color)"
              prefix={<UserOutlined />}
              trend={{ value: 12.5, direction: 'up' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="活跃会员"
              value={stats?.active_members || 0}
              color="var(--success-color)"
              prefix={<CrownOutlined />}
              trend={{ value: 8.3, direction: 'up' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="本月新增"
              value={stats?.new_members_this_month || 0}
              color="var(--secondary-color)"
              prefix={<TrophyOutlined />}
              trend={{ value: 15.2, direction: 'up' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="转化率"
              value={stats?.conversion_rate || 0}
              suffix="%"
              decimals={1}
              color="var(--warning-color)"
              prefix={<DollarOutlined />}
              trend={{ value: 2.1, direction: 'up' }}
            />
        </Col>
      </Row>

      {/* 第二行：套餐卡片展示 */}
      <GlassCard title="会员套餐" style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          {tiers?.map((tier) => (
            <Col key={tier.id} xs={24} sm={12} lg={6}>
              <TierCard tier={tier} />
            </Col>
          ))}
        </Row>
      </GlassCard>

      {/* 第三行：早鸟优惠管理 */}
      {earlyBird?.is_active && (
        <GlassCard
          title={
            <Space>
              <FireOutlined style={{ color: 'var(--danger-color)' }} />
              早鸟优惠倒计时
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <div className="early-bird-countdown">
                <Statistic.Countdown
                  title="距离优惠结束"
                  value={new Date(earlyBird.end_time).getTime()}
                  format="D 天 H 时 m 分 s 秒"
                />
              </div>
            </Col>
            {earlyBird.tiers.map((tier) => (
              <Col key={tier.tier} xs={24} sm={8}>
                <Card size="small" className="early-bird-tier">
                  <div className="tier-header">
                    <h4>档位 {tier.tier}</h4>
                    <Tag color="red">¥{tier.price}</Tag>
                  </div>
                  <div className="tier-progress">
                    <Progress
                      percent={tier.progress}
                      strokeColor="var(--danger-color)"
                      format={() => `${tier.sold_count}/${tier.total_quota}`}
                    />
                  </div>
                  <div className="tier-remaining">
                    剩余名额: {tier.remaining}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </GlassCard>
      )}

      {/* 第四行：会员开通记录 */}
      <GlassCard title="最近会员开通记录" style={{ marginBottom: 24 }}>
        <DataGrid
          dataSource={records?.records || []}
          rowKey="id"
          loading={false}
          columns={[
            {
              title: 'ID',
              dataIndex: 'id',
              key: 'id',
              width: 80,
            },
            {
              title: '用户',
              dataIndex: 'user',
              key: 'user',
              render: (user: any) => (
                <Space>
                  <span>{user.username}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    {user.email}
                  </span>
                </Space>
              ),
            },
            {
              title: '套餐',
              dataIndex: 'tier',
              key: 'tier',
              render: (tier: any) => (
                <Tag color="blue">{tier.name}</Tag>
              ),
            },
            {
              title: '开通时间',
              dataIndex: 'start_date',
              key: 'start_date',
              render: (date: string) => new Date(date).toLocaleString(),
            },
            {
              title: '到期时间',
              dataIndex: 'end_date',
              key: 'end_date',
              render: (date: string) => new Date(date).toLocaleString(),
            },
            {
              title: '状态',
              dataIndex: 'is_active',
              key: 'is_active',
              render: (active: boolean) => (
                <Tag color={active ? 'success' : 'error'}>
                  {active ? '有效' : '已过期'}
                </Tag>
              ),
            },
          ]}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </GlassCard>

      {/* 新增套餐向导 */}
      <CreateTierWizard
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
      />

      {/* 旧的新增套餐模态框 - 已弃用 */}
      {false && false && (
      <Modal
        title="新增会员套餐"
        open={addModalVisible}
        onOk={handleAddSubmit}
        onCancel={() => {
          setAddModalVisible(false);
          addForm.resetFields();
        }}
        confirmLoading={createTierMutation.isPending}
        width={800}
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={addForm}
          layout="vertical"
          initialValues={{
            is_active: true,
            duration_days: 30,
            features: [],
            is_limited: false,
            is_early_bird: false,
            total_quota: 0,
            early_bird_tier: 0,
            original_price: 0
          }}
        >
          <Form.Item
            name="name"
            label="套餐名称"
            rules={[{ required: true, message: '请输入套餐名称' }]}
          >
            <Input placeholder="请输入套餐名称" />
          </Form.Item>

          <Form.Item
            name="code"
            label="套餐代码"
            rules={[
              { required: true, message: '请输入套餐代码' },
              { pattern: /^[a-z_]+$/, message: '套餐代码只能包含小写字母和下划线' }
            ]}
          >
            <Input placeholder="请输入套餐代码，如：premium_monthly" />
          </Form.Item>

          <Form.Item
            name="description"
            label="套餐描述"
            rules={[{ required: true, message: '请输入套餐描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入套餐描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="套餐价格"
                rules={[{ required: true, message: '请输入套餐价格' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="请输入价格"
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="duration_days"
                label="有效期（天）"
                rules={[{ required: true, message: '请输入有效期' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="0表示永久有效"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="is_active"
                label="是否启用"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="is_limited"
                label="是否限量"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="is_early_bird"
                label="是否早鸟"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="total_quota"
                label="总名额"
                tooltip="限量套餐的总名额，0表示无限"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="0表示无限"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="early_bird_tier"
                label="早鸟档位"
                tooltip="早鸟优惠档位：1/2/3"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={3}
                  placeholder="1/2/3"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="original_price"
                label="原价"
                tooltip="早鸟套餐的原价，用于显示优惠"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="原价"
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="features"
            label="套餐功能"
            rules={[{ required: true, message: '请至少添加一个功能' }]}
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="请输入功能描述，按回车添加"
              options={[
                { label: 'AI智能对话', value: 'AI智能对话' },
                { label: '智能出题功能', value: '智能出题功能' },
                { label: '作业批改', value: '作业批改' },
                { label: '学习分析', value: '学习分析' },
                { label: '优先客服', value: '优先客服' },
                { label: '专属徽章', value: '专属徽章' },
                { label: '定制化服务', value: '定制化服务' },
                { label: 'VIP群组', value: 'VIP群组' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
      )}

      {/* 编辑套餐模态框 */}
      <Modal
        title="编辑会员套餐"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={updateTierMutation.isPending}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="套餐名称"
                name="name"
                rules={[{ required: true, message: '请输入套餐名称' }]}
              >
                <Input placeholder="请输入套餐名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="套餐代码"
                name="code"
                rules={[{ required: true, message: '请输入套餐代码' }]}
              >
                <Input placeholder="请输入套餐代码" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="价格"
                name="price"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入价格"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="时长(天)"
                name="duration_days"
                rules={[{ required: true, message: '请输入时长' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="0表示永久"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="是否限量"
                name="is_limited"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="是否早鸟"
                name="is_early_bird"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="是否激活"
                name="is_active"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="总名额"
                name="total_quota"
                tooltip="限量套餐的总名额，0表示无限"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="0表示无限"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="早鸟档位"
                name="early_bird_tier"
                tooltip="早鸟优惠档位：1/2/3"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={3}
                  placeholder="1/2/3"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="原价"
                name="original_price"
                tooltip="早鸟套餐的原价，用于显示优惠"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="原价"
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="套餐描述"
            name="description"
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入套餐描述"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 销售统计模态框 */}
      <Modal
        title="套餐销售统计"
        open={salesModalVisible}
        onCancel={() => setSalesModalVisible(false)}
        footer={null}
        width={900}
      >
        {salesStats && (
          <Tabs defaultActiveKey="overview">
            <TabPane tab="销售概览" key="overview">
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic
                    title="总销售额"
                    value={salesStats.total_revenue}
                    prefix="¥"
                    precision={2}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="销售数量"
                    value={salesStats.total_sales}
                    suffix="份"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="平均客单价"
                    value={salesStats.average_price}
                    prefix="¥"
                    precision={2}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="续费率"
                    value={salesStats.conversion_analysis.renewal_rate}
                    suffix="%"
                    precision={1}
                  />
                </Col>
              </Row>
            </TabPane>
            <TabPane tab="用户列表" key="users">
              <Table
                dataSource={salesStats.user_list}
                rowKey={(record) => record.user.id}
                columns={[
                  {
                    title: '用户',
                    dataIndex: 'user',
                    render: (user: any) => (
                      <div>
                        <div>{user.username}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {user.email}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: '购买时间',
                    dataIndex: 'purchase_time',
                    render: (time: string) => new Date(time).toLocaleString(),
                  },
                  {
                    title: '到期时间',
                    dataIndex: 'expire_time',
                    render: (time: string) => new Date(time).toLocaleString(),
                  },
                  {
                    title: '续费状态',
                    dataIndex: 'is_renewed',
                    render: (renewed: boolean) => (
                      <Tag color={renewed ? 'success' : 'default'}>
                        {renewed ? '已续费' : '未续费'}
                      </Tag>
                    ),
                  },
                ]}
                pagination={{ pageSize: 10 }}
              />
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default Memberships;

