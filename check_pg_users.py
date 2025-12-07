#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""检查PostgreSQL中的用户数据"""

from app import app, db
from models_membership import User, UserMembership, MembershipTier

def check_users():
    with app.app_context():
        print("\n=== 检查PostgreSQL用户数据 ===")
        
        # 检查用户总数
        total_users = User.query.count()
        print(f"\n总用户数: {total_users}")
        
        if total_users == 0:
            print("\n❌ PostgreSQL中没有用户数据！")
            print("\n正在创建测试用户...")
            
            # 创建测试用户
            test_user = User(
                username='testuser',
                email='test@example.com',
                is_active=True
            )
            test_user.set_password('Test123456')
            db.session.add(test_user)
            
            test_user2 = User(
                username='周启航',
                email='zqh@example.com',
                is_active=True
            )
            test_user2.set_password('zqh050102')
            db.session.add(test_user2)
            
            db.session.commit()
            print("✅ 已创建2个测试用户")
            
            # 重新查询
            total_users = User.query.count()
            print(f"\n更新后的总用户数: {total_users}")
        
        # 显示所有用户
        users = User.query.limit(10).all()
        print("\n前10个用户:")
        for user in users:
            membership = UserMembership.query.filter_by(
                user_id=user.id,
                is_active=True
            ).first()
            
            print(f"  ID: {user.id}")
            print(f"  用户名: {user.username}")
            print(f"  邮箱: {user.email}")
            print(f"  状态: {'激活' if user.is_active else '未激活'}")
            print(f"  会员: {membership.tier.name if membership else '无'}")
            print(f"  创建时间: {user.created_at}")
            print("  " + "-" * 40)

if __name__ == '__main__':
    check_users()


