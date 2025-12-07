/**
 * 玻璃态卡片组件
 * 科幻风格的内容容器
 */

import React from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import './GlassCard.css';

interface GlassCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  bordered?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  title,
  extra,
  className,
  hoverable = false,
  bordered = true,
  loading = false,
  style,
  bodyStyle,
  onClick,
}) => {
  const cardClass = classNames(
    'glass-card',
    {
      'glass-card-hoverable': hoverable,
      'glass-card-bordered': bordered,
      'glass-card-loading': loading,
    },
    className
  );

  return (
    <motion.div
      className={cardClass}
      style={style}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 扫描线 */}
      <div className="scan-line scan-line-animation"></div>

      {/* 卡片头部 */}
      {title && (
        <div className="glass-card-header">
          <div className="glass-card-title">{title}</div>
          {extra && <div className="glass-card-extra">{extra}</div>}
        </div>
      )}

      {/* 卡片内容 */}
      <div className="glass-card-body" style={bodyStyle}>
        {loading ? (
          <div className="glass-card-loading-wrapper">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <p>Loading...</p>
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
};

export default GlassCard;


