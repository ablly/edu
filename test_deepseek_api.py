#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DeepSeek API连接测试脚本
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from openai import OpenAI
import config

def test_deepseek_api():
    """测试DeepSeek API连接"""
    print("=" * 50)
    print("🧪 测试DeepSeek API连接")
    print("=" * 50)
    
    # 显示配置信息
    print("📋 API配置:")
    print(f"  - API URL: {config.DEEPSEEK_BASE_URL}")
    print(f"  - API Key: {config.DEEPSEEK_API_KEY[:10]}...")
    print(f"  - Model: {config.DEEPSEEK_MODEL}")
    print("=" * 50)
    
    # 测试简单对话
    print("🤖 测试AI对话...")
    
    try:
        client = OpenAI(
            api_key=config.DEEPSEEK_API_KEY, 
            base_url=config.DEEPSEEK_BASE_URL
        )
        
        response = client.chat.completions.create(
            model=config.DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": "你是一位编程助手，请用中文回答。"},
                {"role": "user", "content": "请简单介绍一下Python编程语言。"}
            ],
            temperature=0.3,
            max_tokens=500,
            stream=False
        )
        
        ai_response = response.choices[0].message.content
        print("✅ DeepSeek API连接成功!")
        print(f"📝 AI回答: {ai_response[:100]}...")
        return True
        
    except Exception as e:
        print("❌ DeepSeek API连接异常!")
        print(f"🔍 异常信息: {str(e)}")
        return False

def test_programming_help():
    """测试编程助手功能"""
    print("=" * 50)
    print("🛠️ 测试编程助手功能...")
    
    test_code = """
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n-1)

print(factorial(5))
    """
    
    test_question = "这个递归函数有什么优缺点？如何优化？"
    
    try:
        client = OpenAI(
            api_key=config.DEEPSEEK_API_KEY, 
            base_url=config.DEEPSEEK_BASE_URL
        )
        
        prompt = f"""你是一位专业的编程助手，请分析以下代码并回答问题。

代码：
```python
{test_code}
```

问题：{test_question}

请用中文回答，提供详细的分析和建议。"""
        
        response = client.chat.completions.create(
            model=config.DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": "你是一位专业的编程助手，擅长代码分析和优化建议。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000,
            stream=False
        )
        
        ai_response = response.choices[0].message.content
        print("✅ 编程助手功能正常!")
        print(f"📝 建议: {ai_response[:200]}...")
        return True
        
    except Exception as e:
        print("❌ 编程助手测试异常!")
        print(f"🔍 异常信息: {str(e)}")
        return False

def main():
    """主函数"""
    print("🚀 开始DeepSeek API测试...")
    
    # 测试基本连接
    api_ok = test_deepseek_api()
    
    if api_ok:
        # 测试编程助手
        programming_ok = test_programming_help()
        
        if programming_ok:
            print("=" * 50)
            print("🎉 所有测试通过!")
            print("💡 可以启动服务器了: python start_server.py")
        else:
            print("=" * 50)
            print("⚠️ 编程助手功能测试失败")
    else:
        print("=" * 50)
        print("❌ API连接失败，请检查配置")
    
    print("=" * 50)

if __name__ == "__main__":
    main()