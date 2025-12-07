#!/usr/bin/env python3
"""
测试订单API
"""

from app import app, db
from models_order import Order
from models_membership import User, MembershipTier
import json

def test_orders_api():
    with app.app_context():
        # 1. 检查数据库中的订单
        orders = Order.query.all()
        print(f"数据库中共有 {len(orders)} 个订单")
        
        if orders:
            print("\n前5个订单:")
            for order in orders[:5]:
                print(f"  订单ID: {order.id}")
                print(f"  订单号: {order.order_number}")
                print(f"  状态: {order.status}")
                print(f"  用户ID: {order.user_id}")
                print(f"  套餐ID: {order.tier_id}")
                print(f"  金额: {order.amount}")
                print(f"  创建时间: {order.created_at}")
                print("  ---")
        
        # 2. 测试API逻辑
        print("\n测试API逻辑:")
        try:
            # 模拟API查询
            page = 1
            per_page = 20
            query = Order.query
            
            # 排序
            order_by = Order.created_at.desc()
            query = query.order_by(order_by)
            
            # 分页
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            
            print(f"分页结果:")
            print(f"  总数: {pagination.total}")
            print(f"  当前页: {pagination.page}")
            print(f"  每页数量: {pagination.per_page}")
            print(f"  总页数: {pagination.pages}")
            print(f"  当前页项目数: {len(pagination.items)}")
            
            # 构建返回数据
            orders_data = []
            for order in pagination.items:
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
                
                orders_data.append(order_data)
            
            result = {
                'success': True,
                'orders': orders_data,
                'total': pagination.total,
                'page': page,
                'per_page': per_page,
                'pages': pagination.pages
            }
            
            print(f"\nAPI返回数据结构:")
            print(f"  success: {result['success']}")
            print(f"  orders数量: {len(result['orders'])}")
            print(f"  total: {result['total']}")
            
            if result['orders']:
                print(f"\n第一个订单数据:")
                first_order = result['orders'][0]
                print(json.dumps(first_order, indent=2, ensure_ascii=False, default=str))
            
        except Exception as e:
            print(f"API逻辑测试失败: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    test_orders_api()
