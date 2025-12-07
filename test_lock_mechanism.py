#!/usr/bin/env python3
"""
测试登录锁定机制
"""

import requests
import time
import json

# 配置
BASE_URL = "http://localhost:5000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"

def test_login_lockout():
    """测试登录锁定机制"""
    print("🔒 测试登录锁定机制")
    print("=" * 50)
    
    # 测试用户名（不存在的用户，确保登录失败）
    test_username = "test_lock_user"
    test_password = "wrong_password"
    
    print(f"测试用户: {test_username}")
    print(f"错误密码: {test_password}")
    print()
    
    # 连续尝试登录5次
    for i in range(1, 8):  # 尝试7次，前5次应该失败，第6次应该被锁定
        print(f"🔄 第 {i} 次尝试登录...")
        
        response = requests.post(LOGIN_URL, json={
            "username": test_username,
            "password": test_password
        })
        
        result = response.json()
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(result, ensure_ascii=False, indent=2)}")
        
        if response.status_code == 403 and result.get('locked'):
            print(f"✅ 账户已被锁定！锁定信息:")
            print(f"   - 锁定状态: {result.get('locked')}")
            print(f"   - 锁定至: {result.get('locked_until')}")
            print(f"   - 剩余尝试: {result.get('remaining_attempts', 0)}")
            break
        elif response.status_code == 400:
            print(f"⚠️ 登录失败: {result.get('error')}")
            if 'remaining_attempts' in result:
                print(f"   - 剩余尝试: {result.get('remaining_attempts')}")
        
        print("-" * 30)
        time.sleep(1)  # 等待1秒
    
    print()
    print("🕐 等待5分钟后测试自动解锁...")
    print("（实际测试中可以手动等待或使用管理员解锁功能）")

def test_admin_unlock():
    """测试管理员解锁功能"""
    print("\n🔓 测试管理员解锁功能")
    print("=" * 50)
    
    # 这里需要管理员token，实际使用时需要先登录管理员账户
    print("请在用户管理界面测试解锁功能:")
    print("1. 登录管理员账户")
    print("2. 进入用户管理页面")
    print("3. 查看用户的锁定状态")
    print("4. 点击'解锁账户'按钮")

if __name__ == "__main__":
    print("🚀 开始测试登录安全机制")
    print()
    
    try:
        test_login_lockout()
        test_admin_unlock()
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保后端服务正在运行")
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
    
    print("\n✅ 测试完成")
