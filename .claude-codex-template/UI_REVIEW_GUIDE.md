# Codex UI 审阅指南

## 📸 UI 截图审阅功能

Codex 支持 `--image` 参数,可以审阅 UI 截图,提供设计和用户体验建议。

## 🎯 使用场景

1. **UI 设计审阅** - 检查界面布局、配色、间距
2. **响应式检查** - 验证不同屏幕尺寸下的表现
3. **可访问性审核** - 检查对比度、可读性、无障碍性
4. **组件规范** - 验证是否符合设计系统(如 Ant Design)
5. **用户体验** - 评估交互流程和信息架构

## 📋 基础审阅命令

### 单个截图审阅

```bash
codex exec --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  --image "screenshots/homepage.png" \
  --output-last-message "local/review_ui_homepage.txt" \
  "审阅这个主页UI截图

审阅要点:
1. 布局合理性和视觉层次
2. Ant Design 5 设计规范符合度
3. 色彩搭配和对比度
4. 响应式设计考虑
5. 用户体验和交互逻辑

请指出:
- 设计问题和改进建议
- 可访问性问题
- 与 Ant Design 规范的差异" &
```

### 多截图对比审阅

```bash
codex exec --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  --image "screenshots/before.png" \
  --image "screenshots/after.png" \
  --output-last-message "local/review_ui_comparison.txt" \
  "对比这两个版本的UI设计

第一张: 优化前
第二张: 优化后

请分析:
1. 哪些改进有效,哪些可能有问题
2. 用户体验是否提升
3. 进一步优化建议" &
```

## 🎨 Ant Design 5 专项审阅

### 审阅模板

```bash
codex exec --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  --image "screenshots/component.png" \
  --output-last-message "local/review_antd_compliance.txt" \
  "审阅此组件是否符合 Ant Design 5 规范

检查项:
1. 组件选择是否恰当
   - 是否使用了正确的 Ant Design 组件
   - 组件参数配置是否合理

2. 设计令牌(Design Tokens)
   - 间距: 8px 基准网格
   - 圆角: 默认 2px/4px/8px
   - 阴影: 符合 elevation 层级

3. 色彩系统
   - Primary: #1890ff
   - Success: #52c41a
   - Warning: #faad14
   - Error: #ff4d4f
   - Text: rgba(0,0,0,0.85/0.65/0.45)

4. 排版
   - 字体: -apple-system, BlinkMacSystemFont, 'Segoe UI'...
   - 字号: 12px/14px/16px/20px/24px
   - 行高: 1.5715

5. 交互反馈
   - Hover/Active 状态
   - Loading 状态
   - Disabled 状态

输出:
- 不符合规范的地方
- 改进建议和正确实现方式" &
```

## ♿ 可访问性(a11y)审阅

```bash
codex exec --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  --image "screenshots/form.png" \
  --output-last-message "local/review_accessibility.txt" \
  "审阅此表单的可访问性

检查项:
1. 对比度
   - 文本与背景对比度 >= 4.5:1 (普通文本)
   - 大文本对比度 >= 3:1
   - 图标和控件对比度 >= 3:1

2. 表单可用性
   - Label 是否清晰可见
   - 错误提示是否明确
   - 必填标记是否明显

3. 键盘导航
   - Tab 顺序是否合理
   - 焦点状态是否清晰

4. 屏幕阅读器友好
   - 是否需要 aria-label
   - 表单控件是否有描述

5. 色盲友好
   - 不能仅依赖颜色传达信息
   - 是否有图标或文字辅助

输出:
- 可访问性问题清单
- WCAG 2.1 符合程度
- 改进建议" &
```

## 📱 响应式设计审阅

### 多屏幕尺寸审阅

```bash
# 分别截取桌面/平板/手机版本截图后
codex exec --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  --image "screenshots/desktop.png" \
  --image "screenshots/tablet.png" \
  --image "screenshots/mobile.png" \
  --output-last-message "local/review_responsive.txt" \
  "审阅响应式设计

三张截图:
1. 桌面版 (>1200px)
2. 平板版 (768px-1200px)
3. 手机版 (<768px)

检查:
1. 断点设置是否合理
2. 内容重排是否流畅
3. 触摸目标是否足够大 (>=44px)
4. 隐藏/显示内容是否合理
5. 字体大小是否适配

输出:
- 各尺寸问题
- 改进建议
- 最佳实践参考" &
```

## 🔄 完整 UI 审阅工作流

### 1. 准备截图

```bash
# 使用浏览器开发工具或截图工具
# 建议截图:
# - 首屏 (above the fold)
# - 关键交互状态 (hover, active, error)
# - 不同数据状态 (empty, loading, error, success)
mkdir -p screenshots
```

### 2. 执行审阅

```bash
# 全面 UI 审阅
codex exec --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  --image "screenshots/app_home.png" \
  --output-last-message "local/review_ui_full.txt" \
  "全面审阅此应用主页UI

审阅维度:
1. 视觉设计 (30分)
   - 布局和网格系统
   - 色彩和对比度
   - 排版和可读性
   - 留白和视觉层次

2. 交互设计 (25分)
   - 操作流畅性
   - 反馈明确性
   - 状态可见性
   - 错误预防

3. 技术规范 (25分)
   - Ant Design 5 符合度
   - 响应式实现
   - 性能优化
   - 代码可维护性

4. 可访问性 (20分)
   - WCAG 2.1 符合度
   - 键盘导航
   - 屏幕阅读器
   - 色盲友好

评分标准:
- 90-100: 优秀
- 80-89: 良好
- 70-79: 合格
- <70: 需改进

输出格式:
## 总体评分: X/100

## 各维度评分
- 视觉设计: X/30
- 交互设计: X/25
- 技术规范: X/25
- 可访问性: X/20

## 问题清单
### 高优先级 (必须修复)
1. ...

### 中优先级 (建议修复)
1. ...

### 低优先级 (可选优化)
1. ...

## 改进建议
1. ...

## 参考资源
- Ant Design 相关文档链接
- 最佳实践示例" &
```

### 3. 查看结果

```bash
# 等待后台任务完成
cat local/review_ui_full.txt
```

### 4. 根据建议优化

根据 Codex 的反馈修改代码和设计

### 5. 再次审阅(迭代)

重新截图,再次审阅,直到达到满意效果

## 📚 审阅模板库

在 `.claude-codex-template/review_templates/` 创建常用模板:

### ui_component.txt
```
审阅此 {组件名称} 组件

符合性检查:
- Ant Design 5 规范
- React 18 最佳实践
- TypeScript 类型安全

设计检查:
- 布局和间距
- 色彩和对比度
- 交互反馈

输出:
- 问题清单
- 代码改进建议
- UI 优化建议
```

### ui_page.txt
```
审阅此页面完整 UI

检查维度:
1. 信息架构
2. 视觉层次
3. 交互流程
4. 错误处理
5. 加载状态
6. 空状态

输出:
- 用户体验评分
- 问题清单
- 改进建议
```

## ⚠️ 注意事项

1. **截图质量**
   - 使用高分辨率截图 (建议 >= 1920x1080)
   - 保持清晰度,避免压缩失真
   - 截图完整场景,不要裁切关键部分

2. **审阅范围**
   - 单次审阅不要超过 3-5 个截图
   - 每个截图聚焦特定审阅点
   - 避免过于宽泛的审阅请求

3. **结果应用**
   - 高优先级问题立即修复
   - 中优先级问题规划修复
   - 低优先级问题记录备案

4. **迭代优化**
   - 修复后重新截图审阅
   - 保留审阅历史记录
   - 总结最佳实践

## 🎯 成功案例参考

查看 `examples/ui_review_success.txt` 了解成功的 UI 审阅示例。

## 🔗 相关资源

- [Ant Design 5 设计规范](https://ant.design/docs/spec/introduce-cn)
- [WCAG 2.1 可访问性指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design 指南](https://material.io/design)
- [响应式设计最佳实践](https://web.dev/responsive-web-design-basics/)

---

**提示**: 结合代码审阅和 UI 审阅,Codex 可以提供全方位的质量保障!
