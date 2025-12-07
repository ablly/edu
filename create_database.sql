-- 创建数据库用户
CREATE USER edupilot_user WITH PASSWORD '050102';

-- 创建数据库
CREATE DATABASE edupilot_db 
  WITH OWNER = edupilot_user
       ENCODING = 'UTF8';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE edupilot_db TO edupilot_user;

-- 连接到新数据库
\c edupilot_db

-- 授予schema权限
GRANT ALL ON SCHEMA public TO edupilot_user;

-- 显示成功消息
SELECT 'Database setup completed successfully!' as status;



