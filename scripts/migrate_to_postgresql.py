#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SQLite 到 PostgreSQL 数据迁移脚本

功能：
1. 自动创建PostgreSQL表结构
2. 从SQLite导出所有数据
3. 导入数据到PostgreSQL
4. 验证数据完整性
5. 生成迁移报告

使用方法：
    python scripts/migrate_to_postgresql.py
"""

import os
import sys
from datetime import datetime
from pathlib import Path

# 添加项目根目录到路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine, inspect, MetaData, Table
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import traceback


class DatabaseMigrator:
    """数据库迁移器"""
    
    def __init__(self, sqlite_uri, postgresql_uri):
        self.sqlite_uri = sqlite_uri
        self.postgresql_uri = postgresql_uri
        self.migration_log = []
        self.errors = []
        
        # 统计信息
        self.stats = {
            'tables_migrated': 0,
            'total_records': 0,
            'failed_records': 0,
            'start_time': None,
            'end_time': None
        }
    
    def log(self, message, level='INFO'):
        """记录日志"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] [{level}] {message}"
        self.migration_log.append(log_entry)
        print(log_entry)
        
        if level == 'ERROR':
            self.errors.append(message)
    
    def connect_databases(self):
        """连接到两个数据库"""
        try:
            self.log("正在连接到SQLite数据库...")
            self.sqlite_engine = create_engine(self.sqlite_uri)
            self.sqlite_conn = self.sqlite_engine.connect()
            
            self.log("正在连接到PostgreSQL数据库...")
            self.postgresql_engine = create_engine(self.postgresql_uri)
            self.postgresql_conn = self.postgresql_engine.connect()
            
            self.log("✅ 数据库连接成功！")
            return True
        except Exception as e:
            self.log(f"❌ 数据库连接失败: {str(e)}", 'ERROR')
            self.log(f"详细错误: {traceback.format_exc()}", 'ERROR')
            return False
    
    def get_table_names(self):
        """获取SQLite中的所有表名"""
        try:
            inspector = inspect(self.sqlite_engine)
            tables = inspector.get_table_names()
            
            # 过滤掉系统表
            exclude_tables = ['sqlite_sequence']
            tables = [t for t in tables if t not in exclude_tables]
            
            self.log(f"📋 发现 {len(tables)} 个表需要迁移")
            for table in tables:
                self.log(f"   - {table}")
            
            return tables
        except Exception as e:
            self.log(f"❌ 获取表名失败: {str(e)}", 'ERROR')
            return []
    
    def create_postgresql_schema(self):
        """在PostgreSQL中创建表结构"""
        try:
            self.log("\n🔨 正在创建PostgreSQL表结构...")
            
            # 导入模型以创建表结构
            from models import db, Student, Assignment, QuestionBank, QuestionSubmission
            from models import Conversation, ConversationMessage, VideoNote, LoginAttempt
            from models_membership import User, MembershipTier, UserMembership, PaymentTransaction, UsageLog
            
            # 直接使用 PostgreSQL 引擎创建表
            db.metadata.create_all(bind=self.postgresql_engine)
            
            self.log("✅ PostgreSQL表结构创建成功！")
            return True
        except Exception as e:
            self.log(f"❌ 创建表结构失败: {str(e)}", 'ERROR')
            self.log(f"详细错误: {traceback.format_exc()}", 'ERROR')
            return False
    
    def migrate_table(self, table_name):
        """迁移单个表的数据"""
        try:
            self.log(f"\n📦 正在迁移表: {table_name}")
            
            # 从SQLite读取数据
            metadata = MetaData()
            metadata.reflect(bind=self.sqlite_engine)
            table = Table(table_name, metadata, autoload_with=self.sqlite_engine)
            
            # 读取所有数据
            sqlite_session = sessionmaker(bind=self.sqlite_engine)()
            rows = sqlite_session.execute(table.select()).fetchall()
            row_count = len(rows)
            
            if row_count == 0:
                self.log(f"   ⚠️ 表 {table_name} 没有数据")
                sqlite_session.close()
                return True
            
            self.log(f"   📊 找到 {row_count} 条记录")
            
            # 写入PostgreSQL
            postgresql_session = sessionmaker(bind=self.postgresql_engine)()
            
            # 准备插入数据
            success_count = 0
            failed_count = 0
            
            for i, row in enumerate(rows, 1):
                try:
                    # 转换为字典
                    row_dict = dict(row._mapping)
                    
                    # 插入数据
                    insert_stmt = table.insert().values(**row_dict)
                    postgresql_session.execute(insert_stmt)
                    success_count += 1
                    
                    # 每100条提交一次
                    if i % 100 == 0:
                        postgresql_session.commit()
                        self.log(f"   ⏳ 已迁移 {i}/{row_count} 条记录...")
                
                except Exception as e:
                    failed_count += 1
                    self.log(f"   ⚠️ 记录 {i} 迁移失败: {str(e)}", 'WARNING')
                    postgresql_session.rollback()
            
            # 最终提交
            postgresql_session.commit()
            postgresql_session.close()
            sqlite_session.close()
            
            self.log(f"   ✅ 表 {table_name} 迁移完成: {success_count} 成功, {failed_count} 失败")
            
            # 更新统计
            self.stats['tables_migrated'] += 1
            self.stats['total_records'] += success_count
            self.stats['failed_records'] += failed_count
            
            return True
            
        except Exception as e:
            self.log(f"   ❌ 表 {table_name} 迁移失败: {str(e)}", 'ERROR')
            self.log(f"   详细错误: {traceback.format_exc()}", 'ERROR')
            return False
    
    def reset_sequences(self):
        """重置PostgreSQL的序列"""
        try:
            self.log("\n🔄 正在重置PostgreSQL序列...")
            
            # 获取所有表
            inspector = inspect(self.postgresql_engine)
            tables = inspector.get_table_names()
            
            reset_count = 0
            for table in tables:
                try:
                    # 为每个表重置序列
                    sql = f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(MAX(id), 1)) FROM \"{table}\";"
                    self.postgresql_conn.execute(sql)
                    reset_count += 1
                except Exception as e:
                    # 有些表可能没有id字段或序列，忽略错误
                    pass
            
            self.log(f"✅ 重置了 {reset_count} 个序列")
            return True
        except Exception as e:
            self.log(f"⚠️ 重置序列时出现问题: {str(e)}", 'WARNING')
            return True  # 非关键错误，继续
    
    def verify_migration(self):
        """验证迁移结果"""
        try:
            self.log("\n🔍 正在验证迁移结果...")
            
            # 获取两个数据库的表列表
            sqlite_inspector = inspect(self.sqlite_engine)
            postgresql_inspector = inspect(self.postgresql_engine)
            
            sqlite_tables = set(sqlite_inspector.get_table_names())
            postgresql_tables = set(postgresql_inspector.get_table_names())
            
            # 过滤系统表
            sqlite_tables = {t for t in sqlite_tables if t != 'sqlite_sequence'}
            postgresql_tables = {t for t in postgresql_tables if t not in ['alembic_version']}
            
            # 检查表是否都迁移了
            missing_tables = sqlite_tables - postgresql_tables
            if missing_tables:
                self.log(f"⚠️ 以下表未迁移: {missing_tables}", 'WARNING')
            
            # 比较记录数
            self.log("\n📊 记录数对比:")
            all_match = True
            
            for table in sorted(sqlite_tables & postgresql_tables):
                try:
                    # SQLite记录数
                    sqlite_count = self.sqlite_conn.execute(f'SELECT COUNT(*) FROM "{table}"').scalar()
                    
                    # PostgreSQL记录数
                    postgresql_count = self.postgresql_conn.execute(f'SELECT COUNT(*) FROM "{table}"').scalar()
                    
                    match = "✅" if sqlite_count == postgresql_count else "❌"
                    self.log(f"   {match} {table}: SQLite={sqlite_count}, PostgreSQL={postgresql_count}")
                    
                    if sqlite_count != postgresql_count:
                        all_match = False
                
                except Exception as e:
                    self.log(f"   ⚠️ {table}: 无法比较 - {str(e)}", 'WARNING')
            
            if all_match:
                self.log("\n✅ 所有表的记录数匹配！")
            else:
                self.log("\n⚠️ 部分表的记录数不匹配，请检查！", 'WARNING')
            
            return all_match
            
        except Exception as e:
            self.log(f"❌ 验证失败: {str(e)}", 'ERROR')
            return False
    
    def generate_report(self):
        """生成迁移报告"""
        duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
        
        report = f"""
╔══════════════════════════════════════════════════════════╗
║              PostgreSQL 数据迁移报告                     ║
╚══════════════════════════════════════════════════════════╝

📅 迁移时间: {self.stats['start_time'].strftime('%Y-%m-%d %H:%M:%S')} - {self.stats['end_time'].strftime('%H:%M:%S')}
⏱️  总耗时: {duration:.2f} 秒

📊 迁移统计:
   - 迁移表数量: {self.stats['tables_migrated']}
   - 成功记录: {self.stats['total_records']}
   - 失败记录: {self.stats['failed_records']}
   - 成功率: {(self.stats['total_records'] / (self.stats['total_records'] + self.stats['failed_records']) * 100) if (self.stats['total_records'] + self.stats['failed_records']) > 0 else 100:.2f}%

🔧 数据库信息:
   - 源数据库: SQLite ({self.sqlite_uri})
   - 目标数据库: PostgreSQL

{'✅ 迁移成功完成！' if len(self.errors) == 0 else '⚠️ 迁移完成但存在错误！'}

"""
        
        if self.errors:
            report += "\n❌ 错误列表:\n"
            for i, error in enumerate(self.errors, 1):
                report += f"   {i}. {error}\n"
        
        report += """
╔══════════════════════════════════════════════════════════╗
║                    下一步操作                             ║
╚══════════════════════════════════════════════════════════╝

1. 验证数据迁移结果:
   python scripts/verify_postgresql_migration.py

2. 更新 .env 文件:
   DATABASE_URL=postgresql://edupilot_user:password@localhost:5432/edupilot_db

3. 重启应用:
   python app.py

4. 测试所有功能

5. 如果一切正常，可以备份并删除SQLite数据库

╔══════════════════════════════════════════════════════════╗
║                    回滚方案                               ║
╚══════════════════════════════════════════════════════════╝

如果需要回滚到SQLite:
1. 停止服务器
2. 从 .env 中删除或注释 DATABASE_URL
3. 恢复SQLite备份（如果有）
4. 重启服务器

"""
        
        return report
    
    def run(self):
        """执行完整迁移流程"""
        print("\n" + "="*60)
        print("    PostgreSQL 数据迁移工具")
        print("="*60)
        
        self.stats['start_time'] = datetime.now()
        
        # 步骤1: 连接数据库
        if not self.connect_databases():
            return False
        
        # 步骤2: 创建PostgreSQL表结构
        if not self.create_postgresql_schema():
            self.log("❌ 无法创建表结构，迁移终止", 'ERROR')
            return False
        
        # 步骤3: 获取要迁移的表
        tables = self.get_table_names()
        if not tables:
            self.log("❌ 没有找到要迁移的表", 'ERROR')
            return False
        
        # 步骤4: 迁移每个表
        for table in tables:
            self.migrate_table(table)
        
        # 步骤5: 重置序列
        self.reset_sequences()
        
        # 步骤6: 验证迁移
        self.verify_migration()
        
        self.stats['end_time'] = datetime.now()
        
        # 步骤7: 生成报告
        report = self.generate_report()
        print(report)
        
        # 保存报告到文件
        report_file = f"migration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
            f.write("\n\n详细日志:\n")
            f.write("\n".join(self.migration_log))
        
        self.log(f"\n📄 详细报告已保存到: {report_file}")
        
        # 关闭连接
        self.sqlite_conn.close()
        self.postgresql_conn.close()
        
        return len(self.errors) == 0


def main():
    """主函数"""
    # 获取数据库URI
    sqlite_uri = 'sqlite:///data/edupilot.db'
    
    # 从环境变量获取PostgreSQL URI
    postgresql_uri = os.environ.get('DATABASE_URL')
    
    if not postgresql_uri or 'postgresql' not in postgresql_uri:
        print("\n❌ 错误: 未找到PostgreSQL数据库配置")
        print("\n请设置环境变量 DATABASE_URL:")
        print("例如: export DATABASE_URL='postgresql://edupilot_user:password@localhost:5432/edupilot_db'")
        print("\n或在 .env 文件中添加:")
        print("DATABASE_URL=postgresql://edupilot_user:password@localhost:5432/edupilot_db")
        return False
    
    print(f"\n🗄️  源数据库: {sqlite_uri}")
    print(f"🗄️  目标数据库: {postgresql_uri.split('@')[1] if '@' in postgresql_uri else postgresql_uri}")
    
    # 确认迁移
    print("\n⚠️  警告: 此操作将覆盖PostgreSQL数据库中的所有数据！")
    response = input("\n是否继续迁移？(yes/no): ").strip().lower()
    
    if response != 'yes':
        print("❌ 迁移已取消")
        return False
    
    # 执行迁移
    migrator = DatabaseMigrator(sqlite_uri, postgresql_uri)
    success = migrator.run()
    
    return success


if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ 迁移被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 迁移过程中发生未预期的错误: {str(e)}")
        print(f"详细错误: {traceback.format_exc()}")
        sys.exit(1)

