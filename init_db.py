#!/usr/bin/env python3
"""
数据库初始化脚本
用于初始化和迁移EduPilot学生管理系统数据库
"""

import os
import sys
from datetime import datetime, timedelta
from flask import Flask
from flask_migrate import Migrate, init, migrate, upgrade
from models import db, Student, Assignment, QuestionSubmission
from config import Config

def create_app():
    """创建Flask应用实例"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # 确保数据库目录存在
    db_dir = os.path.dirname(app.config['DATABASE_PATH'])
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    # 初始化数据库
    db.init_app(app)
    migrate = Migrate(app, db)
    
    return app, migrate

def init_database():
    """初始化数据库"""
    app, migrate_instance = create_app()
    
    with app.app_context():
        print("正在初始化数据库...")
        
        # 创建所有表
        db.create_all()
        print("✓ 数据库表创建完成")
        
        # 检查是否需要创建示例数据
        student_count = Student.query.count()
        if student_count == 0:
            create_sample_data()
        else:
            print(f"✓ 数据库中已有 {student_count} 个学生记录")
        
        print("✓ 数据库初始化完成")

def create_sample_data():
    """创建示例数据"""
    print("正在创建示例数据...")
    
    # 检查是否已有数据
    if Student.query.first():
        print("数据库中已存在学生数据，跳过创建示例数据")
        return
    
    # 创建示例学生
    students_data = [
        {
            'student_id': '202301001',
            'name': '张三',
            'gender': '男',
            'birth_date': datetime(2001, 5, 15).date(),
            'phone': '13800138001',
            'email': 'zhangsan@example.com',
            'major': '计算机科学与技术',
            'class_name': '计科2023-1班',
            'grade': '2023级',
            'education_level': '本科',
            'student_status': '在读'
        },
        {
            'student_id': '202301002',
            'name': '李四',
            'gender': '女',
            'birth_date': datetime(2002, 3, 20).date(),
            'phone': '13800138002',
            'email': 'lisi@example.com',
            'major': '计算机科学与技术',
            'class_name': '计科2023-1班',
            'grade': '2023级',
            'education_level': '本科',
            'student_status': '在读'
        },
        {
            'student_id': '202301003',
            'name': '王五',
            'gender': '男',
            'birth_date': datetime(2001, 12, 8).date(),
            'phone': '13800138003',
            'email': 'wangwu@example.com',
            'major': '软件工程',
            'class_name': '软工2023-1班',
            'grade': '2023级',
            'education_level': '本科',
            'student_status': '在读'
        },
        {
            'student_id': '202301004',
            'name': '赵六',
            'gender': '女',
            'birth_date': datetime(2002, 7, 25).date(),
            'phone': '13800138004',
            'email': 'zhaoliu@example.com',
            'major': '软件工程',
            'class_name': '软工2023-1班',
            'grade': '2023级',
            'education_level': '本科',
            'student_status': '在读'
        },
        {
            'student_id': '202301005',
            'name': '孙七',
            'gender': '男',
            'birth_date': datetime(2001, 9, 10).date(),
            'phone': '13800138005',
            'email': 'sunqi@example.com',
            'major': '数据科学与大数据技术',
            'class_name': '数据2023-1班',
            'grade': '2023级',
            'education_level': '本科',
            'student_status': '在读'
        }
    ]
    
    students = []
    for data in students_data:
        student = Student(**data)
        db.session.add(student)
        students.append(student)
    
    # 提交学生数据
    db.session.commit()
    print(f"已创建 {len(students)} 个示例学生")
    
    # 创建示例作业数据
    import random
    subjects = ['数据结构', 'Python编程', '计算机网络', '操作系统', '数据库原理']
    chapters = {
        '数据结构': ['线性表', '栈和队列', '树和二叉树', '图'],
        'Python编程': ['基础语法', '面向对象', '文件操作', '网络编程'],
        '计算机网络': ['网络基础', 'TCP/IP协议', 'HTTP协议', '网络安全'],
        '操作系统': ['进程管理', '内存管理', '文件系统', '设备管理'],
        '数据库原理': ['关系模型', 'SQL语言', '事务管理', '索引优化']
    }
    
    assignment_names = [
        '第一次作业', '第二次作业', '第三次作业', '课程设计',
        '实验报告1', '实验报告2', '期中作业', '综合练习',
        '编程作业', '算法实现', '系统设计', '项目报告'
    ]
    
    assignments = []
    for student in students:
        # 为每个学生创建10-15个作业记录
        num_assignments = random.randint(10, 15)
        
        for i in range(num_assignments):
            subject = random.choice(subjects)
            chapter = random.choice(chapters[subject])
            assignment_name = random.choice(assignment_names)
            
            # 生成符合正态分布的成绩，平均分75-85
            base_score = random.normalvariate(80, 10)
            score = max(0, min(100, round(base_score, 1)))
            
            # 生成提交时间（过去3个月内的随机时间）
            days_ago = random.randint(1, 90)
            submission_time = datetime.now() - timedelta(days=days_ago)
            
            assignment = Assignment(
                student_id=student.student_id,
                assignment_name=f"{subject}-{assignment_name}",
                subject=subject,
                chapter=chapter,
                score=score,
                feedback=f"作业完成质量{'优秀' if score >= 90 else '良好' if score >= 80 else '一般' if score >= 70 else '需改进'}",
                submission_time=submission_time
            )
            
            db.session.add(assignment)
            assignments.append(assignment)
    
    # 提交作业数据
    db.session.commit()
    print(f"已创建 {len(assignments)} 个示例作业记录")
    
    # 创建一些问题提交记录
    questions = []
    for student in students:
        num_questions = random.randint(5, 12)
        
        for i in range(num_questions):
            is_correct = random.choice([True, True, True, False])  # 75%正确率
            score = 100 if is_correct else 0
            
            days_ago = random.randint(1, 60)
            submission_time = datetime.now() - timedelta(days=days_ago)
            
            question = QuestionSubmission(
                student_id=student.student_id,
                question_id=f"q_{random.randint(1000, 9999)}",
                answer_text=f"学生答案_{i+1}",
                is_correct=is_correct,
                score=score,
                feedback="回答正确" if is_correct else "回答错误，请重新思考",
                submission_time=submission_time
            )
            
            db.session.add(question)
            questions.append(question)
    
    # 提交问题数据
    db.session.commit()
    print(f"已创建 {len(questions)} 个示例问题提交记录")
    
    print("示例数据创建完成！")

def run_migrations():
    """运行数据库迁移"""
    app, migrate_instance = create_app()
    
    with app.app_context():
        print("正在检查迁移状态...")
        
        # 检查是否已初始化迁移
        migrations_dir = os.path.join(os.getcwd(), 'migrations')
        if not os.path.exists(migrations_dir):
            print("初始化迁移...")
            init()
            print("✓ 迁移初始化完成")
        
        # 创建迁移
        print("生成迁移文件...")
        migrate(message="Enhanced student model with complete fields")
        print("✓ 迁移文件生成完成")
        
        # 应用迁移
        print("应用数据库迁移...")
        upgrade()
        print("✓ 数据库迁移完成")

def reset_database():
    """重置数据库（危险操作）"""
    app, migrate_instance = create_app()
    
    confirmation = input("⚠️  警告：此操作将删除所有数据！请输入 'RESET' 确认: ")
    if confirmation != 'RESET':
        print("操作已取消")
        return
    
    with app.app_context():
        print("正在重置数据库...")
        
        # 删除所有表
        db.drop_all()
        print("✓ 已删除所有表")
        
        # 重新创建表
        db.create_all()
        print("✓ 已重新创建表")
        
        # 创建示例数据
        create_sample_data()
        
        print("✓ 数据库重置完成")

def check_database():
    """检查数据库状态"""
    app, migrate_instance = create_app()
    
    with app.app_context():
        print("数据库状态检查:")
        print("-" * 40)
        
        # 检查数据库文件
        db_path = app.config['DATABASE_PATH']
        if os.path.exists(db_path):
            db_size = os.path.getsize(db_path)
            print(f"数据库文件: {db_path}")
            print(f"文件大小: {db_size} bytes")
        else:
            print("数据库文件不存在")
            return
        
        # 检查表和数据
        try:
            student_count = Student.query.count()
            print(f"学生记录数: {student_count}")
            
            if student_count > 0:
                latest_student = Student.query.order_by(Student.created_at.desc()).first()
                if latest_student:
                    print(f"最新学生: {latest_student.name} ({latest_student.student_id})")
            
            # 统计信息
            status_stats = db.session.query(
                Student.student_status,
                db.func.count(Student.id)
            ).group_by(Student.student_status).all()
            
            if status_stats:
                print("学生状态统计:")
                for status, count in status_stats:
                    print(f"  {status or '未设置'}: {count}")
            
        except Exception as e:
            print(f"查询数据库时出错: {str(e)}")

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法: python init_db.py [command]")
        print("命令:")
        print("  init     - 初始化数据库和示例数据")
        print("  migrate  - 运行数据库迁移")
        print("  reset    - 重置数据库（删除所有数据）")
        print("  check    - 检查数据库状态")
        return
    
    command = sys.argv[1].lower()
    
    if command == 'init':
        init_database()
    elif command == 'migrate':
        run_migrations()
    elif command == 'reset':
        reset_database()
    elif command == 'check':
        check_database()
    else:
        print(f"未知命令: {command}")
        print("可用命令: init, migrate, reset, check")

if __name__ == '__main__':
    main() 