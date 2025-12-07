@echo off
echo ================================================================================
echo 启动EduPilot系统 - PostgreSQL模式
echo ================================================================================
echo.

set DATABASE_URL=postgresql://postgres:050102@localhost:5432/edupilot

echo ✓ 数据库配置: PostgreSQL
echo   连接地址: localhost:5432/edupilot
echo.
echo 正在启动Flask服务器...
echo 管理后台: http://localhost:5000/admin/login
echo 前端地址: http://localhost:5000
echo.
echo 登录信息:
echo   用户名: 周启航
echo   密码:   zqh050102
echo.
echo 按 Ctrl+C 停止服务器
echo ================================================================================
echo.

python app.py



