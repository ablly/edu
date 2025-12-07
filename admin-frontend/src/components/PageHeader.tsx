/**
 * 页面头部组件
 * 显示页面标题、面包屑、操作按钮
 */

import React from 'react';
import { Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import './PageHeader.css';

interface BreadcrumbItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  extra?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumb,
  extra,
}) => {
  const defaultBreadcrumb: BreadcrumbItem[] = [
    { title: '首页', path: '/admin/dashboard', icon: <HomeOutlined /> },
  ];

  const items = [...defaultBreadcrumb, ...(breadcrumb || [])].map((item) => ({
    title: item.path ? (
      <Link to={item.path}>
        {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
        {item.title}
      </Link>
    ) : (
      <>
        {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
        {item.title}
      </>
    ),
  }));

  return (
    <div className="page-header">
      {/* 面包屑 */}
      {breadcrumb && (
        <Breadcrumb items={items} className="page-breadcrumb" />
      )}

      {/* 标题区域 */}
      <div className="page-header-content">
        <div className="page-header-title-area">
          <h1 className="page-title sci-fi-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>

        {/* 额外操作 */}
        {extra && <div className="page-header-extra">{extra}</div>}
      </div>

      {/* 装饰线 */}
      <div className="page-header-divider"></div>
    </div>
  );
};

export default PageHeader;


