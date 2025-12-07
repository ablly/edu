-- PostgreSQL 添加级联删除到用户相关外键
-- 这将允许删除用户时自动删除相关记录

-- 1. UserMembership表
ALTER TABLE user_memberships 
DROP CONSTRAINT IF EXISTS user_memberships_user_id_fkey CASCADE;

ALTER TABLE user_memberships 
ADD CONSTRAINT user_memberships_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. PaymentTransaction表
ALTER TABLE payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_user_id_fkey CASCADE;

ALTER TABLE payment_transactions 
ADD CONSTRAINT payment_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. UsageLog表
ALTER TABLE usage_logs 
DROP CONSTRAINT IF EXISTS usage_logs_user_id_fkey CASCADE;

ALTER TABLE usage_logs 
ADD CONSTRAINT usage_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 验证外键约束
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'users'
ORDER BY tc.table_name;





