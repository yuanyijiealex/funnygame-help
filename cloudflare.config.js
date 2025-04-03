/**
 * FunnyGame.help Cloudflare 配置
 */

module.exports = {
  // Cloudflare账户相关信息
  account: {
    // 这些值应从环境变量读取，不要硬编码敏感信息
    email: process.env.CLOUDFLARE_EMAIL,
    apiKey: process.env.CLOUDFLARE_API_KEY,
    zoneId: process.env.CLOUDFLARE_ZONE_ID
  },
  
  // DNS配置
  dns: {
    // 域名
    domain: 'funnygame.help',
    // 记录
    records: [
      {
        type: 'A',
        name: '@',
        content: process.env.SPACESHIP_IP || '192.0.2.1', // 使用Spaceship服务器IP
        ttl: 1, // 自动TTL
        proxied: true // 启用Cloudflare代理
      },
      {
        type: 'A',
        name: 'www',
        content: process.env.SPACESHIP_IP || '192.0.2.1',
        ttl: 1,
        proxied: true
      },
      {
        type: 'CNAME',
        name: 'api',
        content: 'api.spaceship.app', // Spaceship API地址
        ttl: 1,
        proxied: true
      }
    ]
  },
  
  // Cloudflare页面规则
  pageRules: [
    {
      // 为HTML页面设置较短的缓存时间以确保更新及时可见
      target: '*.funnygame.help/*.html',
      actions: {
        cache_level: 'basic',
        edge_cache_ttl: 3600,
        browser_cache_ttl: 3600
      }
    },
    {
      // 为静态资源设置更长的缓存时间
      target: '*.funnygame.help/assets/*',
      actions: {
        cache_level: 'cache_everything',
        edge_cache_ttl: 2592000, // 30天
        browser_cache_ttl: 2592000
      }
    },
    {
      // Service Worker特殊处理
      target: '*.funnygame.help/service-worker.js',
      actions: {
        cache_level: 'bypass',
        browser_cache_ttl: 0
      }
    }
  ],
  
  // Cloudflare Workers
  workers: {
    // 重定向工作器
    redirects: {
      routes: [
        { pattern: 'funnygame.help/', script: "redirectToWww" }
      ],
      scripts: {
        redirectToWww: `
          addEventListener('fetch', event => {
            event.respondWith(handleRequest(event.request))
          })
          
          async function handleRequest(request) {
            const url = new URL(request.url)
            if (url.hostname === 'funnygame.help') {
              url.hostname = 'www.funnygame.help'
              return Response.redirect(url.toString(), 301)
            }
            return fetch(request)
          }
        `
      }
    },
    
    // 缓存控制工作器
    cacheControl: {
      routes: [
        { pattern: '*.funnygame.help/*', script: "cacheControl" }
      ],
      scripts: {
        cacheControl: `
          addEventListener('fetch', event => {
            event.respondWith(handleRequest(event.request))
          })
          
          async function handleRequest(request) {
            const response = await fetch(request)
            const url = new URL(request.url)
            
            let newResponse = new Response(response.body, response)
            
            // 安全头部设置
            newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')
            newResponse.headers.set('X-Content-Type-Options', 'nosniff')
            newResponse.headers.set('X-XSS-Protection', '1; mode=block')
            newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
            
            return newResponse
          }
        `
      }
    }
  },
  
  // Cloudflare SSL/TLS配置
  ssl: {
    mode: 'full_strict', // 使用完全严格模式
    minimumTlsVersion: '1.2', // 最低TLS版本
    alwaysUseHttps: true // 始终使用HTTPS
  },
  
  // 防火墙设置
  firewall: {
    // 安全级别
    securityLevel: 'medium',
    // 启用浏览器完整性检查
    browserCheck: true,
    // 启用机器人攻击防护
    botFight: true,
    // 设置国家访问控制(可选)
    // countryBlocks: ['CN', 'US']
  },
  
  // 缓存设置
  cache: {
    // 缓存级别
    cacheLevel: 'aggressive',
    // 浏览器缓存TTL(秒)
    browserTtl: 14400,
    // 清除缓存的文件
    purgeFiles: [
      'https://www.funnygame.help/',
      'https://www.funnygame.help/index.html',
      'https://www.funnygame.help/service-worker.js'
    ]
  }
}; 