#!/usr/bin/env python3
"""
清理管理员账户，只保留zqh账户
"""

from app import app, db
from models_admin import Admin

def clean_admins():
    """清理管理员账户"""
    
    with app.app_context():
        print("=== 清理管理员账户 ===")
        
        # 获取所有管理员
        all_admins = Admin.query.all()
        print(f"当前管理员数量: {len(all_admins)}")
        
        for admin in all_admins:
            print(f"  - {admin.username} ({admin.email})")
        
        # 找到zqh账户
        zqh_admin = Admin.query.filter_by(username='zqh').first()
        if not zqh_admin:
            print("❌ 未找到zqh账户！")
            return
        
        print(f"\n✅ 找到zqh账户: {zqh_admin.username} ({zqh_admin.email})")
        
        # 删除其他管理员
        other_admins = Admin.query.filter(Admin.username != 'zqh').all()
        print(f"\n🗑️ 将删除 {len(other_admins)} 个其他管理员:")
        
        for admin in other_admins:
            print(f"  - 删除: {admin.username} ({admin.email})")
            db.session.delete(admin)
        
        # 确保zqh账户有正确的密码和权限
        print(f"\n🔧 更新zqh账户信息:")
        zqh_admin.set_password('Zqh050102@')
        zqh_admin.is_super_admin = True
        zqh_admin.is_active = True
        zqh_admin.email = '3533912007@qq.com'
        
        # 设置完整权限
        import json
        zqh_admin.permissions = json.dumps({
            "user_view": True,
            "user_edit": True,
            "user_delete": True,
            "order_view": True,
            "order_edit": True,
            "order_refund": True,
            "membership_view": True,
            "membership_edit": True,
            "payment_view": True,
            "system_view": True,
            "system_edit": True,
            "log_view": True,
            "permission_manage": True,
            "admin_view": True,
            "admin_edit": True
        })
        
        print(f"  - 用户名: {zqh_admin.username}")
        print(f"  - 密码: 已重置为 Zqh050102@")
        print(f"  - 邮箱: {zqh_admin.email}")
        print(f"  - 超级管理员: {zqh_admin.is_super_admin}")
        print(f"  - 权限: 完整权限")
        
        # 提交更改
        try:
            db.session.commit()
            print(f"\n✅ 管理员清理完成！")
            
            # 验证结果
            remaining_admins = Admin.query.all()
            print(f"\n📊 清理后管理员数量: {len(remaining_admins)}")
            for admin in remaining_admins:
                print(f"  - {admin.username} ({admin.email}) - 超级管理员: {admin.is_super_admin}")
                
        except Exception as e:
            db.session.rollback()
            print(f"❌ 清理失败: {e}")

if __name__ == '__main__':
    clean_admins()
