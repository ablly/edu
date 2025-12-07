"""
创建测试账户脚本
- zwwh: 有免费会员的测试账户
- zwwqh: 已存在，确保没有会员
"""
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models_membership import db, User, UserMembership, MembershipTier
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

def create_test_accounts():
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║                                                            ║")
    print("║              创建/更新测试账户                             ║")
    print("║                                                            ║")
    print("╚════════════════════════════════════════════════════════════╝\n")
    
    # 1. 确保 zwwqh 没有会员
    print("📝 检查 zwwqh 账户...")
    user_zwwqh = User.query.filter_by(username='zwwqh').first()
    if user_zwwqh:
        # 删除可能存在的会员
        existing_membership = UserMembership.query.filter_by(user_id=user_zwwqh.id).first()
        if existing_membership:
            db.session.delete(existing_membership)
            db.session.commit()
            print("  ✅ 已删除 zwwqh 的会员（用于测试无会员场景）")
        else:
            print("  ✅ zwwqh 已存在且无会员（符合测试要求）")
    else:
        print("  ❌ zwwqh 账户不存在，请先注册")
    
    # 2. 创建或更新 zwwh 账户（有免费会员）
    print("\n📝 检查 zwwh 账户...")
    user_zwwh = User.query.filter_by(username='zwwh').first()
    
    if not user_zwwh:
        # 创建新账户
        print("  🆕 创建 zwwh 账户...")
        user_zwwh = User(
            username='zwwh',
            email='zwwh@test.com',
            password_hash=generate_password_hash('Test123456@'),
            created_at=datetime.utcnow()
        )
        db.session.add(user_zwwh)
        db.session.commit()
        print("  ✅ zwwh 账户创建成功")
    else:
        print("  ✅ zwwh 账户已存在")
        # 更新密码以确保是 Test123456@
        user_zwwh.password_hash = generate_password_hash('Test123456@')
        db.session.commit()
        print("  ✅ 密码已更新为: Test123456@")
    
    # 3. 给 zwwh 分配免费会员
    print("\n💎 为 zwwh 分配免费会员...")
    
    # 查找免费会员套餐
    free_tier = MembershipTier.query.filter_by(code='free').first()
    if not free_tier:
        print("  ❌ 找不到免费会员套餐")
        return False
    
    # 检查是否已有会员
    existing_membership = UserMembership.query.filter_by(user_id=user_zwwh.id).first()
    
    if existing_membership:
        # 更新为免费会员
        existing_membership.tier_id = free_tier.id
        existing_membership.start_date = datetime.utcnow()
        existing_membership.end_date = datetime.utcnow() + timedelta(days=36500)  # 100年后（永久有效）
        db.session.commit()
        print("  ✅ 已更新 zwwh 为免费会员（永久有效）")
    else:
        # 创建新会员
        new_membership = UserMembership(
            user_id=user_zwwh.id,
            tier_id=free_tier.id,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=36500)  # 100年后（永久有效）
        )
        db.session.add(new_membership)
        db.session.commit()
        print("  ✅ 已为 zwwh 分配免费会员（永久有效）")
    
    # 4. 显示测试账户信息
    print("\n" + "="*70)
    print("✅ 测试账户配置完成！")
    print("="*70)
    
    print("\n📋 测试账户清单：")
    print("\n1️⃣  测试'无会员提示':")
    print("     账户: zwwqh")
    print(f"     邮箱: {user_zwwqh.email if user_zwwqh else 'N/A'}")
    print("     密码: （您注册时设置的密码）")
    print("     会员: ❌ 无会员")
    print("     用途: 测试'请购买会员'提示弹窗")
    
    print("\n2️⃣  测试'免费账户正常使用':")
    print("     账户: zwwh")
    print("     邮箱: zwwh@test.com")
    print("     密码: Test123456@")
    print("     会员: ✅ 免费会员（永久有效）")
    print("     用途: 测试免费账户可以正常使用所有功能")
    
    print("\n" + "="*70)
    print("💡 提示:")
    print("  • zwwqh 没有会员，使用功能时会提示'请购买会员'")
    print("  • zwwh 有免费会员，可以正常使用所有功能")
    print("  • 这两个账户将永久保留免费会员权限")
    print("="*70 + "\n")
    
    return True

if __name__ == "__main__":
    try:
        # 导入Flask应用
        from app import app
        
        # 在应用上下文中运行
        with app.app_context():
            success = create_test_accounts()
            if success:
                print("✅ 所有操作完成，现在可以开始测试了！\n")
                sys.exit(0)
            else:
                print("❌ 配置失败\n")
                sys.exit(1)
    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

