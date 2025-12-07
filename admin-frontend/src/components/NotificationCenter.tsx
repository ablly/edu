/**
 * 通知中心组件
 */

import React, { useState } from 'react';
import {
  Dropdown,
  Badge,
  List,
  Typography,
  Button,
  Empty,
  message,
  Tag,
  Space,
} from 'antd';
import {
  BellOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  // CheckOutlined, // 暂时注释掉未使用的导入
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './NotificationCenter.css';

const { Text } = Typography;

interface Notification {
  id: number;
  title: string;
  content: string;
  type: 'user' | 'order' | 'system';
  is_read: boolean;
  created_at: string;
}

const NotificationCenter: React.FC = () => {
  const queryClient = useQueryClient();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // 获取通知列表
  const { data: notificationsData } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const response = await fetch('/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('获取通知失败');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result;
    },
    refetchInterval: 30000, // 30秒刷新一次
  });

  // 标记单个通知为已读
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('操作失败');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  // 标记所有通知为已读
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('操作失败');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      message.success('所有通知已标记为已读');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  // 获取通知类型图标
  const getNotificationIcon = (type: string) => {
    const iconMap = {
      user: <UserOutlined style={{ color: '#1890ff' }} />,
      order: <ShoppingCartOutlined style={{ color: '#52c41a' }} />,
      system: <SettingOutlined style={{ color: '#fa8c16' }} />,
    };
    return iconMap[type as keyof typeof iconMap] || <BellOutlined />;
  };

  // 获取通知类型标签
  const getNotificationTag = (type: string) => {
    const tagMap = {
      user: <Tag color="blue">用户</Tag>,
      order: <Tag color="green">订单</Tag>,
      system: <Tag color="orange">系统</Tag>,
    };
    return tagMap[type as keyof typeof tagMap] || <Tag>其他</Tag>;
  };

  // 处理通知点击
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
  };

  // 标记所有为已读
  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const notifications = notificationsData?.data || [];
  const unreadCount = notificationsData?.unread_count || 0;

  const dropdownContent = (
    <div className="notification-dropdown">
      <div className="notification-header">
        <Space>
          <Text strong>通知中心</Text>
          {unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              onClick={handleMarkAllRead}
              loading={markAllReadMutation.isPending}
            >
              全部已读
            </Button>
          )}
        </Space>
      </div>
      
      <div className="notification-list">
        {notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无通知"
            style={{ padding: '20px 0' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification: Notification) => (
              <List.Item
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(notification.type)}
                  title={
                    <Space>
                      <Text strong={!notification.is_read}>
                        {notification.title}
                      </Text>
                      {getNotificationTag(notification.type)}
                      {!notification.is_read && (
                        <Badge dot />
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">{notification.content}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {notification.created_at}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="notification-footer">
          <Button type="link" block>
            查看全部通知
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      open={dropdownVisible}
      onOpenChange={setDropdownVisible}
      overlayClassName="notification-dropdown-overlay"
    >
      <Badge count={unreadCount} size="small">
        <Button
          type="text"
          icon={<BellOutlined />}
          className="notification-trigger"
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationCenter;
