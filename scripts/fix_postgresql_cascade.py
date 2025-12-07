"""
检查并修复PostgreSQL外键级联删除
"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 设置PostgreSQL环境变量
os.environ['DATABASE_URL'] = 'postgresql://edupilot_user:050102@localhost:5432/edupilot_db'

from app import app
from models import db

def fix_cascade():
    """检查并修复外键级联删除"""
    with app.app_context():
        try:
            print("\n" + "="*80)
            print("PostgreSQL 外键级联检查与修复")
            print("="*80 + "\n")
            
            # 检查当前数据库类型
            db_uri = app.config['SQLALCHEMY_DATABASE_URI']
            print(f"当前数据库: {db_uri}\n")
            
            if 'postgresql' not in db_uri.lower():
                print("❌ 错误：当前不是PostgreSQL数据库！")
                return
            
            # 查询当前外键约束
            check_sql = """
            SELECT 
                tc.constraint_name, 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            JOIN information_schema.referential_constraints AS rc
                ON rc.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND ccu.table_name = 'users'
            ORDER BY tc.table_name;
            """
            
            print("检查当前外键约束...")
            print("-"*80)
            result = db.session.execute(db.text(check_sql))
            rows = result.fetchall()
            
            constraints_to_fix = []
            for row in rows:
                constraint_name = row[0]
                table_name = row[1]
                column_name = row[2]
                delete_rule = row[5]
                
                print(f"\n表: {table_name}")
                print(f"  约束名: {constraint_name}")
                print(f"  列: {column_name} -> users.id")
                print(f"  删除规则: {delete_rule}")
                
                if delete_rule != 'CASCADE':
                    print(f"  ⚠ 需要修复：删除规则应为 CASCADE")
                    constraints_to_fix.append((table_name, constraint_name, column_name))
                else:
                    print(f"  ✓ 已正确配置 CASCADE")
            
            print("\n" + "-"*80)
            
            if not constraints_to_fix:
                print("\n✅ 所有外键约束已正确配置 CASCADE！")
                print("\n现在可以正常删除用户了。\n")
                return
            
            print(f"\n发现 {len(constraints_to_fix)} 个需要修复的约束\n")
            
            # 修复每个约束
            for table_name, constraint_name, column_name in constraints_to_fix:
                print(f"修复 {table_name}.{constraint_name}...")
                
                # 删除旧约束
                drop_sql = f"ALTER TABLE {table_name} DROP CONSTRAINT {constraint_name}"
                print(f"  1. 删除旧约束...")
                db.session.execute(db.text(drop_sql))
                print(f"     ✓ 已删除")
                
                # 添加新约束（带CASCADE）
                add_sql = f"""
                ALTER TABLE {table_name}
                ADD CONSTRAINT {constraint_name}
                FOREIGN KEY ({column_name}) REFERENCES users(id) ON DELETE CASCADE
                """
                print(f"  2. 添加新约束（带CASCADE）...")
                db.session.execute(db.text(add_sql))
                print(f"     ✓ 已添加")
            
            db.session.commit()
            
            print("\n" + "="*80)
            print("✅ PostgreSQL外键级联修复成功！")
            print("="*80)
            print("\n现在可以正常删除用户了，相关数据会自动级联删除。\n")
            
        except Exception as e:
            db.session.rollback()
            print("\n" + "="*80)
            print(f"❌ 修复失败: {str(e)}")
            print("="*80 + "\n")
            import traceback
            traceback.print_exc()
            raise

if __name__ == '__main__':
    fix_cascade()





