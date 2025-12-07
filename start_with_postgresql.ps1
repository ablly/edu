# 启动Flask服务器 - 使用PostgreSQL数据库

Write-Host "=" -NoNewline
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "启动EduPilot系统 - PostgreSQL模式" -ForegroundColor Green
Write-Host "============================================================================`n" -ForegroundColor Cyan

# 设置PostgreSQL环境变量
$env:DATABASE_URL = "postgresql://postgres:050102@localhost:5432/edupilot"

Write-Host "✓ 数据库配置: PostgreSQL" -ForegroundColor Green
Write-Host "  连接地址: localhost:5432/edupilot`n"

Write-Host "正在启动Flask服务器..." -ForegroundColor Yellow
Write-Host "管理后台地址: http://localhost:5000/admin/login" -ForegroundColor Cyan
Write-Host "前端地址: http://localhost:3000`n" -ForegroundColor Cyan

Write-Host "登录信息:" -ForegroundColor Yellow
Write-Host "  用户名: 周启航" -ForegroundColor White
Write-Host "  密码:   zqh050102`n" -ForegroundColor White

Write-Host "按 Ctrl+C 停止服务器`n" -ForegroundColor Gray
Write-Host "============================================================================`n" -ForegroundColor Cyan

# 启动Flask
python app.py



