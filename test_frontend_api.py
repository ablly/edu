#!/usr/bin/env python3
"""
测试前端API请求
"""

import requests
import json

def test_frontend_orders_api():
    """测试前端订单API请求"""
    
    # 测试订单列表API
    print("=== 测试订单列表API ===")
    try:
        url = 'http://localhost:5000/api/admin/orders'
        headers = {
            'Authorization': 'Bearer admin_token',
            'Content-Type': 'application/json'
        }
        params = {
            'page': 1,
            'per_page': 20
        }
        
        print(f"请求URL: {url}")
        print(f"请求参数: {params}")
        print(f"请求头: {headers}")
        
        response = requests.get(url, headers=headers, params=params)
        
        print(f"响应状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"响应数据结构: {list(data.keys()) if isinstance(data, dict) else type(data)}")
            
            if isinstance(data, dict):
                print(f"success: {data.get('success')}")
                print(f"orders数量: {len(data.get('orders', []))}")
                print(f"total: {data.get('total')}")
                print(f"page: {data.get('page')}")
                print(f"per_page: {data.get('per_page')}")
                
                if data.get('orders'):
                    print(f"\n第一个订单:")
                    first_order = data['orders'][0]
                    print(json.dumps(first_order, indent=2, ensure_ascii=False))
                else:
                    print("警告: orders数组为空")
            else:
                print(f"完整响应: {response.text}")
        else:
            print(f"请求失败: {response.status_code}")
            print(f"错误响应: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("连接失败: 无法连接到服务器，请确保Flask应用正在运行")
    except Exception as e:
        print(f"请求异常: {e}")
        import traceback
        traceback.print_exc()

    # 测试订单统计API
    print("\n=== 测试订单统计API ===")
    try:
        url = 'http://localhost:5000/api/admin/orders/stats'
        headers = {
            'Authorization': 'Bearer admin_token',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(url, headers=headers)
        
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"统计数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
        else:
            print(f"请求失败: {response.status_code}")
            print(f"错误响应: {response.text}")
            
    except Exception as e:
        print(f"统计API请求异常: {e}")

if __name__ == '__main__':
    test_frontend_orders_api()
