"""
更新membership_tiers和payment_transactions表结构
添加限量和早鸟优惠相关字段
"""
from app import app, db
import sqlite3

def update_schema():
    """更新数据库表结构"""
    
    with app.app_context():
        print("\n=== 更新数据库表结构 ===\n")
        
        # 获取数据库连接
        database_uri = app.config['SQLALCHEMY_DATABASE_URI']
        if database_uri.startswith('sqlite:///'):
            db_path = database_uri.replace('sqlite:///', '')
        else:
            print("❌ 仅支持SQLite数据库")
            return
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # 1. 更新 membership_tiers 表
            print("📋 更新 membership_tiers 表...")
            
            # 检查字段是否已存在
            cursor.execute("PRAGMA table_info(membership_tiers)")
            columns = [row[1] for row in cursor.fetchall()]
            
            new_fields = {
                'is_limited': 'ALTER TABLE membership_tiers ADD COLUMN is_limited BOOLEAN DEFAULT 0',
                'total_quota': 'ALTER TABLE membership_tiers ADD COLUMN total_quota INTEGER DEFAULT 0',
                'sold_count': 'ALTER TABLE membership_tiers ADD COLUMN sold_count INTEGER DEFAULT 0',
                'min_order': 'ALTER TABLE membership_tiers ADD COLUMN min_order INTEGER DEFAULT 0',
                'max_order': 'ALTER TABLE membership_tiers ADD COLUMN max_order INTEGER DEFAULT 0',
                'is_early_bird': 'ALTER TABLE membership_tiers ADD COLUMN is_early_bird BOOLEAN DEFAULT 0',
                'early_bird_tier': 'ALTER TABLE membership_tiers ADD COLUMN early_bird_tier INTEGER DEFAULT 0',
                'original_price': 'ALTER TABLE membership_tiers ADD COLUMN original_price FLOAT DEFAULT 0.0'
            }
            
            added_count = 0
            for field, sql in new_fields.items():
                if field not in columns:
                    cursor.execute(sql)
                    print(f"  ✅ 添加字段: {field}")
                    added_count += 1
                else:
                    print(f"  ⏭️  字段已存在: {field}")
            
            if added_count > 0:
                print(f"  → 成功添加 {added_count} 个新字段\n")
            
            # 2. 更新 payment_transactions 表
            print("📋 更新 payment_transactions 表...")
            
            cursor.execute("PRAGMA table_info(payment_transactions)")
            columns = [row[1] for row in cursor.fetchall()]
            
            payment_fields = {
                'alipay_trade_no': 'ALTER TABLE payment_transactions ADD COLUMN alipay_trade_no VARCHAR(100)',
                'payment_url': 'ALTER TABLE payment_transactions ADD COLUMN payment_url TEXT',
                'return_url': 'ALTER TABLE payment_transactions ADD COLUMN return_url TEXT',
                'notify_url': 'ALTER TABLE payment_transactions ADD COLUMN notify_url TEXT',
                'callback_data': 'ALTER TABLE payment_transactions ADD COLUMN callback_data TEXT',
                'expires_at': 'ALTER TABLE payment_transactions ADD COLUMN expires_at DATETIME'
            }
            
            added_count = 0
            for field, sql in payment_fields.items():
                if field not in columns:
                    cursor.execute(sql)
                    print(f"  ✅ 添加字段: {field}")
                    added_count += 1
                else:
                    print(f"  ⏭️  字段已存在: {field}")
            
            if added_count > 0:
                print(f"  → 成功添加 {added_count} 个新字段\n")
            
            # 提交更改
            conn.commit()
            print("✅ 数据库表结构更新完成！\n")
            
            # 显示表结构
            print("=== membership_tiers 表结构 ===")
            cursor.execute("PRAGMA table_info(membership_tiers)")
            for row in cursor.fetchall():
                print(f"  {row[1]}: {row[2]}")
            
            print("\n=== payment_transactions 表结构 ===")
            cursor.execute("PRAGMA table_info(payment_transactions)")
            for row in cursor.fetchall():
                print(f"  {row[1]}: {row[2]}")
            
            print("\n=== 更新完成！ ===")
            print("现在可以运行: python init_pricing.py")
            
        except Exception as e:
            conn.rollback()
            print(f"❌ 更新失败: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
            conn.close()


if __name__ == '__main__':
    update_schema()


