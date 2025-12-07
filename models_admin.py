"""
管理员系统数据模型
包含管理员账户、权限、操作日志等
"""

from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from models import db


class Admin(UserMixin, db.Model):
    """管理员账户模型"""
    __tablename__ = 'admins'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # 管理员信息
    real_name = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    avatar = db.Column(db.String(255))
    
    # 权限和状态
    role = db.Column(db.String(20), default='admin', nullable=False)  # admin, super_admin
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_super_admin = db.Column(db.Boolean, default=False, nullable=False)
    
    # 权限列表（JSON格式存储）
    permissions = db.Column(db.Text)  # JSON: ["user_manage", "order_manage", ...]
    
    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login_at = db.Column(db.DateTime)
    last_login_ip = db.Column(db.String(50))
    
    # 关系
    logs = db.relationship('AdminLog', backref='admin', lazy='dynamic')
    
    def set_password(self, password):
        """设置密码"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """验证密码"""
        return check_password_hash(self.password_hash, password)
    
    def has_permission(self, permission):
        """检查是否有特定权限"""
        if self.is_super_admin:
            return True
        
        if not self.permissions:
            return False
        
        import json
        try:
            perms = json.loads(self.permissions)
            return permission in perms
        except:
            return False
    
    def update_last_login(self, ip_address=None):
        """更新最后登录时间"""
        self.last_login_at = datetime.utcnow()
        if ip_address:
            self.last_login_ip = ip_address
        db.session.commit()
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'real_name': self.real_name,
            'phone': self.phone,
            'avatar': self.avatar,
            'role': self.role,
            'is_active': self.is_active,
            'is_super_admin': self.is_super_admin,
            'permissions': self.permissions,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None,
            'last_login_ip': self.last_login_ip
        }
    
    def __repr__(self):
        return f'<Admin {self.username}>'


class AdminLog(db.Model):
    """管理员操作日志"""
    __tablename__ = 'admin_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=False, index=True)
    
    # 操作信息
    action = db.Column(db.String(50), nullable=False, index=True)  # login, update_user, delete_order等
    module = db.Column(db.String(50), nullable=False, index=True)  # auth, user, order, membership等
    description = db.Column(db.Text)  # 操作描述
    
    # 目标对象
    target_type = db.Column(db.String(50))  # user, order, membership等
    target_id = db.Column(db.Integer)
    
    # 请求信息
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(255))
    request_method = db.Column(db.String(10))
    request_path = db.Column(db.String(255))
    
    # 操作结果
    status = db.Column(db.String(20), default='success')  # success, failure
    error_message = db.Column(db.Text)
    
    # 额外数据（JSON格式）
    extra_data = db.Column(db.Text)
    
    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'admin_username': self.admin.username if self.admin else None,
            'action': self.action,
            'module': self.module,
            'description': self.description,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'request_method': self.request_method,
            'request_path': self.request_path,
            'status': self.status,
            'error_message': self.error_message,
            'extra_data': self.extra_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<AdminLog {self.action} by Admin#{self.admin_id}>'


# 权限常量定义
class AdminPermission:
    """管理员权限常量"""
    # 用户管理
    USER_VIEW = 'user_view'
    USER_EDIT = 'user_edit'
    USER_DELETE = 'user_delete'
    USER_DISABLE = 'user_disable'
    
    # 会员管理
    MEMBERSHIP_VIEW = 'membership_view'
    MEMBERSHIP_EDIT = 'membership_edit'
    MEMBERSHIP_CREATE = 'membership_create'
    
    # 订单管理
    ORDER_VIEW = 'order_view'
    ORDER_EDIT = 'order_edit'
    ORDER_REFUND = 'order_refund'
    
    # 数据统计
    STATS_VIEW = 'stats_view'
    STATS_EXPORT = 'stats_export'
    
    # 系统设置
    SYSTEM_CONFIG = 'system_config'
    ADMIN_MANAGE = 'admin_manage'
    
    # 所有权限列表
    ALL_PERMISSIONS = [
        USER_VIEW, USER_EDIT, USER_DELETE, USER_DISABLE,
        MEMBERSHIP_VIEW, MEMBERSHIP_EDIT, MEMBERSHIP_CREATE,
        ORDER_VIEW, ORDER_EDIT, ORDER_REFUND,
        STATS_VIEW, STATS_EXPORT,
        SYSTEM_CONFIG, ADMIN_MANAGE
    ]
    
    # 权限描述
    PERMISSION_DESCRIPTIONS = {
        USER_VIEW: '查看用户',
        USER_EDIT: '编辑用户',
        USER_DELETE: '删除用户',
        USER_DISABLE: '禁用/启用用户',
        MEMBERSHIP_VIEW: '查看会员',
        MEMBERSHIP_EDIT: '编辑会员',
        MEMBERSHIP_CREATE: '手动开通会员',
        ORDER_VIEW: '查看订单',
        ORDER_EDIT: '编辑订单',
        ORDER_REFUND: '退款处理',
        STATS_VIEW: '查看统计',
        STATS_EXPORT: '导出数据',
        SYSTEM_CONFIG: '系统配置',
        ADMIN_MANAGE: '管理员管理'
    }


# 初始化管理员数据库表
def init_admin_tables():
    """初始化管理员相关表（需要在app context中调用）"""
    import json
    
    # 创建表
    db.create_all()
    
    created_admins = []
    
    # 1. 检查并创建超级管理员（zqh）
    super_admin = Admin.query.filter_by(username='zqh').first()
    if not super_admin:
        super_admin = Admin(
            username='zqh',
            email='3533912007@qq.com',
            real_name='超级管理员',
            role='super_admin',
            is_super_admin=True,
            is_active=True,
            permissions=json.dumps(AdminPermission.ALL_PERMISSIONS)
        )
        super_admin.set_password('Zqh050102@')
        db.session.add(super_admin)
        created_admins.append({
            'username': 'zqh',
            'password': 'Zqh050102@',
            'email': '3533912007@qq.com',
            'role': '超级管理员',
            'permissions': '全部权限'
        })
        print(f"✅ 已创建超级管理员账户: zqh")
    else:
        print(f"⚠️  超级管理员 zqh 已存在")
    
    # 2. 检查并创建只读管理员
    readonly_admin = Admin.query.filter_by(username='readonly').first()
    if not readonly_admin:
        # 只读权限：仅包含查看权限
        readonly_permissions = [
            AdminPermission.USER_VIEW,
            AdminPermission.MEMBERSHIP_VIEW,
            AdminPermission.ORDER_VIEW,
            AdminPermission.STATS_VIEW
        ]
        
        readonly_admin = Admin(
            username='readonly',
            email='readonly@edupilot.com',
            real_name='只读管理员',
            role='readonly',
            is_super_admin=False,
            is_active=True,
            permissions=json.dumps(readonly_permissions)
        )
        readonly_admin.set_password('Readonly@123')  # 默认密码
        db.session.add(readonly_admin)
        created_admins.append({
            'username': 'readonly',
            'password': 'Readonly@123',
            'email': 'readonly@edupilot.com',
            'role': '只读管理员',
            'permissions': '仅查看权限（用户/会员/订单/统计）'
        })
        print(f"✅ 已创建只读管理员账户: readonly")
    else:
        print(f"⚠️  只读管理员 readonly 已存在")
    
    # 提交事务
    if created_admins:
        db.session.commit()
        print(f"\n✨ 成功创建 {len(created_admins)} 个管理员账户")
    
    return created_admins


if __name__ == '__main__':
    # 测试脚本
    from app import app
    with app.app_context():
        init_admin_tables()
        print("\n✨ 管理员表初始化完成！")

