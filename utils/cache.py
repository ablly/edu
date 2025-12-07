"""
缓存工具模块
提供内存缓存功能（可选Redis）
"""

import functools
import hashlib
import json
from datetime import datetime, timedelta
from typing import Any, Callable, Optional

# 简单的内存缓存字典
_memory_cache = {}


def clear_cache():
    """清空所有缓存"""
    global _memory_cache
    _memory_cache = {}
    return True


def get_cache_key(prefix: str, *args, **kwargs) -> str:
    """
    生成缓存键
    
    Args:
        prefix: 键前缀
        *args: 参数
        **kwargs: 关键字参数
        
    Returns:
        str: 缓存键
    """
    # 将参数序列化为字符串
    key_parts = [prefix]
    
    if args:
        key_parts.append(str(args))
    
    if kwargs:
        # 排序kwargs以确保一致性
        sorted_kwargs = sorted(kwargs.items())
        key_parts.append(str(sorted_kwargs))
    
    key_string = ":".join(key_parts)
    
    # 使用MD5哈希生成固定长度的键
    return hashlib.md5(key_string.encode()).hexdigest()


def cache_get(key: str) -> Optional[Any]:
    """
    从缓存获取数据
    
    Args:
        key: 缓存键
        
    Returns:
        缓存的数据或None
    """
    if key in _memory_cache:
        item = _memory_cache[key]
        # 检查是否过期
        if item['expires_at'] and datetime.utcnow() > item['expires_at']:
            del _memory_cache[key]
            return None
        return item['data']
    return None


def cache_set(key: str, data: Any, ttl: int = 300):
    """
    设置缓存数据
    
    Args:
        key: 缓存键
        data: 要缓存的数据
        ttl: 过期时间（秒），默认5分钟
    """
    expires_at = datetime.utcnow() + timedelta(seconds=ttl) if ttl else None
    _memory_cache[key] = {
        'data': data,
        'expires_at': expires_at,
        'created_at': datetime.utcnow()
    }


def cache_delete(key: str):
    """删除缓存"""
    if key in _memory_cache:
        del _memory_cache[key]
        return True
    return False


def cached(ttl: int = 300, key_prefix: str = ""):
    """
    缓存装饰器
    
    Args:
        ttl: 缓存过期时间（秒），默认5分钟
        key_prefix: 缓存键前缀
        
    Example:
        @cached(ttl=600, key_prefix="user_data")
        def get_user_data(user_id):
            return expensive_db_query(user_id)
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存键
            prefix = key_prefix or f"{func.__module__}.{func.__name__}"
            cache_key = get_cache_key(prefix, *args, **kwargs)
            
            # 尝试从缓存获取
            cached_result = cache_get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # 执行函数
            result = func(*args, **kwargs)
            
            # 存入缓存
            cache_set(cache_key, result, ttl)
            
            return result
        
        # 添加清除缓存的方法
        def clear_func_cache():
            """清除此函数的所有缓存"""
            prefix = key_prefix or f"{func.__module__}.{func.__name__}"
            keys_to_delete = [k for k in _memory_cache.keys() if k.startswith(prefix)]
            for key in keys_to_delete:
                del _memory_cache[key]
        
        wrapper.clear_cache = clear_func_cache
        
        return wrapper
    return decorator


def get_cache_stats():
    """
    获取缓存统计信息
    
    Returns:
        dict: 缓存统计
    """
    now = datetime.utcnow()
    total_items = len(_memory_cache)
    expired_items = 0
    active_items = 0
    
    for item in _memory_cache.values():
        if item['expires_at'] and now > item['expires_at']:
            expired_items += 1
        else:
            active_items += 1
    
    return {
        'total_items': total_items,
        'active_items': active_items,
        'expired_items': expired_items,
        'memory_usage_estimate': f"{total_items * 0.001:.2f} KB"  # 粗略估计
    }


# ==================== 会员信息缓存 ====================

def get_membership_cache_key(user_id: int) -> str:
    """获取会员缓存键"""
    return f"membership:user:{user_id}"


def cache_membership_status(user_id: int, status_data: dict, ttl: int = 300):
    """
    缓存会员状态
    
    Args:
        user_id: 用户ID
        status_data: 会员状态数据
        ttl: 过期时间（秒），默认5分钟
    """
    cache_key = get_membership_cache_key(user_id)
    cache_set(cache_key, status_data, ttl)


def get_cached_membership_status(user_id: int) -> Optional[dict]:
    """
    获取缓存的会员状态
    
    Args:
        user_id: 用户ID
        
    Returns:
        会员状态数据或None
    """
    cache_key = get_membership_cache_key(user_id)
    return cache_get(cache_key)


def clear_membership_cache(user_id: int):
    """
    清除用户的会员缓存
    
    Args:
        user_id: 用户ID
    """
    cache_key = get_membership_cache_key(user_id)
    cache_delete(cache_key)


# ==================== API响应缓存 ====================

def api_cache(ttl: int = 60):
    """
    API响应缓存装饰器
    
    Args:
        ttl: 缓存过期时间（秒），默认1分钟
        
    Example:
        @app.route('/api/data')
        @api_cache(ttl=300)
        def get_data():
            return jsonify(expensive_computation())
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            from flask import request, jsonify
            
            # 只缓存GET请求
            if request.method != 'GET':
                return func(*args, **kwargs)
            
            # 生成缓存键（包含请求路径和参数）
            cache_key = get_cache_key(
                f"api:{func.__name__}",
                request.path,
                request.args.to_dict()
            )
            
            # 尝试从缓存获取
            cached_response = cache_get(cache_key)
            if cached_response is not None:
                # 添加缓存命中标记
                response = jsonify(cached_response)
                response.headers['X-Cache'] = 'HIT'
                return response
            
            # 执行函数
            result = func(*args, **kwargs)
            
            # 如果是成功响应，缓存结果
            if hasattr(result, 'status_code') and result.status_code == 200:
                try:
                    response_data = result.get_json()
                    cache_set(cache_key, response_data, ttl)
                    result.headers['X-Cache'] = 'MISS'
                except:
                    pass
            
            return result
        return wrapper
    return decorator


# ==================== 清理过期缓存 ====================

def cleanup_expired_cache():
    """清理所有过期的缓存项"""
    now = datetime.utcnow()
    expired_keys = []
    
    for key, item in _memory_cache.items():
        if item['expires_at'] and now > item['expires_at']:
            expired_keys.append(key)
    
    for key in expired_keys:
        del _memory_cache[key]
    
    return len(expired_keys)


# ==================== 批量操作 ====================

def cache_many(items: dict, ttl: int = 300):
    """
    批量设置缓存
    
    Args:
        items: {key: value} 字典
        ttl: 过期时间（秒）
    """
    for key, value in items.items():
        cache_set(key, value, ttl)


def get_many(keys: list) -> dict:
    """
    批量获取缓存
    
    Args:
        keys: 缓存键列表
        
    Returns:
        {key: value} 字典
    """
    results = {}
    for key in keys:
        value = cache_get(key)
        if value is not None:
            results[key] = value
    return results


def delete_pattern(pattern: str):
    """
    删除匹配模式的所有缓存
    
    Args:
        pattern: 键模式（简单前缀匹配）
        
    Returns:
        删除的键数量
    """
    keys_to_delete = [k for k in _memory_cache.keys() if k.startswith(pattern)]
    for key in keys_to_delete:
        del _memory_cache[key]
    return len(keys_to_delete)
