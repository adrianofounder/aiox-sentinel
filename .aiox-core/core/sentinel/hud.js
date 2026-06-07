'use strict';

function generateWorkflowHud(options = {}) {
  const {
    workflow,
    currentAgent,
    currentCommand,
    expectedAgent,
    expectedCommand,
    nextAgent,
    nextCommand,
    checklistStatus,
    handoffStatus,
    blockers = [],
  } = options;

  const lines = [
    '# AIOX Sentinel HUD',
    '',
    `1. Workflow: ${workflow?.name || workflow?.id || 'desconhecido'}`,
    `2. Esperado: ${expectedAgent || 'desconhecido'} ${expectedCommand || ''}`.trim(),
    `3. Atual: ${currentAgent || 'desconhecido'} ${currentCommand || ''}`.trim(),
    `4. Proximo: ${nextAgent || 'desconhecido'} ${nextCommand || ''}`.trim(),
    `5. Checklist: ${checklistStatus || 'desconhecido'}`,
    `6. Handoff: ${handoffStatus || 'desconhecido'}`,
    '',
    '## Passos',
  ];

  for (const step of workflow?.chain || []) {
    const marker = step.agent === expectedAgent && step.command === expectedCommand ? '[>]' : '[ ]';
    lines.push(`${marker} ${step.step}. ${step.agent} ${step.command} - ${step.task || step.output || ''}`.trim());
  }

  lines.push('');
  lines.push('## Bloqueios');
  if (blockers.length === 0) {
    lines.push('1. Nenhum');
  } else {
    for (let index = 0; index < blockers.length; index += 1) {
      lines.push(`${index + 1}. ${blockers[index]}`);
    }
  }

  return lines.join('\n');
}

module.exports = {
  generateWorkflowHud,
};
