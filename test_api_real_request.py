#!/usr/bin/env python3
"""
测试真实的API请求
"""

import requests
import json

def test_real_api_request():
    """测试真实的API请求"""
    
    print("=== 测试真实API请求 ===")
    
    # 从浏览器获取真实的token
    # 我们需要模拟前端的真实请求
    
    try:
        url = 'http://localhost:5000/api/admin/orders'
        
        # 尝试不同的认证方式
        test_cases = [
            {
                'name': '使用admin_token',
                'headers': {
                    'Authorization': 'Bearer admin_token',
                    'Content-Type': 'application/json'
                }
            },
            {
                'name': '不使用认证',
                'headers': {
                    'Content-Type': 'application/json'
                }
            },
            {
                'name': '使用Cookie认证',
                'headers': {
                    'Content-Type': 'application/json'
                },
                'cookies': {
                    'admin_session': 'test_session'
                }
            }
        ]
        
        for test_case in test_cases:
            print(f"\n--- {test_case['name']} ---")
            
            params = {
                'page': 1,
                'per_page': 20,
                '_t': '1760465858128'  # 使用真实的时间戳
            }
            
            try:
                response = requests.get(
                    url, 
                    headers=test_case['headers'],
                    params=params,
                    cookies=test_case.get('cookies', {}),
                    timeout=10
                )
                
                print(f"状态码: {response.status_code}")
                print(f"响应头: {dict(response.headers)}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        print(f"响应数据结构: {list(data.keys()) if isinstance(data, dict) else type(data)}")
                        
                        if isinstance(data, dict):
                            print(f"success: {data.get('success')}")
                            print(f"orders数量: {len(data.get('orders', []))}")
                            print(f"total: {data.get('total')}")
                            
                            if data.get('orders'):
                                print(f"第一个订单: {data['orders'][0]}")
                            else:
                                print("⚠️ orders数组为空!")
                                print(f"完整响应: {json.dumps(data, indent=2, ensure_ascii=False)}")
                        else:
                            print(f"完整响应: {response.text}")
                    except json.JSONDecodeError as e:
                        print(f"JSON解析失败: {e}")
                        print(f"原始响应: {response.text}")
                else:
                    print(f"请求失败: {response.status_code}")
                    print(f"错误响应: {response.text}")
                    
            except requests.exceptions.RequestException as e:
                print(f"请求异常: {e}")
    
    except Exception as e:
        print(f"测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_real_api_request()
