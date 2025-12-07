"""
数据库索引优化脚本
为关键表添加索引以提升查询性能
"""

import os
import sys
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text, inspect
from config import Config


def get_database_url():
    """获取数据库URL"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        # 从config.py获取
        db_url = Config.SQLALCHEMY_DATABASE_URI
    return db_url


def check_index_exists(engine, table_name, index_name):
    """检查索引是否存在"""
    inspector = inspect(engine)
    indexes = inspector.get_indexes(table_name)
    return any(idx['name'] == index_name for idx in indexes)


def add_indexes(engine):
    """添加数据库索引"""
    indexes_sql = [
        # ==================== users表索引 ====================
        {
            'name': 'idx_users_username',
            'table': 'users',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
            'description': '用户名索引 - 加速登录查询'
        },
        {
            'name': 'idx_users_email',
            'table': 'users',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'description': '邮箱索引 - 加速邮箱查询'
        },
        {
            'name': 'idx_users_created_at',
            'table': 'users',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
            'description': '创建时间索引 - 加速时间范围查询'
        },
        
        # ==================== students表索引 ====================
        {
            'name': 'idx_students_user_id',
            'table': 'student',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_students_user_id ON student(user_id)',
            'description': '用户ID索引 - 加速学生列表查询'
        },
        {
            'name': 'idx_students_student_name',
            'table': 'student',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_students_student_name ON student(student_name)',
            'description': '学生姓名索引 - 加速名称搜索'
        },
        {
            'name': 'idx_students_grade',
            'table': 'student',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_students_grade ON student(grade)',
            'description': '年级索引 - 加速年级筛选'
        },
        
        # ==================== assignment表索引 ====================
        {
            'name': 'idx_assignment_student_id',
            'table': 'assignment',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_assignment_student_id ON assignment(student_id)',
            'description': '学生ID索引 - 加速作业查询'
        },
        {
            'name': 'idx_assignment_user_id',
            'table': 'assignment',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_assignment_user_id ON assignment(user_id)',
            'description': '用户ID索引 - 加速教师作业查询'
        },
        {
            'name': 'idx_assignment_submitted_at',
            'table': 'assignment',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_assignment_submitted_at ON assignment(submitted_at)',
            'description': '提交时间索引 - 加速时间查询'
        },
        {
            'name': 'idx_assignment_composite',
            'table': 'assignment',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_assignment_composite ON assignment(user_id, student_id, submitted_at)',
            'description': '复合索引 - 优化组合查询'
        },
        
        # ==================== question_bank表索引 ====================
        {
            'name': 'idx_question_question_id',
            'table': 'question_bank',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_question_question_id ON question_bank(question_id)',
            'description': '题目ID索引 - 加速题目查询'
        },
        {
            'name': 'idx_question_set_id',
            'table': 'question_bank',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_question_set_id ON question_bank(question_set_id)',
            'description': '题集ID索引 - 加速题集查询'
        },
        {
            'name': 'idx_question_type',
            'table': 'question_bank',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_question_type ON question_bank(question_type)',
            'description': '题目类型索引 - 加速类型筛选'
        },
        {
            'name': 'idx_question_created_at',
            'table': 'question_bank',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_question_created_at ON question_bank(created_at)',
            'description': '创建时间索引 - 加速时间查询'
        },
        
        # ==================== question_submission表索引 ====================
        {
            'name': 'idx_submission_question_id',
            'table': 'question_submission',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_submission_question_id ON question_submission(question_id)',
            'description': '题目ID索引 - 加速提交查询'
        },
        {
            'name': 'idx_submission_student_id',
            'table': 'question_submission',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_submission_student_id ON question_submission(student_id)',
            'description': '学生ID索引 - 加速学生提交查询'
        },
        {
            'name': 'idx_submission_user_id',
            'table': 'question_submission',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_submission_user_id ON question_submission(user_id)',
            'description': '用户ID索引 - 加速教师查询'
        },
        {
            'name': 'idx_submission_submitted_at',
            'table': 'question_submission',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_submission_submitted_at ON question_submission(submitted_at)',
            'description': '提交时间索引 - 加速时间查询'
        },
        
        # ==================== conversations表索引 ====================
        {
            'name': 'idx_conversations_user_id',
            'table': 'conversations',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)',
            'description': '用户ID索引 - 加速对话查询'
        },
        {
            'name': 'idx_conversations_created_at',
            'table': 'conversations',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at)',
            'description': '创建时间索引 - 加速时间查询'
        },
        
        # ==================== conversation_messages表索引 ====================
        {
            'name': 'idx_messages_conversation_id',
            'table': 'conversation_messages',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON conversation_messages(conversation_id)',
            'description': '对话ID索引 - 加速消息查询'
        },
        {
            'name': 'idx_messages_created_at',
            'table': 'conversation_messages',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON conversation_messages(created_at)',
            'description': '创建时间索引 - 加速时间查询'
        },
        
        # ==================== video_notes表索引 ====================
        {
            'name': 'idx_video_notes_user_id',
            'table': 'video_notes',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_video_notes_user_id ON video_notes(user_id)',
            'description': '用户ID索引 - 加速视频笔记查询'
        },
        {
            'name': 'idx_video_notes_created_at',
            'table': 'video_notes',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_video_notes_created_at ON video_notes(created_at)',
            'description': '创建时间索引 - 加速时间查询'
        },
        
        # ==================== 会员系统索引 ====================
        {
            'name': 'idx_user_memberships_user_id',
            'table': 'user_memberships',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id)',
            'description': '用户ID索引 - 加速会员查询'
        },
        {
            'name': 'idx_user_memberships_tier_id',
            'table': 'user_memberships',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_user_memberships_tier_id ON user_memberships(tier_id)',
            'description': '套餐ID索引 - 加速套餐查询'
        },
        {
            'name': 'idx_user_memberships_expires_at',
            'table': 'user_memberships',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_user_memberships_expires_at ON user_memberships(expires_at)',
            'description': '过期时间索引 - 加速过期检查'
        },
        {
            'name': 'idx_user_memberships_is_active',
            'table': 'user_memberships',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_user_memberships_is_active ON user_memberships(is_active)',
            'description': '激活状态索引 - 加速状态查询'
        },
        {
            'name': 'idx_user_memberships_composite',
            'table': 'user_memberships',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_user_memberships_composite ON user_memberships(user_id, is_active, expires_at)',
            'description': '复合索引 - 优化会员状态查询'
        },
        
        # ==================== 支付交易索引 ====================
        {
            'name': 'idx_payment_user_id',
            'table': 'payment_transactions',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_payment_user_id ON payment_transactions(user_id)',
            'description': '用户ID索引 - 加速订单查询'
        },
        {
            'name': 'idx_payment_order_id',
            'table': 'payment_transactions',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_payment_order_id ON payment_transactions(order_id)',
            'description': '订单ID索引 - 加速订单查询'
        },
        {
            'name': 'idx_payment_status',
            'table': 'payment_transactions',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions(status)',
            'description': '状态索引 - 加速状态筛选'
        },
        {
            'name': 'idx_payment_created_at',
            'table': 'payment_transactions',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment_transactions(created_at)',
            'description': '创建时间索引 - 加速时间查询'
        },
        
        # ==================== 使用日志索引 ====================
        {
            'name': 'idx_usage_logs_user_id',
            'table': 'usage_logs',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id)',
            'description': '用户ID索引 - 加速使用日志查询'
        },
        {
            'name': 'idx_usage_logs_feature_name',
            'table': 'usage_logs',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_usage_logs_feature_name ON usage_logs(feature_name)',
            'description': '功能名索引 - 加速功能统计'
        },
        {
            'name': 'idx_usage_logs_used_at',
            'table': 'usage_logs',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_usage_logs_used_at ON usage_logs(used_at)',
            'description': '使用时间索引 - 加速时间查询'
        },
        {
            'name': 'idx_usage_logs_composite',
            'table': 'usage_logs',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_usage_logs_composite ON usage_logs(user_id, feature_name, used_at)',
            'description': '复合索引 - 优化使用统计查询'
        },
        
        # ==================== 登录尝试索引 ====================
        {
            'name': 'idx_login_attempts_username',
            'table': 'login_attempts',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username)',
            'description': '用户名索引 - 加速登录尝试查询'
        },
        {
            'name': 'idx_login_attempts_attempted_at',
            'table': 'login_attempts',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at)',
            'description': '尝试时间索引 - 加速时间查询'
        },
        {
            'name': 'idx_login_attempts_success',
            'table': 'login_attempts',
            'sql': 'CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success)',
            'description': '成功状态索引 - 加速失败记录查询'
        },
    ]
    
    print("\n" + "="*60)
    print("    数据库索引优化")
    print("="*60 + "\n")
    
    added_count = 0
    skipped_count = 0
    failed_count = 0
    
    with engine.connect() as conn:
        for idx in indexes_sql:
            try:
                print(f"处理索引: {idx['name']}")
                print(f"  表: {idx['table']}")
                print(f"  描述: {idx['description']}")
                
                # 执行SQL
                conn.execute(text(idx['sql']))
                conn.commit()
                
                print(f"  ✅ 成功")
                added_count += 1
                
            except Exception as e:
                error_msg = str(e)
                if 'already exists' in error_msg.lower() or 'duplicate' in error_msg.lower():
                    print(f"  ⏭️  已存在，跳过")
                    skipped_count += 1
                else:
                    print(f"  ❌ 失败: {error_msg}")
                    failed_count += 1
            
            print()
    
    # 输出总结
    print("="*60)
    print("    索引优化完成")
    print("="*60)
    print(f"\n统计：")
    print(f"  ✅ 新增索引: {added_count}")
    print(f"  ⏭️  跳过索引: {skipped_count}")
    print(f"  ❌ 失败索引: {failed_count}")
    print(f"  📊 总计: {len(indexes_sql)}\n")


def analyze_tables(engine):
    """分析表以更新统计信息"""
    print("\n" + "="*60)
    print("    更新表统计信息")
    print("="*60 + "\n")
    
    tables = [
        'users', 'student', 'assignment', 'question_bank', 'question_submission',
        'conversations', 'conversation_messages', 'video_notes',
        'membership_tiers', 'user_memberships', 'payment_transactions', 
        'usage_logs', 'login_attempts'
    ]
    
    with engine.connect() as conn:
        for table in tables:
            try:
                print(f"分析表: {table}")
                conn.execute(text(f"ANALYZE {table}"))
                conn.commit()
                print(f"  ✅ 完成\n")
            except Exception as e:
                print(f"  ⚠️  跳过: {str(e)}\n")


def main():
    """主函数"""
    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║        数据库性能优化 - 索引添加工具                    ║")
    print("╚══════════════════════════════════════════════════════════╝")
    
    # 获取数据库URL
    db_url = get_database_url()
    
    if not db_url:
        print("\n❌ 错误: 未找到数据库配置")
        print("\n请设置环境变量 DATABASE_URL")
        return
    
    print(f"\n📊 数据库: {db_url.split('@')[-1] if '@' in db_url else 'SQLite'}")
    
    # 创建引擎
    try:
        engine = create_engine(db_url)
        print("✅ 数据库连接成功\n")
    except Exception as e:
        print(f"\n❌ 数据库连接失败: {str(e)}")
        return
    
    # 添加索引
    try:
        add_indexes(engine)
    except Exception as e:
        print(f"\n❌ 索引添加过程出错: {str(e)}")
        return
    
    # 分析表（更新统计信息）
    try:
        analyze_tables(engine)
    except Exception as e:
        print(f"\n⚠️  表分析出错: {str(e)}")
    
    print("\n✨ 所有优化完成！")
    print("\n建议：")
    print("  1. 重启应用以使用新索引")
    print("  2. 监控查询性能改善情况")
    print("  3. 定期运行 ANALYZE 更新统计信息\n")


if __name__ == '__main__':
    main()




