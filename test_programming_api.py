#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
辅助编程API测试脚本
"""

import requests
import json

# API基础URL
BASE_URL = "http://localhost:5000"

def test_programming_help():
    """测试编程助手API"""
    print("=== 测试编程助手API ===")
    
    test_data = {
        "code": """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

# 测试
numbers = [64, 34, 25, 12, 22, 11, 90]
print(bubble_sort(numbers))
        """,
        "question": "这个冒泡排序算法有什么可以优化的地方吗？",
        "language": "python"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/programming-help",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 编程助手API调用成功")
            print(f"回答: {result.get('response', '无回答')}")
        else:
            print(f"❌ 编程助手API调用失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")

def test_code_review():
    """测试代码审查API"""
    print("\n=== 测试代码审查API ===")
    
    test_data = {
        "code": """
def calculate_average(numbers):
    total = 0
    for num in numbers:
        total += num
    return total / len(numbers)

result = calculate_average([1, 2, 3, 4, 5])
print(result)
        """,
        "language": "python"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/code-review",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 代码审查API调用成功")
            print(f"审查结果: {result.get('review', '无审查结果')}")
        else:
            print(f"❌ 代码审查API调用失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")

def test_code_explain():
    """测试代码解释API"""
    print("\n=== 测试代码解释API ===")
    
    test_data = {
        "code": """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(10):
    print(fibonacci(i))
        """,
        "language": "python"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/code-explain",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 代码解释API调用成功")
            print(f"解释内容: {result.get('explanation', '无解释内容')}")
        else:
            print(f"❌ 代码解释API调用失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")

def test_debug_help():
    """测试调试帮助API"""
    print("\n=== 测试调试帮助API ===")
    
    test_data = {
        "code": """
def divide_numbers(a, b):
    return a / b

result = divide_numbers(10, 0)
print(result)
        """,
        "error_message": "ZeroDivisionError: division by zero",
        "language": "python"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/debug-help",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 调试帮助API调用成功")
            print(f"调试建议: {result.get('debug_help', '无调试建议')}")
        else:
            print(f"❌ 调试帮助API调用失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")

def test_ai_ask():
    """测试AI答疑API"""
    print("\n=== 测试AI答疑API ===")
    
    test_data = {
        "question": "什么是递归？请用简单的例子说明。",
        "session_id": "test_session_123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/ask",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI答疑API调用成功")
            print(f"回答: {result.get('answer', '无回答')}")
        else:
            print(f"❌ AI答疑API调用失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")

if __name__ == "__main__":
    print("开始测试辅助编程和AI答疑API...")
    print("请确保Flask应用正在运行 (python app.py)")
    print("=" * 50)
    
    # 运行所有测试
    test_programming_help()
    test_code_review()
    test_code_explain()
    test_debug_help()
    test_ai_ask()
    
    print("\n" + "=" * 50)
    print("测试完成！")