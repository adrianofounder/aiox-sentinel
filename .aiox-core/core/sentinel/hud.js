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
    `Workflow: ${workflow?.name || workflow?.id || 'unknown'}`,
    `Expected: ${expectedAgent || 'unknown'} ${expectedCommand || ''}`.trim(),
    `Current: ${currentAgent || 'unknown'} ${currentCommand || ''}`.trim(),
    `Next: ${nextAgent || 'unknown'} ${nextCommand || ''}`.trim(),
    `Checklist: ${checklistStatus || 'unknown'}`,
    `Handoff: ${handoffStatus || 'unknown'}`,
    '',
    '## Steps',
  ];

  for (const step of workflow?.chain || []) {
    const marker = step.agent === expectedAgent && step.command === expectedCommand ? '[>]' : '[ ]';
    lines.push(`${marker} ${step.step}. ${step.agent} ${step.command} - ${step.task || step.output || ''}`.trim());
  }

  lines.push('');
  lines.push('## Blockers');
  if (blockers.length === 0) {
    lines.push('- none');
  } else {
    for (const blocker of blockers) {
      lines.push(`- ${blocker}`);
    }
  }

  return lines.join('\n');
}

module.exports = {
  generateWorkflowHud,
};
