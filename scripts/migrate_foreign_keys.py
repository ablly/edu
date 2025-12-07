"""
迁移外键约束，添加级联删除
"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from models import db

def migrate_foreign_keys():
    """执行外键级联迁移"""
    with app.app_context():
        try:
            # 读取SQL迁移文件
            with open('migrations/update_foreign_keys_cascade.sql', 'r', encoding='utf-8') as f:
                sql_commands = f.read()
            
            # 执行SQL命令
            for command in sql_commands.split(';'):
                command = command.strip()
                if command and not command.startswith('--'):
                    print(f"执行: {command[:100]}...")
                    db.session.execute(db.text(command))
            
            db.session.commit()
            print("\n✅ 外键级联迁移成功！")
            print("现在可以正常删除用户了，相关数据会自动级联删除。")
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ 迁移失败: {str(e)}")
            raise

if __name__ == '__main__':
    migrate_foreign_keys()

