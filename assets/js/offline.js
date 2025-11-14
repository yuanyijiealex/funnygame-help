/**
 * funnygame.com 离线功能支持
 * 处理Service Worker注册和离线功能
 */

// 在页面加载完成后注册Service Worker
document.addEventListener('DOMContentLoaded', function() {
  try { if (window.SW_ENABLED !== false) { registerServiceWorker(); } } catch(e) {}
  
  // 向用户显示在线/离线状态变化的通知
  setupOnlineStatusListeners();
  
  // 缓存当前页面以便离线访问
  requestPageCaching();
});

/**
 * 注册Service Worker
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(function(registration) {
        console.log('Service Worker 注册成功，范围: ', registration.scope);
      })
      .catch(function(error) {
        console.log('Service Worker 注册失败: ', error);
      });
  } else {
    console.log('当前浏览器不支持Service Worker');
  }
}

/**
 * 设置在线状态变化监听器
 */
function setupOnlineStatusListeners() {
  // 监听在线状态变化
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // 初始检查
  updateOnlineStatus();
}

/**
 * 更新并通知用户在线状态变化
 */
function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  // Suppress reconnect notification; do nothing when online
  if (isOnline) { return; }
  
  if (typeof showNotification === 'function') {
    if (isOnline) {
      showNotification('网络连接已恢复，您现在可以正常访问所有功能。', 'success');
    } else {
      showNotification('网络连接已断开，您现在处于离线模式，某些功能可能不可用。', 'error');
    }
  } else {
    console.log('在线状态: ' + (isOnline ? '在线' : '离线'));
  }
}

/**
 * 请求缓存当前页面
 */
function requestPageCaching() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // 向Service Worker发送消息，请求缓存当前页面
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_PAGE',
      url: window.location.href
    });
  }
}

/**
 * 显示通知（如果没有定义showNotification函数）
 */
if (typeof showNotification !== 'function') {
  window.showNotification = function(message, type) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'notification ' + (type || 'info');
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    // Stable notification: immediate show (no auto-dismiss)
    // Stable notification: no auto-dismiss

  };
} 



