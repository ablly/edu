-- 添加级联删除到user_id外键
-- 这将允许删除用户时自动删除相关记录

-- 1. UserMembership表
ALTER TABLE user_memberships 
DROP CONSTRAINT IF EXISTS user_memberships_user_id_fkey;

ALTER TABLE user_memberships 
ADD CONSTRAINT user_memberships_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. PaymentTransaction表
ALTER TABLE payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_user_id_fkey;

ALTER TABLE payment_transactions 
ADD CONSTRAINT payment_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. UsageLog表
ALTER TABLE usage_logs 
DROP CONSTRAINT IF EXISTS usage_logs_user_id_fkey;

ALTER TABLE usage_logs 
ADD CONSTRAINT usage_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;





