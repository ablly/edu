"""
添加验证码表
"""
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, db
from models_verification import VerificationCode

def create_verification_table():
    """创建验证码表"""
    print("\n╔═══════════════════════════════════════════════════════════╗")
    print("║                                                           ║")
    print("║          创建验证码表 (verification_codes)                ║")
    print("║                                                           ║")
    print("╚═══════════════════════════════════════════════════════════╝\n")
    
    with app.app_context():
        try:
            # 创建表
            db.create_all()
            print("✅ 验证码表创建成功！")
            print("\n表结构：")
            print("  • id (主键)")
            print("  • email (邮箱地址)")
            print("  • code (6位验证码)")
            print("  • type (类型: reset_password/register)")
            print("  • expires_at (过期时间)")
            print("  • used (是否已使用)")
            print("  • ip_address (请求IP)")
            print("  • created_at (创建时间)\n")
            
            return True
            
        except Exception as e:
            print(f"❌ 创建表失败: {str(e)}")
            return False

if __name__ == "__main__":
    success = create_verification_table()
    sys.exit(0 if success else 1)


