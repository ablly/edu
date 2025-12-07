# EduPilot AI - PostgreSQL 服务器启动脚本
# 此脚本确保使用PostgreSQL数据库而非SQLite

Write-Host "`n╔══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                          ║" -ForegroundColor Cyan
Write-Host "║  EduPilot AI - 启动 Flask 服务器 (PostgreSQL)                           ║" -ForegroundColor Cyan
Write-Host "║                                                                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# 设置PostgreSQL数据库URL
$env:DATABASE_URL = "postgresql://edupilot_user:050102@localhost:5432/edupilot_db"

Write-Host "✓ 环境变量已设置" -ForegroundColor Green
Write-Host "  DATABASE_URL = $env:DATABASE_URL`n" -ForegroundColor Gray

# 停止现有的Flask进程
Write-Host "检查现有Flask进程..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object {$_.ProcessName -like "*python*"}
if ($processes) {
    Write-Host "  发现 $($processes.Count) 个Python进程，正在停止..." -ForegroundColor Yellow
    $processes | ForEach-Object { try { $_.Kill() } catch {} } 2>$null
    Start-Sleep -Seconds 2
    Write-Host "  ✓ 已停止旧进程`n" -ForegroundColor Green
} else {
    Write-Host "  ✓ 无现有进程`n" -ForegroundColor Green
}

# 启动Flask服务器
Write-Host "启动Flask服务器..." -ForegroundColor Yellow
Start-Process python -ArgumentList "app.py" -WindowStyle Hidden
Start-Sleep -Seconds 4

Write-Host "`n╔══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                          ║" -ForegroundColor Green
Write-Host "║  ✅ Flask 服务器已启动！                                                ║" -ForegroundColor Green
Write-Host "║                                                                          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
Write-Host "📊 服务器信息：" -ForegroundColor Yellow
Write-Host "`n  URL:      http://localhost:5000" -ForegroundColor White
Write-Host "  数据库:    PostgreSQL (edupilot_db)" -ForegroundColor White
Write-Host "  管理后台:  http://localhost:5000/admin/dashboard" -ForegroundColor White
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "✨ 服务器运行中... 按 Ctrl+C 停止`n" -ForegroundColor Green





