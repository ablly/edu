"""
PostgreSQL数据库迁移：添加级联删除
"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 设置PostgreSQL环境变量
os.environ['DATABASE_URL'] = 'postgresql://edupilot_user:050102@localhost:5432/edupilot_db'

from app import app
from models import db

def migrate_foreign_keys():
    """执行PostgreSQL外键级联迁移"""
    with app.app_context():
        try:
            print("\n" + "="*80)
            print("PostgreSQL 外键级联迁移")
            print("="*80 + "\n")
            
            # 检查当前数据库类型
            db_uri = app.config['SQLALCHEMY_DATABASE_URI']
            print(f"当前数据库: {db_uri}\n")
            
            if 'postgresql' not in db_uri.lower():
                print("❌ 错误：当前不是PostgreSQL数据库！")
                print(f"   数据库URI: {db_uri}")
                return
            
            # 读取SQL迁移文件
            sql_file = 'migrations/postgresql_add_cascade.sql'
            print(f"读取迁移脚本: {sql_file}\n")
            
            with open(sql_file, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            # 分割SQL语句（以分号分隔）
            statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]
            
            print(f"共 {len(statements)} 条SQL语句\n")
            print("-"*80)
            
            # 执行每条SQL语句
            for i, statement in enumerate(statements, 1):
                # 打印语句摘要
                first_line = statement.split('\n')[0][:60]
                print(f"\n[{i}/{len(statements)}] {first_line}...")
                
                try:
                    result = db.session.execute(db.text(statement))
                    
                    # 如果是SELECT语句，显示结果
                    if statement.strip().upper().startswith('SELECT'):
                        rows = result.fetchall()
                        if rows:
                            print("\n外键约束验证结果：")
                            print("-"*80)
                            for row in rows:
                                print(f"  表: {row[1]}")
                                print(f"  外键: {row[0]}")
                                print(f"  列: {row[2]} -> {row[3]}.{row[4]}")
                                print(f"  删除规则: {row[5]}")
                                print("-"*80)
                    else:
                        print("✓ 执行成功")
                        
                except Exception as e:
                    # 忽略"约束不存在"的错误
                    if 'does not exist' in str(e):
                        print(f"⚠ 跳过（约束不存在）")
                    else:
                        raise
            
            # 提交所有更改
            db.session.commit()
            
            print("\n" + "="*80)
            print("✅ PostgreSQL外键级联迁移成功！")
            print("="*80)
            print("\n现在可以正常删除用户了，相关数据会自动级联删除。\n")
            
        except Exception as e:
            db.session.rollback()
            print("\n" + "="*80)
            print(f"❌ 迁移失败: {str(e)}")
            print("="*80 + "\n")
            import traceback
            traceback.print_exc()
            raise

if __name__ == '__main__':
    migrate_foreign_keys()





