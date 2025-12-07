/**
 * 状态指示器组件
 * 显示在线/离线/警告/错误等状态
 */

import React from 'react';
import { motion } from 'framer-motion';
import './StatusIndicator.css';

export type StatusType = 'online' | 'offline' | 'warning' | 'error' | 'success' | 'processing';
export type StatusSize = 'small' | 'default' | 'large';

interface StatusIndicatorProps {
  status: StatusType;
  text?: string;
  size?: StatusSize;
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const statusConfig = {
  online: {
    color: 'var(--success-color)',
    label: '在线',
    glow: 'var(--success-glow)',
  },
  offline: {
    color: 'var(--text-disabled)',
    label: '离线',
    glow: 'rgba(74, 85, 104, 0.5)',
  },
  warning: {
    color: 'var(--warning-color)',
    label: '警告',
    glow: 'var(--warning-glow)',
  },
  error: {
    color: 'var(--danger-color)',
    label: '错误',
    glow: 'var(--danger-glow)',
  },
  success: {
    color: 'var(--success-color)',
    label: '成功',
    glow: 'var(--success-glow)',
  },
  processing: {
    color: 'var(--primary-color)',
    label: '处理中',
    glow: 'var(--primary-glow)',
  },
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  text,
  size = 'default',
  pulse = true,
  className,
  style,
}) => {
  const config = statusConfig[status];
  const displayText = text || config.label;

  return (
    <div
      className={`status-indicator status-${status} size-${size} ${className || ''}`}
      style={style}
    >
      <motion.div
        className="status-dot"
        style={{
          backgroundColor: config.color,
          boxShadow: pulse ? `0 0 8px ${config.glow}` : 'none',
        }}
        animate={
          pulse && status !== 'offline'
            ? {
                boxShadow: [
                  `0 0 4px ${config.glow}`,
                  `0 0 12px ${config.glow}`,
                  `0 0 4px ${config.glow}`,
                ],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {displayText && <span className="status-text">{displayText}</span>}
    </div>
  );
};

export default StatusIndicator;

