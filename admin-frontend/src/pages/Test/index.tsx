/**
 * 测试页面 - 用于调试白屏问题
 */

import React from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const Test: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      padding: '24px', 
      minHeight: '100vh', 
      background: 'var(--bg-primary, #0A0E1A)',
      color: 'var(--text-primary, #FFFFFF)'
    }}>
      <Card 
        style={{ 
          maxWidth: 600, 
          margin: '0 auto',
          background: 'var(--card-bg, #141824)',
          border: '1px solid var(--border-color, #2A3447)'
        }}
      >
        <Title level={2} style={{ color: 'var(--primary-color, #00D4FF)', textAlign: 'center' }}>
          🚀 EduPilot 管理后台测试页面
        </Title>
        
        <Paragraph style={{ color: 'var(--text-primary, #FFFFFF)' }}>
          如果您能看到这个页面，说明前端基础架构运行正常！
        </Paragraph>
        
        <Paragraph style={{ color: 'var(--text-secondary, #A0AEC0)' }}>
          <strong>系统状态：</strong>
          <br />
          ✅ React 应用启动成功
          <br />
          ✅ 路由系统工作正常
          <br />
          ✅ Ant Design 组件库加载成功
          <br />
          ✅ CSS 变量系统生效
        </Paragraph>
        
        <Space direction="vertical" style={{ width: '100%', marginTop: 24 }}>
          <Button 
            type="primary" 
            size="large" 
            block
            onClick={() => navigate('/login')}
          >
            前往登录页面
          </Button>
          
          <Button 
            size="large" 
            block
            onClick={() => navigate('/admin/dashboard')}
          >
            尝试访问管理后台
          </Button>
          
          <Button 
            size="large" 
            block
            onClick={() => window.location.reload()}
          >
            刷新页面
          </Button>
        </Space>
        
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: 'var(--card-bg-secondary, #1C2332)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--text-disabled, #4A5568)'
        }}>
          <strong>调试信息：</strong>
          <br />
          当前路径: {window.location.pathname}
          <br />
          本地存储Token: {localStorage.getItem('admin_token') ? '存在' : '不存在'}
          <br />
          时间戳: {new Date().toLocaleString()}
        </div>
      </Card>
    </div>
  );
};

export default Test;

