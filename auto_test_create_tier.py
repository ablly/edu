#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
自动测试创建套餐API
"""
import requests
import json

# 测试数据
test_data = {
    "name": "AI智能测试套餐",
    "code": "ai_test_auto_2025",
    "description": "这是一个自动测试创建的AI智能套餐",
    "price": 39.90,
    "duration_days": 30,
    "level": 0,
    "is_active": True,
    "is_limited": False,
    "is_early_bird": False,
    "total_quota": 0,
    "early_bird_tier": 0,
    "original_price": 0,
    "sort_order": 0,
    "features": ["AI智能答疑", "AI作业批改", "智能出题", "学习分析"]
}

print("=" * 60)
print("开始测试创建会员套餐API")
print("=" * 60)
print("\n测试数据:")
print(json.dumps(test_data, ensure_ascii=False, indent=2))
print("\n" + "=" * 60)

try:
    # 发送POST请求
    response = requests.post(
        'http://localhost:5000/api/admin/memberships/tiers',
        json=test_data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"\n响应状态码: {response.status_code}")
    print(f"响应头: {dict(response.headers)}")
    
    try:
        result = response.json()
        print(f"\n响应数据:")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        if response.status_code == 200:
            print("\n" + "=" * 60)
            print("✅ 测试成功！套餐创建成功！")
            print("=" * 60)
        else:
            print("\n" + "=" * 60)
            print(f"❌ 测试失败！状态码: {response.status_code}")
            print(f"错误信息: {result.get('message', '未知错误')}")
            print("=" * 60)
    except Exception as e:
        print(f"\n解析响应JSON失败: {e}")
        print(f"原始响应: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("\n❌ 连接失败！请确保后端服务器正在运行在 http://localhost:5000")
except Exception as e:
    print(f"\n❌ 请求失败: {e}")

print("\n测试完成！")


