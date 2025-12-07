#!/usr/bin/env python3
"""
检查订单表的外键关联
"""

from app import app, db
from models_order import Order
from models_membership import User, MembershipTier
import sqlite3

def check_foreign_keys():
    """检查外键关联"""
    
    with app.app_context():
        print("=== 检查订单表外键关联 ===")
        
        # 检查用户表
        user_count = User.query.count()
        print(f"👤 users表记录数: {user_count}")
        
        if user_count > 0:
            users = User.query.limit(3).all()
            print("前3个用户:")
            for user in users:
                print(f"  - ID:{user.id} | {user.username} | {user.email}")
        
        # 检查套餐表
        tier_count = MembershipTier.query.count()
        print(f"🎫 membership_tiers表记录数: {tier_count}")
        
        if tier_count > 0:
            tiers = MembershipTier.query.limit(3).all()
            print("前3个套餐:")
            for tier in tiers:
                print(f"  - ID:{tier.id} | {tier.name} | ¥{tier.price}")
        
        # 检查订单的外键完整性
        print(f"\n=== 检查订单外键完整性 ===")
        
        orders = Order.query.all()
        print(f"📦 总订单数: {len(orders)}")
        
        valid_orders = 0
        invalid_user_orders = 0
        invalid_tier_orders = 0
        
        for order in orders:
            is_valid = True
            
            # 检查用户是否存在
            if order.user_id:
                user = User.query.get(order.user_id)
                if not user:
                    print(f"❌ 订单 {order.id} 的用户 {order.user_id} 不存在")
                    invalid_user_orders += 1
                    is_valid = False
            
            # 检查套餐是否存在
            if order.tier_id:
                tier = MembershipTier.query.get(order.tier_id)
                if not tier:
                    print(f"❌ 订单 {order.id} 的套餐 {order.tier_id} 不存在")
                    invalid_tier_orders += 1
                    is_valid = False
            
            if is_valid:
                valid_orders += 1
        
        print(f"✅ 有效订单: {valid_orders}")
        print(f"❌ 用户不存在的订单: {invalid_user_orders}")
        print(f"❌ 套餐不存在的订单: {invalid_tier_orders}")
        
        # 直接查询数据库检查
        print(f"\n=== 直接SQL查询检查 ===")
        
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        if db_uri.startswith('sqlite:///'):
            db_path = db_uri.replace('sqlite:///', '')
            
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # 检查订单表
            cursor.execute("SELECT COUNT(*) FROM orders;")
            order_count_sql = cursor.fetchone()[0]
            print(f"📦 SQL查询订单数: {order_count_sql}")
            
            # 检查有用户关联的订单
            cursor.execute("""
                SELECT COUNT(*) FROM orders o 
                LEFT JOIN users u ON o.user_id = u.id 
                WHERE u.id IS NOT NULL;
            """)
            orders_with_users = cursor.fetchone()[0]
            print(f"👤 有用户关联的订单: {orders_with_users}")
            
            # 检查有套餐关联的订单
            cursor.execute("""
                SELECT COUNT(*) FROM orders o 
                LEFT JOIN membership_tiers t ON o.tier_id = t.id 
                WHERE t.id IS NOT NULL;
            """)
            orders_with_tiers = cursor.fetchone()[0]
            print(f"🎫 有套餐关联的订单: {orders_with_tiers}")
            
            # 检查完全有效的订单（用户和套餐都存在）
            cursor.execute("""
                SELECT COUNT(*) FROM orders o 
                LEFT JOIN users u ON o.user_id = u.id 
                LEFT JOIN membership_tiers t ON o.tier_id = t.id 
                WHERE u.id IS NOT NULL AND (o.tier_id IS NULL OR t.id IS NOT NULL);
            """)
            fully_valid_orders = cursor.fetchone()[0]
            print(f"✅ 完全有效的订单: {fully_valid_orders}")
            
            conn.close()

if __name__ == '__main__':
    check_foreign_keys()
