#!/usr/bin/env python3
"""
检查不同数据库文件的内容
"""

import os
import sqlite3
from datetime import datetime

def check_database_file(db_path, db_name):
    """检查数据库文件"""
    print(f"\n=== 检查 {db_name} ===")
    print(f"路径: {db_path}")
    
    if not os.path.exists(db_path):
        print("❌ 数据库文件不存在")
        return
    
    file_size = os.path.getsize(db_path)
    mod_time = datetime.fromtimestamp(os.path.getmtime(db_path))
    print(f"文件大小: {file_size} bytes")
    print(f"修改时间: {mod_time}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 检查表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"表数量: {len(tables)}")
        
        # 检查orders表
        if ('orders',) in tables:
            cursor.execute("SELECT COUNT(*) FROM orders;")
            order_count = cursor.fetchone()[0]
            print(f"📦 orders表: {order_count} 条记录")
            
            if order_count > 0:
                cursor.execute("SELECT id, order_number, status, amount FROM orders LIMIT 3;")
                orders = cursor.fetchall()
                print("前3个订单:")
                for order in orders:
                    print(f"  - ID:{order[0]} | {order[1]} | {order[2]} | ¥{order[3]}")
        else:
            print("❌ 没有orders表")
        
        # 检查admins表
        if ('admins',) in tables:
            cursor.execute("SELECT COUNT(*) FROM admins;")
            admin_count = cursor.fetchone()[0]
            print(f"👤 admins表: {admin_count} 条记录")
            
            if admin_count > 0:
                cursor.execute("SELECT id, username, email FROM admins;")
                admins = cursor.fetchall()
                print("管理员:")
                for admin in admins:
                    print(f"  - ID:{admin[0]} | {admin[1]} | {admin[2]}")
        else:
            print("❌ 没有admins表")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ 数据库访问失败: {e}")

def main():
    """主函数"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 检查可能的数据库文件
    db_files = [
        (os.path.join(base_dir, 'database', 'scores.db'), 'scores.db (配置中的路径)'),
        (os.path.join(base_dir, 'data', 'edupilot.db'), 'edupilot.db (生产环境路径)'),
        (os.path.join(base_dir, 'scores.db'), 'scores.db (根目录)'),
        (os.path.join(base_dir, 'edupilot.db'), 'edupilot.db (根目录)'),
    ]
    
    print("🔍 检查所有可能的数据库文件...")
    
    for db_path, db_name in db_files:
        check_database_file(db_path, db_name)
    
    # 检查当前目录下的所有.db文件
    print(f"\n=== 当前目录下的所有.db文件 ===")
    for file in os.listdir(base_dir):
        if file.endswith('.db'):
            full_path = os.path.join(base_dir, file)
            check_database_file(full_path, f"{file} (当前目录)")

if __name__ == '__main__':
    main()
