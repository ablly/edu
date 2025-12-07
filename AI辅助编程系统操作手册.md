# AI辅助编程系统 - 详细操作手册

## 📋 目录
1. [系统概述](#系统概述)
2. [环境要求](#环境要求)
3. [安装配置](#安装配置)
4. [API配置](#api配置)
5. [启动系统](#启动系统)
6. [功能使用指南](#功能使用指南)
7. [故障排除](#故障排除)
8. [维护管理](#维护管理)

---

## 🎯 系统概述

AI辅助编程系统是一个基于Flask的Web应用，集成了多种AI服务，为学生和教师提供智能编程辅助功能。

### 主要功能模块
- **作业批改系统** - 自动批改编程作业
- **AI答疑** - 智能问答服务
- **辅助编程** - 编程助手、代码审查、代码解释、调试帮助
- **智能出题** - 自动生成编程题目
- **视频总结** - 教学视频内容总结
- **成绩分析** - 学习进度可视化

---

## 💻 环境要求

### 系统要求
- **操作系统**: Windows 10/11, macOS, Linux
- **Python版本**: Python 3.7 或更高版本
- **内存**: 至少 4GB RAM
- **存储空间**: 至少 2GB 可用空间
- **网络**: 稳定的互联网连接（用于AI API调用）

### 浏览器支持
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

## 🔧 安装配置

### 第一步：环境准备

1. **安装Python**
   ```bash
   # 检查Python版本
   python --version
   # 或
   python3 --version
   ```

2. **创建虚拟环境（推荐）**
   ```bash
   # 创建虚拟环境
   python -m venv venv
   
   # 激活虚拟环境
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

### 第二步：安装依赖包

```bash
# 安装核心依赖
pip install Flask==2.2.3
pip install Flask-SQLAlchemy==2.5.1
pip install SQLAlchemy==1.4.53
pip install Flask-Migrate
pip install Werkzeug==2.2.3
pip install requests==2.28.2
pip install python-dotenv==1.0.0

# 安装AI相关依赖
pip install openai==1.39.0

# 安装文档处理依赖
pip install PyPDF2==3.0.1
pip install python-docx==1.1.0
pip install python-pptx==0.6.23

# 或者一次性安装所有依赖
pip install -r requirements.txt
```

### 第三步：项目结构设置

确保项目目录结构如下：
```
AI辅助编程系统/
├── app.py                 # 主应用文件
├── config.py              # 配置文件
├── models.py              # 数据模型
├── xfyun_client.py        # 讯飞星火API客户端
├── requirements.txt       # 依赖列表
├── start_server.py        # 启动脚本
├── database/              # 数据库目录
│   └── scores.db         # SQLite数据库文件
├── uploads/               # 文件上传目录
├── static/                # 静态文件
│   ├── css/
│   ├── js/
│   └── img/
└── templates/             # HTML模板
    ├── index.html
    ├── Auxiliary_programming.html
    └── ...
```

---

## 🔑 API配置

### DeepSeek API配置（主要AI服务）

1. **获取API密钥**
   - 访问 [DeepSeek官网](https://platform.deepseek.com/)
   - 注册账号并获取API Key

2. **配置API信息**
   
   编辑 `config.py` 文件：
   ```python
   # DeepSeek API设置
   DEEPSEEK_API_KEY = 'sk-your-api-key-here'  # 替换为你的API密钥
   DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
   DEEPSEEK_MODEL = 'deepseek-chat'
   ```

### 讯飞星火API配置（备用AI服务）

1. **获取API信息**
   - 访问 [讯飞开放平台](https://www.xfyun.cn/)
   - 创建应用并获取相关信息

2. **配置API信息**
   
   编辑 `config.py` 文件：
   ```python
   # 讯飞星火API配置
   XFYUN_API_BASE_URL = "https://xingchen-api.xf-yun.com/workflow/v1/chat/completions"
   XFYUN_API_KEY = "your-api-key"
   XFYUN_API_SECRET = "your-api-secret"
   XFYUN_AI_CHAT_FLOW_ID = "your-flow-id"
   ```

### 数据库配置

系统默认使用SQLite数据库，无需额外配置。如需使用其他数据库：

```python
# PostgreSQL配置示例
SQLALCHEMY_DATABASE_URI = 'postgresql://username:password@localhost/dbname'

# MySQL配置示例
SQLALCHEMY_DATABASE_URI = 'mysql://username:password@localhost/dbname'
```

### 文件上传配置

```python
# 文件上传设置
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'c', 'py', 'zip', 'cpp', 'java', 'txt', 'pdf', 'docx', 'pptx'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB最大文件大小
```

---

## 🚀 启动系统

### 方法一：使用启动脚本（推荐）

```bash
python start_server.py
```

### 方法二：直接启动Flask应用

```bash
python app.py
```

### 方法三：使用Flask命令

```bash
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
```

### 启动成功标志

看到以下信息表示启动成功：
```
🚀 启动AI作业批改系统
================================================
📚 功能包括:
  - 作业批改
  - AI答疑
  - 辅助编程 (新功能)
  - 代码审查
  - 代码解释
  - 调试帮助
================================================
🌐 访问地址:
  - 主页: http://localhost:5000
  - 辅助编程: http://localhost:5000/Auxiliary-programming
  - AI答疑: http://localhost:5000/ai-ask
================================================
⚡ 正在启动服务器...
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://[your-ip]:5000
```

---

## 📖 功能使用指南

### 1. 辅助编程功能

#### 访问方式
- 浏览器打开：`http://localhost:5000/Auxiliary-programming`

#### 功能模块

**🤖 编程助手**
- **用途**: 解答编程问题，提供代码建议
- **操作步骤**:
  1. 选择编程语言（Python、Java、C++、C、JavaScript）
  2. 粘贴代码（可选）
  3. 描述遇到的问题
  4. 点击"获取帮助"
- **示例**:
  ```
  代码：
  def factorial(n):
      if n <= 1:
          return 1
      return n * factorial(n-1)
  
  问题：这个递归函数有什么可以优化的地方？
  ```

**🔍 代码审查**
- **用途**: 专业的代码质量评估
- **操作步骤**:
  1. 选择编程语言
  2. 粘贴需要审查的代码
  3. 点击"开始审查"
- **审查内容**:
  - 代码质量和规范性
  - 性能优化建议
  - 安全性问题
  - 可读性和维护性
  - 潜在的bug或错误

**📚 代码解释**
- **用途**: 详细解释代码功能和工作原理
- **操作步骤**:
  1. 选择编程语言
  2. 粘贴需要解释的代码
  3. 点击"解释代码"
- **解释内容**:
  - 代码的整体功能
  - 每个重要部分的作用
  - 使用的算法或数据结构
  - 代码的执行流程

**🐛 调试帮助**
- **用途**: 帮助定位和解决代码问题
- **操作步骤**:
  1. 选择编程语言
  2. 粘贴有问题的代码
  3. 粘贴错误信息
  4. 点击"获取调试建议"
- **提供内容**:
  - 错误原因分析
  - 具体的修复方案
  - 修正后的代码示例
  - 预防类似错误的建议

### 2. AI答疑功能

#### 访问方式
- 浏览器打开：`http://localhost:5000/ai-ask`

#### 使用方法
1. 在输入框中输入问题
2. 点击"发送"按钮
3. 等待AI回答
4. 可以继续追问相关问题

#### 功能特点
- 支持多轮对话
- 会话历史保存
- 新建对话功能
- 智能上下文理解

### 3. 作业批改功能

#### 单个作业提交
1. 访问：`http://localhost:5000/submit`
2. 填写学生信息
3. 选择科目和章节
4. 上传作业文件
5. 点击提交等待批改结果

#### 批量作业提交
1. 准备文件：文件名格式为"学号-姓名.扩展名"
2. 选择多个文件上传
3. 填写批次信息
4. 系统自动批改所有作业

### 4. 成绩查询与分析

#### 查询成绩
1. 访问：`http://localhost:5000/scores`
2. 输入学号查询
3. 查看详细成绩和反馈

#### 成绩分析
1. 访问：`http://localhost:5000/progress`
2. 查看学习进度图表
3. 分析各科目表现
4. 查看章节掌握情况

---

## 🔧 故障排除

### 常见问题及解决方案

#### 1. 启动失败

**问题**: `ModuleNotFoundError: No module named 'xxx'`
**解决方案**:
```bash
# 安装缺失的模块
pip install 模块名

# 或重新安装所有依赖
pip install -r requirements.txt
```

**问题**: 数据库连接错误
**解决方案**:
```bash
# 检查数据库目录是否存在
mkdir database

# 重新初始化数据库
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

#### 2. API调用失败

**问题**: DeepSeek API返回401错误
**解决方案**:
1. 检查API密钥是否正确
2. 确认API配额是否充足
3. 验证网络连接

**测试API连接**:
```bash
python test_deepseek_api.py
```

#### 3. 页面无法访问

**问题**: 浏览器显示"无法访问此网站"
**解决方案**:
1. 确认服务器已启动
2. 检查端口5000是否被占用
3. 尝试使用127.0.0.1:5000而不是localhost:5000

#### 4. 文件上传失败

**问题**: 文件上传时出现错误
**解决方案**:
1. 检查文件大小是否超过16MB限制
2. 确认文件格式是否支持
3. 检查uploads目录权限

#### 5. 前端功能异常

**问题**: 按钮点击无响应
**解决方案**:
1. 打开浏览器开发者工具查看错误
2. 清除浏览器缓存
3. 检查JavaScript文件是否正确加载

### 日志查看

**查看应用日志**:
```bash
# 如果使用了日志文件
tail -f app.log

# 或查看控制台输出
```

**调试模式启动**:
```python
# 在app.py中设置
app.run(debug=True)
```

---

## 🛠️ 维护管理

### 数据库维护

#### 备份数据库
```bash
# SQLite数据库备份
cp database/scores.db database/scores_backup_$(date +%Y%m%d).db
```

#### 清理旧数据
```python
# 清理30天前的会话记录
from app import app, db, Conversation
from datetime import datetime, timedelta

with app.app_context():
    old_date = datetime.utcnow() - timedelta(days=30)
    old_conversations = Conversation.query.filter(
        Conversation.updated_at < old_date
    ).all()
    
    for conv in old_conversations:
        db.session.delete(conv)
    
    db.session.commit()
```

### 系统监控

#### 性能监控
- 监控API响应时间
- 检查内存使用情况
- 观察数据库查询性能

#### 日志监控
```python
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

### 安全维护

#### API密钥管理
- 定期更换API密钥
- 使用环境变量存储敏感信息
- 监控API使用量

#### 数据安全
- 定期备份数据库
- 限制文件上传类型
- 验证用户输入

### 更新升级

#### 依赖包更新
```bash
# 查看过时的包
pip list --outdated

# 更新特定包
pip install --upgrade 包名

# 更新所有包（谨慎使用）
pip freeze > requirements_old.txt
pip install --upgrade -r requirements.txt
```

#### 功能更新
1. 备份当前系统
2. 测试新功能
3. 逐步部署更新
4. 监控系统稳定性

---

## 📞 技术支持

### 联系方式
- 技术文档：查看项目README文件
- 问题反馈：提交GitHub Issue
- 紧急支持：联系系统管理员

### 常用命令速查

```bash
# 启动系统
python start_server.py

# 测试API
python test_deepseek_api.py
python test_xfyun_api.py

# 安装依赖
pip install -r requirements.txt

# 数据库操作
python -c "from app import app, db; app.app_context().push(); db.create_all()"

# 查看日志
tail -f app.log
```

### 配置文件模板

**config.py 完整配置示例**:
```python
import os

# 基础目录配置
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# 数据库设置
DATABASE_PATH = os.path.join(BASE_DIR, 'database', 'scores.db')
SQLALCHEMY_DATABASE_URI = 'sqlite:///database/scores.db'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# 文件上传设置
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'c', 'py', 'zip', 'cpp', 'java', 'txt', 'pdf', 'docx', 'pptx'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# DeepSeek API设置
DEEPSEEK_API_KEY = 'your-deepseek-api-key'
DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
DEEPSEEK_MODEL = 'deepseek-chat'

# 讯飞星火API配置
XFYUN_API_BASE_URL = "https://xingchen-api.xf-yun.com/workflow/v1/chat/completions"
XFYUN_API_KEY = "your-xfyun-api-key"
XFYUN_API_SECRET = "your-xfyun-api-secret"
XFYUN_AI_CHAT_FLOW_ID = "your-flow-id"

# 安全设置
SECRET_KEY = 'your-secret-key-here'
```

---

## 📝 更新日志

### v1.0.0 (当前版本)
- ✅ 基础作业批改功能
- ✅ AI答疑系统
- ✅ 辅助编程功能（编程助手、代码审查、代码解释、调试帮助）
- ✅ 成绩查询与分析
- ✅ 多种文件格式支持
- ✅ 响应式Web界面

### 计划功能
- 🔄 更多编程语言支持
- 🔄 代码相似度检测
- 🔄 学习路径推荐
- 🔄 移动端适配

---

**📌 重要提醒**:
1. 首次使用前请务必配置API密钥
2. 定期备份数据库文件
3. 监控API使用量避免超额
4. 保持系统和依赖包更新

**🎉 祝您使用愉快！**