/**
 * 侧边栏菜单组件
 * 包含：菜单导航、收起/展开功能
 */

import React from 'react';
import { Menu, Badge } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  CrownOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  HistoryOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useGlobalStore } from '../stores/useGlobalStore';
import type { MenuProps } from 'antd';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useGlobalStore();

  // 菜单项配置（根据规划文档的5个核心模块）
  const menuItems: MenuProps['items'] = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '数据总览',
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
      // badge: { count: 1234, color: '#00D4FF' },
    },
    {
      key: '/admin/memberships',
      icon: <CrownOutlined />,
      label: '会员管理',
      // badge: { count: 456, color: '#B15BFF' },
    },
    {
      key: '/admin/orders',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
      // badge: { count: 12, color: '#FF3366' },
    },
    {
      key: '/admin/payments',
      icon: <DollarOutlined />,
      label: '支付记录',
    },
    {
      type: 'divider',
    },
    {
      key: '/admin/logs',
      icon: <HistoryOutlined />,
      label: '操作日志',
    },
    {
      key: '/admin/admins',
      icon: <TeamOutlined />,
      label: '管理员管理',
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  // 处理菜单点击
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  // 获取当前选中的菜单项
  const selectedKey = location.pathname;

  return (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* 菜单区域 */}
      <div className="sidebar-menu-wrapper">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          inlineCollapsed={sidebarCollapsed}
          className="sidebar-menu"
          items={menuItems.map((item: any) => {
            // 如果有badge，添加到label
            if (item.badge && !sidebarCollapsed) {
              return {
                ...item,
                label: (
                  <div className="menu-item-with-badge">
                    <span>{item.label}</span>
                    <Badge
                      count={item.badge.count}
                      style={{
                        backgroundColor: item.badge.color,
                        boxShadow: `0 0 10px ${item.badge.color}80`,
                      }}
                      className="menu-badge"
                    />
                  </div>
                ),
              };
            }
            return item;
          })}
        />
      </div>

      {/* 收起/展开按钮 */}
      <div className="sidebar-toggle" onClick={toggleSidebar}>
        <div className="toggle-icon">
          {sidebarCollapsed ? '»' : '«'}
        </div>
      </div>

      {/* 扫描线动画 */}
      <div className="scan-line scan-line-animation"></div>
    </div>
  );
};

export default Sidebar;


