#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
启动服务器脚本
"""

import os
import sys
from app import app

def main():
    """启动Flask应用"""
    print("=" * 50)
    print("🚀 启动AI作业批改系统")
    print("=" * 50)
    print("📚 功能包括:")
    print("  - 作业批改")
    print("  - AI答疑")
    print("  - 辅助编程 (新功能)")
    print("  - 代码审查")
    print("  - 代码解释")
    print("  - 调试帮助")
    print("=" * 50)
    print("🌐 访问地址:")
    print("  - 主页: http://localhost:5000")
    print("  - 辅助编程: http://localhost:5000/Auxiliary-programming")
    print("  - AI答疑: http://localhost:5000/ai-ask")
    print("=" * 50)
    print("⚡ 正在启动服务器...")
    print("按 Ctrl+C 停止服务器")
    print("=" * 50)
    
    try:
        # 启动Flask应用
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()