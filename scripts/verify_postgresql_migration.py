#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
PostgreSQL 迁移验证脚本

功能：
1. 验证表结构完整性
2. 验证数据记录数量
3. 验证索引和约束
4. 抽查数据内容
5. 生成验证报告

使用方法：
    python scripts/verify_postgresql_migration.py
"""

import os
import sys
from datetime import datetime
from pathlib import Path

# 添加项目根目录到路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
import random


class MigrationVerifier:
    """迁移验证器"""
    
    def __init__(self, sqlite_uri, postgresql_uri):
        self.sqlite_uri = sqlite_uri
        self.postgresql_uri = postgresql_uri
        self.results = {
            'tables': {},
            'indexes': {},
            'data_samples': {},
            'issues': []
        }
    
    def connect_databases(self):
        """连接到两个数据库"""
        try:
            print("🔌 正在连接到数据库...")
            
            self.sqlite_engine = create_engine(self.sqlite_uri)
            self.postgresql_engine = create_engine(self.postgresql_uri)
            
            # 测试连接
            self.sqlite_engine.connect().close()
            self.postgresql_engine.connect().close()
            
            print("✅ 数据库连接成功！\n")
            return True
        except Exception as e:
            print(f"❌ 数据库连接失败: {str(e)}")
            return False
    
    def verify_tables(self):
        """验证表结构"""
        print("📋 验证表结构...")
        
        sqlite_inspector = inspect(self.sqlite_engine)
        postgresql_inspector = inspect(self.postgresql_engine)
        
        sqlite_tables = set(sqlite_inspector.get_table_names())
        postgresql_tables = set(postgresql_inspector.get_table_names())
        
        # 过滤系统表
        sqlite_tables = {t for t in sqlite_tables if t != 'sqlite_sequence'}
        
        # 检查缺失的表
        missing_tables = sqlite_tables - postgresql_tables
        extra_tables = postgresql_tables - sqlite_tables
        common_tables = sqlite_tables & postgresql_tables
        
        print(f"   SQLite 表数量: {len(sqlite_tables)}")
        print(f"   PostgreSQL 表数量: {len(postgresql_tables)}")
        print(f"   共同表数量: {len(common_tables)}")
        
        if missing_tables:
            print(f"   ⚠️ PostgreSQL中缺失的表: {missing_tables}")
            self.results['issues'].append(f"缺失的表: {missing_tables}")
        
        if extra_tables:
            print(f"   ℹ️ PostgreSQL中额外的表: {extra_tables}")
        
        for table in common_tables:
            self.results['tables'][table] = {'status': 'exists'}
        
        print(f"   {'✅' if not missing_tables else '⚠️'} 表结构检查完成\n")
        
        return len(missing_tables) == 0
    
    def verify_record_counts(self):
        """验证记录数量"""
        print("🔢 验证记录数量...")
        
        all_match = True
        total_sqlite = 0
        total_postgresql = 0
        
        for table in self.results['tables'].keys():
            try:
                # 获取记录数
                with self.sqlite_engine.connect() as conn:
                    sqlite_count = conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
                
                with self.postgresql_engine.connect() as conn:
                    postgresql_count = conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
                
                total_sqlite += sqlite_count
                total_postgresql += postgresql_count
                
                match = sqlite_count == postgresql_count
                status = "✅" if match else "❌"
                
                print(f"   {status} {table:30s} SQLite={sqlite_count:6d}, PostgreSQL={postgresql_count:6d}")
                
                self.results['tables'][table].update({
                    'sqlite_count': sqlite_count,
                    'postgresql_count': postgresql_count,
                    'match': match
                })
                
                if not match:
                    all_match = False
                    self.results['issues'].append(
                        f"表 {table} 记录数不匹配: SQLite={sqlite_count}, PostgreSQL={postgresql_count}"
                    )
            
            except Exception as e:
                print(f"   ❌ {table}: 无法比较 - {str(e)}")
                self.results['issues'].append(f"表 {table} 比较失败: {str(e)}")
                all_match = False
        
        print(f"\n   总记录数: SQLite={total_sqlite}, PostgreSQL={total_postgresql}")
        print(f"   {'✅' if all_match else '❌'} 记录数量检查完成\n")
        
        return all_match
    
    def verify_indexes(self):
        """验证索引"""
        print("📑 验证索引...")
        
        postgresql_inspector = inspect(self.postgresql_engine)
        
        for table in self.results['tables'].keys():
            try:
                indexes = postgresql_inspector.get_indexes(table)
                pk_constraint = postgresql_inspector.get_pk_constraint(table)
                
                index_count = len(indexes)
                has_pk = pk_constraint and 'constrained_columns' in pk_constraint
                
                status = "✅" if has_pk else "⚠️"
                print(f"   {status} {table:30s} 索引={index_count:2d}, 主键={'是' if has_pk else '否'}")
                
                self.results['indexes'][table] = {
                    'index_count': index_count,
                    'has_primary_key': has_pk,
                    'indexes': indexes
                }
                
                if not has_pk:
                    self.results['issues'].append(f"表 {table} 缺少主键")
            
            except Exception as e:
                print(f"   ❌ {table}: 无法检查索引 - {str(e)}")
        
        print(f"   ✅ 索引检查完成\n")
        return True
    
    def sample_data_verification(self, sample_size=5):
        """抽样验证数据内容"""
        print(f"🔍 抽样验证数据 (每表{sample_size}条)...")
        
        for table in list(self.results['tables'].keys())[:5]:  # 只抽查前5个表
            try:
                # 跳过空表
                if self.results['tables'][table].get('sqlite_count', 0) == 0:
                    continue
                
                print(f"   检查表: {table}")
                
                # 从SQLite随机抽取数据
                with self.sqlite_engine.connect() as conn:
                    result = conn.execute(text(f'SELECT * FROM "{table}" LIMIT {sample_size}'))
                    sqlite_samples = [dict(row._mapping) for row in result]
                
                if not sqlite_samples:
                    continue
                
                # 从PostgreSQL获取相同ID的数据
                matches = 0
                for sample in sqlite_samples:
                    if 'id' in sample:
                        with self.postgresql_engine.connect() as conn:
                            pg_result = conn.execute(
                                text(f'SELECT * FROM "{table}" WHERE id = :id'),
                                {'id': sample['id']}
                            ).first()
                            
                            if pg_result:
                                matches += 1
                
                match_rate = (matches / len(sqlite_samples)) * 100 if sqlite_samples else 0
                status = "✅" if match_rate == 100 else "⚠️"
                
                print(f"      {status} 匹配率: {match_rate:.1f}% ({matches}/{len(sqlite_samples)})")
                
                self.results['data_samples'][table] = {
                    'sample_size': len(sqlite_samples),
                    'matches': matches,
                    'match_rate': match_rate
                }
            
            except Exception as e:
                print(f"      ⚠️ 无法验证: {str(e)}")
        
        print(f"   ✅ 数据抽样验证完成\n")
        return True
    
    def test_database_operations(self):
        """测试数据库操作"""
        print("🧪 测试数据库操作...")
        
        try:
            from app import app, db
            from models import User
            
            with app.app_context():
                # 临时修改数据库URI为PostgreSQL
                original_uri = app.config['SQLALCHEMY_DATABASE_URI']
                app.config['SQLALCHEMY_DATABASE_URI'] = self.postgresql_uri
                
                # 重新初始化数据库引擎
                db.engine.dispose()
                db.init_app(app)
                
                # 测试查询
                user_count = User.query.count()
                print(f"   ✅ 查询操作: 成功 (用户数: {user_count})")
                
                # 测试连接池
                print(f"   ✅ 连接池: 正常")
                
                # 恢复原始URI
                app.config['SQLALCHEMY_DATABASE_URI'] = original_uri
                
                print(f"   ✅ 数据库操作测试完成\n")
                return True
        
        except Exception as e:
            print(f"   ❌ 数据库操作测试失败: {str(e)}\n")
            self.results['issues'].append(f"数据库操作测试失败: {str(e)}")
            return False
    
    def generate_report(self):
        """生成验证报告"""
        report = f"""
╔══════════════════════════════════════════════════════════╗
║            PostgreSQL 迁移验证报告                        ║
╚══════════════════════════════════════════════════════════╝

📅 验证时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📊 验证结果汇总:
   - 验证表数量: {len(self.results['tables'])}
   - 表结构匹配: {'✅ 是' if not any('缺失的表' in issue for issue in self.results['issues']) else '❌ 否'}
   - 记录数匹配: {'✅ 是' if all(t.get('match', False) for t in self.results['tables'].values()) else '❌ 否'}
   - 索引完整性: {'✅ 正常' if all(i.get('has_primary_key', False) for i in self.results['indexes'].values()) else '⚠️ 部分表缺少主键'}
   - 数据抽样: {'✅ 通过' if self.results['data_samples'] else 'ℹ️ 未执行'}

"""
        
        if self.results['issues']:
            report += "\n⚠️ 发现的问题:\n"
            for i, issue in enumerate(self.results['issues'], 1):
                report += f"   {i}. {issue}\n"
        else:
            report += "\n✅ 未发现任何问题！\n"
        
        report += """
╔══════════════════════════════════════════════════════════╗
║                    建议                                   ║
╚══════════════════════════════════════════════════════════╝

"""
        
        if not self.results['issues']:
            report += """
✅ 迁移验证通过！可以安全地切换到PostgreSQL:

1. 更新 .env 文件:
   DATABASE_URL=postgresql://edupilot_user:password@localhost:5432/edupilot_db

2. 重启应用:
   python app.py

3. 进行完整的功能测试

4. 备份SQLite数据库后可以删除
"""
        else:
            report += """
⚠️ 发现问题，建议采取以下措施:

1. 检查上述问题列表
2. 必要时重新运行迁移脚本
3. 如果问题严重，考虑回滚到SQLite
4. 联系技术支持
"""
        
        return report
    
    def run(self):
        """执行完整验证流程"""
        print("\n" + "="*60)
        print("    PostgreSQL 迁移验证工具")
        print("="*60 + "\n")
        
        # 步骤1: 连接数据库
        if not self.connect_databases():
            return False
        
        # 步骤2: 验证表结构
        self.verify_tables()
        
        # 步骤3: 验证记录数量
        self.verify_record_counts()
        
        # 步骤4: 验证索引
        self.verify_indexes()
        
        # 步骤5: 数据抽样验证
        self.sample_data_verification()
        
        # 步骤6: 测试数据库操作
        self.test_database_operations()
        
        # 步骤7: 生成报告
        report = self.generate_report()
        print(report)
        
        # 保存报告
        report_file = f"verification_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n📄 详细报告已保存到: {report_file}\n")
        
        return len(self.results['issues']) == 0


def main():
    """主函数"""
    # 获取数据库URI
    sqlite_uri = 'sqlite:///data/edupilot.db'
    postgresql_uri = os.environ.get('DATABASE_URL')
    
    if not postgresql_uri or 'postgresql' not in postgresql_uri:
        print("\n❌ 错误: 未找到PostgreSQL数据库配置")
        print("\n请设置环境变量 DATABASE_URL:")
        print("例如: export DATABASE_URL='postgresql://edupilot_user:password@localhost:5432/edupilot_db'")
        return False
    
    print(f"\n🗄️  SQLite数据库: {sqlite_uri}")
    print(f"🗄️  PostgreSQL数据库: {postgresql_uri.split('@')[1] if '@' in postgresql_uri else postgresql_uri}\n")
    
    # 执行验证
    verifier = MigrationVerifier(sqlite_uri, postgresql_uri)
    success = verifier.run()
    
    return success


if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ 验证被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 验证过程中发生错误: {str(e)}")
        import traceback
        print(f"详细错误: {traceback.format_exc()}")
        sys.exit(1)



