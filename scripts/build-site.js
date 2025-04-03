const fs = require('fs-extra');
const path = require('path');
const handlebars = require('handlebars');
const { execSync } = require('child_process');

// 定义路径
const TEMPLATES_DIR = path.join(__dirname, '../templates');
const PUBLIC_DIR = path.join(__dirname, '../public');
const DATA_DIR = path.join(__dirname, '../data');

// 清空并重建public目录
console.log('清理public目录...');
fs.emptyDirSync(PUBLIC_DIR);

// 确保必要的目录存在
fs.ensureDirSync(path.join(PUBLIC_DIR, 'games'));
fs.ensureDirSync(path.join(PUBLIC_DIR, 'categories'));
fs.ensureDirSync(path.join(PUBLIC_DIR, 'search'));
fs.ensureDirSync(path.join(PUBLIC_DIR, 'assets/css'));
fs.ensureDirSync(path.join(PUBLIC_DIR, 'assets/js'));
fs.ensureDirSync(path.join(PUBLIC_DIR, 'assets/images/games'));

// 注册Handlebars助手函数
handlebars.registerHelper('multiply', function(a, b) {
  return a * b;
});

handlebars.registerHelper('formatDate', function(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
});

handlebars.registerHelper('formatNumber', function(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
});

// 添加新的辅助函数用于生成WebP路径
handlebars.registerHelper('webpPath', function(jpgPath) {
  if (typeof jpgPath !== 'string') return '';
  return jpgPath.replace(/\.jpg$/i, '.webp');
});

// 复制静态文件
console.log('复制静态文件...');
fs.copySync(path.join(__dirname, '../assets'), path.join(PUBLIC_DIR, 'assets'));
fs.copySync(path.join(__dirname, '../service-worker.js'), path.join(PUBLIC_DIR, 'service-worker.js'));
fs.copySync(path.join(__dirname, '../offline.html'), path.join(PUBLIC_DIR, 'offline.html'));

// 生成首页 - 注释掉或删除不存在的脚本调用
// console.log('生成首页...');
// execSync('node scripts/generate-index-page.js');

// 生成游戏详情页
console.log('生成游戏详情页...');
try {
  execSync('node scripts/generate-game-pages.js');
} catch (error) {
  console.error('生成游戏详情页失败:', error.message);
}

// 生成分类页面
console.log('生成分类页面...');
try {
  execSync('node scripts/generate-category-pages.js');
} catch (error) {
  console.error('生成分类页面失败:', error.message);
}

// 生成搜索页面
console.log('生成搜索页面...');
try {
  execSync('node scripts/generate-search-page.js');
} catch (error) {
  console.error('生成搜索页面失败:', error.message);
}

// 生成收藏页面
console.log('生成收藏页面...');
try {
  execSync('node scripts/generate-favorites-page.js');
} catch (error) {
  console.error('生成收藏页面失败:', error.message);
}

// 优化图像资源（如果支持）
try {
  console.log('尝试优化图像资源...');
  execSync('node scripts/optimize-images.js');
} catch (error) {
  console.warn('图像优化失败，跳过此步骤:', error.message);
}

console.log('网站构建完成! 生成的文件位于 public/ 目录');