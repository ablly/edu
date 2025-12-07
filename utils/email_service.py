"""
邮件发送服务
用于发送验证码、通知等邮件
"""
from flask_mail import Mail, Message
from flask import current_app
import random
import string
from datetime import datetime, timedelta

class EmailService:
    """邮件服务类"""
    
    def __init__(self, mail=None):
        self.mail = mail
    
    @staticmethod
    def generate_code(length=6):
        """生成指定长度的数字验证码"""
        return ''.join(random.choices(string.digits, k=length))
    
    def send_verification_code(self, to_email, code, purpose='reset_password'):
        """
        发送验证码邮件
        
        Args:
            to_email: 收件人邮箱
            code: 验证码
            purpose: 用途 ('reset_password', 'register')
        
        Returns:
            bool: 是否发送成功
        """
        try:
            if purpose == 'reset_password':
                subject = '【EduPilot AI】密码重置验证码'
                html_body = self._get_reset_password_template(code)
            elif purpose == 'register':
                subject = '【EduPilot AI】注册验证码'
                html_body = self._get_register_template(code)
            else:
                subject = '【EduPilot AI】验证码'
                html_body = self._get_generic_template(code)
            
            msg = Message(
                subject=subject,
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                recipients=[to_email],
                html=html_body
            )
            
            self.mail.send(msg)
            return True
            
        except Exception as e:
            current_app.logger.error(f"邮件发送失败: {str(e)}")
            return False
    
    def _get_reset_password_template(self, code):
        """密码重置邮件模板"""
        return f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .email-container {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 2px;
        }}
        .email-content {{
            background: white;
            border-radius: 10px;
            padding: 40px 30px;
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .logo {{
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }}
        .code-box {{
            background: #f7fafc;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }}
        .code {{
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }}
        .warning {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .footer {{
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }}
        .btn {{
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-content">
            <div class="header">
                <div class="logo">🎓 EduPilot AI</div>
                <p style="color: #666; margin: 0;">智能教育协控系统</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">密码重置请求</h2>
            
            <p>您好！</p>
            <p>我们收到了您的密码重置请求。请使用以下验证码完成密码重置：</p>
            
            <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">您的验证码</p>
                <div class="code">{code}</div>
                <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">验证码10分钟内有效</p>
            </div>
            
            <div class="warning">
                <strong>⚠️ 安全提示：</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>请勿将验证码告诉他人</li>
                    <li>如非本人操作，请忽略此邮件</li>
                    <li>验证码10分钟后失效</li>
                </ul>
            </div>
            
            <p style="margin-top: 30px;">如果您没有请求重置密码，请忽略此邮件。您的账户安全不会受到影响。</p>
            
            <div class="footer">
                <p>此邮件由系统自动发送，请勿直接回复</p>
                <p style="margin: 10px 0;">© 2025 EduPilot AI. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    def _get_register_template(self, code):
        """注册验证码邮件模板"""
        return f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .email-container {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 2px;
        }}
        .email-content {{
            background: white;
            border-radius: 10px;
            padding: 40px 30px;
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .logo {{
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }}
        .code-box {{
            background: #f7fafc;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }}
        .code {{
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }}
        .footer {{
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-content">
            <div class="header">
                <div class="logo">🎓 EduPilot AI</div>
                <p style="color: #666; margin: 0;">智能教育协控系统</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">欢迎注册 EduPilot AI！</h2>
            
            <p>您好！</p>
            <p>感谢您注册EduPilot AI。请使用以下验证码完成注册：</p>
            
            <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">您的验证码</p>
                <div class="code">{code}</div>
                <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">验证码10分钟内有效</p>
            </div>
            
            <div class="footer">
                <p>此邮件由系统自动发送，请勿直接回复</p>
                <p style="margin: 10px 0;">© 2025 EduPilot AI. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    def _get_generic_template(self, code):
        """通用验证码邮件模板"""
        return f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .code-box {{
            background: #f7fafc;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }}
        .code {{
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }}
    </style>
</head>
<body>
    <h2>EduPilot AI 验证码</h2>
    <div class="code-box">
                <div class="code">{code}</div>
                <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">验证码10分钟内有效</p>
            </div>
</body>
</html>
"""






