# 🚀 EduPilot AI 生产环境部署指南

本文档详细说明如何将 EduPilot AI 教育协控系统部署到生产环境。

## 📋 目录

1. [系统要求](#系统要求)
2. [部署前准备](#部署前准备)
3. [部署步骤](#部署步骤)
4. [配置说明](#配置说明)
5. [监控维护](#监控维护)
6. [常见问题](#常见问题)

---

## 系统要求

### 最低配置

- **操作系统**: Linux (Ubuntu 20.04+ / CentOS 7+) 或 Windows Server 2019+
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **网络**: 公网IP和域名（可选）

### 推荐配置

- **操作系统**: Ubuntu 22.04 LTS
- **CPU**: 4核心
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **网络**: 稳定的公网带宽

### 软件依赖

- Python 3.7.8+
- Redis 6.0+
- Nginx 1.18+
- Supervisor 4.2+
- PostgreSQL 12+ 或 MySQL 8.0+（可选，推荐）

---

## 部署前准备

### 1. 安装系统依赖（Ubuntu/Debian）

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Python和开发工具
sudo apt install -y python3.7 python3-pip python3-venv python3-dev

# 安装Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 安装Nginx
sudo apt install -y nginx
sudo systemctl enable nginx

# 安装Supervisor
sudo apt install -y supervisor
sudo systemctl enable supervisor

# 安装PostgreSQL（可选）
sudo apt install -y postgresql postgresql-contrib
```

### 2. 创建部署用户

```bash
# 创建专用用户
sudo useradd -m -s /bin/bash edupilot
sudo usermod -aG sudo edupilot

# 切换到部署用户
sudo su - edupilot
```

### 3. 克隆代码

```bash
# 克隆仓库
cd /home/edupilot
git clone https://github.com/your-repo/edupilot-ai.git
cd edupilot-ai
```

---

## 部署步骤

### 步骤1: 配置Python虚拟环境

```bash
# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 升级pip
pip install --upgrade pip

# 安装依赖
pip install -r requirements.txt
```

### 步骤2: 配置环境变量

```bash
# 复制环境变量模板
cp env.example .env

# 编辑环境变量
nano .env
```

**必须修改的配置**:
```bash
FLASK_ENV=production
SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
DATABASE_URL=postgresql://user:password@localhost:5432/edupilot
REDIS_URL=redis://localhost:6379/0
DEEPSEEK_API_KEY=your-actual-api-key
```

### 步骤3: 初始化数据库

```bash
# PostgreSQL数据库
sudo -u postgres psql
CREATE DATABASE edupilot;
CREATE USER edupilot_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE edupilot TO edupilot_user;
\q

# 初始化数据库表
python init_db.py
python init_membership.py
```

### 步骤4: 创建必要目录

```bash
# 创建日志和上传目录
mkdir -p logs uploads data

# 设置权限
chmod 755 logs uploads data
```

### 步骤5: 配置Gunicorn

```bash
# 测试Gunicorn
gunicorn -c deploy/gunicorn/gunicorn_config.py app:app

# 如果成功，按Ctrl+C停止
```

### 步骤6: 配置Supervisor

```bash
# 复制配置文件
sudo cp deploy/supervisor/edupilot.conf /etc/supervisor/conf.d/

# 修改配置文件中的路径
sudo nano /etc/supervisor/conf.d/edupilot.conf

# 重新加载Supervisor
sudo supervisorctl reread
sudo supervisorctl update

# 启动应用
sudo supervisorctl start edupilot

# 检查状态
sudo supervisorctl status edupilot
```

### 步骤7: 配置Nginx

```bash
# 复制配置文件
sudo cp deploy/nginx/edupilot.conf /etc/nginx/sites-available/

# 修改配置文件
sudo nano /etc/nginx/sites-available/edupilot.conf

# 创建软链接
sudo ln -s /etc/nginx/sites-available/edupilot.conf /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 步骤8: 配置SSL证书（推荐）

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 配置说明

### Gunicorn 配置

编辑 `deploy/gunicorn/gunicorn_config.py`:

```python
# Worker进程数 = (CPU核心数 * 2) + 1
workers = 5

# 绑定地址
bind = "127.0.0.1:5000"

# Worker类型（gevent用于异步）
worker_class = "gevent"

# 超时设置
timeout = 30
```

### Nginx 配置要点

```nginx
# 上传文件大小限制
client_max_body_size 16M;

# 代理超时
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# 静态文件缓存
location /static {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 数据库配置

**PostgreSQL**:
```bash
# 优化配置
sudo nano /etc/postgresql/14/main/postgresql.conf

# 关键参数
shared_buffers = 256MB
effective_cache_size = 1GB
max_connections = 100
```

**Redis**:
```bash
# 配置持久化
sudo nano /etc/redis/redis.conf

# 启用AOF
appendonly yes
appendfsync everysec
```

---

## 监控维护

### 日志管理

```bash
# 查看应用日志
tail -f logs/app.log

# 查看Gunicorn日志
tail -f logs/gunicorn_error.log

# 查看Nginx日志
sudo tail -f /var/log/nginx/error.log

# 查看Supervisor日志
sudo tail -f logs/supervisor.log
```

### 健康检查

```bash
# 运行健康检查脚本
python scripts/health_check.py

# 设置定时任务
crontab -e
# 添加：每小时检查一次
0 * * * * /home/edupilot/edupilot-ai/venv/bin/python /home/edupilot/edupilot-ai/scripts/health_check.py
```

### 数据库备份

```bash
# 手动备份
bash scripts/backup_database.sh

# 设置自动备份（每天凌晨2点）
crontab -e
# 添加：
0 2 * * * /home/edupilot/edupilot-ai/scripts/backup_database.sh
```

### 应用更新

```bash
# 拉取最新代码
cd /home/edupilot/edupilot-ai
git pull origin main

# 更新依赖
source venv/bin/activate
pip install -r requirements.txt

# 应用数据库迁移（如有）
python -c "from app import app, db; app.app_context().push(); db.create_all()"

# 重启应用
sudo supervisorctl restart edupilot

# 重新加载Nginx
sudo systemctl reload nginx
```

---

## 常见问题

### Q1: 应用无法启动

**检查步骤**:
```bash
# 检查Supervisor状态
sudo supervisorctl status edupilot

# 查看错误日志
tail -100 logs/supervisor.log

# 常见原因：
# 1. 环境变量未设置
# 2. 数据库连接失败
# 3. Redis未运行
# 4. 端口被占用
```

### Q2: 502 Bad Gateway错误

```bash
# 检查Gunicorn是否运行
ps aux | grep gunicorn

# 检查端口占用
netstat -tlnp | grep 5000

# 重启应用
sudo supervisorctl restart edupilot
```

### Q3: 数据库连接失败

```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 测试连接
psql -h localhost -U edupilot_user -d edupilot

# 检查防火墙
sudo ufw status
```

### Q4: Redis连接失败

```bash
# 检查Redis状态
sudo systemctl status redis-server

# 测试连接
redis-cli ping

# 应该返回 PONG
```

### Q5: 静态文件404错误

```bash
# 检查Nginx配置
sudo nginx -t

# 检查静态文件路径
ls -la /home/edupilot/edupilot-ai/static/

# 检查Nginx用户权限
sudo chown -R www-data:www-data /home/edupilot/edupilot-ai/static/
```

### Q6: 上传文件失败

```bash
# 检查上传目录权限
ls -la uploads/

# 修改权限
chmod 755 uploads/
sudo chown -R edupilot:www-data uploads/
```

---

## 📊 性能优化建议

1. **数据库索引**: 为频繁查询的字段添加索引
2. **Redis缓存**: 缓存API响应和会话数据
3. **CDN加速**: 使用CDN分发静态资源
4. **Gzip压缩**: 启用Nginx的Gzip压缩
5. **连接池**: 配置数据库连接池
6. **负载均衡**: 多实例部署+Nginx负载均衡

---

## 🔐 安全加固

1. **防火墙**: 只开放必要端口（80, 443）
2. **SSL证书**: 强制HTTPS访问
3. **定期更新**: 及时更新系统和依赖包
4. **备份策略**: 每日自动备份数据库
5. **日志审计**: 定期审查访问日志和错误日志
6. **密钥管理**: 使用环境变量管理敏感信息

---

## 📞 获取帮助

- **文档**: 查看项目README.md
- **问题**: 提交GitHub Issue
- **紧急**: 查看logs/error.log获取详细错误信息

---

**部署完成后，访问 https://yourdomain.com 验证系统运行正常！** 🎉



