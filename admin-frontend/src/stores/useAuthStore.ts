/**
 * 认证状态管理
 * 使用Zustand管理管理员登录状态
 */

import { create } from 'zustand';
import { post } from '../utils/request';

// 本地类型定义
interface Admin {
  id: number;
  username: string;
  email: string;
  real_name?: string;
  phone?: string;
  avatar?: string;
  role: string;
  is_active: boolean;
  is_super_admin: boolean;
  permissions: string;
  created_at: string;
  last_login_at?: string;
  last_login_ip?: string;
}

interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  
  // 登录
  login: (credentials: LoginCredentials) => Promise<void>;
  
  // 登出
  logout: () => void;
  
  // 检查登录状态
  checkAuth: () => Promise<void>;
  
  // 更新管理员信息
  updateAdmin: (admin: Partial<Admin>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: null,
  token: localStorage.getItem('admin_token'),
  isLoggedIn: !!localStorage.getItem('admin_token'),
  isLoading: false,

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true });
      
      const response = await post<{ token: string; admin: Admin }>('/auth/login', credentials);
      
      const { token, admin } = response;
      
      // 保存token
      localStorage.setItem('admin_token', token);
      
      // 如果勾选记住密码，保存用户名
      if (credentials.remember) {
        localStorage.setItem('admin_username', credentials.username);
      } else {
        localStorage.removeItem('admin_username');
      }
      
      set({
        admin,
        token,
        isLoggedIn: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    // 清除token
    localStorage.removeItem('admin_token');
    
    // 清除状态
    set({
      admin: null,
      token: null,
      isLoggedIn: false,
    });
    
    // 跳转到登录页
    window.location.href = '/login';
  },

  checkAuth: async () => {
    const token = localStorage.getItem('admin_token');
    
    if (!token) {
      set({ isLoggedIn: false, admin: null, token: null, isLoading: false });
      return;
    }
    
    try {
      set({ isLoading: true });
      
      // 验证token是否有效
      const admin = await post<Admin>('/auth/check');
      
      set({
        admin,
        token,
        isLoggedIn: true,
        isLoading: false,
      });
    } catch (error) {
      // Token无效，清除登录状态
      localStorage.removeItem('admin_token');
      set({
        admin: null,
        token: null,
        isLoggedIn: false,
        isLoading: false,
      });
      throw error;
    }
  },

  updateAdmin: (adminData: Partial<Admin>) => {
    const { admin } = get();
    if (admin) {
      set({
        admin: { ...admin, ...adminData },
      });
    }
  },
}));

