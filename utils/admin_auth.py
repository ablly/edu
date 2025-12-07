"""
管理员认证工具
提供管理员登录、权限检查等辅助功能
"""

from flask import session
from models_admin import Admin, AdminPermission
from models import db
import json
from datetime import datetime


def get_current_admin():
    """
    获取当前登录的管理员
    返回:
        Admin对象或None
    """
    if 'admin_id' not in session:
        return None
    
    admin = Admin.query.get(session['admin_id'])
    if admin and admin.is_active:
        return admin
    
    return None


def check_admin_permission(permission):
    """
    检查当前管理员是否有指定权限
    参数:
        permission: 权限名称
    返回:
        bool: True表示有权限，False表示无权限
    """
    admin = get_current_admin()
    if not admin:
        return False
    
    # 超级管理员拥有所有权限
    if admin.is_super_admin:
        return True
    
    # 检查管理员权限列表
    admin_permissions = json.loads(admin.permissions or '[]')
    return permission in admin_permissions


def get_admin_permissions():
    """
    获取当前管理员的所有权限
    返回:
        list: 权限名称列表
    """
    admin = get_current_admin()
    if not admin:
        return []
    
    if admin.is_super_admin:
        return AdminPermission.ALL_PERMISSIONS
    
    return json.loads(admin.permissions or '[]')


def has_any_permission(permissions):
    """
    检查当前管理员是否拥有列表中的任意一个权限
    参数:
        permissions: 权限名称列表
    返回:
        bool: True表示至少有一个权限，False表示没有权限
    """
    admin_permissions = get_admin_permissions()
    return any(p in admin_permissions for p in permissions)


def has_all_permissions(permissions):
    """
    检查当前管理员是否拥有列表中的所有权限
    参数:
        permissions: 权限名称列表
    返回:
        bool: True表示拥有所有权限，False表示缺少权限
    """
    admin_permissions = get_admin_permissions()
    return all(p in admin_permissions for p in permissions)


def is_super_admin():
    """
    检查当前管理员是否为超级管理员
    返回:
        bool: True表示是超级管理员，False表示不是
    """
    admin = get_current_admin()
    return admin and admin.is_super_admin


def is_readonly_admin():
    """
    检查当前管理员是否为只读管理员
    返回:
        bool: True表示是只读管理员，False表示不是
    """
    admin = get_current_admin()
    return admin and admin.role == 'readonly'


def can_modify():
    """
    检查当前管理员是否可以执行修改操作
    只读管理员不能修改数据
    返回:
        bool: True表示可以修改，False表示不能修改
    """
    return not is_readonly_admin()


def admin_login(admin):
    """
    管理员登录
    参数:
        admin: Admin对象
    """
    session['admin_id'] = admin.id
    session['admin_username'] = admin.username
    session['admin_role'] = admin.role
    
    # 更新最后登录时间和IP
    from flask import request
    admin.last_login_at = datetime.now()
    admin.last_login_ip = request.remote_addr
    db.session.commit()


def admin_logout():
    """
    管理员退出登录
    """
    session.pop('admin_id', None)
    session.pop('admin_username', None)
    session.pop('admin_role', None)


def get_permission_display_name(permission):
    """
    获取权限的显示名称（中文）
    参数:
        permission: 权限名称
    返回:
        str: 权限的中文显示名称
    """
    permission_names = {
        # 用户管理
        AdminPermission.USER_VIEW: '查看用户',
        AdminPermission.USER_EDIT: '编辑用户',
        AdminPermission.USER_DELETE: '删除用户',
        
        # 会员管理
        AdminPermission.MEMBERSHIP_VIEW: '查看会员',
        AdminPermission.MEMBERSHIP_EDIT: '编辑会员',
        AdminPermission.MEMBERSHIP_CREATE: '创建会员',
        
        # 订单管理
        AdminPermission.ORDER_VIEW: '查看订单',
        AdminPermission.ORDER_EDIT: '编辑订单',
        AdminPermission.ORDER_REFUND: '订单退款',
        
        # 统计功能
        AdminPermission.STATS_VIEW: '查看统计',
        AdminPermission.STATS_EXPORT: '导出统计',
        
        # 系统管理
        AdminPermission.SYSTEM_CONFIG: '系统配置',
        AdminPermission.ADMIN_MANAGE: '管理员管理',
        AdminPermission.LOG_VIEW: '查看日志',
        AdminPermission.LOG_DELETE: '删除日志',
    }
    
    return permission_names.get(permission, permission)


def get_role_display_name(role):
    """
    获取角色的显示名称（中文）
    参数:
        role: 角色名称
    返回:
        str: 角色的中文显示名称
    """
    role_names = {
        'super_admin': '超级管理员',
        'admin': '管理员',
        'readonly': '只读管理员',
    }
    
    return role_names.get(role, role)


def format_admin_info(admin):
    """
    格式化管理员信息为字典
    参数:
        admin: Admin对象
    返回:
        dict: 管理员信息字典
    """
    if not admin:
        return None
    
    return {
        'id': admin.id,
        'username': admin.username,
        'email': admin.email,
        'real_name': admin.real_name,
        'role': admin.role,
        'role_display': get_role_display_name(admin.role),
        'is_super_admin': admin.is_super_admin,
        'is_active': admin.is_active,
        'permissions': json.loads(admin.permissions or '[]'),
        'last_login_at': admin.last_login_at.strftime('%Y-%m-%d %H:%M:%S') if admin.last_login_at else None,
        'last_login_ip': admin.last_login_ip,
        'created_at': admin.created_at.strftime('%Y-%m-%d %H:%M:%S'),
    }


def check_login_attempts(username, ip_address):
    """
    检查登录尝试次数
    防止暴力破解
    参数:
        username: 用户名
        ip_address: IP地址
    返回:
        tuple: (是否可以登录, 剩余尝试次数)
    """
    from models import LoginAttempt
    from datetime import timedelta
    
    # 检查最近15分钟的登录尝试
    recent_time = datetime.now() - timedelta(minutes=15)
    
    attempts = LoginAttempt.query.filter(
        LoginAttempt.username == username,
        LoginAttempt.attempted_at > recent_time,
        LoginAttempt.success == False
    ).count()
    
    max_attempts = 5
    remaining = max_attempts - attempts
    
    if remaining <= 0:
        return False, 0
    
    return True, remaining


def record_admin_login_attempt(username, ip_address, success):
    """
    记录管理员登录尝试
    参数:
        username: 用户名
        ip_address: IP地址
        success: 是否成功
    """
    from models import LoginAttempt
    from flask import request
    
    attempt = LoginAttempt(
        username=username,
        ip_address=ip_address,
        user_agent=request.user_agent.string[:200] if request.user_agent else None,
        success=success
    )
    db.session.add(attempt)
    db.session.commit()


def get_admin_context():
    """
    获取管理员上下文信息
    用于在模板中使用
    返回:
        dict: 包含管理员信息和权限的字典
    """
    admin = get_current_admin()
    if not admin:
        return {
            'is_logged_in': False,
            'admin': None,
            'permissions': [],
            'is_super_admin': False,
            'can_modify': False,
        }
    
    return {
        'is_logged_in': True,
        'admin': format_admin_info(admin),
        'permissions': get_admin_permissions(),
        'is_super_admin': admin.is_super_admin,
        'can_modify': can_modify(),
    }

