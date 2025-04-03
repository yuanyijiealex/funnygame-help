const fs = require('fs');
const path = require('path');
const https = require('https');

// 确保图标目录存在
const iconDir = path.join(__dirname, 'assets', 'images', 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// 图标尺寸列表
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// 从Favicon.io下载占位图标
function downloadIcon(size) {
  // 使用简单的占位图标服务
  const url = `https://via.placeholder.com/${size}x${size}/4285f4/ffffff?text=FG`;
  const filePath = path.join(iconDir, `icon-${size}x${size}.png`);
  
  const file = fs.createWriteStream(filePath);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`下载完成: icon-${size}x${size}.png`);
    });
  }).on('error', (err) => {
    fs.unlink(filePath);
    console.error(`下载 icon-${size}x${size}.png 失败:`, err.message);
  });
}

// 下载所有尺寸的图标
sizes.forEach(size => downloadIcon(size));

console.log('正在下载图标文件...');