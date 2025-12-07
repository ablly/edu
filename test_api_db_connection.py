#!/usr/bin/env python3
"""
测试API和脚本的数据库连接差异
"""

import os
import sqlite3
from datetime import datetime

def test_direct_db_connection():
    """直接连接数据库测试"""
    
    print("=== 直接数据库连接测试 ===")
    
    # 获取数据库路径
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'database', 'scores.db')
    
    print(f"数据库路径: {db_path}")
    print(f"文件存在: {os.path.exists(db_path)}")
    
    if os.path.exists(db_path):
        file_size = os.path.getsize(db_path)
        mod_time = datetime.fromtimestamp(os.path.getmtime(db_path))
        print(f"文件大小: {file_size} bytes")
        print(f"修改时间: {mod_time}")
        
        # 直接SQL查询
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM orders;")
        order_count = cursor.fetchone()[0]
        print(f"📦 直接SQL查询订单数: {order_count}")
        
        if order_count > 0:
            cursor.execute("SELECT id, order_number, status FROM orders LIMIT 3;")
            orders = cursor.fetchall()
            print("前3个订单:")
            for order in orders:
                print(f"  - ID:{order[0]} | {order[1]} | {order[2]}")
        
        conn.close()

def test_flask_app_connection():
    """测试Flask应用连接"""
    
    print(f"\n=== Flask应用连接测试 ===")
    
    try:
        from app import app, db
        from models_order import Order
        
        with app.app_context():
            # 获取配置信息
            db_uri = app.config.get('SQLALCHEMY_DATABASE_URI')
            print(f"Flask数据库URI: {db_uri}")
            
            # 检查数据库引擎
            engine = db.engine
            print(f"数据库引擎: {engine}")
            print(f"数据库URL: {engine.url}")
            
            # 检查连接
            with engine.connect() as conn:
                result = conn.execute(db.text("SELECT COUNT(*) FROM orders"))
                count = result.scalar()
                print(f"📦 Flask引擎查询订单数: {count}")
            
            # 使用ORM查询
            order_count_orm = Order.query.count()
            print(f"📦 Flask ORM查询订单数: {order_count_orm}")
            
            # 检查表是否存在
            inspector = db.inspect(engine)
            tables = inspector.get_table_names()
            print(f"数据库表: {tables}")
            
            if 'orders' in tables:
                columns = inspector.get_columns('orders')
                print(f"orders表列数: {len(columns)}")
            else:
                print("❌ orders表不存在！")
    
    except Exception as e:
        print(f"❌ Flask应用连接失败: {e}")
        import traceback
        traceback.print_exc()

def test_models_import():
    """测试模型导入"""
    
    print(f"\n=== 模型导入测试 ===")
    
    try:
        # 测试导入
        from models_order import Order
        print(f"✅ Order模型导入成功: {Order}")
        print(f"Order表名: {Order.__tablename__}")
        print(f"Order模块: {Order.__module__}")
        
        # 检查模型定义
        columns = [column.name for column in Order.__table__.columns]
        print(f"Order模型列: {columns}")
        
    except Exception as e:
        print(f"❌ 模型导入失败: {e}")
        import traceback
        traceback.print_exc()

def main():
    """主函数"""
    test_direct_db_connection()
    test_flask_app_connection()
    test_models_import()

if __name__ == '__main__':
    main()
