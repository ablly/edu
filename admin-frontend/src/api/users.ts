/**
 * 用户管理相关 API
 */

import { get, post, put, del } from '../utils/request';

// 用户类型定义
export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active: boolean;
  is_member: boolean;
  membership_tier?: string;
  membership_expires?: string;
  created_at: string;
  last_login_at?: string;
}

// 用户列表参数
export interface UserListParams {
  page?: number;
  per_page?: number;
  keyword?: string;
  status?: string;
  membership_tier?: string;
  start_date?: string;
  end_date?: string;
}

// 用户列表响应
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// 创建用户参数
export interface CreateUserParams {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
}

// 更新用户参数
export interface UpdateUserParams {
  username?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
}

// 重置密码参数
export interface ResetPasswordParams {
  new_password: string;
  confirm_password: string;
}

// 开通会员参数
export interface GrantMembershipParams {
  tier_id: number;
  duration_days: number;
  note?: string;
}

// 获取用户列表
export const getUserList = (params: UserListParams) => {
  return get<UserListResponse>('/users', params);
};

// 创建用户
export const createUser = (data: CreateUserParams) => {
  return post<{ success: boolean; message: string; user: User }>('/users', data);
};

// 更新用户
export const updateUser = (id: number, data: UpdateUserParams) => {
  return put<{ success: boolean; message: string }>(`/users/${id}`, data);
};

// 删除用户
export const deleteUser = (id: number) => {
  return del<{ success: boolean; message: string }>(`/users/${id}`);
};

// 切换用户状态
export const toggleUserStatus = (id: number) => {
  return put<{ success: boolean; message: string }>(`/users/${id}/toggle`);
};

// 重置用户密码
export const resetUserPassword = (id: number, data: ResetPasswordParams) => {
  return post<{ success: boolean; message: string }>(`/users/${id}/reset-password`, data);
};

// 开通会员
export const grantMembership = (userId: number, data: GrantMembershipParams) => {
  return post<{ success: boolean; message: string }>(`/users/${userId}/grant-membership`, data);
};

// 解锁用户账户
export const unlockUser = (id: number) => {
  return post<{ success: boolean; message: string }>(`/users/${id}/unlock`);
};

// 获取用户锁定状态
export const getUserLockStatus = (id: number) => {
  return get<{
    success: boolean;
    data: {
      is_locked: boolean;
      locked_until: string | null;
      recent_attempts: number;
      remaining_attempts: number;
      max_attempts: number;
      lockout_duration_minutes: number;
    };
  }>(`/users/${id}/lock-status`);
};

// 批量切换用户状态
export const batchToggleUsers = (userIds: number[], is_active: boolean) => {
  return post<{ success: boolean; message: string; updated: number }>('/users/batch-toggle', {
    user_ids: userIds,
    is_active,
  });
};

// 批量删除用户
export const batchDeleteUsers = (userIds: number[]) => {
  return post<{ success: boolean; message: string; deleted: number }>('/users/batch-delete', {
    user_ids: userIds,
  });
};

// 导出用户数据
export const exportUsers = (params: UserListParams) => {
  return get<Blob>('/users/export', params, {
    responseType: 'blob',
  });
};