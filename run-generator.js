/**
 * 游戏页面生成脚本包装器
 * 提供错误处理和日志记录
 */

console.log('开始执行游戏页面生成过程...');
console.log('当前工作目录:', process.cwd());

try {
    // 加载并运行生成脚本
    require('./data/templates/generate-game-pages.js');
    console.log('游戏页面生成脚本执行完成');
} catch (error) {
    console.error('游戏页面生成过程中发生错误:');
    console.error(error);
} 