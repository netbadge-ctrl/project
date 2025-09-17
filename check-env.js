#!/usr/bin/env node

const fs = require('fs');

function checkEnvironment() {
  console.log('🔍 环境配置检查');
  console.log('==================');
  
  // 检查环境文件
  const envFiles = ['.env.local', '.env.production'];
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} 存在`);
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.log(`   ${line}`);
      });
    } else {
      console.log(`❌ ${file} 不存在`);
    }
    console.log('');
  });
  
  // 检查进程环境变量
  console.log('🌍 当前进程环境变量:');
  const envVars = [
    'VITE_APP_ENV',
    'VITE_API_BASE_URL', 
    'VITE_FRONTEND_URL',
    'VITE_ENABLE_OIDC',
    'VITE_MOCK_USER_ID'
  ];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    if (value !== undefined) {
      console.log(`   ${varName}=${value}`);
    } else {
      console.log(`   ${varName}=未设置`);
    }
  });
  
  console.log('');
  console.log('💡 提示:');
  console.log('  - 使用 node switch-env.js development 切换到开发模式');
  console.log('  - 使用 node switch-env.js production 切换到生产模式');
  console.log('  - 环境变量优先级: 进程环境变量 > .env.local > 默认值');
}

checkEnvironment();