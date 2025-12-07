#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试会员套餐API接口
"""

import requests
import json

BASE_URL = "http://localhost:5000"
# 这里需要一个有效的管理员token
ADMIN_TOKEN = "admin_token"  # 实际使用时需要替换为真实的token

headers = {
    "Authorization": f"Bearer {ADMIN_TOKEN}",
    "Content-Type": "application/json"
}

def test_get_tiers():
    """测试获取套餐列表"""
    print("\n=== 测试获取套餐列表 ===")
    url = f"{BASE_URL}/api/admin/memberships/tiers"
    response = requests.get(url, headers=headers)
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.json()

def test_update_tier(tier_id):
    """测试更新套餐"""
    print(f"\n=== 测试更新套餐 ID: {tier_id} ===")
    url = f"{BASE_URL}/api/admin/memberships/tiers/{tier_id}"
    data = {
        "description": "测试更新描述"
    }
    response = requests.put(url, headers=headers, json=data)
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    else:
        print(f"错误: {response.text}")

def test_delete_tier(tier_id):
    """测试删除套餐"""
    print(f"\n=== 测试删除套餐 ID: {tier_id} ===")
    url = f"{BASE_URL}/api/admin/memberships/tiers/{tier_id}"
    response = requests.delete(url, headers=headers)
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    else:
        print(f"错误: {response.text}")

if __name__ == '__main__':
    try:
        # 1. 获取套餐列表
        tiers_response = test_get_tiers()
        
        # 2. 测试更新套餐（使用第一个非免费套餐）
        if tiers_response.get('data') and len(tiers_response['data']['tiers']) > 1:
            tier_id = tiers_response['data']['tiers'][1]['id']
            test_update_tier(tier_id)
        
        print("\n✅ API测试完成")
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")


