/**
 * FunnyGame.help Spaceship 部署配置
 */

module.exports = {
  // 应用标识
  appId: process.env.SPACESHIP_APP_ID || 'funnygame-help',
  
  // 部署源目录
  sourceDir: './dist',
  
  // 运行时环境
  runtime: 'static',
  
  // 自定义域名配置
  domain: {
    // 主域名
    main: 'funnygame.help',
    // 额外域名 (可选)
    aliases: ['www.funnygame.help']
  },
  
  // 缓存配置
  cache: {
    // 静态资源缓存时间 (1年)
    assets: 31536000,
    // HTML文件缓存时间 (1小时)
    html: 3600,
    // Service Worker缓存时间 (1天)
    serviceWorker: 86400
  },
  
  // 性能优化
  optimization: {
    // 启用压缩
    compress: true,
    // 启用HTML压缩
    minifyHtml: true,
    // 启用CSS压缩
    minifyCss: true,
    // 启用JavaScript压缩
    minifyJs: true,
    // 图像优化
    images: {
      quality: 85,
      webp: true
    }
  },
  
  // 安全设置
  security: {
    // 启用HTTPS
    https: true,
    // 强制HTTPS重定向
    forceHttps: true,
    // 安全头部设置
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data:; font-src 'self'; connect-src 'self';"
    }
  },
  
  // Cloudflare集成
  cloudflare: {
    // 启用Cloudflare集成
    enabled: true,
    // 区域ID
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    // 缓存级别
    cacheLevel: 'aggressive',
    // 启用自动清除缓存
    purgeCache: true,
    // 启用Cloudflare页面规则
    pageRules: [
      {
        url: '*funnygame.help/*',
        settings: {
          browser_cache_ttl: 14400,
          cache_level: 'cache_everything',
          edge_cache_ttl: 14400
        }
      }
    ]
  },
  
  // 部署钩子
  hooks: {
    // 部署前运行
    beforeDeploy: 'npm run build',
    // 部署后运行
    afterDeploy: 'node scripts/notify-deployment.js'
  }
}; 