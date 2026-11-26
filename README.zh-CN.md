# Antigravity Skill & MCP Manager（反重力 Skill & MCP 管理面板）

[English](./README.md) | [简体中文](./README.zh-CN.md)

专为 **Google Antigravity（反重力）** 打造的交互式 **MCP App** 管理看板（支持侧边栏 `aux_pane` 与全局 `global` 视图），帮你可视化整理、分类、排序、备注、启停与自动识别本机已安装的 **Skills** 和 **MCP Servers**。

---

## 为什么做这个工具？

当你在 Google Antigravity 里装了几十个 Skill、官方插件和自定义 MCP Server 后，原生列表全平铺在一起，很难记住每个工具的用途。这个项目直接作为 Antigravity 的 MCP App 运行，将你本地的 `~/.gemini/` 环境整理成清晰的群组看板。

## 核心功能

* **中英双语界面（简体中文 / English）**：顶部一键切换 `中 / EN`，也可在设置里保存偏好。
* **功能群组分类 + 同插件二级折叠**：
  * 自动将零散的 Skill 与 MCP 归类到直观的功能群组，拉开群组视觉间距，告别眼花。
  * 同一个插件下的多个 Skill（如 `figma`、`firebase`、`emilkowalski-skills`）会自动再包一层可折叠子群组。
* **拖拽 & `↑` / `↓` 自由调序**：
  * 支持对**分类群组**（分类管理面板内 & 主列表群组标题）、**Skill 卡片**、**MCP 卡片**和**插件子群组**进行拖拽排序或 `↑` / `↓` 上下移动；
  * 支持将卡片**跨群组拖拽**直接改分类。
* **自定义备注 + 默认自带说明**：
  * 未填写自定义备注时，自动展示自带中文/英文功能说明，让你一眼知道每个工具能干嘛；
  * 随时填写个人使用备注，也可一键清空恢复默认说明。
* **新增 MCP / Skill 自动识别**：
  * 同时扫描全局配置 `~/.gemini/config/skills/`、`mcp_config.json`、插件目录 `plugins/*/`、内置技能及 `~/.gemini/antigravity/mcp/` 工具缓存。
  * 发现新接入的 MCP 或 Skill 时自动打上 `🆕` 标记，并根据工具 Schema / `SKILL.md` 自动推断功能群组与说明。
  * 内置 `batch_categorize` 工具，可以直接交给 Antigravity 在对话中帮你批量自动分类。
* **关闭与启用开关**：
  * 一键启停自定义 MCP Server（写入 `mcp_config.json` 的 `disabled` 并自动尝试热刷新）；
  * 一键启停自定义 Skill（安全切换 `SKILL.md` ↔ `SKILL.md.disabled`，停用后仍保留在看板中随时恢复）。
* **个性化设置中心（`⚙️ 设置`）**：
  * 界面语言、卡片密度（紧凑 / 标准 / 舒适）、群组间距（标准 / 宽松）、备注显示行数；
  * 默认视图模式、默认折叠策略、隐藏已关闭项目；
  * 自定义复制/发送的调用词模板（支持 `{{name}}` 占位符）；
  * 聚焦自动扫描、显示/隐藏内置或插件 Skill、额外自定义扫描路径；
  * JSON 配置一键导出、导入与重置。

---

## 在 Google Antigravity 中安装使用

### 1. 克隆仓库并构建

```bash
git clone https://github.com/Thexiaohao/antigravity-skill-mcp-manager.git
cd antigravity-skill-mcp-manager
npm install
npm run build
```

### 2. 添加到 Antigravity 的 MCP 配置

编辑 `~/.gemini/config/mcp_config.json`（将路径替换为你实际的仓库路径）：

```json
{
  "mcpServers": {
    "skill-mcp-manager": {
      "command": "node",
      "args": [
        "/path/to/antigravity-skill-mcp-manager/server.mjs"
      ]
    }
  }
}
```

> Windows 下建议填写 `node.exe` 的完整路径，例如 `C:\\Program Files\\nodejs\\node.exe`。

### 3. 打开面板

* 点击 Antigravity 右侧边栏 `+` 号或左侧全局栏中的 **Skill & MCP 管理**；
* 或在对话中直接让 Antigravity 调用 `open_manager` 打开管理看板。

## 开源协议

[MIT](./LICENSE)
