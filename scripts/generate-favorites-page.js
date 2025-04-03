const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { registerHelpers } = require('./helpers');

// 注册所有辅助函数
registerHelpers(handlebars);

// 配置
const TEMPLATE_PATH = path.join(__dirname, '../templates/favorites.html');
const OUTPUT_PATH = path.join(__dirname, '../public/favorites.html');

// 确保输出目录存在
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 读取模板并写入目标文件
const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
fs.writeFileSync(OUTPUT_PATH, templateContent);

console.log(`收藏页面已生成: ${OUTPUT_PATH}`);