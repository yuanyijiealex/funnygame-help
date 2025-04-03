const fs = require('fs');
const path = require('path');
const https = require('https');

// favicon保存路径
const faviconPath = path.join(__dirname, 'favicon.ico');

// 从一个简单图标服务下载favicon
const url = 'https://www.google.com/favicon.ico'; // 使用一个已知的小图标作为示例

console.log('正在下载favicon.ico...');

const file = fs.createWriteStream(faviconPath);
https.get(url, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log(`favicon.ico已下载并保存到: ${faviconPath}`);
  });
}).on('error', (err) => {
  fs.unlink(faviconPath);
  console.error(`下载favicon.ico失败:`, err.message);
});