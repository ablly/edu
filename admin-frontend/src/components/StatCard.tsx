/**
 * 统计卡片组件
 * 用于Dashboard展示关键数据
 */

import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import './StatCard.css';

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: { value: number; direction: 'up' | 'down' };
  decimals?: number;
  precision?: number;
  color?: string;
  loading?: boolean;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix = '',
  prefix,
  icon,
  trend,
  decimals = 0,
  loading = false,
  className,
}) => {
  const cardClass = classNames('stat-card', className);

  const trendClass = classNames('stat-trend', {
    'trend-up': trend && trend.direction === 'up',
    'trend-down': trend && trend.direction === 'down',
  });

  return (
    <motion.div
      className={cardClass}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* 扫描线 */}
      <div className="scan-line scan-line-animation"></div>

      {/* 卡片内容 */}
      <div className="stat-card-content">
        {/* 图标 */}
        {icon && (
          <div className="stat-icon">
            {icon}
          </div>
        )}

        {/* 数据区域 */}
        <div className="stat-data">
          {/* 标题 */}
          <div className="stat-title">{title}</div>

          {/* 数值 */}
          <div className="stat-value">
            {loading ? (
              <div className="stat-loading">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            ) : (
              <>
                {prefix}
                <CountUp
                  end={value}
                  decimals={decimals}
                  separator=","
                  duration={1.5}
                  className="digital-number"
                />
                {suffix}
              </>
            )}
          </div>

          {/* 趋势 */}
          {trend && !loading && (
            <div className={trendClass}>
              {trend.direction === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* 发光效果 */}
      <div className="stat-glow"></div>
    </motion.div>
  );
};

export default StatCard;

