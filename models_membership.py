"""
会员系统数据模型
包含用户、会员等级、支付交易、使用记录等模型
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import json
import uuid

# 使用主models.py中的db实例
from models import db


class User(db.Model):
    """用户表"""
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    
    # 用户信息
    full_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    avatar = db.Column(db.String(255))
    
    # 状态
    is_active = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)
    
    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # 关联关系
    memberships = db.relationship('UserMembership', backref='user', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('PaymentTransaction', backref='user', lazy=True, cascade='all, delete-orphan')
    usage_logs = db.relationship('UsageLog', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'avatar': self.avatar,
            'is_active': self.is_active,
            'is_admin': self.is_admin,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'last_login': self.last_login.strftime('%Y-%m-%d %H:%M:%S') if self.last_login else None
        }

    def set_password(self, password):
        """设置密码（使用werkzeug加密）"""
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """验证密码"""
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)
    
    # Flask-Login required methods
    @property
    def is_authenticated(self):
        """用户是否已认证"""
        return True
    
    @property
    def is_anonymous(self):
        """是否为匿名用户"""
        return False
    
    def get_id(self):
        """获取用户ID（Flask-Login需要）"""
        return str(self.id)
    
    def get_current_membership(self):
        """获取当前有效的会员"""
        active_membership = UserMembership.query.filter_by(
            user_id=self.id,
            is_active=True
        ).filter(
            UserMembership.end_date > datetime.utcnow()
        ).first()
        
        return active_membership
    
    def has_permission(self, feature_code):
        """检查是否有权限访问某个功能"""
        membership = self.get_current_membership()
        if not membership:
            # 免费用户
            free_tier = MembershipTier.query.filter_by(code='free').first()
            if free_tier:
                permissions = json.loads(free_tier.permissions) if free_tier.permissions else {}
                return feature_code in permissions.get('allowed_features', [])
            return False
        
        # 检查会员权限
        if membership.tier:
            permissions = json.loads(membership.tier.permissions) if membership.tier.permissions else {}
            return feature_code in permissions.get('allowed_features', [])
        
        return False
    
    def get_usage_count(self, feature_code, period='daily'):
        """获取功能使用次数
        
        Args:
            feature_code: 功能代码
            period: 时间周期 ('daily', 'weekly', 'monthly')
        
        Returns:
            int: 使用次数
        """
        from datetime import timedelta
        
        now = datetime.utcnow()
        if period == 'daily':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'weekly':
            start_date = now - timedelta(days=7)
        elif period == 'monthly':
            start_date = now - timedelta(days=30)
        else:
            start_date = now - timedelta(days=1)
        
        count = UsageLog.query.filter(
            UsageLog.user_id == self.id,
            UsageLog.feature_code == feature_code,
            UsageLog.created_at >= start_date
        ).count()
        
        return count


class MembershipTier(db.Model):
    """会员等级表"""
    __tablename__ = 'membership_tiers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)  # 免费/周会员/月会员/年会员
    code = db.Column(db.String(20), unique=True, nullable=False)  # free/weekly/monthly/yearly
    level = db.Column(db.Integer, default=0)  # 会员等级：0=免费，1=周会员，2=月会员，3=年会员
    
    # 定价
    price = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(10), default='CNY')
    
    # 时长（天数）
    duration_days = db.Column(db.Integer, default=0)
    
    # 权限配置（JSON格式存储）
    permissions = db.Column(db.Text)  # {"allowed_features": [], "limits": {}}
    
    # 描述
    description = db.Column(db.Text)
    features = db.Column(db.Text)  # JSON格式存储功能列表
    
    # 状态
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    
    # 限量和早鸟优惠
    is_limited = db.Column(db.Boolean, default=False)         # 是否限量
    total_quota = db.Column(db.Integer, default=0)            # 总名额（0表示无限）
    sold_count = db.Column(db.Integer, default=0)             # 已售数量
    min_order = db.Column(db.Integer, default=0)              # 最小订单序号（如第1位）
    max_order = db.Column(db.Integer, default=0)              # 最大订单序号（如第10位）
    is_early_bird = db.Column(db.Boolean, default=False)      # 是否早鸟优惠
    early_bird_tier = db.Column(db.Integer, default=0)        # 早鸟档位（1/2/3）
    original_price = db.Column(db.Float, default=0.0)         # 原价（用于显示优惠幅度）
    
    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'level': self.level,
            'price': self.price,
            'currency': self.currency,
            'duration_days': self.duration_days,
            'permissions': json.loads(self.permissions) if self.permissions else {},
            'features': json.loads(self.features) if self.features else [],
            'description': self.description,
            'is_active': self.is_active,
            'is_limited': self.is_limited,
            'total_quota': self.total_quota,
            'sold_count': self.sold_count,
            'remaining': self.total_quota - self.sold_count if self.is_limited else -1,
            'is_early_bird': self.is_early_bird,
            'early_bird_tier': self.early_bird_tier,
            'original_price': self.original_price,
            'discount': self.original_price - self.price if self.original_price > 0 else 0
        }


class UserMembership(db.Model):
    """用户会员记录表"""
    __tablename__ = 'user_memberships'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    tier_id = db.Column(db.Integer, db.ForeignKey('membership_tiers.id'), nullable=False)
    
    # 会员期限
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    
    # 状态
    is_active = db.Column(db.Boolean, default=True)
    auto_renew = db.Column(db.Boolean, default=False)
    
    # 关联的支付
    payment_id = db.Column(db.Integer, db.ForeignKey('payment_transactions.id'))
    
    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    tier = db.relationship('MembershipTier', backref='user_memberships')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'tier': self.tier.to_dict() if self.tier else None,
            'start_date': self.start_date.strftime('%Y-%m-%d %H:%M:%S'),
            'end_date': self.end_date.strftime('%Y-%m-%d %H:%M:%S'),
            'is_active': self.is_active,
            'auto_renew': self.auto_renew,
            'days_remaining': (self.end_date - datetime.utcnow()).days if self.end_date > datetime.utcnow() else 0
        }


class PaymentTransaction(db.Model):
    """支付交易记录表"""
    __tablename__ = 'payment_transactions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # 交易信息
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)  # 外部交易ID
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='CNY')
    
    # 支付方式
    payment_method = db.Column(db.String(50))  # wechat/alipay/card/simulated
    
    # 购买的会员
    tier_id = db.Column(db.Integer, db.ForeignKey('membership_tiers.id'), nullable=False)
    
    # 状态
    status = db.Column(db.String(20), default='pending')  # pending/completed/failed/refunded
    
    # 支付二维码URL（模拟支付用）
    qr_code_url = db.Column(db.Text, nullable=True)
    
    # 支付宝相关
    alipay_trade_no = db.Column(db.String(100))           # 支付宝交易号
    payment_url = db.Column(db.Text)                      # 支付链接（跳转URL）
    return_url = db.Column(db.Text)                       # 同步回调地址
    notify_url = db.Column(db.Text)                       # 异步回调地址
    callback_data = db.Column(db.Text)                    # 回调原始数据（JSON）
    expires_at = db.Column(db.DateTime)                   # 订单过期时间
    
    # 备注
    note = db.Column(db.Text)
    
    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # 关联关系
    tier = db.relationship('MembershipTier', backref='payments')

    def to_dict(self):
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'amount': self.amount,
            'currency': self.currency,
            'payment_method': self.payment_method,
            'tier': self.tier.to_dict() if self.tier else None,
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'completed_at': self.completed_at.strftime('%Y-%m-%d %H:%M:%S') if self.completed_at else None
        }


class UsageLog(db.Model):
    """功能使用记录表"""
    __tablename__ = 'usage_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # 功能类型
    feature_code = db.Column(db.String(50), nullable=False)  # ai_ask/generate_question/etc
    
    # 使用详情
    action = db.Column(db.String(100))  # 具体操作
    details = db.Column(db.Text)  # JSON格式存储详细信息
    
    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 索引（用于快速查询）
    __table_args__ = (
        db.Index('idx_user_feature_date', 'user_id', 'feature_code', 'created_at'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'feature_code': self.feature_code,
            'action': self.action,
            'details': json.loads(self.details) if self.details else {},
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

