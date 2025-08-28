# 服务器部署指南

本文档介绍了如何在云服务器上部署和运行项目管理系统。

## 环境要求

- Go 1.21+
- Node.js 16+
- npm 8+
- 云服务器安全组已开放端口：5173 (前端), 9000 (后端)

## 部署步骤

### 1. 启动后端服务

```bash
# 进入后端目录
cd backend

# 安装Go依赖
go mod tidy

# 编译后端服务
go build -o project-management-backend main.go

# 设置环境变量
export DATABASE_URL="postgresql://admin:Kingsoft0531@120.92.44.85:51022/project_codebuddy?sslmode=disable"
export PORT="9000"

# 启动后端服务
./project-management-backend &

# 记录进程ID以便后续管理
echo $! > backend.pid
```

### 2. 启动前端服务

```bash
# 返回项目根目录
cd ..

# 安装前端依赖
npm install

# 启动前端开发服务器
npm run dev &

# 记录进程ID以便后续管理
echo $! > frontend.pid
```

### 3. 验证服务状态

```bash
# 检查后端服务
curl http://120.92.36.175:9000/health

# 检查前端服务
curl http://120.92.36.175:5173
```

### 4. 数据初始化（首次部署）

```bash
# 导入初始数据
curl -X POST http://120.92.36.175:9000/api/migrate-initial-data
```

## 服务管理命令

### 查看服务状态
```bash
# 查看后端进程
ps aux | grep project-management-backend

# 查看前端进程
ps aux | grep vite
```

### 停止服务
```bash
# 停止后端服务
kill $(cat backend.pid)

# 停止前端服务
kill $(cat frontend.pid)
```

## 常见问题排查

### 端口占用检查
```bash
# 检查9000端口
lsof -i :9000

# 检查5173端口
lsof -i :5173
```

### 日志查看
```bash
# 查看后端日志
tail -f backend.log

# 查看前端日志
tail -f frontend.log
```

## 生产环境建议

1. 使用PM2等进程管理工具管理服务
2. 配置Nginx反向代理
3. 启用HTTPS
4. 设置自动重启机制
5. 定期备份数据库