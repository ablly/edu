# PostgreSQL数据迁移方案

## 📊 SQLite数据库现状

### 数据统计

| 表名 | 记录数 | 说明 |
|------|--------|------|
| **admins** | 1 | 管理员（周启航）|
| **users** | 7 | 前端用户 |
| **payment_transactions** | 39 | 支付订单 |
| **user_memberships** | 32 | 用户会员记录 |
| **conversations** | 26 | AI对话 |
| **conversation_messages** | 94 | 对话消息 |
| **assignment** | 17 | 作业 |
| **question_bank** | 23 | 题库 |
| **usage_logs** | 22 | 使用日志 |
| **login_attempts** | 10 | 登录尝试 |
| **membership_tiers** | 7 | 会员套餐 |
| **question_submission** | 7 | 题目提交 |
| **student** | 4 | 学生信息 |
| **alembic_version** | 1 | 数据库版本 |

**总计：约290条核心业务数据**

### 关键数据

- ✅ 1个超级管理员：周启航
- ✅ 7个用户账户
- ✅ 39个支付订单（重要财务数据）
- ✅ 32个会员记录
- ✅ 26个AI对话及94条消息

---

## 🎯 迁移目标

**将所有SQLite数据迁移到PostgreSQL，并切换系统使用PostgreSQL**

---

## 📋 迁移步骤

### 步骤1：配置PostgreSQL连接

1. **检查PostgreSQL服务是否运行**
2. **创建数据库**
3. **配置环境变量**

### 步骤2：导出SQLite数据

使用Python脚本导出所有数据到SQL文件

### 步骤3：导入到PostgreSQL

执行SQL导入脚本

### 步骤4：验证数据完整性

对比两个数据库的数据

### 步骤5：切换系统配置

修改环境变量，使系统使用PostgreSQL

### 步骤6：测试系统功能

确保所有功能正常

---

## ⚙️ 详细操作

### 1. PostgreSQL配置

#### 检查PostgreSQL是否安装并运行

```powershell
# 检查PostgreSQL服务状态
Get-Service -Name postgresql*

# 或者检查端口
Test-NetConnection -ComputerName localhost -Port 5432
```

#### 创建数据库和用户

```sql
-- 连接到PostgreSQL
psql -U postgres

-- 创建数据库
CREATE DATABASE edupilot;

-- 创建用户
CREATE USER edupilot_user WITH PASSWORD 'your_password_here';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE edupilot TO edupilot_user;
```

#### 配置环境变量

创建 `.env` 文件：

```bash
# PostgreSQL配置
DATABASE_URL=postgresql://edupilot_user:your_password_here@localhost:5432/edupilot

# 或者使用默认postgres用户
# DATABASE_URL=postgresql://postgres:password@localhost:5432/edupilot
```

---

### 2. 数据迁移脚本

我将创建自动迁移脚本来完成数据迁移。

---

## ⚠️ 重要提示

### 迁移前准备

1. ✅ **备份SQLite数据库**
   ```powershell
   Copy-Item database/scores.db database/scores.db.backup
   ```

2. ✅ **确认PostgreSQL运行正常**

3. ✅ **停止Flask服务器**（避免数据写入冲突）

### 迁移后

1. ✅ **验证所有数据**
2. ✅ **测试登录功能**
3. ✅ **测试关键业务功能**
4. ✅ **保留SQLite备份**（至少保留7天）

---

## 🚀 快速迁移

如果您的PostgreSQL已经配置好，我可以立即执行自动迁移：

1. **检查PostgreSQL状态**
2. **执行迁移脚本**
3. **验证数据**
4. **切换配置**

---

## 📝 下一步

请告诉我：

1. **PostgreSQL是否已安装？**
   - 如果已安装，在哪个端口？
   - 用户名和密码是什么？

2. **是否需要我帮您配置PostgreSQL？**

3. **或者直接开始迁移？**（如果已配置好）

回答后我将立即开始迁移工作！



