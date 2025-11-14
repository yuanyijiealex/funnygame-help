# Claude + Codex 协作工作包

## 📦 使用方法

将此文件夹复制到新项目根目录,重命名为 `local/` 即可开始使用。

## 📁 文件结构

```
local/
├── README.md                    # 本说明文件
├── codex_config.toml           # Codex 配置模板
├── workflow.md                  # 协作工作流说明
├── tasks_tracker_template.md   # 任务追踪表模板
├── review_template.md          # 代码审阅请求模板
└── examples/                    # 成功案例
    ├── task_example.txt        # 任务指令示例
    └── review_example.txt      # 审阅请求示例
```

## 🚀 快速开始

### 1. 配置 Codex

将 `codex_config.toml` 内容添加到 `~/.codex/config.toml`:

```toml
[default]
model = "gpt-5"
ask_for_approval = "never"
sandbox = "danger-full-access"
```

### 2. 理解协作模式

**Claude (Max版)** - 主力:
- ✅ 生成主要代码
- ✅ 规划项目结构
- ✅ 编写PR计划

**Codex (Plus版)** - 顾问:
- ✅ 审阅代码质量
- ✅ 提供改进建议
- ✅ 发现潜在问题

### 3. 工作流程

1. Claude 编写代码
2. 启动 Codex 审阅任务
3. 继续编写下一部分(并行工作)
4. 查看 Codex 反馈
5. 根据建议优化代码

## 📋 命令模板

### Claude 启动 Codex 审阅

```bash
cd "项目目录" && codex exec --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  --output-last-message "local/review_输出文件.txt" \
  "请审阅文件 路径/文件名
  
审阅要点:
1. TypeScript 类型定义是否完整和准确
2. React 18 最佳实践
3. 代码质量和命名
4. 潜在bug或边界情况
5. 性能优化建议

请直接给出:
- 发现的问题列表(如果有)
- 具体改进建议
- 修改后的代码(如果需要修改)
"
```

### 后台运行(推荐)

在命令最后添加 `&` 或在 Bash 工具中使用 `run_in_background: true`

## ✅ 验证成功标志

- Codex 能成功读取项目文件
- Codex 能提供具体的代码修改建议
- Claude 能根据建议优化代码

## 🎯 最佳实践

1. **任务粒度**: 单个组件/模块级别
2. **并行工作**: Claude 继续编写,Codex 后台审阅
3. **及时反馈**: 完成一个模块立即审阅
4. **保留记录**: 成功的任务/审阅输出保存为示例

## 📝 注意事项

- ⚠️ Codex 使用 `danger-full-access` 模式才能读取文件
- ⚠️ 任务描述要简洁明确,避免过长
- ⚠️ 审阅请求要具体,明确审阅重点
- ⚠️ 删除失败的历史文件,保持目录整洁

