# EduPilot - AI驱动的教育协控系统

<div align="center">

![EduPilot Logo](static/images/logo.png)

**一个现代化的、功能完善的K12教育管理系统**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.7+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/flask-2.3+-green.svg)](https://flask.palletsprojects.com/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-blue.svg)](https://www.postgresql.org/)

</div>

---

## 📖 项目简介

EduPilot 是一个集成了AI技术的教育管理系统，专为K12教育场景设计。系统提供学生管理、作业管理、AI辅助教学、智能出题、视频总结、辅助编程等多种功能，帮助教师提高教学效率，提升学生学习体验。

### ✨ 核心特性

#### 🎓 教学管理
- **学生管理**：完整的学生信息管理、班级管理
- **作业管理**：作业发布、提交、批改、成绩统计
- **进度跟踪**：可视化学习进度图表

#### 🤖 AI能力
- **智能答疑**：支持多轮对话，上下文理解
- **智能出题**：根据知识点自动生成试题
- **智能讲义**：AI生成教学讲义和课件
- **视频总结**：自动提取视频关键信息
- **辅助编程**：代码解释、调试、优化建议

#### 💎 会员系统
- **多层级会员**：免费版、周卡、月卡、年卡
- **早鸟优惠**：限时限量优惠活动
- **功能限额**：精细化的功能使用控制
- **支付集成**：支持支付宝实时支付

#### 🔒 安全保障
- **CSRF保护**：防止跨站请求伪造
- **限流控制**：API频率限制
- **密码强度**：强密码策略
- **账户锁定**：防暴力破解
- **XSS防护**：输入清理和内容安全

---

## 🚀 快速开始

### 环境要求

- **Python**: 3.7+
- **数据库**: PostgreSQL 12+ (推荐) 或 SQLite (开发环境)
- **操作系统**: Windows / Linux / macOS

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/your-username/edupilot.git
cd edupilot
```

#### 2. 创建虚拟环境

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

#### 3. 安装依赖

```bash
pip install -r requirements.txt
```

#### 4. 配置环境变量

复制环境配置示例文件：

```bash
cp env.example .env
```

编辑 `.env` 文件，填入必要的配置：

```env
# 数据库连接
DATABASE_URL=postgresql://edupilot_user:password@localhost:5432/edupilot_db

# 密钥（请使用随机字符串）
SECRET_KEY=your_secret_key_here

# AI服务密钥
DASHSCOPE_API_KEY=your_api_key
KIMI_API_KEY=your_api_key
XUNFEI_APP_ID=your_app_id

# 支付宝配置
ALIPAY_APP_ID=your_alipay_app_id
```

#### 5. 初始化数据库

```bash
# 如果使用PostgreSQL，先创建数据库
# psql -U postgres
# CREATE DATABASE edupilot_db;
# CREATE USER edupilot_user WITH PASSWORD 'password';
# GRANT ALL PRIVILEGES ON DATABASE edupilot_db TO edupilot_user;

# 初始化会员套餐
python init_pricing.py
```

#### 6. 运行应用

```bash
# 开发环境
python app.py

# 生产环境（使用Gunicorn）
gunicorn -c deploy/gunicorn/gunicorn_config.py app:app
```

访问 http://localhost:5000

---

## 📁 项目结构

```
EduPilot/
├── app.py                          # 主应用文件
├── config.py                       # 配置文件
├── models.py                       # 数据模型
├── models_membership.py            # 会员系统模型
├── membership_utils.py             # 会员工具函数
├── routes_payment.py               # 支付路由
├── init_pricing.py                 # 初始化价格数据
│
├── templates/                      # HTML模板
│   ├── errors/                     # 错误页面
│   ├── index.html                  # 首页
│   ├── students.html               # 学生管理
│   ├── membership.html             # 会员中心
│   ├── payment.html                # 支付页面
│   └── ...
│
├── static/                         # 静态资源
│   ├── css/                        # 样式文件
│   ├── js/                         # JavaScript文件
│   └── images/                     # 图片资源
│
├── utils/                          # 工具模块
│   ├── security.py                 # 安全工具
│   └── payment_alipay.py           # 支付宝客户端
│
├── scripts/                        # 管理脚本
│   ├── migrate_to_postgresql.py   # 数据库迁移
│   ├── verify_postgresql_migration.py  # 迁移验证
│   └── backup_postgresql.py        # 数据库备份
│
├── deploy/                         # 部署配置
│   ├── nginx/                      # Nginx配置
│   ├── gunicorn/                   # Gunicorn配置
│   └── supervisor/                 # Supervisor配置
│
├── logs/                           # 日志目录
├── data/                           # 数据目录
└── docs/                           # 文档目录
```

---

## 🎯 功能模块

### 1. 用户系统
- 用户注册/登录
- 密码修改
- 会员信息查看

### 2. 学生管理
- 学生列表查看
- 添加/编辑/删除学生
- 批量导入学生

### 3. 作业系统
- 作业发布与管理
- 学生作业提交
- 成绩统计与分析

### 4. AI功能
- **智能答疑**：多轮对话，支持课程、题型选择
- **智能出题**：根据知识点生成题目
- **智能讲义**：生成教学材料
- **视频总结**：提取视频关键信息
- **辅助编程**：代码解释和优化

### 5. 会员系统
- 早鸟优惠（限量50人，3档价格）
- 标准套餐（周/月/年卡）
- 使用限额管理
- 会员到期自动降级

### 6. 支付系统
- 支付宝在线支付
- 订单管理
- 支付回调处理
- 订单查询和取消

---

## 🛠️ 技术栈

### 后端
- **Web框架**: Flask 2.3+
- **数据库**: PostgreSQL / SQLite
- **ORM**: SQLAlchemy
- **认证**: Flask-Login
- **安全**: Flask-WTF (CSRF), Flask-Limiter (限流)
- **支付**: Alipay SDK

### 前端
- **模板引擎**: Jinja2
- **样式**: Custom CSS (响应式设计)
- **脚本**: Vanilla JavaScript
- **图表**: Chart.js

### AI服务
- **通义千问**: DashScope API
- **Kimi**: Moonshot API
- **讯飞星火**: XFYUN API

### 部署
- **Web服务器**: Nginx
- **WSGI服务器**: Gunicorn
- **进程管理**: Supervisor
- **容器化**: Docker (可选)

---

## 📊 数据库设计

### 核心表
- **users**: 用户表
- **students**: 学生表
- **assignment**: 作业表
- **question_bank**: 题库表
- **question_submission**: 题目提交表

### 会员系统表
- **membership_tiers**: 会员套餐表
- **user_memberships**: 用户会员关系表
- **payment_transactions**: 支付交易表
- **usage_logs**: 使用日志表

### 辅助表
- **conversations**: 对话记录表
- **conversation_messages**: 对话消息表
- **video_notes**: 视频笔记表
- **login_attempts**: 登录尝试表

---

## 🔧 配置说明

### 环境变量

所有配置通过环境变量或 `.env` 文件管理：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://user:pass@localhost/db` |
| `SECRET_KEY` | Flask密钥 | 随机字符串 |
| `DASHSCOPE_API_KEY` | 通义千问API密钥 | `sk-xxx` |
| `ALIPAY_APP_ID` | 支付宝应用ID | `2021xxx` |
| `FLASK_ENV` | 运行环境 | `development` / `production` |

完整配置项请参考 `env.example`

### 会员配置

会员功能使用限额可在环境变量中配置：

```env
FREE_USER_DAILY_LIMIT_ANSWER=5
FREE_USER_DAILY_LIMIT_GENERATE_QUESTION=3
FREE_USER_DAILY_LIMIT_GENERATE_LECTURE=2
```

---

## 🚢 部署指南

详细的部署文档请参考：
- [DEPLOYMENT.md](DEPLOYMENT.md) - 完整部署指南
- [PostgreSQL迁移指南.md](PostgreSQL迁移指南.md) - 数据库迁移
- [支付接入指南.md](支付接入指南.md) - 支付宝集成

### 生产环境快速部署

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 配置环境变量
cp env.example .env
nano .env

# 3. 初始化数据库
python init_pricing.py

# 4. 使用Gunicorn启动
gunicorn -c deploy/gunicorn/gunicorn_config.py app:app

# 5. 配置Nginx反向代理
sudo cp deploy/nginx/nginx.conf /etc/nginx/sites-available/edupilot
sudo ln -s /etc/nginx/sites-available/edupilot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. 配置Supervisor进程管理
sudo cp deploy/supervisor/edupilot.conf /etc/supervisor/conf.d/
sudo supervisorctl reread
sudo supervisorctl update
```

---

## 🧪 测试

```bash
# 运行测试（TODO：添加测试套件）
python -m pytest tests/

# 代码覆盖率
pytest --cov=. --cov-report=html
```

---

## 📝 API文档

### 用户API
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `POST /api/change-password` - 修改密码

### 会员API
- `GET /api/membership/status` - 获取会员状态
- `GET /api/membership/tiers` - 获取套餐列表
- `GET /api/membership/usage` - 获取使用情况

### 支付API
- `POST /api/payment/create` - 创建订单
- `GET /api/payment/query/<order_id>` - 查询订单
- `POST /api/payment/alipay/callback` - 支付回调
- `POST /api/payment/cancel/<order_id>` - 取消订单

### AI API
- `POST /api/ai/answer-questions` - 智能答疑
- `POST /api/ai/generate-questions` - 智能出题
- `POST /api/ai/generate-lecture` - 生成讲义
- `POST /api/ai/video-summary` - 视频总结
- `POST /api/ai/code-assist` - 辅助编程

---

## 📈 性能优化

- **数据库优化**：索引优化、查询优化
- **缓存策略**：Redis缓存（可选）
- **静态资源**：CDN加速、文件版本化
- **连接池**：数据库连接池管理
- **负载均衡**：多worker并发处理

---

## 🔐 安全特性

- **CSRF保护**：所有表单都有CSRF令牌
- **XSS防护**：输入过滤和输出转义
- **SQL注入**：使用ORM参数化查询
- **密码加密**：Bcrypt加密存储
- **限流保护**：API频率限制
- **账户锁定**：防暴力破解
- **安全头部**：CSP、X-Frame-Options等

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

---

## 📜 开源协议

本项目采用 [MIT License](LICENSE) 协议

---

## 📧 联系方式

- **作者**: EduPilot Team
- **邮箱**: 3533912007@qq.com
- **官网**: https://edupilot.com
- **问题反馈**: [GitHub Issues](https://github.com/your-username/edupilot/issues)

---

## 🙏 致谢

感谢以下开源项目和服务：

- [Flask](https://flask.palletsprojects.com/) - Web框架
- [PostgreSQL](https://www.postgresql.org/) - 数据库
- [阿里云通义千问](https://dashscope.aliyun.com/) - AI服务
- [Kimi](https://platform.moonshot.cn/) - AI服务
- [讯飞星火](https://www.xfyun.cn/) - AI服务

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个星标！**

Made with ❤️ by EduPilot Team

</div>




#   e d u  
 