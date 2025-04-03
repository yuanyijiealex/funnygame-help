/**
 * FunnyGame.help main JavaScript file
 * Handles common functionality across the website
 */

// Initialize on DOM loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeLanguageSelector();
  initializeMobileMenu();
  updateCurrentYear();
  fixImageDisplay();
});

/**
 * 修复图片显示问题
 */
function fixImageDisplay() {
  // 修复所有国旗图标
  const flagImages = document.querySelectorAll('img[src*="/assets/images/flags/"]');
  flagImages.forEach(img => {
    img.onerror = function() {
      // 图像加载失败时，设置错误状态
      console.log('Flag image failed to load:', img.src);
      img.classList.add('load-error');
    };
    
    // 设置样式确保可见
    img.style.display = 'inline-block';
    img.style.visibility = 'visible';
    img.style.opacity = '1';
    img.style.maxWidth = 'none';
    img.style.objectFit = 'cover';
    img.style.border = '1px solid #ddd';
  });
  
  // 修复所有游戏缩略图
  const gameImages = document.querySelectorAll('img[src*="/assets/images/games/"]');
  gameImages.forEach(img => {
    img.onerror = function() {
      // 图像加载失败时，替换为通用图片
      console.log('Game image failed to load:', img.src);
      img.src = '/assets/images/game-placeholder.svg';
    };
    
    // 设置样式确保可见
    img.style.display = 'block';
    img.style.visibility = 'visible';
    img.style.opacity = '1';
  });
}

/**
 * Language selector functionality
 */
function initializeLanguageSelector() {
  const langSelectorBtn = document.getElementById('language-selector-btn');
  const langDropdown = document.getElementById('language-dropdown');
  
  if (!langSelectorBtn || !langDropdown) return;
  
  const langOptions = document.querySelectorAll('.language-option');
  
  // Toggle language dropdown
  langSelectorBtn.addEventListener('click', function(event) {
    event.stopPropagation();
    langDropdown.classList.toggle('active');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    if (!langSelectorBtn.contains(event.target) && !langDropdown.contains(event.target)) {
      langDropdown.classList.remove('active');
    }
  });
  
  // Language selection
  langOptions.forEach(option => {
    option.addEventListener('click', function() {
      const lang = this.getAttribute('data-lang');
      const langImg = this.querySelector('img').getAttribute('src');
      const langText = this.querySelector('span').textContent;
      
      // 设置 cookies 以确保兼容性
      setCookie('lang', lang, 30);
      setCookie('language', lang, 30);
      
      // Update button display
      langSelectorBtn.querySelector('img').setAttribute('src', langImg);
      langSelectorBtn.querySelector('span').textContent = lang === 'zh-CN' ? 'CN' : lang.toUpperCase();
      
      // Close dropdown
      langDropdown.classList.remove('active');
      
      // 记录语言切换操作
      console.log('语言已切换:', lang);
      
      // 带上查询参数重新加载页面以避免缓存问题
      window.location.href = window.location.href.split('?')[0] + '?lang=' + lang;
    });
  });
  
  // Load language based on cookie or browser language
  loadSelectedLanguage();
}

/**
 * Mobile menu functionality
 */
function initializeMobileMenu() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  
  if (!mobileMenuToggle) return;
  
  const navLinks = document.querySelector('.nav-links');
  
  mobileMenuToggle.addEventListener('click', function() {
    navLinks.classList.toggle('active');
    mobileMenuToggle.classList.toggle('active');
  });
}

/**
 * Update the current year in the footer
 */
function updateCurrentYear() {
  const currentYearElement = document.getElementById('current-year');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
}

/**
 * Set a cookie with expiration days
 */
function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + value + expires + '; path=/';
}

/**
 * Get a cookie value by name
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

/**
 * Load the selected language
 */
function loadSelectedLanguage() {
  // 优先检查URL参数中的语言设置
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  
  // 检查所有可能的cookie名称
  const langCookie = getCookie('lang');
  const languageCookie = getCookie('language');
  
  // 确定使用的语言，优先级：URL > lang cookie > language cookie > 默认英文
  // 将默认语言修改为英文，不再使用浏览器语言
  const userLang = urlLang || langCookie || languageCookie || 'en';
  const lang = userLang.substring(0, 2) === 'zh' ? 'zh-CN' : userLang.substring(0, 2);
  
  // 将确定的语言保存到所有cookie中以确保一致性
  if (lang && ['en', 'zh-CN', 'es', 'fr'].includes(lang)) {
    setCookie('lang', lang, 30);
    setCookie('language', lang, 30);
  }
  
  // Update language selector UI
  const langSelector = document.getElementById('language-selector-btn');
  if (langSelector && ['en', 'zh-CN', 'es', 'fr'].includes(lang)) {
    const flagImg = `/assets/images/flags/${lang === 'zh-CN' ? 'cn' : lang}.png`;
    langSelector.querySelector('img').setAttribute('src', flagImg);
    langSelector.querySelector('span').textContent = lang === 'zh-CN' ? 'CN' : lang.toUpperCase();
  }
  
  // 如果不是英文，则加载并应用翻译
  if (lang !== 'en' && ['zh-CN', 'es', 'fr'].includes(lang)) {
    loadTranslations(lang);
  } else if (lang === 'en') {
    // 如果是英文，确保所有元素显示英文内容（防止之前的中文状态）
    // 将页面的lang属性设置为en
    document.documentElement.lang = 'en';
  }
}

/**
 * Load translations from JSON file and apply to the page
 */
function loadTranslations(lang) {
  fetch(`/assets/js/translations/${lang}.json`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Translation file not found');
      }
      return response.json();
    })
    .then(translations => {
      // 设置页面的语言属性
      document.documentElement.lang = lang;
      
      // 应用翻译到所有带有data-translate属性的元素
      document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[key]) {
          element.textContent = translations[key];
          
          // 如果元素是输入框，也更新placeholder
          if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
            element.setAttribute('placeholder', translations[key]);
          }
          
          // 如果元素是链接，也更新title属性
          if (element.tagName === 'A' && element.hasAttribute('title')) {
            element.setAttribute('title', translations[key]);
          }
        }
      });
      
      // 对于元素内部的文本节点，也应用翻译
      document.querySelectorAll('[data-translate-content]').forEach(element => {
        const key = element.getAttribute('data-translate-content');
        if (translations[key]) {
          element.innerHTML = translations[key];
        }
      });
      
      console.log(`页面已翻译为 ${lang}`);
    })
    .catch(error => {
      console.error('Error loading translations:', error);
    });
}

/**
 * Load games for the homepage
 */
function loadGames(containerId, category) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  fetch('/assets/data/games.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load games data');
      }
      return response.json();
    })
    .then(data => {
      let filteredGames = [];
      
      // Filter games based on category
      if (category === 'featured') {
        filteredGames = data.filter(game => game.isFeatured).slice(0, 6);
      } else if (category === 'new') {
        filteredGames = data.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate)).slice(0, 6);
      } else if (category === 'popular') {
        filteredGames = data.sort((a, b) => b.playCount - a.playCount).slice(0, 6);
      } else {
        filteredGames = data.filter(game => game.categories && game.categories.includes(category)).slice(0, 6);
      }
      
      // 清空容器
      container.innerHTML = '';
      
      // 如果没有游戏，显示提示信息
      if (filteredGames.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = '暂无游戏';
        container.appendChild(emptyMessage);
        return;
      }
      
      // Create game cards
      filteredGames.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        
        // 确保图片路径有效
        const imgSrc = game.thumbnail || `/assets/images/games/${game.id}.jpg`;
        
        gameCard.innerHTML = `
          <a href="/games/${game.id}.html">
            <img src="${imgSrc}" alt="${game.title}" 
                 onerror="this.onerror=null; this.src='/assets/images/game-placeholder.svg';"
                 style="display: block; visibility: visible; opacity: 1;">
            <p>${game.title}</p>
          </a>
        `;
        container.appendChild(gameCard);
      });
      
      // 在添加游戏卡片后应用图片修复
      fixImageDisplay();
    })
    .catch(error => {
      console.error('Error loading games:', error);
      // 显示错误信息
      container.innerHTML = '<div class="error-message">加载游戏数据失败</div>';
    });
}