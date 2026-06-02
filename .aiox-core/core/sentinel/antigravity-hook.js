'use strict';

const fs = require('fs');
const path = require('path');

const { validateEngineIsolation } = require('./engine-isolation-guard');
const { validateExpectedInvocation } = require('./workflow-contract');

const STATE_FILE = path.join('.aiox', 'sentinel', 'state.json');

function loadSentinelState(projectRoot) {
  const statePath = path.join(projectRoot, STATE_FILE);
  if (!fs.existsSync(statePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function evaluatePreToolUse(input = {}, options = {}) {
  const projectRoot = options.projectRoot
    || input.workspacePaths?.[0]
    || process.cwd();
  const state = options.state || loadSentinelState(projectRoot);
  const activeEngine = options.activeEngine || state?.active_engine || 'antigravity';
  const isolation = validateEngineIsolation({ projectRoot, activeEngine });

  if (isolation.decision !== 'allow') {
    return {
      decision: 'deny',
      reason: isolation.reason,
    };
  }

  if (!state?.workflow_contract) {
    return {
      decision: 'ask',
      reason: 'AIOX Sentinel state is missing workflow_contract',
    };
  }

  const toolName = input.toolCall?.name || '';
  const commandLine = input.toolCall?.args?.CommandLine || input.toolCall?.args?.command || '';
  const actualCommand = toolName === 'run_command'
    ? extractAioxCommand(commandLine)
    : state.workflow_contract.current_command || state.workflow_contract.expected_command;
  const contract = validateExpectedInvocation({
    expectedAgent: state.workflow_contract.expected_agent,
    expectedCommand: state.workflow_contract.expected_command,
    actualAgent: state.workflow_contract.current_agent,
    actualCommand,
  });

  if (contract.decision !== 'allow') {
    return {
      decision: 'deny',
      reason: contract.reason,
    };
  }

  return {
    decision: 'allow',
    reason: 'AIOX Sentinel pre-tool gate passed',
  };
}

function extractAioxCommand(commandLine) {
  const match = String(commandLine).match(/(?:^|\s)(\*[a-z0-9-]+)/i);
  return match ? match[1] : commandLine;
}

module.exports = {
  STATE_FILE,
  evaluatePreToolUse,
  extractAioxCommand,
  loadSentinelState,
};
