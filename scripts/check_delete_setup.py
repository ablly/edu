"""检查删除功能的配置"""
import os
import sys

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 设置环境变量
os.environ['DATABASE_URL'] = 'postgresql://edupilot_user:050102@localhost:5432/edupilot_db'

from app import app, db
import sqlalchemy as sa

def check_database_type():
    """检查当前使用的数据库类型"""
    print("\n" + "="*70)
    print("【检查1：数据库类型】")
    print("="*70)
    
    with app.app_context():
        engine = db.engine
        print(f"✓ 数据库URL: {engine.url}")
        print(f"✓ 数据库类型: {engine.dialect.name}")
        
        if 'postgresql' in str(engine.url):
            print("✅ 正在使用 PostgreSQL")
            return True
        else:
            print("❌ 未使用 PostgreSQL！")
            return False

def check_foreign_keys():
    """检查外键约束配置"""
    print("\n" + "="*70)
    print("【检查2：外键约束配置】")
    print("="*70)
    
    with app.app_context():
        inspector = sa.inspect(db.engine)
        
        # 检查user_memberships表的外键
        print("\n📋 user_memberships 表的外键：")
        fks = inspector.get_foreign_keys('user_memberships')
        for fk in fks:
            if fk['referred_table'] == 'users':
                print(f"  • {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
                print(f"    删除规则: {fk.get('ondelete', 'NO ACTION')}")
                if fk.get('ondelete') == 'CASCADE':
                    print("    ✅ 已配置 CASCADE")
                else:
                    print("    ❌ 未配置 CASCADE")
        
        # 检查payment_transactions表的外键
        print("\n📋 payment_transactions 表的外键：")
        fks = inspector.get_foreign_keys('payment_transactions')
        for fk in fks:
            if fk['referred_table'] == 'users':
                print(f"  • {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
                print(f"    删除规则: {fk.get('ondelete', 'NO ACTION')}")
                if fk.get('ondelete') == 'CASCADE':
                    print("    ✅ 已配置 CASCADE")
                else:
                    print("    ❌ 未配置 CASCADE")
        
        # 检查usage_logs表的外键
        print("\n📋 usage_logs 表的外键：")
        fks = inspector.get_foreign_keys('usage_logs')
        for fk in fks:
            if fk['referred_table'] == 'users':
                print(f"  • {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
                print(f"    删除规则: {fk.get('ondelete', 'NO ACTION')}")
                if fk.get('ondelete') == 'CASCADE':
                    print("    ✅ 已配置 CASCADE")
                else:
                    print("    ❌ 未配置 CASCADE")

def test_delete_query():
    """测试删除查询（不实际执行）"""
    print("\n" + "="*70)
    print("【检查3：测试删除逻辑】")
    print("="*70)
    
    with app.app_context():
        from models import User
        
        # 查找一个测试用户
        test_user = User.query.filter(User.username.like('zwwqh%')).first()
        
        if test_user:
            print(f"\n✓ 找到测试用户: {test_user.username} (ID: {test_user.id})")
            
            # 检查关联数据
            from models_membership import UserMembership, PaymentTransaction, UsageLog
            
            memberships = UserMembership.query.filter_by(user_id=test_user.id).count()
            transactions = PaymentTransaction.query.filter_by(user_id=test_user.id).count()
            logs = UsageLog.query.filter_by(user_id=test_user.id).count()
            
            print(f"  • 会员记录: {memberships}")
            print(f"  • 支付记录: {transactions}")
            print(f"  • 使用日志: {logs}")
            
            if memberships + transactions + logs > 0:
                print("\n⚠️  该用户有关联数据，删除时会触发级联删除")
            else:
                print("\n✓ 该用户无关联数据，可直接删除")
        else:
            print("\n⚠️  未找到测试用户")

def main():
    print("\n" + "╔" + "="*68 + "╗")
    print("║" + " "*20 + "删除功能配置检查工具" + " "*20 + "║")
    print("╚" + "="*68 + "╝")
    
    try:
        is_postgresql = check_database_type()
        
        if is_postgresql:
            check_foreign_keys()
            test_delete_query()
            
            print("\n" + "="*70)
            print("【总结】")
            print("="*70)
            print("""
如果外键约束显示 'NO ACTION' 而不是 'CASCADE'，请运行：
    python scripts/fix_postgresql_cascade.py

然后重启Flask服务器：
    .\\start.ps1
            """)
        else:
            print("\n❌ 请先切换到PostgreSQL数据库！")
            print("   运行: .\\start.ps1")
    
    except Exception as e:
        print(f"\n❌ 检查失败: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()




