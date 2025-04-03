// 缓存名称 - 更新版本号会强制更新缓存
const CACHE_NAME = 'funnygame-cache-v6';

// 需要缓存的核心资源
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/favorites.html',
  '/offline.html',
  '/assets/css/style.css',
  '/assets/css/fix-screenshots.css',
  '/assets/js/main.js',
  '/assets/js/user-interactions.js',
  '/assets/js/offline.js',
  '/assets/js/translations.js',
  '/assets/images/logo.svg',
  '/assets/images/game-placeholder.svg',
  '/assets/images/screenshot-placeholder.svg',
  '/assets/fonts/webfonts/fa-solid-900.woff2',
  '/assets/css/fontawesome.min.css',
];

// 安装事件处理程序 - 缓存核心资源
self.addEventListener('install', event => {
  console.log('[Service Worker] 安装');
  
  // 强制新的Service Worker立即接管
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] 缓存核心资源');
      return cache.addAll(CORE_ASSETS);
    })
  );
});

// 激活事件处理程序 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] 声明控制权');
      return self.clients.claim();
    })
  );
});

// 监听来自网页的消息
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'cachePage') {
    const pageUrl = event.data.url || self.location.href;
    console.log('[Service Worker] 收到缓存页面请求:', pageUrl);
    
    // 缓存当前页面
    caches.open(CACHE_NAME).then(cache => {
      cache.add(pageUrl).then(() => {
        console.log('[Service Worker] 成功缓存页面:', pageUrl);
      }).catch(err => {
        console.error('[Service Worker] 缓存页面失败:', err);
      });
    });
  }
});

// 拦截网络请求事件处理程序
self.addEventListener('fetch', event => {
  // 只处理GET请求
  if (event.request.method !== 'GET') return;
  
  // 提取URL
  const requestUrl = new URL(event.request.url);
  
  // 优先从网络获取（网络优先策略）
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 如果网络请求成功，复制响应并存入缓存
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 网络请求失败，尝试从缓存获取
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              // 如果在缓存中找到匹配的响应，返回缓存的响应
              return cachedResponse;
            }
            
            // 如果是导航请求（HTML页面），返回离线页面
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // 对于其他资源（如图片、脚本等），无法提供替代
            return new Response('资源不可用', {
              status: 503,
              statusText: '服务不可用'
            });
          });
      })
  );
});

console.log('[简化Service Worker] 脚本已加载 - 版本4');