/**
 * 登录页面
 * 科幻风格的管理员登录界面
 */

import React, { useState } from 'react';
import { Form, Input, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/useAuthStore';
import CyberButton from '../../components/CyberButton';
import type { LoginCredentials } from '../../types';
import './index.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 处理登录
  const handleLogin = async (values: LoginCredentials) => {
    try {
      setLoading(true);
      await login(values);
      message.success('登录成功！');
      navigate('/admin/dashboard');
    } catch (error: any) {
      message.error(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* 星空背景 */}
      <div className="stars-background">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      {/* 登录卡片 */}
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo和标题 */}
        <div className="login-header">
          <div className="logo-wrapper">
            <div className="logo-icon pulse-glow">
              <span className="logo-text">EP</span>
            </div>
          </div>
          <h1 className="sci-fi-title login-title">EDUPILOT</h1>
          <p className="login-subtitle">ADMIN CONTROL SYSTEM</p>
        </div>

        {/* 登录表单 */}
        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
          className="login-form"
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="input-icon" />}
              placeholder="用户名"
              className="cyber-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="input-icon" />}
              placeholder="密码"
              className="cyber-input"
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox className="remember-checkbox">记住我</Checkbox>
          </Form.Item>

          <Form.Item>
            <CyberButton
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<LoginOutlined />}
              block
              size="large"
              glow
            >
              {loading ? '登录中...' : '登录系统'}
            </CyberButton>
          </Form.Item>
        </Form>

        {/* 版本信息 */}
        <div className="login-footer">
          <p>版本: 2.0.0 | © 2025 EduPilot</p>
        </div>

        {/* 扫描线 */}
        <div className="scan-line scan-line-animation"></div>
      </motion.div>

      {/* 装饰元素 */}
      <div className="login-decorations">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-line line-1"></div>
        <div className="decoration-line line-2"></div>
      </div>
    </div>
  );
};

export default Login;


