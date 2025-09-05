-- 添加新的项目状态 '项目进行中'
-- 这个脚本需要在生产数据库中执行

-- 1. 检查当前项目状态的使用情况
SELECT status, COUNT(*) as count 
FROM projects 
WHERE status IS NOT NULL 
GROUP BY status 
ORDER BY count DESC;

-- 2. 如果需要，可以将某些现有项目的状态更新为新状态
-- 例如：将一些 '开发中' 的项目更新为 '项目进行中'
-- UPDATE projects SET status = '项目进行中' WHERE status = '开发中' AND some_condition;

-- 3. 验证更新后的状态分布
SELECT status, COUNT(*) as count 
FROM projects 
WHERE status IS NOT NULL 
GROUP BY status 
ORDER BY 
  CASE status
    WHEN '未开始' THEN 1
    WHEN '讨论中' THEN 2
    WHEN '需求完成' THEN 3
    WHEN '评审完成' THEN 4
    WHEN '产品设计' THEN 5
    WHEN '开发中' THEN 6
    WHEN '开发完成' THEN 7
    WHEN '测试中' THEN 8
    WHEN '测试完成' THEN 9
    WHEN '已上线' THEN 10
    WHEN '暂停' THEN 11
    WHEN '项目进行中' THEN 12
    ELSE 99
  END;