/**
 * 操作日志相关 API
 */

import { get, post } from '../utils/request';

// 日志类型
export type LogType = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'export' | 'import' | 'system' | 'error';

// 日志级别
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

// 操作日志类型
export interface AdminLog {
  id: number;
  admin_id: number;
  admin: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  action: string;
  module: string;
  target_type?: string;
  target_id?: number;
  description: string;
  ip_address: string;
  user_agent?: string;
  request_method?: string;
  request_path?: string;
  request_args?: string;
  response_status?: number;
  execution_time?: number;
  created_at: string;
}

// 系统日志类型
export interface SystemLog {
  id: number;
  level: LogLevel;
  type: LogType;
  message: string;
  details?: string;
  module?: string;
  file_path?: string;
  line_number?: number;
  stack_trace?: string;
  context?: Record<string, any>;
  created_at: string;
}

// 用户活动日志类型
export interface UserActivityLog {
  id: number;
  user_id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  action: string;
  module: string;
  description: string;
  ip_address: string;
  user_agent?: string;
  session_id?: string;
  created_at: string;
}

// 日志统计数据
export interface LogStats {
  today_logs: number;
  week_logs: number;
  month_logs: number;
  total_logs: number;
  error_logs_today: number;
  warning_logs_today: number;
  top_actions: {
    action: string;
    count: number;
  }[];
  top_modules: {
    module: string;
    count: number;
  }[];
  hourly_distribution: {
    hour: number;
    count: number;
  }[];
  daily_trend: {
    date: string;
    total: number;
    errors: number;
    warnings: number;
  }[];
  admin_activity: {
    admin: {
      id: number;
      username: string;
    };
    actions: number;
    last_activity: string;
  }[];
}

// 日志查询参数
export interface LogsParams {
  page?: number;
  per_page?: number;
  keyword?: string;
  admin_id?: number;
  user_id?: number;
  action?: string;
  module?: string;
  level?: LogLevel;
  type?: LogType;
  start_date?: string;
  end_date?: string;
  ip_address?: string;
  sort_by?: 'created_at' | 'admin_id' | 'action';
  sort_order?: 'asc' | 'desc';
}

/**
 * 获取管理员操作日志
 */
export const getAdminLogs = (params?: LogsParams) => {
  return get<{
    logs: AdminLog[];
    total: number;
    page: number;
    per_page: number;
  }>('/logs/admin', params);
};

/**
 * 获取系统日志
 */
export const getSystemLogs = (params?: LogsParams) => {
  return get<{
    logs: SystemLog[];
    total: number;
    page: number;
    per_page: number;
  }>('/logs/system', params);
};

/**
 * 获取用户活动日志
 */
export const getUserActivityLogs = (params?: LogsParams) => {
  return get<{
    logs: UserActivityLog[];
    total: number;
    page: number;
    per_page: number;
  }>('/logs/user-activity', params);
};

/**
 * 获取日志统计数据
 */
export const getLogStats = () => {
  return get<LogStats>('/logs/stats');
};

/**
 * 获取日志详情
 */
export const getLogDetail = (type: 'admin' | 'system' | 'user-activity', id: number) => {
  return get<AdminLog | SystemLog | UserActivityLog>(`/logs/${type}/${id}`);
};

/**
 * 清理过期日志
 */
export const cleanupLogs = (params: {
  type: 'admin' | 'system' | 'user-activity' | 'all';
  days_to_keep: number;
  confirm: boolean;
}) => {
  return post<{
    success: boolean;
    message: string;
    deleted_count: number;
  }>('/logs/cleanup', params);
};

/**
 * 导出日志数据
 */
export const exportLogs = (type: 'admin' | 'system' | 'user-activity', params?: LogsParams) => {
  // 直接使用fetch处理二进制响应
  const baseURL = 'http://localhost:5000';
  const url = new URL(`/api/admin/logs/${type}/export`, baseURL);
  
  // 添加参数
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  // 添加时间戳防止缓存
  url.searchParams.append('_t', Date.now().toString());
  
  return fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.arrayBuffer();
  });
};

/**
 * 获取登录日志
 */
export const getLoginLogs = (params?: {
  page?: number;
  per_page?: number;
  user_type?: 'admin' | 'user';
  success?: boolean;
  start_date?: string;
  end_date?: string;
  ip_address?: string;
  keyword?: string;
}) => {
  return get<{
    logs: {
      id: number;
      user_type: 'admin' | 'user';
      user_id: number;
      username: string;
      email: string;
      ip_address: string;
      user_agent: string;
      success: boolean;
      failure_reason?: string;
      session_id?: string;
      location?: {
        country: string;
        region: string;
        city: string;
      };
      created_at: string;
    }[];
    total: number;
    page: number;
    per_page: number;
  }>('/logs/login', params);
};

/**
 * 获取安全事件日志
 */
export const getSecurityLogs = (params?: {
  page?: number;
  per_page?: number;
  event_type?: 'failed_login' | 'suspicious_activity' | 'permission_denied' | 'data_breach' | 'account_locked';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
  start_date?: string;
  end_date?: string;
}) => {
  return get<{
    logs: {
      id: number;
      event_type: string;
      severity: string;
      title: string;
      description: string;
      affected_user?: {
        id: number;
        username: string;
        email: string;
      };
      ip_address: string;
      user_agent?: string;
      resolved: boolean;
      resolved_at?: string;
      resolver?: {
        id: number;
        username: string;
      };
      resolution_notes?: string;
      created_at: string;
    }[];
    total: number;
    page: number;
    per_page: number;
  }>('/logs/security', params);
};

/**
 * 解决安全事件
 */
export const resolveSecurityEvent = (id: number, data: {
  resolution_notes: string;
}) => {
  return post<{
    success: boolean;
    message: string;
  }>(`/logs/security/${id}/resolve`, data);
};

/**
 * 获取性能日志
 */
export const getPerformanceLogs = (params?: {
  page?: number;
  per_page?: number;
  endpoint?: string;
  min_duration?: number;
  max_duration?: number;
  status_code?: number;
  start_date?: string;
  end_date?: string;
}) => {
  return get<{
    logs: {
      id: number;
      method: string;
      endpoint: string;
      status_code: number;
      duration: number;
      memory_usage?: number;
      cpu_usage?: number;
      query_count?: number;
      query_time?: number;
      user_id?: number;
      admin_id?: number;
      ip_address: string;
      created_at: string;
    }[];
    total: number;
    page: number;
    per_page: number;
    avg_duration: number;
    slow_queries_count: number;
  }>('/logs/performance', params);
};

/**
 * 获取错误日志详情
 */
export const getErrorLogDetail = (id: number) => {
  return get<{
    id: number;
    level: LogLevel;
    message: string;
    exception_type?: string;
    file_path?: string;
    line_number?: number;
    stack_trace?: string;
    request_data?: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body?: string;
      user_id?: number;
      admin_id?: number;
    };
    context: Record<string, any>;
    occurrence_count: number;
    first_seen: string;
    last_seen: string;
    resolved: boolean;
    resolved_at?: string;
    resolver?: {
      id: number;
      username: string;
    };
    resolution_notes?: string;
    created_at: string;
  }>(`/logs/errors/${id}`);
};

/**
 * 标记错误已解决
 */
export const resolveError = (id: number, data: {
  resolution_notes: string;
}) => {
  return post<{
    success: boolean;
    message: string;
  }>(`/logs/errors/${id}/resolve`, data);
};
