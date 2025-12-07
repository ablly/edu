"""检查数据库表结构"""
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, inspect

db_url = os.getenv('DATABASE_URL', 'postgresql://edupilot_user:050102@localhost:5432/edupilot_db')
engine = create_engine(db_url)
inspector = inspect(engine)

tables = ['student', 'assignment', 'video_notes', 'conversations', 'usage_logs', 'user_memberships', 'payment_transactions']

for table in tables:
    print(f"\n=== {table} ===")
    try:
        cols = inspector.get_columns(table)
        for col in cols:
            print(f"  - {col['name']}")
    except Exception as e:
        print(f"  错误: {e}")



