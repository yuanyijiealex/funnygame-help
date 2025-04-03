const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { registerHelpers } = require('./helpers');

// 注册所有辅助函数
registerHelpers(handlebars);

// 配置
const GAMES_DATA_PATH = path.join(__dirname, '../data/games.json');
const TEMPLATE_PATH = path.join(__dirname, '../templates/game.html');
const OUTPUT_DIR = path.join(__dirname, '../public/games');
const BASE_URL = 'https://funnygame.help';

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 检查文件存在性
if (!fs.existsSync(GAMES_DATA_PATH)) {
  console.error(`错误: 游戏数据文件不存在: ${GAMES_DATA_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`错误: 模板文件不存在: ${TEMPLATE_PATH}`);
  process.exit(1);
}

// 加载数据
let gamesData = JSON.parse(fs.readFileSync(GAMES_DATA_PATH, 'utf8'));
// 确保gamesData是数组
if (!Array.isArray(gamesData)) {
  if (typeof gamesData === 'object') {
    // 如果是对象，尝试从属性中获取数组
    for (const key in gamesData) {
      if (Array.isArray(gamesData[key])) {
        gamesData = gamesData[key];
        break;
      }
    }
  }
  // 如果仍然不是数组，初始化为空数组
  if (!Array.isArray(gamesData)) {
    console.warn('警告: games.json 数据不是数组格式，初始化为空数组');
    gamesData = [];
  }
}

// 读取模板文件 - 添加这一行
const templateSource = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// 编译模板
const template = handlebars.compile(templateSource);

// 格式化日期函数
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// 生成标签HTML
function generateTagsHtml(tags) {
  if (!tags || !Array.isArray(tags)) return '';
  return tags.map(tag => `<span class="game-tag">${tag}</span>`).join('');
}

// 为每个游戏生成页面
console.log(`开始生成游戏页面...`);
gamesData.forEach(game => {
  const gameFileName = `${game.id}.html`;
  const outputPath = path.join(OUTPUT_DIR, gameFileName);
  
  // 准备模板数据
  const templateData = {
    ...game,
    releaseDate: formatDate(game.releaseDate),
    tags: generateTagsHtml(game.tags),
    ogUrl: `${BASE_URL}/games/${gameFileName}`,
    currentYear: new Date().getFullYear()
  };
  
  // 生成HTML
  const html = template(templateData);
  
  // 写入文件
  fs.writeFileSync(outputPath, html);
  console.log(`✓ 已生成游戏页面: ${gameFileName}`);
});

console.log(`游戏页面生成完成! 总共生成了 ${gamesData.length} 个页面。`);