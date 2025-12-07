/**
 * 数据总览页面
 * 展示系统核心数据和图表
 */

import React from 'react';
import { Row, Col, Progress, Spin } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { GlassCard, StatCard, PageHeader } from '../../components';
import AIUsageHeatmap from '../../components/AIUsageHeatmap';
import { getStats, getUserTrend, getRevenueTrend, getMembershipDistribution } from '../../api/dashboard';
import './index.css';

const Dashboard: React.FC = () => {
  // 获取统计数据
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getStats,
    refetchInterval: 30000, // 30秒刷新一次
  });

  // 获取用户趋势
  const { data: userTrend } = useQuery({
    queryKey: ['user-trend'],
    queryFn: () => getUserTrend(30),
  });

  // 获取收入趋势
  const { data: revenueTrend } = useQuery({
    queryKey: ['revenue-trend'],
    queryFn: () => getRevenueTrend(30),
  });

  // 获取会员分布
  const { data: membershipDist } = useQuery({
    queryKey: ['membership-distribution'],
    queryFn: getMembershipDistribution,
  });

  // 用户趋势图表配置
  const userTrendOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 14, 26, 0.9)',
      borderColor: '#00D4FF',
      textStyle: { color: '#fff' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: userTrend?.labels || [],
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      axisLabel: { color: '#A0AEC0' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.1)' } },
      axisLabel: { color: '#A0AEC0' },
    },
    series: [
      {
        data: userTrend?.data || [],
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 212, 255, 0.5)' },
              { offset: 1, color: 'rgba(0, 212, 255, 0.05)' },
            ],
          },
        },
        lineStyle: { color: '#00D4FF', width: 3 },
        itemStyle: { color: '#00D4FF' },
      },
    ],
  };

  // 收入趋势图表配置
  const revenueTrendOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 14, 26, 0.9)',
      borderColor: '#B15BFF',
      textStyle: { color: '#fff' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: revenueTrend?.labels || [],
      axisLine: { lineStyle: { color: 'rgba(177, 91, 255, 0.3)' } },
      axisLabel: { color: '#A0AEC0' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(177, 91, 255, 0.3)' } },
      splitLine: { lineStyle: { color: 'rgba(177, 91, 255, 0.1)' } },
      axisLabel: { color: '#A0AEC0' },
    },
    series: [
      {
        data: revenueTrend?.data || [],
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#B15BFF' },
              { offset: 1, color: 'rgba(177, 91, 255, 0.3)' },
            ],
          },
        },
      },
    ],
  };

  // 会员分布图表配置
  const membershipOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 14, 26, 0.9)',
      borderColor: '#00D4FF',
      textStyle: { color: '#fff' },
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'center',
      textStyle: { color: '#A0AEC0' },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#0A0E1A',
          borderWidth: 2,
        },
        label: { color: '#fff' },
        data: membershipDist || [],
      },
    ],
  };

  if (statsLoading) {
    return (
      <div className="loading-spinner">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <PageHeader title="数据总览" subtitle="实时监控系统关键指标" />

      {/* 核心数据卡片 */}
      <Row gutter={[16, 16]} className="stat-cards-row">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="总用户数"
            value={stats?.total_users || 0}
            prefix={<UserOutlined />}
            trend={stats?.total_users_growth ? { value: stats.total_users_growth, direction: stats.total_users_growth > 0 ? 'up' : 'down' } : undefined}
            color="var(--primary-color)"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="活跃用户"
            value={stats?.active_users || 0}
            prefix={<TeamOutlined />}
            trend={stats?.active_users_growth ? { value: stats.active_users_growth, direction: stats.active_users_growth > 0 ? 'up' : 'down' } : undefined}
            color="var(--success-color)"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="会员总数"
            value={stats?.total_members || 0}
            prefix={<CrownOutlined />}
            trend={stats?.total_members_growth ? { value: stats.total_members_growth, direction: stats.total_members_growth > 0 ? 'up' : 'down' } : undefined}
            color="var(--warning-color)"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="总订单数"
            value={stats?.total_orders || 0}
            prefix={<ShoppingCartOutlined />}
            trend={stats?.total_orders_growth ? { value: stats.total_orders_growth, direction: stats.total_orders_growth > 0 ? 'up' : 'down' } : undefined}
            color="var(--info-color)"
            loading={statsLoading}
          />
        </Col>
      </Row>

      {/* 收入数据卡片 */}
      <Row gutter={[16, 16]} className="revenue-cards-row">
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="总收入"
            value={stats?.total_revenue || 0}
            prefix="¥"
            decimals={2}
            icon={<DollarOutlined />}
            trend={stats?.total_revenue_growth ? { value: stats.total_revenue_growth, direction: stats.total_revenue_growth > 0 ? 'up' : 'down' } : undefined}
            color="var(--success-color)"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="今日收入"
            value={stats?.today_revenue || 0}
            prefix="¥"
            decimals={2}
            icon={<RiseOutlined />}
            trend={stats?.today_revenue_growth ? { value: stats.today_revenue_growth, direction: stats.today_revenue_growth > 0 ? 'up' : 'down' } : undefined}
            color="var(--primary-color)"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="转化率"
            value={stats?.conversion_rate || 0}
            suffix="%"
            decimals={1}
            icon={<CheckCircleOutlined />}
            trend={stats?.conversion_rate_growth ? { value: stats.conversion_rate_growth, direction: stats.conversion_rate_growth > 0 ? 'up' : 'down' } : undefined}
            color="var(--warning-color)"
            loading={statsLoading}
          />
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} className="charts-row">
        <Col xs={24} lg={12}>
          <GlassCard title="用户增长趋势" bordered>
            <ReactECharts option={userTrendOption} style={{ height: '300px' }} />
          </GlassCard>
        </Col>
        <Col xs={24} lg={12}>
          <GlassCard title="收入趋势" bordered>
            <ReactECharts option={revenueTrendOption} style={{ height: '300px' }} />
          </GlassCard>
        </Col>
      </Row>

      {/* 会员分布和系统状态 */}
      {/* AI使用热力图 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <AIUsageHeatmap days={30} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="bottom-row">
        <Col xs={24} lg={12}>
          <GlassCard title="会员等级分布" bordered>
            <ReactECharts option={membershipOption} style={{ height: '300px' }} />
          </GlassCard>
        </Col>
        <Col xs={24} lg={12}>
          <GlassCard title="系统健康度" bordered>
            <div className="system-health">
              <div className="health-item">
                <div className="health-label">
                  <ClockCircleOutlined /> CPU使用率
                </div>
                <Progress
                  percent={stats?.cpu_usage || 0}
                  strokeColor={{
                    '0%': '#00D4FF',
                    '100%': '#B15BFF',
                  }}
                  trailColor="rgba(255, 255, 255, 0.1)"
                />
              </div>
              <div className="health-item">
                <div className="health-label">
                  <ClockCircleOutlined /> 内存使用率
                </div>
                <Progress
                  percent={stats?.memory_usage || 0}
                  strokeColor={{
                    '0%': '#00FF88',
                    '100%': '#00D4FF',
                  }}
                  trailColor="rgba(255, 255, 255, 0.1)"
                />
              </div>
              <div className="health-item">
                <div className="health-label">
                  <ClockCircleOutlined /> 磁盘使用率
                </div>
                <Progress
                  percent={stats?.disk_usage || 0}
                  strokeColor={{
                    '0%': '#FFB800',
                    '100%': '#FF3366',
                  }}
                  trailColor="rgba(255, 255, 255, 0.1)"
                />
              </div>
              <div className="health-item">
                <div className="health-label">
                  <ClockCircleOutlined /> 数据库性能
                </div>
                <Progress
                  percent={stats?.db_performance || 0}
                  strokeColor={{
                    '0%': '#B15BFF',
                    '100%': '#00D4FF',
                  }}
                  trailColor="rgba(255, 255, 255, 0.1)"
                />
              </div>
            </div>
          </GlassCard>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

