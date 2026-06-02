#!/usr/bin/env node
'use strict';

const path = require('path');
const {
  DEFAULT_BACKUP_ROOT,
  applyEngineIsolation,
  planEngineIsolation,
} = require('../../core/sentinel/engine-isolation-guard');

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    projectRoot: process.cwd(),
    activeEngine: 'antigravity',
    backupRoot: DEFAULT_BACKUP_ROOT,
    remote: '',
    apply: false,
    confirmProjectId: null,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--project-root') options.projectRoot = path.resolve(argv[++i]);
    else if (arg === '--active-engine') options.activeEngine = argv[++i];
    else if (arg === '--backup-root') options.backupRoot = path.resolve(argv[++i]);
    else if (arg === '--remote') options.remote = argv[++i];
    else if (arg === '--apply') options.apply = true;
    else if (arg === '--confirm') options.confirmProjectId = argv[++i];
    else if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
  }

  return options;
}

function formatText(result) {
  const lines = [
    `Mode: ${result.dry_run ? 'dry-run' : 'apply'}`,
    `Project: ${result.manifest.project_name}`,
    `Project ID: ${result.manifest.project_id}`,
    `Active engine: ${result.manifest.active_engine}`,
    `Backup root: ${result.manifest.backup_root}`,
    `Engines to move: ${result.summary.engines_to_move.join(', ') || 'none'}`,
    '',
    'Actions:',
  ];

  for (const action of result.actions) {
    if (action.type === 'move_engine') {
      lines.push(`1. move ${action.engine}: ${action.from} -> ${action.to}`);
    } else if (action.type === 'write_marker') {
      lines.push(`2. marker ${action.engine}: ${action.path}`);
    } else {
      lines.push(`3. ${action.type}: ${action.path}`);
    }
  }

  if (result.dry_run) {
    lines.push('');
    lines.push('No files were changed.');
    lines.push(`To apply, rerun with: --apply --confirm ${result.manifest.project_id}`);
  } else {
    lines.push('');
    lines.push(`Manifest written: ${result.manifest_path}`);
  }

  return lines.join('\n');
}

function printHelp() {
  console.log([
    'AIOX Sentinel engine isolation',
    '',
    'Dry-run:',
    '  node .aiox-core/infrastructure/scripts/antigravity-sentinel-isolate.js --project-root D:\\project',
    '',
    'Apply requires explicit project id confirmation:',
    '  node .aiox-core/infrastructure/scripts/antigravity-sentinel-isolate.js --project-root D:\\project --apply --confirm <project-id>',
    '',
    'Options:',
    '  --project-root <path>      Project root. Defaults to cwd.',
    '  --active-engine <engine>   Active engine. Defaults to antigravity.',
    '  --backup-root <path>       Backup root. Defaults to D:\\.aiox-sentinel-backups.',
    '  --remote <url>             Remote URL used in project id.',
    '  --apply                    Execute backup and move. Omit for dry-run.',
    '  --confirm <project-id>     Required with --apply.',
    '  --json                     Print JSON.',
  ].join('\n'));
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    printHelp();
    return;
  }

  const result = options.apply
    ? applyEngineIsolation(options)
    : planEngineIsolation(options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatText(result));
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`AIOX Sentinel isolation failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  formatText,
  main,
  parseArgs,
};
