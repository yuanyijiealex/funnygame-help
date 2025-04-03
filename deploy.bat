@echo off
ECHO ===================================
ECHO FunnyGame.help 部署流程
ECHO ===================================
ECHO.

ECHO [1/6] 创建部署目录...
IF NOT EXIST "dist" mkdir dist
IF NOT EXIST "dist\games" mkdir dist\games
IF NOT EXIST "dist\assets" mkdir dist\assets
IF NOT EXIST "dist\assets\css" mkdir dist\assets\css
IF NOT EXIST "dist\assets\js" mkdir dist\assets\js
IF NOT EXIST "dist\assets\images" mkdir dist\assets\images
IF NOT EXIST "dist\assets\fonts" mkdir dist\assets\fonts

ECHO [2/6] 复制HTML文件...
COPY "public\*.html" "dist\"
COPY "public\games\*.html" "dist\games\"
COPY "public\offline.html" "dist\"
COPY "public\favorites.html" "dist\"

ECHO [3/6] 复制资源文件...
ECHO 复制CSS文件...
COPY "public\assets\css\*.css" "dist\assets\css\"
ECHO 复制JS文件...
COPY "public\assets\js\*.js" "dist\assets\js\"
ECHO 复制translations文件夹...
IF NOT EXIST "dist\assets\js\translations" mkdir dist\assets\js\translations
COPY "public\assets\js\translations\*.json" "dist\assets\js\translations\"
ECHO 复制图像文件...
COPY "public\assets\images\*.svg" "dist\assets\images\"
COPY "public\assets\images\*.png" "dist\assets\images\"
COPY "public\assets\images\*.jpg" "dist\assets\images\"
ECHO 复制字体文件...
COPY "public\assets\fonts\*.*" "dist\assets\fonts\"

ECHO [4/6] 复制PWA相关文件...
COPY "public\service-worker.js" "dist\"
COPY "public\manifest.json" "dist\"
COPY "public\favicon.ico" "dist\"
COPY "public\*.png" "dist\"
COPY "public\sw-test.html" "dist\"

ECHO [5/6] 更新Service Worker版本...
ECHO // 更新缓存版本号... > temp.js
ECHO const today = new Date(); >> temp.js
ECHO const version = 'v' + today.getFullYear() + (today.getMonth()+1) + today.getDate() + today.getHours() + today.getMinutes(); >> temp.js
ECHO const fs = require('fs'); >> temp.js
ECHO if (fs.existsSync('dist/service-worker.js')) { >> temp.js
ECHO   const swContent = fs.readFileSync('dist/service-worker.js', 'utf8'); >> temp.js
ECHO   const updatedContent = swContent.replace(/funnygame-cache-v\d+/, 'funnygame-cache-' + version); >> temp.js
ECHO   const versionUpdatedContent = updatedContent.replace(/SW_VERSION = ['"].*?['"]/, `SW_VERSION = '${version}'`); >> temp.js
ECHO   fs.writeFileSync('dist/service-worker.js', versionUpdatedContent); >> temp.js
ECHO   console.log('Service Worker 版本已更新到: ' + version); >> temp.js
ECHO } else { >> temp.js
ECHO   console.log('警告: 未找到 service-worker.js 文件'); >> temp.js
ECHO } >> temp.js
node temp.js
DEL temp.js

ECHO [6/6] 生成部署报告...
ECHO { > "dist\build-info.json"
ECHO   "buildDate": "%DATE% %TIME%", >> "dist\build-info.json"
ECHO   "version": "1.0.0", >> "dist\build-info.json"
ECHO   "serviceWorkerVersion": "%version%", >> "dist\build-info.json"
ECHO   "deployedBy": "%USERNAME%" >> "dist\build-info.json"
ECHO } >> "dist\build-info.json"

ECHO ===================================
ECHO 部署完成！文件已输出到 dist 目录
ECHO ===================================

ECHO.
ECHO 您现在可以：
ECHO 1. 将 dist 目录中的文件上传到您的Web服务器
ECHO 2. 使用 firebase deploy 或其他部署工具
ECHO 3. 直接在本地测试: npx serve dist
ECHO 4. 测试Service Worker: http://localhost:3000/sw-test.html
ECHO.

PAUSE 