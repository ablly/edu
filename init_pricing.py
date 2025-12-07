"""
初始化会员套餐定价系统
包含早鸟优惠套餐和统一价格套餐
"""
import sys
from datetime import datetime
from app import app, db
from models_membership import MembershipTier
import json

# 功能限制配置（所有会员等级通用）
FEATURE_LIMITS = {
    'free': {
        'ai_ask': 10,
        'question_gen': 3,
        'lecture_gen': 2,
        'programming_help': 5,
        'code_review': 3,
        'code_explain': 5,
        'debug_help': 5,
        'video_summary': 3,
        'generate_lecture': 2,
        'generate_question': 3,
        'video_to_lecture': 1
    },
    'paid': {  # 付费会员（周卡/月卡使用）
        'ai_ask': 100,
        'question_gen': 30,
        'lecture_gen': 20,
        'programming_help': 80,
        'code_review': 40,
        'code_explain': 80,
        'debug_help': 80,
        'video_summary': 30,
        'generate_lecture': 20,
        'generate_question': 30,
        'video_to_lecture': 15
    },
    'yearly': {  # 年卡无限制
        'ai_ask': -1,
        'question_gen': -1,
        'lecture_gen': -1,
        'programming_help': -1,
        'code_review': -1,
        'code_explain': -1,
        'debug_help': -1,
        'video_summary': -1,
        'generate_lecture': -1,
        'generate_question': -1,
        'video_to_lecture': -1
    }
}

def create_permissions(tier_type='free'):
    """创建权限配置"""
    limits = FEATURE_LIMITS.get(tier_type, FEATURE_LIMITS['free'])
    allowed_features = list(limits.keys())
    
    return json.dumps({
        'allowed_features': allowed_features,
        'limits': limits
    }, ensure_ascii=False)

def create_features_list(is_yearly=False, is_early_bird=False):
    """创建功能特性列表"""
    features = [
        "AI智能答疑",
        "智能出题生成",
        "智能讲义生成",
        "辅助编程功能",
        "代码审查",
        "代码解释",
        "调试帮助",
        "视频智能总结",
        "视频转讲义"
    ]
    
    if is_yearly:
        features.extend([
            "🔥 所有功能无限次使用",
            "📚 K12课程知识库",
            "🎯 优先客服支持"
        ])
    
    if is_early_bird:
        features.extend([
            "🎖️ 早鸟专属徽章",
            "💎 限量纪念资格"
        ])
    
    return json.dumps(features, ensure_ascii=False)

def init_pricing():
    """初始化定价系统"""
    
    with app.app_context():
        print("\n=== 初始化会员套餐系统 ===\n")
        
        # 检查是否已有套餐
        existing_tiers = MembershipTier.query.count()
        if existing_tiers > 0:
            print(f"⚠️  发现已存在 {existing_tiers} 个套餐")
            confirm = input("是否清空现有套餐并重新初始化？(yes/no): ")
            if confirm.lower() != 'yes':
                print("❌ 取消初始化")
                return
            
            # 清空现有套餐
            MembershipTier.query.delete()
            db.session.commit()
            print("✅ 已清空现有套餐\n")
        
        # 1. 免费套餐（默认）
        free_tier = MembershipTier(
            name='免费用户',
            code='free',
            level=0,
            price=0.0,
            currency='CNY',
            duration_days=0,
            permissions=create_permissions('free'),
            features=create_features_list(),
            description='免费体验基础功能',
            is_active=True,
            sort_order=0,
            is_limited=False,
            is_early_bird=False
        )
        
        # 2. 早鸟一档：¥99/年（第1-10位）
        early_bird_1 = MembershipTier(
            name='早鸟一档',
            code='early_bird_1',
            level=4,
            price=99.0,
            original_price=399.0,
            currency='CNY',
            duration_days=365,
            permissions=create_permissions('yearly'),
            features=create_features_list(is_yearly=True, is_early_bird=True),
            description='限时早鸟优惠 - 第1-10位用户专享！',
            is_active=True,
            sort_order=1,
            is_limited=True,
            total_quota=10,
            sold_count=0,
            min_order=1,
            max_order=10,
            is_early_bird=True,
            early_bird_tier=1
        )
        
        # 3. 早鸟二档：¥199/年（第11-30位）
        early_bird_2 = MembershipTier(
            name='早鸟二档',
            code='early_bird_2',
            level=4,
            price=199.0,
            original_price=399.0,
            currency='CNY',
            duration_days=365,
            permissions=create_permissions('yearly'),
            features=create_features_list(is_yearly=True, is_early_bird=True),
            description='限时早鸟优惠 - 第11-30位用户专享！',
            is_active=True,
            sort_order=2,
            is_limited=True,
            total_quota=20,
            sold_count=0,
            min_order=11,
            max_order=30,
            is_early_bird=True,
            early_bird_tier=2
        )
        
        # 4. 早鸟三档：¥299/年（第31-50位）
        early_bird_3 = MembershipTier(
            name='早鸟三档',
            code='early_bird_3',
            level=4,
            price=299.0,
            original_price=399.0,
            currency='CNY',
            duration_days=365,
            permissions=create_permissions('yearly'),
            features=create_features_list(is_yearly=True, is_early_bird=True),
            description='限时早鸟优惠 - 第31-50位用户专享！',
            is_active=True,
            sort_order=3,
            is_limited=True,
            total_quota=20,
            sold_count=0,
            min_order=31,
            max_order=50,
            is_early_bird=True,
            early_bird_tier=3
        )
        
        # 5. 周卡：¥9.9/周（统一价格）
        weekly_tier = MembershipTier(
            name='周卡',
            code='weekly',
            level=1,
            price=9.9,
            currency='CNY',
            duration_days=7,
            permissions=create_permissions('paid'),
            features=create_features_list(),
            description='7天畅享所有功能',
            is_active=True,
            sort_order=4,
            is_limited=False,
            is_early_bird=False
        )
        
        # 6. 月卡：¥29/月（统一价格）
        monthly_tier = MembershipTier(
            name='月卡',
            code='monthly',
            level=2,
            price=29.0,
            currency='CNY',
            duration_days=30,
            permissions=create_permissions('paid'),
            features=create_features_list(),
            description='30天畅享所有功能',
            is_active=True,
            sort_order=5,
            is_limited=False,
            is_early_bird=False
        )
        
        # 7. 年卡：¥399/年（统一价格）
        yearly_tier = MembershipTier(
            name='年卡',
            code='yearly',
            level=3,
            price=399.0,
            currency='CNY',
            duration_days=365,
            permissions=create_permissions('yearly'),
            features=create_features_list(is_yearly=True),
            description='365天无限次使用所有功能',
            is_active=True,
            sort_order=6,
            is_limited=False,
            is_early_bird=False
        )
        
        # 添加到数据库
        tiers = [
            free_tier,
            early_bird_1,
            early_bird_2,
            early_bird_3,
            weekly_tier,
            monthly_tier,
            yearly_tier
        ]
        
        for tier in tiers:
            db.session.add(tier)
        
        try:
            db.session.commit()
            print("✅ 成功创建以下套餐：\n")
            print("【早鸟优惠套餐】")
            print(f"  1. {early_bird_1.name}: ¥{early_bird_1.price}/年 (限{early_bird_1.total_quota}人, 第{early_bird_1.min_order}-{early_bird_1.max_order}位)")
            print(f"  2. {early_bird_2.name}: ¥{early_bird_2.price}/年 (限{early_bird_2.total_quota}人, 第{early_bird_2.min_order}-{early_bird_2.max_order}位)")
            print(f"  3. {early_bird_3.name}: ¥{early_bird_3.price}/年 (限{early_bird_3.total_quota}人, 第{early_bird_3.min_order}-{early_bird_3.max_order}位)")
            print("\n【统一价格套餐】")
            print(f"  4. {weekly_tier.name}: ¥{weekly_tier.price}/{weekly_tier.duration_days}天")
            print(f"  5. {monthly_tier.name}: ¥{monthly_tier.price}/{monthly_tier.duration_days}天")
            print(f"  6. {yearly_tier.name}: ¥{yearly_tier.price}/{yearly_tier.duration_days}天")
            print(f"\n  0. {free_tier.name}: 免费")
            print("\n=== 初始化完成！ ===")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ 初始化失败: {str(e)}")
            return False
        
        return True


if __name__ == '__main__':
    init_pricing()


