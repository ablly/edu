/**
 * 基础布局组件
 * 组合TopBar + Sidebar + 主内容区域
 */

import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
// import { useAuthStore } from '../stores/useAuthStore';
import { useGlobalStore } from '../stores/useGlobalStore';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import './BasicLayout.css';

const BasicLayout: React.FC = () => {
  const navigate = useNavigate();
  // const { isLoggedIn, checkAuth, isLoading } = useAuthStore();
  const { sidebarCollapsed } = useGlobalStore();

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // 简化认证检查，避免复杂的API调用
    // 在生产环境中，这里应该调用真实的API验证token
    // checkAuth().catch(() => {
    //   navigate('/login');
    // });
  }, [navigate]);

  // 简化认证逻辑：只要有token就认为已登录
  const token = localStorage.getItem('admin_token');
  if (!token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="basic-layout">
      {/* 顶部导航栏 */}
      <TopBar />

      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* 星空背景 */}
        <div className="stars-background">
          {[...Array(50)].map((_, i) => (
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

        {/* 页面内容 */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default BasicLayout;

