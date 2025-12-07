#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
快速启动脚本 - 专门用于测试作业提交功能
"""

import os
import sys
from datetime import datetime

# 确保在正确的目录
if not os.path.exists('app.py'):
    print("错误：请在项目根目录运行此脚本")
    sys.exit(1)

print("🚀 启动作业提交系统测试...")
print("=" * 50)

try:
    # 导入必要模块
    from flask import Flask, render_template, jsonify
    from models import db, Student, Assignment
    from config import Config
    
    # 创建Flask应用
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    
    # 测试路由
    @app.route('/test/submit')
    def test_submit():
        """测试作业提交页面"""
        return render_template('submit.html')
    
    @app.route('/test/api/students')
    def test_students_api():
        """测试学生API"""
        try:
            students = Student.query.all()
            return jsonify({
                'students': [s.to_simple_dict() for s in students],
                'count': len(students)
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    # 启动测试
    with app.app_context():
        print("✓ Flask应用创建成功")
        
        # 测试数据库连接
        students = Student.query.limit(3).all()
        print(f"✓ 数据库连接正常，找到 {len(students)} 个学生")
        
        if students:
            for s in students:
                print(f"  - {s.student_id}: {s.name} ({s.class_name})")
        
        print("\n🌐 测试链接:")
        print("  - 作业提交页面: http://127.0.0.1:5000/test/submit")
        print("  - 学生API测试: http://127.0.0.1:5000/test/api/students")
        print("  - 完整系统: http://127.0.0.1:5000/submit")
        
        print("\n" + "=" * 50)
        print("🎯 服务器启动中...")
        print("按 Ctrl+C 停止服务器")
        print("=" * 50)
        
        # 启动服务器
        app.run(debug=True, host='127.0.0.1', port=5000, use_reloader=False)
        
except ImportError as e:
    print(f"❌ 模块导入失败: {e}")
    print("请检查依赖是否已安装")
except Exception as e:
    print(f"❌ 启动失败: {e}")
    import traceback
    traceback.print_exc()
finally:
    print("\n👋 服务器已停止") 