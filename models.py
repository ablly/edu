from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import uuid
import json

db = SQLAlchemy()

class Student(db.Model):
    __tablename__ = 'student'  # 显式声明表名，避免与已有的 `students` 表冲突
    __table_args__ = (
        db.Index('idx_student_id', 'student_id'),
        db.Index('idx_class_major', 'class_name', 'major'),
        db.Index('idx_student_status', 'student_status'),
        db.Index('idx_created_at', 'created_at'),
    )
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(20), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    
    # 个人基本信息
    gender = db.Column(db.String(10))  # 性别
    birth_date = db.Column(db.Date)  # 出生日期
    id_card = db.Column(db.String(18))  # 身份证号
    phone = db.Column(db.String(20))  # 联系电话
    email = db.Column(db.String(100))  # 邮箱
    avatar = db.Column(db.String(255))  # 头像文件路径
    
    # 学术信息
    admission_date = db.Column(db.Date)  # 入学日期
    major = db.Column(db.String(100))  # 专业
    class_name = db.Column(db.String(50))  # 班级
    grade = db.Column(db.String(20))  # 年级
    education_level = db.Column(db.String(20))  # 学制（本科、硕士、博士等）
    student_status = db.Column(db.String(20), default='在读')  # 学生状态（在读、休学、毕业等）
    
    # 联系信息
    address = db.Column(db.Text)  # 家庭住址
    emergency_contact = db.Column(db.String(100))  # 紧急联系人
    emergency_phone = db.Column(db.String(20))  # 紧急联系人电话
    parent_name = db.Column(db.String(100))  # 家长姓名
    parent_phone = db.Column(db.String(20))  # 家长电话
    
    # 扩展信息
    notes = db.Column(db.Text)  # 备注
    tags = db.Column(db.Text)  # 标签（JSON格式存储）
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # 创建时间
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 更新时间
    
    # 关联关系
    assignments = db.relationship('Assignment', backref='student', lazy=True)
    question_submissions = db.relationship('QuestionSubmission', backref='student', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'name': self.name,
            'gender': self.gender,
            'birth_date': self.birth_date.strftime('%Y-%m-%d') if self.birth_date else None,
            'id_card': self.id_card,
            'phone': self.phone,
            'email': self.email,
            'avatar': self.avatar,
            'admission_date': self.admission_date.strftime('%Y-%m-%d') if self.admission_date else None,
            'major': self.major,
            'class_name': self.class_name,
            'grade': self.grade,
            'education_level': self.education_level,
            'student_status': self.student_status,
            'address': self.address,
            'emergency_contact': self.emergency_contact,
            'emergency_phone': self.emergency_phone,
            'parent_name': self.parent_name,
            'parent_phone': self.parent_phone,
            'notes': self.notes,
            'tags': json.loads(self.tags) if self.tags else [],
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def to_simple_dict(self):
        """简化版本，用于列表显示"""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'name': self.name,
            'gender': self.gender,
            'major': self.major,
            'class_name': self.class_name,
            'student_status': self.student_status,
            'phone': self.phone,
            'email': self.email
        }

class Assignment(db.Model):
    __tablename__ = 'assignment'
    __table_args__ = (
        db.Index('idx_assignment_student_id', 'student_id'),
        db.Index('idx_assignment_subject', 'subject'),
        db.Index('idx_assignment_submission_time', 'submission_time'),
        db.Index('idx_assignment_student_subject', 'student_id', 'subject'),
    )
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(20), db.ForeignKey('student.student_id'), nullable=False, index=True)
    assignment_name = db.Column(db.String(100), nullable=False)
    subject = db.Column(db.String(50), nullable=False, index=True)  # 新增科目字段
    chapter = db.Column(db.String(50), nullable=False)  # 新增章节字段
    score = db.Column(db.Float)
    feedback = db.Column(db.Text)
    submission_time = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'assignment_name': self.assignment_name,
            'subject': self.subject,  # 新增
            'chapter': self.chapter,  # 新增
            'score': self.score,
            'feedback': self.feedback,
            'submission_time': self.submission_time.strftime('%Y-%m-%d %H:%M:%S')
        }

class QuestionBank(db.Model):
    __tablename__ = 'question_bank'
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.String(50), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    question_set_id = db.Column(db.String(50), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20), nullable=False)
    options = db.Column(db.Text)  # 简化处理，总是使用 Text 类型
    correct_answer = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    def __init__(self, **kwargs):
        # 确保options被序列化为JSON字符串
        if 'options' in kwargs and kwargs['options'] is not None:
            kwargs['options'] = json.dumps(kwargs['options'])
        super().__init__(**kwargs)
    @property
    def options_data(self):
        """统一返回解析后的JSON数据"""
        if self.options is None:
            return []
        try:
            return json.loads(self.options)
        except (TypeError, json.JSONDecodeError):
            return []
    def to_dict(self):
        """API返回的标准格式"""
        return {
            'id': self.id,
            'question_id': self.question_id,
            'question_text': self.question_text,
            'question_type': self.question_type,
            'options': self.options_data,
            'correct_answer': self.correct_answer,
            'explanation': self.explanation,
            'created_at': self.created_at.isoformat()
        }



class QuestionSubmission(db.Model):
    __tablename__ = 'question_submission'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(20), db.ForeignKey('student.student_id'), nullable=False)
    question_id = db.Column(db.String(50), nullable=False)  # 关联 question_bank.question_id
    answer_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean)
    feedback = db.Column(db.Text)
    score = db.Column(db.Float)
    submission_time = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'question_id': self.question_id,
            'answer_text': self.answer_text,
            'is_correct': self.is_correct,
            'feedback': self.feedback,
            'score': self.score,
            'submission_time': self.submission_time.strftime('%Y-%m-%d %H:%M:%S')
        }

class VideoNote(db.Model):
    __tablename__ = 'video_notes'
    id = db.Column(db.Integer, primary_key=True)
    video_source = db.Column(db.String(512), nullable=False)  # 视频URL或文件名
    content = db.Column(db.Text, nullable=False)  # 笔记内容
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # 创建时间

    def to_dict(self):
        return {
            'id': self.id,
            'video_source': self.video_source,
            'content': self.content,
            'timestamp': self.timestamp.isoformat()
        }


class Conversation(db.Model):
    __tablename__ = 'conversations'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(64), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 已经通过 backref 在 ConversationMessage 中定义了 messages 关系
    # 不需要再单独定义 messages 关系了


class ConversationMessage(db.Model):
    __tablename__ = 'conversation_messages'
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'system', 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # 只需要保留这一种关系定义方式
    conversation = db.relationship('Conversation', backref=db.backref('messages', lazy='dynamic'))

    def to_dict(self):
        return {
            'role': self.role,
            'content': self.content,
            'created_at': self.created_at.isoformat()
        }


class LoginAttempt(db.Model):
    """登录尝试记录表 - 用于追踪登录失败和账户锁定"""
    __tablename__ = 'login_attempts'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, index=True)  # 添加索引优化查询
    ip_address = db.Column(db.String(45), nullable=False)  # 支持IPv6
    user_agent = db.Column(db.String(500))  # 浏览器信息
    success = db.Column(db.Boolean, nullable=False, default=False)  # 登录是否成功
    failure_reason = db.Column(db.String(200))  # 失败原因
    attempted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)  # 添加索引
    locked_until = db.Column(db.DateTime)  # 账户锁定到期时间

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'success': self.success,
            'failure_reason': self.failure_reason,
            'attempted_at': self.attempted_at.isoformat() if self.attempted_at else None,
            'locked_until': self.locked_until.isoformat() if self.locked_until else None
        }

