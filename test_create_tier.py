import requests
import json

BASE_URL = "http://localhost:5000/api/admin"

# 从浏览器 localStorage 获取 token
# 或者使用一个已知的管理员 token
TOKEN = "admin_token"  # 需要替换为真实的 token

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# 测试数据
test_tier = {
    "name": "测试套餐",
    "code": "test_tier_new",
    "description": "这是一个测试套餐",
    "price": 2.00,
    "duration_days": 30,
    "is_active": False,
    "is_limited": False,
    "is_early_bird": False,
    "total_quota": 0,
    "early_bird_tier": 0,
    "original_price": 10.00,
    "features": ["智能出题功能", "作业批改", "学习分析"]
}

print("=== 测试创建会员套餐 ===")
print(f"请求数据:\n{json.dumps(test_tier, indent=2, ensure_ascii=False)}\n")

response = requests.post(
    f"{BASE_URL}/memberships/tiers",
    headers=headers,
    json=test_tier
)

print(f"状态码: {response.status_code}")
print(f"响应:\n{json.dumps(response.json(), indent=2, ensure_ascii=False)}")

if response.status_code == 200:
    print("\n✅ 创建成功！")
else:
    print(f"\n❌ 创建失败: {response.json().get('message', '未知错误')}")


