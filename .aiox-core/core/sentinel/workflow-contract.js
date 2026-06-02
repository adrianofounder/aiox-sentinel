'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function loadWorkflowChains(projectRoot, chainsPath) {
  const filePath = chainsPath || path.join(projectRoot, '.aiox-core', 'data', 'workflow-chains.yaml');
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

function commandBase(command) {
  return String(command || '').trim().split(/\s+/)[0];
}

function resolveWorkflowStep(chains, criteria = {}) {
  const { workflowId, agent, command } = criteria;
  const workflows = Array.isArray(chains?.workflows) ? chains.workflows : [];
  const candidates = workflowId ? workflows.filter((workflow) => workflow.id === workflowId) : workflows;

  for (const workflow of candidates) {
    for (let index = 0; index < workflow.chain.length; index += 1) {
      const step = workflow.chain[index];
      if (agent && step.agent !== agent) continue;
      if (command && commandBase(step.command) !== commandBase(command)) continue;
      return {
        workflow,
        step,
        stepIndex: index,
        nextStep: workflow.chain[index + 1] || null,
      };
    }
  }

  return null;
}

function validateExpectedInvocation(options = {}) {
  const {
    expectedAgent,
    expectedCommand,
    actualAgent,
    actualCommand,
  } = options;
  const errors = [];

  if (!expectedAgent) errors.push('expected_agent is missing');
  if (!expectedCommand) errors.push('expected_command is missing');
  if (!actualAgent) errors.push('actual_agent is missing');
  if (!actualCommand) errors.push('actual_command is missing');

  if (expectedAgent && actualAgent && expectedAgent !== actualAgent) {
    errors.push(`agent mismatch: expected ${expectedAgent}, got ${actualAgent}`);
  }

  if (expectedCommand && actualCommand && commandBase(expectedCommand) !== commandBase(actualCommand)) {
    errors.push(`command mismatch: expected ${commandBase(expectedCommand)}, got ${commandBase(actualCommand)}`);
  }

  if (errors.length > 0) {
    return {
      decision: 'deny',
      reason: errors.join('; '),
      errors,
    };
  }

  return {
    decision: 'allow',
    reason: 'Workflow invocation matches expected agent and command',
    errors: [],
  };
}

function buildExpectedContractFromHandoff(handoff) {
  if (!handoff) {
    return null;
  }
  return {
    expected_agent: handoff.next_agent || handoff.to_agent || null,
    expected_command: handoff.next_command || null,
    previous_agent: handoff.from_agent || null,
    previous_command: handoff.last_command || null,
  };
}

module.exports = {
  buildExpectedContractFromHandoff,
  commandBase,
  loadWorkflowChains,
  resolveWorkflowStep,
  validateExpectedInvocation,
};
