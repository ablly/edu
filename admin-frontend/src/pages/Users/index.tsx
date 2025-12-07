/**
 * 用户管理页面
 */

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, message, Modal, App, Form, Switch, Drawer, Tabs, Descriptions, DatePicker, Select, InputNumber, Alert, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
// import dayjs from 'dayjs'; // 暂时注释掉未使用的导入
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SearchOutlined,
  PlusOutlined, 
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  UserOutlined,
  CrownOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  HistoryOutlined,
  KeyOutlined,
  DownloadOutlined,
  UnlockOutlined,
  LockOutlined,
  ClockCircleOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { GlassCard, PageHeader, CyberButton } from '../../components';
import { getUserList, toggleUserStatus, deleteUser, updateUser, resetUserPassword, grantMembership, batchToggleUsers, batchDeleteUsers, exportUsers, createUser, unlockUser, getUserLockStatus, type User } from '../../api/users';
import { getMembershipTiers } from '../../api/memberships';
// import type { MembershipTier } from '../../api/memberships'; // 暂时注释掉未使用的导入
import type { ColumnsType } from 'antd/es/table';

// 锁定状态组件
const LockStatusCell: React.FC<{ userId: number }> = ({ userId }) => {
  const { data: lockStatus, isLoading } = useQuery({
    queryKey: ['userLockStatus', userId],
    queryFn: () => getUserLockStatus(userId),
    refetchInterval: 30000, // 每30秒刷新一次
    staleTime: 10000, // 10秒内认为数据是新鲜的
  });

  if (isLoading) {
    return <Tag color="default">检查中...</Tag>;
  }

  if (!lockStatus?.success || !lockStatus.data) {
    return <Tag color="default">未知</Tag>;
  }

  const { is_locked, locked_until, remaining_attempts, max_attempts } = lockStatus.data;

  if (is_locked && locked_until) {
    const lockedUntilTime = new Date(locked_until);
    const now = new Date();
    const remainingMinutes = Math.ceil((lockedUntilTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (remainingMinutes > 0) {
      return (
        <Tag color="error" icon={<LockOutlined />}>
          锁定 {remainingMinutes}分钟
        </Tag>
      );
    }
  }

  if (remaining_attempts < max_attempts) {
    return (
      <Tag color="warning" icon={<ClockCircleOutlined />}>
        剩余 {remaining_attempts} 次
      </Tag>
    );
  }

  return (
    <Tag color="success">
      正常
    </Tag>
  );
};

const Users: React.FC = () => {
  const { modal } = App.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  
  // 新增用户相关状态
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();
  
  // 编辑用户相关状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm] = Form.useForm();
  
  // 用户详情相关状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  
  // 重置密码相关状态
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetPasswordForm] = Form.useForm();
  
  // 开通会员相关状态
  const [grantMembershipModalVisible, setGrantMembershipModalVisible] = useState(false);
  const [grantMembershipUser, setGrantMembershipUser] = useState<User | null>(null);
  const [grantMembershipForm] = Form.useForm();
  
  // 批量操作相关状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 筛选相关状态
  const [membershipFilter, setMembershipFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  // 获取用户列表
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, pageSize, keyword, membershipFilter, statusFilter, dateRange],
    queryFn: () => getUserList({ 
      page, 
      per_page: pageSize, 
      keyword,
      membership_tier: membershipFilter || undefined,
      status: statusFilter || undefined,
      start_date: dateRange?.[0]?.format('YYYY-MM-DD') || undefined,
      end_date: dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
    }),
  });

  // 创建用户
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      message.success('用户创建成功');
      setAddModalVisible(false);
      addForm.resetFields();
      // 刷新用户列表查询
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // 重置到第一页以确保能看到新创建的用户
      setPage(1);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '创建失败');
    },
  });

  // 获取会员套餐列表
  const { data: membershipTiers = [], refetch: refetchMembershipTiers } = useQuery({
    queryKey: ['membershipTiers'],
    queryFn: getMembershipTiers,
    staleTime: 0, // 立即过期，确保每次都获取最新数据
    refetchOnMount: true, // 组件挂载时重新获取
    refetchOnWindowFocus: true, // 窗口聚焦时重新获取
  });

  // 切换用户状态
  const toggleMutation = useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: () => {
      message.success('操作成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('操作失败');
    },
  });

  // 删除用户
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('删除失败');
    },
  });

  // 编辑用户
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateUser(id, data),
    onSuccess: () => {
      message.success('用户信息更新成功');
      setEditModalVisible(false);
      setEditingUser(null);
      editForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('更新失败');
    },
  });

  // 重置密码
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { new_password: string; confirm_password: string } }) => resetUserPassword(id, data),
    onSuccess: () => {
      message.success('密码重置成功');
      setResetPasswordModalVisible(false);
      setResetPasswordUser(null);
      resetPasswordForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '密码重置失败');
    },
  });

  // 开通会员
  const grantMembershipMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => grantMembership(id, data),
    onSuccess: () => {
      message.success('会员开通成功');
      setGrantMembershipModalVisible(false);
      setGrantMembershipUser(null);
      grantMembershipForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('会员开通失败');
    },
  });

  // 解锁账户
  const unlockMutation = useMutation({
    mutationFn: unlockUser,
    onSuccess: () => {
      message.success('账户解锁成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userLockStatus'] }); // 刷新锁定状态
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '解锁失败');
    },
  });

  // 批量切换状态
  const batchToggleMutation = useMutation({
    mutationFn: ({ userIds, is_active }: { userIds: number[], is_active: boolean }) => batchToggleUsers(userIds, is_active),
    onSuccess: () => {
      message.success('批量操作成功');
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('批量操作失败');
    },
  });

  // 批量删除
  const batchDeleteMutation = useMutation({
    mutationFn: batchDeleteUsers,
    onSuccess: () => {
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('批量删除失败');
    },
  });

  // 处理新增用户
  const handleAddUser = () => {
    setAddModalVisible(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      createMutation.mutate(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleAddCancel = () => {
    setAddModalVisible(false);
    addForm.resetFields();
  };

  // 处理状态切换
  const handleToggleStatus = (user: User) => {
    console.log('🖱️ 禁用/启用按钮被点击，用户:', user);
    
    modal.confirm({
      title: `确认${user.is_active ? '禁用' : '启用'}用户？`,
      icon: <ExclamationCircleOutlined />,
      content: `用户：${user.username} (${user.email})`,
      okText: user.is_active ? '确认禁用' : '确认启用',
      okType: user.is_active ? 'danger' : 'primary',
      cancelText: '取消',
      onOk: () => {
        console.log('✅ 用户确认操作，开始调用API');
        toggleMutation.mutate(user.id);
      },
      onCancel: () => {
        console.log('❌ 用户取消操作');
      },
    });
  };

  // 处理删除
  const handleDelete = (user: User) => {
    console.log('🖱️ 删除按钮被点击，用户:', user);
    
    modal.confirm({
      title: '⚠️ 确认删除用户？',
      icon: <ExclamationCircleOutlined />,
        content: (
          <div>
          <p><strong>用户：</strong>{user.username} ({user.email})</p>
          <p style={{ color: '#FF3366', marginTop: 8 }}>
            ⚠️ 此操作不可恢复！将删除用户信息、会员记录、订单、使用日志
            </p>
          </div>
        ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        console.log('✅ 用户确认删除，开始调用API');
        deleteMutation.mutate(user.id);
      },
      onCancel: () => {
        console.log('❌ 用户取消删除');
    },
  });
  };

  // 搜索处理
  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  // 重置筛选条件
  const handleResetFilters = () => {
    setKeyword('');
    setMembershipFilter('');
    setStatusFilter('');
    setDateRange(null);
    setPage(1);
  };

  // 处理编辑用户
  const handleEdit = (user: User) => {
    console.log('🖱️ 编辑按钮被点击，用户:', user);
    setEditingUser(user);
    setEditModalVisible(true);
    
    // 填充表单数据
    editForm.setFieldsValue({
      username: user.username,
      email: user.email,
      is_active: user.is_active,
    });
  };

  // 提交编辑表单
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      if (editingUser) {
        updateMutation.mutate({
          id: editingUser.id,
          data: values,
        });
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 取消编辑
  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingUser(null);
    editForm.resetFields();
  };

  // 查看用户详情
  const handleViewDetail = (user: User) => {
    console.log('🖱️ 查看详情按钮被点击，用户:', user);
    setDetailUser(user);
    setDetailDrawerVisible(true);
  };

  // 关闭详情抽屉
  const handleDetailClose = () => {
    setDetailDrawerVisible(false);
    setDetailUser(null);
  };

  // 重置密码
  const handleResetPassword = (user: User) => {
    console.log('🖱️ 重置密码按钮被点击，用户:', user);
    setResetPasswordUser(user);
    setResetPasswordModalVisible(true);
    resetPasswordForm.resetFields();
  };

  // 解锁账户
  const handleUnlockUser = (user: User) => {
    modal.confirm({
      title: '确认解锁账户',
      content: `确定要解锁用户 "${user.username}" 的账户吗？`,
      icon: <ExclamationCircleOutlined />,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        unlockMutation.mutate(user.id);
      },
    });
  };

  // 提交重置密码
  const handleResetPasswordSubmit = async () => {
    try {
      const values = await resetPasswordForm.validateFields();
      if (resetPasswordUser) {
        resetPasswordMutation.mutate({
          id: resetPasswordUser.id,
          data: {
            new_password: values.new_password,
            confirm_password: values.confirm_password,
          },
        });
      }
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请完整填写表单');
    }
  };

  // 取消重置密码
  const handleResetPasswordCancel = () => {
    setResetPasswordModalVisible(false);
    setResetPasswordUser(null);
    resetPasswordForm.resetFields();
  };

  // 生成随机密码
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    resetPasswordForm.setFieldsValue({
      new_password: password,
      confirm_password: password,
    });
  };

  // 开通会员
  const handleGrantMembership = async (user: User) => {
    console.log('🖱️ 开通会员按钮被点击，用户:', user);
    setGrantMembershipUser(user);
    setGrantMembershipModalVisible(true);
    
    // 🔄 强制刷新会员套餐列表，确保显示最新的套餐
    console.log('🔄 刷新会员套餐列表...');
    await refetchMembershipTiers();
    
    // 设置默认值
    const firstTier = membershipTiers.find(t => t.is_active);
    grantMembershipForm.setFieldsValue({
      tier_id: firstTier?.id || undefined,
      duration_days: firstTier?.duration_days || 30,
      notes: '',
    });
  };

  // 提交开通会员
  const handleGrantMembershipSubmit = async () => {
    try {
      const values = await grantMembershipForm.validateFields();
      if (grantMembershipUser) {
        // 准备提交数据
        const submitData = {
          tier_id: values.tier_id,
          duration_days: values.duration_days || 30,
          note: values.notes || '',
        };
        
        console.log('📤 提交开通会员数据:', submitData);
        
        grantMembershipMutation.mutate({
          id: grantMembershipUser.id,
          data: submitData,
        });
      }
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请完整填写表单');
    }
  };

  // 取消开通会员
  const handleGrantMembershipCancel = () => {
    setGrantMembershipModalVisible(false);
    setGrantMembershipUser(null);
    grantMembershipForm.resetFields();
  };


  // 批量切换状态
  const handleBatchToggle = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择用户');
      return;
    }
    
    modal.confirm({
      title: '确认批量切换用户状态？',
      icon: <ExclamationCircleOutlined />,
      content: `已选择 ${selectedRowKeys.length} 个用户`,
      okText: '确认操作',
      cancelText: '取消',
      onOk: () => {
        const selectedUsers = data?.users?.filter(user => selectedRowKeys.includes(user.id)) || [];
        const isAllActive = selectedUsers.every(user => user.is_active);
        batchToggleMutation.mutate({ userIds: selectedRowKeys as number[], is_active: !isAllActive });
      },
    });
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择用户');
      return;
    }
    
    modal.confirm({
      title: '⚠️ 确认批量删除用户？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p><strong>已选择 {selectedRowKeys.length} 个用户</strong></p>
          <p style={{ color: '#FF3366', marginTop: 8 }}>
            ⚠️ 此操作不可恢复！将删除所有选中用户的信息、会员记录、订单、使用日志
          </p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        batchDeleteMutation.mutate(selectedRowKeys as number[]);
      },
    });
  };

  // 取消选择
  const handleCancelSelection = () => {
    setSelectedRowKeys([]);
  };

  // 导出用户数据
  const handleExportUsers = async () => {
    try {
      message.loading('正在导出用户数据...', 0);
      
      // 构建导出参数
      const exportParams = {
        keyword,
        membership_tier: membershipFilter || undefined,
        status: statusFilter || undefined,
        start_date: dateRange?.[0]?.format('YYYY-MM-DD') || undefined,
        end_date: dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
      };
      
      const response = await exportUsers(exportParams);
      
      // 创建下载链接
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `用户数据_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.destroy();
      message.success('用户数据导出成功');
    } catch (error: any) {
      message.destroy();
      const errorMsg = error?.response?.data?.message || '导出失败，请重试';
      message.error(errorMsg);
      console.error('导出用户数据失败:', error);
    }
  };

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '会员等级',
      dataIndex: 'membership_tier',
      key: 'membership_tier',
      width: 120,
      render: (text: string, record: User) => {
        if (record.is_member && text) {
          return <Tag color="blue">{text}</Tag>;
        }
        return <Tag>免费版</Tag>;
      },
    },
    {
      title: '会员到期',
      dataIndex: 'membership_expires',
      key: 'membership_expires',
      width: 180,
      render: (text: string) => {
        if (!text) return '-';
        const date = new Date(text);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '登录状态',
      key: 'lock_status',
      width: 120,
      render: (_, record: User) => <LockStatusCell userId={record.id} />,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => {
        if (!text) return '-';
        const date = new Date(text);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      },
    },
    {
      title: '最后登录',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      width: 180,
      render: (text: string) => {
        if (!text) return '从未登录';
        const date = new Date(text);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_: any, record: User) => {
        const moreMenuItems: MenuProps['items'] = [
          {
            key: 'resetPassword',
                  label: '重置密码',
            icon: <KeyOutlined />,
                  onClick: () => handleResetPassword(record),
                },
                {
            key: 'grantMembership',
            label: '开通会员',
            icon: <CrownOutlined />,
                  onClick: () => handleGrantMembership(record),
                },
          {
            key: 'unlock',
            label: '解锁账户',
            icon: <UnlockOutlined />,
            onClick: () => handleUnlockUser(record),
          },
                {
                  type: 'divider',
                },
                {
                  key: 'delete',
            label: '删除用户',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDelete(record),
                },
        ];

        return (
          <Space>
            <Button 
              type="link" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              详情
            </Button>
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
            <Button 
              type="link" 
              size="small" 
              icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
            >
              {record.is_active ? '禁用' : '启用'}
            </Button>
            <Dropdown 
              menu={{ items: moreMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button 
                type="link" 
                size="small" 
                icon={<MoreOutlined />}
              >
              更多
            </Button>
          </Dropdown>
        </Space>
        );
      },
    },
  ];

  return (
    <div className="users-page">
      <PageHeader
        title="用户管理"
        subtitle="管理系统所有用户"
        breadcrumb={[{ title: '首页', path: '/admin/dashboard' }, { title: '用户管理' }]}
        extra={
            <Space>
            <Button 
              icon={<DownloadOutlined />}
              onClick={handleExportUsers}
            >
              导出数据
            </Button>
            <CyberButton type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
              新增用户
            </CyberButton>
          </Space>
        }
      />

      <GlassCard>
        {/* 搜索和筛选区域 */}
        <div style={{ marginBottom: 16 }}>
          <Space wrap style={{ marginBottom: 12 }}>
              <Input.Search
              placeholder="搜索用户名、邮箱..."
                prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
                onSearch={handleSearch}
              allowClear
              />
              <Select
              placeholder="会员等级"
              style={{ width: 150 }}
              value={membershipFilter}
              onChange={(value) => {
                setMembershipFilter(value);
                setPage(1);
              }}
              allowClear
            >
              <Select.Option value="">全部</Select.Option>
              <Select.Option value="早鸟一档">早鸟一档</Select.Option>
              <Select.Option value="早鸟二档">早鸟二档</Select.Option>
              <Select.Option value="早鸟三档">早鸟三档</Select.Option>
              <Select.Option value="月卡">月卡</Select.Option>
              <Select.Option value="年卡">年卡</Select.Option>
            </Select>
            <Select
              placeholder="用户状态"
                style={{ width: 120 }}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
                allowClear
            >
              <Select.Option value="">全部</Select.Option>
              <Select.Option value="active">正常</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
            <DatePicker.RangePicker
              placeholder={['注册开始日期', '注册结束日期']}
              style={{ width: 240 }}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates);
                setPage(1);
              }}
            />
            <Button onClick={handleResetFilters}>
              重置筛选
            </Button>
            </Space>
        </div>
        {/* 批量操作工具栏 */}
        {selectedRowKeys.length > 0 && (
          <Alert
            message={
            <Space>
                <span>已选择 {selectedRowKeys.length} 项</span>
                <Button 
                  size="small" 
                  onClick={handleBatchToggle}
                  loading={batchToggleMutation.isPending}
                >
                  批量切换状态
              </Button>
                <Button 
                  size="small" 
                  danger 
                  onClick={handleBatchDelete}
                  loading={batchDeleteMutation.isPending}
                >
                  批量删除
                </Button>
                <Button 
                  size="small" 
                  type="link" 
                  onClick={handleCancelSelection}
                >
                  取消选择
              </Button>
            </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          dataSource={data?.users || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          rowSelection={{
            selectedRowKeys,
            onChange: (newSelectedRowKeys) => {
              setSelectedRowKeys(newSelectedRowKeys);
            },
            getCheckboxProps: () => ({
              disabled: false, // 可以根据需要禁用某些行的选择
            }),
          }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              if (newPageSize !== pageSize) {
                setPageSize(newPageSize);
                setPage(1);
              }
            },
          }}
        />
      </GlassCard>

      {/* 新增用户模态框 */}
      <Modal
        title="新增用户"
        open={addModalVisible}
        onOk={handleAddSubmit}
        onCancel={handleAddCancel}
        confirmLoading={createMutation.isPending}
        width={600}
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={addForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' }
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="full_name"
          >
            <Input placeholder="请输入真实姓名（可选）" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号（可选）" />
          </Form.Item>

          <Form.Item
            label="账户状态"
            name="is_active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch 
              checkedChildren="启用" 
              unCheckedChildren="禁用"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户信息"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleEditCancel}
        confirmLoading={updateMutation.isPending}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={editForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input disabled placeholder="用户名不可修改" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="账户状态"
            name="is_active"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="启用" 
              unCheckedChildren="禁用"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户详情抽屉 */}
      <Drawer
        title="用户详情"
        placement="right"
        onClose={handleDetailClose}
        open={detailDrawerVisible}
        width={720}
      >
        {detailUser && (
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: (
                  <span>
                    <UserOutlined />
                    基本信息
                  </span>
                ),
                children: (
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="用户ID">{detailUser.id}</Descriptions.Item>
                    <Descriptions.Item label="用户名">{detailUser.username}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{detailUser.email}</Descriptions.Item>
                    <Descriptions.Item label="账户状态">
                      <Tag color={detailUser.is_active ? 'success' : 'error'}>
                        {detailUser.is_active ? '正常' : '禁用'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="注册时间">
                      {detailUser.created_at ? new Date(detailUser.created_at).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      }) : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="最后登录">
                      {detailUser.last_login_at ? new Date(detailUser.last_login_at).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      }) : '从未登录'}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'membership',
                label: (
                  <span>
                    <CrownOutlined />
                    会员信息
                  </span>
                ),
                children: (
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="会员状态">
                      <Tag color={detailUser.is_member ? 'blue' : 'default'}>
                        {detailUser.is_member ? '会员' : '免费用户'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="会员等级">
                      {detailUser.membership_tier || '无'}
                    </Descriptions.Item>
                    <Descriptions.Item label="到期时间" span={2}>
                      {detailUser.membership_expires ? new Date(detailUser.membership_expires).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      }) : '-'}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'orders',
                label: (
                  <span>
                    <ShoppingCartOutlined />
                    订单记录
                  </span>
                ),
                children: (
                  <div>
                    <p>订单记录功能开发中...</p>
                  </div>
                ),
              },
              {
                key: 'usage',
                label: (
                  <span>
                    <BarChartOutlined />
                    使用统计
                  </span>
                ),
                children: (
                  <div>
                    <p>使用统计功能开发中...</p>
                  </div>
                ),
              },
              {
                key: 'logs',
                label: (
                  <span>
                    <HistoryOutlined />
                    活动日志
                  </span>
                ),
                children: (
                  <div>
                    <p>活动日志功能开发中...</p>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {/* 重置密码模态框 */}
      <Modal
        title="重置用户密码"
        open={resetPasswordModalVisible}
        onOk={handleResetPasswordSubmit}
        onCancel={handleResetPasswordCancel}
        confirmLoading={resetPasswordMutation.isPending}
        width={500}
        okText="确认重置"
        cancelText="取消"
      >
        {resetPasswordUser && (
          <div>
            <p style={{ marginBottom: 16 }}>
              <strong>用户：</strong>{resetPasswordUser.username} ({resetPasswordUser.email})
            </p>
            <Form
              form={resetPasswordForm}
              layout="vertical"
            >
              <Form.Item
                label="新密码"
                name="new_password"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6位' },
                  { max: 20, message: '密码最多20位' }
                ]}
              >
                <Input.Password 
                  placeholder="请输入新密码"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                label="确认密码"
                name="confirm_password"
                dependencies={['new_password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  placeholder="请再次输入密码"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="dashed" 
                  onClick={generateRandomPassword}
                  style={{ width: '100%' }}
                >
                  生成随机密码
                </Button>
              </Form.Item>

              <div style={{ 
                padding: '8px 12px', 
                background: '#f6f8fa', 
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                <p style={{ margin: 0 }}>密码要求：</p>
                <p style={{ margin: 0 }}>• 长度6-20位</p>
                <p style={{ margin: 0 }}>• 建议包含大小写字母、数字</p>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* 开通会员模态框 */}
      <Modal
        title="开通会员"
        open={grantMembershipModalVisible}
        onOk={handleGrantMembershipSubmit}
        onCancel={handleGrantMembershipCancel}
        confirmLoading={grantMembershipMutation.isPending}
        width={600}
        okText="确认开通"
        cancelText="取消"
        styles={{
          body: {
            backgroundColor: 'var(--bg-card)',
            padding: '24px',
          },
          header: {
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
          },
          content: {
            backgroundColor: 'var(--bg-card)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        {grantMembershipUser && (
          <div>
            <p style={{ marginBottom: 16 }}>
              <strong>用户：</strong>{grantMembershipUser.username} ({grantMembershipUser.email})
            </p>
            
            {/* 当前会员状态 */}
            <Alert
              message={
                grantMembershipUser.membership_tier 
                  ? `当前会员：${grantMembershipUser.membership_tier}，到期时间：${grantMembershipUser.membership_expires}`
                  : '当前无会员'
              }
              type={grantMembershipUser.membership_tier ? "success" : "warning"}
              showIcon
              style={{ marginBottom: 16 }}
              description={
                grantMembershipUser.membership_tier 
                  ? "选择不同套餐将替换当前会员，选择相同套餐将延长时间"
                  : "将为用户开通新的会员套餐"
              }
            />
            
            {/* 套餐数量提示 */}
            <Alert
              message={`当前共有 ${membershipTiers.filter(t => t.is_active).length} 个可用套餐`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              action={
                <Button 
                  size="small" 
                  type="link" 
                  onClick={async () => {
                    message.loading('正在刷新套餐列表...', 0.5);
                    await refetchMembershipTiers();
                    message.success('套餐列表已更新');
                  }}
                >
                  刷新套餐
                </Button>
              }
            />
            
            <Form
              form={grantMembershipForm}
              layout="vertical"
            >
              <Form.Item
                label="选择会员套餐"
                name="tier_id"
                rules={[{ required: true, message: '请选择会员套餐' }]}
              >
                <Select 
                  placeholder="请选择会员套餐"
                  onChange={(tierId) => {
                    // 当选择套餐时，自动填充对应的时长
                    const selectedTier = membershipTiers.find(t => t.id === tierId);
                    if (selectedTier) {
                      grantMembershipForm.setFieldsValue({
                        duration_days: selectedTier.duration_days
                      });
                    }
                  }}
                >
                  {membershipTiers
                    .filter(tier => tier.is_active)
                    .map(tier => (
                      <Select.Option key={tier.id} value={tier.id}>
                        {tier.name} - ¥{tier.price} ({tier.duration_days}天)
                      </Select.Option>
                    ))
                  }
                </Select>
              </Form.Item>

              <Form.Item
                label="开通时长（天）"
                name="duration_days"
                rules={[{ required: true, message: '请输入开通时长' }]}
                tooltip="会员将从当前时间开始计算，可以自定义天数"
              >
                <InputNumber 
                  min={1} 
                  max={3650} 
                  placeholder="请输入天数"
                  style={{ width: '100%' }}
                  addonAfter="天"
                />
              </Form.Item>

              <Form.Item
                label="备注"
                name="notes"
              >
                <Input.TextArea 
                  rows={3}
                  placeholder="请输入备注信息（可选）"
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Users;

