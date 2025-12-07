"""测试用户删除功能"""
import requests
import json

BASE_URL = 'http://localhost:5000'

def test_delete_user():
    print("\n" + "="*70)
    print("【测试用户删除功能】")
    print("="*70)
    
    # 1. 登录获取token
    print("\n步骤1：管理员登录...")
    login_data = {
        'username': 'zqh',
        'password': 'Zqh050102@'
    }
    
    response = requests.post(
        f'{BASE_URL}/api/admin/login',
        json=login_data,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code == 200:
        token = response.json()['data']['token']
        print(f"✓ 登录成功，Token: {token[:20]}...")
    else:
        print(f"✗ 登录失败: {response.text}")
        return
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    # 2. 获取用户列表
    print("\n步骤2：获取用户列表...")
    response = requests.get(
        f'{BASE_URL}/api/admin/users?page=1&pageSize=10',
        headers=headers
    )
    
    if response.status_code == 200:
        users = response.json()['users']
        print(f"✓ 获取到 {len(users)} 个用户")
        
        # 找一个测试用户（不是超级管理员）
        test_user = None
        for user in users:
            if user['username'] in ['zwwqh', 'zwwh', 'chq']:
                test_user = user
                break
        
        if test_user:
            print(f"\n找到测试用户: {test_user['username']} (ID: {test_user['id']})")
            
            # 3. 尝试删除用户
            print(f"\n步骤3：尝试删除用户 {test_user['username']}...")
            response = requests.delete(
                f"{BASE_URL}/api/admin/users/{test_user['id']}",
                headers=headers
            )
            
            print(f"响应状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"\n✅ 删除成功！")
                    print(f"   消息: {result.get('message')}")
                    
                    # 4. 验证用户已被删除
                    print(f"\n步骤4：验证用户是否已删除...")
                    response = requests.get(
                        f'{BASE_URL}/api/admin/users?page=1&pageSize=10',
                        headers=headers
                    )
                    
                    if response.status_code == 200:
                        users_after = response.json()['users']
                        user_ids = [u['id'] for u in users_after]
                        
                        if test_user['id'] not in user_ids:
                            print(f"✅ 验证通过：用户已从列表中删除")
                        else:
                            print(f"❌ 验证失败：用户仍在列表中")
                else:
                    print(f"\n❌ 删除失败: {result.get('message')}")
            else:
                print(f"\n❌ 删除请求失败: {response.text}")
        else:
            print("\n⚠️  未找到测试用户（zwwqh, zwwh, chq）")
            print("   请先在管理后台创建一个测试用户")
    else:
        print(f"✗ 获取用户列表失败: {response.text}")

if __name__ == '__main__':
    try:
        test_delete_user()
        
        print("\n" + "="*70)
        print("【测试完成】")
        print("="*70)
        print("""
现在可以在浏览器中测试：
1. 打开 http://localhost:5000/admin/dashboard
2. 登录（zqh / Zqh050102@）
3. 进入"用户管理"
4. 点击任意用户的"删除"按钮
5. 确认删除

应该可以成功删除了！✨
        """)
        
    except Exception as e:
        print(f"\n❌ 测试异常: {str(e)}")
        import traceback
        traceback.print_exc()




