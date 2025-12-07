#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from app import app, db
from models_membership import MembershipTier

def check_membership_data():
    with app.app_context():
        print("=== 检查会员套餐数据 ===")
        
        # 查询所有会员套餐
        tiers = MembershipTier.query.all()
        print(f"总共有 {len(tiers)} 个会员套餐:")
        
        if not tiers:
            print("❌ 数据库中没有会员套餐数据！")
            print("需要初始化会员套餐数据...")
            
            # 创建默认会员套餐
            default_tiers = [
                {
                    'name': '免费版',
                    'code': 'free',
                    'description': '基础功能，适合个人用户',
                    'price': 0.00,
                    'duration_days': 0,  # 永久
                    'level': 0,
                    'is_active': True,
                    'features': ['基础AI对话', '每日10次提问']
                },
                {
                    'name': '周卡',
                    'code': 'weekly',
                    'description': '7天畅享所有功能',
                    'price': 9.90,
                    'duration_days': 7,
                    'level': 1,
                    'is_active': True,
                    'features': ['无限AI对话', '智能出题功能', '作业批改']
                },
                {
                    'name': '月卡',
                    'code': 'monthly',
                    'description': '30天畅享所有功能',
                    'price': 29.00,
                    'duration_days': 30,
                    'level': 2,
                    'is_active': True,
                    'features': ['无限AI对话', '智能出题功能', '作业批改', '学习分析']
                },
                {
                    'name': '早鸟一档',
                    'code': 'early_bird_1',
                    'description': '限时早鸟优惠 - 第1-100名用户专享',
                    'price': 99.00,
                    'duration_days': 365,
                    'level': 3,
                    'is_active': True,
                    'features': ['所有功能', '优先客服', '专属徽章']
                },
                {
                    'name': '早鸟二档',
                    'code': 'early_bird_2',
                    'description': '限时早鸟优惠 - 第101-300名用户专享',
                    'price': 199.00,
                    'duration_days': 365,
                    'level': 4,
                    'is_active': True,
                    'features': ['所有功能', '优先客服', '专属徽章', '定制化服务']
                },
                {
                    'name': '早鸟三档',
                    'code': 'early_bird_3',
                    'description': '限时早鸟优惠 - 第301-500名用户专享',
                    'price': 299.00,
                    'duration_days': 365,
                    'level': 5,
                    'is_active': True,
                    'features': ['所有功能', '优先客服', '专属徽章', '定制化服务', 'VIP群组']
                },
                {
                    'name': '年卡',
                    'code': 'yearly',
                    'description': '365天畅享所有功能',
                    'price': 399.00,
                    'duration_days': 365,
                    'level': 6,
                    'is_active': True,
                    'features': ['所有功能', '优先客服', '年度报告']
                }
            ]
            
            print("正在创建默认会员套餐...")
            for tier_data in default_tiers:
                tier = MembershipTier(
                    name=tier_data['name'],
                    code=tier_data['code'],
                    description=tier_data['description'],
                    price=tier_data['price'],
                    duration_days=tier_data['duration_days'],
                    level=tier_data['level'],
                    is_active=tier_data['is_active']
                )
                db.session.add(tier)
                print(f"✅ 创建套餐: {tier_data['name']} - ¥{tier_data['price']}")
            
            try:
                db.session.commit()
                print("✅ 会员套餐数据初始化完成！")
                
                # 重新查询显示结果
                tiers = MembershipTier.query.all()
                print(f"\n现在总共有 {len(tiers)} 个会员套餐:")
                for tier in tiers:
                    print(f"- ID: {tier.id}, 名称: {tier.name}, 代码: {tier.code}, 价格: ¥{tier.price}, 激活: {tier.is_active}")
                    
            except Exception as e:
                db.session.rollback()
                print(f"❌ 创建会员套餐失败: {e}")
        else:
            print("✅ 找到现有会员套餐:")
            for tier in tiers:
                print(f"- ID: {tier.id}, 名称: {tier.name}, 代码: {tier.code}, 价格: ¥{tier.price}, 激活: {tier.is_active}")

if __name__ == '__main__':
    check_membership_data()

