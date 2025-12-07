"""
检查数据库中的订单数据
"""

from app import app, db
from models_order import Order

with app.app_context():
    orders = Order.query.all()
    print(f"\n📊 数据库中共有 {len(orders)} 个订单\n")
    
    if orders:
        print("订单列表:")
        print("-" * 100)
        for order in orders[:10]:  # 只显示前10个
            print(f"ID: {order.id:3d} | 订单号: {order.order_number:20s} | 金额: ¥{float(order.amount):8.2f} | 状态: {order.status:10s} | 创建时间: {order.created_at}")
        
        if len(orders) > 10:
            print(f"... 还有 {len(orders) - 10} 个订单")
        
        print("-" * 100)
        
        # 统计
        from sqlalchemy import func
        stats = db.session.query(
            Order.status,
            func.count(Order.id).label('count'),
            func.sum(Order.amount).label('total')
        ).group_by(Order.status).all()
        
        print("\n状态统计:")
        for stat in stats:
            print(f"  {stat.status:10s}: {stat.count:3d} 个订单, 总金额: ¥{float(stat.total or 0):.2f}")
    else:
        print("❌ 没有订单数据！")
        print("\n建议：")
        print("1. 删除现有的空订单数据")
        print("2. 重新运行 create_test_orders.py")

