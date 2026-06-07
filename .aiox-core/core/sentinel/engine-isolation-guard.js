'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_ENGINE_DIRS = Object.freeze({
  antigravity: '.antigravity',
  codex: '.codex',
  claude: '.claude',
  cursor: '.cursor',
  gemini: '.gemini',
});

const DEFAULT_BACKUP_ROOT = 'D:\\.aiox-sentinel-backups';
const DISABLED_MARKER_NAME = 'ENGINE_DISABLED.md';

function normalizePath(value) {
  return path.resolve(value).replace(/\\/g, '/');
}

function createRootHash(projectRoot) {
  return crypto
    .createHash('sha256')
    .update(normalizePath(projectRoot))
    .digest('hex')
    .slice(0, 16);
}

function createProjectId(projectRoot, remote = '') {
  const name = path.basename(path.resolve(projectRoot)) || 'project';
  const input = `${normalizePath(projectRoot)}|${remote}`;
  const hash = crypto.createHash('sha256').update(input).digest('hex').slice(0, 12);
  return `${name}-${hash}`.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
}

function getDisabledMarkerContent(activeEngine) {
  return [
    '1. Arquivos do motor inativo foram movidos para fora deste workspace.',
    `2. Motor ativo: ${activeEngine}`,
    '3. Consulte o manifesto de backup do projeto para restauracao.',
    '',
  ].join('\n');
}

function listEngineEntries(projectRoot, engineDirs = DEFAULT_ENGINE_DIRS) {
  return Object.entries(engineDirs).map(([engine, dir]) => {
    const absolutePath = path.join(projectRoot, dir);
    const exists = fs.existsSync(absolutePath);
    const isDirectory = exists && fs.statSync(absolutePath).isDirectory();
    return {
      engine,
      dir,
      absolutePath,
      exists,
      isDirectory,
      markerOnly: isDirectory ? isDisabledMarkerOnly(absolutePath) : false,
    };
  });
}

function isDisabledMarkerOnly(enginePath) {
  const entries = fs.readdirSync(enginePath).filter((entry) => entry !== '.gitkeep');
  return entries.length === 1 && entries[0] === DISABLED_MARKER_NAME;
}

function detectActiveEngines(projectRoot, engineDirs = DEFAULT_ENGINE_DIRS) {
  return listEngineEntries(projectRoot, engineDirs)
    .filter((entry) => entry.isDirectory && !entry.markerOnly)
    .map((entry) => entry.engine);
}

function validateEngineIsolation(options = {}) {
  const {
    projectRoot = process.cwd(),
    activeEngine = 'antigravity',
    engineDirs = DEFAULT_ENGINE_DIRS,
  } = options;
  const engines = listEngineEntries(projectRoot, engineDirs);
  const activeEngines = engines
    .filter((entry) => entry.isDirectory && !entry.markerOnly)
    .map((entry) => entry.engine);
  const inactiveActiveEngines = activeEngines.filter((engine) => engine !== activeEngine);

  if (!activeEngines.includes(activeEngine)) {
    return {
      decision: 'deny',
      reason: `1. Diretorio do motor ativo ausente: ${activeEngine}`,
      activeEngine,
      activeEngines,
      engines,
    };
  }

  if (inactiveActiveEngines.length > 0) {
    return {
      decision: 'deny',
      reason: `1. Multiplos diretorios de motor ativos detectados: ${activeEngines.join(', ')}`,
      activeEngine,
      activeEngines,
      inactiveActiveEngines,
      engines,
    };
  }

  return {
    decision: 'allow',
    reason: `1. Somente ${activeEngine} esta ativo`,
    activeEngine,
    activeEngines,
    engines,
  };
}

function buildIsolationManifest(options = {}) {
  const {
    projectRoot = process.cwd(),
    activeEngine = 'antigravity',
    backupRoot = DEFAULT_BACKUP_ROOT,
    remote = '',
    timestamp = new Date().toISOString(),
    engineDirs = DEFAULT_ENGINE_DIRS,
  } = options;
  const projectId = createProjectId(projectRoot, remote);
  const rootHash = createRootHash(projectRoot);
  const engines = listEngineEntries(projectRoot, engineDirs);
  const safeTimestamp = timestamp.replace(/[:.]/g, '-');
  const movedEngines = engines
    .filter((entry) => entry.isDirectory && entry.engine !== activeEngine && !entry.markerOnly)
    .map((entry) => ({
      engine: entry.engine,
      original_path: entry.absolutePath,
      backup_path: path.join(backupRoot, projectId, safeTimestamp, entry.engine),
      marker_path: path.join(entry.absolutePath, DISABLED_MARKER_NAME),
    }));

  return {
    version: '1.0.0',
    project_id: projectId,
    project_name: path.basename(path.resolve(projectRoot)),
    project_root: path.resolve(projectRoot),
    project_root_hash: rootHash,
    remote,
    active_engine: activeEngine,
    generated_at: timestamp,
    backup_root: backupRoot,
    moved_engines: movedEngines,
  };
}

function planEngineIsolation(options = {}) {
  const manifest = buildIsolationManifest(options);
  const actions = manifest.moved_engines.flatMap((entry) => [
    {
      type: 'ensure_dir',
      path: path.dirname(entry.backup_path),
    },
    {
      type: 'move_engine',
      engine: entry.engine,
      from: entry.original_path,
      to: entry.backup_path,
    },
    {
      type: 'write_marker',
      engine: entry.engine,
      path: entry.marker_path,
      content: getDisabledMarkerContent(manifest.active_engine),
    },
  ]);

  return {
    dry_run: true,
    manifest,
    actions,
    summary: {
      active_engine: manifest.active_engine,
      engines_to_move: manifest.moved_engines.map((entry) => entry.engine),
      action_count: actions.length,
    },
  };
}

function applyEngineIsolation(options = {}) {
  const { confirmProjectId, manifestPath } = options;
  const plan = planEngineIsolation(options);
  const manifest = plan.manifest;

  if (confirmProjectId !== manifest.project_id) {
    throw new Error(
      `1. Isolamento de motores exige confirmacao explicita para project_id: ${manifest.project_id}`,
    );
  }

  for (const entry of manifest.moved_engines) {
    if (!fs.existsSync(entry.original_path)) {
      throw new Error(`1. Caminho do motor nao encontrado: ${entry.original_path}`);
    }
    if (fs.existsSync(entry.backup_path)) {
      throw new Error(`1. Caminho de backup ja existe: ${entry.backup_path}`);
    }
  }

  for (const entry of manifest.moved_engines) {
    fs.mkdirSync(path.dirname(entry.backup_path), { recursive: true });
    fs.renameSync(entry.original_path, entry.backup_path);
    fs.mkdirSync(entry.original_path, { recursive: true });
    fs.writeFileSync(
      path.join(entry.original_path, DISABLED_MARKER_NAME),
      getDisabledMarkerContent(manifest.active_engine),
      'utf8',
    );
  }

  const resolvedManifestPath = manifestPath
    || path.join(manifest.backup_root, manifest.project_id, 'latest-manifest.json');
  fs.mkdirSync(path.dirname(resolvedManifestPath), { recursive: true });
  fs.writeFileSync(resolvedManifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  return {
    dry_run: false,
    manifest,
    manifest_path: resolvedManifestPath,
    actions: plan.actions,
    summary: plan.summary,
  };
}

module.exports = {
  DEFAULT_ENGINE_DIRS,
  DEFAULT_BACKUP_ROOT,
  DISABLED_MARKER_NAME,
  applyEngineIsolation,
  buildIsolationManifest,
  createProjectId,
  createRootHash,
  detectActiveEngines,
  getDisabledMarkerContent,
  listEngineEntries,
  planEngineIsolation,
  validateEngineIsolation,
};
