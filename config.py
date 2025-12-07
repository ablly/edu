#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
EduPilot AI 配置文件
支持多环境配置：开发、测试、生产
"""

import os
from datetime import timedelta

# 基础目录
BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class BaseConfig:
    """基础配置类 - 所有环境共享的配置"""
    
    # Flask基础配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'edu-pilot-secret-key-2024-change-in-production'
    
    # 数据库配置
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # 不输出SQL语句
    SQLALCHEMY_RECORD_QUERIES = True
    
    # 数据库连接池配置（性能优化）
    # 注意：SQLite不支持连接池，这些配置仅在MySQL/PostgreSQL等数据库生效
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,    # 使用连接前先测试是否有效
    }
    
    # 文件上传配置
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    ALLOWED_EXTENSIONS = {'c', 'py', 'zip', 'cpp', 'java', 'txt', 'pdf', 'docx', 'pptx'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    
    # CSRF保护配置
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None  # Token不过期
    WTF_CSRF_CHECK_DEFAULT = False  # 逐步启用
    
    # Session配置
    SESSION_COOKIE_NAME = 'edupilot_session'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    
    # API限流配置
    RATELIMIT_ENABLED = True
    RATELIMIT_HEADERS_ENABLED = True
    RATELIMIT_SWALLOW_ERRORS = True
    
    # DeepSeek API配置
    DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY') or 'sk-c73b1ba93d0141899f756718e1626880'
    DEEPSEEK_BASE_URL = os.environ.get('DEEPSEEK_BASE_URL') or 'https://api.deepseek.com'
    DEEPSEEK_MODEL = 'deepseek-chat'
    
    # BibiGPT API配置
    BIBIGPT_API_TOKEN = os.environ.get('BIBIGPT_API_TOKEN') or 'sk-82UJnbj82Y6PkMKhUo'
    BIBIGPT_API_URL = 'https://api.bibigpt.co/api/open'
    
    # 日志配置
    LOG_LEVEL = os.environ.get('LOG_LEVEL') or 'INFO'
    LOG_FILE = os.path.join(BASE_DIR, 'logs', 'app.log')
    LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 10
    
    # 会员系统配置
    ENABLE_MEMBERSHIP = True
    PAYMENT_CALLBACK_URL = os.environ.get('PAYMENT_CALLBACK_URL') or 'http://localhost:5000/api/payment/callback'
    
    # 支付宝配置
    ALIPAY_APP_ID = os.environ.get('ALIPAY_APP_ID') or ''
    ALIPAY_APP_PRIVATE_KEY = os.environ.get('ALIPAY_APP_PRIVATE_KEY') or ''
    ALIPAY_PUBLIC_KEY = os.environ.get('ALIPAY_PUBLIC_KEY') or ''
    ALIPAY_GATEWAY = os.environ.get('ALIPAY_GATEWAY') or 'https://openapi.alipay.com/gateway.do'  # 正式环境
    # ALIPAY_GATEWAY = 'https://openapi.alipaydev.com/gateway.do'  # 沙箱环境
    
    # 支付回调URL配置
    PAYMENT_RETURN_URL = os.environ.get('PAYMENT_RETURN_URL') or 'http://localhost:5000/api/payment/alipay/return'
    PAYMENT_NOTIFY_URL = os.environ.get('PAYMENT_NOTIFY_URL') or 'http://localhost:5000/api/payment/alipay/callback'
    PAYMENT_TIMEOUT = 900  # 订单超时时间（秒），默认15分钟


class DevelopmentConfig(BaseConfig):
    """开发环境配置"""
    
    DEBUG = True
    TESTING = False
    
    # 数据库配置 - 开发环境使用SQLite
    DATABASE_PATH = os.path.join(BASE_DIR, 'database', 'scores.db')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f'sqlite:///{DATABASE_PATH}'
    SQLALCHEMY_ECHO = False  # 开发时可以设为True查看SQL
    
    # Redis配置 - 开发环境使用内存存储
    REDIS_URL = os.environ.get('REDIS_URL') or None
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL') or 'memory://'
    
    # Session配置 - 开发环境使用文件系统
    SESSION_TYPE = 'filesystem'
    SESSION_COOKIE_SECURE = False  # HTTP也可用
    
    # 日志级别
    LOG_LEVEL = 'DEBUG'


class TestingConfig(BaseConfig):
    """测试环境配置"""
    
    DEBUG = False
    TESTING = True
    
    # 测试数据库 - 使用内存数据库
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # 禁用CSRF保护（测试时）
    WTF_CSRF_ENABLED = False
    
    # 禁用API限流
    RATELIMIT_ENABLED = False
    
    # Session配置
    SESSION_TYPE = 'null'
    
    # 日志级别
    LOG_LEVEL = 'ERROR'


class ProductionConfig(BaseConfig):
    """生产环境配置"""
    
    DEBUG = False
    TESTING = False
    
    # 数据库配置 - 生产环境必须使用PostgreSQL
    # Vercel环境不支持SQLite（只读文件系统）
    _db_url = os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL')
    # 处理 URL 格式，使用 psycopg3 驱动
    if _db_url:
        if _db_url.startswith('postgres://'):
            _db_url = _db_url.replace('postgres://', 'postgresql+psycopg://', 1)
        elif _db_url.startswith('postgresql://') and '+' not in _db_url:
            _db_url = _db_url.replace('postgresql://', 'postgresql+psycopg://', 1)
    SQLALCHEMY_DATABASE_URI = _db_url or f'sqlite:///{os.path.join(BASE_DIR, "data", "edupilot.db")}'
    
    # 生产环境数据库连接池配置（仅MySQL/PostgreSQL）
    # 如果使用SQLite，这些参数会被自动忽略
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,          # 连接池大小
        'max_overflow': 20,       # 超过pool_size后最多创建的连接数
        'pool_timeout': 30,       # 获取连接的超时时间（秒）
        'pool_recycle': 3600,     # 连接回收时间（秒），防止MySQL连接超时
        'pool_pre_ping': True,    # 使用连接前先测试是否有效
    }
    
    # Redis配置 - 如果有Redis则使用，否则使用内存存储（Vercel无Redis）
    REDIS_URL = os.environ.get('REDIS_URL') or None
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL') or 'memory://'
    
    # Session配置 - Vercel无Redis，使用文件系统或null
    SESSION_TYPE = 'filesystem' if not os.environ.get('REDIS_URL') else 'redis'
    SESSION_COOKIE_SECURE = True  # 仅HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'None'  # 跨域需要设置为None
    
    # 安全配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or BaseConfig.SECRET_KEY  # 从环境变量或基础配置获取
    
    # 日志配置
    LOG_LEVEL = 'INFO'
    
    @classmethod
    def init_app(cls, app):
        """
        初始化生产环境配置时的验证
        只在实际使用生产配置时才进行验证
        """
        # 验证必需的环境变量
        if os.environ.get('FLASK_ENV') == 'production':
            if not os.environ.get('SECRET_KEY'):
                import warnings
                warnings.warn("生产环境强烈建议设置 SECRET_KEY 环境变量！当前使用默认密钥（不安全）")
            
            if not os.environ.get('DEEPSEEK_API_KEY'):
                import warnings
                warnings.warn("生产环境建议通过环境变量设置 DEEPSEEK_API_KEY")


# 配置字典 - 方便通过名称获取配置类
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config(config_name=None):
    """
    获取配置对象
    
    Args:
        config_name (str): 配置名称 ('development', 'testing', 'production')
                          如果为None，从环境变量FLASK_ENV读取，默认为development
    
    Returns:
        Config: 配置类
    """
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    return config.get(config_name, DevelopmentConfig)


# 向后兼容 - 保留旧的配置变量供直接导入
_current_config = get_config()

# 导出常用配置（向后兼容）
DEEPSEEK_API_KEY = _current_config.DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL = _current_config.DEEPSEEK_BASE_URL
DEEPSEEK_MODEL = _current_config.DEEPSEEK_MODEL
BIBIGPT_API_TOKEN = _current_config.BIBIGPT_API_TOKEN
BIBIGPT_API_URL = _current_config.BIBIGPT_API_URL
UPLOAD_FOLDER = _current_config.UPLOAD_FOLDER
ALLOWED_EXTENSIONS = _current_config.ALLOWED_EXTENSIONS
MAX_CONTENT_LENGTH = _current_config.MAX_CONTENT_LENGTH
SQLALCHEMY_DATABASE_URI = _current_config.SQLALCHEMY_DATABASE_URI
SQLALCHEMY_TRACK_MODIFICATIONS = _current_config.SQLALCHEMY_TRACK_MODIFICATIONS

# 保留DATABASE_PATH变量（如果存在）
if hasattr(_current_config, 'DATABASE_PATH'):
    DATABASE_PATH = _current_config.DATABASE_PATH
else:
    # 向后兼容旧代码
    DATABASE_PATH = os.path.join(BASE_DIR, 'database', 'scores.db')

# Flask配置类（向后兼容）
Config = _current_config
