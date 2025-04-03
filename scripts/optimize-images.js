const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 图像资源目录
const IMAGE_DIR = path.join(__dirname, '../public/assets/images');

// 检查sharp-cli是否已安装
function checkSharpInstalled() {
  return new Promise((resolve) => {
    exec('sharp --version', (error) => {
      resolve(!error);
    });
  });
}

// 优化单个图像
function optimizeImage(imagePath) {
  return new Promise((resolve, reject) => {
    // 原始格式优化
    const jpgCommand = `sharp --input="${imagePath}" --output="${imagePath}" --quality=80`;
    
    // WebP 转换
    const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const webpCommand = `sharp --input="${imagePath}" --output="${webpPath}" --format=webp --quality=75`;
    
    // 首先执行原始格式优化
    exec(jpgCommand, (error) => {
      if (error) {
        console.error(`优化图像失败: ${imagePath}`);
        reject(error);
        return;
      }
      
      // 然后转换为 WebP
      exec(webpCommand, (webpError) => {
        if (webpError) {
          console.error(`WebP 转换失败: ${imagePath}`);
          // 即使 WebP 转换失败，我们仍然认为原始优化是成功的
          resolve();
        } else {
          console.log(`✓ 优化并转换为 WebP: ${path.basename(imagePath)}`);
          resolve();
        }
      });
    });
  });
}

// 递归查找所有图像文件
function findAllImages(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    console.log(`目录不存在: ${dir}`);
    return fileList;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findAllImages(filePath, fileList);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 主函数
async function optimizeImages() {
  console.log('开始优化图像资源...');
  
  // 检查sharp-cli是否已安装
  const isSharpInstalled = await checkSharpInstalled();
  
  if (!isSharpInstalled) {
    console.log('需要安装sharp-cli工具进行图像优化...');
    console.log('请运行: npm install -g sharp-cli');
    return;
  }
  
  // 创建图像目录（如果不存在）
  if (!fs.existsSync(IMAGE_DIR)) {
    console.log(`创建图像目录: ${IMAGE_DIR}`);
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
  }
  
  // 查找所有图像
  const images = findAllImages(IMAGE_DIR);
  
  if (images.length === 0) {
    console.log('没有找到需要优化的图像。');
    return;
  }
  
  console.log(`找到 ${images.length} 个图像文件需要优化...`);
  
  // 优化所有图像
  let successCount = 0;
  let errorCount = 0;
  
  for (const imagePath of images) {
    try {
      await optimizeImage(imagePath);
      successCount++;
    } catch (error) {
      console.error(`优化 ${imagePath} 时出错: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('图像优化完成!');
  console.log(`成功优化: ${successCount} 个图像`);
  if (errorCount > 0) {
    console.log(`失败: ${errorCount} 个图像`);
  }
  
  // 更新HTML模板以支持WebP（可选）
  console.log('\n提示: 为了充分利用WebP图像，请确保您的HTML模板包含<picture>元素:');
  console.log(`
  <picture>
    <source srcset="/assets/images/example.webp" type="image/webp">
    <img src="/assets/images/example.jpg" alt="描述">
  </picture>
  `);
}

// 执行主函数
optimizeImages().catch(error => {
  console.error('图像优化过程中发生错误:', error);
  process.exit(1);
});

// 导出函数（可选，用于从其他脚本调用）
module.exports = {
  optimizeImages,
  findAllImages,
  optimizeImage
};