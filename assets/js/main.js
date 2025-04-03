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
      // 尝试重新加载图片，使用不带缓存的URL
      const newSrc = img.src.includes('?') ? img.src : img.src + '?t=' + new Date().getTime();
      img.src = newSrc;
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
    // 提前设置样式，避免闪烁
    img.style.display = 'block';
    img.style.visibility = 'visible';
    img.style.opacity = '1';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.minHeight = '150px';
    img.style.background = '#f0f0f0';
    
    // 确保在图片加载失败时显示占位符
    img.onerror = function() {
      console.log('Game image failed to load:', img.src);
      if (!img.src.includes('game-placeholder.svg')) {
        img.src = '/assets/images/game-placeholder.svg';
      }
    };
    
    // 确保图片已经加载
    if (img.complete) {
      if (img.naturalWidth === 0) {
        img.onerror();
      }
    }
  });
  
  // 为所有游戏卡片添加占位符背景
  const gameCards = document.querySelectorAll('.game-card');
  gameCards.forEach(card => {
    card.style.background = '#f9f9f9';
    card.style.borderRadius = '8px';
    card.style.overflow = 'hidden';
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
  // 清除现有可能存在的localStorage语言设置
  localStorage.removeItem('lang');
  
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
  
  // 将确定的语言保存到所有cookie和localStorage中以确保一致性
  if (lang && ['en', 'zh-CN', 'es', 'fr'].includes(lang)) {
    setCookie('lang', lang, 30);
    setCookie('language', lang, 30);
    localStorage.setItem('lang', lang);
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
      
      // 获取当前语言，从cookie中获取而不是localStorage
      const currentLang = getCookie('lang') || 'en';
      
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
        
        // 默认使用英文提示
        let noGamesText = 'No games available';
        
        // 根据语言显示不同的提示，避免硬编码中文
        if (currentLang === 'zh-CN') {
          noGamesText = 'No games available';
          // 从服务器加载翻译后应用正确的文本
          fetch('/assets/js/translations/zh-CN.json')
            .then(response => response.json())
            .then(translations => {
              if (translations['no_games_available']) {
                emptyMessage.textContent = translations['no_games_available'];
              }
            })
            .catch(() => {
              // 翻译加载失败，继续使用默认英文
            });
        } else if (currentLang === 'es') {
          noGamesText = 'No hay juegos disponibles';
        } else if (currentLang === 'fr') {
          noGamesText = 'Pas de jeux disponibles';
        }
        
        // 先设置默认文本
        emptyMessage.textContent = noGamesText;
        
        container.appendChild(emptyMessage);
        return;
      }
      
      // Create game cards
      filteredGames.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        
        // 创建图片元素
        const img = document.createElement('img');
        img.className = 'loading'; // 添加loading类用于样式识别
        
        // 预先设置占位符图片，避免空白
        img.src = '/assets/images/game-placeholder.svg';
        
        // 确保图片路径有效，添加时间戳避免缓存问题
        const timestamp = new Date().getTime();
        const gameImgSrc = game.thumbnail || `/assets/images/games/${game.id}.jpg?t=${timestamp}`;
        
        // 根据当前语言获取游戏标题
        let gameTitle = '';
        if (typeof game.title === 'object') {
          // 如果title是一个包含多语言版本的对象
          gameTitle = game.title[currentLang] || game.title['en'] || Object.values(game.title)[0];
        } else {
          // 如果title是简单字符串
          gameTitle = game.title;
        }
        
        // 设置图片属性
        img.alt = gameTitle;
        img.style.display = 'block';
        img.style.visibility = 'visible';
        img.style.opacity = '1';
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.minHeight = '150px';
        img.style.background = '#f0f0f0';
        
        // 尝试加载真实游戏图片
        const realImg = new Image();
        realImg.onload = function() {
          // 真实图片加载成功，替换显示
          img.src = gameImgSrc;
          img.classList.remove('loading');
        };
        
        realImg.onerror = function() {
          // 真实图片加载失败，保持占位符显示
          console.log('Game image failed to load:', gameImgSrc);
          img.classList.remove('loading');
        };
        
        // 开始加载真实图片
        realImg.src = gameImgSrc;
        
        // 创建游戏标题元素
        const title = document.createElement('p');
        title.textContent = gameTitle;
        title.style.padding = '10px';
        title.style.margin = '0';
        title.style.textAlign = 'center';
        
        // 创建链接元素
        const link = document.createElement('a');
        link.href = `/games/${game.id}.html`;
        link.appendChild(img);
        link.appendChild(title);
        
        // 添加到游戏卡片
        gameCard.appendChild(link);
        container.appendChild(gameCard);
      });
      
      // 在添加游戏卡片后应用图片修复
      fixImageDisplay();
    })
    .catch(error => {
      console.error('Error loading games:', error);
      
      // 获取当前语言
      const currentLang = localStorage.getItem('lang') || 'en';
      
      // 根据语言显示不同的错误消息
      let errorMessage = 'Failed to load game data';
      if (currentLang === 'zh-CN') {
        errorMessage = '加载游戏数据失败';
      } else if (currentLang === 'es') {
        errorMessage = 'Error al cargar datos del juego';
      } else if (currentLang === 'fr') {
        errorMessage = 'Échec du chargement des données de jeu';
      }
      
      // 显示错误信息
      container.innerHTML = `<div class="error-message">${errorMessage}</div>`;
    });
}

/**
 * Apply translations to the page
 */
function applyTranslations(translations) {
  // Set the language attribute on the html element
  document.documentElement.lang = currentLang;
  
  // 获取所有需要翻译的元素
  const elements = document.querySelectorAll('[data-translate]');
  
  // 遍历每个元素并应用翻译
  elements.forEach(element => {
    const key = element.getAttribute('data-translate');
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });
  
  // 翻译占位符文本
  const elementsWithPlaceholders = document.querySelectorAll('[data-translate-placeholder]');
  elementsWithPlaceholders.forEach(element => {
    const key = element.getAttribute('data-translate-placeholder');
    if (translations[key]) {
      element.placeholder = translations[key];
    }
  });
  
  // 翻译页面标题
  if (translations['page_title']) {
    document.title = translations['page_title'];
  }
}

// Load Featured Games
function loadFeaturedGames() {
  fetch('/assets/data/featured-games.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(games => {
      displayGames(games, 'featured-games-container', 6);
    })
    .catch(error => {
      console.error('Error loading featured games:', error);
      document.getElementById('featured-games-container').innerHTML = '<p>Error loading games</p>';
    });
}

// Load New Games
function loadNewGames() {
  fetch('/assets/data/new-games.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(games => {
      displayGames(games, 'new-games-container', 6);
    })
    .catch(error => {
      console.error('Error loading new games:', error);
      document.getElementById('new-games-container').innerHTML = '<p>Error loading games</p>';
    });
}

// Load Popular Games
function loadPopularGames() {
  fetch('/assets/data/popular-games.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(games => {
      displayGames(games, 'popular-games-container', 6);
    })
    .catch(error => {
      console.error('Error loading popular games:', error);
      document.getElementById('popular-games-container').innerHTML = '<p>Error loading games</p>';
    });
}

// Display games in a container
function displayGames(games, containerId, limit = -1) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  let filteredGames = games;
  if (limit > 0 && games.length > limit) {
    filteredGames = games.slice(0, limit);
  }
  
  if (filteredGames.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    
    // Default to English message
    let noGamesText = 'No games available';
    
    // Use translated message if available
    if (currentLang && translations[currentLang]) {
      if (translations[currentLang].no_games_available) {
        noGamesText = translations[currentLang].no_games_available;
      }
    }
    
    emptyMessage.textContent = noGamesText;
    container.appendChild(emptyMessage);
    return;
  }

  // ... existing code ...
}