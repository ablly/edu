#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
管理后台API自动化测试脚本
测试所有已实现的API端点
"""

import requests
import json
import sys
from datetime import datetime

# 配置
BASE_URL = "http://localhost:5000"
ADMIN_USERNAME = "zqh"
ADMIN_PASSWORD = "Zqh050102@"

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{text:^70}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'='*70}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.BLUE}→ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

# 测试结果统计
test_results = {
    'passed': 0,
    'failed': 0,
    'errors': []
}

# Session对象保持登录状态
session = requests.Session()

def test_api(name, method, url, data=None, expected_status=200, description=""):
    """通用API测试函数"""
    print_info(f"测试: {description or name}")
    
    try:
        if method.upper() == 'GET':
            response = session.get(url)
        elif method.upper() == 'POST':
            response = session.post(url, json=data)
        elif method.upper() == 'PUT':
            response = session.put(url, json=data)
        elif method.upper() == 'DELETE':
            response = session.delete(url)
        else:
            raise ValueError(f"不支持的HTTP方法: {method}")
        
        if response.status_code == expected_status:
            test_results['passed'] += 1
            print_success(f"{name} - 状态码: {response.status_code}")
            
            # 打印响应数据（如果是JSON）
            try:
                resp_data = response.json()
                if 'data' in resp_data:
                    print(f"  {Colors.BLUE}响应数据: {json.dumps(resp_data.get('data', {}), ensure_ascii=False, indent=2)[:200]}...{Colors.END}")
            except:
                pass
            
            return response
        else:
            test_results['failed'] += 1
            error_msg = f"{name} - 期望: {expected_status}, 实际: {response.status_code}"
            print_error(error_msg)
            print_error(f"响应内容: {response.text}")
            test_results['errors'].append({
                'test': name,
                'error': error_msg,
                'response': response.text[:500]
            })
            return None
            
    except Exception as e:
        test_results['failed'] += 1
        error_msg = f"{name} - 异常: {str(e)}"
        print_error(error_msg)
        test_results['errors'].append({
            'test': name,
            'error': error_msg
        })
        return None

def main():
    print_header("🚀 管理后台API自动化测试")
    print(f"{Colors.BOLD}测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}\n")
    
    # ==================== 1. 登录测试 ====================
    print_header("1️⃣ 认证测试")
    
    response = test_api(
        "管理员登录",
        "POST",
        f"{BASE_URL}/api/admin/auth/login",
        data={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
        description="使用admin账户登录"
    )
    
    if not response or not response.json().get('success'):
        print_error("登录失败，无法继续测试")
        sys.exit(1)
    
    print_success(f"登录成功！管理员: {response.json()['data']['admin']['username']}")
    
    # 测试获取当前管理员信息
    test_api(
        "获取当前管理员",
        "GET",
        f"{BASE_URL}/api/admin/auth/current",
        description="验证登录状态"
    )
    
    # ==================== 2. Dashboard测试 ====================
    print_header("2️⃣ Dashboard统计")
    
    test_api(
        "获取Dashboard统计",
        "GET",
        f"{BASE_URL}/api/admin/stats/dashboard",
        description="获取总体统计数据"
    )
    
    test_api(
        "最近用户列表",
        "GET",
        f"{BASE_URL}/api/admin/stats/recent-users?limit=5",
        description="获取最近注册用户"
    )
    
    test_api(
        "最近订单列表",
        "GET",
        f"{BASE_URL}/api/admin/stats/recent-orders?limit=5",
        description="获取最近订单"
    )
    
    # ==================== 3. 用户管理测试 ====================
    print_header("3️⃣ 用户管理")
    
    # 获取用户列表
    response = test_api(
        "用户列表",
        "GET",
        f"{BASE_URL}/api/admin/users?page=1&pageSize=10",
        description="获取用户列表（分页）"
    )
    
    if response and response.json().get('success'):
        users = response.json()['data']['users']
        if users:
            test_user_id = users[0]['id']
            print_info(f"选择测试用户ID: {test_user_id}")
            
            # 获取用户详情
            test_api(
                "用户详情",
                "GET",
                f"{BASE_URL}/api/admin/users/{test_user_id}",
                description=f"获取用户ID={test_user_id}的详细信息"
            )
            
            # 更新用户信息（只更新非关键字段）
            test_api(
                "更新用户",
                "PUT",
                f"{BASE_URL}/api/admin/users/{test_user_id}",
                data={"phone": "13800138000"},
                description=f"更新用户ID={test_user_id}的手机号"
            )
            
            # 注意：这里不实际执行删除、禁用等危险操作，只测试接口是否存在
            print_warning("跳过危险操作（删除、禁用）的实际执行")
        else:
            print_warning("没有用户数据可供测试")
    
    # ==================== 4. 订单管理测试 ====================
    print_header("4️⃣ 订单管理")
    
    # 获取订单列表
    response = test_api(
        "订单列表",
        "GET",
        f"{BASE_URL}/api/admin/orders?page=1&pageSize=10",
        description="获取订单列表（分页）"
    )
    
    if response and response.json().get('success'):
        orders = response.json()['data']['orders']
        if orders:
            test_order_id = orders[0]['id']
            print_info(f"选择测试订单ID: {test_order_id}")
            
            # 获取订单详情
            test_api(
                "订单详情",
                "GET",
                f"{BASE_URL}/api/admin/orders/{test_order_id}",
                description=f"获取订单ID={test_order_id}的详细信息"
            )
            
            print_warning("跳过订单状态修改和退款操作的实际执行")
        else:
            print_warning("没有订单数据可供测试")
    
    # ==================== 5. 会员管理测试 ====================
    print_header("5️⃣ 会员管理")
    
    # 获取套餐列表
    response = test_api(
        "套餐列表",
        "GET",
        f"{BASE_URL}/api/admin/membership/tiers",
        description="获取所有会员套餐"
    )
    
    # 获取会员统计
    test_api(
        "会员统计",
        "GET",
        f"{BASE_URL}/api/admin/membership/stats",
        description="获取会员统计数据"
    )
    
    # 创建测试套餐
    test_tier_data = {
        "name": f"测试套餐_{datetime.now().strftime('%H%M%S')}",
        "code": f"test_{datetime.now().strftime('%H%M%S')}",
        "description": "自动化测试创建的套餐",
        "price": 99.9,
        "duration_days": 30,
        "is_active": False,  # 设置为不激活，避免影响生产
        "sort_order": 999
    }
    
    response = test_api(
        "创建套餐",
        "POST",
        f"{BASE_URL}/api/admin/membership/tiers",
        data=test_tier_data,
        description="创建测试用会员套餐"
    )
    
    if response and response.json().get('success'):
        created_tier_id = response.json()['data']['id']
        print_success(f"测试套餐创建成功，ID: {created_tier_id}")
        
        # 更新套餐
        test_api(
            "更新套餐",
            "PUT",
            f"{BASE_URL}/api/admin/membership/tiers/{created_tier_id}",
            data={"description": "已更新的描述"},
            description=f"更新套餐ID={created_tier_id}"
        )
        
        # 删除测试套餐（清理）
        test_api(
            "删除套餐",
            "DELETE",
            f"{BASE_URL}/api/admin/membership/tiers/{created_tier_id}",
            description=f"删除测试套餐ID={created_tier_id}"
        )
    
    # ==================== 测试总结 ====================
    print_header("📊 测试结果总结")
    
    total = test_results['passed'] + test_results['failed']
    success_rate = (test_results['passed'] / total * 100) if total > 0 else 0
    
    print(f"\n{Colors.BOLD}总测试数: {total}{Colors.END}")
    print(f"{Colors.GREEN}✓ 通过: {test_results['passed']}{Colors.END}")
    print(f"{Colors.RED}✗ 失败: {test_results['failed']}{Colors.END}")
    print(f"\n{Colors.BOLD}成功率: {success_rate:.1f}%{Colors.END}")
    
    if test_results['failed'] > 0:
        print(f"\n{Colors.RED}{Colors.BOLD}失败的测试详情:{Colors.END}")
        for i, error in enumerate(test_results['errors'], 1):
            print(f"\n{i}. {error['test']}")
            print(f"   错误: {error['error']}")
            if 'response' in error:
                print(f"   响应: {error['response']}")
    
    # 最终判断
    print("\n" + "="*70)
    if test_results['failed'] == 0:
        print(f"{Colors.GREEN}{Colors.BOLD}🎉 所有测试通过！系统运行正常！{Colors.END}")
        return 0
    else:
        print(f"{Colors.RED}{Colors.BOLD}⚠️  有{test_results['failed']}个测试失败，请检查！{Colors.END}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)

