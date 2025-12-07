/**
 * 科幻风格数据表格组件
 * 基于Ant Design Table，增加科幻视觉效果
 */

import React from 'react';
import { Table, type TableProps } from 'antd';
import { motion } from 'framer-motion';
import './DataGrid.css';

interface DataGridProps<T = any> extends TableProps<T> {
  glowColor?: string;
  scanlineEffect?: boolean;
}

const DataGrid = <T extends Record<string, any>>({
  glowColor = 'var(--primary-color)',
  scanlineEffect = true,
  className,
  ...props
}: DataGridProps<T>) => {
  return (
    <motion.div
      className={`cyber-data-grid ${className || ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        '--glow-color': glowColor,
      } as React.CSSProperties}
    >
      {scanlineEffect && <div className="scanline-effect" />}
      
      <Table
        {...props}
        className="cyber-table"
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `显示 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
          ...props.pagination,
        }}
      />
    </motion.div>
  );
};

export default DataGrid;
