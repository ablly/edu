#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试用户开通会员API
"""

import requests
import json

# API配置
BASE_URL = "http://localhost:5000/api/admin"
ADMIN_TOKEN = "admin_token"  # 使用实际的管理员token

# 请求头
headers = {
    "Authorization": f"Bearer {ADMIN_TOKEN}",
    "Content-Type": "application/json"
}

def test_grant_membership():
    """测试开通会员API"""
    print("\n" + "="*60)
    print("🧪 测试用户开通会员API")
    print("="*60)
    
    # 测试数据
    user_id = 1  # 假设用户ID为1
    test_data = {
        "tier_id": 1,         # 会员套餐ID
        "duration_days": 90,  # 3个月 = 90天
        "note": "测试开通会员"
    }
    
    print(f"\n📤 发送请求:")
    print(f"URL: {BASE_URL}/users/{user_id}/grant-membership")
    print(f"数据: {json.dumps(test_data, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/users/{user_id}/grant-membership",
            headers=headers,
            json=test_data,
            timeout=10
        )
        
        print(f"\n📥 响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 成功: {json.dumps(result, indent=2, ensure_ascii=False)}")
            return True
        else:
            print(f"❌ 失败: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ 错误: 无法连接到后端服务器，请确保Flask服务正在运行")
        return False
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        return False

def test_different_durations():
    """测试不同的开通时长"""
    print("\n" + "="*60)
    print("🧪 测试不同开通时长")
    print("="*60)
    
    test_cases = [
        {"months": 1, "days": 30, "desc": "1个月"},
        {"months": 3, "days": 90, "desc": "3个月"},
        {"months": 6, "days": 180, "desc": "6个月"},
        {"months": 12, "days": 360, "desc": "12个月"},
    ]
    
    for case in test_cases:
        print(f"\n📋 测试: {case['desc']} ({case['days']}天)")
        print(f"   前端输入: {case['months']}个月")
        print(f"   后端接收: {case['days']}天")
        print(f"   转换公式: {case['months']} * 30 = {case['days']}")

def main():
    """主函数"""
    print("\n" + "🚀 " + "="*58)
    print("   用户开通会员功能测试")
    print("="*60)
    
    # 测试API
    success = test_grant_membership()
    
    # 测试不同时长
    test_different_durations()
    
    # 总结
    print("\n" + "="*60)
    print("📊 测试总结")
    print("="*60)
    print(f"API测试: {'✅ 通过' if success else '❌ 失败'}")
    print("\n💡 提示:")
    print("1. 如果API测试失败，请检查:")
    print("   - 后端服务器是否运行 (python app.py)")
    print("   - 管理员token是否正确")
    print("   - 用户ID是否存在")
    print("   - 会员套餐ID是否存在")
    print("\n2. 前端测试步骤:")
    print("   - 刷新浏览器 (Ctrl + F5)")
    print("   - 进入用户管理页面")
    print("   - 点击'开通会员'按钮")
    print("   - 填写表单并提交")
    print("   - 检查控制台是否有错误")
    print("\n3. 数据转换:")
    print("   - 前端: 用户输入'月份'")
    print("   - 转换: 月份 * 30 = 天数")
    print("   - 后端: 接收'天数'")
    print("="*60)

if __name__ == "__main__":
    main()

