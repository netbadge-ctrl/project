#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取版本信息
const versionPath = path.join(__dirname, '../version.json');
const versionInfo = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

console.log('🎉 CodeBuddy 版本信息');
console.log('='.repeat(50));
console.log(`版本号: ${versionInfo.version}`);
console.log(`版本名称: ${versionInfo.name}`);
console.log(`发布日期: ${versionInfo.releaseDate}`);
console.log(`构建时间: ${versionInfo.buildTime}`);
console.log('');

console.log('✨ 主要功能:');
versionInfo.features.forEach(feature => {
  console.log(`  • ${feature}`);
});
console.log('');

console.log('📊 版本统计:');
console.log(`  • 新增文件: ${versionInfo.metrics.filesAdded} 个`);
console.log(`  • 更新文件: ${versionInfo.metrics.filesUpdated} 个`);
console.log(`  • 代码行数: ${versionInfo.metrics.linesOfCode}+ 行`);
console.log(`  • 测试覆盖率: ${versionInfo.metrics.testCoverage}`);
console.log('');

console.log('🌐 兼容性:');
console.log(`  • 向后兼容: ${versionInfo.compatibility.backward}`);
console.log(`  • 浏览器支持: ${versionInfo.compatibility.browsers.join(', ')}`);
console.log(`  • 移动端支持: ${versionInfo.compatibility.mobile ? '✅' : '❌'}`);
console.log('');

console.log('🚀 版本 2.0.7 已成功保存！');
console.log('筛选条件持久化功能已集成到现有系统中。');