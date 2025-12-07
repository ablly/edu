/**
 * 支付记录管理页面
 * 管理所有支付交易记录，包括支付状态同步、对账等功能
 */

import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  // Table, // 暂时注释掉未使用的导入
  Button,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
  // Tooltip, // 暂时注释掉未使用的导入
  Descriptions,
  Statistic,
  Alert,
  Dropdown,
  Progress,
  type MenuProps,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  SyncOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { motion } from 'framer-motion'; // 暂时注释掉未使用的导入
import dayjs from 'dayjs';
import { GlassCard, PageHeader, CyberButton, StatCard, DataGrid } from '../../components';
import {
  getPaymentRecords,
  syncPaymentStatus,
  batchSyncPaymentStatus,
  generateReconciliationReport,
  exportReconciliationReport,
  type PaymentRecord,
  type ReconciliationReport,
} from '../../api/payments';
import './index.css';

const { RangePicker } = DatePicker;

const Payments: React.FC = () => {
  const queryClient = useQueryClient();
  
  // 状态管理
  const [searchParams, setSearchParams] = useState({
    page: 1,
    per_page: 20,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [reconciliationModalVisible, setReconciliationModalVisible] = useState(false);
  const [batchSyncModalVisible, setBatchSyncModalVisible] = useState(false);
  const [reconciliationData, setReconciliationData] = useState<ReconciliationReport | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentRecord | null>(null);
  const [reconciliationForm] = Form.useForm();
  const [batchSyncForm] = Form.useForm();

  // 获取支付记录列表
  const { data: paymentsData, isLoading: paymentsLoading, refetch } = useQuery({
    queryKey: ['payment-records', searchParams],
    queryFn: () => getPaymentRecords(searchParams),
  });

  // 同步支付状态
  const syncMutation = useMutation({
    mutationFn: syncPaymentStatus,
    onSuccess: () => {
      message.success('支付状态同步成功');
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '同步失败');
    },
  });

  // 生成对账报表
  const reconciliationMutation = useMutation({
    mutationFn: generateReconciliationReport,
    onSuccess: (data) => {
      message.success('对账报表生成成功');
      setReconciliationData(data);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '生成报表失败');
    },
  });

  // 批量同步
  const batchSyncMutation = useMutation({
    mutationFn: batchSyncPaymentStatus,
    onSuccess: (data) => {
      message.success(data.message || '批量同步完成');
      setBatchSyncModalVisible(false);
      batchSyncForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['payment-records'] });
      
      // 显示同步结果详情
      Modal.info({
        title: '批量同步结果',
        content: (
          <div>
            <p>同步数量: {data.synced_count}</p>
            <p>更新数量: {data.updated_count}</p>
            <p>失败数量: {data.failed_count}</p>
          </div>
        ),
        width: 500,
      });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '批量同步失败');
    },
  });

  // 处理搜索
  const handleSearch = (values: any) => {
    const params: any = { ...values };
    
    // 处理日期范围
    if (params.date_range) {
      params.start_date = params.date_range[0].format('YYYY-MM-DD');
      params.end_date = params.date_range[1].format('YYYY-MM-DD');
      delete params.date_range;
    }
    
    // 处理金额范围
    if (params.min_amount) {
      params.min_amount = params.min_amount;
    }
    if (params.max_amount) {
      params.max_amount = params.max_amount;
    }
    
    setSearchParams({
      ...searchParams,
      ...params,
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

  // 查看交易详情
  const handleViewDetail = (transaction: PaymentRecord) => {
    setSelectedTransaction(transaction);
    setDetailModalVisible(true);
  };

  // 同步支付状态
  const handleSync = (transaction: PaymentRecord) => {
    Modal.confirm({
      title: '同步支付状态',
      content: `确定要同步交易 ${transaction.transaction_id} 的支付状态吗？`,
      icon: <ExclamationCircleOutlined />,
      onOk: () => syncMutation.mutate(transaction.id),
    });
  };

  // 生成对账报表
  const handleReconciliation = () => {
    setReconciliationData(null);
    reconciliationForm.resetFields();
    setReconciliationModalVisible(true);
  };

  // 提交对账报表生成
  const handleReconciliationSubmit = async () => {
    try {
      const values = await reconciliationForm.validateFields();
      const params = {
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD'),
        payment_method: values.payment_method,
      };
      reconciliationMutation.mutate(params);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 导出对账报表
  const handleExportReconciliation = async () => {
    try {
      const values = await reconciliationForm.validateFields();
      message.loading('正在导出对账报表...', 0);
      
      const params = {
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD'),
        payment_method: values.payment_method,
        format: 'xlsx' as const,
      };
      
      const response = await exportReconciliationReport(params);
      
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `对账报表_${params.start_date}_${params.end_date}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.destroy();
      message.success('对账报表导出成功');
    } catch (error: unknown) {
      message.destroy();
      message.error('导出失败');
    }
  };

  // 打开批量同步模态框
  const handleBatchSync = () => {
    batchSyncForm.resetFields();
    setBatchSyncModalVisible(true);
  };

  // 提交批量同步
  const handleBatchSyncSubmit = async () => {
    try {
      const values = await batchSyncForm.validateFields();
      const params = {
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD'),
        payment_method: values.payment_method,
        status: values.status,
      };
      batchSyncMutation.mutate(params);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 支付状态标签
  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'orange', text: '处理中', icon: <ClockCircleOutlined /> },
      completed: { color: 'green', text: '成功', icon: <CheckCircleOutlined /> },
      failed: { color: 'red', text: '失败', icon: <CloseCircleOutlined /> },
      refunded: { color: 'purple', text: '已退款', icon: <DollarOutlined /> },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      color: 'default', 
      text: status, 
      icon: null 
    };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 支付方式图标
  const getPaymentMethodIcon = (method: string) => {
    const methodConfig = {
      alipay: { icon: <BankOutlined />, color: '#1677ff' },
      wechat: { icon: <CreditCardOutlined />, color: '#52c41a' },
      bank: { icon: <BankOutlined />, color: '#722ed1' },
    };
    const config = methodConfig[method as keyof typeof methodConfig] || { 
      icon: <CreditCardOutlined />, 
      color: '#666' 
    };
    return <span style={{ color: config.color }}>{config.icon}</span>;
  };

  // 操作菜单
  const getActionMenu = (record: PaymentRecord): MenuProps => ({
    items: [
      {
        key: 'view',
        label: '查看详情',
        icon: <EyeOutlined />,
        onClick: () => handleViewDetail(record),
      },
      {
        key: 'sync',
        label: '同步状态',
        icon: <SyncOutlined />,
        onClick: () => handleSync(record),
        disabled: record.status === 'success' || record.status === 'refunded',
      },
    ],
  });

  // 表格列定义
  const columns = [
    {
      title: '交易ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      width: 200,
      render: (text: string) => (
        <span className="transaction-id">{text}</span>
      ),
    },
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
      title: '交易金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <div className="amount-info">
          <div className="amount">¥{amount.toFixed(2)}</div>
          <div className="currency">CNY</div>
        </div>
      ),
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 120,
      render: (method: string) => (
        <div className="payment-method">
          {getPaymentMethodIcon(method)}
          <span style={{ marginLeft: 8 }}>
            {method === 'alipay' ? '支付宝' : 
             method === 'wechat' ? '微信支付' : 
             method === 'bank' ? '银行卡' : method}
          </span>
        </div>
      ),
    },
    {
      title: '交易状态',
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
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
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
      render: (_: any, record: PaymentRecord) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (!paymentsData?.records) return {};
    
    const transactions = paymentsData.records;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const successCount = transactions.filter(t => t.status === 'success').length;
    const failedCount = transactions.filter(t => t.status === 'failed').length;
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    
    return {
      totalAmount,
      successCount,
      failedCount,
      pendingCount,
      successRate: transactions.length > 0 ? (successCount / transactions.length * 100) : 0,
    };
  }, [paymentsData]);

  return (
    <div className="payments-page">
      <PageHeader
        title="支付记录"
        subtitle="管理所有支付交易记录，包括支付状态同步、对账等功能"
        breadcrumb={[{ title: '支付记录' }]}
        extra={
          <Space>
            <CyberButton icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </CyberButton>
            <CyberButton icon={<SyncOutlined />} onClick={handleBatchSync}>
              批量同步
            </CyberButton>
            <CyberButton icon={<FileTextOutlined />} onClick={handleReconciliation}>
              对账报表
            </CyberButton>
          </Space>
        }
      />

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="交易总额"
            value={stats.totalAmount || 0}
            prefix="¥"
            decimals={2}
            color="var(--success-color)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="成功交易"
            value={stats.successCount || 0}
            color="var(--success-color)"
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="失败交易"
            value={stats.failedCount || 0}
            color="var(--danger-color)"
            prefix={<CloseCircleOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="成功率"
            value={stats.successRate || 0}
            suffix="%"
            decimals={1}
            color="var(--primary-color)"
            prefix={<CreditCardOutlined />}
          />
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <GlassCard style={{ marginBottom: 24 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const values: any = {};
            formData.forEach((value, key) => {
              values[key] = value;
            });
            handleSearch(values);
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Input
                name="keyword"
                placeholder="搜索交易ID、订单号、用户"
                prefix={<SearchOutlined />}
              />
            </Col>
            
            <Col xs={24} sm={12} lg={4}>
              <Select placeholder="交易状态" allowClear style={{ width: '100%' }}>
                <Select.Option value="pending">处理中</Select.Option>
                <Select.Option value="completed">成功</Select.Option>
                <Select.Option value="failed">失败</Select.Option>
                <Select.Option value="refunded">已退款</Select.Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} lg={4}>
              <Select placeholder="支付方式" allowClear style={{ width: '100%' }}>
                <Select.Option value="alipay">支付宝</Select.Option>
                <Select.Option value="wechat">微信支付</Select.Option>
                <Select.Option value="bank">银行卡</Select.Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <RangePicker name="date_range" style={{ width: '100%' }} />
            </Col>

            <Col xs={24} sm={12} lg={4}>
              <Space>
                <Button type="primary" htmlType="submit">
                  搜索
                </Button>
                <Button onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </form>
      </GlassCard>

      {/* 支付记录列表 */}
      <GlassCard>
        <DataGrid
          columns={columns}
          dataSource={paymentsData?.records || []}
          loading={paymentsLoading}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.per_page,
            total: paymentsData?.total || 0,
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

      {/* 交易详情模态框 */}
      <Modal
        title="交易详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTransaction && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="交易ID" span={2}>
              {selectedTransaction.transaction_id}
            </Descriptions.Item>
            <Descriptions.Item label="订单号">
              {selectedTransaction.order?.order_number || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="用户名">
              {selectedTransaction.order?.user?.username || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="用户邮箱">
              {selectedTransaction.order?.user?.email || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="交易金额">
              ¥{selectedTransaction.amount.toFixed(2)} CNY
            </Descriptions.Item>
            <Descriptions.Item label="支付方式">
              <div className="payment-method">
                {getPaymentMethodIcon(selectedTransaction.payment_method)}
                <span style={{ marginLeft: 8 }}>
                  {selectedTransaction.payment_method === 'alipay' ? '支付宝' : 
                   selectedTransaction.payment_method === 'wechat' ? '微信支付' : 
                   selectedTransaction.payment_method === 'bank_card' ? '银行卡' : 
                   selectedTransaction.payment_method}
                </span>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="交易状态">
              {getStatusTag(selectedTransaction.status)}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedTransaction.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="完成时间">
              {selectedTransaction.updated_at
                ? dayjs(selectedTransaction.updated_at).format('YYYY-MM-DD HH:mm:ss')
                : '-'
              }
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {selectedTransaction.notes || '无'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 对账报表模态框 */}
      <Modal
        title="生成对账报表"
        open={reconciliationModalVisible}
        onCancel={() => {
          setReconciliationModalVisible(false);
          setReconciliationData(null);
          reconciliationForm.resetFields();
        }}
        footer={
          reconciliationData ? [
            <Button key="close" onClick={() => {
              setReconciliationModalVisible(false);
              setReconciliationData(null);
            }}>
              关闭
            </Button>,
            <Button
              key="export"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportReconciliation}
            >
              导出Excel
            </Button>,
          ] : [
            <Button key="cancel" onClick={() => setReconciliationModalVisible(false)}>
              取消
            </Button>,
            <Button
              key="generate"
              type="primary"
              loading={reconciliationMutation.isPending}
              onClick={handleReconciliationSubmit}
            >
              生成报表
            </Button>,
          ]
        }
        width={900}
      >
        {!reconciliationData ? (
          <>
            <Alert
              message="对账报表说明"
              description="系统将生成指定时间范围内的支付对账报表，包含交易汇总、支付方式分布、每日明细等信息。"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Form
              form={reconciliationForm}
              layout="vertical"
              initialValues={{
                date_range: [dayjs().subtract(7, 'day'), dayjs()],
                payment_method: 'all',
              }}
            >
              <Form.Item
                name="date_range"
                label="对账时间范围"
                rules={[{ required: true, message: '请选择时间范围' }]}
              >
                <RangePicker 
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>

              <Form.Item
                name="payment_method"
                label="支付方式筛选"
              >
                <Select>
                  <Select.Option value="all">全部支付方式</Select.Option>
                  <Select.Option value="alipay">支付宝</Select.Option>
                  <Select.Option value="wechat">微信支付</Select.Option>
                  <Select.Option value="bank">银行卡</Select.Option>
                </Select>
              </Form.Item>
            </Form>
          </>
        ) : (
          <>
            {/* 对账数据展示 */}
            <Alert
              message="对账报表生成成功"
              description={`时间范围: ${reconciliationData.date_range.start_date} 至 ${reconciliationData.date_range.end_date}`}
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />

            {/* 汇总统计 */}
            <Card title="汇总统计" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="总交易数"
                    value={reconciliationData.summary.total_transactions}
                    suffix="笔"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="总金额"
                    value={reconciliationData.summary.total_amount}
                    prefix="¥"
                    precision={2}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="成功交易"
                    value={reconciliationData.summary.success_transactions}
                    valueStyle={{ color: '#3f8600' }}
                    suffix="笔"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="成功金额"
                    value={reconciliationData.summary.success_amount}
                    valueStyle={{ color: '#3f8600' }}
                    prefix="¥"
                    precision={2}
                  />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={6}>
                  <Statistic
                    title="失败交易"
                    value={reconciliationData.summary.failed_transactions}
                    valueStyle={{ color: '#cf1322' }}
                    suffix="笔"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="失败金额"
                    value={reconciliationData.summary.failed_amount}
                    valueStyle={{ color: '#cf1322' }}
                    prefix="¥"
                    precision={2}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="退款交易"
                    value={reconciliationData.summary.refund_transactions}
                    valueStyle={{ color: '#722ed1' }}
                    suffix="笔"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="退款金额"
                    value={reconciliationData.summary.refund_amount}
                    valueStyle={{ color: '#722ed1' }}
                    prefix="¥"
                    precision={2}
                  />
                </Col>
              </Row>
            </Card>

            {/* 支付方式分布 */}
            {reconciliationData.method_breakdown.length > 0 && (
              <Card title="支付方式分布" size="small" style={{ marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>支付方式</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>交易数</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>金额</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>成功率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliationData.method_breakdown.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '8px' }}>
                          {item.method === 'alipay' ? '支付宝' : item.method === 'wechat' ? '微信支付' : item.method}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{item.transactions}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>¥{item.amount.toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <Progress
                            percent={item.success_rate}
                            size="small"
                            format={percent => `${percent?.toFixed(1) || 0}%`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {/* 每日明细 */}
            {reconciliationData.daily_breakdown.length > 0 && (
              <Card title="每日明细" size="small">
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#fafafa' }}>
                      <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>日期</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>交易数</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>金额</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>成功</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>失败</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliationData.daily_breakdown.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px' }}>{item.date}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>{item.transactions}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>¥{item.amount.toFixed(2)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#3f8600' }}>
                            {item.success_count} (¥{item.success_amount.toFixed(2)})
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#cf1322' }}>
                            {item.failed_count} (¥{item.failed_amount.toFixed(2)})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </Modal>

      {/* 批量同步模态框 */}
      <Modal
        title="批量同步支付状态"
        open={batchSyncModalVisible}
        onCancel={() => {
          setBatchSyncModalVisible(false);
          batchSyncForm.resetFields();
        }}
        onOk={handleBatchSyncSubmit}
        okText="开始同步"
        cancelText="取消"
        okButtonProps={{ loading: batchSyncMutation.isPending }}
        width={600}
      >
        <Alert
          message="批量同步说明"
          description="系统将调用支付宝接口批量查询交易状态并更新本地记录。如支付宝接口未配置，将无法同步。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Form
          form={batchSyncForm}
          layout="vertical"
          initialValues={{
            date_range: [dayjs().subtract(7, 'day'), dayjs()],
            payment_method: 'alipay',
            status: 'pending',
          }}
        >
          <Form.Item
            name="date_range"
            label="同步时间范围"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <RangePicker 
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            name="payment_method"
            label="支付方式"
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Select>
              <Select.Option value="alipay">支付宝</Select.Option>
              <Select.Option value="wechat">微信支付</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="交易状态筛选"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="pending">待支付</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
            </Select>
          </Form.Item>
        </Form>

        <Alert
          message="注意事项"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>批量同步将调用支付宝查询接口</li>
              <li>仅同步指定时间范围和状态的交易</li>
              <li>同步完成后会显示详细结果</li>
              <li>如未配置支付宝接口，将提示无法同步</li>
            </ul>
          }
          type="warning"
          showIcon
        />
      </Modal>
    </div>
  );
};

export default Payments;