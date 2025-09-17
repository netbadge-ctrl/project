-- 数据库迁移脚本：添加部门支持
-- 执行时间：2025-09-14
-- 说明：为用户表添加部门字段，支持按部门排序功能

-- 1. 为用户表添加部门字段（如果不存在）
DO $$ 
BEGIN 
    -- 添加 dept_id 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'dept_id'
    ) THEN
        ALTER TABLE users ADD COLUMN dept_id INTEGER;
    END IF;
    
    -- 添加 dept_name 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'dept_name'
    ) THEN
        ALTER TABLE users ADD COLUMN dept_name VARCHAR(255);
    END IF;
END $$;

-- 2. 创建部门信息表（用于存储部门名称映射）
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 插入已知的部门信息
INSERT INTO departments (id, name) VALUES (28508728, '技术部') 
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 4. 为用户表的部门字段创建索引（提升查询性能）
CREATE INDEX IF NOT EXISTS idx_users_dept_id ON users(dept_id);
CREATE INDEX IF NOT EXISTS idx_users_dept_name ON users(dept_name);

-- 5. 更新现有用户的部门信息（假设现有用户都属于技术部）
UPDATE users 
SET dept_id = 28508728, dept_name = '技术部' 
WHERE dept_id IS NULL;

-- 6. 验证迁移结果
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN dept_id IS NOT NULL THEN 1 END) as users_with_dept
FROM users;

-- 7. 显示表结构（验证字段已添加）
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;