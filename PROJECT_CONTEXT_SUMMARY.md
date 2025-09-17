# 📋 项目上下文总结

## 🎯 项目概述
**企业级项目管理系统** - 支持OKR管理、项目跟踪、团队协作的现代化Web应用

## 🏗️ 技术架构
- **前端**: React 19 + TypeScript + Vite + TailwindCSS
- **后端**: Go + Gin + PostgreSQL
- **认证**: OIDC (金山云) + 本地模拟用户
- **部署**: 双环境配置系统

## 🔧 环境配置系统

### 核心特性
✅ **双模式支持**: 本地调试 + 线上环境
✅ **智能认证**: 开发时跳过OIDC，生产时完整认证  
✅ **数据一致**: 统一使用线上数据库
✅ **一键切换**: 自动化环境配置工具

### 配置文件结构
```
codebuddy/
├── .env.local              # 本地开发环境配置
├── .env.production         # 生产环境配置
├── config/env.ts           # 环境配置管理模块
├── switch-env.cjs          # 环境切换工具
├── check-env.cjs           # 环境检查工具
├── scripts/
│   ├── dev.sh             # 开发环境启动脚本
│   └── prod.sh            # 生产环境启动脚本
└── ENVIRONMENT_CONTEXT.md  # 详细配置文档
```

## 🔄 环境切换方法

### 方法1: 自动化脚本（推荐）
```bash
# 开发模式
node switch-env.cjs development
npm run dev

# 生产模式  
node switch-env.cjs production
npm run build

# 状态检查
node check-env.cjs
```

### 方法2: 预设脚本
```bash
./scripts/dev.sh    # 开发环境
./scripts/prod.sh   # 生产环境
```

### 方法3: 手动环境变量
```bash
# 开发模式
VITE_APP_ENV=development VITE_ENABLE_OIDC=false VITE_MOCK_USER_ID=22231 npm run dev

# 生产模式
VITE_APP_ENV=production VITE_ENABLE_OIDC=true npm run build
```

## 🔐 认证机制对比

| 特性 | 本地调试模式 | 线上环境模式 |
|------|-------------|-------------|
| **OIDC认证** | ❌ 禁用 | ✅ 启用 |
| **模拟用户** | ✅ 陈楠(22231) | ❌ 无 |
| **登录流程** | 自动登录 | OIDC跳转 |
| **用户匹配** | 直接加载 | 邮箱匹配 |
| **开发效率** | 🚀 极快 | 🔒 安全 |

## 🗄️ 数据库配置

**统一连接**: `postgresql://admin:Kingsoft0531@120.92.44.85:51022/project_codebuddy`

**重要特性**:
- 🔄 两种模式共享数据库
- 📊 确保数据一致性  
- 👥 支持团队协作
- 🔒 SSL安全连接

## 🌐 服务地址配置

| 环境 | 前端地址 | API地址 | 数据库 |
|------|----------|---------|--------|
| **开发** | http://localhost:5173 | http://localhost:9000/api | 线上DB |
| **生产** | http://120.92.36.175:5173 | http://120.92.36.175:9000/api | 线上DB |

## 🛠️ 开发工作流

### 1. 项目初始化
```bash
git clone git@gitee.com:fengyikai/codebuddy.git
cd codebuddy
npm install
```

### 2. 本地开发
```bash
node switch-env.cjs development  # 切换开发模式
npm run dev                      # 启动开发服务器
# 访问 http://localhost:5173/
# 自动使用"陈楠"账户登录
```

### 3. 功能测试
```bash
node check-env.cjs              # 检查环境状态
# 在浏览器中测试所有功能
# 数据变更会同步到线上数据库
```

### 4. 生产部署
```bash
node switch-env.cjs production  # 切换生产模式
npm run build                   # 构建生产版本
npm run preview                 # 预览构建结果
# 部署到服务器
```

## 🔍 故障排除快速指南

### 开发模式问题
```bash
# 认证失败
curl http://localhost:9000/health
curl http://localhost:9000/api/users

# API调用失败  
node check-env.cjs
curl http://localhost:9000/api/users
```

### 生产模式问题
```bash
# OIDC认证失败
curl https://oidc-public.ksyun.com:443/.well-known/openid_configuration

# 用户匹配失败
psql postgresql://admin:Kingsoft0531@120.92.44.85:51022/project_codebuddy -c "SELECT * FROM users;"
```

### 环境配置问题
```bash
# 配置未生效
node switch-env.cjs development
pkill -f "vite" && npm run dev

# 端口冲突
lsof -i :5173
kill -9 <PID>
```

## 📚 文档索引

- **[README.md](./README.md)** - 项目基本信息
- **[ENVIRONMENT_CONTEXT.md](./ENVIRONMENT_CONTEXT.md)** - 详细环境配置说明
- **[ENVIRONMENT_SETUP_COMPLETE.md](./ENVIRONMENT_SETUP_COMPLETE.md)** - 配置完成报告
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - 快速参考卡片
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - 部署指南

## 🎯 核心优势

1. **开发效率** - 本地调试无需复杂OIDC配置
2. **生产安全** - 完整的企业级认证流程
3. **数据一致** - 开发和生产使用相同数据源
4. **快速切换** - 一键切换环境配置
5. **团队协作** - 统一的开发和部署流程
6. **完整文档** - 详细的使用说明和故障排除

## 🏆 当前状态

✅ **环境配置系统已完全部署**
✅ **开发服务器运行中**: http://localhost:5174/
✅ **本地调试模式已激活**: 使用模拟用户"陈楠"
✅ **自动化工具已就绪**: 环境切换和状态检查
✅ **文档体系已完善**: 完整的使用指南和参考资料

**系统已完全就绪，可以开始高效的开发工作！** 🚀