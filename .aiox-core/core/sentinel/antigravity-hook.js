'use strict';

const fs = require('fs');
const path = require('path');

const { validateEngineIsolation } = require('./engine-isolation-guard');
const { validateChecklistEvidence } = require('./checklist-evidence-gate');
const { validateHandoffGate } = require('./handoff-gate');
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
  const context = buildHookContext(input, options);
  const isolation = evaluateIsolation(context);
  if (isolation) return isolation;

  const contract = evaluateWorkflowContract(context, resolveActualCommandFromToolUse(input, context.state));
  if (contract) return contract;

  return {
    decision: 'allow',
    reason: '1. Gate PreToolUse do AIOX Sentinel aprovado',
  };
}

function evaluatePreInvocation(input = {}, options = {}) {
  const context = buildHookContext(input, options);
  const isolation = evaluateIsolation(context);
  if (isolation) return isolation;

  const contract = evaluateWorkflowContract(context, resolveActualCommandFromInvocation(input, context.state));
  if (contract) return contract;

  return {
    decision: 'allow',
    reason: '1. Gate PreInvocation do AIOX Sentinel aprovado',
  };
}

function evaluatePostInvocation(input = {}, options = {}) {
  return evaluateCompletionGate(input, options, 'post-invocation');
}

function evaluateStop(input = {}, options = {}) {
  return evaluateCompletionGate(input, options, 'stop');
}

function evaluateAntiGravityHook(input = {}, options = {}) {
  const event = normalizeEvent(options.event || input.event || input.hook_event || input.hookEvent);
  if (event === 'PreInvocation') return evaluatePreInvocation(input, options);
  if (event === 'PostInvocation') return evaluatePostInvocation(input, options);
  if (event === 'Stop') return evaluateStop(input, options);
  return evaluatePreToolUse(input, options);
}

function evaluateCompletionGate(input = {}, options = {}, label = 'completion') {
  const context = buildHookContext(input, options);
  const isolation = evaluateIsolation(context);
  if (isolation) return isolation;

  const contract = evaluateWorkflowContract(context, resolveActualCommandFromInvocation(input, context.state));
  if (contract) return contract;

  const handoff = validateHandoffGate(resolveHandoffOptions(context));
  if (handoff.decision !== 'allow') {
    return deny(`1. Gate ${label} do AIOX Sentinel bloqueado. ${handoff.reason}`);
  }

  const checklist = validateChecklistEvidence(resolveChecklistOptions(context));
  if (checklist.decision !== 'allow') {
    return deny(`1. Gate ${label} do AIOX Sentinel bloqueado. ${checklist.reason}`);
  }

  return {
    decision: 'allow',
    reason: `1. Gate ${label} do AIOX Sentinel aprovado`,
  };
}

function extractAioxCommand(commandLine) {
  const match = String(commandLine).match(/(?:^|\s)(\*[a-z0-9-]+)/i);
  return match ? match[1] : commandLine;
}

function buildHookContext(input = {}, options = {}) {
  const projectRoot = options.projectRoot
    || input.projectRoot
    || input.cwd
    || input.workspacePaths?.[0]
    || process.cwd();
  const state = options.state || input.state || loadSentinelState(projectRoot);
  const activeEngine = options.activeEngine || state?.active_engine || 'antigravity';
  return {
    input,
    options,
    projectRoot,
    state,
    activeEngine,
  };
}

function evaluateIsolation(context) {
  const isolation = validateEngineIsolation({
    projectRoot: context.projectRoot,
    activeEngine: context.activeEngine,
  });

  if (isolation.decision !== 'allow') {
    return deny(isolation.reason);
  }

  return null;
}

function evaluateWorkflowContract(context, actualCommand) {
  const workflowContract = context.state?.workflow_contract;
  if (!workflowContract) {
    return deny('1. Estado do AIOX Sentinel sem workflow_contract');
  }

  const contract = validateExpectedInvocation({
    expectedAgent: workflowContract.expected_agent,
    expectedCommand: workflowContract.expected_command,
    actualAgent: workflowContract.current_agent,
    actualCommand,
  });

  if (contract.decision !== 'allow') {
    return deny(contract.reason);
  }

  return null;
}

function resolveActualCommandFromToolUse(input = {}, state = {}) {
  const toolName = input.toolCall?.name || input.tool_name || '';
  const args = input.toolCall?.args || input.args || {};
  const commandLine = args.CommandLine || args.command || input.command || '';
  return toolName === 'run_command'
    ? extractAioxCommand(commandLine)
    : state.workflow_contract?.current_command || state.workflow_contract?.expected_command;
}

function resolveActualCommandFromInvocation(input = {}, state = {}) {
  return input.command
    || input.invocation?.command
    || input.toolCall?.args?.command
    || state.workflow_contract?.current_command
    || state.workflow_contract?.expected_command;
}

function resolveHandoffOptions(context) {
  const handoffPath = context.options.handoffPath
    || context.input.handoffPath
    || context.state?.workflow_contract?.handoff_path;
  return {
    handoff: context.options.handoff || context.input.handoff || context.state?.handoff,
    filePath: handoffPath,
  };
}

function resolveChecklistOptions(context) {
  const checklistPath = context.options.checklistPath
    || context.input.checklistPath
    || context.state?.checklist_path
    || context.state?.workflow_contract?.checklist_path;
  return {
    content: context.options.checklistContent || context.input.checklistContent,
    filePath: checklistPath,
  };
}

function normalizeEvent(event) {
  if (!event) return 'PreToolUse';
  return String(event).trim();
}

function deny(reason) {
  return {
    decision: 'deny',
    reason,
  };
}

module.exports = {
  STATE_FILE,
  evaluateAntiGravityHook,
  evaluatePostInvocation,
  evaluatePreInvocation,
  evaluatePreToolUse,
  evaluateStop,
  extractAioxCommand,
  loadSentinelState,
};
