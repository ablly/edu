"""诊断用户删除功能"""
import requests
import json
import os
import sys

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 设置环境变量
os.environ['DATABASE_URL'] = 'postgresql://edupilot_user:050102@localhost:5432/edupilot_db'

BASE_URL = 'http://localhost:5000'

def print_section(title):
    print("\n" + "="*70)
    print(f"【{title}】")
    print("="*70)

def test_full_delete_flow():
    """完整测试删除流程"""
    
    # 1. 登录
    print_section("步骤1：管理员登录")
    login_data = {
        'username': 'zqh',
        'password': 'Zqh050102@'
    }
    
    try:
        response = requests.post(
            f'{BASE_URL}/api/admin/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.text[:200]}")
        
        if response.status_code != 200:
            print(f"\n❌ 登录失败！")
            return
        
        data = response.json()
        if 'data' not in data or 'token' not in data['data']:
            print(f"\n❌ 响应格式错误: {data}")
            return
            
        token = data['data']['token']
        print(f"✓ Token: {token[:30]}...")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ 无法连接到Flask服务器！")
        print("请确保服务器正在运行：.\\start.ps1")
        return
    except Exception as e:
        print(f"\n❌ 登录异常: {str(e)}")
        return
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    # 2. 获取用户列表
    print_section("步骤2：获取用户列表")
    try:
        response = requests.get(
            f'{BASE_URL}/api/admin/users?page=1&pageSize=10',
            headers=headers,
            timeout=5
        )
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ 获取失败: {response.text}")
            return
        
        data = response.json()
        users = data.get('users', [])
        print(f"✓ 获取到 {len(users)} 个用户")
        
        # 找一个测试用户
        test_user = None
        for user in users:
            if user['username'] in ['zwwqh', 'zwwh', 'chq']:
                test_user = user
                break
        
        if not test_user:
            print("\n⚠️  未找到测试用户")
            print("创建一个测试用户...")
            # 创建测试用户
            create_data = {
                'username': 'test_delete',
                'email': 'test_delete@example.com',
                'password': 'Test123456'
            }
            response = requests.post(
                f'{BASE_URL}/api/admin/users',
                json=create_data,
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                test_user = response.json()['data']
                print(f"✓ 创建测试用户: {test_user['username']} (ID: {test_user['id']})")
            else:
                print(f"❌ 创建失败: {response.text}")
                return
        else:
            print(f"\n✓ 找到测试用户: {test_user['username']} (ID: {test_user['id']})")
        
    except Exception as e:
        print(f"\n❌ 异常: {str(e)}")
        return
    
    # 3. 检查删除API端点
    print_section("步骤3：测试删除API")
    try:
        delete_url = f"{BASE_URL}/api/admin/users/{test_user['id']}"
        print(f"DELETE URL: {delete_url}")
        print(f"Headers: {headers}")
        
        # 先发送OPTIONS请求测试CORS
        response = requests.options(delete_url, headers=headers, timeout=5)
        print(f"\nOPTIONS 状态码: {response.status_code}")
        
        # 发送DELETE请求
        response = requests.delete(delete_url, headers=headers, timeout=5)
        print(f"DELETE 状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"\n✅ 删除成功！")
                print(f"消息: {result.get('message')}")
                
                # 验证删除
                print_section("步骤4：验证删除结果")
                response = requests.get(
                    f'{BASE_URL}/api/admin/users?page=1&pageSize=20',
                    headers=headers,
                    timeout=5
                )
                
                if response.status_code == 200:
                    users_after = response.json().get('users', [])
                    user_ids = [u['id'] for u in users_after]
                    
                    if test_user['id'] not in user_ids:
                        print(f"✅ 验证通过：用户已被删除")
                    else:
                        print(f"❌ 验证失败：用户仍然存在")
            else:
                print(f"\n❌ 删除失败: {result.get('message')}")
        else:
            print(f"\n❌ 删除请求失败")
            try:
                error_data = response.json()
                print(f"错误信息: {error_data}")
            except:
                pass
                
    except Exception as e:
        print(f"\n❌ 删除异常: {str(e)}")
        import traceback
        traceback.print_exc()

def check_database():
    """检查数据库配置"""
    print_section("数据库配置检查")
    
    try:
        from app import app, db
        import sqlalchemy as sa
        
        with app.app_context():
            engine = db.engine
            print(f"✓ 数据库URL: {engine.url}")
            print(f"✓ 数据库类型: {engine.dialect.name}")
            
            if 'postgresql' in str(engine.url):
                print("✅ 使用 PostgreSQL")
                
                # 检查外键约束
                inspector = sa.inspect(engine)
                print("\n外键约束检查:")
                
                for table_name in ['user_memberships', 'payment_transactions', 'usage_logs']:
                    fks = inspector.get_foreign_keys(table_name)
                    for fk in fks:
                        if fk['referred_table'] == 'users':
                            ondelete = fk.get('ondelete', 'NO ACTION')
                            status = "✅" if ondelete == 'CASCADE' else "❌"
                            print(f"  {status} {table_name}.{fk['constrained_columns']} -> users: {ondelete}")
            else:
                print("❌ 未使用 PostgreSQL")
                
    except Exception as e:
        print(f"❌ 检查失败: {str(e)}")

if __name__ == '__main__':
    print("\n" + "╔" + "="*68 + "╗")
    print("║" + " "*22 + "删除功能诊断工具" + " "*23 + "║")
    print("╚" + "="*68 + "╝")
    
    check_database()
    test_full_delete_flow()
    
    print("\n" + "="*70)
    print("【诊断完成】")
    print("="*70)




