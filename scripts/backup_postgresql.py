#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
PostgreSQL 数据库备份脚本

功能：
1. 使用 pg_dump 创建PostgreSQL备份
2. 支持定时备份
3. 自动清理旧备份
4. 备份压缩

使用方法：
    python scripts/backup_postgresql.py
"""

import os
import sys
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
import gzip
import shutil


class PostgreSQLBackup:
    """PostgreSQL备份管理器"""
    
    def __init__(self, database_url, backup_dir='backups/postgresql'):
        self.database_url = database_url
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        # 解析数据库URL
        self.parse_database_url()
    
    def parse_database_url(self):
        """解析数据库连接URL"""
        # postgresql://user:password@host:port/database
        try:
            url = self.database_url.replace('postgresql://', '')
            
            if '@' in url:
                auth, location = url.split('@')
                self.username, self.password = auth.split(':')
                
                if '/' in location:
                    host_port, self.database = location.split('/')
                    
                    if ':' in host_port:
                        self.host, port = host_port.split(':')
                        self.port = int(port)
                    else:
                        self.host = host_port
                        self.port = 5432
                else:
                    self.host = location
                    self.port = 5432
                    self.database = 'edupilot_db'
            else:
                raise ValueError("无效的数据库URL格式")
        
        except Exception as e:
            print(f"❌ 解析数据库URL失败: {str(e)}")
            print(f"   URL格式应该是: postgresql://user:password@host:port/database")
            sys.exit(1)
    
    def create_backup(self, compress=True):
        """创建数据库备份"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = self.backup_dir / f"edupilot_backup_{timestamp}.sql"
        
        print(f"🔄 正在备份数据库...")
        print(f"   数据库: {self.database}")
        print(f"   主机: {self.host}:{self.port}")
        print(f"   用户: {self.username}")
        
        try:
            # 设置环境变量以避免密码提示
            env = os.environ.copy()
            env['PGPASSWORD'] = self.password
            
            # 构建pg_dump命令
            cmd = [
                'pg_dump',
                '-h', self.host,
                '-p', str(self.port),
                '-U', self.username,
                '-d', self.database,
                '-F', 'p',  # 纯文本格式
                '--no-owner',
                '--no-acl',
                '-f', str(backup_file)
            ]
            
            # 执行备份
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                print(f"❌ 备份失败: {result.stderr}")
                return None
            
            # 获取文件大小
            file_size = backup_file.stat().st_size / (1024 * 1024)  # MB
            print(f"   ✅ 备份创建成功: {backup_file.name}")
            print(f"   📦 文件大小: {file_size:.2f} MB")
            
            # 压缩备份
            if compress:
                compressed_file = self.compress_backup(backup_file)
                if compressed_file:
                    return compressed_file
            
            return backup_file
        
        except FileNotFoundError:
            print("❌ 错误: 未找到pg_dump命令")
            print("   请确保已安装PostgreSQL客户端工具")
            print("   Windows: 添加PostgreSQL bin目录到PATH")
            print("   Linux: sudo apt-get install postgresql-client")
            print("   macOS: brew install postgresql")
            return None
        
        except Exception as e:
            print(f"❌ 备份过程中发生错误: {str(e)}")
            return None
    
    def compress_backup(self, backup_file):
        """压缩备份文件"""
        print(f"\n🗜️  正在压缩备份...")
        
        try:
            compressed_file = backup_file.with_suffix('.sql.gz')
            
            with open(backup_file, 'rb') as f_in:
                with gzip.open(compressed_file, 'wb', compresslevel=9) as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # 获取压缩后的文件大小
            original_size = backup_file.stat().st_size / (1024 * 1024)
            compressed_size = compressed_file.stat().st_size / (1024 * 1024)
            ratio = (1 - compressed_size / original_size) * 100
            
            print(f"   ✅ 压缩完成: {compressed_file.name}")
            print(f"   📦 原始大小: {original_size:.2f} MB")
            print(f"   📦 压缩后: {compressed_size:.2f} MB")
            print(f"   💾 压缩率: {ratio:.1f}%")
            
            # 删除原始文件
            backup_file.unlink()
            
            return compressed_file
        
        except Exception as e:
            print(f"❌ 压缩失败: {str(e)}")
            return backup_file
    
    def cleanup_old_backups(self, keep_days=7):
        """清理旧备份"""
        print(f"\n🧹 正在清理 {keep_days} 天前的备份...")
        
        cutoff_date = datetime.now() - timedelta(days=keep_days)
        deleted_count = 0
        
        for backup_file in self.backup_dir.glob('edupilot_backup_*.sql*'):
            try:
                # 从文件名提取日期
                filename = backup_file.stem.replace('.sql', '')
                date_str = filename.split('_')[-2]  # YYYYMMDD
                file_date = datetime.strptime(date_str, '%Y%m%d')
                
                if file_date < cutoff_date:
                    backup_file.unlink()
                    deleted_count += 1
                    print(f"   🗑️  删除: {backup_file.name}")
            
            except Exception as e:
                print(f"   ⚠️  无法处理 {backup_file.name}: {str(e)}")
        
        if deleted_count == 0:
            print(f"   ✅ 没有需要清理的旧备份")
        else:
            print(f"   ✅ 清理了 {deleted_count} 个旧备份")
    
    def list_backups(self):
        """列出所有备份"""
        backups = sorted(self.backup_dir.glob('edupilot_backup_*.sql*'), reverse=True)
        
        if not backups:
            print("📂 没有找到备份文件")
            return
        
        print(f"\n📂 备份文件列表 ({len(backups)} 个):")
        print(f"{'文件名':<50s} {'大小':<15s} {'日期':<20s}")
        print("-" * 85)
        
        for backup in backups:
            size = backup.stat().st_size / (1024 * 1024)  # MB
            mtime = datetime.fromtimestamp(backup.stat().st_mtime)
            print(f"{backup.name:<50s} {size:>10.2f} MB    {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
    
    def restore_backup(self, backup_file):
        """恢复备份"""
        print(f"\n🔄 正在恢复备份: {backup_file}")
        print("\n⚠️  警告: 此操作将覆盖当前数据库中的所有数据！")
        response = input("是否继续？(yes/no): ").strip().lower()
        
        if response != 'yes':
            print("❌ 恢复已取消")
            return False
        
        try:
            # 设置环境变量
            env = os.environ.copy()
            env['PGPASSWORD'] = self.password
            
            # 解压缩（如果需要）
            temp_file = backup_file
            if backup_file.suffix == '.gz':
                print("   🗜️  正在解压缩...")
                temp_file = backup_file.with_suffix('')
                with gzip.open(backup_file, 'rb') as f_in:
                    with open(temp_file, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
            
            # 恢复数据库
            cmd = [
                'psql',
                '-h', self.host,
                '-p', str(self.port),
                '-U', self.username,
                '-d', self.database,
                '-f', str(temp_file)
            ]
            
            print("   🔄 正在恢复数据...")
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True
            )
            
            # 清理临时文件
            if temp_file != backup_file and temp_file.exists():
                temp_file.unlink()
            
            if result.returncode != 0:
                print(f"❌ 恢复失败: {result.stderr}")
                return False
            
            print(f"   ✅ 数据库恢复成功！")
            return True
        
        except Exception as e:
            print(f"❌ 恢复过程中发生错误: {str(e)}")
            return False


def main():
    """主函数"""
    # 获取数据库URL
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url or 'postgresql' not in database_url:
        print("\n❌ 错误: 未找到PostgreSQL数据库配置")
        print("\n请设置环境变量 DATABASE_URL:")
        print("例如: export DATABASE_URL='postgresql://user:password@localhost:5432/edupilot_db'")
        return False
    
    backup_manager = PostgreSQLBackup(database_url)
    
    # 解析命令行参数
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'list':
            backup_manager.list_backups()
        
        elif command == 'restore' and len(sys.argv) > 2:
            backup_file = Path(sys.argv[2])
            if not backup_file.exists():
                print(f"❌ 错误: 备份文件不存在: {backup_file}")
                return False
            backup_manager.restore_backup(backup_file)
        
        elif command == 'cleanup':
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
            backup_manager.cleanup_old_backups(days)
        
        else:
            print("用法:")
            print("  python scripts/backup_postgresql.py        # 创建备份")
            print("  python scripts/backup_postgresql.py list   # 列出所有备份")
            print("  python scripts/backup_postgresql.py restore <backup_file>  # 恢复备份")
            print("  python scripts/backup_postgresql.py cleanup [days]  # 清理旧备份")
            return False
    
    else:
        # 默认：创建备份并清理旧备份
        print("\n" + "="*60)
        print("    PostgreSQL 数据库备份工具")
        print("="*60 + "\n")
        
        backup_file = backup_manager.create_backup(compress=True)
        
        if backup_file:
            backup_manager.cleanup_old_backups(keep_days=7)
            backup_manager.list_backups()
            
            print("\n✅ 备份完成！")
            print(f"\n💡 提示:")
            print(f"   - 备份文件: {backup_file}")
            print(f"   - 恢复备份: python scripts/backup_postgresql.py restore {backup_file}")
            print(f"   - 查看备份: python scripts/backup_postgresql.py list")
            return True
        else:
            print("\n❌ 备份失败")
            return False


if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ 备份被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 备份过程中发生错误: {str(e)}")
        import traceback
        print(f"详细错误: {traceback.format_exc()}")
        sys.exit(1)



