const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 请求日志记录
app.use((req, res, next) => {
  console.log(`请求: ${req.method} ${req.path}`);
  next();
});

// 静态文件服务 - 仅从public目录提供文件
app.use(express.static(path.join(__dirname, 'public')));

// 处理游戏数据接口
app.get('/data/games.json', (req, res) => {
  const dataPath = path.join(__dirname, 'data', 'games.json');
  if (fs.existsSync(dataPath)) {
    res.sendFile(dataPath);
  } else {
    res.status(404).json({
      error: 'Game data not found'
    });
  }
});

// 处理所有其他路由 - 返回404页面
app.use((req, res) => {
  const offlinePath = path.join(__dirname, 'public', 'offline.html');
  if (fs.existsSync(offlinePath)) {
    res.status(404).sendFile(offlinePath);
  } else {
    res.status(404).send('404 - 页面未找到');
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`FunnyGame.help 服务器运行在 http://localhost:${PORT}`);
  console.log('按 Ctrl+C 停止服务器');
});