待办清单（批量上架与后续完善）

已确认目标
- 本批次上架数量：50 个（优先现代/可嵌入的新游戏，老的公开资料可后续）

待确认参数（请在下次继续前勾选/补充）
- 来源域名（默认优先）：
  - cloud.onlinegames.io（OnlineGames.io 云端）
  - html5.gamemonetize.com（GameMonetize）
  - html5.gamedistribution.com（GameDistribution）
  - 其他（itch.io 仅限作者允许嵌入 / archive.org 作补充批次）
- 过滤策略：排除成人/赌博等敏感类目（默认：排除）
- 类目优先级：action > racing > platformer > puzzle > others（可调整）

下一步计划（恢复后按序执行）
1) 实现 GameMonetize 抓取脚本 scripts/harvest-gamemonetize.ps1
   - 从 https://gamemonetize.com/sitemap.xml 拉取条目
   - 解析详情页中的 <iframe src="https://html5.gamemonetize.com/...">
   - 抽取标题/封面（og:title/og:image），生成 CSV（字段同 scripts/bulk-template.csv）
   - 目标输出：temp/gamemonetize.csv（首批 50 条）

2)（可选）修复 OnlineGames 抓取器 scripts/harvest-onlinegames.ps1
   - 当前命中率低（很多详情页无 cloud index-og），需要补充兼容路径/列表页抓取
   - 若稳定后，作为第二批补充来源

3) 执行批量导入流水线（基于 CSV）
   - 执行：pwsh -File scripts/bulk_add_from_csv.ps1 -CsvPath temp/gamemonetize.csv

4) 抓取与规范封面
   - Archive 源：pwsh -File scripts/fetch-game-covers.ps1
   - 兜底维基：pwsh -File scripts/fetch-covers-wikipedia.ps1（必要时 -OnlyId 精准补齐）
   - 规范占位：pwsh -File scripts/normalize-thumbnails.ps1

5) 去重与跳转（同款仅保留一个）
   - 执行：pwsh -File scripts/dedupe-games.ps1 -WriteRedirects

6) 发布与验证
   - 自动推送（post-commit 已开启）→ GitHub Actions Pages 部署
   - 前台检查：/index.html、/featured-games.html、/new-games.html 等页面是否显示缩略图与分类

7) 后续完善（可并行）
   - harvest-onlinegames.ps1：使用更稳健解析（DOM/宽松匹配）
   - 新增来源解析器：GameDistribution、itch.io（仅允许嵌入）
   - 自动分类：标题/标签词映射到站内 categories
   - 封面脚本增强：支持更多平台 og:image / poster 推断
   - 批量 iframe 验证：扩展 tools/embed-test.html 加批量按钮
