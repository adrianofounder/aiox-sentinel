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
    `1. Modo: ${result.dry_run ? 'dry-run' : 'aplicar'}`,
    `2. Projeto: ${result.manifest.project_name}`,
    `3. Project ID: ${result.manifest.project_id}`,
    `4. Motor ativo: ${result.manifest.active_engine}`,
    `5. Raiz do backup: ${result.manifest.backup_root}`,
    `6. Motores a mover: ${result.summary.engines_to_move.join(', ') || 'nenhum'}`,
    '',
    '7. Acoes:',
  ];

  for (let index = 0; index < result.actions.length; index += 1) {
    const action = result.actions[index];
    if (action.type === 'move_engine') {
      lines.push(`${index + 1}. mover ${action.engine}: ${action.from} -> ${action.to}`);
    } else if (action.type === 'write_marker') {
      lines.push(`${index + 1}. marcador ${action.engine}: ${action.path}`);
    } else {
      lines.push(`${index + 1}. ${action.type}: ${action.path}`);
    }
  }

  if (result.dry_run) {
    lines.push('');
    lines.push('1. Nenhum arquivo foi alterado.');
    lines.push(`2. Para aplicar, execute novamente com: --apply --confirm ${result.manifest.project_id}`);
  } else {
    lines.push('');
    lines.push(`1. Manifesto gravado: ${result.manifest_path}`);
  }

  return lines.join('\n');
}

function printHelp() {
  console.log([
    'AIOX Sentinel isolamento de motores',
    '',
    '1. Dry-run:',
    '  node .aiox-core/infrastructure/scripts/antigravity-sentinel-isolate.js --project-root D:\\project',
    '',
    '2. Aplicar exige confirmacao explicita do project id:',
    '  node .aiox-core/infrastructure/scripts/antigravity-sentinel-isolate.js --project-root D:\\project --apply --confirm <project-id>',
    '',
    '3. Opcoes:',
    '  --project-root <path>      Raiz do projeto. Padrao: cwd.',
    '  --active-engine <engine>   Motor ativo. Padrao: antigravity.',
    '  --backup-root <path>       Raiz do backup. Padrao: D:\\.aiox-sentinel-backups.',
    '  --remote <url>             URL remota usada no project id.',
    '  --apply                    Executa backup e movimento. Omitir para dry-run.',
    '  --confirm <project-id>     Obrigatorio com --apply.',
    '  --json                     Imprime JSON.',
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
    console.error(`1. Isolamento AIOX Sentinel falhou: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  formatText,
  main,
  parseArgs,
};
