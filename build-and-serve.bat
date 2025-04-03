@echo off
echo === FunnyGame.help 游戏站构建与启动 ===
cd /d %~dp0

echo.
echo 1. 生成游戏页面...
node run-generator.js

echo.
echo 2. 启动服务器...
node server.js

echo.
echo 如果服务器启动失败，请检查server.js文件是否存在。
echo 按任意键退出...
pause > nul 