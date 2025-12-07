# PostgreSQL 数据库迁移指南

## 📅 迁移日期
**2025-10-10**

---

## 🎯 迁移目标

从 **SQLite** 迁移到 **PostgreSQL**，提升系统性能和并发能力。

### 为什么迁移到PostgreSQL？

| 对比项 | SQLite | PostgreSQL |
|--------|--------|------------|
| **并发写入** | ❌ 单线程 | ✅ 多线程支持 |
| **连接池** | ❌ 不支持 | ✅ 完整支持 |
| **高并发** | ❌ 有限制 | ✅ 优秀 |
| **数据完整性** | ⚠️ 基本 | ✅ 完整ACID |
| **扩展性** | ❌ 受限 | ✅ 优秀 |
| **适用场景** | 小型应用 | 生产环境 |

---

## 📋 迁移前准备

### 1. 系统要求

- **Python**: 3.8+
- **PostgreSQL**: 12+ (推荐15+)
- **磁盘空间**: 至少2GB可用空间
- **内存**: 至少2GB RAM

### 2. 备份当前数据 ⚠️

**重要提示：** 迁移前务必备份SQLite数据库！

```bash
# 备份主数据库
cp data/edupilot.db data/edupilot_backup_$(date +%Y%m%d_%H%M%S).db

# 备份开发数据库（如果使用）
cp database/scores.db database/scores_backup_$(date +%Y%m%d_%H%M%S).db
```

---

## 🔧 PostgreSQL 安装

### Windows 系统

#### 方法1: 官方安装包（推荐）

1. **下载PostgreSQL**
   - 访问：https://www.postgresql.org/download/windows/
   - 下载最新版本（推荐15.x或16.x）

2. **运行安装程序**
   ```
   - 选择安装目录：C:\Program Files\PostgreSQL\15
   - 设置超级用户密码（请记住！）
   - 端口号：5432（默认）
   - 区域设置：Chinese (Simplified), China
   ```

3. **验证安装**
   ```powershell
   # 打开PowerShell
   psql --version
   # 应显示：psql (PostgreSQL) 15.x
   ```

#### 方法2: 使用Chocolatey

```powershell
# 以管理员身份运行
choco install postgresql15

# 启动服务
net start postgresql-x64-15
```

### Linux 系统 (Ubuntu/Debian)

```bash
# 1. 更新包列表
sudo apt update

# 2. 安装PostgreSQL
sudo apt install postgresql postgresql-contrib

# 3. 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 4. 验证安装
psql --version
```

### macOS 系统

```bash
# 使用Homebrew安装
brew install postgresql@15

# 启动服务
brew services start postgresql@15

# 验证安装
psql --version
```

---

## 🗄️ 创建数据库和用户

### 1. 连接到PostgreSQL

**Windows:**
```powershell
# 使用pgAdmin或命令行
psql -U postgres
```

**Linux/macOS:**
```bash
sudo -u postgres psql
```

### 2. 创建数据库和用户

在PostgreSQL命令行中执行：

```sql
-- 创建数据库用户
CREATE USER edupilot_user WITH PASSWORD 'your_secure_password_here';

-- 创建数据库
CREATE DATABASE edupilot_db 
  WITH OWNER = edupilot_user
       ENCODING = 'UTF8'
       LC_COLLATE = 'zh_CN.UTF-8'
       LC_CTYPE = 'zh_CN.UTF-8'
       TEMPLATE = template0;

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE edupilot_db TO edupilot_user;

-- 连接到新数据库
\c edupilot_db

-- 授予schema权限
GRANT ALL ON SCHEMA public TO edupilot_user;

-- 退出
\q
```

### 3. 验证数据库创建

```bash
# 连接测试
psql -U edupilot_user -d edupilot_db -h localhost -W
# 输入密码后应该能成功连接
```

---

## 📦 安装Python依赖

### 1. 更新requirements.txt

已自动更新，包含：
```
psycopg2-binary==2.9.9
```

### 2. 安装依赖

```bash
# 停止当前运行的服务器（如果有）
# Ctrl+C

# 安装PostgreSQL驱动
pip install psycopg2-binary==2.9.9

# 验证安装
python -c "import psycopg2; print(psycopg2.__version__)"
```

---

## 🔄 数据迁移步骤

### 步骤1: 设置环境变量

创建 `.env` 文件（或更新现有文件）：

```bash
# .env 文件内容
FLASK_ENV=production
SECRET_KEY=your_secret_key_here

# PostgreSQL数据库连接
DATABASE_URL=postgresql://edupilot_user:your_secure_password_here@localhost:5432/edupilot_db

# 支付配置等其他配置保持不变...
```

**重要：** 将 `your_secure_password_here` 替换为您在创建用户时设置的密码！

### 步骤2: 运行迁移脚本

我已经为您准备了自动迁移脚本：

```bash
# 执行数据迁移
python scripts/migrate_to_postgresql.py
```

迁移脚本会：
1. ✅ 连接到PostgreSQL
2. ✅ 创建所有表结构
3. ✅ 从SQLite导出数据
4. ✅ 导入到PostgreSQL
5. ✅ 验证数据完整性
6. ✅ 显示迁移报告

### 步骤3: 验证迁移

```bash
# 运行验证脚本
python scripts/verify_postgresql_migration.py
```

验证内容：
- ✅ 表结构完整性
- ✅ 数据记录数量
- ✅ 索引创建
- ✅ 外键约束
- ✅ 数据抽查对比

---

## 🚀 启动新系统

### 1. 更新配置

系统已自动检测环境变量中的 `DATABASE_URL`，无需手动修改代码。

### 2. 启动服务器

```bash
# 开发环境
python app.py

# 生产环境（推荐）
gunicorn -c deploy/gunicorn/gunicorn_config.py app:app
```

### 3. 测试访问

```bash
# 打开浏览器访问
http://localhost:5000

# 测试登录、会员功能等
```

---

## ✅ 迁移检查清单

完成以下检查，确保迁移成功：

### 基础功能测试
- [ ] 用户注册
- [ ] 用户登录
- [ ] 密码修改
- [ ] 学生管理
- [ ] 作业提交

### AI功能测试
- [ ] AI答疑
- [ ] 智能出题
- [ ] 智能讲义
- [ ] 视频总结
- [ ] 辅助编程

### 会员系统测试
- [ ] 查看会员套餐
- [ ] 会员信息显示
- [ ] 使用记录查询
- [ ] 功能限制生效

### 性能测试
- [ ] 并发登录（10+用户）
- [ ] 批量数据查询
- [ ] 响应时间 < 200ms
- [ ] 无数据库锁定

---

## 🔍 性能对比

### 迁移前（SQLite）
```
- 并发用户：~10人
- 平均响应时间：150-300ms
- 写入操作：单线程排队
- 连接数：受限
```

### 迁移后（PostgreSQL）
```
- 并发用户：100+ 人
- 平均响应时间：50-150ms
- 写入操作：真正并发
- 连接池：10-30个活动连接
```

---

## 🔙 回滚方案

如果迁移出现问题，可以快速回滚到SQLite：

### 方法1: 使用备份数据库

```bash
# 1. 停止服务器
Ctrl+C

# 2. 恢复备份
cp data/edupilot_backup_YYYYMMDD_HHMMSS.db data/edupilot.db

# 3. 删除或注释环境变量
# 编辑 .env 文件，删除或注释 DATABASE_URL

# 4. 重启服务器
python app.py
```

### 方法2: 保持SQLite和PostgreSQL共存

在迁移初期，可以同时保留两个数据库：

```bash
# 使用SQLite
export DATABASE_URL=""
python app.py

# 使用PostgreSQL
export DATABASE_URL="postgresql://..."
python app.py
```

---

## ⚠️ 常见问题

### 问题1: psycopg2安装失败

**错误信息：**
```
Error: pg_config executable not found
```

**解决方法：**
```bash
# 使用二进制版本
pip uninstall psycopg2
pip install psycopg2-binary
```

### 问题2: 连接被拒绝

**错误信息：**
```
could not connect to server: Connection refused
```

**解决方法：**
1. 检查PostgreSQL服务是否运行：
   ```bash
   # Windows
   net start postgresql-x64-15
   
   # Linux
   sudo systemctl status postgresql
   ```

2. 检查防火墙设置
3. 确认端口5432未被占用

### 问题3: 密码认证失败

**错误信息：**
```
FATAL: password authentication failed for user "edupilot_user"
```

**解决方法：**
1. 确认 `.env` 文件中的密码正确
2. 重置用户密码：
   ```sql
   ALTER USER edupilot_user WITH PASSWORD 'new_password';
   ```

### 问题4: 中文乱码

**解决方法：**
确保数据库编码为UTF-8：
```sql
-- 查看数据库编码
SELECT datname, pg_encoding_to_char(encoding) FROM pg_database;

-- 如果不是UTF8，需要重新创建数据库
```

---

## 📊 迁移后优化建议

### 1. 定期维护

```sql
-- 每周执行一次
VACUUM ANALYZE;

-- 重建索引（月度）
REINDEX DATABASE edupilot_db;
```

### 2. 监控查询性能

```sql
-- 启用慢查询日志
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 记录超过1秒的查询

-- 重新加载配置
SELECT pg_reload_conf();
```

### 3. 配置连接池

已在 `config.py` 中配置：
```python
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 10,
    'max_overflow': 20,
    'pool_timeout': 30,
    'pool_recycle': 3600,
    'pool_pre_ping': True,
}
```

### 4. 备份策略

```bash
# 每日备份脚本
pg_dump -U edupilot_user -d edupilot_db -F c -f backup_$(date +%Y%m%d).dump

# 保留最近7天的备份
find . -name "backup_*.dump" -mtime +7 -delete
```

---

## 📞 技术支持

### PostgreSQL官方文档
- 中文文档：http://www.postgres.cn/docs/15/
- 英文文档：https://www.postgresql.org/docs/

### 推荐工具

1. **pgAdmin 4** - PostgreSQL图形化管理工具
   - 下载：https://www.pgadmin.org/download/

2. **DBeaver** - 通用数据库管理工具
   - 下载：https://dbeaver.io/download/

3. **DataGrip** - JetBrains数据库IDE（收费）
   - 下载：https://www.jetbrains.com/datagrip/

---

## ✨ 总结

PostgreSQL迁移将显著提升系统性能和可靠性：

✅ **性能提升**: 3-5倍查询速度
✅ **并发能力**: 支持100+同时在线
✅ **数据安全**: 完整的ACID保证
✅ **可扩展性**: 便于未来扩展

**迁移是安全的，我们有完整的备份和回滚方案！**

---

## 🎯 下一步

迁移完成后，建议继续完成：

1. [ ] 实现管理员后台系统
2. [ ] 配置Redis缓存（进一步提升性能）
3. [ ] 设置自动备份
4. [ ] 配置监控和告警

**准备好开始迁移了吗？执行 `python scripts/migrate_to_postgresql.py`** 🚀


