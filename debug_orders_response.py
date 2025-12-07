#!/usr/bin/env python3
"""
调试订单API响应
"""

from app import app, db
from models_order import Order
from models_membership import User, MembershipTier
import json
from datetime import datetime

def debug_orders_response():
    """调试订单API响应"""
    
    with app.app_context():
        print("=== 调试订单API响应 ===")
        
        # 1. 检查原始数据
        orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()
        print(f"\n数据库中前5个订单:")
        for order in orders:
            print(f"  ID: {order.id}, 订单号: {order.order_number}")
            print(f"  用户ID: {order.user_id}, 套餐ID: {order.tier_id}")
            print(f"  状态: {order.status}, 金额: {order.amount}")
            print(f"  创建时间: {order.created_at}")
            
            # 检查关联数据
            if order.user:
                print(f"  用户: {order.user.username} ({order.user.email})")
            else:
                print(f"  警告: 订单 {order.id} 没有关联用户")
            
            if order.tier:
                print(f"  套餐: {order.tier.name} (¥{order.tier.price})")
            else:
                print(f"  警告: 订单 {order.id} 没有关联套餐")
            print("  ---")
        
        # 2. 模拟API处理逻辑
        print(f"\n=== 模拟API处理 ===")
        page = 1
        per_page = 20
        
        # 构建查询
        query = Order.query
        order_by = Order.created_at.desc()
        query = query.order_by(order_by)
        
        # 分页
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        print(f"分页信息:")
        print(f"  总数: {pagination.total}")
        print(f"  当前页: {pagination.page}")
        print(f"  每页数量: {pagination.per_page}")
        print(f"  总页数: {pagination.pages}")
        print(f"  当前页项目数: {len(pagination.items)}")
        
        # 构建返回数据
        orders_data = []
        for order in pagination.items:
            try:
                order_data = order.to_dict()
                
                # 添加用户信息
                if order.user:
                    order_data['user'] = {
                        'id': order.user.id,
                        'username': order.user.username,
                        'email': order.user.email,
                        'phone': getattr(order.user, 'phone', None),
                    }
                else:
                    print(f"  警告: 订单 {order.id} 没有关联用户")
                    order_data['user'] = None
                
                # 添加套餐信息
                if order.tier:
                    order_data['tier'] = {
                        'id': order.tier.id,
                        'name': order.tier.name,
                        'price': float(order.tier.price) if order.tier.price else 0,
                        'duration_days': order.tier.duration_days,
                    }
                else:
                    print(f"  警告: 订单 {order.id} 没有关联套餐")
                    order_data['tier'] = None
                
                orders_data.append(order_data)
                
            except Exception as e:
                print(f"  错误: 处理订单 {order.id} 时出错: {e}")
                import traceback
                traceback.print_exc()
        
        # 3. 构建最终响应
        response_data = {
            'success': True,
            'orders': orders_data,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }
        
        print(f"\n=== 最终API响应 ===")
        print(f"success: {response_data['success']}")
        print(f"orders数量: {len(response_data['orders'])}")
        print(f"total: {response_data['total']}")
        print(f"page: {response_data['page']}")
        print(f"per_page: {response_data['per_page']}")
        
        if response_data['orders']:
            print(f"\n第一个订单完整数据:")
            first_order = response_data['orders'][0]
            print(json.dumps(first_order, indent=2, ensure_ascii=False, default=str))
        else:
            print("警告: orders数组为空!")
        
        # 4. 检查可能的问题
        print(f"\n=== 问题检查 ===")
        
        # 检查是否有数据但处理失败
        if pagination.total > 0 and len(orders_data) == 0:
            print("问题: 数据库有数据但处理后为空，可能是数据处理逻辑有问题")
        
        # 检查关联数据
        orders_without_user = Order.query.filter(Order.user_id.isnot(None)).outerjoin(User).filter(User.id.is_(None)).count()
        orders_without_tier = Order.query.filter(Order.tier_id.isnot(None)).outerjoin(MembershipTier).filter(MembershipTier.id.is_(None)).count()
        
        print(f"没有关联用户的订单数: {orders_without_user}")
        print(f"没有关联套餐的订单数: {orders_without_tier}")
        
        # 检查数据类型
        if response_data['orders']:
            first_order = response_data['orders'][0]
            print(f"\n第一个订单的字段类型:")
            for key, value in first_order.items():
                print(f"  {key}: {type(value)} = {value}")

if __name__ == '__main__':
    debug_orders_response()
