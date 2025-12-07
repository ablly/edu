/**
 * 系统设置页面
 */

import React, { useState } from 'react';
import {
  Tabs,
  Form,
  Input,
  InputNumber,
  Switch,
  // Button, // 暂时注释掉未使用的导入
  message,
  Alert,
  // Space, // 暂时注释掉未使用的导入
  Divider,
} from 'antd';
import {
  SettingOutlined,
  RobotOutlined,
  DollarOutlined,
  MailOutlined,
  SafetyOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, CyberButton, DataGrid } from '../../components';
import './index.css';

interface SettingsData {
  basic: {
    system_name: string;
    system_logo: string;
    system_description: string;
    contact_email: string;
    icp_number: string;
  };
  ai: {
    provider: string;
    api_key_configured: boolean;
    model: string;
    max_tokens: number;
    temperature: number;
  };
  payment: {
    alipay_enabled: boolean;
    alipay_app_id: string;
    wechat_enabled: boolean;
    wechat_app_id: string;
  };
  email: {
    smtp_enabled: boolean;
    smtp_server: string;
    smtp_port: number;
    smtp_username: string;
    smtp_use_tls: boolean;
  };
  security: {
    session_timeout: number;
    password_min_length: number;
    password_require_special: boolean;
    max_login_attempts: number;
    login_lockout_duration: number;
  };
}

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('basic');
  const [basicForm] = Form.useForm();
  const [aiForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [securityForm] = Form.useForm();

  // 获取设置
  const { data: settingsData } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('获取设置失败');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      
      // 初始化表单
      basicForm.setFieldsValue(result.data.basic);
      aiForm.setFieldsValue(result.data.ai);
      paymentForm.setFieldsValue(result.data.payment);
      emailForm.setFieldsValue(result.data.email);
      securityForm.setFieldsValue(result.data.security);
      
      return result.data as SettingsData;
    },
  });

  // 更新设置
  const updateMutation = useMutation({
    mutationFn: async ({ category, settings }: { category: string; settings: any }) => {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category, settings }),
      });
      
      if (!response.ok) throw new Error('更新失败');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      message.success(data.message || '设置已保存');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (error: any) => {
      message.error(error.message || '保存失败');
    },
  });

  // 保存基本设置
  const handleSaveBasic = async () => {
    try {
      const values = await basicForm.validateFields();
      updateMutation.mutate({ category: 'basic', settings: values });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 保存AI设置
  const handleSaveAI = async () => {
    try {
      const values = await aiForm.validateFields();
      updateMutation.mutate({ category: 'ai', settings: values });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 保存支付设置
  const handleSavePayment = async () => {
    try {
      const values = await paymentForm.validateFields();
      updateMutation.mutate({ category: 'payment', settings: values });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 保存邮件设置
  const handleSaveEmail = async () => {
    try {
      const values = await emailForm.validateFields();
      updateMutation.mutate({ category: 'email', settings: values });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 保存安全设置
  const handleSaveSecurity = async () => {
    try {
      const values = await securityForm.validateFields();
      updateMutation.mutate({ category: 'security', settings: values });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const tabItems = [
    {
      key: 'basic',
      label: (
        <span>
          <SettingOutlined /> 基本设置
        </span>
      ),
      children: (
        <DataGrid>
          <Alert
            message="基本设置"
            description="配置系统的基本信息，包括名称、Logo、描述等"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Form
            form={basicForm}
            layout="vertical"
            style={{ maxWidth: 800 }}
          >
            <Form.Item
              name="system_name"
              label="系统名称"
              rules={[{ required: true, message: '请输入系统名称' }]}
            >
              <Input placeholder="EduPilot教育协控系统" />
            </Form.Item>

            <Form.Item
              name="system_logo"
              label="系统Logo URL"
            >
              <Input placeholder="https://example.com/logo.png" />
            </Form.Item>

            <Form.Item
              name="system_description"
              label="系统描述"
              rules={[{ required: true, message: '请输入系统描述' }]}
            >
              <Input.TextArea rows={3} placeholder="AI驱动的智能教育管理平台" />
            </Form.Item>

            <Form.Item
              name="contact_email"
              label="联系邮箱"
              rules={[
                { required: true, message: '请输入联系邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="support@edupilot.com" />
            </Form.Item>

            <Form.Item
              name="icp_number"
              label="ICP备案号"
            >
              <Input placeholder="京ICP备XXXXXXXX号" />
            </Form.Item>

            <Form.Item>
              <CyberButton
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveBasic}
                loading={updateMutation.isPending}
              >
                保存基本设置
              </CyberButton>
            </Form.Item>
          </Form>
        </DataGrid>
      ),
    },
    {
      key: 'ai',
      label: (
        <span>
          <RobotOutlined /> AI配置
        </span>
      ),
      children: (
        <DataGrid>
          <Alert
            message="AI配置"
            description="配置DeepSeek或其他AI服务的API密钥和参数"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Form
            form={aiForm}
            layout="vertical"
            style={{ maxWidth: 800 }}
          >
            <Form.Item
              name="provider"
              label="AI服务提供商"
            >
              <Input disabled placeholder="deepseek" />
            </Form.Item>

            <Form.Item
              label="API Key状态"
            >
              {settingsData?.ai.api_key_configured ? (
                <Alert message="已配置" type="success" showIcon />
              ) : (
                <Alert message="未配置" type="warning" showIcon />
              )}
            </Form.Item>

            <Form.Item
              name="model"
              label="模型名称"
              rules={[{ required: true, message: '请输入模型名称' }]}
            >
              <Input placeholder="deepseek-chat" />
            </Form.Item>

            <Form.Item
              name="max_tokens"
              label="最大Token数"
              rules={[{ required: true, message: '请输入最大Token数' }]}
            >
              <InputNumber min={100} max={32000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="temperature"
              label="Temperature (创造性)"
              rules={[{ required: true, message: '请输入Temperature' }]}
            >
              <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
            </Form.Item>

            <Alert
              message="注意"
              description="API Key需要在环境变量或配置文件中设置，修改后需重启服务生效"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item>
              <CyberButton
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveAI}
                loading={updateMutation.isPending}
              >
                保存AI配置
              </CyberButton>
            </Form.Item>
          </Form>
        </DataGrid>
      ),
    },
    {
      key: 'payment',
      label: (
        <span>
          <DollarOutlined /> 支付配置
        </span>
      ),
      children: (
        <DataGrid>
          <Alert
            message="支付配置"
            description="配置支付宝、微信支付等第三方支付接口"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Form
            form={paymentForm}
            layout="vertical"
            style={{ maxWidth: 800 }}
          >
            <Divider orientation="left">支付宝配置</Divider>
            
            <Form.Item
              name="alipay_enabled"
              label="启用支付宝"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="alipay_app_id"
              label="支付宝App ID"
            >
              <Input placeholder="2021XXXXXXXXXXXX" />
            </Form.Item>

            <Divider orientation="left">微信支付配置</Divider>

            <Form.Item
              name="wechat_enabled"
              label="启用微信支付"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="wechat_app_id"
              label="微信App ID"
            >
              <Input placeholder="wxXXXXXXXXXXXXXXXX" />
            </Form.Item>

            <Alert
              message="注意"
              description="支付密钥等敏感信息需要在环境变量或配置文件中设置，修改后需重启服务生效"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item>
              <CyberButton
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSavePayment}
                loading={updateMutation.isPending}
              >
                保存支付配置
              </CyberButton>
            </Form.Item>
          </Form>
        </DataGrid>
      ),
    },
    {
      key: 'email',
      label: (
        <span>
          <MailOutlined /> 邮件配置
        </span>
      ),
      children: (
        <DataGrid>
          <Alert
            message="邮件配置"
            description="配置SMTP服务器用于发送系统邮件"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Form
            form={emailForm}
            layout="vertical"
            style={{ maxWidth: 800 }}
          >
            <Form.Item
              name="smtp_enabled"
              label="启用邮件服务"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="smtp_server"
              label="SMTP服务器"
              rules={[{ required: true, message: '请输入SMTP服务器' }]}
            >
              <Input placeholder="smtp.example.com" />
            </Form.Item>

            <Form.Item
              name="smtp_port"
              label="SMTP端口"
              rules={[{ required: true, message: '请输入SMTP端口' }]}
            >
              <InputNumber min={1} max={65535} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="smtp_username"
              label="SMTP用户名"
              rules={[{ required: true, message: '请输入SMTP用户名' }]}
            >
              <Input placeholder="noreply@example.com" />
            </Form.Item>

            <Form.Item
              name="smtp_use_tls"
              label="使用TLS加密"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Alert
              message="注意"
              description="SMTP密码需要在环境变量或配置文件中设置，修改后需重启服务生效"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item>
              <CyberButton
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveEmail}
                loading={updateMutation.isPending}
              >
                保存邮件配置
              </CyberButton>
            </Form.Item>
          </Form>
        </DataGrid>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SafetyOutlined /> 安全设置
        </span>
      ),
      children: (
        <DataGrid>
          <Alert
            message="安全设置"
            description="配置系统安全策略，包括会话超时、密码策略等"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Form
            form={securityForm}
            layout="vertical"
            style={{ maxWidth: 800 }}
          >
            <Form.Item
              name="session_timeout"
              label="会话超时时间（秒）"
              rules={[{ required: true, message: '请输入会话超时时间' }]}
            >
              <InputNumber min={300} max={86400} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="password_min_length"
              label="密码最小长度"
              rules={[{ required: true, message: '请输入密码最小长度' }]}
            >
              <InputNumber min={6} max={32} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="password_require_special"
              label="密码必须包含特殊字符"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="max_login_attempts"
              label="最大登录尝试次数"
              rules={[{ required: true, message: '请输入最大登录尝试次数' }]}
            >
              <InputNumber min={3} max={10} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="login_lockout_duration"
              label="登录锁定时长（秒）"
              rules={[{ required: true, message: '请输入登录锁定时长' }]}
            >
              <InputNumber min={300} max={86400} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
              <CyberButton
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveSecurity}
                loading={updateMutation.isPending}
              >
                保存安全设置
              </CyberButton>
            </Form.Item>
          </Form>
        </DataGrid>
      ),
    },
  ];

  return (
    <div className="settings-page">
      <PageHeader
        title="系统设置"
        subtitle="配置系统参数、AI服务、支付接口等"
        breadcrumb={[{ title: '系统设置' }]}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default Settings;

