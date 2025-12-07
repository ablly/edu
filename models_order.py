"""
订单管理相关数据模型
包含订单表、退款记录表
"""

from datetime import datetime
# 从models导入db实例（避免循环导入）
from models import db


class Order(db.Model):
    """订单表"""
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(64), unique=True, nullable=False, index=True, comment='订单号')
    
    # 关联信息
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True, comment='用户ID')
    tier_id = db.Column(db.Integer, db.ForeignKey('membership_tiers.id', ondelete='SET NULL'), comment='套餐ID')
    
    # 金额信息
    amount = db.Column(db.Numeric(10, 2), nullable=False, comment='订单金额')
    original_amount = db.Column(db.Numeric(10, 2), comment='原价')
    discount_amount = db.Column(db.Numeric(10, 2), default=0, comment='优惠金额')
    
    # 支付信息
    payment_method = db.Column(db.String(20), nullable=False, index=True, comment='支付方式: alipay/wechat/bank_card/balance')
    transaction_id = db.Column(db.String(128), index=True, comment='第三方交易号')
    payment_url = db.Column(db.Text, comment='支付链接')
    
    # 状态信息
    status = db.Column(db.String(20), nullable=False, default='pending', index=True, comment='订单状态: pending/completed/failed/refunded/cancelled')
    
    # 备注信息
    notes = db.Column(db.Text, comment='订单备注')
    admin_notes = db.Column(db.Text, comment='管理员备注')
    
    # 时间信息
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True, comment='创建时间')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment='更新时间')
    completed_at = db.Column(db.DateTime, comment='完成时间')
    expired_at = db.Column(db.DateTime, comment='过期时间')
    
    # 会员关联
    membership_record_id = db.Column(db.Integer, db.ForeignKey('user_memberships.id', ondelete='SET NULL'), comment='会员记录ID')
    
    # 关系定义
    user = db.relationship('User', backref=db.backref('orders', lazy='dynamic'))
    tier = db.relationship('MembershipTier', backref=db.backref('orders', lazy='dynamic'))
    membership_record = db.relationship('UserMembership', backref=db.backref('order', uselist=False), foreign_keys=[membership_record_id])
    
    def __repr__(self):
        return f'<Order {self.order_number}>'
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'order_number': self.order_number,
            'user_id': self.user_id,
            'tier_id': self.tier_id,
            'amount': float(self.amount) if self.amount else 0,
            'original_amount': float(self.original_amount) if self.original_amount else None,
            'discount_amount': float(self.discount_amount) if self.discount_amount else 0,
            'payment_method': self.payment_method,
            'transaction_id': self.transaction_id,
            'payment_url': self.payment_url,
            'status': self.status,
            'notes': self.notes,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None,
            'completed_at': self.completed_at.strftime('%Y-%m-%d %H:%M:%S') if self.completed_at else None,
            'expired_at': self.expired_at.strftime('%Y-%m-%d %H:%M:%S') if self.expired_at else None,
            'membership_record_id': self.membership_record_id,
        }
    
    def to_detail_dict(self):
        """转换为详细字典（包含关联信息）"""
        data = self.to_dict()
        
        # 添加用户信息
        if self.user:
            data['user'] = {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'phone': getattr(self.user, 'phone', None),
            }
        
        # 添加套餐信息
        if self.tier:
            data['tier'] = {
                'id': self.tier.id,
                'name': self.tier.name,
                'price': float(self.tier.price) if self.tier.price else 0,
                'duration_days': self.tier.duration_days,
            }
        
        # 添加会员信息
        if self.membership_record:
            data['membership_info'] = {
                'record_id': self.membership_record.id,
                'start_date': self.membership_record.start_date.strftime('%Y-%m-%d') if self.membership_record.start_date else None,
                'end_date': self.membership_record.end_date.strftime('%Y-%m-%d') if self.membership_record.end_date else None,
                'is_active': self.membership_record.is_active,
            }
        
        return data


class OrderRefund(db.Model):
    """退款记录表"""
    __tablename__ = 'order_refunds'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True, comment='订单ID')
    
    # 退款金额
    amount = db.Column(db.Numeric(10, 2), nullable=False, comment='退款金额')
    
    # 退款原因
    reason = db.Column(db.String(200), nullable=False, comment='退款原因')
    description = db.Column(db.Text, comment='详细说明')
    
    # 审核信息
    status = db.Column(db.String(20), nullable=False, default='pending', index=True, comment='退款状态: pending/approved/rejected/completed')
    audit_notes = db.Column(db.Text, comment='审核备注')
    auditor_id = db.Column(db.Integer, comment='审核人ID')  # 外键关系通过字符串引用避免循环导入
    
    # 第三方退款信息
    refund_id = db.Column(db.String(128), index=True, comment='第三方退款单号')
    refund_transaction_id = db.Column(db.String(128), comment='退款交易号')
    
    # 时间信息
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, comment='申请时间')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment='更新时间')
    processed_at = db.Column(db.DateTime, comment='处理时间')
    completed_at = db.Column(db.DateTime, comment='完成时间')
    
    # 关系定义
    order = db.relationship('Order', backref=db.backref('refunds', lazy='dynamic'))
    # auditor 关系暂时注释，避免循环导入
    # auditor = db.relationship('Admin', backref=db.backref('refund_audits', lazy='dynamic'))
    
    def __repr__(self):
        return f'<OrderRefund {self.id} for Order {self.order_id}>'
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'amount': float(self.amount) if self.amount else 0,
            'reason': self.reason,
            'description': self.description,
            'status': self.status,
            'audit_notes': self.audit_notes,
            'auditor_id': self.auditor_id,
            'refund_id': self.refund_id,
            'refund_transaction_id': self.refund_transaction_id,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None,
            'processed_at': self.processed_at.strftime('%Y-%m-%d %H:%M:%S') if self.processed_at else None,
            'completed_at': self.completed_at.strftime('%Y-%m-%d %H:%M:%S') if self.completed_at else None,
        }
    
    def to_detail_dict(self):
        """转换为详细字典（包含关联信息）"""
        data = self.to_dict()
        
        # 添加订单信息
        if self.order:
            data['order'] = self.order.to_dict()
        
        # 添加审核人信息（通过ID查询，避免关系依赖）
        if self.auditor_id:
            from models_admin import Admin
            auditor = Admin.query.get(self.auditor_id)
            if auditor:
                data['auditor'] = {
                    'id': auditor.id,
                    'username': auditor.username,
                }
        
        return data

