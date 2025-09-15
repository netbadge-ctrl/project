-- 清理所有1月1日开始的排期数据，保留成员信息
-- 只清除 startDate 为任何年份的01-01的排期，不删除成员

-- 更新 product_managers 字段
UPDATE projects 
SET product_managers = (
    SELECT jsonb_agg(
        CASE 
            WHEN (member->>'startDate')::text LIKE '%-01-01' THEN
                jsonb_set(
                    jsonb_set(member, '{startDate}', 'null'::jsonb),
                    '{endDate}', 'null'::jsonb
                ) - 'timeSlots'
            ELSE member
        END
    )
    FROM jsonb_array_elements(COALESCE(product_managers, '[]'::jsonb)) AS member
)
WHERE product_managers IS NOT NULL 
AND product_managers::text LIKE '%-01-01%';

-- 更新 backend_developers 字段
UPDATE projects 
SET backend_developers = (
    SELECT jsonb_agg(
        CASE 
            WHEN (member->>'startDate')::text LIKE '%-01-01' THEN
                jsonb_set(
                    jsonb_set(member, '{startDate}', 'null'::jsonb),
                    '{endDate}', 'null'::jsonb
                ) - 'timeSlots'
            ELSE member
        END
    )
    FROM jsonb_array_elements(COALESCE(backend_developers, '[]'::jsonb)) AS member
)
WHERE backend_developers IS NOT NULL 
AND backend_developers::text LIKE '%-01-01%';

-- 更新 frontend_developers 字段
UPDATE projects 
SET frontend_developers = (
    SELECT jsonb_agg(
        CASE 
            WHEN (member->>'startDate')::text LIKE '%-01-01' THEN
                jsonb_set(
                    jsonb_set(member, '{startDate}', 'null'::jsonb),
                    '{endDate}', 'null'::jsonb
                ) - 'timeSlots'
            ELSE member
        END
    )
    FROM jsonb_array_elements(COALESCE(frontend_developers, '[]'::jsonb)) AS member
)
WHERE frontend_developers IS NOT NULL 
AND frontend_developers::text LIKE '%-01-01%';

-- 更新 qa_testers 字段
UPDATE projects 
SET qa_testers = (
    SELECT jsonb_agg(
        CASE 
            WHEN (member->>'startDate')::text LIKE '%-01-01' THEN
                jsonb_set(
                    jsonb_set(member, '{startDate}', 'null'::jsonb),
                    '{endDate}', 'null'::jsonb
                ) - 'timeSlots'
            ELSE member
        END
    )
    FROM jsonb_array_elements(COALESCE(qa_testers, '[]'::jsonb)) AS member
)
WHERE qa_testers IS NOT NULL 
AND qa_testers::text LIKE '%-01-01%';

-- 查询更新结果统计
SELECT 
    'product_managers' as role_type,
    COUNT(*) as affected_projects
FROM projects 
WHERE product_managers IS NOT NULL 
AND product_managers::text LIKE '%-01-01%'

UNION ALL

SELECT 
    'backend_developers' as role_type,
    COUNT(*) as affected_projects
FROM projects 
WHERE backend_developers IS NOT NULL 
AND backend_developers::text LIKE '%-01-01%'

UNION ALL

SELECT 
    'frontend_developers' as role_type,
    COUNT(*) as affected_projects
FROM projects 
WHERE frontend_developers IS NOT NULL 
AND frontend_developers::text LIKE '%-01-01%'

UNION ALL

SELECT 
    'qa_testers' as role_type,
    COUNT(*) as affected_projects
FROM projects 
WHERE qa_testers IS NOT NULL 
AND qa_testers::text LIKE '%-01-01%';