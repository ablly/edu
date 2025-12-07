/**
 * 全局状态管理
 * 管理侧边栏、主题、通知等全局状态
 */

import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface GlobalState {
  // 侧边栏状态
  sidebarCollapsed: boolean;
  
  // 主题
  theme: 'dark' | 'light';
  
  // 通知列表
  notifications: Notification[];
  
  // 未读通知数
  unreadCount: number;
  
  // 切换侧边栏
  toggleSidebar: () => void;
  
  // 设置侧边栏状态
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // 设置主题
  setTheme: (theme: 'dark' | 'light') => void;
  
  // 添加通知
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  
  // 标记通知为已读
  markAsRead: (id: string) => void;
  
  // 全部标记为已读
  markAllAsRead: () => void;
  
  // 删除通知
  removeNotification: (id: string) => void;
  
  // 清空所有通知
  clearNotifications: () => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  sidebarCollapsed: false,
  theme: 'dark',
  notifications: [],
  unreadCount: 0,

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  setTheme: (theme: 'dark' | 'light') => {
    set({ theme });
    // 可以在这里添加主题切换的逻辑
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      read: false,
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.read) {
        return state;
      }
      
      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.read;
      
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));

