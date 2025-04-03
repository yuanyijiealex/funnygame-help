/**
 * FunnyGame.help 部署脚本
 * 用于准备项目上线，优化文件并生成生产环境版本
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const config = {
  // 源目录
  sourceDir: path.join(__dirname, 'public'),
  // 构建输出目录
  outputDir: path.join(__dirname, 'dist'),
  // 需要压缩的文件类型
  compressExtensions: ['.js', '.css', '.html'],
  // 需要复制的静态资源
  staticAssets: ['assets/images', 'assets/fonts', 'favicon.ico', 'manifest.json'],
  // 构建版本号
  buildVersion: new Date().toISOString().replace(/[-:.]/g, '')
};

// 主函数
async function deploy() {
  try {
    console.log('🚀 开始部署 FunnyGame.help...');
    console.log(`📅 构建版本: ${config.buildVersion}`);
    
    // 1. 清理旧的构建目录
    cleanOutputDir();
    
    // 2. 复制所有文件到构建目录
    await copyFiles();
    
    // 3. 优化HTML、CSS和JavaScript文件
    await optimizeFiles();
    
    // 4. 更新Service Worker缓存版本
    await updateServiceWorker();
    
    // 5. 创建部署报告
    createDeployReport();
    
    console.log('✅ 部署准备完成！');
    console.log(`📂 构建输出目录: ${config.outputDir}`);
    
  } catch (error) {
    console.error('❌ 部署失败:', error);
    process.exit(1);
  }
}

// 清理输出目录
function cleanOutputDir() {
  console.log('🧹 清理构建目录...');
  
  if (fs.existsSync(config.outputDir)) {
    fs.removeSync(config.outputDir);
  }
  
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// 复制文件到构建目录
async function copyFiles() {
  console.log('📋 复制文件到构建目录...');
  
  // 复制整个public目录
  await fs.copy(config.sourceDir, config.outputDir);
  
  console.log('📦 基础文件复制完成');
}

// 优化文件
async function optimizeFiles() {
  console.log('⚡ 优化文件...');
  
  // 获取所有HTML、CSS和JS文件
  const files = getAllFiles(config.outputDir, config.compressExtensions);
  
  for (const file of files) {
    await optimizeFile(file);
  }
  
  console.log(`🔧 已优化 ${files.length} 个文件`);
}

// 更新Service Worker
async function updateServiceWorker() {
  console.log('🔄 更新Service Worker...');
  
  const swPath = path.join(config.outputDir, 'service-worker.js');
  
  if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8');
    
    // 更新缓存版本
    swContent = swContent.replace(
      /const CACHE_NAME = ['"].*?['"]/,
      `const CACHE_NAME = 'funnygame-cache-v${config.buildVersion}'`
    );
    
    fs.writeFileSync(swPath, swContent);
    console.log('✅ Service Worker 缓存版本已更新');
  } else {
    console.warn('⚠️ 未找到Service Worker文件');
  }
}

// 创建部署报告
function createDeployReport() {
  console.log('📊 创建部署报告...');
  
  const reportPath = path.join(config.outputDir, 'deploy-report.json');
  const report = {
    buildVersion: config.buildVersion,
    buildDate: new Date().toISOString(),
    fileCount: countFiles(config.outputDir),
    totalSize: getTotalSize(config.outputDir)
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('📝 部署报告已生成');
}

// 辅助函数 - 获取目录下所有指定扩展名的文件
function getAllFiles(dir, extensions) {
  let results = [];
  
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, extensions));
    } else {
      const ext = path.extname(filePath).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// 辅助函数 - 优化单个文件
async function optimizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf8');
  let optimizedContent = content;
  
  // 简单的压缩优化（实际项目中可以使用专业工具如terser, cssnano等）
  if (ext === '.js') {
    // 移除注释和多余空白
    optimizedContent = optimizedContent
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // 移除注释
      .replace(/^\s*\n/gm, '') // 移除空行
      .replace(/\s{2,}/g, ' '); // 压缩多余空格
  } else if (ext === '.css') {
    // 压缩CSS
    optimizedContent = optimizedContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
      .replace(/\s*([{}:;,])\s*/g, '$1') // 移除选择器周围的空白
      .replace(/;\}/g, '}') // 移除最后的分号
      .replace(/^\s*\n/gm, ''); // 移除空行
  } else if (ext === '.html') {
    // 压缩HTML
    optimizedContent = optimizedContent
      .replace(/<!--(?!<!)[^\[>].*?-->/g, '') // 移除HTML注释
      .replace(/\s{2,}/g, ' ') // 压缩多余空格
      .replace(/>\s+</g, '><'); // 移除标签之间的空白
  }
  
  fs.writeFileSync(filePath, optimizedContent);
}

// 辅助函数 - 计算文件数量
function countFiles(dir) {
  let count = 0;
  
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      count += countFiles(filePath);
    } else {
      count++;
    }
  });
  
  return count;
}

// 辅助函数 - 计算目录总大小
function getTotalSize(dir) {
  let size = 0;
  
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      size += getTotalSize(filePath);
    } else {
      size += stat.size;
    }
  });
  
  return size;
}

// 执行部署
deploy(); 