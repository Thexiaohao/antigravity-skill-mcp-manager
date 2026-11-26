# Antigravity Skill & MCP Manager

[English](./README.md) | [简体中文](./README.zh-CN.md)

An interactive **MCP App** built specifically for **Google Antigravity** (`aux_pane` side panel & `global` full-page view) to visually organize, categorize, reorder, annotate, enable/disable, and auto-discover all your installed **Skills** and **MCP Servers**.

---

## Why This Exists

Once you install dozens of Skills, Plugins, and MCP Servers in Google Antigravity, finding the right one or remembering what each tool does becomes tedious. This MCP App mounts directly inside Antigravity and turns your local `~/.gemini/` setup into a clean, categorized workspace.

## Features

* **Bilingual UI (English / 简体中文)**: Switch between English and Chinese with a single click (`中 / EN`) or in Settings.
* **Functional Category Groups & Nested Plugin Folding**:
  * Organizes Skills & MCPs into clear functional groups instead of one flat list.
  * Automatically collapses items from the same Plugin into a secondary folder (e.g., `🧩 figma (17)`), keeping the panel scannable.
* **Drag-and-Drop Reordering**:
  * Reorder **Categories** (in Category Manager or directly on group headers).
  * Reorder **Skills**, **MCP Servers**, and **Plugin Subgroups** via drag-and-drop — and drag cards across groups to re-categorize them.
* **Custom Notes + Built-in Default Descriptions**:
  * Shows helpful default descriptions automatically if you haven't written a custom note.
  * Add your own personal notes per Skill or MCP, or reset back to the default description anytime.
* **Auto-Discovery for New MCPs & Skills**:
  * Scans `~/.gemini/config/skills/`, `~/.gemini/config/plugins/*/`, `~/.gemini/antigravity/builtin/skills/`, `~/.gemini/config/mcp_config.json`, plugin `mcp_config.json`, and `~/.gemini/antigravity/mcp/` tool caches.
  * Automatically infers categories and generates a summary from tool schemas & `SKILL.md` for newly added items (`🆕`).
  * Also exposes `batch_categorize` so Antigravity can auto-classify newly installed Skills/MCPs on your behalf.
* **Enable / Disable Toggles**:
  * Toggle custom MCP Servers (`disabled` in `mcp_config.json` with live `RefreshMcpServers` when available).
  * Toggle custom Skills (`SKILL.md` ↔ `SKILL.md.disabled`, keeping disabled skills visible in the dashboard).
* **Customizable Settings Panel (`⚙️ Settings`)**:
  * Language (`zh` / `en`)
  * Card density (`compact` / `standard` / `comfortable`), group spacing (`normal` / `wide`), description line limit (`2` / `4` / `all`)
  * Default view (`grouped` / `flat`), default group collapse state, plugin folding rule, hide disabled items
  * Customizable prompt template (`{{name}}` placeholder)
  * Auto-scan on focus, toggle built-in/plugin visibility, extra custom skill directories
  * JSON backup export / import & reset

---

## Installation for Google Antigravity

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Thexiaohao/antigravity-skill-mcp-manager.git
cd antigravity-skill-mcp-manager
npm install
npm run build
```

### 2. Register in Antigravity MCP Config

Add the server to `~/.gemini/config/mcp_config.json` (replace `/path/to/...` with your actual path and `node` path):

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

> On Windows, you can use the full path to `node.exe`, e.g. `C:\\Program Files\\nodejs\\node.exe`.

### 3. Open in Antigravity

* Click the **+** menu in Antigravity's side pane or open **Skill & MCP 管理** from the left sidebar;
* Or ask Antigravity in chat: *"Open Skill & MCP Manager"* (`open_manager`).

---

## MCP Tools Exposed

| Tool | Visibility | Description |
| :--- | :--- | :--- |
| `open_manager` | Model + App | Launches the interactive dashboard and returns the catalog summary |
| `batch_categorize` | Model + App | Allows Antigravity to batch-assign categories and notes to Skills/MCPs |
| `refresh_catalog` | App-only | Re-scans Skills, Plugins, and MCP caches |
| `update_item_meta` | App-only | Persists category & custom note edits to `metadata.json` |
| `reorder_items` | App-only | Persists drag/button ordering for categories, skills, MCPs, and plugins |
| `manage_categories` | App-only | Adds, renames, moves, or deletes categories |
| `toggle_item_enabled` | App-only | Enables/disables custom Skills and custom MCP Servers |
| `update_settings` | App-only | Saves UI & scan preferences |
| `metadata_backup` | App-only | Exports, imports, or resets `metadata.json` |
| `acknowledge_new` | App-only | Clears `🆕` badges on newly discovered items |

## License

[MIT](./LICENSE)
