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
      --font-sans: var(--font-sans, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "PingFang SC", "Microsoft YaHei", Roboto, sans-serif);
      --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;

      --surface-bg: var(--color-background-primary, #111215);
      --surface-panel: var(--color-background-secondary, #181a1f);
      --surface-subtle: color-mix(in srgb, var(--surface-panel) 94%, var(--text-primary) 6%);
      --surface-hover: color-mix(in srgb, var(--accent-primary) 7%, var(--surface-panel));
      --surface-active: color-mix(in srgb, var(--accent-primary) 14%, var(--surface-panel));

      --text-primary: var(--color-text-primary, #f4f4f6);
      --text-secondary: var(--color-text-secondary, #a1a1aa);
      --text-muted: color-mix(in srgb, var(--text-secondary) 78%, var(--surface-panel) 22%);

      --border-hairline: color-mix(in srgb, var(--color-border-primary, #2b2d35) 85%, var(--surface-panel));
      --border-strong: color-mix(in srgb, var(--border-hairline) 70%, var(--text-primary) 30%);

      --accent-primary: hsl(217 86% 60%);
      --accent-primary-soft: color-mix(in srgb, var(--accent-primary) 15%, transparent);
      --accent-primary-border: color-mix(in srgb, var(--accent-primary) 42%, var(--border-hairline));

      --metric-ok: hsl(145 64% 46%);
      --metric-ok-soft: color-mix(in srgb, var(--metric-ok) 14%, transparent);
      --metric-warn: hsl(35 90% 54%);
      --metric-warn-soft: color-mix(in srgb, var(--metric-warn) 15%, transparent);
      --metric-danger: hsl(4 80% 58%);
      --metric-danger-soft: color-mix(in srgb, var(--metric-danger) 15%, transparent);
      --plugin-accent: hsl(270 78% 72%);
      --plugin-soft: color-mix(in srgb, var(--plugin-accent) 12%, transparent);
      --plugin-border: color-mix(in srgb, var(--plugin-accent) 32%, var(--border-hairline));

      --radius-pill: 999px;
      --radius-md: 7px;
      --radius-sm: 5px;
      --radius-xs: 3px;

      --ease-fast: cubic-bezier(0.22, 1, 0.36, 1);
      --dur-instant: 90ms;
      --dur-fast: 145ms;
      --dur-normal: 200ms;

      --card-pad: 9px 11px;
      --card-gap: 8px;
      --group-gap: 22px;
      --desc-lines: 2;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-sans);
      background: var(--surface-bg);
      color: var(--text-primary);
      font-size: 13px;
      line-height: 1.5;
      padding: 12px 14px;
      font-variant-numeric: tabular-nums;
      -webkit-font-smoothing: antialiased;
    }
    body.density-compact { --card-pad: 6px 9px; --card-gap: 5px; }
    body.density-standard { --card-pad: 9px 11px; --card-gap: 8px; }
    body.density-comfortable { --card-pad: 12px 14px; --card-gap: 11px; }
    body.spacing-normal { --group-gap: 14px; }
    body.spacing-wide { --group-gap: 24px; }
    body.lines-2 { --desc-lines: 2; }
    body.lines-4 { --desc-lines: 4; }
    body.lines-all .card-desc { display: block; -webkit-line-clamp: unset; overflow: visible; }

    @keyframes anim-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes anim-pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.35; transform: scale(0.84); }
    }
    @keyframes anim-view-fade {
      from { opacity: 0; transform: translate3d(0, 4px, 0); }
      to { opacity: 1; transform: translate3d(0, 0, 0); }
    }
    @keyframes anim-popover-in {
      from { opacity: 0; transform: translate3d(0, -3px, 0); }
      to { opacity: 1; transform: translate3d(0, 0, 0); }
    }

    .view-anim { animation: anim-view-fade var(--dur-fast) var(--ease-fast); }
    .is-spinning { pointer-events: none; opacity: 0.8; }
    .is-spinning::first-letter { display: inline-block; }

    /* Top session control bar (usage-monitor style) */
    .session-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 10px;
      margin-bottom: 10px;
      background: var(--surface-panel);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      flex-wrap: wrap;
    }
    .session-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      min-width: 0;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--metric-ok);
      box-shadow: 0 0 0 3px var(--metric-ok-soft);
      animation: anim-pulse-dot 2s ease-in-out infinite;
      flex-shrink: 0;
    }
    .title { font-size: 13.5px; font-weight: 600; letter-spacing: -0.01em; }
    .stats-pill {
      font-size: 11px;
      padding: 1px 8px;
      border-radius: var(--radius-pill);
      background: var(--surface-subtle);
      border: 1px solid var(--border-hairline);
      color: var(--text-secondary);
      white-space: nowrap;
    }
    .header-actions { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; }

    /* Top Long-Pill Navigation Bar */
    .nav-shell {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .long-pill-nav {
      flex: 1;
      position: relative;
      display: grid;
      grid-template-columns: repeat(var(--pill-count, 2), minmax(0, 1fr));
      align-items: center;
      padding: 3px;
      background: var(--surface-panel);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-pill);
      overflow: hidden;
      user-select: none;
    }
    .pill-glider {
      position: absolute;
      top: 3px;
      bottom: 3px;
      left: 3px;
      width: calc((100% - 6px) / var(--pill-count, 2));
      background: var(--accent-primary-soft);
      border: 1px solid var(--accent-primary-border);
      border-radius: var(--radius-pill);
      transform: translate3d(calc(var(--active-index, 0) * 100%), 0, 0);
      transition: transform var(--dur-fast) var(--ease-fast);
      pointer-events: none;
      z-index: 0;
    }
    .pill-tab {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 28px;
      padding: 2px 10px;
      border: none;
      outline: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 12.5px;
      font-weight: 500;
      border-radius: var(--radius-pill);
      cursor: pointer;
      transition: color var(--dur-instant) var(--ease-fast);
    }
    .pill-tab:hover { color: var(--text-primary); }
    .pill-tab.is-active { color: var(--text-primary); font-weight: 600; }
    .pill-tab-badge {
      font-size: 10.5px;
      padding: 0 6px;
      border-radius: var(--radius-pill);
      background: var(--surface-subtle);
      color: var(--text-secondary);
    }
    .pill-tab.is-active .pill-tab-badge {
      background: var(--accent-primary-soft);
      color: var(--accent-primary);
    }

    .new-banner {
      display: none;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: var(--accent-primary-soft);
      border: 1px solid var(--accent-primary-border);
      border-radius: var(--radius-md);
      padding: 7px 11px;
      margin-bottom: 10px;
      font-size: 12px;
      animation: anim-popover-in var(--dur-fast) var(--ease-fast);
    }
    .new-banner-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .attached-bar {
      display: none;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      background: var(--metric-ok-soft);
      border: 1px solid color-mix(in srgb, var(--metric-ok) 36%, var(--border-hairline));
      border-radius: var(--radius-md);
      padding: 6px 10px;
      margin-bottom: 10px;
      font-size: 12px;
      animation: anim-popover-in var(--dur-fast) var(--ease-fast);
    }
    .attached-label { font-weight: 600; color: var(--metric-ok); }
    .attached-pills { display: flex; gap: 5px; flex-wrap: wrap; flex: 1; }
    .attached-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 8px;
      border-radius: var(--radius-pill);
      background: var(--surface-panel);
      border: 1px solid var(--border-hairline);
      font-size: 11px;
    }
    .pill-x {
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 13px;
      line-height: 1;
    }
    .pill-x:hover { color: var(--metric-danger); }

    .toolbar { display: flex; gap: 8px; margin-bottom: 9px; }
    .search {
      flex: 1;
      background: var(--surface-panel);
      border: 1px solid var(--border-hairline);
      color: var(--text-primary);
      padding: 7px 11px;
      border-radius: var(--radius-md);
      font-size: 12.5px;
      outline: none;
      transition: border-color var(--dur-instant) var(--ease-fast), box-shadow var(--dur-instant) var(--ease-fast);
    }
    .search:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px var(--accent-primary-soft);
    }

    .filter-row, .category-row {
      display: flex;
      gap: 6px;
      margin-bottom: 9px;
      flex-wrap: wrap;
    }
    .filter-row { margin-bottom: 16px; }
    .chip {
      background: var(--surface-panel);
      border: 1px solid var(--border-hairline);
      color: var(--text-secondary);
      padding: 4px 10px;
      border-radius: var(--radius-pill);
      font-size: 11.5px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all var(--dur-instant) var(--ease-fast);
    }
    .chip:hover { border-color: var(--border-strong); color: var(--text-primary); background: var(--surface-hover); }
    .chip:active { transform: scale(0.96); }
    .chip.active {
      background: var(--accent-primary-soft);
      color: var(--accent-primary);
      border-color: var(--accent-primary-border);
      font-weight: 600;
    }
    .chip-count { font-size: 10.5px; opacity: 0.82; }

    .cat-manager, .settings-panel {
      background: var(--surface-panel);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      padding: 12px;
      margin-bottom: 14px;
      animation: anim-popover-in var(--dur-fast) var(--ease-fast);
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
      padding: 6px 9px;
      border-radius: var(--radius-sm);
      background: var(--surface-subtle);
      font-size: 12px;
      border: 1px solid var(--border-hairline);
      transition: background-color var(--dur-instant) var(--ease-fast);
    }
    .cat-mgr-row:hover { background: var(--surface-hover); }
    .cat-mgr-name { flex: 1; }
    .cat-mgr-btns { display: flex; gap: 4px; }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 10px;
    }
    .settings-section {
      background: var(--surface-subtle);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-sm);
      padding: 9px 10px;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .settings-sec-title { font-size: 12px; font-weight: 600; color: var(--text-primary); }
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
    .inline-confirm { font-size: 11.5px; color: var(--metric-danger); }
    .settings-footer { display: flex; justify-content: flex-end; margin-top: 10px; }

    .drag-handle {
      cursor: grab;
      color: var(--text-muted);
      opacity: 0.55;
      font-size: 12px;
      user-select: none;
      letter-spacing: -1px;
      transition: opacity var(--dur-instant) var(--ease-fast);
    }
    .drag-handle:hover { opacity: 1; color: var(--text-primary); }
    .dragging { opacity: 0.42; transform: scale(0.99); }
    .drag-over { outline: 1.5px dashed var(--accent-primary); outline-offset: 2px; background: var(--surface-active); }

    /* Group sections with clear architectural hairline borders */
    .group-section {
      margin-bottom: var(--group-gap);
      padding: 10px 12px;
      background: var(--surface-panel);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      transition: border-color var(--dur-fast) var(--ease-fast);
    }
    .group-header {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 7px 10px;
      background: var(--surface-subtle);
      border: 1px solid var(--border-hairline);
      border-left: 3px solid var(--accent-primary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      user-select: none;
      transition: background-color var(--dur-instant) var(--ease-fast), border-color var(--dur-instant) var(--ease-fast);
    }
    .group-header:hover { background: var(--surface-hover); border-color: var(--border-strong); }
    .group-arrow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      width: 14px;
      height: 14px;
    }
    .chevron-svg {
      transition: transform var(--dur-fast) var(--ease-fast);
    }
    .chevron-svg.is-open { transform: rotate(90deg); }
    .group-name { flex: 1; }
    .plugin-ops { display: inline-flex; gap: 4px; }
    .group-count {
      font-size: 11px;
      padding: 1px 8px;
      border-radius: var(--radius-pill);
      background: var(--surface-panel);
      border: 1px solid var(--border-hairline);
      color: var(--text-secondary);
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
      background: var(--plugin-soft);
      border: 1px solid var(--plugin-border);
      border-radius: var(--radius-md);
      transition: border-color var(--dur-instant) var(--ease-fast);
    }
    .plugin-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 600;
      user-select: none;
      transition: background-color var(--dur-instant) var(--ease-fast);
    }
    .plugin-header:hover { background: color-mix(in srgb, var(--plugin-accent) 12%, transparent); }
    .plugin-title { flex: 1; color: var(--plugin-accent); }
    .plugin-body {
      display: flex;
      flex-direction: column;
      gap: var(--card-gap);
      margin-top: 8px;
      padding-left: 6px;
    }

    .list { display: flex; flex-direction: column; gap: var(--card-gap); }
    .card {
      background: var(--surface-subtle);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-sm);
      padding: var(--card-pad);
      transition: border-color var(--dur-instant) var(--ease-fast), background-color var(--dur-instant) var(--ease-fast), transform var(--dur-instant) var(--ease-fast);
    }
    .card:hover {
      border-color: var(--border-strong);
      background: var(--surface-hover);
    }
    .card-disabled { opacity: 0.56; border-style: dashed; }
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
      border-radius: var(--radius-xs);
      white-space: nowrap;
      background: var(--surface-panel);
      border: 1px solid var(--border-hairline);
      color: var(--text-secondary);
    }
    .badge-cat { background: var(--metric-warn-soft); color: var(--metric-warn); border-color: color-mix(in srgb, var(--metric-warn) 35%, var(--border-hairline)); }
    .badge-custom { background: var(--accent-primary-soft); color: var(--accent-primary); border-color: var(--accent-primary-border); }
    .badge-plugin { background: var(--plugin-soft); color: var(--plugin-accent); border-color: var(--plugin-border); }
    .badge-builtin { background: var(--metric-ok-soft); color: var(--metric-ok); border-color: color-mix(in srgb, var(--metric-ok) 32%, var(--border-hairline)); }
    .badge-disabled { background: var(--metric-danger-soft); color: var(--metric-danger); border-color: color-mix(in srgb, var(--metric-danger) 35%, var(--border-hairline)); }
    .badge-new { background: var(--accent-primary-soft); color: var(--accent-primary); border-color: var(--accent-primary-border); }
    .card-desc {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.48;
      display: -webkit-box;
      -webkit-line-clamp: var(--desc-lines);
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-desc.custom-note { color: var(--text-primary); }
    .note-tag {
      display: inline-block;
      font-size: 10px;
      padding: 0 5px;
      margin-right: 5px;
      border-radius: var(--radius-xs);
      background: var(--accent-primary-soft);
      color: var(--accent-primary);
      border: 1px solid var(--accent-primary-border);
    }
    .card-endpoint {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .edit-panel {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed var(--border-hairline);
      display: flex;
      flex-direction: column;
      gap: 6px;
      animation: anim-popover-in var(--dur-fast) var(--ease-fast);
    }
    .edit-inline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      flex-wrap: wrap;
    }
    .edit-label { font-size: 11px; color: var(--text-secondary); }
    .hint { font-size: 10.5px; color: var(--text-muted); font-weight: 400; }
    .edit-actions { display: flex; gap: 5px; }
    .select-sm, .input-sm, .textarea-sm {
      background: var(--surface-bg);
      border: 1px solid var(--border-hairline);
      color: var(--text-primary);
      border-radius: var(--radius-sm);
      padding: 5px 8px;
      font-size: 12px;
      font-family: inherit;
      outline: none;
    }
    .select-sm { min-width: 125px; }
    .select-sm:focus, .input-sm:focus, .textarea-sm:focus { border-color: var(--accent-primary); }
    .textarea-sm { resize: vertical; width: 100%; }
    .default-preview { font-size: 11px; color: var(--text-muted); }

    .btn {
      border: none;
      border-radius: var(--radius-sm);
      padding: 4px 10px;
      font-size: 11.5px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color var(--dur-instant) var(--ease-fast), border-color var(--dur-instant) var(--ease-fast), transform var(--dur-instant) var(--ease-fast), opacity var(--dur-instant) var(--ease-fast);
    }
    .btn:active:not(:disabled) { transform: scale(0.95); }
    .btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .btn-xs { padding: 3px 8px; font-size: 11px; line-height: 17px; }
    .btn-primary {
      background: var(--accent-primary);
      color: #fff;
    }
    .btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
    .btn-secondary {
      background: var(--surface-panel);
      color: var(--text-primary);
      border: 1px solid var(--border-hairline);
    }
    .btn-secondary:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--border-strong); }
    .btn-muted {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border-hairline);
    }
    .btn-muted:hover { color: var(--metric-danger); border-color: color-mix(in srgb, var(--metric-danger) 45%, var(--border-hairline)); }
    .btn-enable {
      background: var(--metric-ok-soft);
      color: var(--metric-ok);
      border: 1px solid color-mix(in srgb, var(--metric-ok) 36%, var(--border-hairline));
    }
    .btn-danger {
      background: var(--metric-danger-soft);
      color: var(--metric-danger);
      border: 1px solid color-mix(in srgb, var(--metric-danger) 36%, var(--border-hairline));
    }
    .empty { text-align: center; color: var(--text-muted); padding: 28px 0; font-size: 13px; }
    .toast {
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translate3d(-50%, 16px, 0);
      background: var(--surface-panel);
      color: var(--text-primary);
      border: 1px solid var(--border-strong);
      box-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
      padding: 6px 14px;
      border-radius: var(--radius-pill);
      font-size: 12px;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--dur-fast) var(--ease-fast), transform var(--dur-fast) var(--ease-fast);
      z-index: 999;
    }
    .toast.show { opacity: 1; transform: translate3d(-50%, 0, 0); }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body>
  <div class="session-header">
    <div class="session-left">
      <span class="pulse-dot" aria-hidden="true"></span>
      <span class="title" id="app-title">Antigravity Skill & MCP 管理</span>
      <span class="stats-pill" id="stats">加载中...</span>
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
  <div class="attached-bar" id="attached-bar"></div>
  <div class="cat-manager" id="cat-manager" style="display:none;"></div>
  <div class="settings-panel" id="settings-panel" style="display:none;"></div>

  <div class="nav-shell">
    <div class="long-pill-nav" id="main-pill-nav" style="--pill-count: 2; --active-index: 0;">
      <div class="pill-glider" aria-hidden="true"></div>
      <button class="pill-tab is-active" id="tab-skills"><span class="pill-tab-label">Skills</span></button>
      <button class="pill-tab" id="tab-mcps"><span class="pill-tab-label">MCPs</span></button>
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
