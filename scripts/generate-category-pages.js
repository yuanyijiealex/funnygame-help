const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { registerHelpers } = require('./helpers');
// 注册所有辅助函数
registerHelpers(handlebars);

// 配置
const SITE_DATA_PATH = path.join(__dirname, '../data/site-data.json');
const GAMES_DATA_PATH = path.join(__dirname, '../data/games.json');
const TEMPLATE_PATH = path.join(__dirname, '../templates/category.html');
const OUTPUT_DIR = path.join(__dirname, '../public/categories');
const BASE_URL = 'https://funnygame.help';

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 加载数据
let siteData;
let gamesData = [];

try {
  // 加载站点数据
  if (fs.existsSync(SITE_DATA_PATH)) {
    const siteJson = fs.readFileSync(SITE_DATA_PATH, 'utf8');
    siteData = JSON.parse(siteJson);
  } else {
    console.log('警告: 站点数据文件不存在:', SITE_DATA_PATH);
    siteData = {};
  }
  
  // 加载游戏数据
  if (fs.existsSync(GAMES_DATA_PATH)) {
    const gamesJson = fs.readFileSync(GAMES_DATA_PATH, 'utf8');
    gamesData = JSON.parse(gamesJson);
    
    // 确保解析后的数据是数组
    if (!Array.isArray(gamesData)) {
      console.log('警告: 游戏数据文件不包含有效的数组');
      gamesData = [];
    }
  } else {
    console.log('警告: 游戏数据文件不存在:', GAMES_DATA_PATH);
  }
} catch (error) {
  console.error('读取数据文件时出错:', error);
  siteData = siteData || {};
  gamesData = [];
}

// 加载模板
let templateSource;
try {
  if (fs.existsSync(TEMPLATE_PATH)) {
    templateSource = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  } else {
    console.error('错误: 模板文件不存在:', TEMPLATE_PATH);
    process.exit(1);
  }
} catch (error) {
  console.error('读取模板文件时出错:', error);
  process.exit(1);
}

// 编译模板
const template = handlebars.compile(templateSource);

// 分类描述映射
const categoryDescriptions = {
  'action': '动作游戏充满了刺激和挑战，需要玩家快速反应和精确操作，是热爱紧张刺激体验的玩家的首选。',
  'adventure': '冒险游戏让玩家探索未知世界，解决谜题，体验引人入胜的故事情节。',
  'puzzle': '益智游戏挑战您的思维能力，提供各种谜题和逻辑挑战，锻炼大脑并带来满足感。',
  'strategy': '策略游戏要求玩家制定计划，管理资源，做出战术决策来达成目标。',
  'sports': '体育游戏模拟各种运动，让玩家体验竞技乐趣，无论是足球、篮球还是赛车。',
  'rpg': '角色扮演游戏让玩家沉浸在丰富的故事世界中，发展角色并做出影响游戏世界的选择。',
  'simulation': '模拟游戏还原现实世界的各种活动和系统，从城市建设到生活模拟应有尽有。',
  'arcade': '街机游戏提供简单但上瘾的游戏玩法，通常基于获取高分的机制设计。'
};

// 为每个分类生成页面
console.log(`开始生成分类页面...`);

// 检查 siteData 是否包含 categories 属性
if (!siteData || !siteData.categories) {
  console.log('警告: siteData 中没有找到 categories 数据');
  console.log('创建默认分类数据...');
  
  // 如果不存在，创建默认的分类数据结构
  siteData = siteData || {};
  siteData.categories = [
    {
      id: 'action',
      name: '动作游戏',
      description: '包含各种动作元素的游戏',
      games: []
    },
    {
      id: 'puzzle',
      name: '益智游戏',
      description: '测试您的思维能力和解谜技巧的游戏',
      games: []
    }
  ];
  
  // 将现有游戏添加到相应分类中
  if (siteData.games && Array.isArray(siteData.games)) {
    siteData.games.forEach(game => {
      if (game.categories && Array.isArray(game.categories)) {
        game.categories.forEach(categoryId => {
          const category = siteData.categories.find(c => c.id === categoryId);
          if (category) {
            category.games.push(game.id);
          }
        });
      }
    });
  }
}

// 现在可以安全地执行 forEach
siteData.categories.forEach(category => {
  const categoryId = category.id;
  const categoryFileName = `${categoryId}.html`;
  const outputPath = path.join(OUTPUT_DIR, categoryFileName);
  
  // 筛选该分类的游戏
  const categoryGames = gamesData.filter(game => 
    game.categories && game.categories.includes(categoryId)
  );
  
  // 准备模板数据
  const templateData = {
    ...category,
    description: categoryDescriptions[categoryId] || `${category.name}提供各种有趣的游戏体验。`,
    games: categoryGames,
    gamesCount: categoryGames.length,
    ogUrl: `${BASE_URL}/categories/${categoryFileName}`,
    currentYear: new Date().getFullYear()
  };
  
  // 生成HTML
  const html = template(templateData);
  
  // 写入文件
  fs.writeFileSync(outputPath, html);
  console.log(`✓ 已生成分类页面: ${categoryFileName}`);
});

console.log(`分类页面生成完成! 总共生成了 ${siteData.categories.length} 个页面。`);