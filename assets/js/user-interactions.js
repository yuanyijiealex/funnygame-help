/**
 * 用户互动功能
 * 包括游戏收藏、评分、评论等功能
 */

// 当DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 初始化收藏功能
  initFavorites();
  
  // 初始化评分功能
  initRatings();
  
  // 初始化评论功能
  initComments();
  
  // 初始化游戏游玩记录
  initGamePlayTracking();
});

/**
 * 初始化收藏功能
 */
function initFavorites() {
  const favoriteButtons = document.querySelectorAll('.favorite-button');
  
  // 加载用户收藏数据
  const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
  
  favoriteButtons.forEach(button => {
    const gameId = button.dataset.gameId;
    
    // 设置初始状态
    if (gameId && favorites[gameId]) {
      button.classList.add('active');
      button.setAttribute('aria-label', '取消收藏');
      button.querySelector('.favorite-text').textContent = '已收藏';
    }
    
    // 添加点击事件
    button.addEventListener('click', function(event) {
      event.preventDefault();
      
      // 切换收藏状态
      if (button.classList.contains('active')) {
        // 取消收藏
        button.classList.remove('active');
        button.setAttribute('aria-label', '添加到收藏');
        button.querySelector('.favorite-text').textContent = '收藏';
        delete favorites[gameId];
        showNotification('游戏已从收藏中移除');
      } else {
        // 添加收藏
        button.classList.add('active');
        button.setAttribute('aria-label', '取消收藏');
        button.querySelector('.favorite-text').textContent = '已收藏';
        
        // 获取游戏信息
        const gameTitle = document.querySelector('.game-title').textContent;
        const gameThumbnail = document.querySelector('meta[property="og:image"]').getAttribute('content');
        const gameUrl = window.location.pathname;
        
        // 保存游戏信息
        favorites[gameId] = {
          id: gameId,
          title: gameTitle,
          thumbnail: gameThumbnail,
          url: gameUrl,
          dateAdded: new Date().toISOString()
        };
        
        showNotification('游戏已添加到收藏');
      }
      
      // 保存到localStorage
      localStorage.setItem('favorites', JSON.stringify(favorites));
    });
  });
}

/**
 * 初始化评分功能
 */
function initRatings() {
  const ratingStars = document.querySelectorAll('.rating-stars');
  
  ratingStars.forEach(container => {
    const gameId = container.dataset.gameId;
    const stars = container.querySelectorAll('.rating-star');
    const ratingValue = container.querySelector('.rating-value');
    const ratingCount = container.querySelector('.rating-count');
    
    // 加载用户评分
    const ratings = JSON.parse(localStorage.getItem('ratings') || '{}');
    const userRating = gameId && ratings[gameId] ? ratings[gameId].value : 0;
    
    // 设置初始状态
    if (userRating > 0) {
      updateStars(userRating);
    }
    
    // 为每个星星添加事件
    stars.forEach((star, index) => {
      // 鼠标悬停效果
      star.addEventListener('mouseenter', () => {
        updateStars(index + 1, 'hover');
      });
      
      // 鼠标离开效果
      star.addEventListener('mouseleave', () => {
        updateStars(userRating > 0 ? userRating : 0, 'normal');
      });
      
      // 点击评分
      star.addEventListener('click', () => {
        const newRating = index + 1;
        
        // 保存评分
        if (!ratings[gameId]) {
          ratings[gameId] = { value: 0 };
        }
        
        // 如果用户点击的是当前评分，则取消评分
        if (ratings[gameId].value === newRating) {
          ratings[gameId].value = 0;
          updateStars(0);
          showNotification('评分已取消');
        } else {
          ratings[gameId].value = newRating;
          ratings[gameId].date = new Date().toISOString();
          updateStars(newRating);
          showNotification(`已评分: ${newRating} 星`);
        }
        
        // 保存到localStorage
        localStorage.setItem('ratings', JSON.stringify(ratings));
        
        // 更新显示的评分数量
        updateRatingDisplay();
        
        // 如果有API，发送评分到服务器
        // sendRatingToServer(gameId, newRating);
      });
    });
    
    /**
     * 更新星星显示
     * @param {number} count - 亮起的星星数
     * @param {string} mode - 显示模式 ('normal' 或 'hover')
     */
    function updateStars(count, mode = 'normal') {
      stars.forEach((star, index) => {
        if (index < count) {
          star.classList.add('active');
          if (mode === 'hover') {
            star.classList.add('hover');
          } else {
            star.classList.remove('hover');
          }
        } else {
          star.classList.remove('active', 'hover');
        }
      });
    }
    
    /**
     * 更新评分显示
     */
    function updateRatingDisplay() {
      // 这里只是一个前端演示，通常需要从服务器获取实际数据
      const currentValue = parseFloat(ratingValue.textContent);
      const currentCount = parseInt(ratingCount.textContent);
      const userRatingValue = ratings[gameId]?.value || 0;
      
      // 简单模拟一个评分更新（实际中应从服务器获取）
      if (userRatingValue > 0) {
        // 假设新增一个评分，简单平均
        const newCount = currentCount + (ratings[gameId].isNew ? 1 : 0);
        const newValue = ((currentValue * currentCount) + userRatingValue) / (newCount || 1);
        
        ratingValue.textContent = newValue.toFixed(1);
        if (ratings[gameId].isNew) {
          ratingCount.textContent = newCount;
          ratings[gameId].isNew = false;
        }
      }
    }
  });
}

/**
 * 初始化评论功能
 */
function initComments() {
  const commentForm = document.querySelector('.comment-form');
  const commentsList = document.querySelector('.comments-list');
  
  if (!commentForm || !commentsList) return;
  
  const gameId = commentForm.dataset.gameId;
  
  // 加载评论
  loadComments();
  
  // 提交评论
  commentForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const nameInput = commentForm.querySelector('input[name="name"]');
    const messageInput = commentForm.querySelector('textarea[name="message"]');
    
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!name || !message) {
      showNotification('请填写您的名字和评论内容', 'error');
      return;
    }
    
    // 创建新评论
    const comment = {
      id: Date.now(),
      gameId: gameId,
      name: name,
      message: message,
      date: new Date().toISOString()
    };
    
    // 保存评论
    saveComment(comment);
    
    // 清空表单
    nameInput.value = '';
    messageInput.value = '';
    
    // 重新加载评论
    loadComments();
    
    showNotification('评论已提交，感谢您的参与！');
  });
  
  /**
   * 加载评论
   */
  function loadComments() {
    // 获取评论数据
    let comments = JSON.parse(localStorage.getItem('comments') || '[]');
    
    // 筛选当前游戏的评论
    comments = comments.filter(comment => comment.gameId === gameId);
    
    // 按日期排序，最新的在前
    comments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 清空评论列表
    commentsList.innerHTML = '';
    
    if (comments.length === 0) {
      // 无评论提示
      commentsList.innerHTML = `
        <div class="no-comments">
          <p>暂无评论。成为第一个发表评论的人吧！</p>
        </div>
      `;
      return;
    }
    
    // 渲染评论
    comments.forEach(comment => {
      const date = new Date(comment.date);
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      
      const commentElement = document.createElement('div');
      commentElement.className = 'comment-item';
      commentElement.innerHTML = `
        <div class="comment-header">
          <span class="comment-author">${escapeHTML(comment.name)}</span>
          <span class="comment-date">${formattedDate}</span>
        </div>
        <div class="comment-content">
          <p>${escapeHTML(comment.message)}</p>
        </div>
      `;
      
      commentsList.appendChild(commentElement);
    });
  }
  
  /**
   * 保存评论
   * @param {Object} comment - 评论对象
   */
  function saveComment(comment) {
    let comments = JSON.parse(localStorage.getItem('comments') || '[]');
    comments.push(comment);
    localStorage.setItem('comments', JSON.stringify(comments));
  }
  
  /**
   * 转义HTML，防止XSS攻击
   * @param {string} text - 需要转义的文本
   * @returns {string} 转义后的文本
   */
  function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * 初始化游戏游玩记录
 */
function initGamePlayTracking() {
  // 获取当前游戏ID
  const gameId = document.querySelector('[data-game-id]')?.dataset.gameId || 
                 window.location.pathname.split('/').pop().replace('.html', '');
  
  // 游戏iframe或游戏元素
  const gameElement = document.querySelector('.game-frame') || document.getElementById('game-container');
  
  if (gameElement && gameId) {
    // 记录游戏开始游玩
    function recordGamePlay() {
      // 获取本地存储中的游戏记录
      let playedGames = JSON.parse(localStorage.getItem('playedGames') || '{}');
      
      // 更新当前游戏的游玩次数和最后游玩时间
      if (!playedGames[gameId]) {
        playedGames[gameId] = { count: 0, lastPlayed: null };
      }
      
      playedGames[gameId].count += 1;
      playedGames[gameId].lastPlayed = new Date().toISOString();
      
      // 保存回本地存储
      localStorage.setItem('playedGames', JSON.stringify(playedGames));
      
      console.log(`游戏 ${gameId} 游玩次数已记录`);
      
      // 显示一个小提示
      showNotification('游戏开始！祝您玩得愉快');
    }
    
    // 为游戏元素添加点击或互动事件监听器
    gameElement.addEventListener('click', function() {
      // 检查是否已经记录过（避免多次记录）
      if (!gameElement.dataset.playRecorded) {
        recordGamePlay();
        gameElement.dataset.playRecorded = 'true';
      }
    });
    
    // 如果是iframe，也可以在iframe加载时记录
    if (gameElement.tagName === 'IFRAME') {
      gameElement.addEventListener('load', function() {
        if (!gameElement.dataset.playRecorded) {
          recordGamePlay();
          gameElement.dataset.playRecorded = 'true';
        }
      });
    }
  }
}

/**
 * 显示通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 (default, success, error)
 */
function showNotification(message, type = 'default') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: ${type === 'error' ? '#f44336' : '#333'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s, transform 0.3s;
  `;
  document.body.appendChild(notification);
  
  // 显示通知
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);
  
  // 3秒后隐藏通知
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    
    // 动画结束后移除元素
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}