import requests
import json

# 测试删除API
BASE_URL = "http://localhost:5000/api/admin"

# 从localStorage获取token（需要手动替换）
TOKEN = "your_admin_token_here"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def test_delete_tier(tier_id):
    print(f"\n=== 测试删除套餐 ID: {tier_id} ===")
    
    # 发送DELETE请求
    url = f"{BASE_URL}/memberships/tiers/{tier_id}"
    print(f"URL: {url}")
    print(f"Method: DELETE")
    
    response = requests.delete(url, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    return response.json()

def test_get_tiers():
    print("\n=== 获取所有套餐 ===")
    url = f"{BASE_URL}/memberships/tiers"
    response = requests.get(url, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    data = response.json()
    
    if data.get('success'):
        print(f"套餐数量: {len(data['data'])}")
        for tier in data['data']:
            print(f"  - ID: {tier['id']}, Code: {tier['code']}, Name: {tier['name']}")
    else:
        print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
    
    return data

if __name__ == "__main__":
    print("请先手动设置TOKEN变量为有效的admin_token")
    print("可以从浏览器localStorage中获取")
    
    # 获取当前套餐列表
    test_get_tiers()
    
    # 测试删除（需要一个测试套餐ID）
    # test_delete_tier(8)  # 取消注释并替换ID进行测试


