# FunnyGame.help - HTML5游戏聚合平台

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/yuanyijiealex/funnygame-help/部署%20FunnyGame.help)
![GitHub last commit](https://img.shields.io/github/last-commit/yuanyijiealex/funnygame-help)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

FunnyGame.help是一个HTML5游戏聚合平台，提供丰富的游戏体验，支持离线模式和多语言。

## 功能特点

- 🎮 精选HTML5游戏，即点即玩
- 🌐 支持中文、英文、西班牙语和法语
- 📱 响应式设计，适配各种设备
- ⚡ PWA技术，支持离线访问
- 💾 本地存储用户偏好和收藏
- 🌙 暗黑/明亮主题切换
- 🔍 强大的游戏搜索功能
- 🎯 个性化游戏推荐

## 技术栈

- 前端：HTML5、CSS3、JavaScript (原生)
- 构建工具：Node.js (游戏页面生成)
- 部署：GitHub Actions、Cloudflare、Spaceship
- 缓存策略：Service Worker + Cloudflare
- 模板引擎：Handlebars.js

## 安装和开发

1. 克隆仓库
```bash
git clone https://github.com/yuanyijiealex/funnygame-help.git
cd funnygame-help
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

4. 生成游戏页面
```bash
npm run generate
```

5. 构建生产版本
```bash
npm run build
```

## 部署流程

本项目采用三层部署架构，确保高可用性和最佳性能：

### 1. GitHub Pages (备用/测试环境)

默认通过GitHub Actions自动部署到GitHub Pages：
```yaml
# 在每次推送到main分支时自动部署
git push origin main
```

### 2. Spaceship (主要生产环境)

Spaceship是我们的主要托管平台，提供更好的性能和定制化：

```bash
# 确保已安装Spaceship CLI
npm install -g @spaceship/cli

# 登录到Spaceship
spaceship login

# 部署项目
spaceship deploy --config spaceship.config.js
```

### 3. Cloudflare (CDN和安全层)

Cloudflare提供CDN加速、安全防护和DNS管理：

1. 在Cloudflare添加域名
2. 设置DNS记录指向Spaceship服务器
3. 配置页面规则和缓存策略

## 环境变量

部署时需要设置以下环境变量：

| 变量名 | 描述 | 必需 |
|-------|------|------|
| SPACESHIP_TOKEN | Spaceship API令牌 | 是 |
| SPACESHIP_APP_ID | Spaceship应用ID | 是 |
| SPACESHIP_IP | Spaceship服务器IP | 是 |
| CLOUDFLARE_EMAIL | Cloudflare账户邮箱 | 是 |
| CLOUDFLARE_API_KEY | Cloudflare API密钥 | 是 |
| CLOUDFLARE_ZONE_ID | Cloudflare区域ID | 是 |
| NOTIFICATION_WEBHOOK | 部署通知Webhook URL | 否 |
| NOTIFICATION_EMAIL | 部署通知邮箱 | 否 |

## 项目结构

```
funnygame-help/
├── data/                 # 游戏数据和模板
├── dist/                 # 构建输出目录
├── public/               # 静态资源
│   ├── assets/           # CSS、JS、图片等
│   ├── games/            # 游戏详情页
│   └── service-worker.js # PWA离线支持
├── scripts/              # 工具脚本
├── .github/              # GitHub配置
├── cloudflare.config.js  # Cloudflare配置
├── spaceship.config.js   # Spaceship配置
└── package.json          # 项目配置
```

## 贡献指南

欢迎贡献代码或提交问题！请遵循以下步骤：

1. Fork本仓库
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m '添加一些很棒的功能'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

## 许可证

本项目采用MIT许可证 - 详见 [LICENSE](LICENSE) 文件。

## 联系方式

项目维护者：[yuanyijiealex](https://github.com/yuanyijiealex)

---

使用❤️制作于中国 