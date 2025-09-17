# 🔧 环境配置上下文记录

## 📋 项目环境配置总览

本项目支持**线上环境**和**本地调试**两种运行模式，通过环境变量和配置文件实现无缝切换。

### 🎯 设计目标
1. **本地调试**: 禁用OIDC认证，使用模拟用户，便于开发调试
2. **线上环境**: 启用完整OIDC认证流程，真实用户登录
3. **数据一致性**: 两种模式都连接线上数据库
4. **快速切换**: 一键切换环境配置

---

## 🔄 环境切换方法

### 方法一：使用自动化脚本（推荐）

#### 1. 切换到本地调试模式
```bash
cd codebuddy
node switch-env.cjs development
npm run dev
```

#### 2. 切换到线上环境模式
```bash
cd codebuddy
node switch-env.cjs production
npm run build
npm run preview
```

#### 3. 检查当前环境状态
```bash
cd codebuddy
node check-env.cjs
```

### 方法二：手动设置环境变量

#### 本地调试模式
```bash
cd codebuddy
export VITE_APP_ENV=development
export VITE_ENABLE_OIDC=false
export VITE_MOCK_USER_ID=22231
export VITE_API_BASE_URL=http://localhost:9000/api
export VITE_FRONTEND_URL=http://localhost:5173
npm run dev
```

#### 线上环境模式
```bash
cd codebuddy
export VITE_APP_ENV=production
export VITE_ENABLE_OIDC=true
export VITE_MOCK_USER_ID=
export VITE_API_BASE_URL=http://120.92.36.175:9000/api
export VITE_FRONTEND_URL=http://120.92.36.175:5173
npm run build
```

### 方法三：使用预设脚本

#### 本地调试启动
```bash
cd codebuddy
./scripts/dev.sh
```

#### 线上环境启动
```bash
cd codebuddy
./scripts/prod.sh
```

---

## 📊 环境配置对比表

| 配置项 | 本地调试模式 | 线上环境模式 | 说明 |
|--------|-------------|-------------|------|
| **VITE_APP_ENV** | `development` | `production` | 环境标识 |
| **VITE_ENABLE_OIDC** | `false` | `true` | OIDC认证开关 |
| **VITE_MOCK_USER_ID** | `22231` | `` | 模拟用户ID |
| **VITE_API_BASE_URL** | `http://localhost:9000/api` | `http://120.92.36.175:9000/api` | API服务地址 |
| **VITE_FRONTEND_URL** | `http://localhost:5173` | `http://120.92.36.175:5173` | 前端访问地址 |
| **数据库连接** | 线上数据库 | 线上数据库 | 保持一致 |

---

## 🔐 认证机制详细说明

### 本地调试模式认证流程

```mermaid
graph TD
    A[启动应用] --> B{检查VITE_ENABLE_OIDC}
    B -->|false| C[使用模拟用户模式]
    C --> D[读取VITE_MOCK_USER_ID=22231]
    D --> E[调用API获取用户信息]
    E --> F[自动登录成功]
    F --> G[进入应用主界面]
```

**特点**:
- ❌ 跳过OIDC认证流程
- ✅ 自动使用模拟用户"陈楠"(ID: 22231)
- 🚀 快速启动，无需配置OIDC服务
- 🔧 便于本地开发和调试

### 线上环境认证流程

```mermaid
graph TD
    A[启动应用] --> B{检查VITE_ENABLE_OIDC}
    B -->|true| C[检查用户登录状态]
    C -->|未登录| D[跳转OIDC登录页面]
    D --> E[用户输入凭据]
    E --> F[OIDC服务验证]
    F --> G[返回授权码]
    G --> H[交换访问令牌]
    H --> I[获取用户信息]
    I --> J[邮箱匹配数据库用户]
    J --> K[登录成功]
    K --> L[进入应用主界面]
```

**特点**:
- ✅ 完整的企业级OIDC认证
- 🔒 安全的单点登录
- 👤 真实用户身份验证
- 📧 基于邮箱的用户匹配

---

## 🗄️ 数据库配置说明

### 统一数据库连接
```
postgresql://admin:Kingsoft0531@120.92.44.85:51022/project_codebuddy
```

**重要特性**:
- 🔄 **两种模式共享**: 本地调试和线上环境都使用相同数据库
- 📊 **数据一致性**: 确保开发和生产数据同步
- 👥 **团队协作**: 所有开发者使用相同的数据源
- 🔒 **安全连接**: 使用SSL模式连接

### 数据表结构
1. **users** - 用户信息表
   - id, name, email, avatar_url
   - 支持OIDC用户和模拟用户

2. **projects** - 项目管理表
   - 复杂JSONB字段支持
   - 项目状态、优先级、团队成员

3. **okr_sets** - OKR管理表
   - period_id, period_name, okrs
   - 支持半年度OKR周期

---

## 🛠️ 开发调试详细流程

### 1. 环境准备
```bash
# 克隆项目
git clone git@gitee.com:fengyikai/codebuddy.git
cd codebuddy

# 安装依赖
npm install

# 检查环境配置
node check-env.cjs
```

### 2. 启动本地调试
```bash
# 方式1: 使用自动化脚本
node switch-env.cjs development
npm run dev

# 方式2: 使用预设脚本
./scripts/dev.sh

# 方式3: 手动设置环境变量
VITE_APP_ENV=development VITE_ENABLE_OIDC=false VITE_MOCK_USER_ID=22231 npm run dev
```

### 3. 访问应用
- **本地地址**: http://localhost:5173/ (或自动分配的端口)
- **自动登录**: 系统自动使用"陈楠"账户
- **功能测试**: 可以正常使用所有业务功能

### 4. 后端服务（可选）
```bash
# 如需本地后端调试
cd backend
export DATABASE_URL="postgresql://admin:Kingsoft0531@120.92.44.85:51022/project_codebuddy?sslmode=disable"
export PORT=9000
go run main.go
```

---

## 🚀 生产部署详细流程

### 1. 环境切换
```bash
# 切换到生产模式
node switch-env.cjs production

# 验证配置
node check-env.cjs
```

### 2. 构建应用
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 3. 部署到服务器
```bash
# 使用部署脚本
./scripts/prod.sh

# 或手动部署
scp -r dist/ user@120.92.36.175:/var/www/codebuddy/
```

### 4. 访问验证
- **生产地址**: http://120.92.36.175:5173/
- **OIDC登录**: 自动跳转到金山云OIDC登录页面
- **用户验证**: 使用企业邮箱登录

---

## 🔍 故障排除指南

### 本地调试模式问题

#### 问题1: 显示"开发模式认证失败"
**原因**: 模拟用户不存在或后端服务未启动
**解决方案**:
```bash
# 检查后端服务
curl http://localhost:9000/health

# 检查用户数据
curl http://localhost:9000/api/users

# 确认模拟用户存在
curl http://localhost:9000/api/users | grep "22231"
```

#### 问题2: API调用失败
**原因**: 后端服务地址配置错误
**解决方案**:
```bash
# 检查环境配置
node check-env.cjs

# 确认API地址
echo $VITE_API_BASE_URL

# 测试API连通性
curl http://localhost:9000/api/users
```

### 线上环境模式问题

#### 问题1: OIDC认证失败
**原因**: OIDC服务配置或网络问题
**解决方案**:
```bash
# 检查OIDC服务可访问性
curl https://oidc-public.ksyun.com:443/.well-known/openid_configuration

# 验证redirect_uri配置
grep -r "redirect_uri" codebuddy/

# 检查环境变量
node check-env.cjs
```

#### 问题2: 用户匹配失败
**原因**: 用户邮箱在数据库中不存在
**解决方案**:
```bash
# 检查数据库用户表
psql postgresql://admin:Kingsoft0531@120.92.44.85:51022/project_codebuddy -c "SELECT * FROM users WHERE email = 'your-email@example.com';"

# 添加新用户（如需要）
psql postgresql://admin:Kingsoft0531@120.92.44.85:51022/project_codebuddy -c "INSERT INTO users (name, email) VALUES ('用户名', 'email@example.com');"
```

### 环境配置问题

#### 问题1: 环境变量未生效
**解决方案**:
```bash
# 重新生成配置文件
node switch-env.cjs development

# 重启开发服务器
pkill -f "vite"
npm run dev

# 清除浏览器缓存
# Chrome: Ctrl+Shift+R
# Firefox: Ctrl+F5
```

#### 问题2: 端口冲突
**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :5173
lsof -i :9000

# 终止进程
kill -9 <PID>

# 或使用不同端口
npm run dev -- --port 5174
```

---

## 📋 环境配置检查清单

### 开发环境检查
- [ ] `.env.local` 文件存在且配置正确
- [ ] `VITE_ENABLE_OIDC=false` 已设置
- [ ] `VITE_MOCK_USER_ID=22231` 已设置
- [ ] 本地API地址配置正确
- [ ] 数据库连接正常
- [ ] 模拟用户在数据库中存在

### 生产环境检查
- [ ] `.env.production` 文件存在且配置正确
- [ ] `VITE_ENABLE_OIDC=true` 已设置
- [ ] 线上API地址配置正确
- [ ] OIDC服务可访问
- [ ] redirect_uri 配置正确
- [ ] 用户邮箱在数据库中存在

### 通用检查
- [ ] 依赖包安装完成
- [ ] TypeScript编译无错误
- [ ] 环境变量类型声明正确
- [ ] 自动化工具权限正确
- [ ] 文档和注释完整

---

## 🎯 最佳实践建议

### 开发阶段
1. **始终使用本地调试模式** - 避免OIDC配置复杂性
2. **定期同步数据库** - 确保本地开发数据最新
3. **使用环境检查工具** - 定期验证配置正确性
4. **保持文档更新** - 记录配置变更和问题解决方案

### 测试阶段
1. **两种模式都要测试** - 确保功能在不同环境下正常
2. **用户权限测试** - 验证不同用户的访问权限
3. **API兼容性测试** - 确保前后端接口一致
4. **性能测试** - 验证生产环境性能表现

### 部署阶段
1. **渐进式部署** - 先在测试环境验证
2. **配置备份** - 保存当前工作配置
3. **回滚准备** - 准备快速回滚方案
4. **监控告警** - 设置服务监控和告警

---

## 📚 相关文档链接

- [项目README](./README.md) - 项目基本信息
- [部署指南](./DEPLOYMENT_GUIDE.md) - 详细部署说明
- [环境配置完成报告](./ENVIRONMENT_SETUP_COMPLETE.md) - 配置完成状态
- [API文档](./backend/README.md) - 后端API接口说明

---

## 🏆 总结

本环境配置系统实现了：

✅ **双环境支持** - 本地调试和线上环境无缝切换
✅ **认证灵活性** - 开发时跳过OIDC，生产时完整认证
✅ **数据一致性** - 统一使用线上数据库
✅ **自动化工具** - 一键切换和状态检查
✅ **完整文档** - 详细的使用说明和故障排除

这套配置系统大大提升了开发效率，同时保证了生产环境的安全性和稳定性。开发者可以专注于业务逻辑开发，而无需担心复杂的环境配置问题。