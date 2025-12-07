/**
 * 管理员管理页面
 */

import React, { useState } from 'react';
import {
  Table,
  Form,
  Input,
  Select,
  Modal,
  // Button, // 暂时注释掉未使用的导入
  Space,
  message,
  Tag,
  Switch,
  Checkbox,
  Divider,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  // KeyOutlined, // 暂时注释掉未使用的导入
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, CyberButton, DataGrid } from '../../components';
import type { ColumnsType } from 'antd/es/table';

interface AdminRecord {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  permissions: string[];
}

interface Permission {
  key: string;
  name: string;
  module: string;
}

const Admins: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  
  const [searchParams, setSearchParams] = useState({
    page: 1,
    per_page: 20,
  });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminRecord | null>(null);

  // 获取管理员列表
  const { data: adminsData, isLoading } = useQuery({
    queryKey: ['admin-admins', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 0) {
          params.append(key, String(value));
        }
      });
      
      const response = await fetch(`/api/admin/admins?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('获取管理员列表失败');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result;
    },
  });

  // 获取权限列表
  const { data: permissionsData } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('获取权限列表失败');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data as Permission[];
    },
  });

  // 创建管理员
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('创建失败');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      message.success('管理员创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
    },
    onError: (error: any) => {
      message.error(error.message || '创建失败');
    },
  });

  // 更新管理员
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('更新失败');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      message.success('管理员更新成功');
      setEditModalVisible(false);
      editForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
    },
    onError: (error: any) => {
      message.error(error.message || '更新失败');
    },
  });

  // 删除管理员
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('删除失败');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      message.success('管理员删除成功');
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
    },
    onError: (error: any) => {
      message.error(error.message || '删除失败');
    },
  });

  // 处理搜索
  const handleSearch = (values: any) => {
    const params: any = { ...searchParams, page: 1 };
    
    if (values.search) params.search = values.search;
    if (values.role) params.role = values.role;
    
    setSearchParams(params);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({ page: 1, per_page: 20 });
  };

  // 创建管理员
  const handleCreate = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  // 提交创建
  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      createMutation.mutate(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 编辑管理员
  const handleEdit = (record: AdminRecord) => {
    setSelectedAdmin(record);
    editForm.setFieldsValue({
      email: record.email,
      role: record.role,
      permissions: record.permissions,
      is_active: record.is_active,
    });
    setEditModalVisible(true);
  };

  // 提交编辑
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      if (selectedAdmin) {
        updateMutation.mutate({ id: selectedAdmin.id, data: values });
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 删除管理员
  const handleDelete = (record: AdminRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除管理员 "${record.username}" 吗？此操作不可撤销。`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        deleteMutation.mutate(record.id);
      },
    });
  };

  // 角色标签
  const getRoleTag = (role: string) => {
    const roleConfig: Record<string, { color: string; text: string }> = {
      super_admin: { color: 'red', text: '超级管理员' },
      admin: { color: 'blue', text: '管理员' },
      operator: { color: 'green', text: '操作员' },
    };
    
    const config = roleConfig[role] || { color: 'default', text: role };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 权限分组
  const getPermissionsByModule = (permissions: Permission[]) => {
    const modules: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      if (!modules[permission.module]) {
        modules[permission.module] = [];
      }
      modules[permission.module].push(permission);
    });
    return modules;
  };

  // 表格列定义
  const columns: ColumnsType<AdminRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
      render: (username: string) => (
        <Space>
          <UserOutlined />
          {username}
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 120,
      render: (role: string) => getRoleTag(role),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 100,
      render: (is_active: boolean) => (
        <Tag color={is_active ? 'green' : 'red'}>
          {is_active ? '活跃' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      width: 100,
      render: (permissions: string[]) => (
        <Tag color="blue">{permissions.length}</Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      width: 180,
      render: (last_login: string) => last_login || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: AdminRecord) => (
        <Space>
          <CyberButton
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </CyberButton>
          <CyberButton
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </CyberButton>
        </Space>
      ),
    },
  ];

  return (
    <div className="admins-page">
      <PageHeader
        title="管理员管理"
        subtitle="管理系统管理员账户和权限"
        breadcrumb={[{ title: '管理员管理' }]}
        extra={
          <Space>
            <CyberButton icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-admins'] })}>
              刷新
            </CyberButton>
            <CyberButton type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              添加管理员
            </CyberButton>
          </Space>
        }
      />

      {/* 搜索表单 */}
      <DataGrid style={{ marginBottom: 24 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="search" label="搜索">
            <Input placeholder="用户名或邮箱" style={{ width: 200 }} />
          </Form.Item>

          <Form.Item name="role" label="角色">
            <Select placeholder="选择角色" style={{ width: 120 }} allowClear>
              <Select.Option value="super_admin">超级管理员</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="operator">操作员</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <CyberButton type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </CyberButton>
              <CyberButton onClick={handleReset}>
                重置
              </CyberButton>
            </Space>
          </Form.Item>
        </Form>
      </DataGrid>

      {/* 管理员列表 */}
      <DataGrid>
        <Table
          columns={columns}
          dataSource={adminsData?.data || []}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.per_page,
            total: adminsData?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setSearchParams({ ...searchParams, page, per_page: pageSize });
            },
          }}
        />
      </DataGrid>

      {/* 创建管理员模态框 */}
      <Modal
        title="添加管理员"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreateSubmit}
        okText="创建"
        cancelText="取消"
        okButtonProps={{ loading: createMutation.isPending }}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{
            role: 'admin',
            permissions: [],
          }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' },
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="operator">操作员</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="permissions"
            label="权限设置"
          >
            {permissionsData && (
              <Checkbox.Group style={{ width: '100%' }}>
                {Object.entries(getPermissionsByModule(permissionsData)).map(([module, perms]) => (
                  <div key={module}>
                    <Divider orientation="left" style={{ margin: '12px 0 8px 0' }}>
                      {module}
                    </Divider>
                    <div style={{ marginLeft: 16 }}>
                      {perms.map(perm => (
                        <Checkbox key={perm.key} value={perm.key} style={{ marginBottom: 8 }}>
                          {perm.name}
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                ))}
              </Checkbox.Group>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑管理员模态框 */}
      <Modal
        title="编辑管理员"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleEditSubmit}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ loading: updateMutation.isPending }}
        width={600}
      >
        <Alert
          message="注意"
          description="不能修改自己的角色和权限。密码留空则不修改。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            label="新密码（可选）"
            rules={[
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="留空则不修改密码" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Select.Option value="super_admin">超级管理员</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="operator">操作员</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="is_active"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="活跃" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="权限设置"
          >
            {permissionsData && (
              <Checkbox.Group style={{ width: '100%' }}>
                {Object.entries(getPermissionsByModule(permissionsData)).map(([module, perms]) => (
                  <div key={module}>
                    <Divider orientation="left" style={{ margin: '12px 0 8px 0' }}>
                      {module}
                    </Divider>
                    <div style={{ marginLeft: 16 }}>
                      {perms.map(perm => (
                        <Checkbox key={perm.key} value={perm.key} style={{ marginBottom: 8 }}>
                          {perm.name}
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                ))}
              </Checkbox.Group>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Admins;
