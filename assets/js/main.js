/**
 * 主要JavaScript功能
 * 包括通用UI行为、图片懒加载等
 */

// 当DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 初始化懒加载
  initLazyLoading();
  
  // 初始化黑暗模式
  initDarkMode();
  
  // 初始化移动菜单
  initMobileMenu();
  
  // 更新页脚年份
  updateFooterYear();
});

/**
 * 初始化图片懒加载
 */
function initLazyLoading() {
  // 检查浏览器是否支持IntersectionObserver
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          
          // 如果有data-srcset，也设置srcset
          if (lazyImage.dataset.srcset) {
            lazyImage.srcset = lazyImage.dataset.srcset;
          }
          
          // 加载完成后移除data-src属性
          lazyImage.addEventListener('load', function() {
            lazyImage.removeAttribute('data-src');
            lazyImage.removeAttribute('data-srcset');
            lazyImage.classList.add('loaded');
          });
          
          // 停止观察已加载的图片
          imageObserver.unobserve(lazyImage);
        }
      });
    }, {
      // 图片进入视口前100px开始加载
      rootMargin: '100px 0px'
    });
    
    // 开始观察所有懒加载图片
    lazyImages.forEach(function(lazyImage) {
      imageObserver.observe(lazyImage);
    });
  } else {
    // 不支持IntersectionObserver的回退方案
    loadLazyImagesImmediately();
  }
}

/**
 * 不支持IntersectionObserver时的回退方案
 */
function loadLazyImagesImmediately() {
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  lazyImages.forEach(function(lazyImage) {
    lazyImage.src = lazyImage.dataset.src;
    
    if (lazyImage.dataset.srcset) {
      lazyImage.srcset = lazyImage.dataset.srcset;
    }
    
    lazyImage.addEventListener('load', function() {
      lazyImage.removeAttribute('data-src');
      lazyImage.removeAttribute('data-srcset');
      lazyImage.classList.add('loaded');
    });
  });
}

/**
 * 初始化黑暗模式
 */
function initDarkMode() {
  const themeToggle = document.getElementById('theme-toggle');
  
  if (themeToggle) {
    // 添加点击事件
    themeToggle.addEventListener('click', function() {
      document.documentElement.classList.toggle('dark-mode');
      
      // 保存到本地存储
      const isDarkMode = document.documentElement.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    });
    
    // 检查是否已启用深色模式
    if (localStorage.getItem('darkMode') === 'enabled') {
      document.documentElement.classList.add('dark-mode');
    } else if (localStorage.getItem('darkMode') === null) {
      // 如果未设置，检查系统偏好
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark-mode');
      }
    }
    
    // 监听系统深色模式变化
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (localStorage.getItem('darkMode') === null) {
          if (e.matches) {
            document.documentElement.classList.add('dark-mode');
          } else {
            document.documentElement.classList.remove('dark-mode');
          }
        }
      });
    }
  }
}

/**
 * 初始化移动菜单
 */
function initMobileMenu() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function() {
      document.querySelector('.main-nav').classList.toggle('active');
      this.classList.toggle('active');
      
      // 设置ARIA属性
      const isExpanded = this.classList.contains('active');
      this.setAttribute('aria-expanded', isExpanded);
    });
  }
}

/**
 * 更新页脚年份
 */
function updateFooterYear() {
  const yearElements = document.querySelectorAll('.current-year');
  const currentYear = new Date().getFullYear();
  
  yearElements.forEach(function(element) {
    element.textContent = currentYear;
  });
}