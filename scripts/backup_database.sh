#!/bin/bash
# ==============================================================================
# EduPilot AI 数据库备份脚本
# ==============================================================================
# 功能：备份SQLite/PostgreSQL/MySQL数据库，压缩并保留最近30天的备份
# 使用：bash scripts/backup_database.sh
# 定时任务：0 2 * * * /home/edupilot/edupilot-ai/scripts/backup_database.sh
# ==============================================================================

# 配置变量
PROJECT_DIR="/home/edupilot/edupilot-ai"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

# 颜色输出
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"
}

# 创建备份目录
mkdir -p "$BACKUP_DIR"

log "开始数据库备份..."

# 读取环境变量
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
fi

# 检测数据库类型并备份
if [[ "$DATABASE_URL" == sqlite* ]]; then
    # SQLite 备份
    log "检测到 SQLite 数据库"
    
    # 提取数据库文件路径
    DB_FILE=$(echo "$DATABASE_URL" | sed 's/sqlite:\/\/\///')
    
    if [ ! -f "$DB_FILE" ]; then
        error "数据库文件不存在: $DB_FILE"
        exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/edupilot_sqlite_$DATE.db"
    
    # 复制数据库文件
    cp "$DB_FILE" "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log "SQLite 数据库备份成功: $BACKUP_FILE"
        
        # 压缩备份
        gzip "$BACKUP_FILE"
        log "备份已压缩: ${BACKUP_FILE}.gz"
    else
        error "SQLite 数据库备份失败"
        exit 1
    fi

elif [[ "$DATABASE_URL" == postgresql* ]]; then
    # PostgreSQL 备份
    log "检测到 PostgreSQL 数据库"
    
    # 提取连接信息
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    BACKUP_FILE="$BACKUP_DIR/edupilot_postgresql_$DATE.sql"
    
    # 使用pg_dump备份
    PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log "PostgreSQL 数据库备份成功: $BACKUP_FILE"
        
        # 压缩备份
        gzip "$BACKUP_FILE"
        log "备份已压缩: ${BACKUP_FILE}.gz"
    else
        error "PostgreSQL 数据库备份失败"
        exit 1
    fi

elif [[ "$DATABASE_URL" == mysql* ]]; then
    # MySQL 备份
    log "检测到 MySQL 数据库"
    
    # 提取连接信息
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    BACKUP_FILE="$BACKUP_DIR/edupilot_mysql_$DATE.sql"
    
    # 使用mysqldump备份
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log "MySQL 数据库备份成功: $BACKUP_FILE"
        
        # 压缩备份
        gzip "$BACKUP_FILE"
        log "备份已压缩: ${BACKUP_FILE}.gz"
    else
        error "MySQL 数据库备份失败"
        exit 1
    fi

else
    error "未知的数据库类型或未设置 DATABASE_URL"
    exit 1
fi

# 删除超过30天的旧备份
log "清理旧备份文件（保留最近 $KEEP_DAYS 天）..."
find "$BACKUP_DIR" -name "edupilot_*.gz" -type f -mtime +$KEEP_DAYS -delete

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/edupilot_*.gz 2>/dev/null | wc -l)
log "当前备份文件数量: $BACKUP_COUNT"

# 显示备份文件大小
BACKUP_SIZE=$(du -h "$BACKUP_DIR" | tail -1 | cut -f1)
log "备份目录总大小: $BACKUP_SIZE"

log "数据库备份完成！ ✅"

# 可选：发送通知邮件
# echo "数据库备份完成" | mail -s "EduPilot 备份通知" admin@example.com

exit 0




