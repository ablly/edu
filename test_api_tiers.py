from app import app, db
from models_membership import MembershipTier

with app.app_context():
    print("=== 测试 API 返回的套餐数据 ===")
    tiers = MembershipTier.query.order_by(MembershipTier.price).all()
    
    print(f"\n总共查询到 {len(tiers)} 个套餐:\n")
    
    for tier in tiers:
        tier_dict = tier.to_dict()
        print(f"ID: {tier.id}")
        print(f"  Name: {tier.name}")
        print(f"  Code: {tier.code}")
        print(f"  Price: ¥{tier.price}")
        print(f"  Duration: {tier.duration_days}天")
        print(f"  Is Active: {tier.is_active}")
        print(f"  Level: {tier.level}")
        print(f"  Is Limited: {tier.is_limited}")
        print(f"  Is Early Bird: {tier.is_early_bird}")
        print()


