"""
系统功能全面测试脚本
测试所有已完成的功能模块
"""

import os
import sys
import time
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import db
from models_membership import User, MembershipTier, UserMembership, PaymentTransaction
from models_admin import Admin, AdminLog


def print_section(title):
    """打印章节标题"""
    print("\n" + "="*60)
    print(f"    {title}")
    print("="*60 + "\n")


def test_database_connection():
    """测试数据库连接"""
    print_section("1. 测试数据库连接")
    
    try:
        with app.app_context():
            # 测试数据库连接
            result = db.session.execute(db.text('SELECT 1')).scalar()
            print(f"✅ 数据库连接成功")
            
            # 检查所有表
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            print(f"\n📊 数据库表数量: {len(tables)}")
            print(f"   关键表:")
            important_tables = [
                'users', 'membership_tiers', 'user_memberships',
                'payment_transactions', 'usage_logs',
                'admins', 'admin_logs',
                'student', 'assignment', 'question_bank'
            ]
            
            for table in important_tables:
                status = "✅" if table in tables else "❌"
                print(f"   {status} {table}")
            
            return True
            
    except Exception as e:
        print(f"❌ 数据库连接失败: {str(e)}")
        return False


def test_user_system():
    """测试用户系统"""
    print_section("2. 测试用户系统")
    
    try:
        with app.app_context():
            # 统计用户数
            total_users = User.query.count()
            active_users = User.query.filter_by(is_active=True).count()
            
            print(f"📊 用户统计:")
            print(f"   • 总用户数: {total_users}")
            print(f"   • 激活用户: {active_users}")
            
            if total_users > 0:
                # 显示最近注册的用户
                recent_users = User.query.order_by(
                    User.created_at.desc()
                ).limit(3).all()
                
                print(f"\n📝 最近注册用户:")
                for user in recent_users:
                    print(f"   • {user.username} ({user.email})")
                    print(f"     注册时间: {user.created_at}")
            
            print(f"\n✅ 用户系统运行正常")
            return True
            
    except Exception as e:
        print(f"❌ 用户系统测试失败: {str(e)}")
        return False


def test_membership_system():
    """测试会员系统"""
    print_section("3. 测试会员系统")
    
    try:
        with app.app_context():
            # 统计会员套餐
            total_tiers = MembershipTier.query.count()
            active_tiers = MembershipTier.query.filter_by(is_active=True).count()
            
            print(f"📊 会员套餐统计:")
            print(f"   • 总套餐数: {total_tiers}")
            print(f"   • 激活套餐: {active_tiers}")
            
            # 显示所有套餐
            tiers = MembershipTier.query.order_by(MembershipTier.price).all()
            
            print(f"\n💎 可用套餐:")
            for tier in tiers:
                print(f"   • {tier.name} - ¥{tier.price}")
                if tier.is_limited:
                    print(f"     限量: {tier.sold_count}/{tier.total_quota}")
            
            # 统计会员数
            total_memberships = UserMembership.query.count()
            active_memberships = UserMembership.query.filter_by(
                is_active=True
            ).count()
            
            print(f"\n👥 会员统计:")
            print(f"   • 总会员数: {total_memberships}")
            print(f"   • 激活会员: {active_memberships}")
            
            print(f"\n✅ 会员系统运行正常")
            return True
            
    except Exception as e:
        print(f"❌ 会员系统测试失败: {str(e)}")
        return False


def test_payment_system():
    """测试支付系统"""
    print_section("4. 测试支付系统")
    
    try:
        with app.app_context():
            # 统计订单
            total_orders = PaymentTransaction.query.count()
            
            print(f"📊 订单统计:")
            print(f"   • 总订单数: {total_orders}")
            
            # 按状态统计
            statuses = ['pending', 'success', 'failed', 'cancelled']
            for status in statuses:
                count = PaymentTransaction.query.filter_by(
                    status=status
                ).count()
                print(f"   • {status}: {count}")
            
            if total_orders > 0:
                # 计算总金额
                from sqlalchemy import func
                total_amount = db.session.query(
                    func.sum(PaymentTransaction.amount)
                ).filter_by(status='success').scalar() or 0
                
                print(f"\n💰 收入统计:")
                print(f"   • 总收入: ¥{total_amount:.2f}")
                
                # 最近订单
                recent_orders = PaymentTransaction.query.order_by(
                    PaymentTransaction.created_at.desc()
                ).limit(5).all()
                
                print(f"\n📝 最近订单:")
                for order in recent_orders:
                    print(f"   • {order.transaction_id} - ¥{order.amount}")
                    print(f"     状态: {order.status}")
            
            print(f"\n✅ 支付系统运行正常")
            return True
            
    except Exception as e:
        print(f"❌ 支付系统测试失败: {str(e)}")
        return False


def test_admin_system():
    """测试管理员系统"""
    print_section("5. 测试管理员系统")
    
    try:
        with app.app_context():
            # 统计管理员
            total_admins = Admin.query.count()
            active_admins = Admin.query.filter_by(is_active=True).count()
            super_admins = Admin.query.filter_by(is_super_admin=True).count()
            
            print(f"📊 管理员统计:")
            print(f"   • 总管理员: {total_admins}")
            print(f"   • 激活管理员: {active_admins}")
            print(f"   • 超级管理员: {super_admins}")
            
            # 显示所有管理员
            admins = Admin.query.all()
            
            print(f"\n👤 管理员列表:")
            for admin in admins:
                role = "超级管理员" if admin.is_super_admin else "普通管理员"
                status = "✅" if admin.is_active else "❌"
                print(f"   {status} {admin.username} ({role})")
                print(f"      邮箱: {admin.email}")
            
            # 统计操作日志
            total_logs = AdminLog.query.count()
            print(f"\n📝 操作日志: {total_logs} 条")
            
            print(f"\n✅ 管理员系统运行正常")
            return True
            
    except Exception as e:
        print(f"❌ 管理员系统测试失败: {str(e)}")
        return False


def test_performance():
    """测试性能"""
    print_section("6. 测试系统性能")
    
    try:
        with app.app_context():
            # 测试数据库查询性能
            tests = [
                ("用户列表查询", "User.query.limit(10).all()"),
                ("会员套餐查询", "MembershipTier.query.all()"),
                ("订单查询", "PaymentTransaction.query.limit(10).all()"),
            ]
            
            print(f"⚡ 查询性能测试:")
            for name, query in tests:
                start_time = time.time()
                eval(query)
                end_time = time.time()
                duration = (end_time - start_time) * 1000
                
                if duration < 20:
                    status = "🟢 优秀"
                elif duration < 50:
                    status = "🟡 良好"
                else:
                    status = "🔴 需优化"
                
                print(f"   • {name}: {duration:.2f}ms {status}")
            
            print(f"\n✅ 性能测试完成")
            return True
            
    except Exception as e:
        print(f"❌ 性能测试失败: {str(e)}")
        return False


def test_cache_system():
    """测试缓存系统"""
    print_section("7. 测试缓存系统")
    
    try:
        from utils.cache import (
            cache_set, cache_get, get_cache_stats,
            clear_cache, cached
        )
        
        # 清空缓存
        clear_cache()
        
        # 测试基础操作
        print(f"📝 测试基础缓存操作:")
        cache_set('test_key', 'test_value', ttl=60)
        value = cache_get('test_key')
        
        if value == 'test_value':
            print(f"   ✅ 缓存写入/读取成功")
        else:
            print(f"   ❌ 缓存读取失败")
            return False
        
        # 测试装饰器缓存
        @cached(ttl=60)
        def test_function(x):
            return x * 2
        
        result1 = test_function(5)
        result2 = test_function(5)
        
        if result1 == result2 == 10:
            print(f"   ✅ 装饰器缓存成功")
        else:
            print(f"   ❌ 装饰器缓存失败")
            return False
        
        # 获取统计
        stats = get_cache_stats()
        print(f"\n📊 缓存统计:")
        print(f"   • 总缓存项: {stats['total_items']}")
        print(f"   • 活跃项: {stats['active_items']}")
        print(f"   • 过期项: {stats['expired_items']}")
        
        print(f"\n✅ 缓存系统运行正常")
        return True
        
    except Exception as e:
        print(f"❌ 缓存系统测试失败: {str(e)}")
        return False


def generate_test_report(results):
    """生成测试报告"""
    print_section("测试报告总结")
    
    total_tests = len(results)
    passed_tests = sum(1 for r in results.values() if r)
    failed_tests = total_tests - passed_tests
    
    pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    
    print(f"📊 测试结果统计:")
    print(f"   • 总测试数: {total_tests}")
    print(f"   • 通过: {passed_tests} ✅")
    print(f"   • 失败: {failed_tests} ❌")
    print(f"   • 通过率: {pass_rate:.1f}%")
    
    print(f"\n📝 详细结果:")
    for test_name, result in results.items():
        status = "✅ 通过" if result else "❌ 失败"
        print(f"   {status} - {test_name}")
    
    # 评级
    if pass_rate == 100:
        rating = "🟢 优秀"
    elif pass_rate >= 80:
        rating = "🟡 良好"
    elif pass_rate >= 60:
        rating = "🟠 一般"
    else:
        rating = "🔴 需改进"
    
    print(f"\n🎯 系统评级: {rating}")
    
    if pass_rate == 100:
        print(f"\n✨ 所有功能测试通过！系统运行完美！")
    elif pass_rate >= 80:
        print(f"\n💡 大部分功能正常，少数问题需要修复")
    else:
        print(f"\n⚠️  系统存在较多问题，建议检查日志")


def main():
    """主函数"""
    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║        EduPilot 系统功能全面测试                         ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"\n测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # 运行所有测试
    results = {}
    
    results['数据库连接'] = test_database_connection()
    results['用户系统'] = test_user_system()
    results['会员系统'] = test_membership_system()
    results['支付系统'] = test_payment_system()
    results['管理员系统'] = test_admin_system()
    results['系统性能'] = test_performance()
    results['缓存系统'] = test_cache_system()
    
    # 生成报告
    generate_test_report(results)
    
    print("\n" + "="*60)
    print("    测试完成！")
    print("="*60 + "\n")


if __name__ == '__main__':
    main()








