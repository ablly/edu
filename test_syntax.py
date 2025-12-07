#!/usr/bin/env python
# -*- coding: utf-8 -*-

import ast
import sys

def check_syntax(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            source = f.read()
        
        # 尝试解析Python代码
        ast.parse(source)
        print(f"✓ {filename} 语法检查通过")
        return True
        
    except SyntaxError as e:
        print(f"✗ {filename} 语法错误:")
        print(f"  第 {e.lineno} 行: {e.text.strip() if e.text else ''}")
        print(f"  错误: {e.msg}")
        return False
    except Exception as e:
        print(f"✗ {filename} 检查失败: {e}")
        return False

if __name__ == "__main__":
    if check_syntax("app.py"):
        print("可以尝试启动服务器")
    else:
        print("请先修复语法错误") 