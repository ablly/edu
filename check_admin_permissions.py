#!/usr/bin/env python3
"""
检查管理员权限
"""

from app import app, db
from models_admin import Admin
import json

def check_admin_permissions():
    """检查管理员权限"""
    
    with app.app_context():
        print("=== 检查管理员权限 ===")
        
        # 获取所有管理员
        admins = Admin.query.all()
        print(f"数据库中共有 {len(admins)} 个管理员")
        
        for admin in admins:
            print(f"\n管理员: {admin.username}")
            print(f"  ID: {admin.id}")
            print(f"  邮箱: {admin.email}")
            print(f"  是否激活: {admin.is_active}")
            print(f"  是否超级管理员: {admin.is_super_admin}")
            
            # 检查权限
            if hasattr(admin, 'permissions') and admin.permissions:
                print(f"  权限: {admin.permissions}")
                
                # 检查是否有order_view权限
                if isinstance(admin.permissions, list):
                    has_order_view = 'order_view' in admin.permissions
                elif isinstance(admin.permissions, str):
                    import json
                    try:
                        perms = json.loads(admin.permissions)
                        has_order_view = 'order_view' in perms
                    except:
                        has_order_view = 'order_view' in admin.permissions
                else:
                    has_order_view = False
                    
                print(f"  有order_view权限: {has_order_view}")
            else:
                print(f"  权限: 无权限或权限为空")
                print(f"  有order_view权限: False")
        
        # 检查权限装饰器的实现
        print(f"\n=== 检查权限装饰器 ===")
        
        # 模拟权限检查
        test_admin = admins[0] if admins else None
        if test_admin:
            print(f"测试管理员: {test_admin.username}")
            
            # 检查是否是超级管理员
            if test_admin.is_super_admin:
                print("  超级管理员，应该有所有权限")
            else:
                print("  普通管理员，需要检查具体权限")

if __name__ == '__main__':
    check_admin_permissions()
