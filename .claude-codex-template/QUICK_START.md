# 🚀 5分钟快速开始

## 复制模板到新项目

```bash
cp -r .claude-codex-template /path/to/new-project/local
cd /path/to/new-project/local
```

## 验证 Codex 配置

```bash
cat ~/.codex/config.toml
```

应该包含:
```toml
[default]
model = "gpt-5"
ask_for_approval = "never"
sandbox = "danger-full-access"
```

如果没有,运行:
```bash
mkdir -p ~/.codex && cat > ~/.codex/config.toml << 'CONF'
[default]
model = "gpt-5"
ask_for_approval = "never"
sandbox = "danger-full-access"
CONF
```

## 第一个协作任务

### 1. Claude 编写代码

创建文件 `src/Hello.tsx`:
```typescript
export const Hello = () => <div>Hello World</div>;
```

### 2. 启动 Codex 审阅(后台)

```bash
cd your-project && codex exec \
  --dangerously-bypass-approvals-and-sandbox \
  --skip-git-repo-check \
  --output-last-message "local/review_Hello.txt" \
  "请审阅 src/Hello.tsx,给出改进建议" &
```

### 3. Claude 继续工作

(不等待,继续编写其他代码)

### 4. 查看 Codex 反馈

```bash
cat local/review_Hello.txt
```

### 5. 根据建议优化

修改代码,完成!

## 🎯 核心记忆点

1. **始终使用** `--dangerously-bypass-approvals-and-sandbox`
2. **后台运行** 命令末尾加 `&`
3. **简洁任务** 描述控制在 30 行内
4. **并行工作** Claude 写代码 + Codex 审阅同时进行

## 📚 详细文档

- `README.md` - 完整功能说明
- `USAGE_GUIDE.md` - 详细使用指南
- `examples/` - 成功案例参考

---

**遇到问题?** 查看 `USAGE_GUIDE.md` 中的常见问题部分!
