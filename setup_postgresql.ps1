# PostgreSQL 快速配置脚本
# 用法: .\setup_postgresql.ps1

$pgPath = "C:\Program Files\PostgreSQL\18\bin"
$env:Path += ";$pgPath"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  PostgreSQL 数据库配置向导" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "✅ PostgreSQL 18 已找到" -ForegroundColor Green
Write-Host "📁 路径: $pgPath`n" -ForegroundColor White

# 检查版本
Write-Host "🔍 检查版本..." -ForegroundColor Cyan
& "$pgPath\psql.exe" --version
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  第一步：创建数据库用户和数据库" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "请输入您在安装 PostgreSQL 时设置的 postgres 用户密码：" -ForegroundColor Yellow
$pgPassword = Read-Host "postgres 密码" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
$pgPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host "`n📝 即将创建：" -ForegroundColor Cyan
Write-Host "  • 用户名: edupilot_user" -ForegroundColor White
Write-Host "  • 数据库: edupilot_db" -ForegroundColor White

Write-Host "`n请为 edupilot_user 设置一个密码（请记住它！）：" -ForegroundColor Yellow
$eduPassword = Read-Host "edupilot_user 密码"

Write-Host "`n正在创建数据库用户和数据库..." -ForegroundColor Cyan

# 设置环境变量
$env:PGPASSWORD = $pgPasswordPlain

# 创建 SQL 脚本
$sqlScript = @"
-- 创建用户
CREATE USER edupilot_user WITH PASSWORD '$eduPassword';

-- 创建数据库
CREATE DATABASE edupilot_db 
  WITH OWNER = edupilot_user
       ENCODING = 'UTF8'
       LC_COLLATE = 'Chinese (Simplified)_China.936'
       LC_CTYPE = 'Chinese (Simplified)_China.936'
       TEMPLATE = template0;

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE edupilot_db TO edupilot_user;

-- 连接到新数据库
\c edupilot_db

-- 授予schema权限
GRANT ALL ON SCHEMA public TO edupilot_user;

-- 显示成功消息
SELECT 'Database setup completed!' as status;
"@

# 保存到临时文件
$sqlScript | Out-File -FilePath "setup_db.sql" -Encoding UTF8

# 执行 SQL 脚本
& "$pgPath\psql.exe" -U postgres -h localhost -f setup_db.sql

# 清理
Remove-Item "setup_db.sql" -ErrorAction SilentlyContinue
Remove-Variable pgPasswordPlain

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "  ✅ 数据库配置成功！" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green
    
    Write-Host "📝 请记录以下信息：" -ForegroundColor Yellow
    Write-Host "  数据库: edupilot_db" -ForegroundColor White
    Write-Host "  用户名: edupilot_user" -ForegroundColor White
    Write-Host "  密码: $eduPassword" -ForegroundColor White
    Write-Host "  主机: localhost" -ForegroundColor White
    Write-Host "  端口: 5432`n" -ForegroundColor White
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  第二步：配置项目环境变量" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    
    # 创建 .env 文件
    $envContent = @"
# Flask 配置
FLASK_ENV=production
SECRET_KEY=your_secret_key_here_please_change_this_to_random_string

# PostgreSQL 数据库配置
DATABASE_URL=postgresql://edupilot_user:$eduPassword@localhost:5432/edupilot_db

# DeepSeek AI 配置（如果有）
# DEEPSEEK_API_KEY=your_key_here

# 支付宝配置（如果有）
# ALIPAY_APP_ID=your_app_id
# ALIPAY_APP_PRIVATE_KEY=your_private_key
# ALIPAY_PUBLIC_KEY=your_public_key
"@
    
    if (Test-Path ".env") {
        $backup = ".env.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item ".env" $backup
        Write-Host "⚠️  已备份现有 .env 文件到: $backup" -ForegroundColor Yellow
    }
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ 已创建 .env 配置文件`n" -ForegroundColor Green
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  第三步：安装 Python 依赖" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    
    Write-Host "正在安装 psycopg2-binary..." -ForegroundColor Cyan
    pip install psycopg2-binary==2.9.9
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  第四步：执行数据迁移" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    
    Write-Host "是否现在执行数据迁移？(Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq 'Y' -or $response -eq 'y') {
        Write-Host "`n正在执行数据迁移..." -ForegroundColor Cyan
        python scripts/migrate_to_postgresql.py
    } else {
        Write-Host "`n稍后可以手动执行迁移：" -ForegroundColor Yellow
        Write-Host "  python scripts/migrate_to_postgresql.py" -ForegroundColor White
    }
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "  🎉 PostgreSQL 配置完成！" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green
    
    Write-Host "📖 下一步操作：" -ForegroundColor Cyan
    Write-Host "  1. 验证迁移: python scripts/verify_postgresql_migration.py" -ForegroundColor White
    Write-Host "  2. 启动服务: python app.py" -ForegroundColor White
    Write-Host "  3. 访问应用: http://localhost:5000`n" -ForegroundColor White
    
} else {
    Write-Host "`n❌ 数据库配置失败！" -ForegroundColor Red
    Write-Host "请检查：" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL 服务是否运行" -ForegroundColor White
    Write-Host "  2. postgres 用户密码是否正确" -ForegroundColor White
    Write-Host "  3. 防火墙设置" -ForegroundColor White
}

Write-Host "`n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")



