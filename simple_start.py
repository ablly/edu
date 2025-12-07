#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化启动脚本 - 避免SQLAlchemy版本兼容性问题
"""

import os
import sys

# 设置环境变量
os.environ['FLASK_APP'] = 'app.py'
os.environ['FLASK_ENV'] = 'development'

def main():
    """启动Flask应用"""
    print("=" * 50)
    print("🚀 启动AI辅助编程系统")
    print("=" * 50)
    print("📚 功能包括:")
    print("  - 作业批改")
    print("  - AI答疑")
    print("  - 辅助编程")
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
        # 导入并启动应用
        from app import app
        
        # 在应用上下文中初始化数据库
        with app.app_context():
            from models import db
            try:
                db.create_all()
                print("✅ 数据库初始化成功")
            except Exception as e:
                print(f"⚠️ 数据库初始化警告: {e}")
        
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
        print("\n💡 尝试解决方案:")
        print("1. 检查Python版本: python --version")
        print("2. 安装依赖: pip install -r requirements.txt")
        print("3. 检查API配置: 编辑config.py文件")
        sys.exit(1)

if __name__ == "__main__":
    main()