# 环境配置系统说明

## 🎯 概述

本项目支持两种运行模式：
- **开发模式 (development)**: 本地调试，禁用OIDC认证，使用模拟用户
- **生产模式 (production)**: 线上环境，启用完整OIDC认证流程

## 🔧 配置文件

### 环境变量文件

- `.env.local` - 本地开发环境配置
- `.env.production` - 生产环境配置

### 配置项说明

| 变量名 | 开发模式 | 生产模式 | 说明 |
|--------|----------|----------|------|
| `VITE_APP_ENV` | development | production | 环境标识 |
| `VITE_API_BASE_URL` | http://localhost:9000/api | http://120.92.36.175:9000/api | API服务地址 |
| `VITE_FRONTEND_URL` | http://localhost:5173 | http://120.92.36.175:5173 | 前端地址 |
| `VITE_ENABLE_OIDC` | false | true | 是否启用OIDC认证 |
| `VITE_MOCK_USER_ID` | 22231 | (空) | 开发模式模拟用户ID |

## 🚀 启动方式

### 方式一：使用脚本启动

```bash
# 开发模式
./scripts/dev.sh

# 生产模式
./scripts/prod.sh
```

### 方式二：手动设置环境变量

```bash
# 开发模式
export VITE_APP_ENV=development
export VITE_ENABLE_OIDC=false
npm run dev

# 生产模式
export VITE_APP_ENV=production
export VITE_ENABLE_OIDC=true
npm run build && npm run preview
```

### 方式三：使用环境文件

```bash
# 开发模式（自动加载 .env.local）
npm run dev

# 生产模式（自动加载 .env.production）
npm run build
```

## 🔐 认证机制

### 开发模式
- ✅ 跳过OIDC认证流程
- ✅ 自动使用模拟用户登录
- ✅ 默认用户：陈楠 (ID: 22231)
- ✅ 可通过 `VITE_MOCK_USER_ID` 切换模拟用户

### 生产模式
- ✅ 完整OIDC认证流程
- ✅ 金山云单点登录
- ✅ 用户信息自动匹配数据库
- ✅ 安全的token管理

## 🗄️ 数据库配置

**重要**: 无论哪种模式，数据库始终连接线上环境：
```
postgresql://admin:Kingsoft0531@120.92.44.85:51022/project_codebuddy
```

这确保了：
- ✅ 开发和生产数据一致性
- ✅ 真实数据测试
- ✅ 团队协作数据同步

## 🛠️ 开发调试

### 本地后端服务

如果需要调试后端API，请启动本地后端服务：

```bash
cd backend
export DATABASE_URL="postgresql://admin:Kingsoft0531@120.92.44.85:51022/project_codebuddy?sslmode=disable"
export PORT=9000
go run main.go
```

### 环境切换

在开发过程中可以随时切换环境：

```bash
# 切换到开发模式
export VITE_ENABLE_OIDC=false
# 重启前端服务

# 切换到生产模式
export VITE_ENABLE_OIDC=true
# 重启前端服务
```

## 🔍 调试信息

开发模式下，控制台会显示详细的配置信息：

```
🔧 Development Mode Config: {
  env: 'development',
  apiBaseUrl: 'http://localhost:9000/api',
  enableOIDC: false,
  mockUserId: '22231'
}
🔧 Development mode: Using mock authentication
🔧 Mock user loaded: 陈楠
```

## ⚠️ 注意事项

1. **环境变量优先级**: 命令行环境变量 > .env文件
2. **OIDC配置**: 生产模式下确保OIDC服务可访问
3. **API地址**: 确保对应环境的后端服务正在运行
4. **数据库连接**: 确保网络可访问线上数据库
5. **模拟用户**: 开发模式下确保模拟用户在数据库中存在

## 🚨 故障排除

### 开发模式问题

**问题**: 显示"开发模式认证失败"
**解决**: 
1. 检查后端服务是否启动 (http://localhost:9000)
2. 检查数据库连接是否正常
3. 确认模拟用户ID在数据库中存在

### 生产模式问题

**问题**: OIDC认证失败
**解决**:
1. 检查OIDC服务是否可访问
2. 确认redirect_uri配置正确
3. 检查用户邮箱是否在数据库中存在

### API调用问题

**问题**: API请求失败
**解决**:
1. 检查 `VITE_API_BASE_URL` 配置
2. 确认对应环境的后端服务正在运行
3. 检查网络连接和防火墙设置