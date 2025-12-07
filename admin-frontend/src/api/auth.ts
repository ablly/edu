/**
 * 认证相关API
 */

import { post } from '../utils/request';
import type { LoginCredentials, Admin } from '../types';

/**
 * 管理员登录
 */
export const login = (credentials: LoginCredentials) => {
  return post<{ token: string; admin: Admin }>('/auth/login', credentials);
};

/**
 * 检查登录状态
 */
export const checkAuth = () => {
  return post<Admin>('/auth/check');
};

/**
 * 管理员登出
 */
export const logout = () => {
  return post('/auth/logout');
};

/**
 * 修改密码
 */
export const changePassword = (data: { old_password: string; new_password: string }) => {
  return post('/auth/change-password', data);
};


