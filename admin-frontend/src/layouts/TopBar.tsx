/**
 * 顶部导航栏组件
 * 包含：Logo、系统名称、全局搜索、系统状态、通知、用户菜单
 */

import React, { useState } from 'react';
import { Input, Avatar, Dropdown, Tooltip, Space } from 'antd';
// import { Badge } from 'antd'; // 暂时注释掉未使用的导入
import {
  SearchOutlined,
  // BellOutlined, // 暂时注释掉未使用的导入
  FullscreenOutlined,
  FullscreenExitOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/useAuthStore';
// import { useGlobalStore } from '../stores/useGlobalStore'; // 暂时注释掉未使用的导入
import NotificationCenter from '../components/NotificationCenter';
import type { MenuProps } from 'antd';
import './TopBar.css';

const TopBar: React.FC = () => {
  const { admin, logout } = useAuthStore();
  // const { unreadCount } = useGlobalStore(); // 暂时注释掉未使用的变量
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // 切换全屏
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 用户菜单项
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: '修改密码',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: logout,
    },
  ];

  // 处理搜索
  const handleSearch = (value: string) => {
    console.log('搜索:', value);
    // TODO: 实现全局搜索
  };

  return (
    <div className="topbar">
      {/* 左侧：Logo + 系统名称 */}
      <div className="topbar-left">
        <div className="logo-section">
          <div className="logo-icon">
            <span className="logo-text">EP</span>
          </div>
          <h1 className="sci-fi-title system-name">EDUPILOT CONTROL SYSTEM</h1>
          <span className="version-tag">v2.0</span>
        </div>
      </div>

      {/* 中间：全局搜索 */}
      <div className="topbar-center">
        <Input.Search
          placeholder="搜索用户、订单、ID..."
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          className="global-search"
          size="large"
          allowClear
        />
        <div className="search-hint">
          <kbd>Ctrl</kbd> + <kbd>K</kbd>
        </div>
      </div>

      {/* 右侧：系统状态 + 通知 + 用户 */}
      <div className="topbar-right">
        {/* 系统状态 */}
        <Tooltip
          title={
            <div>
              <div>数据库响应: 15ms</div>
              <div>CPU: 23%</div>
              <div>内存: 2.1GB</div>
            </div>
          }
        >
          <div className="system-status">
            <span className="status-dot status-online"></span>
            <span className="status-text">系统正常</span>
          </div>
        </Tooltip>

        {/* 通知中心 */}
        <NotificationCenter />

        {/* 全屏切换 */}
        <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
          {isFullscreen ? (
            <FullscreenExitOutlined className="action-icon" onClick={toggleFullscreen} />
          ) : (
            <FullscreenOutlined className="action-icon" onClick={toggleFullscreen} />
          )}
        </Tooltip>

        {/* 用户菜单 */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div className="user-profile">
            <Avatar
              src={admin?.avatar}
              icon={<UserOutlined />}
              className="user-avatar"
            />
            <Space direction="vertical" size={0} className="user-info">
              <span className="username">{admin?.username || '管理员'}</span>
              <span className="user-role">{admin?.role || 'Admin'}</span>
            </Space>
          </div>
        </Dropdown>
      </div>

      {/* 扫描线动画 */}
      <div className="scan-line scan-line-animation"></div>
    </div>
  );
};

export default TopBar;


