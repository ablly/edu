/**
 * 会员管理相关 API
 */

import { get, put, del, post } from '../utils/request';

// 会员套餐类型
export interface MembershipTier {
  id: number;
  name: string;
  code: string;
  level: number;
  price: number;
  currency: string;
  duration_days: number;
  is_limited: boolean;
  total_quota?: number;
  sold_count?: number;
  is_early_bird: boolean;
  early_bird_tier?: number;
  original_price?: number;
  features: string[];
  description: string;
  permissions: {
    ai_qa_daily_limit: number;
    ai_question_daily_limit: number;
    ai_lecture_daily_limit: number;
    video_summary_daily_limit: number;
    programming_assist_daily_limit: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 会员记录类型
export interface MembershipRecord {
  id: number;
  user_id: number;
  tier_id: number;
  user: {
    id: number;
    username: string;
    email: string;
    avatar?: string;
  };
  tier: MembershipTier;
  start_date: string;
  end_date: string;
  is_active: boolean;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

// 会员统计数据
export interface MembershipStats {
  total_members: number;
  active_members: number;
  new_members_this_month: number;
  conversion_rate: number;
  revenue_this_month: number;
  tier_distribution: {
    tier_name: string;
    count: number;
    percentage: number;
  }[];
  growth_trend: {
    date: string;
    new_members: number;
    total_members: number;
  }[];
  renewal_rate: {
    tier_name: string;
    renewal_rate: number;
  }[];
}

// 早鸟优惠状态
export interface EarlyBirdStatus {
  is_active: boolean;
  end_time: string;
  tiers: {
    tier: number;
    name: string;
    price: number;
    original_price: number;
    total_quota: number;
    sold_count: number;
    remaining: number;
    progress: number;
  }[];
}

// 会员记录查询参数
export interface MembershipRecordsParams {
  page?: number;
  per_page?: number;
  keyword?: string;
  tier_id?: number;
  status?: 'active' | 'expired' | 'all';
  start_date?: string;
  end_date?: string;
}

/**
 * 获取会员套餐列表
 */
export const getMembershipTiers = () => {
  return get<MembershipTier[]>('/memberships/tiers');
};

/**
 * 获取会员套餐详情
 */
export const getMembershipTier = (id: number) => {
  return get<MembershipTier>(`/memberships/tiers/${id}`);
};

/**
 * 创建会员套餐
 */
export const createMembershipTier = (data: Omit<MembershipTier, 'id' | 'created_at' | 'updated_at'>) => {
  return post<MembershipTier>('/memberships/tiers', data);
};

/**
 * 更新会员套餐
 */
export const updateMembershipTier = (id: number, data: Partial<MembershipTier>) => {
  return put<MembershipTier>(`/memberships/tiers/${id}`, data);
};

/**
 * 删除会员套餐
 */
export const deleteMembershipTier = (id: number) => {
  return del<{ success: boolean; message: string }>(`/memberships/tiers/${id}`);
};

/**
 * 获取会员开通记录
 */
export const getMembershipRecords = (params?: MembershipRecordsParams) => {
  return get<{
    records: MembershipRecord[];
    total: number;
    page: number;
    per_page: number;
  }>('/memberships/records', params);
};

/**
 * 获取会员统计数据
 */
export const getMembershipStats = () => {
  return get<MembershipStats>('/memberships/stats');
};

/**
 * 获取早鸟优惠状态
 */
export const getEarlyBirdStatus = () => {
  return get<EarlyBirdStatus>('/memberships/early-bird');
};

/**
 * 更新早鸟优惠设置
 */
export const updateEarlyBirdSettings = (data: {
  is_active: boolean;
  end_time: string;
  tiers: {
    tier: number;
    price: number;
    total_quota: number;
  }[];
}) => {
  return put<EarlyBirdStatus>('/memberships/early-bird', data);
};

/**
 * 获取套餐销售统计
 */
export const getTierSalesStats = (tierId: number) => {
  return get<{
    total_sales: number;
    total_revenue: number;
    average_price: number;
    sales_trend: {
      date: string;
      sales: number;
      revenue: number;
    }[];
    user_list: {
      user: {
        id: number;
        username: string;
        email: string;
      };
      purchase_time: string;
      expire_time: string;
      is_renewed: boolean;
    }[];
    conversion_analysis: {
      from_free: number;
      from_lower_tier: number;
      renewal_rate: number;
    };
  }>(`/memberships/tiers/${tierId}/sales`);
};

/**
 * 导出会员数据
 */
export const exportMembershipData = (params?: MembershipRecordsParams) => {
  // 直接使用fetch处理二进制响应
  const baseURL = 'http://localhost:5000';
  const url = new URL('/api/admin/memberships/export', baseURL);
  
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
