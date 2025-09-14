# 部门排序功能部署指南

## 功能说明
实现看板视图中人员按归属部门进行排序的功能。

## 更新内容

### 1. 数据库变更
- 为 `users` 表添加 `dept_id` 和 `dept_name` 字段
- 创建 `departments` 表用于部门信息管理
- 添加相关索引提升查询性能

### 2. 后端变更
- 更新 `User` 模型，添加部门字段
- 修改用户数据同步逻辑，保存部门信息
- 更新用户查询接口，按部门排序返回

### 3. 前端变更
- 更新 `User` 类型定义，添加部门字段
- 修改看板视图排序逻辑，优先按部门排序，同部门内按姓名排序

## 部署步骤

### 步骤1：数据库迁移
```bash
# 连接到生产数据库
psql -h <数据库主机> -U <用户名> -d <数据库名>

# 执行迁移脚本
\i codebuddy/database/migrate_add_department_support.sql
```

### 步骤2：部署后端代码
```bash
# 构建后端应用
cd codebuddy/backend
go build -o backend-app

# 重启后端服务
./deploy.sh
```

### 步骤3：部署前端代码
```bash
# 构建前端应用
npm run build

# 部署到服务器
# （根据实际部署方式执行）
```

### 步骤4：数据同步
```bash
# 触发员工数据重新同步，确保部门信息正确
curl -X POST http://your-api-host/api/refresh-users
```

## 验证步骤

### 1. 验证数据库结构
```sql
-- 检查用户表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 检查部门数据
SELECT dept_name, COUNT(*) as user_count 
FROM users 
WHERE dept_name IS NOT NULL 
GROUP BY dept_name;
```

### 2. 验证API响应
```bash
# 检查用户接口是否返回部门信息
curl http://your-api-host/api/users | jq '.[0]'
```

### 3. 验证前端排序
- 打开看板视图
- 确认人员列表按部门分组排序
- 同部门内按姓名排序

## 回滚方案

如果需要回滚，可以执行以下SQL：

```sql
-- 删除部门相关字段
ALTER TABLE users DROP COLUMN IF EXISTS dept_id;
ALTER TABLE users DROP COLUMN IF EXISTS dept_name;

-- 删除部门表
DROP TABLE IF EXISTS departments;

-- 删除相关索引
DROP INDEX IF EXISTS idx_users_dept_id;
DROP INDEX IF EXISTS idx_users_dept_name;
```

## 注意事项

1. **数据备份**：执行迁移前请确保已备份数据库
2. **服务停机**：建议在低峰期执行部署，避免影响用户使用
3. **监控**：部署后请监控系统性能和错误日志
4. **测试**：在生产环境部署前，请在测试环境充分验证

## 联系人
如有问题，请联系开发团队。