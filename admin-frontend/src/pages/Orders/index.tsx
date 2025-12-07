/**
 * 订单管理页面
 * 管理所有订单信息，包括订单状态、支付状态、退款等
 */

import React, { useState } from 'react';
import {
  Row,
  Col,
  Button,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  InputNumber,
  message,
  Descriptions,
  Alert,
  Dropdown,
  type MenuProps,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  // EditOutlined, // 暂时注释掉未使用的导入
  ExclamationCircleOutlined,
  DollarOutlined,
  // ShoppingCartOutlined, // 暂时注释掉未使用的导入
  // CheckCircleOutlined, // 暂时注释掉未使用的导入
  // CloseCircleOutlined, // 暂时注释掉未使用的导入
  // ClockCircleOutlined, // 暂时注释掉未使用的导入
  MoreOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { GlassCard, PageHeader, CyberButton, StatCard, DataGrid } from '../../components';
import {
  getOrders,
  getOrderStats,
  exportOrders,
  refundOrder,
  type Order,
  type RefundParams,
} from '../../api/orders';
import './index.css';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const Orders: React.FC = () => {
  const queryClient = useQueryClient();
  
  // 状态管理
  const [searchParams, setSearchParams] = useState({
    page: 1,
    per_page: 20,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundForm] = Form.useForm();

  // 获取订单统计数据
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['order-stats'],
    queryFn: getOrderStats,
  });

  // 获取订单列表
  const { data: ordersData, isLoading: ordersLoading, refetch } = useQuery<{
    orders: Order[];
    total: number;
    page: number;
    per_page: number;
  }>({
    queryKey: ['orders', searchParams],
    queryFn: () => getOrders(searchParams),
  });

  // 调试日志
  React.useEffect(() => {
    if (ordersData) {
      console.log('订单数据获取成功:', ordersData);
      console.log('订单数量:', ordersData?.orders?.length || 0);
    }
  }, [ordersData]);

  // 处理搜索
  const handleSearch = (values: any) => {
    setSearchParams({
      ...searchParams,
      ...values,
      page: 1,
    });
  };

  // 重置搜索
  const handleReset = () => {
    setSearchParams({
      page: 1,
      per_page: 20,
    });
  };

  // 查看订单详情
  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  // 导出订单数据
  const handleExport = async () => {
    try {
      message.loading('正在导出订单数据...', 0);
      const response = await exportOrders(searchParams);
      
      const blob = new Blob([response], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `订单数据_${dayjs().format('YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.destroy();
      message.success('订单数据导出成功');
    } catch (error: any) {
      message.destroy();
      message.error(error?.response?.data?.message || '导出失败');
    }
  };

  // 退款处理 Mutation
  const refundMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: number; data: RefundParams }) =>
      refundOrder(orderId, data),
    onSuccess: () => {
      message.success('退款申请已提交');
      setRefundModalVisible(false);
      refundForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '退款申请失败');
    },
  });

  // 打开退款模态框
  const handleRefund = (order: Order) => {
    setSelectedOrder(order);
    refundForm.setFieldsValue({
      amount: order.amount,
      reason: undefined,
      description: '',
      audit_notes: '',
    });
    setRefundModalVisible(true);
  };

  // 提交退款
  const handleRefundSubmit = async () => {
    try {
      const values = await refundForm.validateFields();
      if (!selectedOrder) return;

      Modal.confirm({
        title: '确认退款',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>订单号：{selectedOrder.order_number}</p>
            <p>退款金额：¥{values.amount.toFixed(2)}</p>
            <p>退款原因：{values.reason}</p>
            <Alert
              message="注意"
              description="退款操作将调用支付宝退款接口，请确认信息无误。如支付宝接口未配置，将仅更新系统状态。"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        ),
        okText: '确认退款',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: () => {
          refundMutation.mutate({
            orderId: selectedOrder.id,
            data: values,
          });
        },
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 订单状态标签
  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'orange', text: '待支付' },
      completed: { color: 'green', text: '已完成' },
      failed: { color: 'red', text: '支付失败' },
      refunded: { color: 'purple', text: '已退款' },
      cancelled: { color: 'gray', text: '已取消' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 操作菜单
  const getActionMenu = (record: Order): MenuProps => ({
    items: [
      {
        key: 'view',
        label: '查看详情',
        icon: <EyeOutlined />,
        onClick: () => handleViewDetail(record),
      },
      // 只有已完成的订单才能退款
      ...(record.status === 'completed'
        ? [
            {
              key: 'refund',
              label: '申请退款',
              icon: <DollarOutlined />,
              onClick: () => handleRefund(record),
              danger: true,
            },
          ]
        : []),
    ],
  });

  // 表格列定义
  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_sn',
      key: 'order_sn',
      width: 180,
      render: (text: string) => (
        <span className="order-sn">{text}</span>
      ),
    },
    {
      title: '用户信息',
      dataIndex: 'user',
      key: 'user',
      width: 200,
      render: (user: any) => (
        <div>
          <div className="user-name">{user.username}</div>
          <div className="user-email">{user.email}</div>
        </div>
      ),
    },
    {
      title: '会员套餐',
      dataIndex: 'membership_tier',
      key: 'membership_tier',
      width: 150,
      render: (tier: any) => (
        <Tag color="blue">{tier.name}</Tag>
      ),
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <span className="amount">¥{amount.toFixed(2)}</span>
      ),
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 120,
      render: (method: string) => {
        const methodMap = {
          alipay: '支付宝',
          wechat: '微信支付',
          bank: '银行卡',
        };
        return methodMap[method as keyof typeof methodMap] || method;
      },
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => {
        if (!text) return '-';
        return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: Order) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="orders-page">
      <PageHeader
        title="订单管理"
        subtitle="管理所有订单信息，包括订单状态、支付状态、退款等"
        breadcrumb={[{ title: '订单管理' }]}
        extra={
          <Space>
            <CyberButton icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </CyberButton>
            <CyberButton icon={<DownloadOutlined />} onClick={handleExport}>
              导出数据
            </CyberButton>
          </Space>
        }
      />

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="今日收入"
            value={stats?.today_revenue || 0}
            prefix="¥"
            decimals={2}
            color="var(--success-color)"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="本周收入"
            value={stats?.week_revenue || 0}
            prefix="¥"
            decimals={2}
            color="var(--primary-color)"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="本月收入"
            value={stats?.month_revenue || 0}
            prefix="¥"
            decimals={2}
            color="var(--warning-color)"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="总收入"
            value={stats?.total_revenue || 0}
            prefix="¥"
            decimals={2}
            color="var(--info-color)"
            loading={statsLoading}
          />
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <GlassCard style={{ marginBottom: 24 }}>
        <Form
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="keyword">
            <Input
              placeholder="搜索订单号、用户名、邮箱"
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
            />
          </Form.Item>
          
          <Form.Item name="status">
            <Select placeholder="订单状态" style={{ width: 120 }} allowClear>
              <Select.Option value="pending">待支付</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="failed">支付失败</Select.Option>
              <Select.Option value="refunded">已退款</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="payment_method">
            <Select placeholder="支付方式" style={{ width: 120 }} allowClear>
              <Select.Option value="alipay">支付宝</Select.Option>
              <Select.Option value="wechat">微信支付</Select.Option>
              <Select.Option value="bank">银行卡</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="date_range">
            <RangePicker />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </GlassCard>

      {/* 订单列表 */}
      <GlassCard>
        {/* 调试信息 */}
        {import.meta.env.DEV && (
          <div style={{ padding: '20px', background: '#f0f0f0', marginBottom: '20px', border: '2px solid #333' }}>
            <h3>🔍 调试信息</h3>
            <p><strong>ordersData类型:</strong> {typeof ordersData}</p>
            <p><strong>ordersData键:</strong> {JSON.stringify(ordersData ? Object.keys(ordersData) : null)}</p>
            <p><strong>orders数量:</strong> {ordersData?.orders?.length || 0}</p>
            <p><strong>total:</strong> {ordersData?.total || 0}</p>
            <p><strong>loading状态:</strong> {ordersLoading ? '加载中' : '已完成'}</p>
            <p><strong>完整数据:</strong></p>
            <pre style={{ background: '#fff', padding: '10px', maxHeight: '200px', overflow: 'auto' }}>
              {JSON.stringify(ordersData, null, 2)}
            </pre>
          </div>
        )}
        
        {/* 备用简单表格 */}
        {import.meta.env.DEV && ordersData?.orders && ordersData.orders.length > 0 && (
          <div style={{ marginBottom: '20px', padding: '10px', background: '#e6f7ff', border: '1px solid #91d5ff' }}>
            <h4>📋 备用简单列表 (前3个订单)</h4>
            {ordersData.orders.slice(0, 3).map((order: any) => (
              <div key={order.id} style={{ padding: '10px', margin: '5px 0', background: '#fff', border: '1px solid #ddd' }}>
                <p><strong>订单号:</strong> {order.order_number}</p>
                <p><strong>用户:</strong> {order.user?.username} ({order.user?.email})</p>
                <p><strong>套餐:</strong> {order.tier?.name} - ¥{order.tier?.price}</p>
                <p><strong>状态:</strong> {order.status}</p>
                <p><strong>金额:</strong> ¥{order.amount}</p>
              </div>
            ))}
          </div>
        )}

        <DataGrid
          columns={columns}
          dataSource={ordersData?.orders || []}
          loading={ordersLoading}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.per_page,
            total: ordersData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `显示 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
            onChange: (page, pageSize) => {
              setSearchParams({
                ...searchParams,
                page,
                per_page: pageSize,
              });
            },
          }}
        />
      </GlassCard>

      {/* 订单详情模态框 */}
      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="订单号" span={2}>
              {selectedOrder.order_number}
            </Descriptions.Item>
            <Descriptions.Item label="用户名">
              {selectedOrder.user.username}
            </Descriptions.Item>
            <Descriptions.Item label="用户邮箱">
              {selectedOrder.user.email}
            </Descriptions.Item>
            <Descriptions.Item label="会员套餐">
              {selectedOrder.tier.name}
            </Descriptions.Item>
            <Descriptions.Item label="订单金额">
              ¥{selectedOrder.amount.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="支付方式">
              {selectedOrder.payment_method}
            </Descriptions.Item>
            <Descriptions.Item label="订单状态">
              {getStatusTag(selectedOrder.status)}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="完成时间">
              {selectedOrder.completed_at 
                ? dayjs(selectedOrder.completed_at).format('YYYY-MM-DD HH:mm:ss')
                : '-'
              }
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 退款模态框 */}
      <Modal
        title="申请退款"
        open={refundModalVisible}
        onCancel={() => {
          setRefundModalVisible(false);
          refundForm.resetFields();
        }}
        onOk={handleRefundSubmit}
        okText="提交退款"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: refundMutation.isPending }}
        width={600}
      >
        {selectedOrder && (
          <>
            <Alert
              message="订单信息"
              description={
                <div>
                  <p>订单号：{selectedOrder.order_number}</p>
                  <p>用户：{selectedOrder.user.username}</p>
                  <p>套餐：{selectedOrder.tier.name}</p>
                  <p>原始金额：¥{selectedOrder.amount.toFixed(2)}</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form
              form={refundForm}
              layout="vertical"
              initialValues={{
                amount: selectedOrder.amount,
              }}
            >
              <Form.Item
                name="reason"
                label="退款原因"
                rules={[{ required: true, message: '请选择退款原因' }]}
              >
                <Select placeholder="请选择退款原因">
                  <Select.Option value="user_request">用户申请退款</Select.Option>
                  <Select.Option value="system_error">系统错误</Select.Option>
                  <Select.Option value="duplicate_payment">重复支付</Select.Option>
                  <Select.Option value="service_issue">服务问题</Select.Option>
                  <Select.Option value="other">其他原因</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="amount"
                label="退款金额"
                rules={[
                  { required: true, message: '请输入退款金额' },
                  {
                    validator: (_, value) => {
                      if (value <= 0) {
                        return Promise.reject('退款金额必须大于0');
                      }
                      if (value > selectedOrder.amount) {
                        return Promise.reject('退款金额不能超过订单金额');
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  prefix="¥"
                  precision={2}
                  min={0}
                  max={selectedOrder.amount}
                  style={{ width: '100%' }}
                  placeholder="请输入退款金额"
                />
              </Form.Item>

              <Form.Item
                name="description"
                label="退款说明"
                rules={[{ required: true, message: '请输入退款说明' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="请详细说明退款原因和情况"
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item
                name="audit_notes"
                label="审核意见（可选）"
              >
                <TextArea
                  rows={3}
                  placeholder="管理员审核意见"
                  maxLength={300}
                  showCount
                />
              </Form.Item>
            </Form>

            <Alert
              message="退款说明"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>如已配置支付宝接口，将自动调用退款API</li>
                  <li>如未配置支付宝接口，系统将仅更新订单状态为"已退款"</li>
                  <li>退款后，用户的会员权限将自动取消</li>
                  <li>退款操作不可撤销，请谨慎操作</li>
                </ul>
              }
              type="warning"
              showIcon
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default Orders;