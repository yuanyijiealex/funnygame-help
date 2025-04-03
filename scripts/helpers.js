/**
 * 共享的 Handlebars 辅助函数
 */

// 注册所有辅助函数到 Handlebars 实例
function registerHelpers(handlebars) {
  // 乘法辅助函数
  handlebars.registerHelper('multiply', function(a, b) {
    return a * b;
  });

  // 日期格式化辅助函数
  handlebars.registerHelper('formatDate', function(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  });

  // 数字格式化辅助函数
  handlebars.registerHelper('formatNumber', function(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  });

  // WebP路径生成辅助函数
  handlebars.registerHelper('webpPath', function(jpgPath) {
    if (typeof jpgPath !== 'string') return '';
    return jpgPath.replace(/\.jpg$/i, '.webp');
  });
}

module.exports = { registerHelpers };