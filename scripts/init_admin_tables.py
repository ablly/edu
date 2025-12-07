"""
初始化管理员数据表
创建表结构并添加默认超级管理员
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import db
from models_admin import Admin, AdminLog, AdminPermission, init_admin_tables


def main():
    """主函数"""
    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║        管理员系统初始化工具                              ║")
    print("╚══════════════════════════════════════════════════════════╝\n")
    
    with app.app_context():
        try:
            # 创建表
            print("📊 正在创建管理员相关表...")
            db.create_all()
            print("✅ 表结构创建完成\n")
            
            # 初始化管理员账户
            print("👤 正在初始化管理员账户...")
            created_admins = init_admin_tables()
            
            if created_admins:
                print("\n" + "="*60)
                print("    初始化完成！")
                print("="*60)
                
                for idx, admin_info in enumerate(created_admins, 1):
                    print(f"\n📝 管理员 #{idx}：")
                    print(f"  • 用户名: {admin_info['username']}")
                    print(f"  • 密码: {admin_info['password']}")
                    print(f"  • 邮箱: {admin_info['email']}")
                    print(f"  • 角色: {admin_info['role']}")
                    print(f"  • 权限: {admin_info['permissions']}")
                
                print(f"\n⚠️  重要提示：")
                print(f"  1. 超级管理员拥有所有权限")
                print(f"  2. 只读管理员仅能查看，不能操作")
                print(f"  3. 请妥善保管管理员账号密码\n")
                
                print(f"🌐 访问地址：")
                print(f"  • 管理后台：http://localhost:5000/admin/login\n")
            else:
                print("\n⚠️  所有管理员账户已存在，跳过创建")
            
        except Exception as e:
            print(f"\n❌ 初始化失败: {str(e)}")
            import traceback
            traceback.print_exc()


if __name__ == '__main__':
    main()

