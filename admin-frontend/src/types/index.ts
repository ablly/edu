/**
 * TypeScript类型定义
 */

// ========== 通用类型 ==========

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ========== 管理员相关 ==========

export interface Admin {
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

export interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  token: string;
  admin: Admin;
}

// ========== 用户相关 ==========

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
  membership?: UserMembership;
}

export interface UserMembership {
  id: number;
  tier_id: number;
  tier_name: string;
  tier_code: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  days_remaining: number;
}

export interface UserFilters extends PaginationParams {
  keyword?: string;
  membership?: string;
  status?: string | boolean;
  start_date?: string;
  end_date?: string;
}

// ========== 会员等级相关 ==========

export interface MembershipTier {
  id: number;
  name: string;
  code: string;
  level: number;
  price: number;
  currency: string;
  duration_days: number;
  permissions: Record<string, unknown>;
  features: string[];
  description?: string;
  is_active: boolean;
  is_limited: boolean;
  total_quota: number;
  sold_count: number;
  remaining: number;
  is_early_bird: boolean;
  early_bird_tier: number;
  original_price: number;
  discount: number;
}

// ========== 订单相关 ==========

export interface Order {
  id: number;
  transaction_id: string;
  user_id: number;
  user: {
    id: number;
    username: string;
    email: string;
    avatar?: string;
  };
  tier_id: number;
  tier: MembershipTier;
  amount: number;
  currency: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  alipay_trade_no?: string;
  payment_url?: string;
  note?: string;
  created_at: string;
  completed_at?: string;
  expires_at?: string;
}

export interface OrderFilters extends PaginationParams {
  keyword?: string;
  status?: string;
  payment_method?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

// ========== 支付记录相关 ==========

export interface Payment {
  id: number;
  transaction_id: string;
  order_id: number;
  user_id: number;
  amount: number;
  payment_method: string;
  status: string;
  alipay_trade_no?: string;
  created_at: string;
}

// ========== 统计数据相关 ==========

export interface DashboardStats {
  total_users: number;
  total_users_growth: number;
  active_users: number;
  active_users_growth: number;
  total_members: number;
  total_members_growth: number;
  total_orders: number;
  total_orders_growth: number;
  total_revenue: number;
  total_revenue_growth: number;
  today_revenue: number;
  today_revenue_growth: number;
  conversion_rate: number;
  conversion_rate_growth: number;
  system_health: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  db_performance: number;
}

export interface ChartData {
  labels: string[];
  data: number[];
}

// ========== 日志相关 ==========

export interface AdminLog {
  id: number;
  admin_id: number;
  admin_username: string;
  action: string;
  module: string;
  description: string;
  target_type?: string;
  target_id?: number;
  ip_address: string;
  user_agent: string;
  request_method: string;
  request_path: string;
  status: 'success' | 'failure';
  error_message?: string;
  created_at: string;
}

// ========== 使用日志相关 ==========

export interface UsageLog {
  id: number;
  user_id: number;
  username: string;
  avatar?: string;
  feature_code: string;
  action: string;
  details?: Record<string, unknown>;
  response_time?: number;
  status: 'success' | 'failure';
  created_at: string;
}

// ========== 表单相关 ==========

export interface UserFormData {
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  password?: string;
  is_active?: boolean;
  is_admin?: boolean;
}

export interface MembershipFormData {
  tier_id: number;
  start_date: string;
  duration_days: number;
  note?: string;
}

export interface OrderFormData {
  note?: string;
}

// ========== 批量操作 ==========

export interface BatchToggleParams {
  user_ids: number[];
  is_active: boolean;
}

export interface BatchDeleteParams {
  user_ids: number[];
}

