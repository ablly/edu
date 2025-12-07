"""
自定义认证装饰器
用于API路由的登录和会员验证，返回JSON而非302跳转
"""
from functools import wraps
from flask import jsonify
from flask_login import current_user


def require_login_api(f):
    """
    API登录验证装饰器
    返回JSON而不是302跳转到登录页
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({
                'success': False,
                'message': '请先登录后使用此功能',
                'code': 'NOT_LOGGED_IN',
                'redirect': '/login'
            }), 401
        return f(*args, **kwargs)
    return decorated_function


def require_membership(f):
    """
    会员验证装饰器
    要求用户必须有有效会员（包括免费会员）才能使用功能
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 1. 首先检查是否登录
        if not current_user.is_authenticated:
            return jsonify({
                'success': False,
                'message': '请先登录后使用此功能',
                'code': 'NOT_LOGGED_IN',
                'redirect': '/login'
            }), 401
        
        # 2. 检查是否有有效会员
        from datetime import datetime
        membership = current_user.get_current_membership()
        
        if not membership:
            return jsonify({
                'success': False,
                'message': '请购买会员后使用本功能',
                'code': 'NO_MEMBERSHIP',
                'redirect': '/payment'
            }), 403
        
        # 3. 检查会员是否过期
        if membership.end_date < datetime.utcnow():
            return jsonify({
                'success': False,
                'message': '您的会员已过期，请续费后继续使用',
                'code': 'MEMBERSHIP_EXPIRED',
                'redirect': '/payment'
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function



