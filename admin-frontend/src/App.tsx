/**
 * App主组件
 * 配置全局Provider和路由
 */

import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntApp, Spin, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes';
import './App.css';

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
});

// 全局加载组件
const GlobalLoading = () => (
  <div className="loading-spinner" style={{ height: '100vh' }}>
    <Spin size="large" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#00D4FF',
            colorSuccess: '#00FF88',
            colorWarning: '#FFB800',
            colorError: '#FF3366',
            colorInfo: '#B15BFF',
            borderRadius: 8,
            colorBgBase: '#0A0E1A',
            colorTextBase: '#FFFFFF',
          },
          algorithm: theme.darkAlgorithm,
        }}
      >
        <AntApp>
          <Suspense fallback={<GlobalLoading />}>
            <RouterProvider router={router} />
          </Suspense>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
