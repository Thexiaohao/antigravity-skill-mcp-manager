import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const result = await esbuild.build({
  entryPoints: ['src/app.ts'],
  bundle: true,
  write: false,
  format: 'iife',
  minify: true,
  target: ['es2022'],
});

const js = result.outputFiles[0].text;

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Antigravity Skill & MCP Manager</title>
  <style>
    :root {
      --bg: var(--color-background-primary, #121214);
      --bg-card: var(--color-background-secondary, #1c1c20);
      --bg-hover: var(--color-background-tertiary, #26262c);
      --text: var(--color-text-primary, #f4f4f5);
      --text-muted: var(--color-text-secondary, #a1a1aa);
      --border: var(--color-border-primary, #2e2e36);
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --card-pad: 9px 11px;
      --card-gap: 8px;
      --group-gap: 22px;
      --desc-lines: 2;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
      line-height: 1.5;
      padding: 14px;
    }
    body.density-compact { --card-pad: 6px 9px; --card-gap: 5px; }
    body.density-standard { --card-pad: 9px 11px; --card-gap: 8px; }
    body.density-comfortable { --card-pad: 12px 14px; --card-gap: 11px; }
    body.spacing-normal { --group-gap: 14px; }
    body.spacing-wide { --group-gap: 24px; }
    body.lines-2 { --desc-lines: 2; }
    body.lines-4 { --desc-lines: 4; }
    body.lines-all .card-desc { display: block; -webkit-line-clamp: unset; overflow: visible; }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .title-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
    .title { font-size: 15px; font-weight: 600; }
    .stats { font-size: 12px; color: var(--text-muted); }
    .header-actions { display: flex; gap: 5px; flex-wrap: wrap; }
    .new-banner {
      display: none;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: rgba(59, 130, 246, 0.14);
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 8px;
      padding: 7px 11px;
      margin-bottom: 10px;
      font-size: 12px;
    }
    .new-banner-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tabs-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 7px;
    }
    .tabs { display: flex; gap: 6px; }
    .tab {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      padding: 5px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }
    .tab.active {
      background: var(--bg-card);
      color: var(--text);
      border-color: var(--border);
    }
    .toolbar { display: flex; gap: 8px; margin-bottom: 9px; }
    .search {
      flex: 1;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 7px 11px;
      border-radius: 7px;
      font-size: 12.5px;
      outline: none;
    }
    .search:focus { border-color: var(--accent); }
    .filter-row, .category-row {
      display: flex;
      gap: 6px;
      margin-bottom: 9px;
      flex-wrap: wrap;
    }
    .filter-row { margin-bottom: 16px; }
    .chip {
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11.5px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .chip:hover { border-color: var(--accent); color: var(--text); }
    .chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    .chip-count { font-size: 10.5px; opacity: 0.85; }

    .cat-manager, .settings-panel {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 9px;
      padding: 12px;
      margin-bottom: 14px;
    }
    .cat-mgr-header, .settings-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .cat-mgr-title, .settings-title { font-size: 13px; font-weight: 600; }
    .cat-mgr-add { display: flex; gap: 6px; align-items: center; }
    .cat-mgr-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
      max-height: 220px;
      overflow-y: auto;
    }
    .cat-mgr-row {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 5px 8px;
      border-radius: 5px;
      background: var(--bg-hover);
      font-size: 12px;
      border: 1px solid transparent;
    }
    .cat-mgr-name { flex: 1; }
    .cat-mgr-btns { display: flex; gap: 4px; }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 10px;
    }
    .settings-section {
      background: var(--bg-hover);
      border: 1px solid var(--border);
      border-radius: 7px;
      padding: 9px 10px;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .settings-sec-title { font-size: 12px; font-weight: 600; color: var(--text); }
    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
    }
    .setting-col { display: flex; flex-direction: column; gap: 3px; }
    .setting-check {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      cursor: pointer;
    }
    .backup-actions, .inline-confirm, .import-box {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      align-items: center;
    }
    .import-box { flex-direction: column; align-items: stretch; }
    .inline-confirm { font-size: 11.5px; color: #f87171; }
    .settings-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }

    .drag-handle {
      cursor: grab;
      color: var(--text-muted);
      opacity: 0.6;
      font-size: 12px;
      user-select: none;
      letter-spacing: -1px;
    }
    .drag-handle:hover { opacity: 1; color: var(--text); }
    .dragging { opacity: 0.45; }
    .drag-over { outline: 2px dashed var(--accent); outline-offset: 2px; }

    .group-section {
      margin-bottom: var(--group-gap);
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid var(--border);
      border-radius: 10px;
    }
    .group-header {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 7px 10px;
      background: var(--bg-hover);
      border-left: 3px solid var(--accent);
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      user-select: none;
    }
    .group-header:hover { filter: brightness(1.06); }
    .group-arrow { font-size: 12px; color: var(--text-muted); width: 14px; text-align: center; }
    .group-name { flex: 1; }
    .group-ops, .plugin-ops { display: inline-flex; gap: 3px; }
    .group-count {
      font-size: 11px;
      padding: 1px 8px;
      border-radius: 999px;
      background: var(--bg-card);
      color: var(--text-muted);
    }
    .group-body {
      display: flex;
      flex-direction: column;
      gap: var(--card-gap);
      margin-top: 10px;
    }

    .plugin-subgroup {
      margin: 2px 0;
      padding: 7px 9px;
      background: rgba(168, 85, 247, 0.04);
      border: 1px solid rgba(168, 85, 247, 0.22);
      border-radius: 8px;
    }
    .plugin-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 600;
      user-select: none;
    }
    .plugin-header:hover { background: rgba(168, 85, 247, 0.1); }
    .plugin-title { flex: 1; color: #d8b4fe; }
    .plugin-body {
      display: flex;
      flex-direction: column;
      gap: var(--card-gap);
      margin-top: 8px;
      padding-left: 6px;
    }

    .list { display: flex; flex-direction: column; gap: var(--card-gap); }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: var(--card-pad);
    }
    .card-disabled { opacity: 0.58; border-style: dashed; }
    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 5px;
      flex-wrap: wrap;
    }
    .card-left {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      min-width: 0;
      flex: 1;
    }
    .card-title { font-weight: 600; font-size: 13px; word-break: break-all; }
    .card-ops { display: flex; gap: 4px; flex-shrink: 0; flex-wrap: wrap; }
    .badge {
      font-size: 10.5px;
      padding: 1px 6px;
      line-height: 16px;
      border-radius: 4px;
      white-space: nowrap;
      background: var(--bg-hover);
      color: var(--text-muted);
    }
    .badge-cat { background: rgba(245, 158, 11, 0.16); color: #fbbf24; }
    .badge-custom { background: rgba(59, 130, 246, 0.18); color: #60a5fa; }
    .badge-plugin { background: rgba(168, 85, 247, 0.18); color: #c084fc; }
    .badge-builtin { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .badge-disabled { background: rgba(239, 68, 68, 0.18); color: #f87171; }
    .badge-new { background: rgba(14, 165, 233, 0.22); color: #38bdf8; }
    .card-desc {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.48;
      display: -webkit-box;
      -webkit-line-clamp: var(--desc-lines);
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-desc.custom-note { color: var(--text); }
    .note-tag {
      display: inline-block;
      font-size: 10px;
      padding: 0 5px;
      margin-right: 5px;
      border-radius: 3px;
      background: rgba(59, 130, 246, 0.18);
      color: #60a5fa;
    }
    .card-endpoint {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 11px;
      color: var(--text-muted);
      opacity: 0.78;
      margin-top: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .edit-panel {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed var(--border);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .edit-inline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      flex-wrap: wrap;
    }
    .edit-label { font-size: 11px; color: var(--text-muted); }
    .hint { font-size: 10.5px; color: var(--text-muted); font-weight: 400; }
    .edit-actions { display: flex; gap: 5px; }
    .select-sm, .input-sm, .textarea-sm {
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 5px;
      padding: 5px 8px;
      font-size: 12px;
      font-family: inherit;
      outline: none;
    }
    .select-sm { min-width: 125px; }
    .select-sm:focus, .input-sm:focus, .textarea-sm:focus { border-color: var(--accent); }
    .textarea-sm { resize: vertical; width: 100%; }
    .default-preview { font-size: 11px; color: var(--text-muted); opacity: 0.85; }
    .btn {
      border: none;
      border-radius: 5px;
      padding: 4px 10px;
      font-size: 11.5px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .btn-xs { padding: 3px 7px; font-size: 11px; line-height: 17px; }
    .btn-icon {
      padding: 2px 6px;
      background: var(--bg-hover);
      color: var(--text-muted);
      border: 1px solid var(--border);
    }
    .btn-icon:hover:not(:disabled) { color: var(--text); border-color: var(--accent); }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-secondary {
      background: var(--bg-hover);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-muted {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border);
    }
    .btn-muted:hover { color: #f87171; border-color: rgba(239, 68, 68, 0.4); }
    .btn-enable {
      background: rgba(34, 197, 94, 0.18);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.35);
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.16);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .empty { text-align: center; color: var(--text-muted); padding: 28px 0; font-size: 13px; }
    .toast {
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: #18181b;
      color: #fff;
      border: 1px solid var(--border);
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      opacity: 0;
      pointer-events: none;
      transition: all 0.2s ease;
      z-index: 999;
    }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-row">
      <div class="title" id="app-title">Antigravity Skill & MCP 管理</div>
      <div class="stats" id="stats">加载中...</div>
    </div>
    <div class="header-actions">
      <button class="btn btn-xs btn-secondary" id="lang-toggle-btn">中 / EN</button>
      <button class="btn btn-xs btn-secondary" id="expand-all-btn">全展开/收起</button>
      <button class="btn btn-xs btn-secondary" id="cat-mgr-btn">分类管理</button>
      <button class="btn btn-xs btn-secondary" id="settings-btn">⚙️ 设置</button>
      <button class="btn btn-xs btn-primary" id="discover-btn">🔍 识别新增</button>
    </div>
  </div>

  <div class="new-banner" id="new-banner"></div>
  <div class="cat-manager" id="cat-manager" style="display:none;"></div>
  <div class="settings-panel" id="settings-panel" style="display:none;"></div>

  <div class="tabs-bar">
    <div class="tabs">
      <button class="tab active" id="tab-skills">Skills</button>
      <button class="tab" id="tab-mcps">MCPs</button>
    </div>
    <button class="btn btn-xs btn-secondary" id="view-toggle-btn">群组</button>
  </div>

  <div class="toolbar">
    <input class="search" id="search" type="text" placeholder="搜索名称、功能、备注或 MCP 工具..." />
  </div>

  <div class="category-row" id="category-row"></div>

  <div class="filter-row" id="filter-row">
    <button class="chip active" data-filter="all">全部来源</button>
    <button class="chip" data-filter="custom">自定义</button>
    <button class="chip" data-filter="plugin">插件</button>
    <button class="chip" data-filter="builtin">内置</button>
  </div>

  <div class="list" id="list"></div>
  <div class="toast" id="toast"></div>

  <script>${js}</script>
</body>
</html>`;

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync(path.join('dist', 'app.html'), html, 'utf8');
console.log('Built dist/app.html');
