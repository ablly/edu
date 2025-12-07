#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试会员套餐替换功能
"""

from app import app, db
from models_membership import User, UserMembership, MembershipTier
from datetime import datetime, timedelta

def test_membership_replacement():
    """测试会员套餐替换逻辑"""
    with app.app_context():
        print("\n" + "="*60)
        print("🧪 测试会员套餐替换功能")
        print("="*60)
        
        # 查找一个测试用户
        user = User.query.first()
        if not user:
            print("❌ 没有找到测试用户")
            return
            
        print(f"\n📋 测试用户: {user.username} (ID: {user.id})")
        
        # 查看当前会员状态
        current_membership = UserMembership.query.filter_by(
            user_id=user.id,
            is_active=True
        ).first()
        
        if current_membership:
            tier = MembershipTier.query.get(current_membership.tier_id)
            print(f"📊 当前会员: {tier.name if tier else '未知'} (ID: {current_membership.tier_id})")
            print(f"📅 到期时间: {current_membership.end_date}")
        else:
            print("📊 当前会员: 无")
        
        # 获取所有可用套餐
        tiers = MembershipTier.query.filter_by(is_active=True).all()
        print(f"\n📦 可用套餐 ({len(tiers)}个):")
        for tier in tiers:
            current_mark = " ← 当前" if current_membership and current_membership.tier_id == tier.id else ""
            print(f"  {tier.id}. {tier.name} - {tier.duration_days}天 - ¥{tier.price}{current_mark}")
        
        # 测试场景
        print(f"\n🎯 测试场景:")
        if current_membership:
            # 找一个不同的套餐
            different_tier = None
            for tier in tiers:
                if tier.id != current_membership.tier_id:
                    different_tier = tier
                    break
            
            if different_tier:
                print(f"1. 替换套餐: {tier.name if current_membership else '无'} → {different_tier.name}")
                print(f"   预期结果: 旧会员停用，新会员从当前时间开始")
            
            # 相同套餐延长
            same_tier = MembershipTier.query.get(current_membership.tier_id)
            if same_tier:
                print(f"2. 延长套餐: {same_tier.name} + {same_tier.duration_days}天")
                print(f"   预期结果: 在现有到期时间基础上延长")
        else:
            first_tier = tiers[0] if tiers else None
            if first_tier:
                print(f"1. 新开通: {first_tier.name}")
                print(f"   预期结果: 创建新会员记录")
        
        print(f"\n💡 测试方法:")
        print(f"1. 进入用户管理页面")
        print(f"2. 点击用户 '{user.username}' 的'开通会员'按钮")
        print(f"3. 查看当前会员状态提示")
        print(f"4. 选择不同套餐测试替换")
        print(f"5. 选择相同套餐测试延长")
        print(f"6. 检查结果是否符合预期")

def check_membership_history():
    """检查会员历史记录"""
    with app.app_context():
        print("\n" + "="*60)
        print("📊 会员历史记录")
        print("="*60)
        
        # 获取所有会员记录（包括已停用的）
        memberships = UserMembership.query.order_by(
            UserMembership.user_id, 
            UserMembership.created_at.desc()
        ).all()
        
        current_user_id = None
        for membership in memberships:
            if current_user_id != membership.user_id:
                user = User.query.get(membership.user_id)
                print(f"\n👤 用户: {user.username if user else '未知'} (ID: {membership.user_id})")
                current_user_id = membership.user_id
            
            tier = MembershipTier.query.get(membership.tier_id)
            status = "✅ 激活" if membership.is_active else "❌ 已停用"
            print(f"  📦 {tier.name if tier else '未知套餐'} | {status} | {membership.start_date} ~ {membership.end_date}")

def main():
    """主函数"""
    print("\n" + "🚀 " + "="*58)
    print("   会员套餐替换功能测试")
    print("="*60)
    
    test_membership_replacement()
    check_membership_history()
    
    print("\n" + "="*60)
    print("📝 测试说明")
    print("="*60)
    print("✅ 后端逻辑已修复:")
    print("   - 相同套餐: 延长时间")
    print("   - 不同套餐: 替换套餐（旧会员停用，新会员创建）")
    print("   - 无会员: 创建新会员")
    print("\n✅ 前端界面已优化:")
    print("   - 显示当前会员状态")
    print("   - 说明替换/延长逻辑")
    print("   - 开通成功后自动刷新")
    print("\n🧪 请按照上述测试方法验证功能!")
    print("="*60)

if __name__ == "__main__":
    main()
