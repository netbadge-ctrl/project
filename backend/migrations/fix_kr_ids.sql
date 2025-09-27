-- 修复KR ID重复问题的数据迁移脚本
-- 将所有KR ID转换为复合格式: okrId::originalKrId

-- 1. 备份现有数据
CREATE TABLE IF NOT EXISTS okr_sets_backup AS SELECT * FROM okr_sets;
CREATE TABLE IF NOT EXISTS projects_backup AS SELECT * FROM projects;

-- 2. 更新OKR数据中的KR ID
-- 此步骤需要在应用层处理，因为JSONB数据结构复杂

-- 3. 更新项目关联的KR ID
-- 此步骤也需要在应用层处理

-- 注意：此文件提供迁移思路，具体执行需要通过后端API