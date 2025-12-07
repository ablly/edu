@echo off
chcp 65001 >nul
echo ================================================================================
echo 重启Flask服务器 - 加载批量操作API
echo ================================================================================
echo.

set DATABASE_URL=postgresql://postgres:050102@localhost:5432/edupilot

echo ✓ 数据库: PostgreSQL (edupilot)
echo ✓ 批量操作API: 已添加
echo.
echo 正在启动Flask...
echo 管理后台: http://localhost:3000
echo API服务器: http://localhost:5000
echo.
echo 登录信息:
echo   用户名: 周启航
echo   密码:   zqh050102
echo.
echo 按 Ctrl+C 停止
echo ================================================================================
echo.

python app.py



