"""
安全工具模块
提供密码验证、输入清理、XSS防护等安全功能
"""

import re
import bleach
from urllib.parse import urlparse, urljoin


def validate_password_strength(password):
    """
    验证密码强度
    
    规则:
    - 至少8个字符
    - 至少包含一个大写字母
    - 至少包含一个小写字母
    - 至少包含一个数字
    - 至少包含一个特殊字符
    
    Args:
        password (str): 待验证的密码
        
    Returns:
        tuple: (is_valid: bool, message: str, strength: str)
    """
    if not password:
        return False, "密码不能为空", "weak"
    
    # 长度检查
    if len(password) < 8:
        return False, "密码长度至少8个字符", "weak"
    
    # 检查各种字符类型
    has_upper = bool(re.search(r'[A-Z]', password))
    has_lower = bool(re.search(r'[a-z]', password))
    has_digit = bool(re.search(r'\d', password))
    has_special = bool(re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password))
    
    # 计算满足条件数量
    conditions_met = sum([has_upper, has_lower, has_digit, has_special])
    
    # 强度评估
    if conditions_met == 4 and len(password) >= 12:
        return True, "密码强度：非常强", "very_strong"
    elif conditions_met >= 3 and len(password) >= 10:
        return True, "密码强度：强", "strong"
    elif conditions_met >= 3 and len(password) >= 8:
        return True, "密码强度：中等", "medium"
    else:
        # 给出具体建议
        suggestions = []
        if not has_upper:
            suggestions.append("大写字母")
        if not has_lower:
            suggestions.append("小写字母")
        if not has_digit:
            suggestions.append("数字")
        if not has_special:
            suggestions.append("特殊字符")
        
        message = f"密码强度较弱，建议包含：{'、'.join(suggestions)}"
        return False, message, "weak"


def sanitize_input(text, max_length=10000, allow_html=False, strict_mode=True):
    """
    清理用户输入，防止XSS和注入攻击
    
    Args:
        text (str): 待清理的文本
        max_length (int): 最大长度限制
        allow_html (bool): 是否允许HTML标签
        strict_mode (bool): 严格模式，移除所有HTML标签和JavaScript事件
        
    Returns:
        str: 清理后的文本
    """
    if not text:
        return ""
    
    # 转换为字符串
    text = str(text)
    
    # 长度限制
    if len(text) > max_length:
        text = text[:max_length]
    
    # 移除控制字符
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    
    # 严格模式或不允许HTML时，移除所有HTML标签
    if strict_mode or not allow_html:
        # 移除JavaScript事件属性
        text = re.sub(r'on\w+\s*=\s*["\']?[^"\']*["\']?', '', text, flags=re.IGNORECASE)
        
        # 移除危险标签
        dangerous_tags = ['script', 'iframe', 'object', 'embed', 'applet', 'meta', 'link', 'style']
        for tag in dangerous_tags:
            text = re.sub(rf'<{tag}[^>]*>.*?</{tag}>', '', text, flags=re.IGNORECASE | re.DOTALL)
            text = re.sub(rf'<{tag}[^>]*/?>', '', text, flags=re.IGNORECASE)
        
        # 如果不允许HTML，进行HTML实体转义
        if not allow_html:
            text = text.replace('&', '&amp;')
            text = text.replace('<', '&lt;')
            text = text.replace('>', '&gt;')
            text = text.replace('"', '&quot;')
            text = text.replace("'", '&#x27;')
            text = text.replace('/', '&#x2F;')
    else:
        # 使用bleach清理HTML（保留安全标签）
        text = sanitize_html(text)
    
    return text.strip()


def sanitize_html(html_content, allowed_tags=None, allowed_attributes=None):
    """
    清理HTML内容，只保留安全的标签和属性
    
    Args:
        html_content (str): HTML内容
        allowed_tags (list): 允许的标签列表
        allowed_attributes (dict): 允许的属性字典
        
    Returns:
        str: 清理后的HTML
    """
    if not html_content:
        return ""
    
    # 默认允许的标签（安全的格式化标签）
    if allowed_tags is None:
        allowed_tags = [
            'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'blockquote', 'code', 'pre',
            'a', 'img'
        ]
    
    # 默认允许的属性
    if allowed_attributes is None:
        allowed_attributes = {
            'a': ['href', 'title', 'rel'],
            'img': ['src', 'alt', 'title', 'width', 'height']
        }
    
    # 使用bleach清理
    clean_html = bleach.clean(
        html_content,
        tags=allowed_tags,
        attributes=allowed_attributes,
        strip=True
    )
    
    return clean_html


def is_safe_url(url, allowed_hosts=None):
    """
    检查URL是否安全（防止开放重定向）
    
    Args:
        url (str): 待检查的URL
        allowed_hosts (list): 允许的主机列表
        
    Returns:
        bool: 是否安全
    """
    if not url:
        return False
    
    # 解析URL
    parsed = urlparse(url)
    
    # 如果是相对URL，认为是安全的
    if not parsed.netloc:
        return True
    
    # 如果指定了允许的主机列表，检查是否在列表中
    if allowed_hosts:
        return parsed.netloc in allowed_hosts
    
    # 默认只允许相对URL
    return False


def validate_email(email):
    """
    验证邮箱格式
    
    Args:
        email (str): 邮箱地址
        
    Returns:
        bool: 是否有效
    """
    if not email:
        return False
    
    # 邮箱正则表达式
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_username(username):
    """
    验证用户名格式（支持中文）
    
    规则:
    - 中文用户名: 2-10个字符
    - 英文用户名: 3-20个字符
    - 允许中文汉字、字母、数字、下划线、连字符
    - 必须以中文或字母开头
    
    Args:
        username (str): 用户名
        
    Returns:
        tuple: (is_valid: bool, message: str)
    """
    if not username:
        return False, "用户名不能为空"
    
    # 检测是否包含中文
    has_chinese = bool(re.search(r'[\u4e00-\u9fff]', username))
    
    # 根据是否有中文设置不同的长度限制
    if has_chinese:
        # 中文用户名：2-10个字符
        if len(username) < 2:
            return False, "用户名至少2个字符"
        if len(username) > 10:
            return False, "用户名最多10个字符"
        
        # 必须以中文或字母开头
        if not (username[0].isalpha() or re.match(r'[\u4e00-\u9fff]', username[0])):
            return False, "用户名必须以中文或字母开头"
        
        # 只允许中文、字母、数字、下划线、连字符
        if not re.match(r'^[\u4e00-\u9fffa-zA-Z][\u4e00-\u9fffa-zA-Z0-9_-]*$', username):
            return False, "用户名只能包含中文、字母、数字、下划线和连字符"
    else:
        # 英文用户名：3-20个字符
        if len(username) < 3:
            return False, "用户名至少3个字符"
        if len(username) > 20:
            return False, "用户名最多20个字符"
        
        # 必须以字母开头
        if not username[0].isalpha():
            return False, "用户名必须以字母开头"
        
        # 只允许字母、数字、下划线、连字符
        if not re.match(r'^[a-zA-Z][a-zA-Z0-9_-]*$', username):
            return False, "用户名只能包含字母、数字、下划线和连字符"
    
    return True, "用户名格式正确"


def generate_safe_filename(filename):
    """
    生成安全的文件名
    
    Args:
        filename (str): 原始文件名
        
    Returns:
        str: 安全的文件名
    """
    if not filename:
        return "unnamed"
    
    # 移除路径分隔符
    filename = filename.replace('/', '_').replace('\\', '_')
    
    # 只保留安全字符
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    
    # 限制长度
    if len(filename) > 255:
        # 保留扩展名
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:240] + ('.' + ext if ext else '')
    
    return filename


def check_file_size(file_size, max_size_mb=16):
    """
    检查文件大小是否符合要求
    
    Args:
        file_size (int): 文件大小（字节）
        max_size_mb (int): 最大大小（MB）
        
    Returns:
        tuple: (is_valid: bool, message: str)
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    
    if file_size > max_size_bytes:
        return False, f"文件大小超过限制（最大{max_size_mb}MB）"
    
    return True, "文件大小符合要求"


def check_file_type(filename, allowed_extensions):
    """
    检查文件类型是否允许
    
    Args:
        filename (str): 文件名
        allowed_extensions (set): 允许的扩展名集合
        
    Returns:
        tuple: (is_valid: bool, message: str, extension: str)
    """
    if not filename or '.' not in filename:
        return False, "无效的文件名", ""
    
    extension = filename.rsplit('.', 1)[1].lower()
    
    if extension not in allowed_extensions:
        return False, f"不支持的文件类型 .{extension}", extension
    
    return True, "文件类型正确", extension


def add_security_headers(response):
    """
    为响应添加安全HTTP头部
    
    这些头部可以防止常见的Web攻击：
    - X-Frame-Options: 防止点击劫持
    - X-Content-Type-Options: 防止MIME类型嗅探
    - X-XSS-Protection: 启用浏览器XSS过滤器
    - Strict-Transport-Security: 强制HTTPS（生产环境）
    - Content-Security-Policy: 内容安全策略
    
    Args:
        response: Flask响应对象
        
    Returns:
        response: 添加了安全头部的响应对象
    """
    # 防止点击劫持攻击
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    
    # 防止MIME类型嗅探
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # 启用浏览器XSS过滤器
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # HSTS - 强制HTTPS（仅在生产环境启用）
    # 注释掉，因为开发环境使用HTTP
    # response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    # Content-Security-Policy - 内容安全策略
    # 允许本站资源、CDN字体和图标
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
        "font-src 'self' https://cdnjs.cloudflare.com data:; "
        "img-src 'self' data: https:; "
        "connect-src 'self'; "
        "frame-ancestors 'self';"
    )
    response.headers['Content-Security-Policy'] = csp
    
    # 引用策略 - 控制Referer头信息
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # 权限策略 - 限制浏览器功能
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    
    return response


# ==================== 账户锁定机制 ====================

# 账户锁定配置常量
MAX_LOGIN_ATTEMPTS = 5      # 最大失败尝试次数
LOCKOUT_DURATION = 120      # 锁定时长（秒），2分钟（进一步优化：更短的锁定时间）
ATTEMPT_WINDOW = 300        # 统计窗口（秒），5分钟内的失败次数


def record_login_attempt(username, ip_address, user_agent, success, failure_reason=None):
    """
    记录登录尝试
    
    Args:
        username (str): 用户名
        ip_address (str): IP地址
        user_agent (str): 浏览器信息
        success (bool): 是否成功
        failure_reason (str): 失败原因（可选）
        
    Returns:
        dict: 记录信息，包含是否触发锁定
    """
    from datetime import datetime, timedelta
    from models import db, LoginAttempt
    
    try:
        # 创建登录尝试记录
        attempt = LoginAttempt(
            username=username,
            ip_address=ip_address,
            user_agent=user_agent[:500] if user_agent else None,  # 限制长度
            success=success,
            failure_reason=failure_reason,
            attempted_at=datetime.utcnow()
        )
        
        # 如果登录失败，检查是否需要锁定账户
        if not success:
            # 查询最近ATTEMPT_WINDOW时间内的失败次数
            window_start = datetime.utcnow() - timedelta(seconds=ATTEMPT_WINDOW)
            recent_failures = LoginAttempt.query.filter(
                LoginAttempt.username == username,
                LoginAttempt.success == False,
                LoginAttempt.attempted_at >= window_start
            ).count()
            
            # 如果失败次数达到阈值，设置锁定时间
            if recent_failures + 1 >= MAX_LOGIN_ATTEMPTS:
                locked_until = datetime.utcnow() + timedelta(seconds=LOCKOUT_DURATION)
                attempt.locked_until = locked_until
        
        # 保存到数据库
        db.session.add(attempt)
        db.session.commit()
        
        return {
            'success': True,
            'locked': attempt.locked_until is not None,
            'locked_until': attempt.locked_until.isoformat() if attempt.locked_until else None
        }
        
    except Exception as e:
        db.session.rollback()
        print(f"记录登录尝试失败: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def is_account_locked(username):
    """
    检查账户是否被锁定
    
    Args:
        username (str): 用户名
        
    Returns:
        tuple: (is_locked: bool, locked_until: datetime, recent_attempts: int)
    """
    from datetime import datetime, timedelta
    from models import LoginAttempt
    
    try:
        # 查询最近ATTEMPT_WINDOW时间内的失败记录
        window_start = datetime.utcnow() - timedelta(seconds=ATTEMPT_WINDOW)
        recent_failures = LoginAttempt.query.filter(
            LoginAttempt.username == username,
            LoginAttempt.success == False,
            LoginAttempt.attempted_at >= window_start
        ).order_by(LoginAttempt.attempted_at.desc()).all()
        
        if not recent_failures:
            return False, None, 0
        
        # 检查最近的锁定记录
        latest_attempt = recent_failures[0]
        if latest_attempt.locked_until:
            # 如果锁定时间还未过期
            if latest_attempt.locked_until > datetime.utcnow():
                return True, latest_attempt.locked_until, len(recent_failures)
        
        # 检查是否达到锁定阈值
        if len(recent_failures) >= MAX_LOGIN_ATTEMPTS:
            return True, latest_attempt.locked_until, len(recent_failures)
        
        return False, None, len(recent_failures)
        
    except Exception as e:
        print(f"检查账户锁定状态失败: {str(e)}")
        return False, None, 0


def get_remaining_attempts(username):
    """
    获取剩余登录尝试次数
    
    Args:
        username (str): 用户名
        
    Returns:
        int: 剩余尝试次数
    """
    from datetime import datetime, timedelta
    from models import LoginAttempt
    
    try:
        # 查询最近ATTEMPT_WINDOW时间内的失败次数
        window_start = datetime.utcnow() - timedelta(seconds=ATTEMPT_WINDOW)
        recent_failures = LoginAttempt.query.filter(
            LoginAttempt.username == username,
            LoginAttempt.success == False,
            LoginAttempt.attempted_at >= window_start
        ).count()
        
        remaining = MAX_LOGIN_ATTEMPTS - recent_failures
        return max(0, remaining)
        
    except Exception as e:
        print(f"获取剩余尝试次数失败: {str(e)}")
        return MAX_LOGIN_ATTEMPTS


def unlock_account(username):
    """
    手动解锁账户（管理员功能）
    
    Args:
        username (str): 用户名
        
    Returns:
        bool: 是否成功
    """
    from datetime import datetime, timedelta
    from models import db, LoginAttempt
    
    try:
        # 删除最近的失败记录
        window_start = datetime.utcnow() - timedelta(seconds=ATTEMPT_WINDOW)
        LoginAttempt.query.filter(
            LoginAttempt.username == username,
            LoginAttempt.success == False,
            LoginAttempt.attempted_at >= window_start
        ).delete()
        
        db.session.commit()
        print(f"✅ 账户 {username} 已解锁")
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ 解锁账户失败: {str(e)}")
        return False

