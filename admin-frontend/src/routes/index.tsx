/**
 * 路由配置
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import BasicLayout from '../layouts/BasicLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
// 懒加载其他页面
import { lazy } from 'react';

const Users = lazy(() => import('../pages/Users'));
const Memberships = lazy(() => import('../pages/Memberships'));
const Orders = lazy(() => import('../pages/Orders'));
const Payments = lazy(() => import('../pages/Payments'));
const Logs = lazy(() => import('../pages/Logs'));
const Settings = lazy(() => import('../pages/Settings'));
const Admins = lazy(() => import('../pages/Admins'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/admin',
    element: <BasicLayout />,
    children: [
      {
        path: '',
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'memberships',
        element: <Memberships />,
      },
      {
        path: 'orders',
        element: <Orders />,
      },
      {
        path: 'payments',
        element: <Payments />,
      },
      {
        path: 'logs',
        element: <Logs />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'admins',
        element: <Admins />,
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/admin/dashboard" replace />,
  },
]);

