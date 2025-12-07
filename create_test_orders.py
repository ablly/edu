"""
创建测试订单数据
由于新的Order模型刚创建，数据库中没有订单数据
这个脚本会创建一些测试订单用于演示
"""

from app import app, db
from models_order import Order
from models_membership import User, MembershipTier, UserMembership
from datetime import datetime, timedelta
import random

def create_test_orders():
    with app.app_context():
        print("开始创建测试订单...")
        
        # 获取所有用户和套餐
        users = User.query.all()
        tiers = MembershipTier.query.all()
        
        if not users:
            print("❌ 错误：数据库中没有用户！请先创建用户。")
            return
        
        if not tiers:
            print("❌ 错误：数据库中没有会员套餐！请先创建套餐。")
            return
        
        print(f"找到 {len(users)} 个用户")
        print(f"找到 {len(tiers)} 个套餐")
        
        # 检查是否已有订单
        existing_orders = Order.query.count()
        if existing_orders > 0:
            print(f"⚠️ 警告：数据库中已有 {existing_orders} 个订单")
            response = input("是否继续添加测试订单？(y/n): ")
            if response.lower() != 'y':
                print("取消操作")
                return
        
        # 订单状态和支付方式
        statuses = ['completed', 'completed', 'completed', 'pending', 'failed']  # 大部分是completed
        payment_methods = ['alipay', 'alipay', 'wechat', 'bank_card']  # 大部分是支付宝
        
        # 创建50个测试订单
        created_count = 0
        for i in range(50):
            try:
                user = random.choice(users)
                tier = random.choice(tiers)
                status = random.choice(statuses)
                payment_method = random.choice(payment_methods)
                
                # 计算金额
                base_price = float(tier.price) if tier.price else 99.00
                original_price = base_price * random.uniform(1.1, 1.3)  # 原价高10-30%
                discount = original_price - base_price
                
                # 创建时间（最近30天内随机）
                days_ago = random.randint(0, 30)
                created_at = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23))
                
                order = Order(
                    order_number=f'ORD{datetime.now().strftime("%Y%m%d")}{i+1:04d}',
                    user_id=user.id,
                    tier_id=tier.id,
                    amount=base_price,
                    original_amount=original_price,
                    discount_amount=discount,
                    payment_method=payment_method,
                    transaction_id=f'{datetime.now().strftime("%Y%m%d")}22001{i+1:06d}',
                    status=status,
                    created_at=created_at,
                    notes=f'测试订单 #{i+1}'
                )
                
                # 如果是completed状态，设置完成时间
                if status == 'completed':
                    order.completed_at = created_at + timedelta(minutes=random.randint(1, 10))
                    
                    # 创建对应的会员记录
                    membership = UserMembership(
                        user_id=user.id,
                        tier_id=tier.id,
                        start_date=order.completed_at,
                        end_date=order.completed_at + timedelta(days=tier.duration_days),
                        is_active=True
                    )
                    db.session.add(membership)
                    db.session.flush()  # 获取membership的ID
                    order.membership_record_id = membership.id
                
                db.session.add(order)
                created_count += 1
                
                if (i + 1) % 10 == 0:
                    print(f"已创建 {i + 1} 个订单...")
                
            except Exception as e:
                print(f"创建订单 #{i+1} 时出错: {str(e)}")
                continue
        
        # 提交到数据库
        try:
            db.session.commit()
            print(f"\n✅ 成功创建 {created_count} 个测试订单！")
            
            # 显示统计
            total_orders = Order.query.count()
            completed_orders = Order.query.filter_by(status='completed').count()
            pending_orders = Order.query.filter_by(status='pending').count()
            failed_orders = Order.query.filter_by(status='failed').count()
            
            total_revenue = db.session.query(db.func.sum(Order.amount)).filter_by(status='completed').scalar() or 0
            
            print(f"\n📊 订单统计:")
            print(f"  总订单数: {total_orders}")
            print(f"  已完成: {completed_orders}")
            print(f"  待支付: {pending_orders}")
            print(f"  已失败: {failed_orders}")
            print(f"  总收入: ¥{float(total_revenue):.2f}")
            
            print(f"\n🎉 现在可以刷新订单管理页面查看数据了！")
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ 提交失败: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    create_test_orders()

