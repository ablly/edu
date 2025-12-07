"""
验证码模型
用于邮箱验证码的存储和管理
"""
from datetime import datetime
from models_membership import db

class VerificationCode(db.Model):
    """邮箱验证码模型"""
    __tablename__ = 'verification_codes'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False, index=True)
    code = db.Column(db.String(6), nullable=False)  # 6位数字验证码
    type = db.Column(db.String(20), nullable=False)  # 'reset_password', 'register'
    expires_at = db.Column(db.DateTime, nullable=False)  # 过期时间
    used = db.Column(db.Boolean, default=False)  # 是否已使用
    ip_address = db.Column(db.String(50))  # 请求IP
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<VerificationCode {self.email} - {self.code}>'
    
    def is_valid(self):
        """检查验证码是否有效（未过期且未使用）"""
        return not self.used and datetime.utcnow() < self.expires_at
    
    def mark_as_used(self):
        """标记验证码为已使用"""
        self.used = True
        db.session.commit()


