const fs = require('fs');
const path = require('path');
const https = require('https');

// 确保图片目录存在
const imageDir = path.join(__dirname, 'assets', 'images');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// 下载关于我们的图片
const url = 'https://via.placeholder.com/800x400/4285f4/ffffff?text=关于我们';
const filePath = path.join(imageDir, 'about-us.jpg');

const file = fs.createWriteStream(filePath);
https.get(url, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('下载完成: about-us.jpg');
  });
}).on('error', (err) => {
  fs.unlink(filePath);
  console.error('下载 about-us.jpg 失败:', err.message);
});

console.log('正在下载关于我们图片...');