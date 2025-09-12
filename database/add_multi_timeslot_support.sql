-- 添加多时段配置支持
-- 这个脚本需要在生产数据库中执行

-- 1. 创建时段配置表
CREATE TABLE IF NOT EXISTS time_slots (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    role_key VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 索引
    INDEX idx_time_slots_project_user (project_id, user_id),
    INDEX idx_time_slots_project_role (project_id, role_key),
    INDEX idx_time_slots_date_range (start_date, end_date)
);

-- 2. 迁移现有数据到新的时段表
-- 为每个现有的团队成员创建一个默认时段记录
INSERT INTO time_slots (id, project_id, user_id, role_key, start_date, end_date, description)
SELECT 
    CONCAT('slot_', UUID()) as id,
    p.id as project_id,
    JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.userId')) as user_id,
    role_key,
    CASE 
        WHEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.startDate')) != '' 
        THEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.startDate'))
        ELSE NULL 
    END as start_date,
    CASE 
        WHEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.endDate')) != '' 
        THEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.endDate'))
        ELSE NULL 
    END as end_date,
    '默认时段' as description
FROM projects p
CROSS JOIN JSON_TABLE(
    CASE 
        WHEN JSON_VALID(p.product_managers) THEN p.product_managers
        ELSE '[]'
    END,
    '$[*]' COLUMNS (
        value JSON PATH '$'
    )
) AS member
WHERE JSON_VALID(p.product_managers) AND JSON_LENGTH(p.product_managers) > 0
AND 'product_managers' = 'product_managers'

UNION ALL

SELECT 
    CONCAT('slot_', UUID()) as id,
    p.id as project_id,
    JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.userId')) as user_id,
    'developers' as role_key,
    CASE 
        WHEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.startDate')) != '' 
        THEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.startDate'))
        ELSE NULL 
    END as start_date,
    CASE 
        WHEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.endDate')) != '' 
        THEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.endDate'))
        ELSE NULL 
    END as end_date,
    '默认时段' as description
FROM projects p
CROSS JOIN JSON_TABLE(
    CASE 
        WHEN JSON_VALID(p.developers) THEN p.developers
        ELSE '[]'
    END,
    '$[*]' COLUMNS (
        value JSON PATH '$'
    )
) AS member
WHERE JSON_VALID(p.developers) AND JSON_LENGTH(p.developers) > 0

UNION ALL

SELECT 
    CONCAT('slot_', UUID()) as id,
    p.id as project_id,
    JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.userId')) as user_id,
    'designers' as role_key,
    CASE 
        WHEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.startDate')) != '' 
        THEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.startDate'))
        ELSE NULL 
    END as start_date,
    CASE 
        WHEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.endDate')) != '' 
        THEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.endDate'))
        ELSE NULL 
    END as end_date,
    '默认时段' as description
FROM projects p
CROSS JOIN JSON_TABLE(
    CASE 
        WHEN JSON_VALID(p.designers) THEN p.designers
        ELSE '[]'
    END,
    '$[*]' COLUMNS (
        value JSON PATH '$'
    )
) AS member
WHERE JSON_VALID(p.designers) AND JSON_LENGTH(p.designers) > 0

UNION ALL

SELECT 
    CONCAT('slot_', UUID()) as id,
    p.id as project_id,
    JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.userId')) as user_id,
    'testers' as role_key,
    CASE 
        WHEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.startDate')) != '' 
        THEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.startDate'))
        ELSE NULL 
    END as start_date,
    CASE 
        WHEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.endDate')) != '' 
        THEN JSON_UNQUOTE(JSON_EXTRACT(member.value, '$.endDate'))
        ELSE NULL 
    END as end_date,
    '默认时段' as description
FROM projects p
CROSS JOIN JSON_TABLE(
    CASE 
        WHEN JSON_VALID(p.testers) THEN p.testers
        ELSE '[]'
    END,
    '$[*]' COLUMNS (
        value JSON PATH '$'
    )
) AS member
WHERE JSON_VALID(p.testers) AND JSON_LENGTH(p.testers) > 0;

-- 3. 验证迁移结果
SELECT 
    role_key,
    COUNT(*) as slot_count,
    COUNT(DISTINCT project_id) as project_count,
    COUNT(DISTINCT user_id) as user_count
FROM time_slots 
GROUP BY role_key
ORDER BY role_key;

-- 4. 检查是否有重复的时段记录
SELECT 
    project_id, 
    user_id, 
    role_key, 
    COUNT(*) as duplicate_count
FROM time_slots 
GROUP BY project_id, user_id, role_key
HAVING COUNT(*) > 1;

-- 5. 显示一些示例数据
SELECT 
    ts.project_id,
    p.name as project_name,
    ts.user_id,
    u.name as user_name,
    ts.role_key,
    ts.start_date,
    ts.end_date,
    ts.description
FROM time_slots ts
LEFT JOIN projects p ON ts.project_id = p.id
LEFT JOIN users u ON ts.user_id = u.id
ORDER BY ts.project_id, ts.role_key, ts.user_id
LIMIT 20;