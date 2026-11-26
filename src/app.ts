import {
  App,
  applyDocumentTheme,
  applyHostStyleVariables,
} from '@modelcontextprotocol/ext-apps';
import { I18N, Lang, displayCategoryName } from './i18n';

interface SkillItem {
  name: string;
  description: string;
  source: 'custom' | 'plugin' | 'builtin';
  pluginName?: string;
  path: string;
  disabled?: boolean;
  canToggle?: boolean;
  category: string;
  defaultNote: string;
  defaultNoteZh?: string;
  defaultNoteEn?: string;
  customNote: string;
  displayNote: string;
  hasCustomNote: boolean;
  isNew?: boolean;
}

interface McpItem {
  id: string;
  name: string;
  source: 'custom' | 'plugin' | 'discovered';
  pluginName?: string;
  command: string;
  args: string[];
  serverUrl?: string;
  disabled?: boolean;
  canToggle?: boolean;
  toolCount?: number;
  sampleTools?: string[];
  category: string;
  defaultNote: string;
  defaultNoteZh?: string;
  defaultNoteEn?: string;
  customNote: string;
  displayNote: string;
  hasCustomNote: boolean;
  isNew?: boolean;
}

interface NewItemNotice {
  kind: 'skill' | 'mcp';
  name: string;
  category: string;
}

interface AppSettings {
  language: Lang;
  density: 'compact' | 'standard' | 'comfortable';
  groupSpacing: 'normal' | 'wide';
  descLines: '2' | '4' | 'all';
  defaultView: 'grouped' | 'flat';
  defaultGroupState: 'expanded' | 'collapsed';
  pluginFoldRule: 'auto' | 'always_collapsed' | 'always_expanded';
  hideDisabled: boolean;
  showBuiltin: boolean;
  showPlugin: boolean;
  autoDiscoverOnFocus: boolean;
  promptTemplateZh: string;
  promptTemplateEn: string;
  extraSkillDirs: string[];
}

interface CatalogData {
  skills: SkillItem[];
  mcps: McpItem[];
  categories: string[];
  order?: {
    skills: string[];
    mcps: string[];
    plugins: string[];
  };
  settings?: AppSettings;
  newlyDetected?: NewItemNotice[];
  lastActionMessage?: string;
  exportedJson?: string;
  scannedAt: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'zh',
  density: 'standard',
  groupSpacing: 'wide',
  descLines: '2',
  defaultView: 'grouped',
  defaultGroupState: 'expanded',
  pluginFoldRule: 'auto',
  hideDisabled: false,
  showBuiltin: true,
  showPlugin: true,
  autoDiscoverOnFocus: true,
  promptTemplateZh: '请使用 {{name}} skill 来帮我处理：',
  promptTemplateEn: 'Please use the {{name}} skill to help me with: ',
  extraSkillDirs: [],
};

const app = new App({ name: 'Antigravity Skill & MCP Manager', version: '2.2.0' }, {});

let catalog: CatalogData = {
  skills: [],
  mcps: [],
  categories: [],
  order: { skills: [], mcps: [], plugins: [] },
  settings: { ...DEFAULT_SETTINGS },
  newlyDetected: [],
  scannedAt: '',
};

let activeTab: 'skills' | 'mcps' = 'skills';
let sourceFilter: 'all' | 'custom' | 'plugin' | 'builtin' = 'all';
let categoryFilter = 'all';
let searchQuery = '';
let viewMode: 'grouped' | 'flat' = 'grouped';
let initialSettingsApplied = false;

let showCategoryManager = false;
let showSettings = false;
let showResetConfirm = false;
let showImportBox = false;
let exportedPreview = '';

let canSendMessage = false;
let canUpdateContext = false;
let editingKey: string | null = null;
let renamingCategory: string | null = null;
let lastFocusRefresh = 0;

const attachedItems: { key: string; label: string; contextText: string }[] = [];
let multiAttach = false;

// Track group & plugin fold states
const collapsedGroups = new Set<string>();
const expandedGroups = new Set<string>();
const expandedPlugins = new Set<string>();
const collapsedPlugins = new Set<string>();

// Drag state
let dragPayload:
  | { type: 'category'; name: string }
  | { type: 'card'; kind: 'skill' | 'mcp'; name: string; category: string }
  | { type: 'plugin'; name: string }
  | null = null;

function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...(catalog.settings || {}) };
}

function getLang(): Lang {
  return getSettings().language === 'en' ? 'en' : 'zh';
}

function t() {
  return I18N[getLang()];
}

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg: string) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(label);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(label);
  }
}

function applyAppearanceClasses() {
  const s = getSettings();
  const body = document.body;
  body.classList.remove(
    'density-compact',
    'density-standard',
    'density-comfortable',
    'spacing-normal',
    'spacing-wide',
    'lines-2',
    'lines-4',
    'lines-all'
  );
  body.classList.add(`density-${s.density}`);
  body.classList.add(`spacing-${s.groupSpacing}`);
  body.classList.add(`lines-${s.descLines}`);
}

function buildPrompt(skillName: string): string {
  const s = getSettings();
  const tpl = s.language === 'en' ? s.promptTemplateEn : s.promptTemplateZh;
  return (tpl || '{{name}}').replace(/\{\{name\}\}/g, skillName);
}

function buildPluginPrompt(pluginName: string, skillNames: string[]): string {
  const list = skillNames.slice(0, 8).join(', ') + (skillNames.length > 8 ? ', ...' : '');
  if (getLang() === 'en') {
    return `Please use the "${pluginName}" plugin skill suite (including: ${list}) as needed to help me with: `;
  }
  return `请根据需求协同使用插件「${pluginName}」中的技能（包含：${list}）来帮我处理：`;
}

function buildMcpPrompt(mcpName: string): string {
  if (getLang() === 'en') {
    return `Please use the "${mcpName}" MCP server tools to help me with: `;
  }
  return `请使用 ${mcpName} MCP 工具来帮我处理：`;
}

async function syncAttachedContext() {
  if (!canUpdateContext) return;
  try {
    if (attachedItems.length === 0) {
      await app.updateModelContext({ content: [] });
    } else if (attachedItems.length === 1) {
      const only = attachedItems[0];
      await app.updateModelContext({
        content: [{ type: 'text', text: `[${only.label}] ${only.contextText}` }],
      });
    } else {
      const names = attachedItems.map((x) => x.label).join(' + ');
      const header = getLang() === 'en'
        ? `Selected ${attachedItems.length} items (${names}):`
        : `已选 ${attachedItems.length} 项（${names}）：`;
      const combined = `${header}\n` + attachedItems.map((x) => `- ${x.contextText}`).join('\n');
      await app.updateModelContext({
        content: [{ type: 'text', text: combined }],
      });
    }
  } catch {
    // ignore if unsupported in current surface
  }
}

async function toggleAttachItem(key: string, label: string, contextText: string) {
  const idx = attachedItems.findIndex((x) => x.key === key);
  if (idx !== -1) {
    attachedItems.splice(idx, 1);
    await syncAttachedContext();
    render();
    showToast(t().detachedToast);
  } else {
    if (!multiAttach) {
      attachedItems.length = 0;
    }
    attachedItems.push({ key, label, contextText });
    await syncAttachedContext();
    render();
    showToast(t().attachedToast);
  }
}

function renderAttachedBar() {
  const bar = document.getElementById('attached-bar');
  if (!bar) return;
  if (attachedItems.length === 0) {
    bar.style.display = 'none';
    return;
  }
  const tr = t();
  bar.style.display = 'flex';
  bar.innerHTML = `
    <span class="attached-label">📎 ${escapeHtml(tr.attachedBarLabel)}</span>
    <div class="attached-pills">
      ${attachedItems
        .map(
          (it) =>
            `<span class="attached-pill">${escapeHtml(it.label)}<button class="pill-x" data-unattach="${escapeHtml(it.key)}">×</button></span>`
        )
        .join('')}
    </div>
    <label class="setting-check" style="font-size:11px;">
      <input type="checkbox" id="multi-attach-chk" ${multiAttach ? 'checked' : ''} />
      <span>${escapeHtml(tr.multiAttachLabel)}</span>
    </label>
    <button class="btn btn-xs btn-secondary" id="clear-attached-btn">${escapeHtml(tr.clearAttached)}</button>
  `;
  bar.querySelectorAll<HTMLButtonElement>('[data-unattach]').forEach((btn) => {
    btn.onclick = async () => {
      const k = btn.dataset.unattach || '';
      const i = attachedItems.findIndex((x) => x.key === k);
      if (i !== -1) attachedItems.splice(i, 1);
      await syncAttachedContext();
      render();
    };
  });
  document.getElementById('multi-attach-chk')?.addEventListener('change', (e) => {
    multiAttach = Boolean((e.target as HTMLInputElement).checked);
  });
  document.getElementById('clear-attached-btn')?.addEventListener('click', async () => {
    attachedItems.length = 0;
    await syncAttachedContext();
    render();
  });
}

function getCurrentItems(): (SkillItem | McpItem)[] {
  const q = searchQuery.trim().toLowerCase();
  const sCfg = getSettings();

  if (activeTab === 'skills') {
    return catalog.skills.filter((s) => {
      if (sCfg.hideDisabled && s.disabled) return false;
      if (sourceFilter !== 'all' && s.source !== sourceFilter) return false;
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.displayNote.toLowerCase().includes(q) ||
        s.defaultNote.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        displayCategoryName(s.category, 'en').toLowerCase().includes(q) ||
        (s.pluginName && s.pluginName.toLowerCase().includes(q))
      );
    });
  }
  return catalog.mcps.filter((m) => {
    if (sCfg.hideDisabled && m.disabled) return false;
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    if (!q) return true;
    const endpoint = m.serverUrl || `${m.command} ${(m.args || []).join(' ')}`;
    return (
      m.name.toLowerCase().includes(q) ||
      m.displayNote.toLowerCase().includes(q) ||
      m.defaultNote.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      displayCategoryName(m.category, 'en').toLowerCase().includes(q) ||
      endpoint.toLowerCase().includes(q) ||
      (m.sampleTools || []).some((tool) => tool.toLowerCase().includes(q)) ||
      (m.pluginName && m.pluginName.toLowerCase().includes(q))
    );
  });
}

function getBaseItemsForCategoryCounts(): { category: string }[] {
  const sCfg = getSettings();
  if (activeTab === 'skills') {
    return catalog.skills.filter((s) => {
      if (sCfg.hideDisabled && s.disabled) return false;
      if (sourceFilter !== 'all' && s.source !== sourceFilter) return false;
      return true;
    });
  }
  return catalog.mcps.filter((m) => !(sCfg.hideDisabled && m.disabled));
}

function renderStaticTexts() {
  const tr = t();
  const titleEl = document.getElementById('app-title');
  if (titleEl) titleEl.textContent = tr.appTitle;
  const expandBtn = document.getElementById('expand-all-btn');
  if (expandBtn) expandBtn.textContent = tr.expandAll;
  const catBtn = document.getElementById('cat-mgr-btn');
  if (catBtn) catBtn.textContent = tr.catMgrBtn;
  const discBtn = document.getElementById('discover-btn');
  if (discBtn) discBtn.textContent = tr.discoverBtn;
  const setBtn = document.getElementById('settings-btn');
  if (setBtn) setBtn.textContent = tr.settingsBtn;
  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) langBtn.textContent = getLang() === 'zh' ? '中 / EN' : 'EN / 中';

  const searchInput = document.getElementById('search') as HTMLInputElement | null;
  if (searchInput) searchInput.placeholder = tr.searchPlaceholder;

  const srcBtns = document.querySelectorAll<HTMLButtonElement>('[data-filter]');
  srcBtns.forEach((b) => {
    const f = b.dataset.filter;
    if (f === 'all') b.textContent = tr.srcAll;
    else if (f === 'custom') b.textContent = tr.srcCustom;
    else if (f === 'plugin') b.textContent = tr.srcPlugin;
    else if (f === 'builtin') b.textContent = tr.srcBuiltin;
  });
}

function renderNewBanner() {
  const banner = document.getElementById('new-banner');
  if (!banner) return;
  const items = catalog.newlyDetected || [];
  if (items.length === 0) {
    banner.style.display = 'none';
    return;
  }
  const lang = getLang();
  const tr = t();
  const preview = items
    .slice(0, 3)
    .map((x) => `${x.name}→${displayCategoryName(x.category, lang)}`)
    .join(', ');
  banner.style.display = 'flex';
  banner.innerHTML = `
    <span class="new-banner-text">${escapeHtml(tr.newBanner(preview, items.length))}</span>
    <button class="btn btn-xs btn-secondary" id="ack-new-btn">${escapeHtml(tr.ackNewBtn)}</button>
  `;
  document.getElementById('ack-new-btn')?.addEventListener('click', async () => {
    try {
      const res = await app.callServerTool({ name: 'acknowledge_new', arguments: {} });
      if (res?.structuredContent) {
        catalog = res.structuredContent as unknown as CatalogData;
        render();
        showToast(t().ackedToast);
      }
    } catch {
      showToast(t().saveFailed);
    }
  });
}

function renderCategoryChips() {
  const row = document.getElementById('category-row');
  if (!row) return;
  const tr = t();
  const lang = getLang();

  const baseItems = getBaseItemsForCategoryCounts();
  const counts: Record<string, number> = {};
  for (const item of baseItems) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }

  const orderedCats = [...catalog.categories];
  if (counts['未分类'] && !orderedCats.includes('未分类')) {
    orderedCats.push('未分类');
  }

  const chipsHtml = [
    `<button class="chip ${categoryFilter === 'all' ? 'active' : ''}" data-cat="all">${escapeHtml(tr.all)}<span class="chip-count">${baseItems.length}</span></button>`,
    ...orderedCats
      .filter((cat) => (counts[cat] || 0) > 0 || categoryFilter === cat)
      .map((cat) => {
        const c = counts[cat] || 0;
        return `<button class="chip ${categoryFilter === cat ? 'active' : ''}" data-cat="${escapeHtml(cat)}">${escapeHtml(displayCategoryName(cat, lang))}<span class="chip-count">${c}</span></button>`;
      }),
  ].join('');

  row.innerHTML = chipsHtml;
  row.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((btn) => {
    btn.onclick = () => {
      categoryFilter = btn.dataset.cat || 'all';
      render();
    };
  });
}

async function reorderCategories(orderedCats: string[]) {
  try {
    const res = await app.callServerTool({
      name: 'reorder_items',
      arguments: { target: 'categories', orderedNames: orderedCats },
    });
    if (res?.structuredContent) {
      catalog = res.structuredContent as unknown as CatalogData;
      render();
      showToast(t().orderUpdated);
    }
  } catch {
    showToast(t().saveFailed);
  }
}

async function reorderGroupItems(
  kind: 'skill' | 'mcp',
  orderedVisibleNames: string[],
  moveItemCategory?: { kind: 'skill' | 'mcp'; name: string; category: string }
) {
  const fullList = (kind === 'skill' ? catalog.skills : catalog.mcps)
    .map((x) => x.name)
    .filter((n) => !(moveItemCategory && n === moveItemCategory.name));
  const subsetSet = new Set(orderedVisibleNames);
  let idx = 0;
  const nextFull = fullList.map((n) => (subsetSet.has(n) ? orderedVisibleNames[idx++] : n));
  for (const n of orderedVisibleNames) {
    if (!nextFull.includes(n)) nextFull.push(n);
  }

  try {
    const res = await app.callServerTool({
      name: 'reorder_items',
      arguments: {
        target: kind === 'skill' ? 'skills' : 'mcps',
        orderedNames: nextFull,
        moveItemCategory,
      },
    });
    if (res?.structuredContent) {
      catalog = res.structuredContent as unknown as CatalogData;
      render();
      showToast(
        moveItemCategory
          ? t().movedToCat(moveItemCategory.name, displayCategoryName(moveItemCategory.category, getLang()))
          : t().orderUpdated
      );
    }
  } catch {
    showToast(t().saveFailed);
  }
}

async function reorderPlugins(orderedPlugins: string[]) {
  const existing = catalog.order?.plugins || [];
  const merged = [...orderedPlugins, ...existing.filter((p) => !orderedPlugins.includes(p))];
  try {
    const res = await app.callServerTool({
      name: 'reorder_items',
      arguments: { target: 'plugins', orderedNames: merged },
    });
    if (res?.structuredContent) {
      catalog = res.structuredContent as unknown as CatalogData;
      render();
      showToast(t().orderUpdated);
    }
  } catch {
    showToast(t().saveFailed);
  }
}

function renderCategoryManager() {
  const panel = document.getElementById('cat-manager');
  if (!panel) return;
  panel.style.display = showCategoryManager ? 'block' : 'none';
  if (!showCategoryManager) return;

  const tr = t();
  const lang = getLang();

  const listHtml = catalog.categories
    .map((cat, idx) => {
      if (renamingCategory === cat) {
        return `
      <div class="cat-mgr-row">
        <input class="input-sm" id="rename-cat-input" type="text" value="${escapeHtml(cat)}" style="flex:1;" />
        <div class="cat-mgr-btns">
          <button class="btn btn-xs btn-primary" id="rename-cat-save">${escapeHtml(tr.btnConfirm)}</button>
          <button class="btn btn-xs btn-secondary" id="rename-cat-cancel">${escapeHtml(tr.btnCancel)}</button>
        </div>
      </div>`;
      }
      return `
      <div class="cat-mgr-row" draggable="true" data-cat-drag="${escapeHtml(cat)}">
        <span class="drag-handle" title="Drag">⋮⋮</span>
        <span class="cat-mgr-name">${escapeHtml(displayCategoryName(cat, lang))}</span>
        <div class="cat-mgr-btns">
          <button class="btn btn-xs btn-secondary" data-rename-cat="${escapeHtml(cat)}">${escapeHtml(tr.btnRename)}</button>
          <button class="btn btn-xs btn-danger" data-del-cat="${escapeHtml(cat)}">${escapeHtml(tr.btnDelete)}</button>
        </div>
      </div>`;
    })
    .join('');

  panel.innerHTML = `
    <div class="cat-mgr-header">
      <span class="cat-mgr-title">${escapeHtml(tr.catMgrTitle)}</span>
      <div class="cat-mgr-add">
        <input class="input-sm" id="new-cat-input" type="text" placeholder="${escapeHtml(tr.newCatPlaceholder)}" />
        <button class="btn btn-xs btn-primary" id="add-cat-submit">${escapeHtml(tr.btnAdd)}</button>
      </div>
    </div>
    <div class="cat-mgr-list">${listHtml}</div>
  `;

  const submitNew = async () => {
    const input = document.getElementById('new-cat-input') as HTMLInputElement | null;
    const name = (input?.value || '').trim();
    if (!name) return;
    await callManageCategories('add', name);
  };

  document.getElementById('add-cat-submit')?.addEventListener('click', submitNew);
  document.getElementById('new-cat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitNew();
  });

  const submitRename = async () => {
    if (!renamingCategory) return;
    const input = document.getElementById('rename-cat-input') as HTMLInputElement | null;
    const next = (input?.value || '').trim();
    const oldName = renamingCategory;
    renamingCategory = null;
    if (next && next !== oldName) {
      await callManageCategories('rename', oldName, next);
      if (categoryFilter === oldName) categoryFilter = next;
    } else {
      renderCategoryManager();
    }
  };

  document.getElementById('rename-cat-save')?.addEventListener('click', submitRename);
  document.getElementById('rename-cat-cancel')?.addEventListener('click', () => {
    renamingCategory = null;
    renderCategoryManager();
  });
  document.getElementById('rename-cat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitRename();
    if (e.key === 'Escape') {
      renamingCategory = null;
      renderCategoryManager();
    }
  });

  panel.querySelectorAll<HTMLButtonElement>('[data-rename-cat]').forEach((btn) => {
    btn.onclick = () => {
      renamingCategory = btn.dataset.renameCat || null;
      renderCategoryManager();
    };
  });

  panel.querySelectorAll<HTMLButtonElement>('[data-del-cat]').forEach((btn) => {
    btn.onclick = async () => {
      const target = btn.dataset.delCat || '';
      await callManageCategories('delete', target);
      if (categoryFilter === target) categoryFilter = 'all';
    };
  });

  // Drag & drop inside category manager
  panel.querySelectorAll<HTMLElement>('[data-cat-drag]').forEach((row) => {
    row.addEventListener('dragstart', (e) => {
      const name = row.dataset.catDrag || '';
      dragPayload = { type: 'category', name };
      row.classList.add('dragging');
      e.dataTransfer?.setData('text/plain', name);
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      panel.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
      dragPayload = null;
    });
    row.addEventListener('dragover', (e) => {
      if (dragPayload?.type !== 'category') return;
      e.preventDefault();
      row.classList.add('drag-over');
    });
    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
    row.addEventListener('drop', async (e) => {
      e.preventDefault();
      row.classList.remove('drag-over');
      if (dragPayload?.type !== 'category') return;
      const fromName = dragPayload.name;
      const toName = row.dataset.catDrag || '';
      if (!fromName || !toName || fromName === toName) return;
      const list = [...catalog.categories];
      const fromIdx = list.indexOf(fromName);
      const toIdx = list.indexOf(toName);
      if (fromIdx === -1 || toIdx === -1) return;
      list.splice(fromIdx, 1);
      list.splice(toIdx, 0, fromName);
      await reorderCategories(list);
    });
  });
}

function renderSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  if (!panel) return;
  panel.style.display = showSettings ? 'block' : 'none';
  if (!showSettings) return;

  const tr = t();
  const s = getSettings();

  panel.innerHTML = `
    <div class="settings-header">
      <span class="settings-title">${escapeHtml(tr.settingsTitle)}</span>
      <button class="btn btn-xs btn-secondary" id="close-settings-btn">${escapeHtml(tr.btnCollapseEdit)}</button>
    </div>

    <div class="settings-grid">
      <div class="settings-section">
        <div class="settings-sec-title">${escapeHtml(tr.secLang)}</div>
        <div class="setting-row">
          <span>${escapeHtml(tr.langLabel)}</span>
          <select class="select-sm" id="set-language">
            <option value="zh" ${s.language === 'zh' ? 'selected' : ''}>简体中文</option>
            <option value="en" ${s.language === 'en' ? 'selected' : ''}>English</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-sec-title">${escapeHtml(tr.secLayout)}</div>
        <div class="setting-row">
          <span>${escapeHtml(tr.densityLabel)}</span>
          <select class="select-sm" id="set-density">
            <option value="compact" ${s.density === 'compact' ? 'selected' : ''}>${escapeHtml(tr.densityCompact)}</option>
            <option value="standard" ${s.density === 'standard' ? 'selected' : ''}>${escapeHtml(tr.densityStandard)}</option>
            <option value="comfortable" ${s.density === 'comfortable' ? 'selected' : ''}>${escapeHtml(tr.densityComfortable)}</option>
          </select>
        </div>
        <div class="setting-row">
          <span>${escapeHtml(tr.spacingLabel)}</span>
          <select class="select-sm" id="set-groupSpacing">
            <option value="normal" ${s.groupSpacing === 'normal' ? 'selected' : ''}>${escapeHtml(tr.spacingNormal)}</option>
            <option value="wide" ${s.groupSpacing === 'wide' ? 'selected' : ''}>${escapeHtml(tr.spacingWide)}</option>
          </select>
        </div>
        <div class="setting-row">
          <span>${escapeHtml(tr.descLinesLabel)}</span>
          <select class="select-sm" id="set-descLines">
            <option value="2" ${s.descLines === '2' ? 'selected' : ''}>2</option>
            <option value="4" ${s.descLines === '4' ? 'selected' : ''}>4</option>
            <option value="all" ${s.descLines === 'all' ? 'selected' : ''}>${escapeHtml(tr.descLinesAll)}</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-sec-title">${escapeHtml(tr.secFolding)}</div>
        <div class="setting-row">
          <span>${escapeHtml(tr.defaultViewLabel)}</span>
          <select class="select-sm" id="set-defaultView">
            <option value="grouped" ${s.defaultView === 'grouped' ? 'selected' : ''}>${escapeHtml(tr.viewGrouped)}</option>
            <option value="flat" ${s.defaultView === 'flat' ? 'selected' : ''}>${escapeHtml(tr.viewFlat)}</option>
          </select>
        </div>
        <div class="setting-row">
          <span>${escapeHtml(tr.defaultGroupLabel)}</span>
          <select class="select-sm" id="set-defaultGroupState">
            <option value="expanded" ${s.defaultGroupState === 'expanded' ? 'selected' : ''}>${escapeHtml(tr.stateExpanded)}</option>
            <option value="collapsed" ${s.defaultGroupState === 'collapsed' ? 'selected' : ''}>${escapeHtml(tr.stateCollapsed)}</option>
          </select>
        </div>
        <div class="setting-row">
          <span>${escapeHtml(tr.pluginFoldLabel)}</span>
          <select class="select-sm" id="set-pluginFoldRule">
            <option value="auto" ${s.pluginFoldRule === 'auto' ? 'selected' : ''}>${escapeHtml(tr.foldAuto)}</option>
            <option value="always_collapsed" ${s.pluginFoldRule === 'always_collapsed' ? 'selected' : ''}>${escapeHtml(tr.foldCollapsed)}</option>
            <option value="always_expanded" ${s.pluginFoldRule === 'always_expanded' ? 'selected' : ''}>${escapeHtml(tr.foldExpanded)}</option>
          </select>
        </div>
        <label class="setting-check">
          <input type="checkbox" id="set-hideDisabled" ${s.hideDisabled ? 'checked' : ''} />
          <span>${escapeHtml(tr.hideDisabledLabel)}</span>
        </label>
      </div>

      <div class="settings-section">
        <div class="settings-sec-title">${escapeHtml(tr.secPrompt)} <span class="hint">${escapeHtml(tr.promptHint)}</span></div>
        <div class="setting-col">
          <label class="edit-label">${escapeHtml(tr.promptZhLabel)}</label>
          <input class="input-sm" id="set-promptZh" type="text" value="${escapeHtml(s.promptTemplateZh)}" />
        </div>
        <div class="setting-col">
          <label class="edit-label">${escapeHtml(tr.promptEnLabel)}</label>
          <input class="input-sm" id="set-promptEn" type="text" value="${escapeHtml(s.promptTemplateEn)}" />
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-sec-title">${escapeHtml(tr.secScan)}</div>
        <label class="setting-check">
          <input type="checkbox" id="set-autoFocus" ${s.autoDiscoverOnFocus ? 'checked' : ''} />
          <span>${escapeHtml(tr.autoFocusLabel)}</span>
        </label>
        <label class="setting-check">
          <input type="checkbox" id="set-showBuiltin" ${s.showBuiltin ? 'checked' : ''} />
          <span>${escapeHtml(tr.showBuiltinLabel)}</span>
        </label>
        <label class="setting-check">
          <input type="checkbox" id="set-showPlugin" ${s.showPlugin ? 'checked' : ''} />
          <span>${escapeHtml(tr.showPluginLabel)}</span>
        </label>
        <div class="setting-col">
          <label class="edit-label">${escapeHtml(tr.extraDirsLabel)}</label>
          <textarea class="textarea-sm" id="set-extraDirs" rows="2">${escapeHtml((s.extraSkillDirs || []).join('\n'))}</textarea>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-sec-title">${escapeHtml(tr.secBackup)}</div>
        <div class="backup-actions">
          <button class="btn btn-xs btn-secondary" id="export-meta-btn">${escapeHtml(tr.exportBtn)}</button>
          <button class="btn btn-xs btn-secondary" id="toggle-import-btn">${escapeHtml(tr.importBtn)}</button>
          <button class="btn btn-xs btn-danger" id="ask-reset-btn">${escapeHtml(tr.resetBtn)}</button>
        </div>
        ${
          showResetConfirm
            ? `<div class="inline-confirm">
                <span>${escapeHtml(tr.resetConfirmText)}</span>
                <button class="btn btn-xs btn-danger" id="confirm-reset-btn">${escapeHtml(tr.btnConfirm)}</button>
                <button class="btn btn-xs btn-secondary" id="cancel-reset-btn">${escapeHtml(tr.btnCancel)}</button>
              </div>`
            : ''
        }
        ${
          showImportBox
            ? `<div class="import-box">
                <textarea class="textarea-sm" id="import-json-input" rows="3" placeholder="${escapeHtml(tr.importPlaceholder)}"></textarea>
                <div class="edit-actions">
                  <button class="btn btn-xs btn-primary" id="confirm-import-btn">${escapeHtml(tr.btnConfirm)}</button>
                  <button class="btn btn-xs btn-secondary" id="cancel-import-btn">${escapeHtml(tr.btnCancel)}</button>
                </div>
              </div>`
            : ''
        }
        ${
          exportedPreview
            ? `<textarea class="textarea-sm" rows="3" readonly>${escapeHtml(exportedPreview)}</textarea>`
            : ''
        }
      </div>
    </div>

    <div class="settings-footer">
      <button class="btn btn-primary" id="save-settings-btn">${escapeHtml(tr.btnSave)}</button>
    </div>
  `;

  document.getElementById('close-settings-btn')?.addEventListener('click', () => {
    showSettings = false;
    renderSettingsPanel();
  });

  document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
    const nextSettings: Partial<AppSettings> = {
      language: ((document.getElementById('set-language') as HTMLSelectElement)?.value as Lang) || 'zh',
      density: ((document.getElementById('set-density') as HTMLSelectElement)?.value as AppSettings['density']) || 'standard',
      groupSpacing: ((document.getElementById('set-groupSpacing') as HTMLSelectElement)?.value as AppSettings['groupSpacing']) || 'wide',
      descLines: ((document.getElementById('set-descLines') as HTMLSelectElement)?.value as AppSettings['descLines']) || '2',
      defaultView: ((document.getElementById('set-defaultView') as HTMLSelectElement)?.value as AppSettings['defaultView']) || 'grouped',
      defaultGroupState: ((document.getElementById('set-defaultGroupState') as HTMLSelectElement)?.value as AppSettings['defaultGroupState']) || 'expanded',
      pluginFoldRule: ((document.getElementById('set-pluginFoldRule') as HTMLSelectElement)?.value as AppSettings['pluginFoldRule']) || 'auto',
      hideDisabled: Boolean((document.getElementById('set-hideDisabled') as HTMLInputElement)?.checked),
      promptTemplateZh: (document.getElementById('set-promptZh') as HTMLInputElement)?.value || DEFAULT_SETTINGS.promptTemplateZh,
      promptTemplateEn: (document.getElementById('set-promptEn') as HTMLInputElement)?.value || DEFAULT_SETTINGS.promptTemplateEn,
      autoDiscoverOnFocus: Boolean((document.getElementById('set-autoFocus') as HTMLInputElement)?.checked),
      showBuiltin: Boolean((document.getElementById('set-showBuiltin') as HTMLInputElement)?.checked),
      showPlugin: Boolean((document.getElementById('set-showPlugin') as HTMLInputElement)?.checked),
      extraSkillDirs: ((document.getElementById('set-extraDirs') as HTMLTextAreaElement)?.value || '')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    };
    await saveSettings(nextSettings);
  });

  document.getElementById('export-meta-btn')?.addEventListener('click', async () => {
    try {
      const res = await app.callServerTool({ name: 'metadata_backup', arguments: { action: 'export' } });
      const sc = res?.structuredContent as unknown as CatalogData;
      if (sc?.exportedJson) {
        exportedPreview = sc.exportedJson;
        await copyText(sc.exportedJson, t().exportedToast);
        renderSettingsPanel();
      }
    } catch {
      showToast(t().saveFailed);
    }
  });

  document.getElementById('toggle-import-btn')?.addEventListener('click', () => {
    showImportBox = !showImportBox;
    renderSettingsPanel();
  });

  document.getElementById('cancel-import-btn')?.addEventListener('click', () => {
    showImportBox = false;
    renderSettingsPanel();
  });

  document.getElementById('confirm-import-btn')?.addEventListener('click', async () => {
    const payload = (document.getElementById('import-json-input') as HTMLTextAreaElement)?.value || '';
    if (!payload.trim()) return;
    try {
      const res = await app.callServerTool({
        name: 'metadata_backup',
        arguments: { action: 'import', payload },
      });
      if (res?.structuredContent) {
        catalog = res.structuredContent as unknown as CatalogData;
        showImportBox = false;
        render();
        showToast(catalog.lastActionMessage || t().saved);
      }
    } catch {
      showToast(t().saveFailed);
    }
  });

  document.getElementById('ask-reset-btn')?.addEventListener('click', () => {
    showResetConfirm = !showResetConfirm;
    renderSettingsPanel();
  });

  document.getElementById('cancel-reset-btn')?.addEventListener('click', () => {
    showResetConfirm = false;
    renderSettingsPanel();
  });

  document.getElementById('confirm-reset-btn')?.addEventListener('click', async () => {
    try {
      const res = await app.callServerTool({ name: 'metadata_backup', arguments: { action: 'reset' } });
      if (res?.structuredContent) {
        catalog = res.structuredContent as unknown as CatalogData;
        showResetConfirm = false;
        initialSettingsApplied = false;
        collapsedGroups.clear();
        expandedGroups.clear();
        expandedPlugins.clear();
        collapsedPlugins.clear();
        render();
        showToast(catalog.lastActionMessage || t().saved);
      }
    } catch {
      showToast(t().saveFailed);
    }
  });
}

async function saveSettings(partial: Partial<AppSettings>) {
  try {
    const res = await app.callServerTool({
      name: 'update_settings',
      arguments: { settings: partial },
    });
    if (res?.structuredContent) {
      catalog = res.structuredContent as unknown as CatalogData;
      if (partial.defaultView) viewMode = partial.defaultView;
      render();
      showToast(t().settingsSaved);
    }
  } catch {
    showToast(t().saveFailed);
  }
}

async function callManageCategories(
  action: 'add' | 'rename' | 'delete' | 'move',
  name: string,
  newName?: string,
  direction?: 'up' | 'down'
) {
  try {
    const res = await app.callServerTool({
      name: 'manage_categories',
      arguments: { action, name, newName, direction },
    });
    if (res?.structuredContent) {
      catalog = res.structuredContent as unknown as CatalogData;
      render();
      showToast(action === 'move' ? t().orderUpdated : t().catUpdated);
    }
  } catch {
    showToast(t().saveFailed);
  }
}

async function saveItemMeta(
  kind: 'skill' | 'mcp',
  name: string,
  category: string,
  customNote: string
) {
  try {
    const res = await app.callServerTool({
      name: 'update_item_meta',
      arguments: { kind, name, category, customNote },
    });
    if (res?.structuredContent) {
      catalog = res.structuredContent as unknown as CatalogData;
      editingKey = null;
      render();
      showToast(t().saved);
    }
  } catch {
    showToast(t().saveFailed);
  }
}

async function toggleItemEnabled(kind: 'skill' | 'mcp', name: string, nextEnabled: boolean) {
  try {
    const res = await app.callServerTool({
      name: 'toggle_item_enabled',
      arguments: { kind, name, enabled: nextEnabled },
    });
    if (res?.structuredContent) {
      const data = res.structuredContent as unknown as CatalogData;
      catalog = data;
      render();
      showToast(data.lastActionMessage || t().saved);
    }
  } catch {
    showToast(t().saveFailed);
  }
}

function renderEditPanel(
  kind: 'skill' | 'mcp',
  name: string,
  currentCat: string,
  customNote: string,
  defaultNote: string
): string {
  const tr = t();
  const lang = getLang();
  const allCats = [...catalog.categories];
  if (!allCats.includes('未分类')) allCats.push('未分类');
  if (currentCat && !allCats.includes(currentCat)) allCats.unshift(currentCat);

  const options = allCats
    .map(
      (c) =>
        `<option value="${escapeHtml(c)}" ${c === currentCat ? 'selected' : ''}>${escapeHtml(displayCategoryName(c, lang))}</option>`
    )
    .join('');

  const key = `${kind}:${name}`;
  return `
    <div class="edit-panel" data-edit-panel="${escapeHtml(key)}">
      <div class="edit-inline">
        <select class="select-sm" data-edit-cat="${escapeHtml(key)}">${options}</select>
        <div class="edit-actions">
          <button class="btn btn-xs btn-primary" data-save-edit="${escapeHtml(key)}">${escapeHtml(tr.btnSave)}</button>
          ${customNote ? `<button class="btn btn-xs btn-secondary" data-reset-note="${escapeHtml(key)}">${escapeHtml(tr.btnResetNote)}</button>` : ''}
          <button class="btn btn-xs btn-secondary" data-cancel-edit="${escapeHtml(key)}">${escapeHtml(tr.btnCancel)}</button>
        </div>
      </div>
      <textarea class="textarea-sm" rows="2" data-edit-note="${escapeHtml(key)}" placeholder="${escapeHtml(tr.notePlaceholder)}">${escapeHtml(customNote)}</textarea>
      <div class="default-preview">${escapeHtml(tr.defaultPrefix)}${escapeHtml(defaultNote)}</div>
    </div>
  `;
}

function renderSkillCard(
  s: SkillItem,
  hidePluginBadge: boolean,
  siblingNames: string[]
): string {
  const tr = t();
  const lang = getLang();
  const sourceBadge =
    s.source === 'custom'
      ? `<span class="badge badge-custom">${escapeHtml(tr.badgeCustom)}</span>`
      : s.source === 'plugin' && !hidePluginBadge
        ? `<span class="badge badge-plugin">${escapeHtml(s.pluginName || tr.srcPlugin)}</span>`
        : s.source === 'builtin'
          ? `<span class="badge badge-builtin">${escapeHtml(tr.badgeBuiltin)}</span>`
          : '';

  const newBadge = s.isNew ? '<span class="badge badge-new">🆕</span>' : '';
  const statusBadge = s.disabled ? `<span class="badge badge-disabled">${escapeHtml(tr.badgeDisabled)}</span>` : '';
  const catBadge =
    viewMode === 'flat' || categoryFilter !== 'all'
      ? `<span class="badge badge-cat">${escapeHtml(displayCategoryName(s.category, lang))}</span>`
      : '';

  const prompt = buildPrompt(s.name);
  const key = `skill:${s.name}`;
  const isEditing = editingKey === key;

  const notePrefix = s.hasCustomNote
    ? `<span class="note-tag note-tag-custom">${escapeHtml(tr.customTag)}</span>`
    : '';
  const noteTitle = s.hasCustomNote
    ? `${s.customNote}\n${tr.defaultPrefix}${s.defaultNote}`
    : s.defaultNote;

  const toggleBtn = s.canToggle
    ? s.disabled
      ? `<button class="btn btn-xs btn-enable" data-toggle-kind="skill" data-toggle-name="${escapeHtml(s.name)}" data-toggle-next="true">${escapeHtml(tr.btnEnable)}</button>`
      : `<button class="btn btn-xs btn-muted" data-toggle-kind="skill" data-toggle-name="${escapeHtml(s.name)}" data-toggle-next="false">${escapeHtml(tr.btnDisable)}</button>`
    : '';

  const isAttached = attachedItems.some((x) => x.key === key);
  const attachBtn =
    canUpdateContext && !s.disabled
      ? `<button class="btn btn-xs ${isAttached ? 'btn-enable' : 'btn-primary'}" data-attach-key="${escapeHtml(key)}" data-attach-label="${escapeHtml(s.name)}" data-attach-text="${escapeHtml(prompt)}">${escapeHtml(isAttached ? tr.btnAttached : tr.btnAttach)}</button>`
      : '';

  return `
    <div class="card ${s.disabled ? 'card-disabled' : ''}" draggable="true" data-card-kind="skill" data-card-name="${escapeHtml(s.name)}" data-card-cat="${escapeHtml(s.category)}" data-drag-text="${escapeHtml(prompt)}" data-siblings="${escapeHtml(JSON.stringify(siblingNames))}">
      <div class="card-top">
        <div class="card-left">
          <span class="drag-handle" title="Drag">⋮⋮</span>
          <span class="card-title">${escapeHtml(s.name)}</span>
          ${newBadge}${statusBadge}${sourceBadge}${catBadge}
        </div>
        <div class="card-ops">
          ${toggleBtn}
          ${attachBtn}
          <button class="btn btn-xs btn-secondary" data-copy="${escapeHtml(prompt)}">${escapeHtml(tr.btnCopy)}</button>
          <button class="btn btn-xs btn-secondary" data-toggle-edit="${escapeHtml(key)}">${escapeHtml(isEditing ? tr.btnCollapseEdit : tr.btnEdit)}</button>
        </div>
      </div>
      <div class="card-desc ${s.hasCustomNote ? 'custom-note' : ''}" title="${escapeHtml(noteTitle)}">${notePrefix}${escapeHtml(s.displayNote)}</div>
      ${isEditing ? renderEditPanel('skill', s.name, s.category, s.customNote, s.defaultNote) : ''}
    </div>
  `;
}

function renderMcpCard(m: McpItem, siblingNames: string[]): string {
  const tr = t();
  const lang = getLang();
  const endpoint = m.serverUrl
    ? m.serverUrl
    : [m.command, ...(m.args || [])].filter(Boolean).join(' ');

  const sourceBadge =
    m.source === 'plugin'
      ? `<span class="badge badge-plugin">${escapeHtml(m.pluginName || tr.srcPlugin)}</span>`
      : m.source === 'discovered'
        ? `<span class="badge badge-new">${escapeHtml(tr.badgeAuto)}</span>`
        : `<span class="badge badge-custom">${escapeHtml(tr.badgeCustom)}</span>`;

  const statusBadge = m.disabled
    ? `<span class="badge badge-disabled">${escapeHtml(tr.badgeDisabled)}</span>`
    : `<span class="badge badge-builtin">${escapeHtml(tr.badgeRunning)}</span>`;

  const toolBadge =
    m.toolCount && m.toolCount > 0
      ? `<span class="badge">${escapeHtml(tr.toolsCount(m.toolCount))}</span>`
      : '';

  const catBadge =
    viewMode === 'flat' || categoryFilter !== 'all'
      ? `<span class="badge badge-cat">${escapeHtml(displayCategoryName(m.category, lang))}</span>`
      : '';

  const newBadge = m.isNew ? '<span class="badge badge-new">🆕</span>' : '';
  const key = `mcp:${m.name}`;
  const isEditing = editingKey === key;

  const toggleBtn = m.canToggle
    ? m.disabled
      ? `<button class="btn btn-xs btn-enable" data-toggle-kind="mcp" data-toggle-name="${escapeHtml(m.name)}" data-toggle-next="true">${escapeHtml(tr.btnEnable)}</button>`
      : `<button class="btn btn-xs btn-muted" data-toggle-kind="mcp" data-toggle-name="${escapeHtml(m.name)}" data-toggle-next="false">${escapeHtml(tr.btnDisable)}</button>`
    : '';

  const notePrefix = m.hasCustomNote
    ? `<span class="note-tag note-tag-custom">${escapeHtml(tr.customTag)}</span>`
    : '';

  const mcpPrompt = buildMcpPrompt(m.name);
  const isAttached = attachedItems.some((x) => x.key === key);
  const attachBtn =
    canUpdateContext && !m.disabled
      ? `<button class="btn btn-xs ${isAttached ? 'btn-enable' : 'btn-primary'}" data-attach-key="${escapeHtml(key)}" data-attach-label="${escapeHtml(m.name)}" data-attach-text="${escapeHtml(mcpPrompt)}">${escapeHtml(isAttached ? tr.btnAttached : tr.btnAttach)}</button>`
      : '';

  return `
    <div class="card ${m.disabled ? 'card-disabled' : ''}" draggable="true" data-card-kind="mcp" data-card-name="${escapeHtml(m.name)}" data-card-cat="${escapeHtml(m.category)}" data-drag-text="${escapeHtml(mcpPrompt)}" data-siblings="${escapeHtml(JSON.stringify(siblingNames))}">
      <div class="card-top">
        <div class="card-left">
          <span class="drag-handle" title="Drag">⋮⋮</span>
          <span class="card-title">${escapeHtml(m.name)}</span>
          ${newBadge}${statusBadge}${sourceBadge}${toolBadge}${catBadge}
        </div>
        <div class="card-ops">
          ${toggleBtn}
          ${attachBtn}
          ${endpoint ? `<button class="btn btn-xs btn-secondary" data-copy="${escapeHtml(endpoint)}" data-copy-label="${escapeHtml(tr.copiedPath)}">${escapeHtml(tr.btnCopy)}</button>` : ''}
          <button class="btn btn-xs btn-secondary" data-toggle-edit="${escapeHtml(key)}">${escapeHtml(isEditing ? tr.btnCollapseEdit : tr.btnEdit)}</button>
        </div>
      </div>
      <div class="card-desc ${m.hasCustomNote ? 'custom-note' : ''}">${notePrefix}${escapeHtml(m.displayNote)}</div>
      ${endpoint ? `<div class="card-endpoint" title="${escapeHtml(endpoint)}">${escapeHtml(endpoint)}</div>` : ''}
      ${isEditing ? renderEditPanel('mcp', m.name, m.category, m.customNote, m.defaultNote) : ''}
    </div>
  `;
}

function isGroupCollapsed(gKey: string): boolean {
  if (getSettings().defaultGroupState === 'collapsed') {
    return !expandedGroups.has(gKey);
  }
  return collapsedGroups.has(gKey);
}

function isPluginExpanded(pKey: string, count: number): boolean {
  const rule = getSettings().pluginFoldRule;
  if (rule === 'always_expanded') return !collapsedPlugins.has(pKey);
  if (rule === 'always_collapsed') return expandedPlugins.has(pKey);
  // auto: collapse when >= 2 unless explicitly expanded
  if (count <= 1) return true;
  return expandedPlugins.has(pKey);
}

function renderGroupedItems(items: (SkillItem | McpItem)[], forceExpandPlugins: boolean): string {
  const tr = t();
  const standalone: (SkillItem | McpItem)[] = [];
  const byPlugin = new Map<string, (SkillItem | McpItem)[]>();

  for (const item of items) {
    if (item.source === 'plugin' && item.pluginName) {
      if (!byPlugin.has(item.pluginName)) byPlugin.set(item.pluginName, []);
      byPlugin.get(item.pluginName)!.push(item);
    } else {
      standalone.push(item);
    }
  }

  // Sort plugin subgroups by saved pluginOrder
  const pluginOrder = catalog.order?.plugins || [];
  const pluginEntries = [...byPlugin.entries()];
  if (pluginOrder.length > 0) {
    const rank = new Map<string, number>();
    pluginOrder.forEach((p, idx) => rank.set(p, idx));
    pluginEntries.sort((a, b) => {
      const ra = rank.has(a[0]) ? rank.get(a[0])! : Number.MAX_SAFE_INTEGER;
      const rb = rank.has(b[0]) ? rank.get(b[0])! : Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });
  }

  const standaloneNames = standalone.map((x) => x.name);
  const parts: string[] = [];

  for (const item of standalone) {
    parts.push(
      activeTab === 'skills'
        ? renderSkillCard(item as SkillItem, false, standaloneNames)
        : renderMcpCard(item as McpItem, standaloneNames)
    );
  }

  const pluginNamesList = pluginEntries.map(([p]) => p);

  for (let pIdx = 0; pIdx < pluginEntries.length; pIdx++) {
    const [pluginName, pItems] = pluginEntries[pIdx];
    if (pItems.length === 1 && activeTab === 'mcps') {
      parts.push(renderMcpCard(pItems[0] as McpItem, standaloneNames));
      continue;
    }

    const pKey = `${activeTab}:${pluginName}`;
    const isExpanded = forceExpandPlugins || isPluginExpanded(pKey, pItems.length);
    const hasNew = pItems.some((x) => x.isNew);
    const pSiblingNames = pItems.map((x) => x.name);
    const pluginPrompt = buildPluginPrompt(pluginName, pSiblingNames);
    const pAttachKey = `plugin:${pluginName}`;
    const pAttached = attachedItems.some((x) => x.key === pAttachKey);

    const pAttachBtn = canUpdateContext
      ? `<button class="btn btn-xs ${pAttached ? 'btn-enable' : 'btn-primary'}" data-attach-key="${escapeHtml(pAttachKey)}" data-attach-label="🧩 ${escapeHtml(pluginName)}" data-attach-text="${escapeHtml(pluginPrompt)}">${escapeHtml(pAttached ? tr.btnAttached : tr.btnAttach)}</button>`
      : '';

    const chevronSvg = `<svg class="chevron-svg ${isExpanded ? 'is-open' : ''}" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M4.5 2.5L8 6L4.5 9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    parts.push(`
      <div class="plugin-subgroup" draggable="true" data-plugin-drag="${escapeHtml(pluginName)}" data-drag-text="${escapeHtml(pluginPrompt)}" data-plugin-list="${escapeHtml(JSON.stringify(pluginNamesList))}">
        <div class="plugin-header" data-plugin-toggle="${escapeHtml(pKey)}">
          <span class="drag-handle" title="Drag">⋮⋮</span>
          <span class="group-arrow">${chevronSvg}</span>
          <span class="plugin-title">🧩 ${escapeHtml(pluginName)}</span>
          ${hasNew ? '<span class="badge badge-new">🆕</span>' : ''}
          <span class="plugin-ops" onclick="event.stopPropagation()">
            ${pAttachBtn}
            <button class="btn btn-xs btn-secondary" data-copy="${escapeHtml(pluginPrompt)}">${escapeHtml(tr.btnCopy)}</button>
          </span>
          <span class="group-count">${pItems.length}</span>
        </div>
        ${
          isExpanded
            ? `<div class="plugin-body view-anim">${pItems
                .map((it) =>
                  activeTab === 'skills'
                    ? renderSkillCard(it as SkillItem, true, pSiblingNames)
                    : renderMcpCard(it as McpItem, pSiblingNames)
                )
                .join('')}</div>`
            : ''
        }
      </div>
    `);
  }

  return parts.join('');
}

function bindCardEvents(container: HTMLElement) {
  const tr = t();

  container.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      copyText(btn.dataset.copy || '', btn.dataset.copyLabel || tr.copiedPrompt);
    };
  });

  container.querySelectorAll<HTMLButtonElement>('[data-attach-key]').forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      await toggleAttachItem(
        btn.dataset.attachKey || '',
        btn.dataset.attachLabel || '',
        btn.dataset.attachText || ''
      );
    };
  });

  container.querySelectorAll<HTMLButtonElement>('[data-send]').forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const text = btn.dataset.send || '';
      try {
        await app.sendMessage({
          role: 'user',
          content: [{ type: 'text', text }],
        });
        showToast(tr.sentToChat);
      } catch {
        copyText(text, tr.sendFallback);
      }
    };
  });

  container.querySelectorAll<HTMLButtonElement>('[data-toggle-kind]').forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const kind = btn.dataset.toggleKind as 'skill' | 'mcp';
      const name = btn.dataset.toggleName || '';
      const next = btn.dataset.toggleNext === 'true';
      await toggleItemEnabled(kind, name, next);
    };
  });

  container.querySelectorAll<HTMLButtonElement>('[data-toggle-edit]').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const key = btn.dataset.toggleEdit || '';
      editingKey = editingKey === key ? null : key;
      render();
    };
  });

  container.querySelectorAll<HTMLButtonElement>('[data-cancel-edit]').forEach((btn) => {
    btn.onclick = () => {
      editingKey = null;
      render();
    };
  });

  container.querySelectorAll<HTMLButtonElement>('[data-save-edit]').forEach((btn) => {
    btn.onclick = async () => {
      const key = btn.dataset.saveEdit || '';
      const [kind, ...rest] = key.split(':');
      const name = rest.join(':');
      const catEl = container.querySelector<HTMLSelectElement>(`[data-edit-cat="${CSS.escape(key)}"]`);
      const noteEl = container.querySelector<HTMLTextAreaElement>(`[data-edit-note="${CSS.escape(key)}"]`);
      await saveItemMeta(
        kind as 'skill' | 'mcp',
        name,
        catEl?.value || '未分类',
        noteEl?.value || ''
      );
    };
  });

  container.querySelectorAll<HTMLButtonElement>('[data-reset-note]').forEach((btn) => {
    btn.onclick = async () => {
      const key = btn.dataset.resetNote || '';
      const [kind, ...rest] = key.split(':');
      const name = rest.join(':');
      const catEl = container.querySelector<HTMLSelectElement>(`[data-edit-cat="${CSS.escape(key)}"]`);
      await saveItemMeta(kind as 'skill' | 'mcp', name, catEl?.value || '未分类', '');
    };
  });

  // Group collapse/expand
  container.querySelectorAll<HTMLElement>('[data-group-toggle]').forEach((hdr) => {
    hdr.onclick = () => {
      const g = hdr.dataset.groupToggle || '';
      if (getSettings().defaultGroupState === 'collapsed') {
        if (expandedGroups.has(g)) expandedGroups.delete(g);
        else expandedGroups.add(g);
      } else {
        if (collapsedGroups.has(g)) collapsedGroups.delete(g);
        else collapsedGroups.add(g);
      }
      render();
    };
  });

  // Plugin collapse/expand
  container.querySelectorAll<HTMLElement>('[data-plugin-toggle]').forEach((hdr) => {
    hdr.onclick = () => {
      const pKey = hdr.dataset.pluginToggle || '';
      if (getSettings().pluginFoldRule === 'always_expanded') {
        if (collapsedPlugins.has(pKey)) collapsedPlugins.delete(pKey);
        else collapsedPlugins.add(pKey);
      } else {
        if (expandedPlugins.has(pKey)) expandedPlugins.delete(pKey);
        else expandedPlugins.add(pKey);
      }
      render();
    };
  });

  // Drag & Drop for Cards (same-group reorder OR cross-group move!)
  container.querySelectorAll<HTMLElement>('[data-card-name]').forEach((card) => {
    card.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      const kind = card.dataset.cardKind as 'skill' | 'mcp';
      const name = card.dataset.cardName || '';
      const category = card.dataset.cardCat || '未分类';
      dragPayload = { type: 'card', kind, name, category };
      card.classList.add('dragging');
      e.dataTransfer?.setData('text/plain', card.dataset.dragText || name);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      container.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
      dragPayload = null;
    });
    card.addEventListener('dragover', (e) => {
      if (dragPayload?.type !== 'card') return;
      e.preventDefault();
      e.stopPropagation();
      card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', async (e) => {
      if (dragPayload?.type !== 'card') return;
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove('drag-over');
      const toName = card.dataset.cardName || '';
      const toCat = card.dataset.cardCat || '未分类';
      const fromName = dragPayload.name;
      const fromKind = dragPayload.kind;
      if (!fromName || fromName === toName) return;

      const siblings: string[] = JSON.parse(card.dataset.siblings || '[]');
      if (dragPayload.category === toCat && siblings.includes(fromName)) {
        const fromIdx = siblings.indexOf(fromName);
        const toIdx = siblings.indexOf(toName);
        if (fromIdx !== -1 && toIdx !== -1) {
          siblings.splice(fromIdx, 1);
          siblings.splice(toIdx, 0, fromName);
          await reorderGroupItems(fromKind, siblings);
        }
      } else {
        // Dropped onto a card in a different category -> move to that category & place before target
        const nextSiblings = siblings.filter((n) => n !== fromName);
        const toIdx = nextSiblings.indexOf(toName);
        if (toIdx !== -1) nextSiblings.splice(toIdx, 0, fromName);
        else nextSiblings.push(fromName);
        await reorderGroupItems(fromKind, nextSiblings, {
          kind: fromKind,
          name: fromName,
          category: toCat,
        });
      }
    });
  });

  // Drag & Drop for Group Sections (reorder categories OR drop a card onto a group to move it!)
  container.querySelectorAll<HTMLElement>('[data-group-cat]').forEach((sec) => {
    sec.addEventListener('dragstart', (e) => {
      if ((e.target as HTMLElement).closest('[data-card-name], [data-plugin-drag]')) return;
      const name = sec.dataset.groupCat || '';
      if (!name || name === '未分类') return;
      dragPayload = { type: 'category', name };
      sec.classList.add('dragging');
      e.dataTransfer?.setData('text/plain', name);
    });
    sec.addEventListener('dragend', () => {
      sec.classList.remove('dragging');
      container.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
      dragPayload = null;
    });
    sec.addEventListener('dragover', (e) => {
      if (!dragPayload) return;
      if (dragPayload.type === 'category' || dragPayload.type === 'card') {
        e.preventDefault();
        sec.classList.add('drag-over');
      }
    });
    sec.addEventListener('dragleave', () => sec.classList.remove('drag-over'));
    sec.addEventListener('drop', async (e) => {
      if (!dragPayload) return;
      e.preventDefault();
      sec.classList.remove('drag-over');
      const targetCat = sec.dataset.groupCat || '';
      if (!targetCat) return;

      if (dragPayload.type === 'category') {
        const fromCat = dragPayload.name;
        if (!fromCat || fromCat === targetCat || targetCat === '未分类') return;
        const list = [...catalog.categories];
        const fromIdx = list.indexOf(fromCat);
        const toIdx = list.indexOf(targetCat);
        if (fromIdx === -1 || toIdx === -1) return;
        list.splice(fromIdx, 1);
        list.splice(toIdx, 0, fromCat);
        await reorderCategories(list);
      } else if (dragPayload.type === 'card') {
        if (dragPayload.category === targetCat) return;
        await saveItemMeta(dragPayload.kind, dragPayload.name, targetCat, undefined as any);
      }
    });
  });

  // Drag & Drop for Plugin Subgroups
  container.querySelectorAll<HTMLElement>('[data-plugin-drag]').forEach((sub) => {
    sub.addEventListener('dragstart', (e) => {
      if ((e.target as HTMLElement).closest('[data-card-name]')) return;
      e.stopPropagation();
      const name = sub.dataset.pluginDrag || '';
      dragPayload = { type: 'plugin', name };
      sub.classList.add('dragging');
      e.dataTransfer?.setData('text/plain', sub.dataset.dragText || name);
    });
    sub.addEventListener('dragend', () => {
      sub.classList.remove('dragging');
      container.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
      dragPayload = null;
    });
    sub.addEventListener('dragover', (e) => {
      if (dragPayload?.type !== 'plugin') return;
      e.preventDefault();
      e.stopPropagation();
      sub.classList.add('drag-over');
    });
    sub.addEventListener('dragleave', () => sub.classList.remove('drag-over'));
    sub.addEventListener('drop', async (e) => {
      if (dragPayload?.type !== 'plugin') return;
      e.preventDefault();
      e.stopPropagation();
      sub.classList.remove('drag-over');
      const fromName = dragPayload.name;
      const toName = sub.dataset.pluginDrag || '';
      if (!fromName || !toName || fromName === toName) return;
      const list: string[] = JSON.parse(sub.dataset.pluginList || '[]');
      const fromIdx = list.indexOf(fromName);
      const toIdx = list.indexOf(toName);
      if (fromIdx === -1 || toIdx === -1) return;
      list.splice(fromIdx, 1);
      list.splice(toIdx, 0, fromName);
      await reorderPlugins(list);
    });
  });
}

function render() {
  if (!initialSettingsApplied && catalog.settings) {
    viewMode = catalog.settings.defaultView || 'grouped';
    initialSettingsApplied = true;
  }

  applyAppearanceClasses();
  renderStaticTexts();

  const container = document.getElementById('list');
  const stats = document.getElementById('stats');
  const filterRow = document.getElementById('filter-row');
  const viewBtn = document.getElementById('view-toggle-btn');
  if (!container || !stats || !filterRow) return;

  const tr = t();
  const lang = getLang();

  const pillNav = document.getElementById('main-pill-nav');
  if (pillNav) {
    pillNav.style.setProperty('--active-index', activeTab === 'skills' ? '0' : '1');
  }
  const tabSkills = document.getElementById('tab-skills');
  const tabMcps = document.getElementById('tab-mcps');
  tabSkills?.classList.toggle('is-active', activeTab === 'skills');
  tabMcps?.classList.toggle('is-active', activeTab === 'mcps');
  if (tabSkills) tabSkills.innerHTML = `<span class="pill-tab-label">Skills</span><span class="pill-tab-badge">${catalog.skills.length}</span>`;
  if (tabMcps) tabMcps.innerHTML = `<span class="pill-tab-label">MCPs</span><span class="pill-tab-badge">${catalog.mcps.length}</span>`;
  filterRow.style.display = activeTab === 'skills' ? 'flex' : 'none';
  if (viewBtn) {
    viewBtn.textContent = viewMode === 'grouped' ? tr.viewGrouped : tr.viewFlat;
  }
  const newCnt = (catalog.newlyDetected || []).length;
  stats.textContent = tr.stats(
    catalog.skills.length,
    catalog.mcps.length,
    catalog.categories.length,
    newCnt
  );

  renderNewBanner();
  renderAttachedBar();
  renderCategoryChips();
  renderCategoryManager();
  renderSettingsPanel();

  const items = getCurrentItems();
  if (items.length === 0) {
    container.innerHTML = `<div class="empty">${escapeHtml(activeTab === 'skills' ? tr.emptySkill : tr.emptyMcp)}</div>`;
    return;
  }

  const isSearching = searchQuery.trim().length > 0;
  const flatNames = items.map((x) => x.name);

  if (viewMode === 'flat') {
    container.innerHTML = items
      .map((item) =>
        activeTab === 'skills'
          ? renderSkillCard(item as SkillItem, false, flatNames)
          : renderMcpCard(item as McpItem, flatNames)
      )
      .join('');
  } else if (categoryFilter !== 'all') {
    container.innerHTML = renderGroupedItems(items, isSearching);
  } else {
    const groups = new Map<string, (SkillItem | McpItem)[]>();
    for (const cat of catalog.categories) groups.set(cat, []);
    for (const item of items) {
      const cat = item.category || '未分类';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(item);
    }

    const visibleGroups = [...groups.entries()].filter(([, list]) => list.length > 0);
    const htmlParts: string[] = [];
    for (let gIdx = 0; gIdx < visibleGroups.length; gIdx++) {
      const [cat, list] = visibleGroups[gIdx];
      const gKey = `${activeTab}:${cat}`;
      const isCollapsed = !isSearching && isGroupCollapsed(gKey);
      const isUserCat = cat !== '未分类';

      const chevronSvg = `<svg class="chevron-svg ${!isCollapsed ? 'is-open' : ''}" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M4.5 2.5L8 6L4.5 9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

      htmlParts.push(`
        <div class="group-section" draggable="${isUserCat ? 'true' : 'false'}" data-group-cat="${escapeHtml(cat)}">
          <div class="group-header" data-group-toggle="${escapeHtml(gKey)}">
            ${isUserCat ? '<span class="drag-handle" title="Drag">⋮⋮</span>' : ''}
            <span class="group-arrow">${chevronSvg}</span>
            <span class="group-name">${escapeHtml(displayCategoryName(cat, lang))}</span>
            <span class="group-count">${list.length}</span>
          </div>
          ${isCollapsed ? '' : `<div class="group-body view-anim">${renderGroupedItems(list, isSearching)}</div>`}
        </div>
      `);
    }
    container.innerHTML = htmlParts.join('');
  }

  bindCardEvents(container);
}

async function doRefreshCatalog(showMsg = false) {
  const discBtn = document.getElementById('discover-btn');
  if (showMsg && discBtn) discBtn.classList.add('is-spinning');
  try {
    const res = await app.callServerTool({ name: 'refresh_catalog', arguments: {} });
    if (res?.structuredContent) {
      catalog = res.structuredContent as unknown as CatalogData;
      render();
      if (showMsg) {
        const n = (catalog.newlyDetected || []).length;
        showToast(t().discoverDone(n));
      }
    }
  } catch {
    if (showMsg) showToast(t().discoverFail);
  } finally {
    discBtn?.classList.remove('is-spinning');
  }
}

function setupUI() {
  document.getElementById('tab-skills')?.addEventListener('click', () => {
    activeTab = 'skills';
    categoryFilter = 'all';
    editingKey = null;
    render();
  });

  document.getElementById('tab-mcps')?.addEventListener('click', () => {
    activeTab = 'mcps';
    categoryFilter = 'all';
    editingKey = null;
    render();
  });

  document.getElementById('search')?.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    render();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      sourceFilter = (btn.dataset.filter as any) || 'all';
      document.querySelectorAll('[data-filter]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
  });

  document.getElementById('view-toggle-btn')?.addEventListener('click', () => {
    viewMode = viewMode === 'grouped' ? 'flat' : 'grouped';
    render();
  });

  document.getElementById('expand-all-btn')?.addEventListener('click', () => {
    const anyCollapsed =
      collapsedGroups.size > 0 ||
      (getSettings().defaultGroupState === 'collapsed' && expandedGroups.size === 0);
    if (anyCollapsed || expandedPlugins.size === 0) {
      collapsedGroups.clear();
      collapsedPlugins.clear();
      for (const cat of catalog.categories) expandedGroups.add(`${activeTab}:${cat}`);
      for (const s of catalog.skills) {
        if (s.source === 'plugin' && s.pluginName) expandedPlugins.add(`skills:${s.pluginName}`);
      }
      for (const m of catalog.mcps) {
        if (m.source === 'plugin' && m.pluginName) expandedPlugins.add(`mcps:${m.pluginName}`);
      }
    } else {
      expandedGroups.clear();
      expandedPlugins.clear();
      for (const cat of catalog.categories) collapsedGroups.add(`${activeTab}:${cat}`);
      for (const s of catalog.skills) {
        if (s.source === 'plugin' && s.pluginName) collapsedPlugins.add(`skills:${s.pluginName}`);
      }
      for (const m of catalog.mcps) {
        if (m.source === 'plugin' && m.pluginName) collapsedPlugins.add(`mcps:${m.pluginName}`);
      }
    }
    render();
  });

  document.getElementById('cat-mgr-btn')?.addEventListener('click', () => {
    showCategoryManager = !showCategoryManager;
    if (showCategoryManager) showSettings = false;
    renderCategoryManager();
    renderSettingsPanel();
  });

  document.getElementById('settings-btn')?.addEventListener('click', () => {
    showSettings = !showSettings;
    if (showSettings) showCategoryManager = false;
    renderSettingsPanel();
    renderCategoryManager();
  });

  document.getElementById('lang-toggle-btn')?.addEventListener('click', async () => {
    const nextLang: Lang = getLang() === 'zh' ? 'en' : 'zh';
    await saveSettings({ language: nextLang });
  });

  document.getElementById('discover-btn')?.addEventListener('click', () => {
    doRefreshCatalog(true);
  });

  window.addEventListener('focus', () => {
    if (!getSettings().autoDiscoverOnFocus) return;
    const now = Date.now();
    if (now - lastFocusRefresh > 5000) {
      lastFocusRefresh = now;
      doRefreshCatalog(false);
    }
  });
}

app.ontoolresult = (result) => {
  if (result?.structuredContent) {
    catalog = result.structuredContent as unknown as CatalogData;
    render();
  }
};

app.onhostcontextchanged = (ctx) => {
  if (ctx.theme) applyDocumentTheme(ctx.theme);
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
};

async function init() {
  setupUI();
  await app.connect();
  const caps = app.getHostCapabilities();
  canSendMessage = Boolean(caps?.message);
  canUpdateContext = Boolean(caps?.updateModelContext);
  const ctx = app.getHostContext();
  if (ctx?.theme) applyDocumentTheme(ctx.theme);
  if (ctx?.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
  render();
}

init();
