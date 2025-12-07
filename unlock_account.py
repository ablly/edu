#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
账户解锁工具
用于管理员手动解锁被锁定的用户账户

用法:
    python unlock_account.py <username>

示例:
    python unlock_account.py admin
    python unlock_account.py 张三
"""

import sys
from app import app
from utils.security import unlock_account

def main():
    """主函数"""
    if len(sys.argv) != 2:
        print("=" * 50)
        print("账户解锁工具")
        print("=" * 50)
        print("\n用法:")
        print("  python unlock_account.py <username>")
        print("\n示例:")
        print("  python unlock_account.py admin")
        print("  python unlock_account.py 张三")
        print("=" * 50)
        sys.exit(1)
    
    username = sys.argv[1]
    
    print(f"\n正在解锁账户: {username}")
    print("-" * 50)
    
    with app.app_context():
        success = unlock_account(username)
        
        if success:
            print(f"\n✅ 账户 '{username}' 已成功解锁！")
            print("用户现在可以正常登录。")
        else:
            print(f"\n❌ 解锁账户 '{username}' 失败！")
            print("请检查错误信息或联系技术支持。")
    
    print("-" * 50)

if __name__ == '__main__':
    main()



