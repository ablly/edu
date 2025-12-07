# 数据库迁移目录

本目录用于存放数据库迁移脚本，帮助管理数据库架构的版本控制。

## 📁 目录结构

```
migrations/
├── README.md           # 本说明文档
└── versions/          # 迁移脚本版本目录
    ├── 001_initial.sql
    ├── 002_add_login_attempts.sql
    └── ...
```

## 🚀 使用方法

### 创建新迁移

```bash
# 手动创建迁移文件
touch migrations/versions/$(date +%Y%m%d_%H%M%S)_description.sql
```

### 应用迁移

目前项目使用 Flask-Migrate 或直接通过 SQLAlchemy 的 `db.create_all()` 来管理数据库架构。

对于生产环境，建议：

1. **手动迁移**（推荐）
   ```bash
   # 备份数据库
   python scripts/backup_database.sh
   
   # 执行迁移SQL
   sqlite3 data/edupilot.db < migrations/versions/xxx_migration.sql
   ```

2. **使用Flask-Migrate**
   ```bash
   # 初始化迁移
   flask db init
   
   # 生成迁移
   flask db migrate -m "description"
   
   # 应用迁移
   flask db upgrade
   ```

## 📝 迁移脚本示例

### 添加新表

```sql
-- migrations/versions/20251005_add_login_attempts.sql
CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(80) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500),
    success BOOLEAN NOT NULL DEFAULT 0,
    failure_reason VARCHAR(200),
    attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_until DATETIME
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);
```

### 修改表结构

```sql
-- migrations/versions/20251005_add_column.sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
```

## ⚠️ 注意事项

1. **备份优先**：执行任何迁移前务必备份数据库
2. **测试验证**：在测试环境验证迁移脚本
3. **版本控制**：所有迁移脚本纳入Git版本控制
4. **向前兼容**：尽量保持向前兼容，避免删除数据
5. **命名规范**：使用时间戳+描述的命名方式

## 🔄 回滚策略

对于重要的迁移，建议同时编写回滚脚本：

```sql
-- migrations/versions/20251005_add_column_rollback.sql
ALTER TABLE users DROP COLUMN phone;
```

## 📚 参考资料

- [Flask-Migrate 文档](https://flask-migrate.readthedocs.io/)
- [SQLAlchemy 迁移指南](https://docs.sqlalchemy.org/en/14/core/metadata.html)
- [Alembic 文档](https://alembic.sqlalchemy.org/)



