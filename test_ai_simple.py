#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os
sys.path.append(os.path.dirname(__file__))

def test_deepseek_api():
    """测试DeepSeek API"""
    try:
        from openai import OpenAI
        import config
        
        print("🧪 测试DeepSeek API连接...")
        print(f"🔑 API Key: {config.DEEPSEEK_API_KEY[:20]}...")
        print(f"🌐 Base URL: {config.DEEPSEEK_BASE_URL}")
        print(f"🤖 Model: {config.DEEPSEEK_MODEL}")
        
        client = OpenAI(
            api_key=config.DEEPSEEK_API_KEY,
            base_url=config.DEEPSEEK_BASE_URL
        )
        
        response = client.chat.completions.create(
            model=config.DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": "你是一个有用的助手"},
                {"role": "user", "content": "请简单回答：你好"}
            ],
            temperature=0.3,
            max_tokens=100
        )
        
        answer = response.choices[0].message.content
        print("✅ DeepSeek API调用成功!")
        print(f"🤖 AI回答: {answer}")
        
    except Exception as e:
        print(f"❌ DeepSeek API调用失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_deepseek_api() 