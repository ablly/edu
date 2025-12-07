#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试AI答疑API的脚本
"""

import requests
import json

def test_ai_api():
    """测试AI答疑API"""
    url = "http://127.0.0.1:5000/api/ai/ask"
    
    test_data = {
        "question": "你好，请简单介绍一下什么是Python编程语言？",
        "session_id": "test_session_123"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("🧪 测试AI答疑API...")
    print(f"📤 发送请求: {url}")
    print(f"📋 数据: {json.dumps(test_data, ensure_ascii=False, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data, headers=headers, timeout=30)
        
        print(f"📊 状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API调用成功!")
            print(f"🤖 AI回答: {result.get('answer', '无回答')}")
            print(f"🆔 会话ID: {result.get('session_id', '无')}")
        else:
            print("❌ API调用失败!")
            try:
                error_data = response.json()
                print(f"🚫 错误信息: {error_data.get('error', '未知错误')}")
            except:
                print(f"📄 响应内容: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ 连接失败! 请确保Flask服务器正在运行在 http://127.0.0.1:5000")
    except requests.exceptions.Timeout:
        print("⏰ 请求超时!")
    except Exception as e:
        print(f"💥 发生异常: {e}")

if __name__ == "__main__":
    test_ai_api() 