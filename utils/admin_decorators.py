"""
管理员权限装饰器
提供管理员认证和权限检查功能
"""

from functools import wraps
from flask import session, redirect, url_for, flash, request, jsonify
from models_admin import Admin, AdminLog, AdminPermission
from models import db
import json


def admin_required(f):
    """
    要求管理员登录
    未登录时重定向到登录页面
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            flash('请先登录管理后台', 'warning')
            return redirect(url_for('admin_login'))
        
        # 检查管理员是否存在且激活
        admin = Admin.query.get(session['admin_id'])
        if not admin or not admin.is_active:
            session.pop('admin_id', None)
            flash('管理员账户不存在或已被禁用', 'error')
            return redirect(url_for('admin_login'))
        
        return f(*args, **kwargs)
    
    return decorated_function


def permission_required(permission):
    """
    要求特定权限
    参数:
        permission: 权限名称 (例如: 'user_edit')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'admin_id' not in session:
                if request.is_json:
                    return jsonify({'success': False, 'message': '未登录'}), 401
                flash('请先登录管理后台', 'warning')
                return redirect(url_for('admin_login'))
            
            admin = Admin.query.get(session['admin_id'])
            if not admin or not admin.is_active:
                session.pop('admin_id', None)
                if request.is_json:
                    return jsonify({'success': False, 'message': '账户已禁用'}), 403
                flash('管理员账户已被禁用', 'error')
                return redirect(url_for('admin_login'))
            
            # 超级管理员拥有所有权限
            if admin.is_super_admin:
                kwargs['current_admin'] = admin
                return f(*args, **kwargs)
            
            # 检查管理员是否有该权限
            admin_permissions = json.loads(admin.permissions or '[]')
            if permission not in admin_permissions:
                if request.is_json:
                    return jsonify({'success': False, 'message': '权限不足'}), 403
                flash('您没有权限执行此操作', 'error')
                return redirect(url_for('admin_dashboard'))
            
            kwargs['current_admin'] = admin
            return f(*args, **kwargs)
        
        return decorated_function
    
    return decorator


def log_admin_action(action, module='', description=''):
    """
    记录管理员操作
    参数:
        action: 操作类型 (view/create/update/delete)
        module: 模块名称 (user/order/membership等)
        description: 操作描述
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 执行原函数
            result = f(*args, **kwargs)
            
            # 记录操作日志
            if 'admin_id' in session:
                try:
                    admin = Admin.query.get(session['admin_id'])
                    if admin:
                        # 获取请求信息
                        target_id = kwargs.get('id') or request.args.get('id')
                        target_type = module
                        
                        # 确定状态
                        if isinstance(result, tuple):
                            status = 'success' if result[1] == 200 else 'failed'
                        elif hasattr(result, 'status_code'):
                            status = 'success' if result.status_code == 200 else 'failed'
                        else:
                            status = 'success'
                        
                        # 创建日志
                        log = AdminLog(
                            admin_id=admin.id,
                            action=action,
                            module=module,
                            description=description or f'{action} {module}',
                            target_type=target_type,
                            target_id=str(target_id) if target_id else None,
                            ip_address=request.remote_addr,
                            user_agent=request.user_agent.string[:200] if request.user_agent else None,
                            request_method=request.method,
                            request_path=request.path,
                            status=status
                        )
                        db.session.add(log)
                        db.session.commit()
                except Exception as e:
                    # 日志记录失败不应影响主功能
                    print(f"Error logging admin action: {str(e)}")
            
            return result
        
        return decorated_function
    
    return decorator


def api_admin_required(f):
    """
    API接口专用的管理员认证装饰器
    返回JSON格式的错误信息
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # OPTIONS请求直接返回200，不需要认证和执行函数
        from flask import request
        if request.method == 'OPTIONS':
            return '', 200
        
        if 'admin_id' not in session:
            return jsonify({
                'success': False,
                'message': '未登录或会话已过期'
            }), 401
        
        admin = Admin.query.get(session['admin_id'])
        if not admin or not admin.is_active:
            session.pop('admin_id', None)
            return jsonify({
                'success': False,
                'message': '管理员账户不存在或已被禁用'
            }), 403
        
        # 将管理员对象添加到kwargs中，方便后续使用
        kwargs['current_admin'] = admin
        return f(*args, **kwargs)
    
    return decorated_function


def api_permission_required(permission):
    """
    API接口专用的权限检查装饰器
    参数:
        permission: 权限名称
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'admin_id' not in session:
                return jsonify({
                    'success': False,
                    'message': '未登录或会话已过期'
                }), 401
            
            admin = Admin.query.get(session['admin_id'])
            if not admin or not admin.is_active:
                session.pop('admin_id', None)
                return jsonify({
                    'success': False,
                    'message': '管理员账户不存在或已被禁用'
                }), 403
            
            # 超级管理员拥有所有权限
            if not admin.is_super_admin:
                admin_permissions = json.loads(admin.permissions or '[]')
                if permission not in admin_permissions:
                    return jsonify({
                        'success': False,
                        'message': '权限不足，无法执行此操作'
                    }), 403
            
            # 将管理员对象添加到kwargs中
            kwargs['current_admin'] = admin
            return f(*args, **kwargs)
        
        return decorated_function
    
    return decorator


def readonly_check(f):
    """
    检查是否为只读管理员
    只读管理员不能执行修改操作
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' in session:
            admin = Admin.query.get(session['admin_id'])
            if admin and admin.role == 'readonly':
                if request.is_json:
                    return jsonify({
                        'success': False,
                        'message': '只读管理员无法执行此操作'
                    }), 403
                flash('只读管理员无法执行此操作', 'error')
                return redirect(request.referrer or url_for('admin_dashboard'))
        
        return f(*args, **kwargs)
    
    return decorated_function



