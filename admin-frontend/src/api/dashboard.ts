/**
 * 数据总览API
 */

import { get } from '../utils/request';
import type { DashboardStats } from '../types';

/**
 * 获取统计数据
 */
export const getStats = () => {
  return get<DashboardStats>('/dashboard/stats');
};

/**
 * 获取用户增长趋势
 */
export const getUserTrend = (days: number = 30) => {
  return get<{ labels: string[]; data: number[] }>('/dashboard/user-trend', { days });
};

/**
 * 获取收入趋势
 */
export const getRevenueTrend = (days: number = 30) => {
  return get<{ labels: string[]; data: number[] }>('/dashboard/revenue-trend', { days });
};

/**
 * 获取订单统计
 */
export const getOrderStats = () => {
  return get('/dashboard/order-stats');
};

/**
 * 获取会员分布
 */
export const getMembershipDistribution = () => {
  return get('/dashboard/membership-distribution');
};

/**
 * AI使用热力图数据
 */
export interface AIUsageHeatmapData {
  heatmap_data: [string, string, number][]; // [date, feature, count]
  dates: string[];
  features: string[];
}

export const getAIUsageHeatmap = (days: number = 30) => {
  return get<AIUsageHeatmapData>('/dashboard/ai-usage-heatmap', { days });
};


