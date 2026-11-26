import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  DEFAULT_SKILL_META,
  DEFAULT_MCP_META,
  inferCategory,
  buildAutoMcpNote,
} from './default-catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_URI = 'ui://skill-mcp-manager/app.html';
const HOME = os.homedir();
const META_PATH = path.join(__dirname, 'metadata.json');
const MCP_CONFIG_PATH = path.join(HOME, '.gemini', 'config', 'mcp_config.json');
const MCP_CACHE_DIR = path.join(HOME, '.gemini', 'antigravity', 'mcp');

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const lines = match[1].split(/\r?\n/);

  let name = '';
  let desc = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nameMatch = line.match(/^name:\s*(.+)$/);
    if (nameMatch) {
      name = nameMatch[1].trim().replace(/^["']|["']$/g, '');
      continue;
    }

    const descStart = line.match(/^description:\s*(.*)$/);
    if (descStart) {
      const rest = descStart[1].trim();
      if (rest === '>-' || rest === '>' || rest === '|' || rest === '|-') {
        const blockLines = [];
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (/^[a-zA-Z0-9_-]+:\s*/.test(nextLine) && !/^\s/.test(nextLine)) {
            break;
          }
          blockLines.push(nextLine.trim());
          i = j;
        }
        desc = blockLines.filter(Boolean).join(' ').trim();
      } else if (rest === '') {
        const blockLines = [];
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (!/^\s+/.test(nextLine)) break;
          blockLines.push(nextLine.trim());
          i = j;
        }
        desc = blockLines.filter(Boolean).join(' ').trim();
      } else {
        desc = rest.replace(/^["']|["']$/g, '');
      }
    }
  }

  return { name, description: desc };
}

function isDirEntry(parentDir, entry) {
  if (entry.isDirectory()) return true;
  if (entry.isSymbolicLink()) {
    try {
      return fs.statSync(path.join(parentDir, entry.name)).isDirectory();
    } catch {
      return false;
    }
  }
  return false;
}

function scanSkillsDir(dir, source, pluginName) {
  const results = [];
  if (!dir || !fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!isDirEntry(dir, entry)) continue;
    const skillDir = path.join(dir, entry.name);
    const activeMd = path.join(skillDir, 'SKILL.md');
    const disabledMd = path.join(skillDir, 'SKILL.md.disabled');

    let targetFile = '';
    let disabled = false;
    if (fs.existsSync(activeMd)) {
      targetFile = activeMd;
    } else if (fs.existsSync(disabledMd)) {
      targetFile = disabledMd;
      disabled = true;
    } else {
      continue;
    }

    const content = fs.readFileSync(targetFile, 'utf8');
    const meta = parseFrontmatter(content);
    results.push({
      name: meta.name || entry.name,
      dirName: entry.name,
      description: meta.description || '',
      source,
      pluginName: pluginName || '',
      path: targetFile,
      skillDir,
      disabled,
      canToggle: source === 'custom',
    });
  }
  return results;
}

function createInitialMetadata() {
  const skills = {};
  for (const [name, info] of Object.entries(DEFAULT_SKILL_META)) {
    skills[name] = { category: info.category, customNote: '', acknowledged: true };
  }
  const mcps = {};
  for (const [name, info] of Object.entries(DEFAULT_MCP_META)) {
    mcps[name] = { category: info.category, customNote: '', acknowledged: true };
  }
  return {
    version: 3,
    categories: [...DEFAULT_CATEGORIES],
    skills,
    mcps,
    order: {
      skills: [],
      mcps: [],
      plugins: [],
    },
    settings: { ...DEFAULT_SETTINGS },
  };
}

function normalizeMetadata(raw) {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(raw.settings && typeof raw.settings === 'object' ? raw.settings : {}),
  };
  if (!Array.isArray(settings.extraSkillDirs)) settings.extraSkillDirs = [];

  const order = {
    skills: Array.isArray(raw.order?.skills) ? raw.order.skills : [],
    mcps: Array.isArray(raw.order?.mcps) ? raw.order.mcps : [],
    plugins: Array.isArray(raw.order?.plugins) ? raw.order.plugins : [],
  };

  return {
    version: 3,
    categories:
      Array.isArray(raw.categories) && raw.categories.length > 0
        ? raw.categories
        : [...DEFAULT_CATEGORIES],
    skills: raw.skills && typeof raw.skills === 'object' ? raw.skills : {},
    mcps: raw.mcps && typeof raw.mcps === 'object' ? raw.mcps : {},
    order,
    settings,
  };
}

function loadMetadata() {
  if (!fs.existsSync(META_PATH)) {
    const initial = createInitialMetadata();
    fs.writeFileSync(META_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
    return normalizeMetadata(raw);
  } catch {
    return createInitialMetadata();
  }
}

function saveMetadata(meta) {
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf8');
}

function inspectMcpCacheDir(cacheFolderName) {
  const dir = path.join(MCP_CACHE_DIR, cacheFolderName);
  if (!fs.existsSync(dir)) {
    return { toolCount: 0, sampleTools: [], toolDescriptions: [], instructionsSnippet: '' };
  }

  const toolNames = [];
  const toolDescriptions = [];
  let instructionsSnippet = '';

  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!f.isFile()) continue;
      if (f.name === 'instructions.md') {
        const raw = fs.readFileSync(path.join(dir, f.name), 'utf8');
        instructionsSnippet = raw.replace(/^#.*$/gm, '').replace(/\s+/g, ' ').trim().slice(0, 160);
      } else if (f.name.endsWith('.json')) {
        const tName = f.name.replace(/\.json$/, '');
        toolNames.push(tName);
        if (toolDescriptions.length < 3) {
          try {
            const parsed = JSON.parse(fs.readFileSync(path.join(dir, f.name), 'utf8'));
            if (parsed.description) {
              toolDescriptions.push(String(parsed.description).split(/[.。\n]/)[0].trim());
            }
          } catch {
            // ignore
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return {
    toolCount: toolNames.length,
    sampleTools: toolNames.slice(0, 6),
    toolDescriptions,
    instructionsSnippet,
  };
}

function scanRawMcpConfigs(includePlugin) {
  const mcps = [];
  const matchedCacheFolders = new Set();

  if (fs.existsSync(MCP_CONFIG_PATH)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf8'));
      const servers = cfg.mcpServers || {};
      for (const [name, info] of Object.entries(servers)) {
        const cacheInfo = inspectMcpCacheDir(name);
        if (cacheInfo.toolCount > 0 || fs.existsSync(path.join(MCP_CACHE_DIR, name))) {
          matchedCacheFolders.add(name);
        }
        mcps.push({
          id: `custom:${name}`,
          name,
          source: 'custom',
          pluginName: '',
          pluginDescription: '',
          command: info.command || '',
          args: Array.isArray(info.args) ? info.args : [],
          serverUrl: info.serverUrl || info.url || '',
          disabled: Boolean(info.disabled),
          canToggle: name !== 'skill-mcp-manager',
          ...cacheInfo,
        });
      }
    } catch {
      // ignore
    }
  }

  const pluginsDir = path.join(HOME, '.gemini', 'config', 'plugins');
  if (includePlugin && fs.existsSync(pluginsDir)) {
    for (const p of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
      if (!isDirEntry(pluginsDir, p)) continue;
      let pluginDescription = '';
      const pJsonPath = path.join(pluginsDir, p.name, 'plugin.json');
      if (fs.existsSync(pJsonPath)) {
        try {
          const pj = JSON.parse(fs.readFileSync(pJsonPath, 'utf8'));
          pluginDescription = pj.description || '';
        } catch {
          // ignore
        }
      }

      const candidateFiles = [
        path.join(pluginsDir, p.name, 'mcp_config.json'),
        path.join(pluginsDir, p.name, '.antigravity-plugin', 'mcp_config.json'),
      ];
      const seenServers = new Set();
      for (const f of candidateFiles) {
        if (!fs.existsSync(f)) continue;
        try {
          const cfg = JSON.parse(fs.readFileSync(f, 'utf8'));
          const servers = cfg.mcpServers || {};
          for (const [name, info] of Object.entries(servers)) {
            if (seenServers.has(name)) continue;
            seenServers.add(name);

            const namespaced = `${p.name}_${name}`;
            const cacheFolder = fs.existsSync(path.join(MCP_CACHE_DIR, namespaced)) ? namespaced : name;
            matchedCacheFolders.add(cacheFolder);
            const cacheInfo = inspectMcpCacheDir(cacheFolder);

            mcps.push({
              id: `plugin:${p.name}:${name}`,
              name,
              source: 'plugin',
              pluginName: p.name,
              pluginDescription,
              command: info.command || '',
              args: Array.isArray(info.args) ? info.args : [],
              serverUrl: info.serverUrl || info.url || '',
              disabled: Boolean(info.disabled),
              canToggle: false,
              ...cacheInfo,
            });
          }
        } catch {
          // ignore
        }
      }
    }
  }

  if (fs.existsSync(MCP_CACHE_DIR)) {
    for (const entry of fs.readdirSync(MCP_CACHE_DIR, { withFileTypes: true })) {
      if (!isDirEntry(MCP_CACHE_DIR, entry)) continue;
      if (matchedCacheFolders.has(entry.name)) continue;
      const cacheInfo = inspectMcpCacheDir(entry.name);
      mcps.push({
        id: `discovered:${entry.name}`,
        name: entry.name,
        source: 'discovered',
        pluginName: '',
        pluginDescription: '',
        command: '',
        args: [],
        serverUrl: '',
        disabled: false,
        canToggle: false,
        ...cacheInfo,
      });
    }
  }

  return mcps;
}

function sortByOrder(items, orderList, keyFn = (x) => x.name) {
  if (!Array.isArray(orderList) || orderList.length === 0) return items;
  const rank = new Map();
  orderList.forEach((id, idx) => rank.set(id, idx));
  return [...items].sort((a, b) => {
    const ra = rank.has(keyFn(a)) ? rank.get(keyFn(a)) : Number.MAX_SAFE_INTEGER;
    const rb = rank.has(keyFn(b)) ? rank.get(keyFn(b)) : Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return 0;
  });
}

function resolveUserPath(p) {
  const trimmed = String(p || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('~/') || trimmed.startsWith('~\\')) {
    return path.join(HOME, trimmed.slice(2));
  }
  return trimmed;
}

function scanCatalog() {
  const meta = loadMetadata();
  const { settings } = meta;
  let metaDirty = false;
  const newlyDetected = [];

  const rawSkills = [];
  rawSkills.push(...scanSkillsDir(path.join(HOME, '.gemini', 'config', 'skills'), 'custom', ''));
  rawSkills.push(...scanSkillsDir(path.join(HOME, '.gemini', 'antigravity', 'skills'), 'custom', ''));

  for (const extraDir of settings.extraSkillDirs || []) {
    const resolved = resolveUserPath(extraDir);
    if (resolved) {
      rawSkills.push(...scanSkillsDir(resolved, 'custom', ''));
    }
  }

  const pluginsDir = path.join(HOME, '.gemini', 'config', 'plugins');
  if (settings.showPlugin && fs.existsSync(pluginsDir)) {
    for (const p of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
      if (!isDirEntry(pluginsDir, p)) continue;
      const pSkills = path.join(pluginsDir, p.name, 'skills');
      rawSkills.push(...scanSkillsDir(pSkills, 'plugin', p.name));
    }
  }

  if (settings.showBuiltin) {
    rawSkills.push(
      ...scanSkillsDir(path.join(HOME, '.gemini', 'antigravity', 'builtin', 'skills'), 'builtin', '')
    );
  }

  const seenSkills = new Set();
  let skills = [];
  for (const s of rawSkills) {
    if (seenSkills.has(s.name)) continue;
    seenSkills.add(s.name);

    const def = DEFAULT_SKILL_META[s.name];
    const saved = meta.skills[s.name];
    const isNew = !saved;

    let category = saved?.category || def?.category || '';
    if (!category) {
      category = inferCategory(s.name, s.description, s.pluginName);
    }
    if (isNew) {
      meta.skills[s.name] = { category, customNote: '', acknowledged: false };
      metaDirty = true;
      newlyDetected.push({ kind: 'skill', name: s.name, category });
    } else if (saved.acknowledged === false) {
      newlyDetected.push({ kind: 'skill', name: s.name, category });
    }

    if (category !== '未分类' && !meta.categories.includes(category)) {
      meta.categories.push(category);
      metaDirty = true;
    }

    const defaultNoteZh = def?.defaultNote || s.description || '暂无默认说明';
    const defaultNoteEn = s.description || def?.defaultNote || 'No description available.';
    const defaultNote = settings.language === 'en' ? defaultNoteEn : defaultNoteZh;
    const customNote = (saved?.customNote || '').trim();

    skills.push({
      ...s,
      category,
      defaultNote,
      defaultNoteZh,
      defaultNoteEn,
      customNote,
      displayNote: customNote || defaultNote,
      hasCustomNote: Boolean(customNote),
      isNew: isNew || saved?.acknowledged === false,
    });
  }

  skills = sortByOrder(skills, meta.order.skills);

  const rawMcps = scanRawMcpConfigs(settings.showPlugin);
  let mcps = rawMcps.map((m) => {
    const def = DEFAULT_MCP_META[m.name] || DEFAULT_MCP_META[m.pluginName];
    const saved = meta.mcps[m.name];
    const isNew = !saved;

    const endpoint = m.serverUrl || [m.command, ...(m.args || [])].filter(Boolean).join(' ');
    const autoText = `${m.command} ${m.serverUrl} ${m.pluginDescription} ${(m.sampleTools || []).join(' ')} ${(m.toolDescriptions || []).join(' ')} ${m.instructionsSnippet || ''}`;

    let category = saved?.category || def?.category || '';
    if (!category) {
      category = inferCategory(m.name, autoText, m.pluginName);
    }
    if (isNew) {
      meta.mcps[m.name] = { category, customNote: '', acknowledged: false };
      metaDirty = true;
      newlyDetected.push({ kind: 'mcp', name: m.name, category });
    } else if (saved.acknowledged === false) {
      newlyDetected.push({ kind: 'mcp', name: m.name, category });
    }

    if (category !== '未分类' && !meta.categories.includes(category)) {
      meta.categories.push(category);
      metaDirty = true;
    }

    const defaultNoteZh =
      def?.defaultNote ||
      buildAutoMcpNote({
        name: m.name,
        pluginDescription: m.pluginDescription,
        toolNames: m.sampleTools,
        toolDescriptions: m.toolDescriptions,
        instructionsSnippet: m.instructionsSnippet,
        endpoint,
        lang: 'zh',
      });
    const defaultNoteEn =
      def?.defaultNoteEn ||
      buildAutoMcpNote({
        name: m.name,
        pluginDescription: m.pluginDescription,
        toolNames: m.sampleTools,
        toolDescriptions: m.toolDescriptions,
        instructionsSnippet: m.instructionsSnippet,
        endpoint,
        lang: 'en',
      });

    const defaultNote = settings.language === 'en' ? defaultNoteEn : defaultNoteZh;
    const customNote = (saved?.customNote || '').trim();

    return {
      ...m,
      category,
      defaultNote,
      defaultNoteZh,
      defaultNoteEn,
      customNote,
      displayNote: customNote || defaultNote,
      hasCustomNote: Boolean(customNote),
      isNew: isNew || saved?.acknowledged === false,
    };
  });

  mcps = sortByOrder(mcps, meta.order.mcps);

  if (metaDirty) {
    saveMetadata(meta);
  }

  return {
    skills,
    mcps,
    categories: meta.categories,
    order: meta.order,
    settings,
    newlyDetected,
    scannedAt: new Date().toISOString(),
  };
}

async function tryRefreshMcpServer(serverName) {
  const token = process.env.ANTIGRAVITY_CSRF_TOKEN;
  if (!token) return { refreshed: false, reason: 'no_csrf_token' };
  const addr = process.env.ANTIGRAVITY_LS_ADDRESS || 'localhost:5387';
  try {
    const res = await fetch(
      `http://${addr}/exa.language_server_pb.LanguageServerService/RefreshMcpServers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-codeium-csrf-token': token,
        },
        body: JSON.stringify({ serverName }),
      }
    );
    return { refreshed: res.ok };
  } catch {
    return { refreshed: false, reason: 'request_failed' };
  }
}

const server = new McpServer({
  name: 'skill-mcp-manager',
  version: '2.2.0',
});

server.registerResource(
  'manager-app',
  APP_URI,
  {
    mimeType: 'text/html;profile=mcp-app',
    _meta: { ui: { prefersBorder: false } },
  },
  async () => {
    const html = fs.readFileSync(path.join(__dirname, 'dist', 'app.html'), 'utf8');
    return {
      contents: [
        {
          uri: APP_URI,
          mimeType: 'text/html;profile=mcp-app',
          text: html,
        },
      ],
    };
  }
);

server.registerTool(
  'open_manager',
  {
    title: 'Skill & MCP 管理',
    description:
      '打开 Antigravity Skill & MCP 管理看板，支持中英双语、分类与 Skill 拖拽/上下排序、自定义备注与默认说明、自动识别新增 MCP、启停开关与个性化设置。',
    _meta: {
      ui: { resourceUri: APP_URI },
      'com.google.antigravity/ui': {
        entrypoints: [
          { type: 'aux_pane', title: 'Skill & MCP 管理' },
          { type: 'global', title: 'Skill & MCP 管理' },
        ],
      },
    },
  },
  async () => {
    const data = scanCatalog();
    return {
      content: [
        {
          type: 'text',
          text: `已加载 ${data.skills.length} 个 Skills 和 ${data.mcps.length} 个 MCP Servers（新识别 ${data.newlyDetected.length} 项），共 ${data.categories.length} 个群组。`,
        },
      ],
      structuredContent: data,
    };
  }
);

server.registerTool(
  'refresh_catalog',
  {
    description: '刷新并自动识别新增 Skill & MCP 目录（仅限 UI 内部调用）',
    _meta: { ui: { visibility: ['app'] } },
  },
  async () => {
    const data = scanCatalog();
    return {
      content: [{ type: 'text', text: `Refreshed (${data.newlyDetected.length} new)` }],
      structuredContent: data,
    };
  }
);

server.registerTool(
  'acknowledge_new',
  {
    description: '确认已阅新识别的 Skill/MCP（仅限 UI 内部调用）',
    _meta: { ui: { visibility: ['app'] } },
  },
  async () => {
    const meta = loadMetadata();
    for (const v of Object.values(meta.skills)) v.acknowledged = true;
    for (const v of Object.values(meta.mcps)) v.acknowledged = true;
    saveMetadata(meta);
    const data = scanCatalog();
    return {
      content: [{ type: 'text', text: 'Acknowledged' }],
      structuredContent: data,
    };
  }
);

server.registerTool(
  'toggle_item_enabled',
  {
    description: '启用或关闭自定义 Skill 或自定义 MCP Server（仅限 UI 内部调用）',
    inputSchema: {
      kind: z.enum(['skill', 'mcp']),
      name: z.string(),
      enabled: z.boolean(),
    },
    _meta: { ui: { visibility: ['app'] } },
  },
  async ({ kind, name, enabled }) => {
    let noteMsg = '';
    const meta = loadMetadata();
    const isEn = meta.settings.language === 'en';

    if (kind === 'mcp') {
      if (name === 'skill-mcp-manager' && !enabled) {
        const data = scanCatalog();
        return {
          content: [{ type: 'text', text: 'Cannot disable manager itself' }],
          structuredContent: {
            ...data,
            lastActionMessage: isEn ? 'Cannot disable the manager itself' : '不能关闭管理面板自身',
          },
        };
      }
      if (fs.existsSync(MCP_CONFIG_PATH)) {
        const cfg = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf8'));
        if (cfg.mcpServers && cfg.mcpServers[name]) {
          if (enabled) delete cfg.mcpServers[name].disabled;
          else cfg.mcpServers[name].disabled = true;
          fs.writeFileSync(MCP_CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
          const live = await tryRefreshMcpServer(name);
          if (isEn) {
            noteMsg = live.refreshed
              ? `${enabled ? 'Enabled' : 'Disabled'} ${name} (live reloaded)`
              : `${enabled ? 'Enabled' : 'Disabled'} ${name} (saved to mcp_config.json)`;
          } else {
            noteMsg = live.refreshed
              ? `已${enabled ? '启用' : '关闭'} ${name} 并热刷新生效`
              : `已${enabled ? '启用' : '关闭'} ${name}（已写入 mcp_config.json）`;
          }
        }
      }
    } else if (kind === 'skill') {
      const current = scanCatalog().skills.find((s) => s.name === name);
      if (current && current.canToggle) {
        const activeMd = path.join(current.skillDir, 'SKILL.md');
        const disabledMd = path.join(current.skillDir, 'SKILL.md.disabled');
        if (enabled && fs.existsSync(disabledMd) && !fs.existsSync(activeMd)) {
          fs.renameSync(disabledMd, activeMd);
          noteMsg = isEn ? `Enabled ${name} (effective next session)` : `已启用 ${name}（新会话生效）`;
        } else if (!enabled && fs.existsSync(activeMd)) {
          fs.renameSync(activeMd, disabledMd);
          noteMsg = isEn ? `Disabled ${name} (effective next session)` : `已关闭 ${name}（新会话生效）`;
        }
      } else {
        noteMsg = isEn
          ? 'Managed by plugin/builtin; toggle in Plugins settings'
          : '属于插件或内置，请在 Antigravity 插件页开关';
      }
    }

    const data = scanCatalog();
    return {
      content: [{ type: 'text', text: noteMsg || 'Done' }],
      structuredContent: { ...data, lastActionMessage: noteMsg || 'Done' },
    };
  }
);

server.registerTool(
  'update_item_meta',
  {
    description: '保存单个 Skill 或 MCP Server 的分类与自定义备注（仅限 UI 内部调用）',
    inputSchema: {
      kind: z.enum(['skill', 'mcp']),
      name: z.string(),
      category: z.string().optional(),
      customNote: z.string().optional(),
    },
    _meta: { ui: { visibility: ['app'] } },
  },
  async ({ kind, name, category, customNote }) => {
    const meta = loadMetadata();
    const bucket = kind === 'skill' ? meta.skills : meta.mcps;
    const prev = bucket[name] || { category: '未分类', customNote: '', acknowledged: true };

    const nextCategory = category !== undefined ? (category.trim() || '未分类') : prev.category;
    const nextNote = customNote !== undefined ? customNote.trim() : prev.customNote;

    if (nextCategory !== '未分类' && !meta.categories.includes(nextCategory)) {
      meta.categories.push(nextCategory);
    }

    bucket[name] = {
      category: nextCategory,
      customNote: nextNote,
      acknowledged: true,
    };
    saveMetadata(meta);

    const data = scanCatalog();
    return {
      content: [{ type: 'text', text: `Updated ${name}` }],
      structuredContent: data,
    };
  }
);

server.registerTool(
  'reorder_items',
  {
    description: '调整分类、Skill、MCP 或插件子群组的排列顺序，并可选修改条目所属分类（仅限 UI 内部调用）',
    inputSchema: {
      target: z.enum(['categories', 'skills', 'mcps', 'plugins']),
      orderedNames: z.array(z.string()),
      moveItemCategory: z
        .object({
          kind: z.enum(['skill', 'mcp']),
          name: z.string(),
          category: z.string(),
        })
        .optional(),
    },
    _meta: { ui: { visibility: ['app'] } },
  },
  async ({ target, orderedNames, moveItemCategory }) => {
    const meta = loadMetadata();

    if (moveItemCategory) {
      const bucket = moveItemCategory.kind === 'skill' ? meta.skills : meta.mcps;
      const prev = bucket[moveItemCategory.name] || { category: '未分类', customNote: '', acknowledged: true };
      const nextCat = moveItemCategory.category.trim() || '未分类';
      if (nextCat !== '未分类' && !meta.categories.includes(nextCat)) {
        meta.categories.push(nextCat);
      }
      bucket[moveItemCategory.name] = {
        ...prev,
        category: nextCat,
        acknowledged: true,
      };
    }

    if (target === 'categories') {
      const unique = [...new Set(orderedNames.filter((n) => n && n !== '未分类'))];
      // Preserve any existing category not in orderedNames at the end
      for (const existing of meta.categories) {
        if (!unique.includes(existing)) unique.push(existing);
      }
      meta.categories = unique;
    } else {
      const prevList = meta.order[target] || [];
      const unique = [...new Set(orderedNames.filter(Boolean))];
      for (const existing of prevList) {
        if (!unique.includes(existing)) unique.push(existing);
      }
      meta.order[target] = unique;
    }

    saveMetadata(meta);
    const data = scanCatalog();
    return {
      content: [{ type: 'text', text: `Reordered ${target}` }],
      structuredContent: data,
    };
  }
);

server.registerTool(
  'manage_categories',
  {
    description: '新增、重命名、移动或删除 Skill & MCP 分类群组（仅限 UI 内部调用）',
    inputSchema: {
      action: z.enum(['add', 'rename', 'delete', 'move']),
      name: z.string(),
      newName: z.string().optional(),
      direction: z.enum(['up', 'down']).optional(),
    },
    _meta: { ui: { visibility: ['app'] } },
  },
  async ({ action, name, newName, direction }) => {
    const meta = loadMetadata();
    const target = name.trim();
    if (!target || target === '未分类') {
      const data = scanCatalog();
      return {
        content: [{ type: 'text', text: 'Invalid category name' }],
        structuredContent: data,
      };
    }

    if (action === 'add') {
      if (!meta.categories.includes(target)) {
        meta.categories.push(target);
      }
    } else if (action === 'rename') {
      const next = (newName || '').trim();
      if (next && next !== '未分类') {
        meta.categories = [...new Set(meta.categories.map((c) => (c === target ? next : c)))];
        for (const v of Object.values(meta.skills)) {
          if (v.category === target) v.category = next;
        }
        for (const v of Object.values(meta.mcps)) {
          if (v.category === target) v.category = next;
        }
      }
    } else if (action === 'delete') {
      meta.categories = meta.categories.filter((c) => c !== target);
      for (const v of Object.values(meta.skills)) {
        if (v.category === target) v.category = '未分类';
      }
      for (const v of Object.values(meta.mcps)) {
        if (v.category === target) v.category = '未分类';
      }
    } else if (action === 'move') {
      const idx = meta.categories.indexOf(target);
      if (idx !== -1) {
        const swapWith = direction === 'up' ? idx - 1 : idx + 1;
        if (swapWith >= 0 && swapWith < meta.categories.length) {
          const copy = [...meta.categories];
          [copy[idx], copy[swapWith]] = [copy[swapWith], copy[idx]];
          meta.categories = copy;
        }
      }
    }

    saveMetadata(meta);
    const data = scanCatalog();
    return {
      content: [{ type: 'text', text: `Category ${action} done` }],
      structuredContent: data,
    };
  }
);

server.registerTool(
  'update_settings',
  {
    description: '更新管理面板个性化设置（语言、排版密度、群组间距、折叠偏好、扫描范围、提示词模板等，仅限 UI 内部调用）',
    inputSchema: {
      settings: z.record(z.string(), z.any()),
    },
    _meta: { ui: { visibility: ['app'] } },
  },
  async ({ settings }) => {
    const meta = loadMetadata();
    meta.settings = {
      ...DEFAULT_SETTINGS,
      ...meta.settings,
      ...settings,
    };
    if (!Array.isArray(meta.settings.extraSkillDirs)) {
      meta.settings.extraSkillDirs = [];
    }
    saveMetadata(meta);
    const data = scanCatalog();
    return {
      content: [{ type: 'text', text: 'Settings updated' }],
      structuredContent: data,
    };
  }
);

server.registerTool(
  'metadata_backup',
  {
    description: '导出、导入或重置 metadata.json 配置（仅限 UI 内部调用）',
    inputSchema: {
      action: z.enum(['export', 'import', 'reset']),
      payload: z.string().optional(),
    },
    _meta: { ui: { visibility: ['app'] } },
  },
  async ({ action, payload }) => {
    if (action === 'export') {
      const meta = loadMetadata();
      const data = scanCatalog();
      return {
        content: [{ type: 'text', text: 'Exported' }],
        structuredContent: { ...data, exportedJson: JSON.stringify(meta, null, 2) },
      };
    }
    if (action === 'import' && payload) {
      try {
        const parsed = JSON.parse(payload);
        const normalized = normalizeMetadata(parsed);
        saveMetadata(normalized);
        const data = scanCatalog();
        return {
          content: [{ type: 'text', text: 'Imported' }],
          structuredContent: { ...data, lastActionMessage: normalized.settings.language === 'en' ? 'Imported settings' : '已导入配置' },
        };
      } catch {
        const data = scanCatalog();
        return {
          content: [{ type: 'text', text: 'Invalid JSON' }],
          structuredContent: { ...data, lastActionMessage: 'JSON 格式无效' },
        };
      }
    }
    if (action === 'reset') {
      const initial = createInitialMetadata();
      saveMetadata(initial);
      const data = scanCatalog();
      return {
        content: [{ type: 'text', text: 'Reset' }],
        structuredContent: { ...data, lastActionMessage: '已重置为默认配置' },
      };
    }
    const data = scanCatalog();
    return { content: [{ type: 'text', text: 'No-op' }], structuredContent: data };
  }
);

server.registerTool(
  'batch_categorize',
  {
    title: '批量自动分类 Skill/MCP',
    description:
      '由 AI 批量为 Skills 或 MCP Servers 分配功能分类群组，并可选写入中文备注（不传 customNote 时保留已有自定义备注或默认备注）。',
    inputSchema: {
      items: z.array(
        z.object({
          kind: z.enum(['skill', 'mcp']),
          name: z.string(),
          category: z.string(),
          customNote: z.string().optional(),
        })
      ),
    },
  },
  async ({ items }) => {
    const meta = loadMetadata();
    for (const item of items) {
      const bucket = item.kind === 'skill' ? meta.skills : meta.mcps;
      const cat = item.category.trim() || '未分类';
      if (cat !== '未分类' && !meta.categories.includes(cat)) {
        meta.categories.push(cat);
      }
      const prev = bucket[item.name] || { category: '未分类', customNote: '', acknowledged: true };
      bucket[item.name] = {
        category: cat,
        customNote: item.customNote !== undefined ? item.customNote.trim() : prev.customNote,
        acknowledged: true,
      };
    }
    saveMetadata(meta);

    const data = scanCatalog();
    return {
      content: [
        {
          type: 'text',
          text: `已批量更新 ${items.length} 项的分类/备注，当前共 ${data.categories.length} 个群组。`,
        },
      ],
      structuredContent: data,
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
