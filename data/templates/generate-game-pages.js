const fs = require('fs');
const path = require('path');

// 文件路径配置
const TEMPLATE_PATH = path.join(__dirname, 'game-template.html');
const GAMES_DATA_PATH = path.join(__dirname, '..', 'games-utf8.json');
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'public', 'games');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`创建输出目录: ${OUTPUT_DIR}`);
}

// 读取模板文件
let template;
try {
    template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    console.log('模板文件加载成功');
} catch (err) {
    console.error('无法读取模板文件:', err);
    process.exit(1);
}

// 读取游戏数据
let games;
try {
    const gamesData = fs.readFileSync(GAMES_DATA_PATH, 'utf8');
    games = JSON.parse(gamesData);
    console.log(`加载了 ${games.length} 个游戏数据`);
} catch (err) {
    console.error('无法读取游戏数据:', err);
    process.exit(1);
}

// 处理每个游戏
games.forEach(game => {
    console.log(`正在处理游戏: ${game.title} (ID: ${game.id})`);
    
    // 创建特性列表HTML
    let featuresHTML = '';
    if (game.features && game.features.length > 0) {
        game.features.forEach((feature, index) => {
            const colors = ['text-primary-red', 'text-primary-blue', 'text-accent-yellow'];
            const color = colors[index % colors.length];
            
            featuresHTML += `
                <div class="feature-card">
                    <h3 class="text-xl font-semibold ${color} mb-3" data-translate="feature_${feature.toLowerCase().replace(/\s+/g, '_')}">${feature}</h3>
                    <p data-translate="feature_${feature.toLowerCase().replace(/\s+/g, '_')}_desc">享受${feature}带来的优势</p>
                </div>`;
        });
    }
    
    // 创建键盘控制HTML
    let keyboardControlsHTML = '';
    if (game.controls) {
        Object.entries(game.controls).forEach(([key, action]) => {
            keyboardControlsHTML += `
                <li><span class="font-semibold">${key}:</span> <span data-translate="control_${key.toLowerCase().replace(/\s+/g, '_')}">${action}</span></li>`;
        });
    }
    
    // 创建移动设备控制HTML
    let mobileControlsHTML = '';
    if (game.isMobileCompatible) {
        mobileControlsHTML = `
            <li><span class="font-semibold">触摸屏幕:</span> <span data-translate="control_touch">点击进行操作</span></li>
            <li><span class="font-semibold">滑动:</span> <span data-translate="control_swipe">在屏幕上滑动以移动</span></li>`;
    }
    
    // 创建截图HTML
    let screenshotsHTML = '';
    if (game.screenshots && game.screenshots.length > 0) {
        game.screenshots.forEach((screenshot, index) => {
            const imgPath = screenshot;
            const webpPath = screenshot.replace('.jpg', '.webp');
            
            screenshotsHTML += `
                <div class="bg-white p-2 rounded-lg shadow">
                    <div class="screenshot-container">
                        <div class="screenshot-placeholder">游戏截图 ${index + 1}</div>
                        <picture>
                            <source srcset="${webpPath}" type="image/webp">
                            <img src="${imgPath}" alt="${game.title} 截图" 
                                 loading="lazy" onload="this.style.opacity='1'" style="opacity:0;transition:opacity 0.3s">
                        </picture>
                    </div>
                </div>`;
        });
    } else {
        // 如果没有截图，创建三个占位符
        for (let i = 0; i < 3; i++) {
            screenshotsHTML += `
                <div class="bg-white p-2 rounded-lg shadow">
                    <div class="screenshot-container">
                        <div class="screenshot-placeholder">游戏截图 ${i + 1} (尚未提供)</div>
                    </div>
                </div>`;
        }
    }
    
    // 创建相似游戏HTML
    let similarGamesHTML = '';
    if (game.similarGames && game.similarGames.length > 0) {
        game.similarGames.forEach(similarGameId => {
            const similarGame = games.find(g => g.id === similarGameId);
            if (similarGame) {
                similarGamesHTML += `
                    <div class="game-card">
                        <a href="/games/${similarGame.id}.html" class="block">
                            <div class="relative overflow-hidden rounded-lg">
                                <picture>
                                    <source srcset="${similarGame.thumbnail.replace('.jpg', '.webp')}" type="image/webp">
                                    <img src="${similarGame.thumbnail}" alt="${similarGame.title}" class="w-full h-40 object-cover transition-transform duration-300 hover:scale-110">
                                </picture>
                            </div>
                            <h3 class="mt-2 font-medium text-center">${similarGame.title}</h3>
                        </a>
                    </div>`;
            }
        });
    }
    
    // 创建游戏类型JSON字符串
    const gameGenres = game.categories ? game.categories.map(cat => `"${cat}"`).join(', ') : '';
    
    // 替换模板中的占位符
    let gameHTML = template
        .replace(/{{GAME_ID}}/g, game.id)
        .replace(/{{GAME_TITLE}}/g, game.title)
        .replace(/{{GAME_DESCRIPTION}}/g, game.description)
        .replace(/{{GAME_TAGLINE}}/g, game.description.split('，')[0] + '！')
        .replace(/{{GAME_DESCRIPTION_P1}}/g, game.longDescription ? game.longDescription.split('。')[0] + '。' : game.description)
        .replace(/{{GAME_DESCRIPTION_P2}}/g, game.longDescription ? game.longDescription.substring(game.longDescription.indexOf('。') + 1) : '')
        .replace(/{{EMBED_URL}}/g, game.embedUrl || `/assets/games/${game.id}/index.html`)
        .replace(/{{FEATURES_LIST}}/g, featuresHTML)
        .replace(/{{KEYBOARD_CONTROLS}}/g, keyboardControlsHTML)
        .replace(/{{MOBILE_CONTROLS}}/g, mobileControlsHTML)
        .replace(/{{SCREENSHOTS}}/g, screenshotsHTML)
        .replace(/{{SIMILAR_GAMES}}/g, similarGamesHTML)
        .replace(/{{GAME_GENRES}}/g, gameGenres);
    
    // 保存生成的HTML文件
    const outputPath = path.join(OUTPUT_DIR, `${game.id}.html`);
    try {
        fs.writeFileSync(outputPath, gameHTML);
        console.log(`成功生成游戏页面: ${outputPath}`);
    } catch (err) {
        console.error(`生成游戏页面失败 ${game.id}:`, err);
    }
});

console.log(`所有游戏页面生成完成! 共生成 ${games.length} 个页面`); 