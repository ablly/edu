#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Gunicorn 配置文件
"""

import multiprocessing
import os

# 获取项目根目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ==================== 服务器Socket ====================
# 绑定地址和端口
bind = os.getenv('GUNICORN_BIND', '127.0.0.1:5000')

# Unix socket (可选，性能更好)
# bind = 'unix:/tmp/edupilot.sock'

# 监听队列大小
backlog = 2048

# ==================== Worker 进程 ====================
# Worker 数量 = (CPU核心数 * 2) + 1
workers = int(os.getenv('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))

# Worker 类型
# sync: 同步worker（默认）
# gevent: 异步worker，处理大量并发连接
# eventlet: 异步worker
worker_class = os.getenv('GUNICORN_WORKER_CLASS', 'gevent')

# 每个worker的线程数（如果使用sync worker）
threads = int(os.getenv('GUNICORN_THREADS', 1))

# Worker连接数（仅用于async workers）
worker_connections = 1000

# 每个worker处理的最大请求数后重启（防止内存泄漏）
max_requests = 1000
max_requests_jitter = 50  # 随机偏移，避免同时重启

# ==================== 超时设置 ====================
# Worker超时时间（秒）
timeout = int(os.getenv('GUNICORN_TIMEOUT', 30))

# Worker优雅重启超时
graceful_timeout = 30

# Keep-alive连接超时
keepalive = 2

# ==================== 日志配置 ====================
# 访问日志
accesslog = os.path.join(BASE_DIR, 'logs', 'gunicorn_access.log')

# 错误日志
errorlog = os.path.join(BASE_DIR, 'logs', 'gunicorn_error.log')

# 日志级别: debug, info, warning, error, critical
loglevel = os.getenv('LOG_LEVEL', 'info')

# 访问日志格式
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(L)s'

# 禁用访问日志（生产环境可选，减少IO）
# accesslog = None

# ==================== 进程命名 ====================
# 进程名称
proc_name = 'edupilot'

# ==================== 服务器机制 ====================
# Daemon模式（后台运行）- 使用Supervisor时设为False
daemon = False

# PID文件
pidfile = os.path.join(BASE_DIR, 'logs', 'gunicorn.pid')

# 用户和组（需要root权限）
# user = 'edupilot'
# group = 'edupilot'

# Umask
umask = 0

# 临时文件目录
tmp_upload_dir = None

# ==================== SSL配置（可选）====================
# 如果不使用Nginx，可以直接配置SSL
# keyfile = '/path/to/keyfile.pem'
# certfile = '/path/to/certfile.pem'

# ==================== 开发模式配置 ====================
# 重载代码（开发模式）
reload = os.getenv('FLASK_ENV') == 'development'

# 监控额外文件变化
reload_extra_files = []

# ==================== 服务器钩子 ====================
def on_starting(server):
    """
    服务器启动时调用
    """
    print("🚀 Gunicorn 服务器启动中...")

def on_reload(server):
    """
    配置重载时调用
    """
    print("🔄 Gunicorn 配置已重载")

def when_ready(server):
    """
    服务器就绪时调用
    """
    print(f"✅ Gunicorn 服务器已就绪，监听: {bind}")
    print(f"👷 Worker 数量: {workers}")
    print(f"⚙️  Worker 类型: {worker_class}")

def on_exit(server):
    """
    服务器退出时调用
    """
    print("👋 Gunicorn 服务器已关闭")

def worker_int(worker):
    """
    Worker被中断时调用
    """
    print(f"⚠️  Worker #{worker.pid} 收到中断信号")

def worker_abort(worker):
    """
    Worker异常退出时调用
    """
    print(f"❌ Worker #{worker.pid} 异常退出")

def pre_fork(server, worker):
    """
    Worker fork之前调用
    """
    pass

def post_fork(server, worker):
    """
    Worker fork之后调用
    """
    print(f"🔧 Worker #{worker.pid} 已启动")

def post_worker_init(worker):
    """
    Worker初始化完成后调用
    """
    pass

def worker_exit(server, worker):
    """
    Worker退出时调用
    """
    print(f"🔌 Worker #{worker.pid} 已退出")

# ==================== 性能调优 ====================
# 预加载应用（节省内存，但reload时需要完全重启）
preload_app = False

# 发送文件时使用sendfile()系统调用（Linux）
sendfile = True

# 使用chdir()切换工作目录
chdir = BASE_DIR

# ==================== 限制请求 ====================
# 限制请求行大小
limit_request_line = 4094

# 限制请求头字段数量
limit_request_fields = 100

# 限制请求头字段大小
limit_request_field_size = 8190



