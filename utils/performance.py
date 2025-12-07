#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
性能监控和优化工具
包括慢查询记录、请求计时、性能指标收集
"""

import time
import functools
from flask import g, request
from datetime import datetime
import logging

# 配置日志
perf_logger = logging.getLogger('performance')


def log_slow_query(query_time, query_sql):
    """记录慢查询（超过1秒）
    
    Args:
        query_time: 查询耗时（秒）
        query_sql: SQL语句
    """
    if query_time > 1.0:
        perf_logger.warning(
            f"慢查询检测 | 耗时: {query_time:.2f}s | "
            f"SQL: {query_sql[:200]}{'...' if len(query_sql) > 200 else ''}"
        )


def measure_time(func_name=None):
    """装饰器：测量函数执行时间
    
    Usage:
        @measure_time("my_function")
        def my_function():
            pass
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            elapsed = time.time() - start_time
            
            name = func_name or func.__name__
            if elapsed > 0.5:  # 超过0.5秒记录警告
                perf_logger.warning(f"慢函数: {name} 耗时 {elapsed:.2f}s")
            else:
                perf_logger.debug(f"函数: {name} 耗时 {elapsed:.3f}s")
            
            return result
        return wrapper
    return decorator


class PerformanceMonitor:
    """性能监控类"""
    
    def __init__(self):
        self.request_times = []
        self.slow_requests = []
        self.total_requests = 0
        self.total_time = 0
        
    def record_request(self, path, method, duration, status_code):
        """记录请求性能数据"""
        self.total_requests += 1
        self.total_time += duration
        
        request_data = {
            'path': path,
            'method': method,
            'duration': duration,
            'status_code': status_code,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # 保留最近1000个请求
        self.request_times.append(request_data)
        if len(self.request_times) > 1000:
            self.request_times.pop(0)
        
        # 记录慢请求（超过2秒）
        if duration > 2.0:
            self.slow_requests.append(request_data)
            if len(self.slow_requests) > 100:
                self.slow_requests.pop(0)
    
    def get_stats(self):
        """获取性能统计数据"""
        if not self.request_times:
            return {
                'total_requests': 0,
                'avg_response_time': 0,
                'slow_requests_count': 0
            }
        
        recent_times = [r['duration'] for r in self.request_times]
        
        return {
            'total_requests': self.total_requests,
            'recent_requests_count': len(self.request_times),
            'avg_response_time': sum(recent_times) / len(recent_times),
            'min_response_time': min(recent_times),
            'max_response_time': max(recent_times),
            'slow_requests_count': len(self.slow_requests),
            'slow_requests': self.slow_requests[-10:]  # 最近10个慢请求
        }
    
    def reset_stats(self):
        """重置统计数据"""
        self.request_times = []
        self.slow_requests = []
        self.total_requests = 0
        self.total_time = 0


# 全局性能监控器实例
performance_monitor = PerformanceMonitor()


def init_performance_monitoring(app):
    """初始化性能监控中间件
    
    Args:
        app: Flask应用实例
    """
    
    @app.before_request
    def before_request():
        """请求开始时记录时间"""
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        """请求结束时计算耗时"""
        if hasattr(g, 'start_time'):
            elapsed = time.time() - g.start_time
            
            # 记录到性能监控器
            performance_monitor.record_request(
                path=request.path,
                method=request.method,
                duration=elapsed,
                status_code=response.status_code
            )
            
            # 记录慢请求到日志
            if elapsed > 1.0:
                app.logger.warning(
                    f"慢请求 | {request.method} {request.path} | "
                    f"耗时: {elapsed:.2f}s | 状态码: {response.status_code}"
                )
            
            # 添加响应时间头（调试用）
            response.headers['X-Response-Time'] = f"{elapsed:.3f}s"
        
        return response
    
    app.logger.info("性能监控系统已初始化")


def get_cache_stats(cache):
    """获取缓存统计信息
    
    Args:
        cache: Flask-Caching实例
        
    Returns:
        dict: 缓存统计数据
    """
    try:
        # 这需要Redis缓存支持
        if hasattr(cache.cache, '_client'):
            info = cache.cache._client.info('stats')
            return {
                'type': 'redis',
                'hits': info.get('keyspace_hits', 0),
                'misses': info.get('keyspace_misses', 0),
                'keys': len(cache.cache._client.keys('*'))
            }
    except:
        pass
    
    return {'type': 'simple', 'info': 'Limited stats available'}


