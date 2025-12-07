/**
 * 支付记录相关 API
 */

import { get, post } from '../utils/request';

// 支付状态类型
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'cancelled';

// 支付方式类型
export type PaymentMethod = 'alipay' | 'wechat' | 'bank_card' | 'balance';

// 支付记录类型
export interface PaymentRecord {
  id: number;
  transaction_id: string;
  order_id: number;
  order: {
    id: number;
    order_number: string;
    user: {
      id: number;
      username: string;
      email: string;
    };
    tier: {
      id: number;
      name: string;
    };
  };
  user_id: number;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  gateway_response?: string;
  gateway_transaction_id?: string;
  payment_time?: string;
  callback_time?: string;
  refund_amount?: number;
  refund_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 支付详情类型
export interface PaymentDetail extends PaymentRecord {
  gateway_details: {
    trade_no?: string;
    buyer_id?: string;
    buyer_email?: string;
    total_amount?: string;
    receipt_amount?: string;
    invoice_amount?: string;
    point_amount?: string;
    discount_amount?: string;
    subject?: string;
    body?: string;
    trade_status?: string;
    gmt_create?: string;
    gmt_payment?: string;
    gmt_refund?: string;
    gmt_close?: string;
  };
  refund_history: {
    id: number;
    refund_id: string;
    amount: number;
    reason: string;
    status: string;
    created_at: string;
    processed_at?: string;
  }[];
  operation_logs: {
    id: number;
    action: string;
    description: string;
    operator: string;
    created_at: string;
  }[];
}

// 支付统计数据
export interface PaymentStats {
  today_amount: number;
  week_amount: number;
  month_amount: number;
  total_amount: number;
  today_count: number;
  week_count: number;
  month_count: number;
  total_count: number;
  success_rate: number;
  average_amount: number;
  payment_trend: {
    date: string;
    amount: number;
    count: number;
    success_rate: number;
  }[];
  method_distribution: {
    method: PaymentMethod;
    count: number;
    amount: number;
    percentage: number;
  }[];
  status_distribution: {
    status: PaymentStatus;
    count: number;
    percentage: number;
  }[];
  hourly_distribution: {
    hour: number;
    count: number;
    amount: number;
  }[];
}

// 对账报表数据
export interface ReconciliationReport {
  date_range: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_transactions: number;
    total_amount: number;
    success_transactions: number;
    success_amount: number;
    failed_transactions: number;
    failed_amount: number;
    refund_transactions: number;
    refund_amount: number;
  };
  daily_breakdown: {
    date: string;
    transactions: number;
    amount: number;
    success_count: number;
    success_amount: number;
    failed_count: number;
    failed_amount: number;
    refund_count: number;
    refund_amount: number;
  }[];
  method_breakdown: {
    method: PaymentMethod;
    transactions: number;
    amount: number;
    success_rate: number;
  }[];
  discrepancies: {
    transaction_id: string;
    our_status: PaymentStatus;
    gateway_status: string;
    our_amount: number;
    gateway_amount: number;
    issue_type: string;
  }[];
}

// 支付记录查询参数
export interface PaymentRecordsParams {
  page?: number;
  per_page?: number;
  transaction_id?: string;
  order_number?: string;
  user_keyword?: string;
  payment_method?: PaymentMethod | 'all';
  status?: PaymentStatus | 'all';
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: 'created_at' | 'amount' | 'payment_time';
  sort_order?: 'asc' | 'desc';
}

/**
 * 获取支付记录列表
 */
export const getPaymentRecords = (params?: PaymentRecordsParams) => {
  return get<{
    records: PaymentRecord[];
    total: number;
    page: number;
    per_page: number;
  }>('/payments', params);
};

/**
 * 获取支付详情
 */
export const getPaymentDetail = (id: number) => {
  return get<PaymentDetail>(`/payments/${id}`);
};

/**
 * 同步支付宝交易状态
 */
export const syncPaymentStatus = (id: number) => {
  return post<{
    success: boolean;
    message: string;
    old_status: PaymentStatus;
    new_status: PaymentStatus;
    gateway_data?: any;
  }>(`/payments/${id}/sync`);
};

/**
 * 获取支付统计数据
 */
export const getPaymentStats = () => {
  return get<PaymentStats>('/payments/stats');
};

/**
 * 生成对账报表
 */
export const generateReconciliationReport = (params: {
  start_date: string;
  end_date: string;
  payment_method?: PaymentMethod;
}) => {
  return get<ReconciliationReport>('/payments/reconciliation', params);
};

/**
 * 导出支付记录
 */
export const exportPaymentRecords = (params?: PaymentRecordsParams) => {
  // 直接使用fetch处理二进制响应
  const baseURL = 'http://localhost:5000';
  const url = new URL('/api/admin/payments/export', baseURL);
  
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
 * 导出对账报表
 */
export const exportReconciliationReport = (params: {
  start_date: string;
  end_date: string;
  payment_method?: PaymentMethod;
  format?: 'xlsx' | 'csv';
}) => {
  // 直接使用fetch处理二进制响应
  const baseURL = 'http://localhost:5000';
  const url = new URL('/api/admin/payments/reconciliation/export', baseURL);
  
  // 添加参数
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });
  
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
 * 批量同步支付状态
 */
export const batchSyncPaymentStatus = (params: {
  start_date: string;
  end_date: string;
  payment_method?: PaymentMethod;
  status?: PaymentStatus;
}) => {
  return post<{
    success: boolean;
    message: string;
    synced_count: number;
    updated_count: number;
    failed_count: number;
    details: {
      transaction_id: string;
      old_status: PaymentStatus;
      new_status: PaymentStatus;
      success: boolean;
      error?: string;
    }[];
  }>('/payments/batch-sync', params);
};

/**
 * 标记异常支付
 */
export const markPaymentAbnormal = (id: number, data: {
  issue_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}) => {
  return post<{
    success: boolean;
    message: string;
  }>(`/payments/${id}/mark-abnormal`, data);
};

/**
 * 获取异常支付列表
 */
export const getAbnormalPayments = (params?: {
  page?: number;
  per_page?: number;
  severity?: 'low' | 'medium' | 'high';
  resolved?: boolean;
  start_date?: string;
  end_date?: string;
}) => {
  return get<{
    records: (PaymentRecord & {
      abnormal_info: {
        issue_type: string;
        description: string;
        severity: string;
        resolved: boolean;
        resolved_at?: string;
        resolver?: string;
        resolution_notes?: string;
      };
    })[];
    total: number;
    page: number;
    per_page: number;
  }>('/payments/abnormal', params);
};

/**
 * 解决异常支付
 */
export const resolveAbnormalPayment = (id: number, data: {
  resolution_notes: string;
}) => {
  return post<{
    success: boolean;
    message: string;
  }>(`/payments/${id}/resolve-abnormal`, data);
};
