#!/usr/bin/env python3
"""
调试Flask应用的数据库连接
"""

from app import app, db
from models_order import Order
from models_admin import Admin
import os

def debug_flask_db():
    """调试Flask数据库连接"""
    
    with app.app_context():
        print("=== Flask应用数据库调试 ===")
        
        # 获取数据库URI
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        print(f"数据库URI: {db_uri}")
        
        # 如果是SQLite，获取实际文件路径
        if db_uri.startswith('sqlite:///'):
            db_path = db_uri.replace('sqlite:///', '')
            print(f"数据库文件路径: {db_path}")
            print(f"文件是否存在: {os.path.exists(db_path)}")
            
            if os.path.exists(db_path):
                file_size = os.path.getsize(db_path)
                print(f"文件大小: {file_size} bytes")
        
        # 检查数据库连接
        try:
            # 检查订单表
            order_count = Order.query.count()
            print(f"📦 Order表记录数: {order_count}")
            
            if order_count > 0:
                orders = Order.query.limit(3).all()
                print("前3个订单:")
                for order in orders:
                    print(f"  - ID:{order.id} | {order.order_number} | {order.status} | ¥{order.amount}")
            
            # 检查管理员表
            admin_count = Admin.query.count()
            print(f"👤 Admin表记录数: {admin_count}")
            
            if admin_count > 0:
                admins = Admin.query.all()
                print("管理员:")
                for admin in admins:
                    print(f"  - ID:{admin.id} | {admin.username} | {admin.email}")
            
        except Exception as e:
            print(f"❌ 数据库查询失败: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    debug_flask_db()
