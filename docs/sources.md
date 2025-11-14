游戏信息源备忘（funnygame.help）

主要已用来源
- Internet Archive（MS-DOS/老游戏平台）
  - 形态: https://archive.org/embed/<identifier>
  - 支持：scripts/fetch-game-covers.ps1 自动封面（services/img → __ia_thumb.jpg → metadata），页面 og:image 指向本地封面。
- OnlineGames.io（云托管 Unity/HTML5）
  - 示例: https://cloud.onlinegames.io/games/.../index-og.html
  - 多数可 iframe；封面通常需自备（本地 jpg/png/svg 或 Wikipedia 兜底）。
- GameMonetize / GameDistribution / Lagged
  - 第三方分发平台，部分域名限制跨域或注入广告；需逐条验证。
  - 工具: tools/embed-test.html 可检测 reachability + iframe 基本可用性。

流程/脚本
- 批量新增：scripts/bulk_add_from_csv.ps1（模板见 scripts/bulk-template.csv）
- 抓取封面：scripts/fetch-game-covers.ps1（Archive） / scripts/fetch-covers-wikipedia.ps1（维基兜底）
- 缩略图规范化：scripts/normalize-thumbnails.ps1（占位图改为本地路径）
- 去重与跳转：scripts/dedupe-games.ps1 -WriteRedirects（同款仅保留一条）

推荐流程（大量上架）
1) 准备 CSV → 2) 批量新增 → 3) 抓取封面 → 4) 规范缩略图 → 5) 去重与跳转 → 6) 提交推送
