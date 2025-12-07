/**
 * Axios请求封装
 * 统一处理请求拦截、响应拦截、错误处理
 */

import axios from 'axios';
import { message } from 'antd';

// 创建axios实例
const request = axios.create({
  baseURL: 'http://localhost:5000/api/admin',
  timeout: 30000,
  withCredentials: true, // 允许携带cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config: any) => {
    // 添加Token到请求头
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    // 开发环境打印请求日志
    if (import.meta.env.DEV) {
      console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
    }

    return config;
  },
  (error: any) => {
    console.error('[Request Error]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: any) => {
    // 开发环境打印响应日志
    if (import.meta.env.DEV) {
      console.log(`[Response] ${response.config.url}`, response.data);
    }

    const { data } = response;

    // 后端返回的数据格式：{ success: boolean, data: any, message: string }
    if (data.success === false) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }

    return data.data || data;
  },
  (error: any) => {
    console.error('[Response Error]', error);

    // 处理HTTP错误
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          message.error('未登录或登录已过期，请重新登录');
          // 清除token
          localStorage.removeItem('admin_token');
          // 跳转到登录页
          window.location.href = '/login';
          break;

        case 403:
          message.error(data?.message || '没有权限访问此资源');
          break;

        case 404:
          message.error('请求的资源不存在');
          break;

        case 429:
          message.error('请求过于频繁，请稍后再试');
          break;

        case 500:
          message.error(data?.message || '服务器内部错误');
          break;

        case 502:
        case 503:
        case 504:
          message.error('服务器暂时不可用，请稍后再试');
          break;

        default:
          message.error(data?.message || `请求失败 (${status})`);
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      message.error('网络连接失败，请检查网络');
    } else {
      // 其他错误
      message.error(error.message || '请求配置错误');
    }

    return Promise.reject(error);
  }
);

export default request;

/**
 * GET请求
 */
export function get<T = any>(url: string, params?: any, config?: any): Promise<T> {
  return request.get(url, { params, ...config });
}

/**
 * POST请求
 */
export function post<T = any>(url: string, data?: any, config?: any): Promise<T> {
  return request.post(url, data, config);
}

/**
 * PUT请求
 */
export function put<T = any>(url: string, data?: any, config?: any): Promise<T> {
  return request.put(url, data, config);
}

/**
 * DELETE请求
 */
export function del<T = any>(url: string, params?: any, config?: any): Promise<T> {
  return request.delete(url, { params, ...config });
}

/**
 * PATCH请求
 */
export function patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
  return request.patch(url, data, config);
}

