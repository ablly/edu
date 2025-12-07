/**
 * 订单管理相关 API
 */

import { get, post, put } from '../utils/request';

// 订单状态类型
export type OrderStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

// 支付方式类型
export type PaymentMethod = 'alipay' | 'wechat' | 'bank_card' | 'balance';

// 订单类型
export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  user: {
    id: number;
    username: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  tier_id: number;
  tier: {
    id: number;
    name: string;
    price: number;
    duration_days: number;
  };
  amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  transaction_id?: string;
  payment_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  expired_at?: string;
  membership_record_id?: number;
}

// 订单详情类型
export interface OrderDetail extends Order {
  payment_info: {
    transaction_id?: string;
    payment_time?: string;
    payment_url?: string;
    refund_info?: {
      refund_id: string;
      refund_amount: number;
      refund_reason: string;
      refund_time: string;
      refund_status: string;
    };
  };
  membership_info?: {
    record_id: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
  };
  operation_history: {
    id: number;
    action: string;
    description: string;
    operator: string;
    created_at: string;
  }[];
}

// 订单统计数据
export interface OrderStats {
  today_revenue: number;
  week_revenue: number;
  month_revenue: number;
  total_revenue: number;
  today_orders: number;
  week_orders: number;
  month_orders: number;
  total_orders: number;
  revenue_trend: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  status_distribution: {
    status: OrderStatus;
    count: number;
    percentage: number;
  }[];
  payment_method_distribution: {
    method: PaymentMethod;
    count: number;
    percentage: number;
  }[];
}

// 订单查询参数
export interface OrdersParams {
  page?: number;
  per_page?: number;
  keyword?: string;
  user_keyword?: string;
  status?: OrderStatus | 'all';
  payment_method?: PaymentMethod | 'all';
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: 'created_at' | 'amount' | 'completed_at';
  sort_order?: 'asc' | 'desc';
}

// 退款申请参数
export interface RefundParams {
  reason: string;
  amount: number;
  description?: string;
  audit_notes?: string;
}

/**
 * 获取订单列表
 */
export const getOrders = (params?: OrdersParams) => {
  return get<{
    orders: Order[];
    total: number;
    page: number;
    per_page: number;
  }>('/orders', params);
};

/**
 * 获取订单详情
 */
export const getOrderDetail = (id: number) => {
  return get<OrderDetail>(`/orders/${id}`);
};

/**
 * 更新订单信息（主要是备注）
 */
export const updateOrder = (id: number, data: { notes?: string }) => {
  return put<Order>(`/orders/${id}`, data);
};

/**
 * 申请退款
 */
export const refundOrder = (id: number, data: RefundParams) => {
  return post<{
    success: boolean;
    message: string;
    refund_id?: string;
  }>(`/orders/${id}/refund`, data);
};

/**
 * 取消订单
 */
export const cancelOrder = (id: number, reason?: string) => {
  return post<{
    success: boolean;
    message: string;
  }>(`/orders/${id}/cancel`, { reason });
};

/**
 * 获取订单统计数据
 */
export const getOrderStats = () => {
  return get<OrderStats>('/orders/stats');
};

/**
 * 导出订单数据
 */
export const exportOrders = (params?: OrdersParams) => {
  // 直接使用fetch处理二进制响应
  const baseURL = 'http://localhost:5000';
  const url = new URL('/api/admin/orders/export', baseURL);
  
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
 * 同步支付宝订单状态
 */
export const syncAlipayOrder = (id: number) => {
  return post<{
    success: boolean;
    message: string;
    status: OrderStatus;
  }>(`/orders/${id}/sync-alipay`);
};

/**
 * 获取退款列表
 */
export const getRefunds = (params?: {
  page?: number;
  per_page?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  start_date?: string;
  end_date?: string;
}) => {
  return get<{
    refunds: {
      id: number;
      order_id: number;
      order: Order;
      amount: number;
      reason: string;
      description?: string;
      status: string;
      audit_notes?: string;
      created_at: string;
      updated_at: string;
      processed_at?: string;
    }[];
    total: number;
    page: number;
    per_page: number;
  }>('/orders/refunds', params);
};

/**
 * 处理退款申请
 */
export const processRefund = (refundId: number, data: {
  action: 'approve' | 'reject';
  audit_notes?: string;
}) => {
  return post<{
    success: boolean;
    message: string;
  }>(`/orders/refunds/${refundId}/process`, data);
};
