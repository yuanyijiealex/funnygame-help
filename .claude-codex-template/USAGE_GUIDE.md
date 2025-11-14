# Claude + Codex 协作包使用指南

## 📦 复制到新项目

```bash
# 方法1: 直接复制
cp -r /path/to/.claude-codex-template /path/to/new-project/local

# 方法2: 在新项目中
cd /path/to/new-project
mkdir local
cp -r /path/to/.claude-codex-template/* local/
```

## ✅ 第一次使用前的检查清单

### 1. 配置 Codex (首次使用)

```bash
# 查看当前配置
cat ~/.codex/config.toml

# 如果没有配置文件,创建它
mkdir -p ~/.codex
cat > ~/.codex/config.toml << 'CONF'
[default]
model = "gpt-5"
ask_for_approval = "never"
sandbox = "danger-full-access"
CONF
```

### 2. 验证 Codex 能读取文件

```bash
cd your-project
codex exec --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  "读取 README.md 并总结其内容"
```

✅ **成功标志**: Codex 能正确输出 README 内容摘要  
❌ **失败标志**: 提示权限错误或无法读取文件

### 3. 测试简单审阅任务

创建测试文件:
```bash
echo "export const test = () => console.log('test');" > test.ts
```

启动审阅:
```bash
codex exec --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  "审阅 test.ts 文件,指出可以改进的地方"
```

## 🚀 实际工作流程

### 步骤 1: Claude 编写代码

```markdown
我(Claude)编写组件 `src/components/MyComponent.tsx`:
- 完整的 TypeScript 类型
- React 18 最佳实践
- 清晰的注释
```

### 步骤 2: 启动 Codex 后台审阅

```bash
codex exec --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  --output-last-message "local/review_MyComponent.txt" \
  "请审阅 src/components/MyComponent.tsx
  
重点:
1. TypeScript 类型完整性
2. React 18 最佳实践
3. 性能优化建议
4. 潜在bug

输出:
- 问题列表
- 具体建议
- 修改后代码(如需要)" &
```

### 步骤 3: Claude 继续编写下一个模块

(Codex 在后台运行,Claude 不等待,继续工作)

### 步骤 4: 查看 Codex 反馈

```bash
# 检查审阅是否完成
cat local/review_MyComponent.txt
```

### 步骤 5: Claude 根据建议优化

根据 Codex 的建议修改代码,提升质量。

## 📋 命令速查表

### 基础审阅命令

```bash
# 后台运行(推荐)
cd project && codex exec --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  --output-last-message "local/review_output.txt" \
  "审阅指令" &

# 前台运行(等待结果)
cd project && codex exec --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  "审阅指令"
```

### 审阅指令模板

```text
请审阅文件 <文件路径>

审阅要点:
1. <要点1>
2. <要点2>
3. <要点3>

请直接给出:
- 发现的问题列表(如果有)
- 具体改进建议
- 修改后的代码(如果需要修改)
```

## ⚠️ 常见问题

### Q1: Codex 卡在 thinking 阶段不动

**原因**: 
- 沙箱模式是 `read-only` 无法读取文件
- 任务描述过长导致规划循环

**解决**:
- 确保使用 `--dangerously-bypass-approvals-and-sandbox`
- 简化任务描述,控制在 30 行内

### Q2: Codex 提示权限错误

**原因**: 配置文件中沙箱模式不是 `danger-full-access`

**解决**:
```bash
# 检查配置
cat ~/.codex/config.toml

# 确保包含
[default]
sandbox = "danger-full-access"
```

### Q3: Claude 如何查看 Codex 输出

**方法**:
```bash
# 方法1: 使用 BashOutput 工具查看后台任务
# (Claude 会自动提示)

# 方法2: 读取输出文件
cat local/review_output.txt
```

### Q4: 如何停止 Codex 任务

```bash
# 查找进程
ps aux | grep codex

# 停止进程
kill <进程ID>

# 或在 Claude 中使用 KillShell 工具
```

## 🎯 最佳实践总结

1. **任务粒度**: 单个组件/模块级别,不要整个功能
2. **并行工作**: 启动审阅后继续编写,不要等待
3. **简洁指令**: 审阅要求控制在 20-30 行
4. **及时反馈**: 完成一个模块立即审阅
5. **保留记录**: 成功的审阅输出保存到 examples/

## 📖 进阶技巧

### 批量审阅多个文件

```bash
for file in src/components/*.tsx; do
  codex exec --dangerously-bypass-approvals-and-sandbox \
    --skip-git-repo-check \
    --output-last-message "local/review_$(basename $file).txt" \
    "审阅 $file" &
done
```

### 自定义审阅模板

在 `local/` 目录创建 `review_templates/`:
```bash
mkdir -p local/review_templates
cat > local/review_templates/react_component.txt << 'TEMPLATE'
请审阅 React 组件 {FILE_PATH}

重点检查:
1. TypeScript 类型定义
2. React 18 Hooks 使用
3. 性能优化(memo, useCallback)
4. 无障碍性(aria-labels)
5. 错误边界处理

输出格式:
- 问题列表
- 改进建议
- 优化后代码
TEMPLATE
```

---

**需要帮助?** 查看 `examples/` 目录中的成功案例!
