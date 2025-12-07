"""
账户状态检查脚本
快速查看测试账户的会员状态
"""
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models_membership import db, User, UserMembership, MembershipTier
from datetime import datetime

def print_separator():
    print("━" * 70)

def check_account(username):
    """检查单个账户的状态"""
    user = User.query.filter_by(username=username).first()
    
    if not user:
        print(f"❌ 账户 '{username}' 不存在")
        return False
    
    print(f"\n{'='*70}")
    print(f"👤 账户信息: {username}")
    print(f"{'='*70}")
    print(f"  ID: {user.id}")
    print(f"  邮箱: {user.email}")
    print(f"  注册时间: {user.created_at}")
    print(f"  最后登录: {user.last_login or '从未登录'}")
    
    # 查询会员状态
    membership = UserMembership.query.filter_by(user_id=user.id).first()
    
    print(f"\n💎 会员状态:")
    if membership:
        tier = MembershipTier.query.get(membership.tier_id)
        print(f"  ✅ 有会员")
        print(f"  会员等级: {tier.name if tier else '未知'} ({tier.code if tier else 'N/A'})")
        print(f"  开始日期: {membership.start_date}")
        print(f"  结束日期: {membership.end_date}")
        
        if membership.end_date:
            now = datetime.utcnow()
            if membership.end_date > now:
                days_left = (membership.end_date - now).days
                print(f"  状态: ✅ 有效 (剩余 {days_left} 天)")
            else:
                print(f"  状态: ❌ 已过期")
        else:
            print(f"  状态: ✅ 永久有效")
    else:
        print(f"  ❌ 无会员")
    
    print_separator()
    return True

def main():
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║                                                            ║")
    print("║              EduPilot 账户状态检查工具                    ║")
    print("║                                                            ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    # 检查测试账户
    test_accounts = ['zwwh', 'zwwqh']
    
    print(f"\n🔍 正在检查测试账户...\n")
    
    for username in test_accounts:
        check_account(username)
    
    # 统计信息
    print(f"\n📊 数据库统计:")
    print(f"  总用户数: {User.query.count()}")
    print(f"  有会员用户: {UserMembership.query.count()}")
    print(f"  会员套餐数: {MembershipTier.query.count()}")
    
    # 列出所有会员套餐
    print(f"\n💎 可用会员套餐:")
    tiers = MembershipTier.query.order_by(MembershipTier.price).all()
    for tier in tiers:
        print(f"  • {tier.name} ({tier.code}): ¥{tier.price}/{tier.duration_days}天")
    
    print(f"\n✅ 检查完成！\n")

if __name__ == "__main__":
    try:
        # 导入Flask应用
        from app import app
        
        # 在应用上下文中运行
        with app.app_context():
            main()
    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

