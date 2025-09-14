-- 为用户表添加部门字段
-- 这个脚本需要在生产数据库中执行

-- 1. 添加部门相关字段到用户表
ALTER TABLE users ADD COLUMN IF NOT EXISTS dept_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dept_name VARCHAR(255);

-- 2. 创建部门信息表（可选，用于存储部门名称映射）
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

-- 4. 为用户表的部门字段创建索引
CREATE INDEX IF NOT EXISTS idx_users_dept_id ON users(dept_id);

-- 5. 验证表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;