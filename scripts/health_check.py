#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
EduPilot AI 系统健康检查脚本

功能：
- 检查数据库连接
- 检查Redis连接
- 检查磁盘空间
- 检查日志文件大小
- 检查应用响应

使用：
  python scripts/health_check.py

定时任务：
  */30 * * * * /home/edupilot/edupilot-ai/venv/bin/python /home/edupilot/edupilot-ai/scripts/health_check.py
"""

import os
import sys
import shutil
import requests
from datetime import datetime

# 添加项目路径
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_DIR)

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_header():
    """打印检查头部"""
    print("\n" + "="*70)
    print(f"{Colors.BLUE}EduPilot AI 系统健康检查{Colors.END}")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70 + "\n")

def print_result(check_name, success, message):
    """打印检查结果"""
    status = f"{Colors.GREEN}✅ PASS{Colors.END}" if success else f"{Colors.RED}❌ FAIL{Colors.END}"
    print(f"{status} {check_name:<30} {message}")
    return success

def check_database():
    """检查数据库连接"""
    try:
        from app import app, db
        with app.app_context():
            # 尝试执行简单查询
            result = db.engine.execute('SELECT 1')
            result.close()
        return True, "数据库连接正常"
    except Exception as e:
        return False, f"数据库连接失败: {str(e)[:50]}"

def check_redis():
    """检查Redis连接"""
    try:
        import redis
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        
        # 如果配置了Redis
        if redis_url and redis_url != 'memory://':
            r = redis.from_url(redis_url)
            r.ping()
            return True, "Redis连接正常"
        else:
            return True, "使用内存存储（开发模式）"
    except Exception as e:
        return False, f"Redis连接失败: {str(e)[:50]}"

def check_disk_space():
    """检查磁盘空间"""
    try:
        stat = shutil.disk_usage('/')
        total = stat.total / (1024**3)  # GB
        used = stat.used / (1024**3)
        free = stat.free / (1024**3)
        percent_used = (stat.used / stat.total) * 100
        
        if percent_used > 90:
            return False, f"磁盘空间不足 ({percent_used:.1f}% 已使用, {free:.1f}GB 剩余)"
        elif percent_used > 80:
            return True, f"磁盘空间警告 ({percent_used:.1f}% 已使用, {free:.1f}GB 剩余)"
        else:
            return True, f"磁盘空间充足 ({percent_used:.1f}% 已使用, {free:.1f}GB 剩余)"
    except Exception as e:
        return False, f"磁盘检查失败: {str(e)[:50]}"

def check_log_files():
    """检查日志文件大小"""
    try:
        logs_dir = os.path.join(PROJECT_DIR, 'logs')
        if not os.path.exists(logs_dir):
            return True, "日志目录不存在"
        
        log_files = ['app.log', 'error.log', 'gunicorn_error.log', 'gunicorn_access.log']
        large_logs = []
        
        for log_file in log_files:
            log_path = os.path.join(logs_dir, log_file)
            if os.path.exists(log_path):
                size_mb = os.path.getsize(log_path) / (1024**2)
                if size_mb > 100:  # 超过100MB
                    large_logs.append(f"{log_file} ({size_mb:.1f}MB)")
        
        if large_logs:
            return True, f"日志文件较大（建议清理）: {', '.join(large_logs)}"
        else:
            return True, "日志文件大小正常"
    except Exception as e:
        return False, f"日志检查失败: {str(e)[:50]}"

def check_app_response():
    """检查应用响应"""
    try:
        # 尝试访问健康检查端点
        response = requests.get('http://127.0.0.1:5000/', timeout=5)
        if response.status_code == 200:
            return True, f"应用响应正常 (HTTP {response.status_code})"
        else:
            return False, f"应用响应异常 (HTTP {response.status_code})"
    except requests.exceptions.ConnectionError:
        return False, "无法连接到应用（应用可能未运行）"
    except requests.exceptions.Timeout:
        return False, "应用响应超时"
    except Exception as e:
        return False, f"应用检查失败: {str(e)[:50]}"

def check_critical_files():
    """检查关键文件是否存在"""
    try:
        critical_files = [
            'app.py',
            'config.py',
            'requirements.txt',
            'models.py',
            'models_membership.py'
        ]
        
        missing_files = []
        for file_name in critical_files:
            file_path = os.path.join(PROJECT_DIR, file_name)
            if not os.path.exists(file_path):
                missing_files.append(file_name)
        
        if missing_files:
            return False, f"关键文件缺失: {', '.join(missing_files)}"
        else:
            return True, "所有关键文件完整"
    except Exception as e:
        return False, f"文件检查失败: {str(e)[:50]}"

def check_environment_variables():
    """检查环境变量"""
    try:
        required_vars = ['SECRET_KEY', 'DEEPSEEK_API_KEY']
        missing_vars = []
        
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            return False, f"缺少环境变量: {', '.join(missing_vars)}"
        else:
            return True, "环境变量配置完整"
    except Exception as e:
        return False, f"环境变量检查失败: {str(e)[:50]}"

def main():
    """主函数"""
    print_header()
    
    # 运行所有检查
    checks = [
        ("数据库连接", check_database),
        ("Redis连接", check_redis),
        ("磁盘空间", check_disk_space),
        ("日志文件", check_log_files),
        ("应用响应", check_app_response),
        ("关键文件", check_critical_files),
        ("环境变量", check_environment_variables),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            success, message = check_func()
            results.append(print_result(name, success, message))
        except Exception as e:
            results.append(print_result(name, False, f"检查异常: {str(e)[:50]}"))
    
    # 打印总结
    print("\n" + "="*70)
    total = len(results)
    passed = sum(results)
    failed = total - passed
    
    if all(results):
        print(f"{Colors.GREEN}✅ 所有检查通过 ({passed}/{total}){Colors.END}")
        print("="*70 + "\n")
        return 0
    else:
        print(f"{Colors.YELLOW}⚠️  部分检查失败 ({passed}/{total} 通过, {failed}/{total} 失败){Colors.END}")
        print("="*70 + "\n")
        return 1

if __name__ == '__main__':
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}检查被用户中断{Colors.END}")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Colors.RED}健康检查脚本执行失败: {str(e)}{Colors.END}")
        sys.exit(1)




