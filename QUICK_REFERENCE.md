# 🚀 快速参考卡片

## 环境切换命令

```bash
# 🔧 开发模式 (禁用OIDC，使用模拟用户)
node switch-env.cjs development
npm run dev

# 🚀 生产模式 (启用OIDC，真实认证)
node switch-env.cjs production
npm run build

# 🔍 检查环境状态
node check-env.cjs
```

## 访问地址

| 模式 | 前端地址 | 后端地址 | 认证方式 |
|------|----------|----------|----------|
| 开发 | http://localhost:5173/ | http://localhost:9000/ | 模拟用户(陈楠) |
| 生产 | http://120.92.36.175:5173/ | http://120.92.36.175:9000/ | OIDC认证 |

## 环境变量对照

| 变量名 | 开发模式 | 生产模式 |
|--------|----------|----------|
| VITE_ENABLE_OIDC | false | true |
| VITE_MOCK_USER_ID | 22231 | (空) |
| VITE_API_BASE_URL | localhost:9000/api | 120.92.36.175:9000/api |

## 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 启动后端服务
cd backend && go run main.go
```

## 故障排除

```bash
# 重启开发服务器
pkill -f "vite" && npm run dev

# 检查端口占用
lsof -i :5173
lsof -i :9000

# 清除缓存
rm -rf node_modules/.vite
npm run dev