#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os
from datetime import datetime

# 添加项目路径
sys.path.append(os.path.dirname(__file__))

try:
    print("正在导入模块...")
    from models import db, Student, Assignment, QuestionSubmission
    from config import Config
    from flask import Flask
    
    print("✓ 成功导入所有模块")
    
    # 创建Flask应用
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # 初始化数据库
    db.init_app(app)
    
    with app.app_context():
        print("正在测试数据库连接...")
        
        # 测试学生查询
        students = Student.query.limit(3).all()
        print(f"✓ 找到 {len(students)} 个学生:")
        for student in students:
            print(f"  - {student.student_id}: {student.name} ({student.class_name})")
        
        # 测试作业查询
        assignments = Assignment.query.limit(5).all()
        print(f"✓ 找到 {len(assignments)} 个作业记录")
        
        # 测试API响应格式
        if students:
            student_data = {
                'students': [s.to_simple_dict() for s in students]
            }
            print("✓ API数据格式正确")
        
        print("\n" + "="*50)
        print("数据库测试完成！现在启动服务器...")
        print("访问: http://127.0.0.1:5000")
        print("="*50)
        
        # 启动服务器
        from app import app as main_app
        main_app.run(debug=True, host='0.0.0.0', port=5000)
        
except Exception as e:
    print(f"✗ 错误: {e}")
    import traceback
    traceback.print_exc()
    input("按回车键退出...") 