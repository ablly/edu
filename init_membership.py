#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
初始化会员系统
创建会员等级、测试用户等
"""

import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(__file__))

from flask import Flask
from models import db
from models_membership import User, MembershipTier, UserMembership, PaymentTransaction
from config import Config
import json


def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    return app


def init_membership_tiers(app):
    """初始化会员等级"""
    with app.app_context():
        print("正在初始化会员等级...")
        
        # 先删除旧数据
        try:
            MembershipTier.query.delete()
            db.session.commit()
            print("已清除旧的会员等级数据")
        except Exception as e:
            print(f"清除旧数据时出错: {e}")
            db.session.rollback()
        
        # 免费会员
        free_tier = MembershipTier(
            name='免费用户',
            code='free',
            level=0,
            price=0.0,
            duration_days=0,
            permissions=json.dumps({
                'allowed_features': ['ai_ask'],  # 只允许AI答疑
                'limits': {
                    'ai_ask_daily': 3,  # 每天3次
                    'student_limit': 0  # 不能使用学生管理
                }
            }),
            features=json.dumps([
                '基础AI答疑（每天3次）',
                '查看系统介绍'
            ]),
            description='免费用户，体验基础功能',
            is_active=True,
            sort_order=0
        )
        
        # 周会员
        weekly_tier = MembershipTier(
            name='周会员',
            code='weekly',
            level=1,
            price=19.9,
            duration_days=7,
            permissions=json.dumps({
                'allowed_features': ['ai_ask', 'students', 'submit', 'scores'],
                'limits': {
                    'ai_ask_weekly': 50,
                    'submit_weekly': 10,
                    'student_limit': 50
                }
            }),
            features=json.dumps([
                'AI答疑（50次/周）',
                '学生管理（50人）',
                '作业提交（10次/周）',
                '成绩查询'
            ]),
            description='适合个人教师或小班教学',
            is_active=True,
            sort_order=1
        )
        
        # 月会员
        monthly_tier = MembershipTier(
            name='月会员',
            code='monthly',
            level=2,
            price=59.9,
            duration_days=30,
            permissions=json.dumps({
                'allowed_features': ['ai_ask', 'students', 'submit', 'scores', 
                                   'generate_question', 'generate_lecture', 'progress'],
                'limits': {
                    'ai_ask_monthly': 200,
                    'generate_question_monthly': 30,
                    'generate_lecture_monthly': 20,
                    'student_limit': 200
                }
            }),
            features=json.dumps([
                'AI答疑（200次/月）',
                '学生管理（200人）',
                '作业提交（不限次数）',
                '成绩查询和分析',
                '智能出题（30次/月）',
                '智能讲义（20次/月）'
            ]),
            description='适合中小型培训机构',
            is_active=True,
            sort_order=2
        )
        
        # 年会员
        yearly_tier = MembershipTier(
            name='年会员',
            code='yearly',
            level=3,
            price=499.0,
            duration_days=365,
            permissions=json.dumps({
                'allowed_features': ['ai_ask', 'students', 'submit', 'scores', 
                                   'generate_question', 'generate_lecture', 'progress',
                                   'auxiliary', 'video_summary', 'export_data', 'api_access'],
                'limits': {}  # 无限制
            }),
            features=json.dumps([
                '所有功能无限制使用',
                'AI答疑（不限次数）',
                '学生管理（不限人数）',
                '作业提交（不限次数）',
                '智能出题（不限次数）',
                '智能讲义（不限次数）',
                '辅助编程',
                '视频总结',
                '数据导出',
                'API访问权限',
                '优先技术支持'
            ]),
            description='适合大型教育机构，享受所有高级功能',
            is_active=True,
            sort_order=3
        )
        
        db.session.add_all([free_tier, weekly_tier, monthly_tier, yearly_tier])
        db.session.commit()
        
        print("✅ 成功创建4个会员等级:")
        print(f"  - {free_tier.name}: {free_tier.price}元")
        print(f"  - {weekly_tier.name}: {weekly_tier.price}元/周")
        print(f"  - {monthly_tier.name}: {monthly_tier.price}元/月")
        print(f"  - {yearly_tier.name}: {yearly_tier.price}元/年")


def create_test_users(app):
    """创建测试用户"""
    with app.app_context():
        print("\n正在创建测试用户...")
        
        # 检查是否已存在
        if User.query.first():
            print("测试用户已存在，跳过创建")
            return
        
        # 管理员用户
        admin = User(
            username='admin',
            email='admin@edupilot.com',
            full_name='系统管理员',
            is_admin=True
        )
        admin.set_password('admin123')
        
        # 测试用户1 - 免费用户
        user1 = User(
            username='test_user',
            email='test@example.com',
            full_name='测试用户'
        )
        user1.set_password('test123')
        
        # 测试用户2 - 月会员
        user2 = User(
            username='monthly_user',
            email='monthly@example.com',
            full_name='月会员用户'
        )
        user2.set_password('test123')
        
        db.session.add_all([admin, user1, user2])
        db.session.commit()
        
        print("✅ 成功创建测试用户:")
        print(f"  - 管理员: admin / admin123")
        print(f"  - 免费用户: test_user / test123")
        print(f"  - 月会员: monthly_user / test123")
        
        # 为月会员用户添加会员记录
        monthly_tier = MembershipTier.query.filter_by(code='monthly').first()
        if monthly_tier:
            membership = UserMembership(
                user_id=user2.id,
                tier_id=monthly_tier.id,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=30),
                is_active=True
            )
            db.session.add(membership)
            db.session.commit()
            print(f"  - 已为 monthly_user 开通月会员（30天）")


def main():
    """主函数"""
    print("="*50)
    print("初始化会员系统")
    print("="*50)
    
    app = create_app()
    
    with app.app_context():
        # 创建所有表
        print("\n创建数据库表...")
        db.create_all()
        print("✅ 数据库表创建完成")
        
        # 初始化会员等级
        init_membership_tiers(app)
        
        # 创建测试用户
        create_test_users(app)
        
        print("\n" + "="*50)
        print("✅ 会员系统初始化完成！")
        print("="*50)
        print("\n🎯 测试账号:")
        print("  管理员: admin / admin123")
        print("  免费用户: test_user / test123")
        print("  月会员: monthly_user / test123")
        print("\n📊 会员等级:")
        tiers = MembershipTier.query.order_by(MembershipTier.sort_order).all()
        for tier in tiers:
            print(f"  - {tier.name}: {tier.price}元 ({tier.duration_days}天)")


if __name__ == "__main__":
    main()


"""
初始化会员系统
创建会员等级、测试用户等
"""

import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(__file__))

from flask import Flask
from models import db
from models_membership import User, MembershipTier, UserMembership, PaymentTransaction
from config import Config
import json


def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    return app


def init_membership_tiers(app):
    """初始化会员等级"""
    with app.app_context():
        print("正在初始化会员等级...")
        
        # 先删除旧数据
        try:
            MembershipTier.query.delete()
            db.session.commit()
            print("已清除旧的会员等级数据")
        except Exception as e:
            print(f"清除旧数据时出错: {e}")
            db.session.rollback()
        
        # 免费会员
        free_tier = MembershipTier(
            name='免费用户',
            code='free',
            level=0,
            price=0.0,
            duration_days=0,
            permissions=json.dumps({
                'allowed_features': ['ai_ask'],  # 只允许AI答疑
                'limits': {
                    'ai_ask_daily': 3,  # 每天3次
                    'student_limit': 0  # 不能使用学生管理
                }
            }),
            features=json.dumps([
                '基础AI答疑（每天3次）',
                '查看系统介绍'
            ]),
            description='免费用户，体验基础功能',
            is_active=True,
            sort_order=0
        )
        
        # 周会员
        weekly_tier = MembershipTier(
            name='周会员',
            code='weekly',
            level=1,
            price=19.9,
            duration_days=7,
            permissions=json.dumps({
                'allowed_features': ['ai_ask', 'students', 'submit', 'scores'],
                'limits': {
                    'ai_ask_weekly': 50,
                    'submit_weekly': 10,
                    'student_limit': 50
                }
            }),
            features=json.dumps([
                'AI答疑（50次/周）',
                '学生管理（50人）',
                '作业提交（10次/周）',
                '成绩查询'
            ]),
            description='适合个人教师或小班教学',
            is_active=True,
            sort_order=1
        )
        
        # 月会员
        monthly_tier = MembershipTier(
            name='月会员',
            code='monthly',
            level=2,
            price=59.9,
            duration_days=30,
            permissions=json.dumps({
                'allowed_features': ['ai_ask', 'students', 'submit', 'scores', 
                                   'generate_question', 'generate_lecture', 'progress'],
                'limits': {
                    'ai_ask_monthly': 200,
                    'generate_question_monthly': 30,
                    'generate_lecture_monthly': 20,
                    'student_limit': 200
                }
            }),
            features=json.dumps([
                'AI答疑（200次/月）',
                '学生管理（200人）',
                '作业提交（不限次数）',
                '成绩查询和分析',
                '智能出题（30次/月）',
                '智能讲义（20次/月）'
            ]),
            description='适合中小型培训机构',
            is_active=True,
            sort_order=2
        )
        
        # 年会员
        yearly_tier = MembershipTier(
            name='年会员',
            code='yearly',
            level=3,
            price=499.0,
            duration_days=365,
            permissions=json.dumps({
                'allowed_features': ['ai_ask', 'students', 'submit', 'scores', 
                                   'generate_question', 'generate_lecture', 'progress',
                                   'auxiliary', 'video_summary', 'export_data', 'api_access'],
                'limits': {}  # 无限制
            }),
            features=json.dumps([
                '所有功能无限制使用',
                'AI答疑（不限次数）',
                '学生管理（不限人数）',
                '作业提交（不限次数）',
                '智能出题（不限次数）',
                '智能讲义（不限次数）',
                '辅助编程',
                '视频总结',
                '数据导出',
                'API访问权限',
                '优先技术支持'
            ]),
            description='适合大型教育机构，享受所有高级功能',
            is_active=True,
            sort_order=3
        )
        
        db.session.add_all([free_tier, weekly_tier, monthly_tier, yearly_tier])
        db.session.commit()
        
        print("✅ 成功创建4个会员等级:")
        print(f"  - {free_tier.name}: {free_tier.price}元")
        print(f"  - {weekly_tier.name}: {weekly_tier.price}元/周")
        print(f"  - {monthly_tier.name}: {monthly_tier.price}元/月")
        print(f"  - {yearly_tier.name}: {yearly_tier.price}元/年")


def create_test_users(app):
    """创建测试用户"""
    with app.app_context():
        print("\n正在创建测试用户...")
        
        # 检查是否已存在
        if User.query.first():
            print("测试用户已存在，跳过创建")
            return
        
        # 管理员用户
        admin = User(
            username='admin',
            email='admin@edupilot.com',
            full_name='系统管理员',
            is_admin=True
        )
        admin.set_password('admin123')
        
        # 测试用户1 - 免费用户
        user1 = User(
            username='test_user',
            email='test@example.com',
            full_name='测试用户'
        )
        user1.set_password('test123')
        
        # 测试用户2 - 月会员
        user2 = User(
            username='monthly_user',
            email='monthly@example.com',
            full_name='月会员用户'
        )
        user2.set_password('test123')
        
        db.session.add_all([admin, user1, user2])
        db.session.commit()
        
        print("✅ 成功创建测试用户:")
        print(f"  - 管理员: admin / admin123")
        print(f"  - 免费用户: test_user / test123")
        print(f"  - 月会员: monthly_user / test123")
        
        # 为月会员用户添加会员记录
        monthly_tier = MembershipTier.query.filter_by(code='monthly').first()
        if monthly_tier:
            membership = UserMembership(
                user_id=user2.id,
                tier_id=monthly_tier.id,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=30),
                is_active=True
            )
            db.session.add(membership)
            db.session.commit()
            print(f"  - 已为 monthly_user 开通月会员（30天）")


def main():
    """主函数"""
    print("="*50)
    print("初始化会员系统")
    print("="*50)
    
    app = create_app()
    
    with app.app_context():
        # 创建所有表
        print("\n创建数据库表...")
        db.create_all()
        print("✅ 数据库表创建完成")
        
        # 初始化会员等级
        init_membership_tiers(app)
        
        # 创建测试用户
        create_test_users(app)
        
        print("\n" + "="*50)
        print("✅ 会员系统初始化完成！")
        print("="*50)
        print("\n🎯 测试账号:")
        print("  管理员: admin / admin123")
        print("  免费用户: test_user / test123")
        print("  月会员: monthly_user / test123")
        print("\n📊 会员等级:")
        tiers = MembershipTier.query.order_by(MembershipTier.sort_order).all()
        for tier in tiers:
            print(f"  - {tier.name}: {tier.price}元 ({tier.duration_days}天)")


if __name__ == "__main__":
    main()












"""
初始化会员系统
创建会员等级、测试用户等
"""

import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(__file__))

from flask import Flask
from models import db
from models_membership import User, MembershipTier, UserMembership, PaymentTransaction
from config import Config
import json


def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    return app


def init_membership_tiers(app):
    """初始化会员等级"""
    with app.app_context():
        print("正在初始化会员等级...")
        
        # 先删除旧数据
        try:
            MembershipTier.query.delete()
            db.session.commit()
            print("已清除旧的会员等级数据")
        except Exception as e:
            print(f"清除旧数据时出错: {e}")
            db.session.rollback()
        
        # 免费会员
        free_tier = MembershipTier(
            name='免费用户',
            code='free',
            level=0,
            price=0.0,
            duration_days=0,
            permissions=json.dumps({
                'allowed_features': ['ai_ask'],  # 只允许AI答疑
                'limits': {
                    'ai_ask_daily': 3,  # 每天3次
                    'student_limit': 0  # 不能使用学生管理
                }
            }),
            features=json.dumps([
                '基础AI答疑（每天3次）',
                '查看系统介绍'
            ]),
            description='免费用户，体验基础功能',
            is_active=True,
            sort_order=0
        )
        
        # 周会员
        weekly_tier = MembershipTier(
            name='周会员',
            code='weekly',
            level=1,
            price=19.9,
            duration_days=7,
            permissions=json.dumps({
                'allowed_features': ['ai_ask', 'students', 'submit', 'scores'],
                'limits': {
                    'ai_ask_weekly': 50,
                    'submit_weekly': 10,
                    'student_limit': 50
                }
            }),
            features=json.dumps([
                'AI答疑（50次/周）',
                '学生管理（50人）',
                '作业提交（10次/周）',
                '成绩查询'
            ]),
            description='适合个人教师或小班教学',
            is_active=True,
            sort_order=1
        )
        
        # 月会员
        monthly_tier = MembershipTier(
            name='月会员',
            code='monthly',
            level=2,
            price=59.9,
            duration_days=30,
            permissions=json.dumps({
                'allowed_features': ['ai_ask', 'students', 'submit', 'scores', 
                                   'generate_question', 'generate_lecture', 'progress'],
                'limits': {
                    'ai_ask_monthly': 200,
                    'generate_question_monthly': 30,
                    'generate_lecture_monthly': 20,
                    'student_limit': 200
                }
            }),
            features=json.dumps([
                'AI答疑（200次/月）',
                '学生管理（200人）',
                '作业提交（不限次数）',
                '成绩查询和分析',
                '智能出题（30次/月）',
                '智能讲义（20次/月）'
            ]),
            description='适合中小型培训机构',
            is_active=True,
            sort_order=2
        )
        
        # 年会员
        yearly_tier = MembershipTier(
            name='年会员',
            code='yearly',
            level=3,
            price=499.0,
            duration_days=365,
            permissions=json.dumps({
                'allowed_features': ['ai_ask', 'students', 'submit', 'scores', 
                                   'generate_question', 'generate_lecture', 'progress',
                                   'auxiliary', 'video_summary', 'export_data', 'api_access'],
                'limits': {}  # 无限制
            }),
            features=json.dumps([
                '所有功能无限制使用',
                'AI答疑（不限次数）',
                '学生管理（不限人数）',
                '作业提交（不限次数）',
                '智能出题（不限次数）',
                '智能讲义（不限次数）',
                '辅助编程',
                '视频总结',
                '数据导出',
                'API访问权限',
                '优先技术支持'
            ]),
            description='适合大型教育机构，享受所有高级功能',
            is_active=True,
            sort_order=3
        )
        
        db.session.add_all([free_tier, weekly_tier, monthly_tier, yearly_tier])
        db.session.commit()
        
        print("✅ 成功创建4个会员等级:")
        print(f"  - {free_tier.name}: {free_tier.price}元")
        print(f"  - {weekly_tier.name}: {weekly_tier.price}元/周")
        print(f"  - {monthly_tier.name}: {monthly_tier.price}元/月")
        print(f"  - {yearly_tier.name}: {yearly_tier.price}元/年")


def create_test_users(app):
    """创建测试用户"""
    with app.app_context():
        print("\n正在创建测试用户...")
        
        # 检查是否已存在
        if User.query.first():
            print("测试用户已存在，跳过创建")
            return
        
        # 管理员用户
        admin = User(
            username='admin',
            email='admin@edupilot.com',
            full_name='系统管理员',
            is_admin=True
        )
        admin.set_password('admin123')
        
        # 测试用户1 - 免费用户
        user1 = User(
            username='test_user',
            email='test@example.com',
            full_name='测试用户'
        )
        user1.set_password('test123')
        
        # 测试用户2 - 月会员
        user2 = User(
            username='monthly_user',
            email='monthly@example.com',
            full_name='月会员用户'
        )
        user2.set_password('test123')
        
        db.session.add_all([admin, user1, user2])
        db.session.commit()
        
        print("✅ 成功创建测试用户:")
        print(f"  - 管理员: admin / admin123")
        print(f"  - 免费用户: test_user / test123")
        print(f"  - 月会员: monthly_user / test123")
        
        # 为月会员用户添加会员记录
        monthly_tier = MembershipTier.query.filter_by(code='monthly').first()
        if monthly_tier:
            membership = UserMembership(
                user_id=user2.id,
                tier_id=monthly_tier.id,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=30),
                is_active=True
            )
            db.session.add(membership)
            db.session.commit()
            print(f"  - 已为 monthly_user 开通月会员（30天）")


def main():
    """主函数"""
    print("="*50)
    print("初始化会员系统")
    print("="*50)
    
    app = create_app()
    
    with app.app_context():
        # 创建所有表
        print("\n创建数据库表...")
        db.create_all()
        print("✅ 数据库表创建完成")
        
        # 初始化会员等级
        init_membership_tiers(app)
        
        # 创建测试用户
        create_test_users(app)
        
        print("\n" + "="*50)
        print("✅ 会员系统初始化完成！")
        print("="*50)
        print("\n🎯 测试账号:")
        print("  管理员: admin / admin123")
        print("  免费用户: test_user / test123")
        print("  月会员: monthly_user / test123")
        print("\n📊 会员等级:")
        tiers = MembershipTier.query.order_by(MembershipTier.sort_order).all()
        for tier in tiers:
            print(f"  - {tier.name}: {tier.price}元 ({tier.duration_days}天)")


if __name__ == "__main__":
    main()


"""
初始化会员系统
创建会员等级、测试用户等
"""

import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(__file__))

from flask import Flask
from models import db
from models_membership import User, MembershipTier, UserMembership, PaymentTransaction
from config import Config
import json


def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    return app


def init_membership_tiers(app):
    """初始化会员等级"""
    with app.app_context():
        print("正在初始化会员等级...")
        
        # 先删除旧数据
        try:
            MembershipTier.query.delete()
            db.session.commit()
            print("已清除旧的会员等级数据")
        except Exception as e:
            print(f"清除旧数据时出错: {e}")
            db.session.rollback()
        
        # 免费会员
        free_tier = MembershipTier(
            name='免费用户',
            code='free',
            level=0,
            price=0.0,
            duration_days=0,
            permissions=json.dumps({
                'allowed_features': ['ai_ask'],  # 只允许AI答疑
                'limits': {
                    'ai_ask_daily': 3,  # 每天3次
                    'student_limit': 0  # 不能使用学生管理
                }
            }),
            features=json.dumps([
                '基础AI答疑（每天3次）',
                '查看系统介绍'
            ]),
            description='免费用户，体验基础功能',
            is_active=True,
            sort_order=0
        )
        
        # 周会员
        weekly_tier = MembershipTier(
            name='周会员',
            code='weekly',
            level=1,
            price=19.9,
            duration_days=7,
            permissions=json.dumps({
                'allowed_features': ['ai_ask', 'students', 'submit', 'scores'],
                'limits': {
                    'ai_ask_weekly': 50,
                    'submit_weekly': 10,
                    'student_limit': 50
                }
            }),
            features=json.dumps([
                'AI答疑（50次/周）',
                '学生管理（50人）',
                '作业提交（10次/周）',
                '成绩查询'
            ]),
            description='适合个人教师或小班教学',
            is_active=True,
            sort_order=1
        )
        
        # 月会员
        monthly_tier = MembershipTier(
            name='月会员',
            code='monthly',
            level=2,
            price=59.9,
            duration_days=30,
            permissions=json.dumps({
                'allowed_features': ['ai_ask', 'students', 'submit', 'scores', 
                                   'generate_question', 'generate_lecture', 'progress'],
                'limits': {
                    'ai_ask_monthly': 200,
                    'generate_question_monthly': 30,
                    'generate_lecture_monthly': 20,
                    'student_limit': 200
                }
            }),
            features=json.dumps([
                'AI答疑（200次/月）',
                '学生管理（200人）',
                '作业提交（不限次数）',
                '成绩查询和分析',
                '智能出题（30次/月）',
                '智能讲义（20次/月）'
            ]),
            description='适合中小型培训机构',
            is_active=True,
            sort_order=2
        )
        
        # 年会员
        yearly_tier = MembershipTier(
            name='年会员',
            code='yearly',
            level=3,
            price=499.0,
            duration_days=365,
            permissions=json.dumps({
                'allowed_features': ['ai_ask', 'students', 'submit', 'scores', 
                                   'generate_question', 'generate_lecture', 'progress',
                                   'auxiliary', 'video_summary', 'export_data', 'api_access'],
                'limits': {}  # 无限制
            }),
            features=json.dumps([
                '所有功能无限制使用',
                'AI答疑（不限次数）',
                '学生管理（不限人数）',
                '作业提交（不限次数）',
                '智能出题（不限次数）',
                '智能讲义（不限次数）',
                '辅助编程',
                '视频总结',
                '数据导出',
                'API访问权限',
                '优先技术支持'
            ]),
            description='适合大型教育机构，享受所有高级功能',
            is_active=True,
            sort_order=3
        )
        
        db.session.add_all([free_tier, weekly_tier, monthly_tier, yearly_tier])
        db.session.commit()
        
        print("✅ 成功创建4个会员等级:")
        print(f"  - {free_tier.name}: {free_tier.price}元")
        print(f"  - {weekly_tier.name}: {weekly_tier.price}元/周")
        print(f"  - {monthly_tier.name}: {monthly_tier.price}元/月")
        print(f"  - {yearly_tier.name}: {yearly_tier.price}元/年")


def create_test_users(app):
    """创建测试用户"""
    with app.app_context():
        print("\n正在创建测试用户...")
        
        # 检查是否已存在
        if User.query.first():
            print("测试用户已存在，跳过创建")
            return
        
        # 管理员用户
        admin = User(
            username='admin',
            email='admin@edupilot.com',
            full_name='系统管理员',
            is_admin=True
        )
        admin.set_password('admin123')
        
        # 测试用户1 - 免费用户
        user1 = User(
            username='test_user',
            email='test@example.com',
            full_name='测试用户'
        )
        user1.set_password('test123')
        
        # 测试用户2 - 月会员
        user2 = User(
            username='monthly_user',
            email='monthly@example.com',
            full_name='月会员用户'
        )
        user2.set_password('test123')
        
        db.session.add_all([admin, user1, user2])
        db.session.commit()
        
        print("✅ 成功创建测试用户:")
        print(f"  - 管理员: admin / admin123")
        print(f"  - 免费用户: test_user / test123")
        print(f"  - 月会员: monthly_user / test123")
        
        # 为月会员用户添加会员记录
        monthly_tier = MembershipTier.query.filter_by(code='monthly').first()
        if monthly_tier:
            membership = UserMembership(
                user_id=user2.id,
                tier_id=monthly_tier.id,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=30),
                is_active=True
            )
            db.session.add(membership)
            db.session.commit()
            print(f"  - 已为 monthly_user 开通月会员（30天）")


def main():
    """主函数"""
    print("="*50)
    print("初始化会员系统")
    print("="*50)
    
    app = create_app()
    
    with app.app_context():
        # 创建所有表
        print("\n创建数据库表...")
        db.create_all()
        print("✅ 数据库表创建完成")
        
        # 初始化会员等级
        init_membership_tiers(app)
        
        # 创建测试用户
        create_test_users(app)
        
        print("\n" + "="*50)
        print("✅ 会员系统初始化完成！")
        print("="*50)
        print("\n🎯 测试账号:")
        print("  管理员: admin / admin123")
        print("  免费用户: test_user / test123")
        print("  月会员: monthly_user / test123")
        print("\n📊 会员等级:")
        tiers = MembershipTier.query.order_by(MembershipTier.sort_order).all()
        for tier in tiers:
            print(f"  - {tier.name}: {tier.price}元 ({tier.duration_days}天)")


if __name__ == "__main__":
    main()











