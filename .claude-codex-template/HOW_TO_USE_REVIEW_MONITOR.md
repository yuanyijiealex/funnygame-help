# 🤖 GPT审核监控系统 - 快速使用指南

## 问题背景

**之前**: Claude提交PR后,需要**手动等待**GPT审核,容易遗漏反馈
**现在**: 自动轮询监控GPT的审核报告,实时通知需要处理的问题

---

## 🚀 快速开始

### 1. 单次检查(推荐日常使用)
```bash
cd D:\编程代码\招商助手
python scripts/check_gpt_reviews.py
```

**适用场景**:
- 刚提交PR后,想看看GPT是否已审核
- 定期检查是否有遗漏的审核反馈

### 2. 持续监控(推荐长时间开发)
```bash
# 在单独的终端窗口运行
cd D:\编程代码\招商助手
python scripts/check_gpt_reviews.py --poll
```

**适用场景**:
- 一整天的开发工作
- 提交了多个PR,等待审核
- 想要第一时间收到审核通知

---

## 📊 输出解读

### 情况1: 没有新审核
```
🔍 开始检查GPT审核反馈 (2025-10-08 10:00:00)
✅ 没有新的审核报告
```
**含义**: 当前没有新的GPT审核,继续开发或等待

### 情况2: 有新审核 - 已批准
```
============================================================
🔔 GPT审核反馈通知
============================================================

检测到 1 个新的审核报告:

📄 RV_PR008_20251008.md
   PR: PR-008
   决策: APPROVED ✅
   问题统计: P0=0, P1=0, P2=2
   路径: pr-inbox/reviews/RV_PR008_20251008.md

------------------------------------------------------------

✅ 所有审核已通过或仅有建议

============================================================
```
**含义**: PR-008已通过审核,可以合并!
**行动**:
1. 阅读审核报告中的P2建议(可选优化)
2. 将PR移到pr-accepted/
3. 合并到主分支

### 情况3: 有新审核 - 需要修改 ⚠️
```
============================================================
🔔 GPT审核反馈通知
============================================================

检测到 1 个新的审核报告:

📄 RV_PR007_20251008.md
   PR: PR-007
   决策: CHANGES_REQUESTED ❌
   问题统计: P0=1, P1=3, P2=5
   ⚠️  需要立即处理!
   路径: pr-inbox/reviews/RV_PR007_20251008.md

------------------------------------------------------------

🚨 紧急: 1 个PR需要立即修复!

============================================================

📋 已创建行动提醒: pr-inbox/ACTION_REQUIRED.json
```
**含义**: PR-007有严重问题,必须修复!
**行动**:
1. 打开审核报告: `pr-inbox/reviews/RV_PR007_20251008.md`
2. 查看P0问题(必须修复)
3. 查看P1问题(强烈建议修复)
4. 修复代码
5. 更新PR
6. 等待GPT复审

---

## 🎯 自动生成的文件

### ACTION_REQUIRED.json
当有需要处理的审核时自动生成:

```json
{
  "timestamp": "2025-10-08T10:30:00",
  "urgent_count": 1,
  "actions": [
    {
      "pr_id": "PR-007",
      "review_file": "pr-inbox/reviews/RV_PR007_20251008.md",
      "decision": "CHANGES_REQUESTED",
      "p0_count": 1,
      "p1_count": 3
    }
  ]
}
```

**用途**:
- Claude可以直接读取这个文件获取待办事项
- 可集成到IDE或任务管理工具

---

## ⚙️ 配置

### 修改检查间隔
```bash
# Windows
set REVIEW_CHECK_INTERVAL=120
python scripts/check_gpt_reviews.py --poll

# Linux/macOS
export REVIEW_CHECK_INTERVAL=120
python scripts/check_gpt_reviews.py --poll
```

默认: 300秒(5分钟)
推荐:
- 开发中: 120-300秒(2-5分钟)
- 休息时: 600-1800秒(10-30分钟)

---

## 💡 使用技巧

### 技巧1: 双终端工作流
```
终端1 (Claude Code):        终端2 (监控):
┌─────────────────┐         ┌─────────────────┐
│ $ claude        │         │ $ python        │
│                 │         │   scripts/      │
│ > 开发代码       │         │   check_gpt_    │
│ > 提交PR         │         │   reviews.py    │
│ > 等待审核...    │         │   --poll        │
│                 │         │                 │
│                 │         │ ✅ 没有新审核    │
│                 │         │ 🔔 检测到审核!  │
│ > 收到通知!      │◄────────┤ ⚠️ 需要修复    │
│ > 开始修复       │         │                 │
└─────────────────┘         └─────────────────┘
```

### 技巧2: 批量PR提交后监控
```bash
# 提交多个PR
claude submit PR-007
claude submit PR-008
claude submit PR-009

# 启动监控,等待GPT批量审核
python scripts/check_gpt_reviews.py --poll
```

### 技巧3: 重置状态重新检测
```bash
# 删除状态文件,重新检测所有审核
rm .workflow_state/last_review_check.json

# 再次检查
python scripts/check_gpt_reviews.py
```

---

## 🔧 故障排除

### Q: 脚本提示"没有新审核",但我知道GPT已经审核了
**A**:
1. 检查审核报告文件名格式: `RV_PR<编号>_*.md`
2. 确认文件在 `pr-inbox/reviews/` 目录
3. 尝试重置状态: `rm .workflow_state/last_review_check.json`

### Q: Windows下emoji显示乱码
**A**:
1. 使用Windows Terminal而不是cmd
2. 或者修改脚本,移除emoji(文本功能不受影响)

### Q: 想要邮件/微信通知
**A**:
在 `create_action_reminder()` 函数中添加通知接口:
```python
# 发送邮件
send_email(f"紧急: {len(action_items)} 个PR需要修复")

# 发送企业微信
send_wechat_work(summary)
```

---

## 📈 工作流集成

### 完整开发流程

```
1. Claude开发功能
   ↓
2. Claude提交PR到pr-inbox/
   ↓
3. 启动监控: python scripts/check_gpt_reviews.py --poll
   ↓
4. GPT审核,创建 pr-inbox/reviews/RV_*.md
   ↓
5. 监控脚本检测到新审核 ✅
   ↓
6. 生成通知和ACTION_REQUIRED.json
   ↓
7. Claude读取审核报告
   ↓
8. Claude修复问题(如有)
   ↓
9. 更新PR,等待复审
   ↓
10. 审核通过,移到pr-accepted/
   ↓
11. 合并到主分支 🎉
```

---

## 🎉 总结

### 优势
✅ **永不遗漏**: 自动检测所有新审核
✅ **实时通知**: 第一时间知道审核结果
✅ **优先级明确**: 自动标注紧急事项
✅ **可追溯**: 保留检查历史
✅ **可扩展**: 易于集成通知系统

### 推荐用法
- **日常开发**: 单次检查模式
- **批量PR**: 持续监控模式
- **CI/CD**: Cron定时检查

---

**开始使用,让GPT审核反馈来得更及时! 🚀**
